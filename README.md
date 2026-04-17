# Tool Allocator

> The tool allocation manager — helps every Agent know which tools to use

## Quick Description

Automatically manages MCP/Skill distribution across agents. Solves the problem of "installed tools but no one uses them" by intelligently matching tools to the right agents based on their roles.

## Who Is This For?

| Your Situation | Recommendation |
|----------------|----------------|
| Installed 5+ MCPs or Skills | ⭐⭐⭐⭐⭐ |
| Configured multiple Agents (BA, Designer, Architect, Coder) | ⭐⭐⭐⭐⭐ |
| Frequently install new tools, manual config is tedious | ⭐⭐⭐⭐ |
| Agents don't know what tools are available | ⭐⭐⭐⭐ |
| Team collaboration needs unified tool standards | ⭐⭐⭐⭐ |
| Only a few tools, enough for use | ⭐ |
| Single Agent, no distribution needed | ⭐ |

## Installation

```bash
# Method 1: Using cocoloop
/cocoloop install tool-allocator

# Method 2: Manual install
# Copy this folder to ~/.opencode/skills/tool-allocator/
```

## Quick Start

```bash
# Navigate to scripts directory
cd ~/.opencode/skills/tool-allocator/scripts

# Sync all tool allocations
node index.js sync

# View current allocation
node index.js list

# Check unused tools
node index.js check
```

## How It Works

```
Install new tool
    ↓
Run: node index.js sync
    ↓
Auto-analyze tool capabilities
    ↓
Match to appropriate Agents
    ↓
Update config files
    ↓
Agent reloads session
```

## Example Output

```
✅ Tool allocation sync complete

📊 Allocation Overview:
   ┌─────────────────────────┬────────────────────┐
   │ Tool                    │ Assigned To        │
   ├─────────────────────────┼────────────────────┤
   │ playwright              │ AIUIUX, AITA, AICA │
   │ supabase                │ AITA, AICA         │
   │ memory                  │ everyone           │
   └─────────────────────────┴────────────────────┘

🔄 Updated:
   ✓ Agent/AIBA.md
   ✓ Agent/AIUIUX.md
   ✓ .opencode_memory.md

💡 Tip: Reload session for agents to detect changes
```

## Configuration

Edit `tool-allocator.config.yaml` to customize allocation:

```yaml
agents:
  - name: "Coder"
    tags: ["frontend", "backend", "verification"]

rules:
  "frontend-design": ["frontend", "design"]
  "playwright": ["verification", "frontend"]
  "memory": ["*"]

exclude:
  - "chrome-cdp"
```

## Prerequisites

- Node.js 16+
- OpenCode environment
- Installed MCP or Skill
- Configured Agents

## Documentation Structure

```
tool-allocator/
├── SKILL.md              # Main skill file
├── REFERENCES.md         # Quick reference
├── references/
│   ├── commands.md      # Detailed commands
│   ├── config.md        # Configuration guide
│   └── matching-rules.md
├── examples/
│   └── real-usage.md    # Real usage scenarios
├── CHANGELOG.md         # Version history
└── package.json
```

## Commands

| Command | Description |
|---------|-------------|
| `sync` | Discover all tools and allocate to agents |
| `list` | Show current tool allocation |
| `check` | Find unused tools |
| `debug` | Show agent role detection details |

## FAQ

**Q: Does it overwrite my manual changes?**
A: No. Only updates the "tool list" section, other content remains unchanged.

**Q: What if allocation is wrong?**
A: Edit the `rules` section in config, then re-run sync.

**Q: Custom agents supported?**
A: Yes. Auto-reads from opencode.json or use manual config.

## License

MIT

## Contributing

Pull requests and issues are welcome!