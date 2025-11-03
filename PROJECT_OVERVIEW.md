# 🚀 Launch Runner - VS Code Extension

## ✨ What You've Got

A complete VS Code extension that adds **persistent Run and Debug buttons** to the editor title bar for ANY file type. The buttons use your existing `launch.json` configurations.

## 📁 Project Structure

```
LaunchRunner/
├── extension.js          # Main extension logic
├── package.json          # Extension manifest & configuration
├── README.md            # User documentation
├── QUICKSTART.md        # Quick testing guide
├── INSTALLATION.md      # Detailed installation & customization
├── CHANGELOG.md         # Version history
├── .eslintrc.json       # ESLint configuration
├── .gitignore          # Git ignore rules
├── .vscodeignore       # VSIX package ignore rules
└── .vscode/
    └── launch.json      # Debug configuration for extension development
```

## 🎯 How It Works

1. **Activation**: Extension loads when VS Code starts (`onStartupFinished`)
2. **Commands**: Registers two commands:
   - `launch-runner.run` - Runs without debugging
   - `launch-runner.debug` - Runs with debugging
3. **UI**: Adds buttons to editor title bar that are always visible
4. **Smart Logic**:
   - Reads all configurations from workspace's `launch.json`
   - If 1 config → uses it automatically
   - If multiple → shows quick-pick menu
   - Starts debug session with selected config

## 🚦 Try It Now

### Method 1: Quick Test (Recommended)

1. Open this folder in VS Code
2. Press **F5**
3. A new VS Code window opens with your extension loaded
4. Open any project with a `.vscode/launch.json`
5. See the Run/Debug buttons in the editor title bar!

### Method 2: Install Permanently

```powershell
# Install packaging tool
npm install -g @vscode/vsce

# Package the extension
cd c:\Users\User\source\repos\LaunchRunner
vsce package

# Install the .vsix file through VS Code
# Extensions → "..." → Install from VSIX
```

## 🎨 Key Files Explained

### `package.json`

- Extension metadata (name, version, description)
- Commands definition (run & debug)
- Menu contributions (editor title bar buttons)
- Icons: `$(play)` and `$(debug-alt)`

### `extension.js`

- `activate()` - Called when extension loads
- `getDebugConfigurations()` - Reads launch.json
- `selectDebugConfiguration()` - Shows picker if needed
- `startDebugging()` - Launches the debug session

## 💡 Example Usage Scenarios

### Scenario 1: Node.js Developer

- Create launch.json with Node configuration
- Click Run ▶️ to quickly test your app
- Click Debug 🐞 to debug with breakpoints

### Scenario 2: Python Developer

- Configure Python debugger in launch.json
- Always have quick access to run scripts
- No need to navigate to Run & Debug panel

### Scenario 3: Multiple Projects

- Each project has its own launch.json
- Extension automatically uses the correct config
- Consistent UI across all projects

## 🔧 Customization Options

### Change Icons

Edit `package.json`:

```json
"icon": "$(rocket)"           // For run button
"icon": "$(bug)"              // For debug button
```

### Change Position

Edit `package.json`:

```json
"group": "navigation@1"       // @1, @2, @3... (lower = more left)
```

### Add Keyboard Shortcuts

Add to `package.json` → `contributes`:

```json
"keybindings": [{
  "command": "launch-runner.run",
  "key": "ctrl+shift+f5"
}]
```

### Filter When Buttons Appear

Edit `package.json` menu "when" clause:

```json
"when": "resourceExtname == .js"  // Only for JavaScript files
"when": "resourceLangId == python" // Only for Python files
```

## 🎓 Learning Points

This extension demonstrates:

- ✅ VS Code Extension API basics
- ✅ Command registration
- ✅ Menu contributions (editor/title)
- ✅ Debug API usage
- ✅ Configuration reading
- ✅ Quick Pick UI
- ✅ Workspace interaction

## 📚 Documentation Files

- **README.md** - End-user documentation
- **QUICKSTART.md** - Fast start guide for testing
- **INSTALLATION.md** - Detailed setup & customization
- **CHANGELOG.md** - Version history

## 🐛 Debugging the Extension

1. Open LaunchRunner folder in VS Code
2. Set breakpoints in `extension.js`
3. Press F5
4. Extension runs in debug mode
5. Test in the new window
6. Check Debug Console for logs

## 📦 Distribution

### Local Use

- Press F5 to test immediately
- No installation needed for development

### Team/Organization

- Run `vsce package`
- Share the `.vsix` file
- Install via Extensions → Install from VSIX

### Public Release

- Create publisher account
- Run `vsce publish`
- Available in VS Code Marketplace

## 🤝 Contributing Ideas

Future enhancements you could add:

- [ ] Remember last-used configuration
- [ ] Add stop/restart buttons
- [ ] Support for compound configurations
- [ ] Custom configuration selector UI
- [ ] Configuration templates
- [ ] Status bar integration

## ✅ Testing Checklist

- [ ] Extension activates without errors
- [ ] Buttons appear in editor title bar
- [ ] Run button works (noDebug mode)
- [ ] Debug button works (with debugging)
- [ ] Quick pick shows for multiple configs
- [ ] Works with different file types
- [ ] Error messages show when no launch.json
- [ ] Works in multi-root workspaces

## 🎉 You're Done

Your extension is complete and ready to use. Press **F5** to try it now!

---

**Questions?** Check the documentation files or VS Code Extension API docs at:
<https://code.visualstudio.com/api>
