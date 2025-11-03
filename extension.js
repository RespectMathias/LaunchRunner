const vscode = require('vscode');

let lastSelectedConfig = null;
let lastSelectedType = 'launch'; // 'launch' or 'task'
let currentSession = null; // Track active debug/task session
let isRunning = false; // Track if something is currently running

/**
 * Update context for conditional UI visibility
 */
function updateContext() {
    const isTaskSelected = lastSelectedType === 'task';
    const hasConfig = lastSelectedConfig !== null;

    vscode.commands.executeCommand('setContext', 'launch-runner.isTaskSelected', isTaskSelected);
    vscode.commands.executeCommand('setContext', 'launch-runner.hasConfiguration', hasConfig);
    vscode.commands.executeCommand('setContext', 'launch-runner.isRunning', isRunning);
}

/**
 * Update button tooltips with current configuration name
 */
function updateCommandTitles() {
    if (lastSelectedConfig) {
        const configName = lastSelectedConfig.name;
        vscode.commands.executeCommand('setContext', 'launch-runner.configName', configName);
    }
}

/**
 * Get all debug configurations from launch.json
 * @returns {Array} Array of debug configurations
 */
function getDebugConfigurations() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
    }

    const config = vscode.workspace.getConfiguration('launch', workspaceFolders[0].uri);
    const configurations = config.get('configurations') || [];
    // Don't overwrite 'type' - add a separate property to identify it's a launch config
    return configurations.map(c => ({ ...c, configType: 'launch', displayType: 'Launch' }));
}

/**
 * Get all tasks from tasks.json
 * @returns {Array} Array of tasks
 */
async function getTasks() {
    const tasks = await vscode.tasks.fetchTasks();
    return tasks.map(t => ({
        name: t.name,
        configType: 'task',
        displayType: 'Task',
        task: t
    }));
}

/**
 * Get all available configurations (launch configs + tasks)
 * @returns {Promise<Array>} Combined array of configurations and tasks
 */
async function getAllConfigurations() {
    const launches = getDebugConfigurations();
    const tasks = await getTasks();
    return [...launches, ...tasks];
}

/**
 * Show quick pick menu to select a configuration (JetBrains style)
 * @returns {Promise<Object|undefined>} Selected configuration or undefined
 */
async function selectConfiguration() {
    const configurations = await getAllConfigurations();

    if (configurations.length === 0) {
        // Prompt user to create launch.json or tasks.json
        const action = await vscode.window.showInformationMessage(
            'No configurations or tasks found.',
            'Create launch.json',
            'Create tasks.json',
            'Cancel'
        );

        if (action === 'Create launch.json') {
            await vscode.commands.executeCommand('workbench.action.debug.configure');
        } else if (action === 'Create tasks.json') {
            await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
        }
        return undefined;
    }

    // Create quick pick items with separators
    const items = [];

    // Add "Edit Configurations..." option at the top (JetBrains style)
    items.push({
        label: '$(edit) Edit Configurations...',
        description: '',
        isEdit: true
    });

    items.push({
        label: '',
        kind: vscode.QuickPickItemKind.Separator
    });

    // Group by type
    const launches = configurations.filter(c => c.configType === 'launch');
    const tasks = configurations.filter(c => c.configType === 'task');

    if (launches.length > 0) {
        items.push({
            label: 'Launch Configurations',
            kind: vscode.QuickPickItemKind.Separator
        });
        launches.forEach(config => {
            items.push({
                label: config.name,
                description: config.request || '',
                detail: `$(rocket) Launch configuration`,
                config: config
            });
        });
    }

    if (tasks.length > 0) {
        items.push({
            label: 'Tasks',
            kind: vscode.QuickPickItemKind.Separator
        });
        tasks.forEach(task => {
            items.push({
                label: task.name,
                description: '',
                detail: `$(tools) Task`,
                config: task
            });
        });
    }

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: lastSelectedConfig
            ? `Current: ${lastSelectedConfig.name}`
            : 'Select a configuration to run'
    });

    if (!selected) {
        return undefined;
    }

    // Handle "Edit Configurations" option
    if (selected.isEdit) {
        const choice = await vscode.window.showQuickPick([
            { label: 'Edit launch.json', value: 'launch' },
            { label: 'Edit tasks.json', value: 'tasks' }
        ]);

        if (choice?.value === 'launch') {
            await vscode.commands.executeCommand('workbench.action.debug.configure');
        } else if (choice?.value === 'tasks') {
            await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
        }
        return undefined;
    }

    if (selected.config) {
        lastSelectedConfig = selected.config;
        lastSelectedType = selected.config.configType;
        updateContext();
        updateCommandTitles();
    }

    return selected.config;
}

/**
 * Run the selected configuration (JetBrains style - Run button)
 */
async function runConfiguration() {
    await executeConfiguration(true); // noDebug = true
}

/**
 * Debug the selected configuration (JetBrains style - Debug button)
 */
async function debugConfiguration() {
    await executeConfiguration(false); // noDebug = false
}

/**
 * Stop the currently running session
 */
