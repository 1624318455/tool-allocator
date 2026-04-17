# Changelog

All notable changes to tool-allocator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-18

### Added
- SKILL.md frontmatter enhancements:
  - `capabilities` field with tool capability tags
  - `keywords` field for search optimization
  - `categories` field for classification
- **Common Gotchas** section in SKILL.md (6 items → 7 items)
- **Edge Cases** section in SKILL.md (7 items → 8 items)

### Changed
- Expanded description field with multiple trigger phrase variants
- Improved trigger phrase coverage for better AI activation

### Fixed
- Added gotcha: "Don't allocate by name alone" - warns against allocating based on tool name without checking actual functionality
- Added edge case: "Tools named with generic terms" - warns against assuming tools like requirement-detector are BA tools just because they sound like it

## [1.2.0] - 2026-04-18

### Added
- Enhanced SKILL.md frontmatter with:
  - `allowed-tools` declaration for tool permissions
  - `repository` and `bugs` URLs for issue tracking
  - `works-with` declaration for cross-platform compatibility (OpenCode, Claude Code, Cursor)
- Created `references/` directory with detailed documentation:
  - `references/commands.md` - Detailed command reference
  - `references/config.md` - Configuration guide
  - `references/matching-rules.md` - Matching algorithm deep-dive
- Created `examples/` directory:
  - `examples/real-usage.md` - 6 real-world usage scenarios with trigger prompts

### Changed
- Rewrote all output messages to English for international compatibility
- Updated SKILL.md to use progressive disclosure (main file ~175 lines, details in references/)
- Added version history table to SKILL.md

### Improved
- Better trigger phrases in description for AI activation
- More realistic usage examples that match how users actually prompt

## [1.1.0] - 2026-04-18

### Added
- Complete English rewrite of SKILL.md
- Clear trigger phrases in description

### Changed
- Simplified SKILL.md structure for better readability
- Updated description to include usage scenarios

## [1.0.0] - 2026-04-12

### Added
- Initial release
- Tool discovery (MCPs and Skills)
- Agent role detection (4-dimensional analysis)
- Smart tool allocation
- Configuration management
- Usage checking (find unused tools)

### Features
- `sync` - Discover and allocate all tools
- `list` - Show current allocation
- `check` - Find unused tools
- Multi-dimensional agent role detection
- Custom matching rules
- Tool exclusion support