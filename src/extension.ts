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
	readonly indexChanges: Change[];
}

interface Branch {
	readonly name: string;
}

interface Change {
	readonly uri: vscode.Uri;
	readonly status: Status;
}

enum Status {
	INDEX_MODIFIED,
	INDEX_ADDED,
	INDEX_DELETED,
	INDEX_RENAMED,
	INDEX_COPIED,
	MODIFIED,
	DELETED,
	UNTRACKED,
	IGNORED,
	ADDED_BY_US,
	ADDED_BY_THEM,
	DELETED_BY_US,
	DELETED_BY_THEM,
	BOTH_ADDED,
	BOTH_DELETED,
	BOTH_MODIFIED
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
	private isGeneratingAIMessage = false;
	private lastAIGeneratedMessage: string = '';
	private aiMessageTimestamp: number = 0;
	private stagedFilesCount = new Map<string, number>();
	private isAutoGenerating = new Map<string, boolean>();

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
		this.stagedFilesCount.set(repoKey, 0);
		this.isAutoGenerating.set(repoKey, false);

		console.log(`📂 Repository opened: ${repoKey}`);

		// Set up input box value change listener for this repository
		const inputBoxDisposable = this.setupInputBoxListener(repository);
		this.disposables.push(inputBoxDisposable);

