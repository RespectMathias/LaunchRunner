const vscode = require('vscode');

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
    return configurations;
}

/**
 * Show quick pick menu to select a debug configuration
 * @returns {Promise<Object|undefined>} Selected configuration or undefined
 */
async function selectDebugConfiguration() {
    const configurations = getDebugConfigurations();

    if (configurations.length === 0) {
        // Prompt user to create launch.json
        const action = await vscode.window.showInformationMessage(
            'No debug configurations found. Would you like to create a launch.json file?',
            'Create launch.json',
            'Cancel'
        );

        if (action === 'Create launch.json') {
            // Open the command palette with the create launch.json command
            await vscode.commands.executeCommand('workbench.action.debug.configure');
        }
        return undefined;
    }

    // If only one configuration, use it directly
    if (configurations.length === 1) {
        return configurations[0];
    }

    // Show quick pick for multiple configurations
    const items = configurations.map(config => ({
        label: config.name,
        description: config.type,
        detail: config.request,
        config: config
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a debug configuration'
    });

    return selected ? selected.config : undefined;
}

/**
 * Start debugging with the selected configuration
 * @param {boolean} noDebug - Whether to run without debugging
 */
async function startDebugging(noDebug = false) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const configuration = await selectDebugConfiguration();
    if (!configuration) {
        return; // User cancelled or no configuration available
    }

    // Start the debug session
    const success = await vscode.debug.startDebugging(
        workspaceFolders[0],
        configuration,
        { noDebug: noDebug }
    );

    if (!success) {
        vscode.window.showErrorMessage(`Failed to start ${noDebug ? 'running' : 'debugging'}: ${configuration.name}`);
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Launch Runner extension is now active');

    // Register the Run command
    let runDisposable = vscode.commands.registerCommand('launch-runner.run', async () => {
        await startDebugging(true); // noDebug = true for run
    });

    // Register the Debug command
    let debugDisposable = vscode.commands.registerCommand('launch-runner.debug', async () => {
        await startDebugging(false); // noDebug = false for debug
    });

    context.subscriptions.push(runDisposable);
    context.subscriptions.push(debugDisposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
