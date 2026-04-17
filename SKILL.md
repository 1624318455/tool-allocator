---
name: tool-allocator
description: Use when managing MCP or Skill installation across agents, checking which tools are unused, viewing tool allocation by agent, or syncing tool distribution after installing new skills.
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

### Two Types of Tools

| Type | Description | Example |
|------|-------------|---------|
| **Generic** | Available to main agent (OpenCode), no allocation needed | memory, one-search, cocoloop, persistent-memory, tool-allocator, url-capability-analyzer |
| **Domain-specific** | Allocated to specific sub-agents based on domain | playwright → frontend agents, novel-writer-skills → AINovelAssist |

### Matching Examples

| Tool Capability | Matches | Example |
|-----------------|---------|---------|
| `frontend` | `frontend`, `design` | AIUIUX, AITA, AICA |
| `verification` | `verification`, `frontend` | AITA, AICA |
| `design` | `design`, `ui-ux` | AIUIUX |
| `novel-writing` | novel domain | AINovelAssist |
| `novel-editing` | critique domain | AINovelEditorCritic |

> ⚠️ Don't use `*` for generic tools - they don't need allocation. Only configure domain-specific rules. |

---

## ⚠️ Common Gotchas

- **Config file must be valid YAML** - Use https://www.yamllint.com to validate before editing
- **Agent configs must exist before sync** - Create agents in opencode.json first
- **Memory updates require persistent-memory skill** - Skip if skill not installed
- **Sync only updates "## Tools" section** - Preserves all other content in agent MD files
- **Glob/Search patterns are case-sensitive** - Match exact tool names
- **Backups use .bak extension** - Don't confuse with original files
- **Don't allocate by name alone** - Decision process: (1) Read SKILL.md description to understand actual domain; (2) Check provider (google-gemini → code, novel-writer → novel); (3) Match to agent's core responsibility. Example: requirement-detector (novel domain) ≠ BA tool, google-gemini-code-reviewer (code domain) = AITA/AICA.
- **Don't force allocation for generic tools** - Tools like memory, one-search, cocoloop, persistent-memory, tool-allocator, url-capability-analyzer are "Swiss Army knives" - main agent can use them directly. Only domain-specific tools need allocation.

## Edge Cases

- **New agent with no MD file** → Skip silently, continue with other agents
- **Tool already allocated** → Skip (no duplicates in allocation)
- **Circular permissions** → Handled by max depth 3 in permission chain analysis
- **Empty opencode.json** → Warn but continue with empty discovery
- **MCP with no tools listed** → Skip MCP, continue with others
- **Skill without SKILL.md** → Use folder name as fallback identifier
- **Duplicate tool names** → First discovered takes precedence
- **Tools with misleading names** → Read description + check provider. "detector" sounds like BA but requirement-detector is for novels; "google-gemini" is code-related even though it could be used for novels.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-12 | Initial release |
| 1.1 | 2026-04-18 | English rewrite |
| 1.2 | 2026-04-18 | Added metadata, references structure |
| 1.3 | 2026-04-18 | Added gotchas, edge cases, capabilities, keywords |
| 1.3.1 | 2026-04-18 | Fixed: Don't allocate by name alone - check actual tool functionality |
| 1.3.2 | 2026-04-18 | Distribution: 14 unused tools allocated + decision process improved |
| 1.4.0 | 2026-04-18 | Generic vs domain-specific principle - don't force allocation for generic tools |

---

MIT License