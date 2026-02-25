import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
  );
  const extensionTestsPath = path.resolve(
    extensionDevelopmentPath,
    "out",
    "e2e",
    "suite",
    "index.js",
  );

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
  });
}

main().catch((error) => {
  console.error("Failed to run VS Code extension e2e tests:", error);
  process.exit(1);
});
