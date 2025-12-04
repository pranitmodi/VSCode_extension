# [Git Commit Helper by PranitModi](https://marketplace.visualstudio.com/items?itemName=Blevins83.git-commit-helper-blevins)

A VS Code extension that automatically extracts ticket codes from Git branch names, prefixes commit messages, and formats AI-generated messages. Stage files and start typing - the ticket prefix appears automatically!

## ✨ Features

- **Auto-Prefix on Staging**: Ticket prefix appears automatically when you stage files - just start typing!
- **GitHub Copilot Integration**: Automatically formats Copilot-generated messages with ticket prefix
- **Smart Message Condensing**: Condenses verbose AI messages to concise one-liners
- **Universal Detection**: Detects ANY ticket pattern from branch names (PROJ-123, TASK-456, JIRA-789, etc.)
- **Smart Pattern Recognition**: Works with any word followed by numbers, with or without dashes
- **Fully Configurable**: Customize patterns and AI formatting strategies
- **Zero Configuration**: Works out of the box - detects common patterns automatically

## 🚀 How It Works

### Basic Workflow

1. **Checkout a branch** with ticket pattern: `feature/PROJ-123-new-feature`
2. **Stage your files** → `PROJ-123: ` appears automatically in commit message box
3. **Either:**
   - Type your message manually: `PROJ-123: Add user authentication`
   - Click Copilot sparkle button (✨) → Extension formats it: `PROJ-123: Add user authentication feature`

### 🤖 With GitHub Copilot

When you use Copilot's sparkle button to generate commit messages:
1. Click the sparkle icon (✨) in Source Control
2. Copilot generates a message (often multi-line or verbose)
3. Extension automatically:
   - Detects the AI-generated message
   - Condenses it to one concise line
   - Adds your ticket prefix: `PROJ-123: condensed message`

### 🎯 Supported Branch Patterns (All Automatic!)

- `feature/PROJ-123-new-feature` → `PROJ-123: `
- `bugfix/TASK456-fix-issue` → `TASK-456: `
- `hotfix/jira-789-urgent-fix` → `JIRA-789: `
- `develop/ABC999-enhancement` → `ABC-999: `
- `release/VER-101-preparation` → `VER-101: `
- `fix/bug123-critical` → `BUG-123: `

**The extension is smart enough to detect virtually any pattern!**

## 🔧 Installation

Install directly from the VS Code Marketplace:

1. Open VS Code (version 1.74.0 or newer)
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Git Commit Helper by PranitModi"
4. Click Install

Or install via command line:
```bash
code --install-extension PranitModi.git-commit-helper-pm
```

### 📋 Requirements

- VS Code version 1.74.0 or newer (November 2022+)
- Git extension (built-in with VS Code)
- An active Git repository

## ⚙️ Configuration

The extension works automatically without any configuration, but you can customize it:

```json
{
  "gitCommitHelper.autoPrefix": true,
  "gitCommitHelper.ticketPattern": "([A-Za-z]+)-?(\\d+)",
  "gitCommitHelper.autoGenerateOnStage": true,
  "gitCommitHelper.autoCondenseAI": true,
  "gitCommitHelper.condensingStrategy": "smart"
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gitCommitHelper.autoPrefix` | `true` | Enable/disable automatic prefixing |
| `gitCommitHelper.ticketPattern` | `"([A-Za-z]+)-?(\\d+)"` | Regex pattern to match ticket codes |
| `gitCommitHelper.autoGenerateOnStage` | `true` | Show ticket prefix when files are staged |
| `gitCommitHelper.autoCondenseAI` | `true` | Auto-format Copilot-generated messages |
| `gitCommitHelper.condensingStrategy` | `"smart"` | Strategy for condensing AI messages: `smart`, `first-sentence`, or `first-line` |

### 🤖 AI Condensing Strategies

- **smart** (recommended): Intelligently extracts key action, handles conventional commits, preserves intent
- **first-sentence**: Uses only the first sentence from Copilot's message
- **first-line**: Uses only the first line from Copilot's message

### 🔧 Pattern Examples

**Default Pattern** (works for most cases):
- `([A-Za-z]+)-?(\\d+)` - Matches: PROJ-123, task456, ABC-789, feature123

**Custom Patterns** for specific needs:
- `([A-Z]+)-(\\d+)` - Only uppercase with dash: PROJ-123, ABC-456
- `(JIRA|TASK|BUG)-(\\d+)` - Specific prefixes only: JIRA-123, TASK-456, BUG-789
- `([A-Za-z]{2,4})(\\d+)` - Letters + numbers without dash: PROJ123, TASK456

### 💡 How to Customize

1. Open VS Code Settings (Ctrl+,)
2. Search for "Git Commit Helper"
3. Modify the `ticketPattern` if needed
4. Or add to your `settings.json`:

```json
{
  "gitCommitHelper.ticketPattern": "(CUSTOM|PATTERN)-(\\d+)"
}
```

## 📋 Commands

While the extension works automatically, these commands are available:

- `Git Commit Helper: Extract and Prefix` - Manually extract and prefix current message
- `Git Commit Helper: Toggle Auto-Prefix` - Enable/disable automatic prefixing
- `Git Commit Helper: Generate Smart Commit Message` - Manually trigger AI message generation (requires GitHub Copilot)

##  Troubleshooting

### Extension Not Working?

1. Check that your branch name contains a ticket code pattern
2. Verify `gitCommitHelper.autoPrefix` is enabled in settings
3. Open Developer Tools (Help → Toggle Developer Tools) and check console for debug messages

### Custom Ticket Patterns

To support different ticket formats, update the `ticketPattern` setting:

```json
{
  "gitCommitHelper.ticketPattern": "(CUSTOM|PATTERN)-(\\d+)"
}
```

## 📊 Example Usage

```bash
# Stage files and see ticket prefix automatically!

# Example 1: Manual typing
git checkout -b feature/PROJ-123-add-authentication
# Stage files → "PROJ-123: " appears
# Type: "Add user login feature" 
# Result: "PROJ-123: Add user login feature"

# Example 2: With Copilot
git checkout -b bugfix/TASK-456-fix-bug
# Stage files → "TASK-456: " appears
# Click sparkle icon (✨) → Copilot generates verbose message
# Extension condenses and formats: "TASK-456: Fix authentication bug in login flow"

# Example 3: Multiple staged files
git checkout -b feature/ABC-999-update-ui
# Stage multiple files
# Click sparkle icon → Copilot analyzes all changes
# Extension creates: "ABC-999: Update UI components and styles"
```

**🎯 Works with ANY branch pattern and minimizes AI calls!**

## 🤝 Contributing

Found a bug or have a feature request? 

1. Check existing issues on the [GitHub repository](https://github.com/your-repo/git-commit-helper-pm)
2. Create a new issue with detailed information
3. Pull requests are welcome!

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Support

If you find this extension helpful, please:
- ⭐ Rate it on the VS Code Marketplace
- 🐛 Report issues or suggest improvements
- 💡 Share it with your team

**Enjoy seamless commit message prefixing!** 🎉
