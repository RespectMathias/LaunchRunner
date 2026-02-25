import * as path from "node:path";

import { glob } from "glob";
import Mocha from "mocha";

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        color: true,
        timeout: 15000
    });

    const testsRoot = __dirname;
    const files = await glob("**/*.e2e.js", { cwd: testsRoot });
    if (files.length === 0) {
        throw new Error(`No e2e test files found in ${testsRoot}`);
    }

    for (const file of files) {
        mocha.addFile(path.resolve(testsRoot, file));
    }

    await new Promise<void>((resolve, reject) => {
        mocha.run((failures) => {
            if (failures > 0) {
                reject(new Error(`${failures} e2e tests failed.`));
                return;
            }

            resolve();
        });
    });
}
