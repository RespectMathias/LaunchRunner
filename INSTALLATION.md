# Installation & Development Guide

## Testing the Extension Locally

1. **Open the extension folder in VS Code**:

   ```
   code c:\Users\User\source\repos\LaunchRunner
   ```

2. **Install dependencies** (optional, for linting):

   ```powershell
   npm install
   ```

3. **Press F5** to launch a new VS Code window with your extension loaded

4. **In the new window**:
   - Open or create a workspace/folder
   - Create a `.vscode/launch.json` file with your debug configurations
   - Open any file
   - You'll see Run ▶️ and Debug 🐞 buttons in the editor title bar!

## Example launch.json Configurations

### For Node.js Projects

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Node App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/index.js",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### For Python Projects

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

### For Web Development (Chrome)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

## Installing as a VSIX Package

To install the extension permanently in VS Code:

1. **Install vsce** (Visual Studio Code Extension Manager):

   ```powershell
   npm install -g @vscode/vsce
   ```

2. **Package the extension**:

   ```powershell
   cd c:\Users\User\source\repos\LaunchRunner
   vsce package
   ```

   This creates a `launch-runner-0.0.1.vsix` file.

3. **Install the VSIX**:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X)
   - Click the "..." menu at the top
   - Select "Install from VSIX..."
   - Choose the `launch-runner-0.0.1.vsix` file

## Publishing to VS Code Marketplace (Optional)

If you want to share this extension with others:

1. Create a publisher account at <https://marketplace.visualstudio.com/>
2. Get a Personal Access Token from Azure DevOps
3. Login with vsce:

   ```powershell
   vsce login <publisher-name>
   ```

4. Publish:

   ```powershell
   vsce publish
   ```

## Customization

### Changing Button Icons

In `package.json`, you can change the icons:

- `$(play)` - Current run icon
- `$(debug-alt)` - Current debug icon
- Other options: `$(run)`, `$(debug)`, `$(run-all)`, `$(debug-start)`, etc.

### Changing Button Position

In `package.json`, modify the `group` property:

- `navigation@1` and `navigation@2` place them in the title bar
- Lower numbers appear first (left side)

### Adding Keyboard Shortcuts

Add to `package.json` under `contributes`:

```json
"keybindings": [
  {
    "command": "launch-runner.run",
    "key": "ctrl+f5"
  },
  {
    "command": "launch-runner.debug",
    "key": "f5"
  }
]
```

## Troubleshooting

**Buttons don't appear:**

- Make sure the extension is activated (check Output panel → "Launch Runner")
- Try reloading the window (Ctrl+R)

**"No debug configurations found":**

- Create a `.vscode/launch.json` file in your workspace
- Add at least one configuration

**Debug session doesn't start:**

- Verify your launch.json configuration is valid
- Check that required debugger extensions are installed (e.g., Python, C++, etc.)
