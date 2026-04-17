---
name: tool-allocator
description: |
  Automatically manages MCP/Skill distribution across agents. Use when: 
  installing new MCP/Skill and needing allocation ("allocate new tool", "assign skill to agent"),
  checking tool usage ("which tools are unused", "tools not being used", "unused tools"),
  viewing available tools ("show me what tools", "what tools does", "tool distribution", "who has access to"),
  reviewing who uses which tool ("tool allocation", "check agent capabilities", "what can AICA do"),
  syncing allocations after installing new skill ("sync tool allocation", "update tool distribution"),
  or managing agent tool access ("assign tools to", "which agent has", "tool permissions").
version: 1.3
created: 2026-04-18
modified: 2026-04-18
tags: [opencode, tool-management, agent, workflow, automation, configuration]
author: memeflyfly
license: MIT
repository: https://github.com/memeflyfly/tool-allocator
bugs: https://github.com/memeflyfly/tool-allocator/issues
homepage: https://github.com/memeflyfly/tool-allocator
works-with:
  - opencode
  - claude-code
  - cursor
capabilities:
  - tool-discovery
  - agent-analysis
  - config-management
  - allocation-sync
keywords:
  - mcp allocation
  - skill distribution
  - agent tools
  - tool management
  - tool allocation
  - agent configuration
categories:
  - automation
  - configuration
  - tooling
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

## ⚠️ Common Gotchas

- **Config file must be valid YAML** - Use https://www.yamllint.com to validate before editing
- **Agent configs must exist before sync** - Create agents in opencode.json first
- **Memory updates require persistent-memory skill** - Skip if skill not installed
- **Sync only updates "## Tools" section** - Preserves all other content in agent MD files
- **Glob/Search patterns are case-sensitive** - Match exact tool names
- **Backups use .bak extension** - Don't confuse with original files
- **Don't allocate by name alone** - "detector" ≠ BA, "frontend" ≠ designer. Always check the actual skill functionality and domain before allocating. Example: requirement-detector/style-detector are for novel-writing, not general BA work.

## Edge Cases

- **New agent with no MD file** → Skip silently, continue with other agents
- **Tool already allocated** → Skip (no duplicates in allocation)
- **Circular permissions** → Handled by max depth 3 in permission chain analysis
- **Empty opencode.json** → Warn but continue with empty discovery
- **MCP with no tools listed** → Skip MCP, continue with others
- **Skill without SKILL.md** → Use folder name as fallback identifier
- **Duplicate tool names** → First discovered takes precedence
- **Tools named with generic terms** → Don't assume! Tools like "requirement-detector" or "style-detector" seem like BA/UX tools by name, but check their actual domain. requirement-detector/style-detector are for novel-writing, not general analysis.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-12 | Initial release |
| 1.1 | 2026-04-18 | English rewrite |
| 1.2 | 2026-04-18 | Added metadata, references structure |
| 1.3 | 2026-04-18 | Added gotchas, edge cases, capabilities, keywords |
| 1.3.1 | 2026-04-18 | Fixed: Don't allocate by name alone - check actual tool functionality |

---

MIT License