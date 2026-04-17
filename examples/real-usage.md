# Tool Allocator - Real Usage Examples

## Overview

This file provides realistic prompts and scenarios for triggering tool-allocator effectively. These are the exact phrases users can use to get the best results.

---

## Scenario 1: After Installing a New MCP

### User Prompt
```
I just installed the neon MCP for database management. Can you allocate it to the right agents?
```

### AI Response Flow
1. Detects "allocate" keyword → Activates tool-allocator
2. Runs `node scripts/index.js sync`
3. Discovers new MCP: `neon`
4. Analyzes capabilities: database, backend
5. Matches to agents with database/backend tags: AITA, AICA, AIGameTA
6. Updates Agent configs
7. Reports: "Allocated neon to AITA, AICA, AIGameTA"

### Expected Output
```
✅ Tool allocation sync complete
📊 neon → AITA, AICA, AIGameTA
🔄 Updated: Agent/AITA.md, Agent/AICA.md
```

---

## Scenario 2: Checking Unused Tools

### User Prompt
```
Which of my installed tools are not being used by any agent?
```

### AI Response Flow
1. Detects "not being used" / "unused" → Activates tool-allocator
2. Runs `node scripts/index.js check`
3. Compares installed tools vs allocated tools
4. Reports tools with zero assignments

### Expected Output
```
🔍 Tool Usage Check

✅ In Use:
   - playwright ← AIUIUX, AITA, AICA
   - supabase ← AITA, AICA
   - memory ← all agents

⚠️ Unused:
   - vercel-react-native-skills ← never used
   - chrome-cdp ← never used (consider excluding)
```

---

## Scenario 3: Viewing Current Allocation

### User Prompt
```
Show me what tools each of my agents has access to.
```

### AI Response Flow
1. Detects "show tools" / "what tools" → Activates tool-allocator
2. Runs `node scripts/index.js list`
3. Formats and displays allocation

### Expected Output
```
📋 Current Tool Allocation

### AIBA (35 tools)
   - cocoloop, memory, lark-im, lark-doc, ...
   - one-search, filesystem

### AITA (25 tools)
   - playwright, supabase, clerk, neon, ...
   - one-search, memory
```

---

## Scenario 4: After Installing New Skill

### User Prompt
```
I added the summarize-pro skill for document summarization. Assign it to the appropriate agents.
```

### AI Response Flow
1. Detects "assigned" / "assign" → Activates tool-allocator
2. Runs `sync`
3. Discovers new skill: `summarize-pro`
4. Analyzes: summarization, documentation
5. Matches to: AIBA, AIGameBA (documentation/analysis related)
6. Updates configs

### Expected Output
```
✅ Tool allocation sync complete
📊 summarize-pro → AIBA, AIGameBA
🔄 Updated: Agent/AIBA.md, Agent/AIGameBA.md
```

---

## Scenario 5: Reviewing Allocated Tools

### User Prompt
```
Who has access to playwright and which agents can do testing?
```

### AI Response Flow
1. Detects specific tool names → Activates tool-allocator
2. Runs `list` and filters for specific tools
3. Reports which agents have those tools

### Expected Output
```
📊 Tool Access Report

playwright:
   → AIUIUX, AITA, AICA

Testing tools (playwright, testing):
   → AIUIUX, AITA, AICA
```

---

## Scenario 6: Troubleshooting Allocation

### User Prompt
```
The supabase MCP is not showing up in my AICA agent. Can you check and fix the allocation?
```

### AI Response Flow
1. Detects "not showing" / "fix allocation" → Activates tool-allocator
2. Runs `sync` to refresh
3. Verifies supabase is allocated to AICA
4. If missing, investigates why
5. Fixes and reports

### Expected Output
```
✅ Tool allocation sync complete
📊 supabase → AITA, AICA, AIGameTA (verified)

AICA now has access to supabase. Please reload your session.
```

---

## Prompt Patterns That Trigger Tool-Allocator

| Trigger Pattern | Example Prompt |
|-----------------|----------------|
| "allocate" | "Allocate the new MCP to agents" |
| "assign" | "Assign this skill to the right agent" |
| "unused" | "Which tools are unused?" |
| "not being used" | "Tools not being used" |
| "what tools" | "What tools does AITA have?" |
| "who has" | "Who has access to supabase?" |
| "sync allocation" | "Sync the tool allocation" |
| "tool distribution" | "Check tool distribution across agents" |

---

## Best Practices

1. **After installing any new tool**: Run allocation sync
2. **Regular check**: Run `check` monthly to find unused tools
3. **View before working**: Use `list` to see what each agent can access
4. **Debug**: If allocation seems wrong, use `debug` to see how roles were detected

---

## Integration with Other Skills

Tool-allocator works well with:

- **tool-allocator**: Self-management
- **memory**: Remember allocation decisions
- **cocoloop**: When installing new skills
- **opencode-agent-relay**: Workflow automation

---

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| New tool not allocated | Run `sync` manually |
| Tool in wrong agent | Add custom rule to config |
| Tool shows as unused but shouldn't be | Check it's not in exclude list |
| Agent not detected correctly | Use `debug` to see detection |