		// Set up staged changes monitor
		const stagedChangesDisposable = this.setupStagedChangesMonitor(repository);
		this.disposables.push(stagedChangesDisposable);

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
		this.stagedFilesCount.delete(repoKey);
		this.isAutoGenerating.delete(repoKey);
		console.log(`Repository closed: ${repoKey}`);
	}

	/**
	 * Set up monitor for staged changes to auto-generate commit messages
	 */
	private setupStagedChangesMonitor(repository: Repository): vscode.Disposable {
		const repoKey = repository.rootUri.toString();
		console.log(`👀 Setting up staged changes monitor for repository: ${repoKey}`);

		// Poll for staged changes every 2 seconds
		const checkStagedChanges = async () => {
			try {
				const config = vscode.workspace.getConfiguration('gitCommitHelper');
				const autoGenerate = config.get<boolean>('autoGenerateOnStage', true);
				
				if (!autoGenerate) {
					console.log('⏭️ Auto-generate on stage is disabled');
					return;
				}

				const stagedChanges = repository.state.indexChanges || [];
				const currentCount = stagedChanges.length;
				const previousCount = this.stagedFilesCount.get(repoKey) || 0;
				const isGenerating = this.isAutoGenerating.get(repoKey) || false;

				console.log(`🔍 Checking staged changes - Current: ${currentCount}, Previous: ${previousCount}, Generating: ${isGenerating}`);

			// Trigger when: 
			// 1. Staged files increased (new files added)
			// 2. We have at least 1 staged file
			// 3. Not already generating
			if (currentCount > previousCount && currentCount > 0 && !isGenerating) {
				console.log(`📦 Staged files increased from ${previousCount} to ${currentCount}`);
				if (stagedChanges.length > 0) {
					console.log(`📄 Staged files:`, stagedChanges.map(c => c.uri.fsPath));
				}
				
				// Always add ticket prefix when staging files (if input is empty)
				const inputValue = repository.inputBox.value.trim();
				const ticketCode = this.extractTicketCode(repository);
				
				if (ticketCode && inputValue === '') {
					console.log(`📝 Adding ticket prefix for user to start typing: ${ticketCode}:`);
					repository.inputBox.value = `${ticketCode}: `;
				}
			} else if (currentCount !== previousCount) {
				console.log(`⏭️ Skipping: currentCount=${currentCount}, previousCount=${previousCount}, isGenerating=${isGenerating}`);
			}				// Update count
				this.stagedFilesCount.set(repoKey, currentCount);
			} catch (error) {
				console.error('❌ Error checking staged changes:', error);
				if (error instanceof Error) {
					console.error('Error details:', error.message, error.stack);
				}
			}
		};

		// Check immediately
		setTimeout(checkStagedChanges, 1000);

		// Check every 2 seconds
		const interval = setInterval(checkStagedChanges, 2000);

		console.log(`✅ Staged changes monitor set up for ${repoKey}`);

		return new vscode.Disposable(() => {
			clearInterval(interval);
		});
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

			// Check if this is an AI-generated message (multi-line or long message)
			const isAIGenerated = this.detectAIGeneratedMessage(newValue, lastValue);
			if (isAIGenerated) {
				console.log('🤖 AI-generated message detected, processing...');
				this.processAIGeneratedMessage(repository, newValue);
				isUpdating = true;
				hasAddedPrefix = true;
				setTimeout(() => { isUpdating = false; }, 500);
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
	 * Detect if a message was AI-generated (multi-line or suddenly long message)
	 */
	private detectAIGeneratedMessage(newValue: string, oldValue: string): boolean {
		const config = vscode.workspace.getConfiguration('gitCommitHelper');
		const autoCondense = config.get<boolean>('autoCondenseAI', true);
		
		if (!autoCondense || this.isGeneratingAIMessage) {
			return false;
		}

		// Check if message has multiple lines (Copilot often generates multi-line messages)
		const hasMultipleLines = newValue.includes('\n') && newValue.split('\n').length > 1;
		
		// Check if message suddenly became long (>80 chars) from short (less than ticket prefix)
		const ticketCode = this.extractTicketCode(this.getActiveRepository()!);
		const minLength = ticketCode ? ticketCode.length + 10 : 20;
		const suddenlyLong = oldValue.length < minLength && newValue.length > 80;
		
		// Check if it's different from last AI message (avoid reprocessing)
		const isDifferent = newValue !== this.lastAIGeneratedMessage;
		
		// Check if message doesn't already have ticket prefix at start (indicating user typed it)
		const startsWithPrefix = ticketCode && newValue.startsWith(`${ticketCode}: `);
		const isCopilotGenerated = !startsWithPrefix && (hasMultipleLines || suddenlyLong);
		
		if (isCopilotGenerated && isDifferent) {
			console.log(`🤖 Copilot-generated message detected! Multi-line: ${hasMultipleLines}, Length: ${newValue.length}`);
			return true;
		}
		
		return false;
	}

	/**
	 * Process AI-generated message: condense and add ticket prefix
	 */
	private processAIGeneratedMessage(repository: Repository, aiMessage: string): void {
		const config = vscode.workspace.getConfiguration('gitCommitHelper');
		const strategy = config.get<string>('condensingStrategy', 'smart');
		
		console.log(`🎨 Processing Copilot-generated message (length: ${aiMessage.length})`);
		
		// Condense the message
		const condensed = this.condenseToOneLine(aiMessage, strategy);
		console.log(`📝 Condensed message: "${condensed}"`);
		
		// Add ticket prefix
		const ticketCode = this.extractTicketCode(repository);
		if (ticketCode) {
			const finalMessage = `${ticketCode}: ${condensed}`;
			console.log(`✅ Final formatted message: "${finalMessage}"`);
			this.lastAIGeneratedMessage = finalMessage;
			this.aiMessageTimestamp = Date.now();
			repository.inputBox.value = finalMessage;
		} else {
			console.log('⚠️ No ticket code found, using condensed message without prefix');
			this.lastAIGeneratedMessage = condensed;
			repository.inputBox.value = condensed;
		}
	}

	/**
	 * Ensure ticket prefix is visible when input box is focused or empty
	 */
	private ensureTicketPrefix(repository: Repository): void {
		const ticketCode = this.extractTicketCode(repository);
		if (!ticketCode) {
			return;
		}

		const currentValue = repository.inputBox.value;
		const expectedPrefix = `${ticketCode}: `;

		// If input is empty, add the prefix
		if (currentValue === '') {
			console.log(`📝 Adding ticket prefix: ${expectedPrefix}`);
			repository.inputBox.value = expectedPrefix;
		}
	}

	/**
	 * Condense multi-line or verbose message to single-line conventional commit format
	 */
	private condenseToOneLine(message: string, strategy: string): string {
		if (!message) {
			return '';
		}

		// Remove leading/trailing whitespace
		let cleaned = message.trim();
		
		if (strategy === 'first-sentence') {
			// Extract first sentence only
			const firstLine = cleaned.split('\n')[0];
			const firstSentence = firstLine.split(/[.!?]/)[0].trim();
			return firstSentence || firstLine;
		}
		
		if (strategy === 'smart') {
			// Smart condensing: extract key action from first line
			const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
			const firstLine = lines[0];
			
			// If first line is already concise (<72 chars), use it
			if (firstLine.length <= 72) {
				return firstLine;
			}
			
			// Try to extract conventional commit format (type: description)
			const conventionalMatch = firstLine.match(/^(\w+)(\([^)]+\))?:\s*(.+)$/);
			if (conventionalMatch) {
				const type = conventionalMatch[1];
				const description = conventionalMatch[3];
				// Take first part of description if too long
				const shortDesc = description.length > 50 ? description.substring(0, 50).trim() + '...' : description;
				return `${type}: ${shortDesc}`;
			}
			
			// Extract first meaningful phrase (up to first comma or 60 chars)
			const phrases = firstLine.split(',');
			const firstPhrase = phrases[0].trim();
			return firstPhrase.length > 60 ? firstPhrase.substring(0, 60).trim() + '...' : firstPhrase;
		}
		
		// Default: just use first line, truncate if needed
		const firstLine = cleaned.split('\n')[0];
		return firstLine.length > 72 ? firstLine.substring(0, 72).trim() + '...' : firstLine;
	}

	/**
	 * Generate smart commit message for a specific repository
	 */
	private async generateSmartMessageForRepo(repository: Repository): Promise<void> {
		try {
			// Check if there are staged changes
			const stagedChanges = repository.state.indexChanges || [];
			if (stagedChanges.length === 0) {
				console.log('⚠️ No staged changes found, skipping generation');
				return;
			}

			console.log(`🚀 Auto-generating smart commit message for ${stagedChanges.length} staged files...`);
			console.log(`📄 Staged files:`, stagedChanges.map(c => c.uri.fsPath));
			
			// Check available commands
			const commands = await vscode.commands.getCommands();
			console.log('🔍 Checking available Git/Copilot commands...');
			
			// Try different possible command names
			const possibleCommands = [
				'git.generateCommitMessage',
				'workbench.action.generateCommitMessage', 
				'_workbench.generateCommitMessage',
				'github.copilot.generateCommitMessage'
			];
			
			let commandToUse: string | undefined;
			for (const cmd of possibleCommands) {
				if (commands.includes(cmd)) {
					commandToUse = cmd;
					console.log(`✅ Found command: ${cmd}`);
					break;
				}
			}
			
			if (!commandToUse) {
				console.log('⚠️ No commit message generation command found. Available Git commands:');
				const gitCommands = commands.filter(c => c.includes('git') || c.includes('commit') || c.includes('copilot'));
				console.log(gitCommands.slice(0, 20).join(', '));
				console.log('⚠️ GitHub Copilot commit message generation not available.');
				
				// Fallback: Just add the ticket prefix without AI generation
				const ticketCode = this.extractTicketCode(repository);
				if (ticketCode && repository.inputBox.value === '') {
					repository.inputBox.value = `${ticketCode}: `;
					console.log(`📝 Added ticket prefix: ${ticketCode}:`);
				}
				return;
			}
			
			// Set flag to prevent auto-processing during generation
			this.isGeneratingAIMessage = true;
			
			// Clear input box before generation
			const previousValue = repository.inputBox.value;
			console.log(`📝 Current input box value: "${previousValue}"`);
			
			// Call the commit message generation command
			console.log(`📞 Calling ${commandToUse}...`);
			await vscode.commands.executeCommand(commandToUse);
			console.log('✅ Command executed');
			
			// Wait a bit for the message to be populated
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Get the generated message
			const generatedMessage = repository.inputBox.value;
			console.log(`📥 Copilot generated: "${generatedMessage}"`);
			
			if (generatedMessage && generatedMessage.length > 0 && generatedMessage !== previousValue) {
				// Process the AI-generated message
				this.processAIGeneratedMessage(repository, generatedMessage);
				console.log('✅ Auto-generated smart commit message!');
			} else {
				console.log('⚠️ Copilot did not generate a message or message unchanged');
				console.log(`Previous: "${previousValue}", Generated: "${generatedMessage}"`);
				
				// Fallback: Just add the ticket prefix
				const ticketCode = this.extractTicketCode(repository);
				if (ticketCode && generatedMessage === '') {
					repository.inputBox.value = `${ticketCode}: `;
					console.log(`📝 Added ticket prefix as fallback: ${ticketCode}:`);
				}
			}
			
			// Reset flag
			this.isGeneratingAIMessage = false;
		} catch (error) {
			console.error('❌ Error generating smart message:', error);
			if (error instanceof Error) {
				console.error('Error details:', error.message, error.stack);
			}
			this.isGeneratingAIMessage = false;
		}
	}

	/**
	 * Generate smart commit message using Copilot, then condense and prefix
	 */
	public async generateSmartMessage(): Promise<void> {
		try {
			const activeRepo = this.getActiveRepository();
			if (!activeRepo) {
				vscode.window.showWarningMessage('No active Git repository found.');
				return;
			}

			// Check if there are staged changes
			const stagedChanges = activeRepo.state.indexChanges || [];
			if (stagedChanges.length === 0) {
				vscode.window.showWarningMessage('No staged changes found. Stage some changes first.');
				return;
			}

			await this.generateSmartMessageForRepo(activeRepo);
			vscode.window.showInformationMessage('✨ Smart commit message generated!');
		} catch (error) {
			console.error('❌ Error generating smart message:', error);
			vscode.window.showErrorMessage(`Failed to generate smart message: ${error}`);
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
		this.stagedFilesCount.clear();
		this.isAutoGenerating.clear();
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

		// Register command to generate smart commit message
		const generateSmartCommand = vscode.commands.registerCommand('git-commit-helper.generateSmartMessage', async () => {
			console.log('✨ Generate smart commit message command triggered');
			await gitCommitHelper?.generateSmartMessage();
		});

		// Add disposables to context
		context.subscriptions.push(extractCommand, toggleCommand, generateSmartCommand);
		
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
