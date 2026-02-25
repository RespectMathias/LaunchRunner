import assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Launch Runner E2E", () => {
    test("extension activates and registers core commands", async () => {
        const extension = vscode.extensions.getExtension("launch-runner.launch-runner");

        assert.ok(extension, "expected extension to be present in extension host");
        await extension?.activate();

        const commands = await vscode.commands.getCommands(true);

        assert.ok(commands.includes("launch-runner.run"));
        assert.ok(commands.includes("launch-runner.debug"));
        assert.ok(commands.includes("launch-runner.stop"));
        assert.ok(commands.includes("launch-runner.restart"));
        assert.ok(commands.includes("launch-runner.selectConfiguration"));
    });
});
