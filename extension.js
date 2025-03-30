// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require("child_process");

const ALL_DUCKS = [
	{ label: 'Default Duck', description: 'duck_default.gif' },
    { label: 'Zombie Duck', description: 'duck_zombie.gif' },
    { label: 'Cowboy Duck', description: 'duck_cowboy.gif' },
    { label: 'Flower Duck', description: 'duck_flower.gif' },
    { label: 'Sombrero Duck', description: 'duck_sombrero.gif' },
    { label: 'Wizard Duck', description: 'duck_wizard.gif' }
]

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// create window
	const webviewProvider = new RubberDuckyWebviewViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('rubberDuckyView', webviewProvider)
	);

	// Register the Python Execution Command
	const pythonDisposable = vscode.commands.registerCommand("rubber-ducky.runPython", () => {
		vscode.window.showInformationMessage("Running Python Script...");

		// Path to your Python script (ensure it's in the extension directory)
		let pythonScript = `"${__dirname}/text_to_speech.py"`;

		// Execute Python script
		exec(`python3 ${pythonScript}`, (error, stdout, stderr) => {
			console.log(`Python Output: ${stdout}`);
			if (error) {
				console.log(`Error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`Python Error: ${stderr}`);
				return;
			}
		});
	});
	context.subscriptions.push(pythonDisposable);

	const changeDuckCommand = vscode.commands.registerCommand('rubber-ducky.changeDuck', async () => {
		const selectedDuck = await vscode.window.showQuickPick(ALL_DUCKS.map(duck => ({
            label: duck.label,
            description: duck.description
        })), { 
			placeHolder: 'Select a duck'
		});
		if (selectedDuck === undefined) {
			console.log('Cancelling duck selection');
			return;
		}
		const selectedDuckGif = selectedDuck.description;
        if (webviewProvider && webviewProvider.webviewView) {
            webviewProvider.updateDuckGif(selectedDuckGif);
        }
    });
	context.subscriptions.push(changeDuckCommand);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

class RubberDuckyWebviewViewProvider {
	/**
	 * @param {vscode.ExtensionContext} context
	 */
	constructor(context) {
		this.context = context;
		this.duckGif = 'duck_default.gif';
	}

	resolveWebviewView(webviewView) {
		this.webviewView = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [ vscode.Uri.joinPath(this.context.extensionUri, 'media')]
		};
		webviewView.webview.html = this.getWebviewContent(webviewView.webview);

		// Listen for messages from Webview
		webviewView.webview.onDidReceiveMessage(message => {
			switch(message.command) {
				case 'runPython':
					vscode.commands.executeCommand("rubber-ducky.runPython");
					return;
			}
		});
	}

	getWebviewContent(webview){
		const water1Gif = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', '1_water.gif'));
		const duckGif = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', this.duckGif));
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Rubber Ducky</title>
				<style>
					body {
						margin: 0;
						overflow: hidden;
						display: flex;
						justify-content: center;
						align-items: flex-end;
						height: 100vh;
						background: url('${water1Gif}') no-repeat bottom center;
						background-size: 100% auto;
					}
					#duck {
						position: absolute;
						bottom: 5px;
						width: 80px;
						height: auto;
						cursor: pointer;
					}
				</style>
			</head>
			<body>
				<img id="duck" src="${duckGif}" alt="Rubber Ducky">
				<script>
					const vscode = acquireVsCodeApi();
					document.getElementById("duck").addEventListener("click", () => {
						vscode.postMessage({ command: "runPython" });
					});
				</script>
			</body>
			</html>
		`;
	}
	updateDuckGif(newGif) {
		this.duckGif = newGif;
		if (this.webviewView && this.webviewView.webview) {
			this.webviewView.webview.html = this.getWebviewContent(this.webviewView.webview);
		}
	}
}