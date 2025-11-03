# Launch Runner

A VS Code extension that adds persistent Run and Debug buttons to the editor title bar, allowing you to quickly launch any debug configuration from your `launch.json` file.

## Features

- **Always Visible**: Run and Debug buttons are always shown in the editor title bar for any file
- **Uses launch.json**: Automatically detects and uses debug configurations from your workspace's `launch.json`
- **Quick Selection**: If multiple configurations exist, shows a quick pick menu to choose which one to run
- **Simple Interface**: Clean, intuitive icons in the editor toolbar

## Usage

1. Make sure you have a `.vscode/launch.json` file in your workspace with at least one debug configuration
2. Open any file in the editor
3. Click the ▶️ (Play) icon in the title bar to **Run** (without debugging)
4. Click the 🐞 (Debug) icon in the title bar to **Debug**

If you have multiple configurations in your `launch.json`, you'll be prompted to select which one to use.

## Requirements

- VS Code version 1.80.0 or higher
- A workspace with a `.vscode/launch.json` file

## Extension Settings

This extension does not add any VS Code settings. It works directly with your existing `launch.json` configuration.

## Creating a launch.json

If you don't have a `launch.json` file yet, you can create one:

1. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open the Debug view
2. Click "create a launch.json file"
3. Select your environment (Node.js, Python, C++, etc.)
4. VS Code will create a template configuration for you

## Example launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Program",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/app.js",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Run Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/test.js"
    }
  ]
}
```

## Known Issues

None at this time. Please report issues on the GitHub repository.

## Release Notes

### 0.0.1

Initial release:

- Run and Debug buttons in editor title bar
- Support for launch.json configurations
- Quick pick menu for multiple configurations

---

## Development

To work on this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new VS Code window with the extension loaded
4. Test the Run/Debug buttons in the editor title bar

## License

MIT
