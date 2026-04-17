---
name: tool-allocator
description: Automatically manages MCP/Skill distribution across agents. Use when: installing new MCP/Skill and needing allocation, checking tool usage, viewing available tools, or reviewing who uses which tool.
version: 1.2
created: 2026-04-18
modified: 2026-04-18
tags: [opencode, tool-management, agent, workflow, automation]
author: memeflyfly
license: MIT
repository: https://github.com/memeflyfly/tool-allocator
bugs: https://github.com/memeflyfly/tool-allocator/issues
homepage: https://github.com/memeflyfly/tool-allocator
works-with:
  - opencode
  - claude-code
  - cursor
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - filesystem_list_directory
  - filesystem_read_file
---

# Tool Allocator

> The tool allocation manager — helps every Agent know which tools to use

---

## When to Use This Skill

Activate this skill when you need to:

- **Install new tools**: "I just installed a new MCP/Skill, allocate it"
- **Check usage**: "Which tools are not being used?"
- **View allocation**: "Show me what tools are assigned to which agents"
- **Review inventory**: "What tools do I have available?"

---

## Quick Start

```bash
# Sync all tools (auto-discovers + allocates)
node scripts/index.js sync

# List current allocation
node scripts/index.js list

# Check for unused tools
node scripts/index.js check
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `sync` | Discover all MCPs/Skills, analyze capabilities, allocate to agents |
| `list` | Show current tool allocation by agent |
| `check` | Find tools that are installed but not used |

---

## Example Output

### sync command

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
   ✓ Agent/AITA.md
   ✓ Agent/AICA.md
```

### check command

```
🔍 Tool Usage Check

✅ In Use:
   - chrome-cdp ← AIUIUX, AITA, AICA
   - playwright ← AIUIUX, AITA, AICA

⚠️ Unused:
   - none found
```

---

## How It Works

1. **Discovery** → Scan opencode.json + skills directories
2. **Analysis** → Read SKILL.md, extract capabilities
3. **Detection** → 4-dim agent role analysis
4. **Matching** → Match tools to agents
5. **Sync** → Update config files

---

## Prerequisites

- OpenCode environment
- 3+ MCPs or Skills installed
- 2+ agents configured
- Node.js 16+

---

## File Structure

```
tool-allocator/
├── SKILL.md              # This file
├── REFERENCES.md         # Detailed reference
├── tool-allocator.config.yaml
├── scripts/
│   ├── index.js          # Entry point
│   ├── discover.js       # Tool/Agent discovery
│   ├── analyzer.js       # Capability analysis
│   ├── matcher.js        # Role detection
│   └── allocator.js      # Config sync
├── references/
│   ├── commands.md       # Detailed commands
│   ├── config.md         # Configuration guide
│   └── matching-rules.md # Algorithm deep-dive
├── examples/
│   └── real-usage.md    # Real usage scenarios
└── README.md
```

---

## Configuration

```yaml
# Custom matching rules
rules:
  "frontend-design": ["frontend", "design"]
  "playwright": ["verification", "frontend"]
  "memory": ["*"]  # * = everyone

# Exclude tools
exclude:
  - "chrome-cdp"
```

---

## Allocation Rules

| Tool Capability | Matches | Example |
|-----------------|---------|---------|
| `frontend` | `frontend`, `design` | Coder, Designer |
| `verification` | `verification`, `frontend` | Coder, Architect |
| `design` | `design`, `ui-ux` | Designer |
| `*` | everyone | memory, search |

---

## FAQ

**Q: Does it overwrite manual changes?**
A: No. Only updates "tool list" section.

**Q: Allocation wrong?**
A: Edit config rules, re-run sync.

**Q: Custom agents supported?**
A: Yes. Auto-reads from opencode.json.

---

## Notes

- Run `list` first to see current state
- Sync auto-backs up files (.bak)
- Run `check` periodically

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-12 | Initial release |
| 1.1 | 2026-04-18 | English rewrite |
| 1.2 | 2026-04-18 | Added metadata, references structure |

---

MIT License