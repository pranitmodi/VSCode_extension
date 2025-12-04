# Release Steps for Git Commit Helper Extension v1.0.3

## Pre-Release Checklist

### 1. Testing
- [ ] Test extension in Extension Development Host (F5)
- [ ] Verify ticket prefix appears when staging files
- [ ] Test manual typing after prefix
- [ ] Test with Copilot sparkle button (if available)
- [ ] Test all three condensing strategies (smart, first-sentence, first-line)
- [ ] Test with multiple repositories
- [ ] Test with different branch patterns (PROJ-123, task456, ABC-999, etc.)
- [ ] Verify all configuration settings work
- [ ] Check console logs for errors

### 2. Code Quality
- [ ] Run `npm run lint` - ensure no errors
- [ ] Run `npm run compile` - verify successful compilation
- [ ] Review all changes in git diff
- [ ] Ensure no debug console.logs in production code (or keep intentional ones)

### 3. Documentation
- [x] Updated CHANGELOG.md with v1.0.3 changes
- [x] Updated README.md with new features
- [x] Verified package.json version is 1.0.3
- [x] Added new keywords: copilot, ai, github copilot, smart commit
- [x] Updated description to mention AI formatting

## Release Process

### Step 1: Final Testing
```bash
# Compile the extension
npm run compile

# Run tests (if any)
npm test

# Launch Extension Development Host
# Press F5 in VS Code
# Test all features manually
```

### Step 2: Build Production Package
```bash
# Create optimized production build
npm run package

# This creates: git-commit-helper-blevins-1.0.3.vsix
```

### Step 3: Test the .vsix Package
```bash
# Install the .vsix locally to test
code --install-extension git-commit-helper-blevins-1.0.3.vsix

# Test in a real VS Code window (not Extension Development Host)
# Uninstall after testing
```

### Step 4: Commit and Tag Release
```bash
# Stage all changes
git add .

# Commit with version tag
git commit -m "Release v1.0.3: Add Copilot integration and auto-prefix on staging"

# Create git tag
git tag v1.0.3

# Push to repository
git push origin master
git push origin v1.0.3
```

### Step 5: Publish to VS Code Marketplace

#### Option A: Using vsce Command Line Tool

1. **Install vsce** (if not already installed):
```bash
npm install -g @vscode/vsce
```

2. **Login to marketplace** (first time only):
```bash
# You need a Personal Access Token (PAT) from Azure DevOps
# Get it from: https://dev.azure.com/[your-org]/_usersSettings/tokens
# Permissions needed: Marketplace > Manage

vsce login Blevins83
# Enter your PAT when prompted
```

3. **Publish the extension**:
```bash
# Publish to marketplace (increments version automatically)
vsce publish

# Or publish specific version
vsce publish 1.0.3

# Or publish from .vsix file
vsce publish git-commit-helper-blevins-1.0.3.vsix
```

#### Option B: Using Web Interface

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage/publishers/Blevins83)
2. Click on your extension "Git Commit Helper by PranitModi"
3. Click "Update"
4. Upload the .vsix file: `git-commit-helper-blevins-1.0.3.vsix`
5. Wait for validation (usually takes a few minutes)
6. Click "Publish" once validation passes

### Step 6: Verify Publication

1. Check extension page: https://marketplace.visualstudio.com/items?itemName=Blevins83.git-commit-helper-blevins
2. Verify version shows 1.0.3
3. Check that README displays correctly
4. Verify changelog is visible
5. Test installation from marketplace:
```bash
code --install-extension Blevins83.git-commit-helper-blevins
```

## Post-Release

### 1. Announcement
- [ ] Update GitHub repository README (if separate from extension)
- [ ] Create GitHub Release with notes from CHANGELOG.md
- [ ] Share on social media/developer communities (if desired)

### 2. Monitor
- [ ] Watch for user feedback/issues
- [ ] Monitor marketplace ratings and reviews
- [ ] Check download statistics

### 3. Next Steps
- [ ] Plan next version features
- [ ] Address any reported issues
- [ ] Update documentation based on user feedback

## Troubleshooting

### Publishing Issues

**Error: "Personal Access Token is invalid"**
- Generate new PAT from Azure DevOps
- Ensure PAT has "Marketplace > Manage" permission
- Login again: `vsce login Blevins83`

**Error: "Version already exists"**
- Increment version in package.json
- Run `npm run package` again
- Publish with new version

**Validation Errors**
- Check that all required fields in package.json are filled
- Verify icon file (icon.png) exists and is valid
- Ensure README.md has no broken links
- Check that LICENSE file exists

## Quick Commands Reference

```bash
# Development
npm run compile          # Compile TypeScript
npm run watch           # Watch mode for development
npm run lint            # Run ESLint
npm test               # Run tests

# Packaging
npm run package        # Create production .vsix file

# Publishing
vsce login Blevins83          # Login to marketplace
vsce publish                  # Publish new version
vsce publish 1.0.3           # Publish specific version
vsce ls                       # List published versions

# Git
git tag v1.0.3               # Create version tag
git push origin v1.0.3       # Push tag to remote
```

## Version 1.0.3 Highlights

### New Features
- Auto-prefix appears when staging files
- GitHub Copilot integration with automatic message formatting
- Smart message condensing with three strategies
- Enhanced AI-generated message detection
- New configuration options

### Marketing Points
- **"Stage files and start typing"** - No more manual prefix typing
- **"Works with or without Copilot"** - Provides value regardless
- **"Minimizes AI calls"** - Cost-effective for users
- **"Smart formatting"** - Keeps commit messages concise and professional

## Support

For issues or questions:
- GitHub Issues: https://github.com/PranitModi/git-commit-helper-pm/issues
- VS Code Marketplace Q&A section
- Email: [your-email]@example.com
