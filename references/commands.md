# Tool Allocator - Detailed Commands Reference

## sync Command

The main command that discovers, analyzes, and allocates all tools.

### Usage

```bash
node scripts/index.js sync
```

### What It Does

1. **Discovery Phase**
   - Scans `opencode.json` for MCP configurations
   - Scans `~/.config/opencode/skills/` for Skills
   - Scans `~/.agents/skills/` for Agent Skills
   - Discovers all configured Agents

2. **Analysis Phase**
   - Reads each tool's SKILL.md
   - Extracts name, description, tags
   - Builds tool capability inventory

3. **Agent Detection Phase**
   - Analyzes Agent MD files for keywords
   - Checks permission chains
   - Examines descriptions
   - Matches name patterns

4. **Matching Phase**
   - Matches tool capabilities to agent roles
   - Applies custom rules from config
   - Considers exclusions

5. **Sync Phase**
   - Updates each Agent's config file
   - Updates global memory
   - Generates report

### Output

```
✅ Tool allocation sync complete
📊 Allocation Overview:
   ┌─────────────────────────┬────────────────────┐
   │ Tool                    │ Assigned To        │
   ├─────────────────────────┼────────────────────┤
   │ playwright              │ AIUIUX, AITA, AICA │
   │ memory                  │ everyone           │
   └─────────────────────────┴────────────────────┘

🔄 Updated:
   ✓ Agent/AIBA.md
   ✓ Agent/AIUIUX.md
   ...

💡 Tip: Reload session for agents to detect changes
```

---

## list Command

Shows the current tool allocation for each agent.

### Usage

```bash
node scripts/index.js list
```

### Output

```
📋 Current Tool Allocation

### AIBA
   - cocoloop (skill)
   - memory (mcp)
   - lark-im (mcp)
   ...

### AICA
   - playwright (mcp)
   - supabase (mcp)
   - clerk (mcp)
   ...
```

---

## check Command

Identifies tools that are installed but not assigned to any agent.

### Usage

```bash
node scripts/index.js check
```

### Output

```
🔍 Tool Usage Check

✅ In Use:
   - chrome-cdp ← AIUIUX, AITA, AICA
   - playwright ← AIUIUX, AITA, AICA

⚠️ Unused:
   - vercel-react-native-skills ← never used
```

### What to Do When Unused Tools Found

1. Check if the tool should be excluded in config
2. Add to exclusion list if not needed
3. Or manually assign in agent config

---

## Debug Command

Shows detailed agent role detection analysis.

### Usage

```bash
node scripts/index.js debug
```

### Output Shows

- Identified roles for each agent
- Evidence sources with scores
- How each dimension contributed

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (check error message) |

---

## Environment Requirements

- Node.js 16+
- Access to `~/.config/opencode/`
- Write permission to Agent config directory