// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Git API interfaces
interface GitExtension {
	readonly enabled: boolean;
	getAPI(version: 1): GitAPI;
}

interface GitAPI {
	readonly repositories: Repository[];
	readonly onDidOpenRepository: vscode.Event<Repository>;
	readonly onDidCloseRepository: vscode.Event<Repository>;
}

interface Repository {
	readonly rootUri: vscode.Uri;
	readonly inputBox: SourceControlInputBox;
	readonly state: RepositoryState;
}

interface SourceControlInputBox {
	value: string;
}

interface RepositoryState {
	readonly HEAD: Branch | undefined;
}

interface Branch {
	readonly name: string;
}

/**
 * Git Commit Helper class that manages the automatic prefixing of commit messages
 */
class GitCommitHelper {
	private gitExtension: GitExtension | undefined;
	private gitAPI: GitAPI | undefined;
	private disposables: vscode.Disposable[] = [];
	private isEnabled: boolean = true;
	private repositories = new Map<string, Repository>();

	constructor(private context: vscode.ExtensionContext) {
		this.initialize();
	}

	/**
	 * Initialize the Git extension and set up event listeners
	 */
	private async initialize(): Promise<void> {
		try {
			console.log('🔧 Initializing Git Commit Helper...');
			
			// Get the Git extension
			const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
			if (!gitExtension) {
				console.error('❌ Git extension not found');
				vscode.window.showErrorMessage('Git extension not found. Git Commit Helper requires the Git extension.');
				return;
			}

			console.log('📦 Git extension found, checking activation status...');
			
			// Activate the Git extension if not already active
			if (!gitExtension.isActive) {
				console.log('⏳ Activating Git extension...');
				await gitExtension.activate();
				console.log('✅ Git extension activated');
			} else {
				console.log('✅ Git extension already active');
			}

			this.gitExtension = gitExtension.exports;
			
			if (!this.gitExtension.enabled) {
				console.error('❌ Git extension is disabled');
				vscode.window.showWarningMessage('Git extension is disabled. Git Commit Helper will not function.');
				return;
			}

			console.log('🔌 Getting Git API...');
			this.gitAPI = this.gitExtension.getAPI(1);

			if (!this.gitAPI) {
				console.error('❌ Could not get Git API');
				return;
			}

			console.log(`📊 Git API initialized. Current repositories: ${this.gitAPI.repositories.length}`);

			// Set up repository event listeners
			console.log('🔗 Setting up repository listeners...');
			this.setupRepositoryListeners();

			// Process existing repositories
			console.log('🔄 Processing existing repositories...');
			this.gitAPI.repositories.forEach(repo => {
				console.log(`📁 Processing repository: ${repo.rootUri.toString()}`);
				this.onRepositoryOpened(repo);
			});

			console.log('✅ Git Commit Helper initialized successfully');
			vscode.window.showInformationMessage('Git Commit Helper is now active!');
		} catch (error) {
			console.error('Failed to initialize Git Commit Helper:', error);
			vscode.window.showErrorMessage(`Failed to initialize Git Commit Helper: ${error}`);
		}
	}

	/**
	 * Set up event listeners for repository changes
	 */
	private setupRepositoryListeners(): void {
		if (!this.gitAPI) {
			return;
		}

		// Listen for new repositories
		this.disposables.push(
			this.gitAPI.onDidOpenRepository(repo => this.onRepositoryOpened(repo))
		);

		// Listen for repository closures
		this.disposables.push(
			this.gitAPI.onDidCloseRepository(repo => this.onRepositoryClosed(repo))
		);
	}

	/**
	 * Handle when a repository is opened
	 */
	private onRepositoryOpened(repository: Repository): void {
		const repoKey = repository.rootUri.toString();
		this.repositories.set(repoKey, repository);

		console.log(`📂 Repository opened: ${repoKey}`);

		// Set up input box value change listener for this repository
		const inputBoxDisposable = this.setupInputBoxListener(repository);
		this.disposables.push(inputBoxDisposable);

		// Immediately check if we can extract a ticket code
		const ticketCode = this.extractTicketCode(repository);
		if (ticketCode) {
			console.log(`🎫 Repository opened with ticket code: ${ticketCode} - ${repoKey}`);
			// Log branch details for debugging
			const currentBranch = repository.state.HEAD;
			if (currentBranch) {
				console.log(`🌿 Current branch details: ${currentBranch.name}`);
			}
		} else {
			console.log(`📝 Repository opened without ticket code - ${repoKey}`);
			const currentBranch = repository.state.HEAD;
			if (currentBranch) {
				console.log(`🌿 Current branch (no ticket): ${currentBranch.name}`);
			} else {
				console.log(`⚠️ No current branch detected`);
			}
		}
	}

