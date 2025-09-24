# Change Log

All notable changes to the "Git Commit Helper by PranitModi" extension will be documented in this file.

## [1.0.2] - 2025-09-24

### Fixed
- **Compatibility Issue**: Lowered minimum VS Code version requirement from 1.104.0 to 1.74.0
- Updated TypeScript compilation target from ES2022 to ES2020 for better compatibility
- Updated ECMAScript version in ESLint config from 2022 to 2020
- Changed TypeScript module system from Node16 to CommonJS for broader support

### Changed
- Extension now supports VS Code versions 1.74.0 and above (November 2022+)
- Updated @types/vscode dependency to match minimum version requirement
- More compatible build configuration for older VS Code installations

### Notes
- This version maintains all existing functionality while supporting a much wider range of VS Code versions
- All features tested and working on VS Code 1.74.0+

## [1.0.1] - 2025-09-24

### Added
- Added extension marketplace icon (`icon.png`) (black & white style)
- Updated package manifest to reference new icon

### Internal
- Version bump for distribution with visual branding

## [1.0.0] - 2025-09-23

### Added
- **Initial public release** on VS Code Marketplace
- **Universal Pattern Detection**: Automatically detects ANY ticket pattern (PROJ-123, TASK456, ABC-789, etc.)
- **Smart Pattern Recognition**: Works with or without dashes, any letter combinations
- **Auto-Prefixing**: Automatically adds ticket codes to commit messages as you type
- **Fully Configurable**: Customize regex patterns for your specific workflow with examples
- **Smart Prevention**: Prevents duplicate prefixes and respects existing messages
- **Zero Configuration**: Works out of the box - detects common patterns automatically
- **Manual Commands**: Extract/prefix and toggle functionality available
- **Comprehensive Logging**: Debug-friendly with detailed console output

### Features
- Supports any branch pattern: `feature/PROJ-123-description`, `bugfix/task456-fix`, etc.
- Automatically formats and prefixes commits: `PROJ-123: your message`
- Default pattern `([A-Za-z]+)-?(\\d+)` matches virtually any ticket system
- Configurable through VS Code settings
- Works with multiple repositories in workspace
- Polling-based input monitoring for reliable detection
- Always formats output with dashes (ABC123 → ABC-123)
- Case-insensitive detection with uppercase output

### Technical
- Built with TypeScript and VS Code Extension API
- Uses Git extension API for repository access
- Webpack bundling for optimized distribution
- ESLint configuration for code quality
- MIT License for open source usage
- Robust error handling for custom patterns