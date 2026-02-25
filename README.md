# Launch Runner

JetBrains-style run/debug buttons for VS Code.

## Install

Install from the VS Code Marketplace.

## Build

```bash
npm install
npx vsce package
```

## Usage

Click **...** to select a launch configuration or task. Use **Run** or **Debug** buttons to execute.

## Known Limitations

Some VS Code launch types (notably `extensionHost` when started in Run/noDebug mode) may not reliably support Stop/Restart from either this extension or VS Code's built-in debug toolbar. This behavior comes from the underlying VS Code/debug adapter flow for those launch types.

## Requirements

VS Code 1.80.0+ with `.vscode/launch.json` or `.vscode/tasks.json` in your workspace.

MIT License