	/**
	 * Handle when a repository is closed
	 */
	private onRepositoryClosed(repository: Repository): void {
		const repoKey = repository.rootUri.toString();
		this.repositories.delete(repoKey);
		console.log(`Repository closed: ${repoKey}`);
	}

	/**
	 * Set up input box listener for a specific repository
	 */
	private setupInputBoxListener(repository: Repository): vscode.Disposable {
		const repoKey = repository.rootUri.toString();
		let lastValue = '';
		let isUpdating = false;
		let hasAddedPrefix = false;

		console.log(`🎧 Setting up input box listener for repository: ${repoKey}`);

		// Create a debounced function to avoid infinite loops and excessive updates
		const updateCommitMessage = this.debounce((newValue: string) => {
			if (isUpdating || !this.isEnabled) {
				console.log(`⏭️ Skipping update - isUpdating: ${isUpdating}, isEnabled: ${this.isEnabled}`);
				return;
			}

			const config = vscode.workspace.getConfiguration('gitCommitHelper');
			const autoPrefix = config.get<boolean>('autoPrefix', true);
			
			if (!autoPrefix) {
				console.log('⚠️ Auto-prefix is disabled in settings');
				return;
			}

			const ticketCode = this.extractTicketCode(repository);
			if (!ticketCode) {
				console.log(`🔍 No ticket code found for repository: ${repoKey}`);
				return;
			}

			const prefix = `${ticketCode}: `;
			
			// Only add prefix if it's not already there and we haven't added it before
			if (newValue && !newValue.startsWith(prefix) && !hasAddedPrefix) {
				console.log(`✅ Adding prefix "${prefix}" to commit message: "${newValue}"`);
				isUpdating = true;
				hasAddedPrefix = true;
				repository.inputBox.value = prefix + newValue;
				setTimeout(() => { 
					isUpdating = false; 
				}, 100);
			} else if (!newValue) {
				// Reset flag when input is cleared
				console.log('🧹 Input cleared, resetting prefix flag');
				hasAddedPrefix = false;
			} else {
				console.log(`⏭️ Skipping prefix - already present or conditions not met. Value: "${newValue}", hasPrefix: ${newValue.startsWith(prefix)}, hasAddedPrefix: ${hasAddedPrefix}`);
			}
		}, 200);

		// More aggressive monitoring for input box changes
		const checkInputBox = () => {
			try {
				const currentValue = repository.inputBox.value;
				if (currentValue !== lastValue) {
					console.log(`📝 Input box changed from "${lastValue}" to "${currentValue}" in ${repoKey}`);
					updateCommitMessage(currentValue);
					lastValue = currentValue;
				}
			} catch (error) {
				console.error('❌ Error checking input box:', error);
			}
		};

		console.log(`⏰ Starting input monitoring for ${repoKey} (every 300ms)`);
		// Monitor more frequently and also watch for focus events
		const interval = setInterval(checkInputBox, 300);
		
		// Also try to detect when the Source Control view is opened
		const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(() => {
			console.log(`👁️ Active editor changed, checking input box for ${repoKey}`);
			setTimeout(checkInputBox, 500);
		});

		console.log(`Set up input box listener for repository: ${repository.rootUri.toString()}`);

		return new vscode.Disposable(() => {
			clearInterval(interval);
			onDidChangeActiveEditor.dispose();
		});
	}	/**
	 * Extract ticket code from the current branch name
	 */
	private extractTicketCode(repository: Repository): string | null {
		try {
			const currentBranch = repository.state.HEAD;
			if (!currentBranch) {
				console.log('⚠️ No current branch found');
				return null;
			}

			const branchName = currentBranch.name;
			console.log(`🌿 Current branch: ${branchName}`);

			// Get the ticket pattern from configuration
			const config = vscode.workspace.getConfiguration('gitCommitHelper');
			const ticketPattern = config.get<string>('ticketPattern', '([A-Za-z]+)-?(\\d+)');
			console.log(`🔍 Using ticket pattern: ${ticketPattern}`);
			console.log(`🧪 Testing pattern against branch: ${branchName}`);
			
			// Create regex pattern to match ticket codes
			const regex = new RegExp(ticketPattern, 'i');
			console.log(`🔧 Created regex: ${regex.toString()}`);
			const match = branchName.match(regex);
			console.log(`🎯 Regex match result:`, match);

			if (match && match.length >= 3) {
				// Extract prefix and number
				const prefix = match[1].toUpperCase();
				const number = match[2];
				
				// Build ticket code with dash separator
				const ticketCode = `${prefix}-${number}`;
				console.log(`🎫 Extracted ticket code: ${ticketCode} from branch: ${branchName}`);
				console.log(`🔧 Match details - prefix: ${prefix}, number: ${number}, full match: ${match[0]}`);
				return ticketCode;
			} else {
				console.log(`❌ No ticket code found in branch: ${branchName} with pattern: ${ticketPattern}`);
				if (match) {
					console.log(`🔧 Regex match result:`, match);
				}
				return null;
			}
		} catch (error) {
			console.error('Error extracting ticket code:', error);
			return null;
		}
	}

