import * as path from "node:path";

import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
    const extensionDevelopmentPath = path.resolve(import.meta.dir, "..", "..");
    const extensionTestsPath = path.resolve(extensionDevelopmentPath, "out", "e2e", "suite", "index.js");

    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath
    });
}

main().catch((error) => {
    console.error("Failed to run VS Code extension e2e tests:", error);
    process.exit(1);
});