async function stopConfiguration() {
    if (lastSelectedType === 'task') {
        // Terminate task
        if (currentSession) {
            currentSession.terminate();
            currentSession = null;
            isRunning = false;
            updateContext();
        }
    } else {
        // For debug sessions, use VS Code's built-in stop command
        await vscode.commands.executeCommand('workbench.action.debug.stop');
    }
}

/**
 * Restart the currently running session
 */
async function restartConfiguration() {
    if (lastSelectedType === 'task') {
        // For tasks, we need to stop and start manually
        await stopConfiguration();
        await new Promise(resolve => setTimeout(resolve, 300));
        await executeConfiguration(true);
    } else {
        // For debug sessions, use VS Code's built-in restart command
        await vscode.commands.executeCommand('workbench.action.debug.restart');
    }
}

/**
 * Execute the currently selected configuration
 * @param {boolean} noDebug - Whether to run without debugging
 */
async function executeConfiguration(noDebug = false) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    let configuration = lastSelectedConfig;

    // If no config selected, prompt user to select one
    if (!configuration) {
        const configs = await getAllConfigurations();
        if (configs.length === 1) {
            configuration = configs[0];
            lastSelectedConfig = configuration;
            lastSelectedType = configuration.configType;
            updateContext();
            updateCommandTitles();
        } else if (configs.length > 1) {
            configuration = await selectConfiguration();
        } else {
            const action = await vscode.window.showInformationMessage(
                'No configurations or tasks found.',
                'Create launch.json',
                'Create tasks.json',
                'Cancel'
            );

            if (action === 'Create launch.json') {
                await vscode.commands.executeCommand('workbench.action.debug.configure');
            } else if (action === 'Create tasks.json') {
                await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
            }
            return;
        }
    }

    if (!configuration) {
        return; // User cancelled
    }

    // Verify the configuration still exists
    const allConfigs = await getAllConfigurations();
    const stillExists = allConfigs.find(c => c.name === configuration.name && c.configType === configuration.configType);

    if (!stillExists) {
        vscode.window.showWarningMessage(`Configuration "${configuration.name}" no longer exists. Please select a new one.`);
        configuration = await selectConfiguration();
        if (!configuration) {
            return;
        }
    }

    // Execute based on type
    if (configuration.configType === 'task') {
        // Run task
        const execution = await vscode.tasks.executeTask(configuration.task);
        currentSession = execution;
        isRunning = true;
        updateContext();
    } else {
        // Run launch configuration by name - VS Code will handle all the details
        isRunning = true;
        updateContext();

        const success = await vscode.debug.startDebugging(
            workspaceFolders[0],
            configuration.name,
            { noDebug: noDebug }
        );

        if (!success) {
            vscode.window.showErrorMessage(`Failed to start ${noDebug ? 'running' : 'debugging'}: ${configuration.name}`);
            isRunning = false;
            currentSession = null;
            updateContext();
        }
    }
}

/**
 * Initialize default configuration on activation
 */
async function initializeDefaultConfiguration() {
    // Try to select first launch configuration by default
    const launchConfigs = getDebugConfigurations();

    if (launchConfigs.length > 0) {
        lastSelectedConfig = launchConfigs[0];
        lastSelectedType = 'launch';
        updateContext();
        updateCommandTitles();
    } else {
        // No launch configs, just update context to show nothing selected
        updateContext();
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Don't activate in Extension Development Host to avoid duplicate buttons
    if (process.env.VSCODE_EXTHOST_WILL_SEND_SOCKET) {
        console.log('Launch Runner: Skipping activation in Extension Development Host');
        return;
    }

    console.log('Launch Runner extension is now active');

    // Initialize with first launch config if available
    initializeDefaultConfiguration();

    // Track debug session changes
    context.subscriptions.push(
        vscode.debug.onDidStartDebugSession((session) => {
            currentSession = session;
            isRunning = true;
            updateContext();
        })
    );

    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession((session) => {
            if (currentSession === session) {
                currentSession = null;
                isRunning = false;
                updateContext();
            }
        })
    );

    // Track task execution changes
    context.subscriptions.push(
        vscode.tasks.onDidEndTask((e) => {
            if (currentSession === e.execution) {
                currentSession = null;
                isRunning = false;
                updateContext();
            }
        })
    );

    // Register the Select Configuration command (gear icon - JetBrains style dropdown)
    let selectConfigDisposable = vscode.commands.registerCommand('launch-runner.selectConfiguration', async () => {
        await selectConfiguration();
    });

    // Register the Run command (play button)
    let runDisposable = vscode.commands.registerCommand('launch-runner.run', async () => {
        await runConfiguration();
    });

    // Register the Debug command (debug button)
    let debugDisposable = vscode.commands.registerCommand('launch-runner.debug', async () => {
        await debugConfiguration();
    });

    // Register the Stop command
    let stopDisposable = vscode.commands.registerCommand('launch-runner.stop', async () => {
        await stopConfiguration();
    });

    // Register the Restart command
    let restartDisposable = vscode.commands.registerCommand('launch-runner.restart', async () => {
        await restartConfiguration();
    });

    context.subscriptions.push(selectConfigDisposable);
    context.subscriptions.push(runDisposable);
    context.subscriptions.push(debugDisposable);
    context.subscriptions.push(stopDisposable);
    context.subscriptions.push(restartDisposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
