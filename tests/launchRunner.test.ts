import assert from "node:assert/strict";
import test from "node:test";

import { __test__ } from "../src/extensions";

type CommandHandler = (...args: unknown[]) => unknown;

interface FakeEnvironment {
    api: Parameters<typeof __test__.createExtensionController>[0];
    commands: Map<string, CommandHandler>;
    executeCommandCalls: Array<{ command: string; args: unknown[] }>;
    startDebuggingCalls: Array<{ folder: unknown; name: string; options: { noDebug?: boolean } }>;
    errorMessages: string[];
    warningMessages: string[];
}

function createFakeEnvironment(params?: {
    launchConfigurations?: Array<{ name: string; request?: string }>;
    workspaceFolders?: Array<{ uri: { fsPath: string } }>;
    startDebuggingResult?: boolean;
}) : FakeEnvironment {
    const commands = new Map<string, CommandHandler>();
    const executeCommandCalls: Array<{ command: string; args: unknown[] }> = [];
    const startDebuggingCalls: Array<{ folder: unknown; name: string; options: { noDebug?: boolean } }> = [];
    const errorMessages: string[] = [];
    const warningMessages: string[] = [];
    const subscriptions: Array<{ dispose: () => void }> = [];
    const launchConfigurations = params?.launchConfigurations ?? [];

    const api: Parameters<typeof __test__.createExtensionController>[0] = {
        commands: {
            executeCommand: async (command: string, ...args: unknown[]) => {
                executeCommandCalls.push({ command, args });
                return undefined;
            },
            registerCommand: (command: string, callback: CommandHandler) => {
                commands.set(command, callback);
                const disposable = { dispose: () => commands.delete(command) };
                subscriptions.push(disposable);
                return disposable;
            }
        },
        workspace: {
            workspaceFolders: params?.workspaceFolders ?? [{ uri: { fsPath: "workspace" } }],
            getConfiguration: () => ({
                get: () => launchConfigurations
            })
        },
        tasks: {
            fetchTasks: async () => [],
            executeTask: async () => ({ terminate: () => undefined }),
            onDidEndTask: () => ({ dispose: () => undefined })
        },
        debug: {
            startDebugging: async (folder: unknown, name: string, options?: { noDebug?: boolean }) => {
                startDebuggingCalls.push({ folder, name, options: options ?? {} });
                return params?.startDebuggingResult ?? true;
            },
            onDidStartDebugSession: () => ({ dispose: () => undefined }),
            onDidTerminateDebugSession: () => ({ dispose: () => undefined })
        },
        window: {
            showQuickPick: async () => undefined,
            showInformationMessage: async () => undefined,
            showErrorMessage: async (message: string) => {
                errorMessages.push(message);
                return undefined;
            },
            showWarningMessage: async (message: string) => {
                warningMessages.push(message);
                return undefined;
            }
        },
        QuickPickItemKind: {
            Separator: -1
        }
    };

    return { api, commands, executeCommandCalls, startDebuggingCalls, errorMessages, warningMessages };
}

test("activate registers launch-runner commands", async () => {
    const environment = createFakeEnvironment();
    const runner = __test__.createExtensionController(environment.api, {});

    const context = { subscriptions: [] as Array<{ dispose: () => void }> };
    await runner.activate(context as never);

    assert.ok(environment.commands.has("launch-runner.selectConfiguration"));
    assert.ok(environment.commands.has("launch-runner.run"));
    assert.ok(environment.commands.has("launch-runner.debug"));
    assert.ok(environment.commands.has("launch-runner.stop"));
    assert.ok(environment.commands.has("launch-runner.restart"));
    assert.ok(context.subscriptions.length >= 5);
});

test("run command auto-selects the only launch configuration", async () => {
    const environment = createFakeEnvironment({
        launchConfigurations: [{ name: "Launch API", request: "launch" }]
    });
    const runner = __test__.createExtensionController(environment.api, {});
    const context = { subscriptions: [] as Array<{ dispose: () => void }> };

    await runner.activate(context as never);
    await environment.commands.get("launch-runner.run")?.();

    assert.equal(environment.startDebuggingCalls.length, 1);
    assert.equal(environment.startDebuggingCalls[0].name, "Launch API");
    assert.equal(environment.startDebuggingCalls[0].options.noDebug, true);

    const contextUpdates = environment.executeCommandCalls.filter(
        (call) => call.command === "setContext"
    );

    assert.ok(contextUpdates.some((call) => call.args[0] === "launch-runner.hasConfiguration" && call.args[1] === true));
    assert.ok(contextUpdates.some((call) => call.args[0] === "launch-runner.isRunning" && call.args[1] === true));
});

test("run command reports an error without an open workspace", async () => {
    const environment = createFakeEnvironment({ workspaceFolders: [] });
    const runner = __test__.createExtensionController(environment.api, {});
    const context = { subscriptions: [] as Array<{ dispose: () => void }> };

    await runner.activate(context as never);
    await environment.commands.get("launch-runner.run")?.();

    assert.deepEqual(environment.errorMessages, ["No workspace folder open"]);
    assert.equal(environment.startDebuggingCalls.length, 0);
});

test("debug command starts debugging with noDebug false", async () => {
    const environment = createFakeEnvironment({
        launchConfigurations: [{ name: "Debug API", request: "launch" }]
    });
    const runner = __test__.createExtensionController(environment.api, {});
    const context = { subscriptions: [] as Array<{ dispose: () => void }> };

    await runner.activate(context as never);
    await environment.commands.get("launch-runner.debug")?.();

    assert.equal(environment.startDebuggingCalls.length, 1);
    assert.equal(environment.startDebuggingCalls[0].name, "Debug API");
    assert.equal(environment.startDebuggingCalls[0].options.noDebug, false);
    assert.deepEqual(environment.warningMessages, []);
});
