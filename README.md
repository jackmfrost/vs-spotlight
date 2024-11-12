# vs-spotlight README

## Description

VS-Spotlight aims to help developers maintain focus by highlighting only the relevant files and code sections in their workspace. Like a theater spotlight that illuminates only the important actors on stage, this extension dims the noise and brings attention to what matters most.

## Features

- 🎯 **File Spotlight**: Temporarily hide non-essential files from the workspace explorer, keeping only your selected files visible
- 📍 **Code Spotlight**: Highlight specific code sections while dimming surrounding code, perfect for code reviews or complex refactoring
- 🔄 **Quick Toggle**: Easily switch between focused and full views with customizable keyboard shortcuts
- 💾 **Spotlight Sessions**: Save and restore different spotlight configurations for various tasks or features you're working on
- 🎨 **Customizable Dimming**: Adjust the visibility level of non-spotlighted code to your preference

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open the Quick Open dialog
3. Type `ext install vs-spotlight`
4. Click Install

## Usage

### File Spotlight
1. In the file explorer, right-click on any file or folder
2. Select "Toggle Spotlight" to add it to your spotlighted files
3. Multiple files can be selected using Ctrl/Cmd or Shift
4. Folders will include all contained files recursively
5. View spotlighted files in the Spotlight Explorer view
6. Right-click a spotlighted file and select "Remove from Spotlight" to remove it

### Code Spotlight
1. Select the code you want to highlight in your editor
2. Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "Toggle Code Spotlight"
3. Or use the keyboard shortcut `Alt+S` / `Option+S`
4. The surrounding code will be dimmed while your selection remains highlighted

## Keyboard Shortcuts

Default keyboard shortcuts:
- Toggle Code Spotlight: `Alt+S` / `Option+S`
- Clear All Spotlights: `Alt+Shift+S` / `Option+Shift+S`

You can customize these shortcuts in VS Code's Keyboard Shortcuts settings.

## Extension Settings

This extension contributes the following settings:

* `vs-spotlight.dimLevel`: Controls the opacity level of dimmed code (default: 0.1)
* `vs-spotlight.enabled`: Enable/disable the extension (default: true)

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 1.0.0

Initial release of VS-Spotlight:
- File spotlighting with multi-select support
- Code section spotlighting
- Folder recursion support
- Spotlight Explorer view
- Context menu integration

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/jackmfrost/vs-spotlight).

## License

This extension is licensed under the MIT License.