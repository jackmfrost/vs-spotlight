// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// Add at the top with other declarations
let isDimmed = false;
let dimDecoration = null;
let isFilesDimmed = false;
let filesDimDecoration = null;

class SpotlightTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, resourceUri, type) {
        super(label, collapsibleState);
        this.resourceUri = resourceUri;
        this.type = type; // 'folder' or 'file'
        
        if (type === 'file') {
            this.command = {
                command: 'vscode.open',
                arguments: [resourceUri],
                title: 'Open File'
            };
        }
        
        this.contextValue = type;
    }
}

class SpotlightTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.spotlightedFiles = [];
        this.fileGroups = new Map(); // folder path -> files
    }

    setSpotlightedFiles(files) {
        this.spotlightedFiles = files;
        this._groupFiles();
        this._onDidChangeTreeData.fire();
        
        // Update context menu item state
        vscode.commands.executeCommand('setContext', 'hasSpotlightedFiles', files.length > 0);
    }

    _groupFiles() {
        this.fileGroups.clear();
        
        for (const file of this.spotlightedFiles) {
            const folderPath = vscode.workspace.asRelativePath(
                file.fsPath.substring(0, file.fsPath.lastIndexOf('/'))
            );
            
            if (!this.fileGroups.has(folderPath)) {
                this.fileGroups.set(folderPath, []);
            }
            
            this.fileGroups.get(folderPath).push(file);
        }
    }

    getTreeItem(element) {
        if (element.type === 'folder') {
            return new SpotlightTreeItem(
                element.label,
                vscode.TreeItemCollapsibleState.Expanded,
                element.resourceUri,
                'folder'
            );
        } else {
            const fileName = element.resourceUri.path.split('/').pop();
            return new SpotlightTreeItem(
                fileName,
                vscode.TreeItemCollapsibleState.None,
                element.resourceUri,
                'file'
            );
        }
    }

    getChildren(element) {
        if (!element) {
            // Root level - return folders
            const folders = Array.from(this.fileGroups.keys()).map(folderPath => ({
                label: folderPath,
                resourceUri: vscode.Uri.file(folderPath),
                type: 'folder'
            }));
            
            // Sort folders alphabetically
            return folders.sort((a, b) => a.label.localeCompare(b.label));
        }
        
        // Folder level - return files
        const folderPath = element.label;
        const files = this.fileGroups.get(folderPath) || [];
        
        // Sort files alphabetically
        return files
            .map(file => ({ resourceUri: file, type: 'file' }))
            .sort((a, b) => {
                const nameA = a.resourceUri.path.split('/').pop();
                const nameB = b.resourceUri.path.split('/').pop();
                return nameA.localeCompare(nameB);
            });
    }

    // Add method to get parent folder of a file
    getParentFolder(fileUri) {
        const relativePath = vscode.workspace.asRelativePath(fileUri);
        return relativePath.substring(0, relativePath.lastIndexOf('/'));
    }
}

