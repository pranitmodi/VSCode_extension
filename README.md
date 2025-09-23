# Git Commit Helper by PranitModi

A VS Code extension that automatically extracts ticket codes from Git branch names and prefixes commit messages with them. No manual commands required - it works automatically when you type commit messages!

## ✨ Features

- **Universal Detection**: Automatically detects ANY ticket pattern from branch names (PROJ-123, TASK-456, JIRA-789, ABC-999, etc.)
- **Auto-Prefixing**: Automatically adds ticket codes to commit messages as you type
- **Smart Pattern Recognition**: Works with any word followed by numbers, with or without dashes
- **Fully Configurable**: Customize patterns for your specific workflow
- **Smart Prevention**: Prevents duplicate prefixes and respects existing messages
- **Zero Configuration**: Works out of the box - detects common patterns automatically

## 🚀 How It Works

The extension automatically detects ticket codes from your branch names and prefixes your commit messages:

1. Create a branch with ANY ticket pattern: `feature/PROJ-123-description` or `bugfix/ABC456-fix`
2. Open Source Control (Ctrl+Shift+G)
3. Start typing your commit message
4. The extension automatically prefixes it with `PROJ-123: ` or `ABC-456: `

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

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Git Commit Helper by PranitModi"
4. Click Install

Or install via command line:
```bash
code --install-extension PranitModi.git-commit-helper-pm
```

## ⚙️ Configuration

The extension works automatically without any configuration, but you can customize it:

```json
{
  "gitCommitHelper.autoPrefix": true,
  "gitCommitHelper.ticketPattern": "([A-Za-z]+)-?(\\d+)"
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gitCommitHelper.autoPrefix` | `true` | Enable/disable automatic prefixing |
| `gitCommitHelper.ticketPattern` | `"([A-Za-z]+)-?(\\d+)"` | Regex pattern to match ticket codes |

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
# Works with ANY pattern automatically!

# Example 1: Traditional JIRA style
git checkout -b feature/PROJ-123-add-authentication
# VS Code: Type "Add user login" → Becomes "PROJ-123: Add user login"

# Example 2: GitHub issue style  
git checkout -b fix/issue456-fix-bug
# VS Code: Type "Fix critical bug" → Becomes "ISSUE-456: Fix critical bug"

# Example 3: Custom team pattern
git checkout -b hotfix/ABC999-urgent-patch
# VS Code: Type "Emergency patch" → Becomes "ABC-999: Emergency patch"

# Example 4: Lowercase patterns
git checkout -b bugfix/task123-performance
# VS Code: Type "Improve speed" → Becomes "TASK-123: Improve speed"
```

**🎯 The extension automatically detects and formats ANY pattern!**

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
