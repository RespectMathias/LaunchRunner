# Quick Start Guide

## Test Your Extension Immediately

1. **Press `F5`** in VS Code while in the LaunchRunner folder
   - This opens a new "[Extension Development Host]" window

2. **In the new window**, open any project folder

3. **Create or open** `.vscode/launch.json` in that project

4. **Look at the editor title bar** - you'll see Run ▶️ and Debug 🐞 buttons!

## Your First Test

Try this simple example:

### Create a test JavaScript file

**test.js**

```javascript
console.log("Hello from Launch Runner!");
console.log("Current time:", new Date().toLocaleTimeString());
```

### Create a launch.json

**.vscode/launch.json**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Test Script",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/test.js",
      "console": "integratedTerminal"
    }
  ]
}
```

### Click the Run button (▶️) in the editor title bar

Your script will execute in the integrated terminal.

## Key Features

✅ **Always Visible**: Buttons show for ANY file type  
✅ **Uses launch.json**: No configuration needed in the extension  
✅ **Smart Selection**: Automatically picks if only one config exists  
✅ **Multiple Configs**: Shows quick-pick menu if you have multiple  
✅ **Run or Debug**: Separate buttons for each mode  

## What Happens When You Click?

1. **Run Button (▶️)**:
   - Starts your program WITHOUT debugging
   - Faster startup
   - Good for quick tests

2. **Debug Button (🐞)**:
   - Starts with full debugging support
   - Breakpoints work
   - Variable inspection enabled

## Next Steps

- **Install permanently**: See `INSTALLATION.md`
- **Customize**: Edit `package.json` to change icons or behavior
- **Share**: Package as VSIX or publish to marketplace

Enjoy! 🚀
