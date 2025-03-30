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

	let mindMapCommand = vscode.commands.registerCommand('rubber-duck.showMindMap', () => {
		const panel = vscode.window.createWebviewPanel(
		  'mindMap',
		  'Mind Map Preview',
		  vscode.ViewColumn.Beside,
		  { enableScripts: true }
		);
	  
		const markdown = `
			# 🧠 Learning & Creativity

			## 📚 Knowledge Domains
			- 🌍 Geography
			- Continents
				- Africa
				- Europe
				- Asia
				- East Asia
				- South Asia
			- Oceans
			- 🔬 Science
			- Physics
				- Newton's Laws
				- Quantum Mechanics
				- Entanglement
				- Uncertainty Principle
			- Biology
				- Cells
				- Genetics
			- 💻 Technology
			- Programming
				- Languages
				- JavaScript
				- Python
					- Libraries
					- NumPy
					- Pandas
					- Matplotlib
			- AI & Machine Learning
				- Neural Networks
				- Decision Trees
				- Clustering

			## 🛠️ Tools & Methods
			- Note-taking
			- [Zettelkasten](https://zettelkasten.de/)
			- Cornell Notes
			- Visual Thinking
			- Mind Mapping
			- Sketch Notes
			- Active Recall
			- Spaced Repetition

			## 💡 Creative Projects
			- Build a VSCode Extension
			- Use Webviews
			- Integrate [Markmap](https://markmap.js.org/)
			- Write a Blog
			- Topics
				- AI Ethics
				- Developer Tools
				- Study Hacks
			- Start a YouTube Channel
			- Scripts
			- Editing
			- Promotion

			## 🎯 Goals
			- Short-term
			- Finish this project ✅
			- Sleep 💤
			- Medium-term
			- Get an internship 💼
			- Learn React ⚛️
			- Long-term
			- Publish an open-source tool 🌐

			## 🧠 Notes & Random Thoughts
			- *Curiosity is the engine of learning.*
			- _Don't be afraid to start small._
			- **Focus on systems, not goals.**
			- "The best way to understand something is to teach it."

			## 📐 Equations (Just to stress-test)
			- Pythagoras: $a^2 + b^2 = c^2$
			- Quadratic: $x = {-b \\pm \\sqrt{b^2 - 4ac} \\over 2a}$

			## 🌈 A Very Very Very Very Very Very Very Very Very Very Very Very Very Long Title
			- With equally long sub-items
			- Just to see how it wraps
			- Or breaks
		`;
	  
		panel.webview.html = getWebviewContent(markdown);
	  });

	context.subscriptions.push(mindMapCommand);
}

function getWebviewContent(markdown) {
	// Optional: escape backticks if needed
	const escaped = markdown.replace(/`/g, '\\`');
  
	return `
  <!DOCTYPE html>
  <html lang="en">
	<head>
	  <meta charset="UTF-8" />
	  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
	  <title>Markmap</title>
	<style>
	body {
		background-color:rgb(255, 255, 255);
	}

	svg.markmap {
		width: 100%;
		height: 100vh;
	}

	svg.markmap text {
		fill: white;
	}
	</style>
	  <script src="https://cdn.jsdelivr.net/npm/markmap-autoloader@0.18"></script>
	</head>
	<body>
	  <div class="markmap">
		<script type="text/template">
			---
			markmap:
				maxWidth: 300
				colorFreezeLevel: 2
			---
			
			${escaped}
		</script>
	  </div>
	</body>
  </html>
  `;
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