	/**
	 * Manually extract and show ticket code for the current repository
	 */
	public extractAndShowTicketCode(): void {
		const activeRepo = this.getActiveRepository();
		if (!activeRepo) {
			vscode.window.showWarningMessage('No active Git repository found.');
			return;
		}

		const ticketCode = this.extractTicketCode(activeRepo);
		if (ticketCode) {
			vscode.window.showInformationMessage(`Ticket Code found: ${ticketCode}`);
		} else {
			vscode.window.showInformationMessage('No ticket code found in current branch name.');
		}
	}

	/**
	 * Toggle the auto-prefix functionality
	 */
	public toggleAutoPrefix(): void {
		const config = vscode.workspace.getConfiguration('gitCommitHelper');
		const currentValue = config.get<boolean>('autoPrefix', true);
		config.update('autoPrefix', !currentValue, vscode.ConfigurationTarget.Global);
		
		this.isEnabled = !currentValue;
		const status = this.isEnabled ? 'enabled' : 'disabled';
		vscode.window.showInformationMessage(`Git Commit Helper auto-prefix ${status}.`);
	}

	/**
	 * Get the currently active repository
	 */
	private getActiveRepository(): Repository | undefined {
		if (!this.gitAPI) {
			return undefined;
		}

		// Try to get the repository from the active text editor
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
			if (workspaceFolder) {
				for (const repo of this.gitAPI.repositories) {
					if (repo.rootUri.toString() === workspaceFolder.uri.toString()) {
						return repo;
					}
				}
			}
		}

		// Fallback to the first repository if available
		return this.gitAPI.repositories[0];
	}

	/**
	 * Utility function to debounce function calls
	 */
	private debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
		let timeout: NodeJS.Timeout;
		return ((...args: any[]) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		}) as T;
	}

	/**
	 * Dispose of all resources
	 */
	public dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
		this.repositories.clear();
	}
}

// Global instance
let gitCommitHelper: GitCommitHelper | undefined;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('🚀 Git Commit Helper extension is activating...');
	
	try {
		// Initialize the Git Commit Helper
		gitCommitHelper = new GitCommitHelper(context);
		console.log('✅ Git Commit Helper initialized successfully');

		// Register command to manually extract ticket code
		const extractCommand = vscode.commands.registerCommand('git-commit-helper.extractTicketCode', () => {
			console.log('📝 Manual extract command triggered');
			gitCommitHelper?.extractAndShowTicketCode();
		});

		// Register command to toggle auto-prefix
		const toggleCommand = vscode.commands.registerCommand('git-commit-helper.toggleAutoPrefix', () => {
			console.log('🔄 Toggle auto-prefix command triggered');
			gitCommitHelper?.toggleAutoPrefix();
		});

		// Add disposables to context
		context.subscriptions.push(extractCommand, toggleCommand);
		
		console.log('🎉 Git Commit Helper extension is now active!');
	} catch (error) {
		console.error('❌ Error activating Git Commit Helper:', error);
		vscode.window.showErrorMessage(`Git Commit Helper activation failed: ${error}`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	gitCommitHelper?.dispose();
	gitCommitHelper = undefined;
}
