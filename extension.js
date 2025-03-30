// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require("child_process");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "rubber-ducky" is now active!');


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const helloDisposable = vscode.commands.registerCommand('rubber-ducky.helloWorld', function () {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Rubber Ducky!');
	});
	const webviewProvider = new RubberDuckyWebviewViewProvider(context);

	context.subscriptions.push(vscode.window.registerWebviewViewProvider('rubberDuckyView', webviewProvider));
	context.subscriptions.push(vscode.commands.registerCommand("rubber-ducky.speak", speak));

	// Register the Python Execution Command
	const pythonDisposable = vscode.commands.registerCommand("extension.runPython", () => {
		vscode.window.showInformationMessage("Running Python Script...");

		// Path to your Python script (ensure it's in the extension directory)
		let pythonScript = `"${__dirname}/text_to_speech.py"`;

		// Execute Python script
		exec(`python ${pythonScript}`, (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(`Error: ${error.message}`);
				return;
			}
			if (stderr) {
				vscode.window.showErrorMessage(`Python Error: ${stderr}`);
				return;
			}
			vscode.window.showInformationMessage(`Python Output: ${stdout}`);
		});
	});
	context.subscriptions.push(helloDisposable, pythonDisposable);
}


function speak(){
	console.log('hi');
	vscode.window.showInformationMessage('Spoke!');

}
// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate,
	speak
}

class RubberDuckyWebviewViewProvider {
	/**
	 * @param {vscode.ExtensionContext} context
	 */
	constructor(context) {
		this.context = context;
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
			if (message.command === "runPython") {
				vscode.commands.executeCommand("extension.runPython");
			}
		});
	}

	getWebviewContent(webview){
		const water1Gif = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', '1_water.gif'));
		const duckGif = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'duck_default.gif'));
		console.log('Water GIF URI:', water1Gif.toString());
		console.log('Duck GIF URI:', duckGif.toString());	
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
}