# [Git Commit Helper by PranitModi](https://marketplace.visualstudio.com/items?itemName=Blevins83.git-commit-helper-blevins)

A VS Code and Cursor extension that automatically extracts ticket codes from Git branch names and prefixes commit messages with them. No manual commands required - it works automatically when you type commit messages!

## Features

- **Universal Detection**: Automatically detects ANY ticket pattern from branch names (PROJ-123, TASK-456, JIRA-789, ABC-999, etc.)
- **Auto-Prefixing**: Automatically adds ticket codes to commit messages as you type
- **AI-assisted tag**: After the ticket, inserts `ai(assisted)` by default (`PROJ-123: ai(assisted) your message`)
- **Smart Pattern Recognition**: Works with any word followed by numbers, with or without dashes
- **Fully Configurable**: Customize patterns for your specific workflow
- **Smart Prevention**: Prevents duplicate prefixes and respects existing messages
- **Zero Configuration**: Works out of the box - detects common patterns automatically
- **VS Code and Cursor**: Same Git Source Control input box API in both editors

## How It Works

The extension automatically detects ticket codes from your branch names and prefixes your commit messages:

1. Create a branch with ANY ticket pattern: `feature/PROJ-123-description` or `bugfix/ABC456-fix`
2. Open Source Control (Ctrl+Shift+G)
3. Start typing your commit message
4. The extension automatically prefixes it with `PROJ-123: ai(assisted) ` or `ABC-456: ai(assisted) `

### Supported Branch Patterns (All Automatic!)

- `feature/PROJ-123-new-feature` → `PROJ-123: ai(assisted) `
- `bugfix/TASK456-fix-issue` → `TASK-456: ai(assisted) `
- `hotfix/jira-789-urgent-fix` → `JIRA-789: ai(assisted) `
- `develop/ABC999-enhancement` → `ABC-999: ai(assisted) `
- `release/VER-101-preparation` → `VER-101: ai(assisted) `
- `fix/bug123-critical` → `BUG-123: ai(assisted) `

**The extension is smart enough to detect virtually any pattern!**

## Installation

### VS Code

Install directly from the VS Code Marketplace:

1. Open VS Code (version 1.74.0 or newer)
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Git Commit Helper by PranitModi"
4. Click Install

Or install via command line:
```bash
code --install-extension PranitModi.git-commit-helper-pm
```

### Cursor

Cursor’s marketplace is [Open VSX](https://open-vsx.org/), not the Microsoft Marketplace. After this version is published there:

1. Open Cursor Extensions
2. Search for **Git Commit Helper by PranitModi** (id `Blevins83.git-commit-helper-blevins`)
3. Click Install

Listing: [open-vsx.org/extension/Blevins83/git-commit-helper-blevins](https://open-vsx.org/extension/Blevins83/git-commit-helper-blevins)

Cursor’s catalog can lag Open VSX by a few hours. Until it appears, install the VSIX:

```bash
npm run vsix
cursor --install-extension git-commit-helper-blevins-1.1.0.vsix
```

To publish (needs an [Open VSX access token](https://open-vsx.org/user-settings/tokens)):

```bash
export OVSX_PAT=your-token
npx ovsx create-namespace Blevins83   # first time only
npm run publish:ovsx
```

### Requirements

- VS Code or Cursor with VS Code API 1.74.0 or newer
- Git extension (built-in)
- An active Git repository

## Configuration

The extension works automatically without any configuration, but you can customize it:

```json
{
  "gitCommitHelper.autoPrefix": true,
  "gitCommitHelper.aiAssisted": true,
  "gitCommitHelper.ticketPattern": "([A-Za-z]+)-?(\\d+)"
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gitCommitHelper.autoPrefix` | `true` | Enable/disable automatic prefixing |
| `gitCommitHelper.aiAssisted` | `true` | Insert `ai(assisted)` after the ticket code |
| `gitCommitHelper.ticketPattern` | `"([A-Za-z]+)-?(\\d+)"` | Regex pattern to match ticket codes |

With `aiAssisted` off, the prefix is `PROJ-123: ` as in earlier versions.

### Pattern Examples

**Default Pattern** (works for most cases):
- `([A-Za-z]+)-?(\\d+)` - Matches: PROJ-123, task456, ABC-789, feature123

**Custom Patterns** for specific needs:
- `([A-Z]+)-(\\d+)` - Only uppercase with dash: PROJ-123, ABC-456
- `(JIRA|TASK|BUG)-(\\d+)` - Specific prefixes only: JIRA-123, TASK-456, BUG-789
- `([A-Za-z]{2,4})(\\d+)` - Letters + numbers without dash: PROJ123, TASK456

### How to Customize

1. Open Settings (Ctrl+,)
2. Search for "Git Commit Helper"
3. Modify the `ticketPattern` if needed
4. Or add to your `settings.json`:

```json
{
  "gitCommitHelper.ticketPattern": "(CUSTOM|PATTERN)-(\\d+)"
}
```

## Commands

While the extension works automatically, these commands are available:

- `Git Commit Helper: Extract and Prefix` - Manually extract and prefix current message
- `Git Commit Helper: Toggle Auto-Prefix` - Enable/disable automatic prefixing

## Troubleshooting

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

## Example Usage

```bash
# Works with ANY pattern automatically!

# Example 1: Traditional JIRA style
git checkout -b feature/PROJ-123-add-authentication
# Type "Add user login" → Becomes "PROJ-123: ai(assisted) Add user login"

# Example 2: GitHub issue style
git checkout -b fix/issue456-fix-bug
# Type "Fix critical bug" → Becomes "ISSUE-456: ai(assisted) Fix critical bug"

# Example 3: Custom team pattern
git checkout -b hotfix/ABC999-urgent-patch
# Type "Emergency patch" → Becomes "ABC-999: ai(assisted) Emergency patch"

# Example 4: Lowercase patterns
git checkout -b bugfix/task123-performance
# Type "Improve speed" → Becomes "TASK-123: ai(assisted) Improve speed"
```

**The extension automatically detects and formats ANY pattern!**

## Contributing

Found a bug or have a feature request?

1. Check existing issues on the [GitHub repository](https://github.com/your-repo/git-commit-helper-pm)
2. Create a new issue with detailed information
3. Pull requests are welcome!

## License

MIT License - See LICENSE file for details.

## Support

If you find this extension helpful, please:
- Rate it on the VS Code Marketplace
- Report issues or suggest improvements
- Share it with your team

**Enjoy seamless commit message prefixing!**
