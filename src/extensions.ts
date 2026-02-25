import type * as vscode from "vscode";

type VscodeModule = typeof import("vscode");
type SelectionType = "launch" | "task";

interface LaunchSelection extends vscode.DebugConfiguration {
    configType: "launch";
}

interface TaskSelection {
    name: string;
    configType: "task";
    task: vscode.Task;
}

type Selection = LaunchSelection | TaskSelection;

interface MenuItem extends vscode.QuickPickItem {
    config?: Selection;
    isEdit?: true;
    value?: "launch" | "tasks";
}

interface VscodeApi {
    commands: Pick<VscodeModule["commands"], "executeCommand" | "registerCommand">;
    workspace: Pick<VscodeModule["workspace"], "workspaceFolders" | "getConfiguration">;
    tasks: Pick<VscodeModule["tasks"], "fetchTasks" | "executeTask" | "onDidEndTask">;
    debug: Pick<VscodeModule["debug"], "startDebugging" | "onDidStartDebugSession" | "onDidTerminateDebugSession">;
    window: Pick<
        VscodeModule["window"],
        "showQuickPick" | "showInformationMessage" | "showErrorMessage" | "showWarningMessage"
    >;
    QuickPickItemKind: VscodeModule["QuickPickItemKind"];
}

interface ExtensionController {
    activate(context: vscode.ExtensionContext): Promise<void>;
    deactivate(): void;
}