// Add this utility function to handle folders
async function getAllFiles(folderUri) {
    const files = [];
    
    // Read the directory contents
    const entries = await vscode.workspace.fs.readDirectory(folderUri);
    
    for (const [name, type] of entries) {
        const fullPath = vscode.Uri.joinPath(folderUri, name);
        
        if (type === vscode.FileType.Directory) {
            // Recursively get files from subdirectories
            const subFiles = await getAllFiles(fullPath);
            files.push(...subFiles);
        } else if (type === vscode.FileType.File) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const textSpotlight = vscode.commands.registerCommand('vs-spotlight.textSpotlight', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		if (isDimmed) {
			// Remove decoration if already dimmed
			if (dimDecoration) {
				dimDecoration.dispose();
				dimDecoration = null;
			}
			isDimmed = false;
			return;
		}

		const startLine = editor.selection.start.line;
		const endLine = editor.selection.end.line;
		
		// Create decoration type for dimming non-selected lines
		dimDecoration = vscode.window.createTextEditorDecorationType({
			opacity: '0.10',
			backgroundColor: 'transparent'
		});
		
		// Create arrays for the ranges to dim
		const rangesToDim = [];
		
		// Add range before selection
		if (startLine > 0) {
			rangesToDim.push(new vscode.Range(0, 0, startLine - 1, editor.document.lineAt(startLine - 1).text.length));
		}
		
		// Add range after selection
		if (endLine < editor.document.lineCount - 1) {
			rangesToDim.push(new vscode.Range(endLine + 1, 0, editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length));
		}
		
		// Apply the decoration
		editor.setDecorations(dimDecoration, rangesToDim);
		isDimmed = true;
	});

	// Create tree data provider
	const spotlightProvider = new SpotlightTreeDataProvider();
	
	// Register the custom view with additional options
	const treeView = vscode.window.createTreeView('spotlightExplorer', {
		treeDataProvider: spotlightProvider,
		showCollapseAll: true,
		canSelectMany: true
	});

	const fileSpotlight = vscode.commands.registerCommand('vs-spotlight.fileSpotlight', async (...args) => {
		// Handle multiple files/folders from context menu selection
		const itemsToAdd = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
		
		// If no items provided, clear spotlight
		if (!itemsToAdd.length) {
			spotlightProvider.setSpotlightedFiles([]);
			isFilesDimmed = false;
			return;
		}

		// Add all selected files and folder contents to spotlighted files
		const currentFiles = spotlightProvider.spotlightedFiles;
		const newFiles = new Set([...currentFiles]);
		
		for (const uri of itemsToAdd) {
			try {
				const stat = await vscode.workspace.fs.stat(uri);
				
				if (stat.type === vscode.FileType.Directory) {
					// Handle folders: get all files recursively
					const folderFiles = await getAllFiles(uri);
					for (const file of folderFiles) {
						const isAlreadySpotlighted = currentFiles.some(f => f.fsPath === file.fsPath);
						
						if (isAlreadySpotlighted) {
							newFiles.delete(currentFiles.find(f => f.fsPath === file.fsPath));
						} else {
							newFiles.add(file);
						}
					}
				} else {
					// Handle individual files
					const isAlreadySpotlighted = currentFiles.some(f => f.fsPath === uri.fsPath);
					
					if (isAlreadySpotlighted) {
						newFiles.delete(currentFiles.find(f => f.fsPath === uri.fsPath));
					} else {
						newFiles.add(uri);
					}
				}
			} catch (error) {
				console.error(`Error processing ${uri.fsPath}:`, error);
			}
		}

		spotlightProvider.setSpotlightedFiles([...newFiles]);
		isFilesDimmed = true;
		await vscode.commands.executeCommand('spotlightExplorer.focus');
	});

	const clearSpotlight = vscode.commands.registerCommand('vs-spotlight.clearSpotlight', () => {
		spotlightProvider.setSpotlightedFiles([]);
		isFilesDimmed = false;
	});

	const removeFromSpotlight = vscode.commands.registerCommand('vs-spotlight.removeFromSpotlight', (fileItem) => {
		const currentFiles = spotlightProvider.spotlightedFiles;
		const newFiles = currentFiles.filter(f => f.fsPath !== fileItem.resourceUri.fsPath);
		spotlightProvider.setSpotlightedFiles(newFiles);
	});

	context.subscriptions.push(textSpotlight);
	context.subscriptions.push(fileSpotlight);
	context.subscriptions.push(clearSpotlight);
	context.subscriptions.push(removeFromSpotlight);
}

// This method is called when your extension is deactivated
function deactivate() {
	if (dimDecoration) {
		dimDecoration.dispose();
	}
	if (filesDimDecoration) {
		filesDimDecoration.dispose();
	}
}

module.exports = {
	activate,
	deactivate
}