function createExtensionController(
    api: VscodeApi,
    env: NodeJS.ProcessEnv = process.env,
    wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds))
): ExtensionController {
    let lastSelectedConfig: Selection | null = null;
    let lastSelectedType: SelectionType = "launch";
    let currentSession: vscode.DebugSession | vscode.TaskExecution | null = null;
    let isRunning = false;

    async function updateContext(): Promise<void> {
        await api.commands.executeCommand("setContext", "launch-runner.isTaskSelected", lastSelectedType === "task");
        await api.commands.executeCommand("setContext", "launch-runner.hasConfiguration", lastSelectedConfig !== null);
        await api.commands.executeCommand("setContext", "launch-runner.isRunning", isRunning);
    }

    async function updateCommandTitle(): Promise<void> {
        if (!lastSelectedConfig) {
            return;
        }

        await api.commands.executeCommand("setContext", "launch-runner.configName", lastSelectedConfig.name);
    }

    function getDebugConfigurations(): LaunchSelection[] {
        const folders = api.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return [];
        }

        const configuration = api.workspace.getConfiguration("launch", folders[0].uri);
        const launchConfigurations = configuration.get<vscode.DebugConfiguration[]>("configurations") ?? [];

        return launchConfigurations
            .filter((item) => typeof item?.name === "string" && item.name.length > 0)
            .map((item) => ({
                ...item,
                configType: "launch"
            }));
    }

    async function getTaskConfigurations(): Promise<TaskSelection[]> {
        const tasks = await api.tasks.fetchTasks();
        return tasks
            .filter((task) => typeof task.name === "string" && task.name.length > 0)
            .map((task) => ({
                name: task.name,
                configType: "task",
                task
            }));
    }

    async function getAllConfigurations(): Promise<Selection[]> {
        const launches = getDebugConfigurations();
        const tasks = await getTaskConfigurations();
        return [...launches, ...tasks];
    }

    async function promptToCreateConfigurations(): Promise<void> {
        const choice = await api.window.showInformationMessage(
            "No configurations or tasks found.",
            "Create launch.json",
            "Create tasks.json",
            "Cancel"
        );

        if (choice === "Create launch.json") {
            await api.commands.executeCommand("workbench.action.debug.configure");
            return;
        }

        if (choice === "Create tasks.json") {
            await api.commands.executeCommand("workbench.action.tasks.configureTaskRunner");
        }
    }

    async function selectConfiguration(): Promise<Selection | undefined> {
        const configurations = await getAllConfigurations();

        if (configurations.length === 0) {
            await promptToCreateConfigurations();
            return undefined;
        }

        const items: MenuItem[] = [
            {
                label: "$(edit) Edit Configurations...",
                description: "",
                isEdit: true
            },
            {
                label: "",
                kind: api.QuickPickItemKind.Separator
            }
        ];

        const launches = configurations.filter((config): config is LaunchSelection => config.configType === "launch");
        const tasks = configurations.filter((config): config is TaskSelection => config.configType === "task");

        if (launches.length > 0) {
            items.push({
                label: "Launch Configurations",
                kind: api.QuickPickItemKind.Separator
            });

            for (const launch of launches) {
                items.push({
                    label: launch.name,
                    description: typeof launch.request === "string" ? launch.request : "",
                    detail: "$(rocket) Launch configuration",
                    config: launch
                });
            }
        }

        if (tasks.length > 0) {
            items.push({
                label: "Tasks",
                kind: api.QuickPickItemKind.Separator
            });

            for (const task of tasks) {
                items.push({
                    label: task.name,
                    detail: "$(tools) Task",
                    config: task
                });
            }
        }

        const selected = await api.window.showQuickPick(items, {
            placeHolder: lastSelectedConfig ? `Current: ${lastSelectedConfig.name}` : "Select a configuration to run"
        });

        if (!selected) {
            return undefined;
        }

        if (selected.isEdit) {
            const editChoice = await api.window.showQuickPick<MenuItem>([
                { label: "Edit launch.json", value: "launch" },
                { label: "Edit tasks.json", value: "tasks" }
            ]);

            if (editChoice?.value === "launch") {
                await api.commands.executeCommand("workbench.action.debug.configure");
            }

            if (editChoice?.value === "tasks") {
                await api.commands.executeCommand("workbench.action.tasks.configureTaskRunner");
            }

            return undefined;
        }

        if (!selected.config) {
            return undefined;
        }

        lastSelectedConfig = selected.config;
        lastSelectedType = selected.config.configType;
        await updateContext();
        await updateCommandTitle();

        return selected.config;
    }

    async function executeConfiguration(noDebug: boolean): Promise<void> {
        const folders = api.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            await api.window.showErrorMessage("No workspace folder open");
            return;
        }

        let selectedConfig: Selection | undefined = lastSelectedConfig ?? undefined;

        if (!selectedConfig) {
            const allConfigurations = await getAllConfigurations();

            if (allConfigurations.length === 0) {
                await promptToCreateConfigurations();
                return;
            }

            if (allConfigurations.length === 1) {
                selectedConfig = allConfigurations[0];
                lastSelectedConfig = selectedConfig;
                lastSelectedType = selectedConfig.configType;
                await updateContext();
                await updateCommandTitle();
            } else {
                selectedConfig = await selectConfiguration();
            }
        }

        if (!selectedConfig) {
            return;
        }

        const availableNow = await getAllConfigurations();
        const stillExists = availableNow.some(
            (candidate) =>
                candidate.name === selectedConfig?.name && candidate.configType === selectedConfig?.configType
        );

        if (!stillExists) {
            await api.window.showWarningMessage(
                `Configuration "${selectedConfig.name}" no longer exists. Please select a new one.`
            );
            selectedConfig = await selectConfiguration();
            if (!selectedConfig) {
                return;
            }
        }

        if (selectedConfig.configType === "task") {
            currentSession = await api.tasks.executeTask(selectedConfig.task);
            isRunning = true;
            await updateContext();
            return;
        }

        isRunning = true;
        await updateContext();

        const success = await api.debug.startDebugging(folders[0], selectedConfig.name, { noDebug });

        if (!success) {
            await api.window.showErrorMessage(
                `Failed to start ${noDebug ? "running" : "debugging"}: ${selectedConfig.name}`
            );
            currentSession = null;
            isRunning = false;
            await updateContext();
        }
    }

    async function stopConfiguration(): Promise<void> {
        if (lastSelectedType === "task") {
            if (currentSession && "terminate" in currentSession && typeof currentSession.terminate === "function") {
                currentSession.terminate();
                currentSession = null;
                isRunning = false;
                await updateContext();
            }
            return;
        }

        await api.commands.executeCommand("workbench.action.debug.disconnect");
        await api.commands.executeCommand("workbench.action.debug.stop");
    }

    async function restartConfiguration(): Promise<void> {
        if (lastSelectedType === "task") {
            await stopConfiguration();
            await wait(300);
            await executeConfiguration(true);
            return;
        }

        await api.commands.executeCommand("workbench.action.debug.restart");
    }

    async function initializeDefaultConfiguration(): Promise<void> {
        const launches = getDebugConfigurations();

        if (launches.length === 0) {
            await updateContext();
            return;
        }

        lastSelectedConfig = launches[0];
        lastSelectedType = "launch";
        await updateContext();
        await updateCommandTitle();
    }

    async function activate(context: vscode.ExtensionContext): Promise<void> {
        if (env.VSCODE_EXTHOST_WILL_SEND_SOCKET) {
            return;
        }

        await initializeDefaultConfiguration();

        context.subscriptions.push(
            api.debug.onDidStartDebugSession((session) => {
                currentSession = session;
                isRunning = true;
                void updateContext();
            })
        );

        context.subscriptions.push(
            api.debug.onDidTerminateDebugSession((session) => {
                if (currentSession === session) {
                    currentSession = null;
                    isRunning = false;
                    void updateContext();
                }
            })
        );

        context.subscriptions.push(
            api.tasks.onDidEndTask((event) => {
                if (currentSession === event.execution) {
                    currentSession = null;
                    isRunning = false;
                    void updateContext();
                }
            })
        );

        context.subscriptions.push(
            api.commands.registerCommand("launch-runner.selectConfiguration", async () => {
                await selectConfiguration();
            })
        );

        context.subscriptions.push(
            api.commands.registerCommand("launch-runner.run", async () => {
                await executeConfiguration(true);
            })
        );

        context.subscriptions.push(
            api.commands.registerCommand("launch-runner.debug", async () => {
                await executeConfiguration(false);
            })
        );

        context.subscriptions.push(
            api.commands.registerCommand("launch-runner.stop", async () => {
                await stopConfiguration();
            })
        );

        context.subscriptions.push(
            api.commands.registerCommand("launch-runner.restart", async () => {
                await restartConfiguration();
            })
        );
    }

    function deactivate(): void {
        currentSession = null;
        isRunning = false;
    }

    return {
        activate,
        deactivate
    };
}

let runtimeController: ExtensionController | undefined;

function getRuntimeController(): ExtensionController {
    if (runtimeController) {
        return runtimeController;
    }

    const runtimeVscode = loadVscode();

    runtimeController = createExtensionController({
        commands: runtimeVscode.commands,
        workspace: runtimeVscode.workspace,
        tasks: runtimeVscode.tasks,
        debug: runtimeVscode.debug,
        window: runtimeVscode.window,
        QuickPickItemKind: runtimeVscode.QuickPickItemKind
    });

    return runtimeController;
}

function loadVscode(): VscodeModule {
    return require("vscode") as VscodeModule;
}

/**
 * Activates Launch Runner and registers run/debug commands and listeners.
 *
 * @param context Extension context used for disposable lifecycle management.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    await getRuntimeController().activate(context);
}

/**
 * Deactivates Launch Runner and clears in-memory runtime session state.
 */
export function deactivate(): void {
    runtimeController?.deactivate();
    runtimeController = undefined;
}

export const __test__ = {
    createExtensionController
};
