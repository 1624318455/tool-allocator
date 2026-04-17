# Tool Allocator - Matching Rules Deep Dive

## Overview

The tool allocator uses a sophisticated multi-dimensional matching algorithm to automatically assign tools to agents based on their roles and capabilities.

---

## Matching Process

```
Tool Discovery → Capability Analysis → Agent Detection → Matching → Allocation
```

---

## Step 1: Tool Capability Analysis

Each tool is analyzed to determine its capabilities based on:

### 1.1 Name Keywords

| Keyword | Capability |
|---------|------------|
| `frontend`, `react`, `ui` | frontend |
| `backend`, `api`, `database` | backend |
| `test`, `playwright`, `verification` | verification |
| `design`, `ui`, `ux` | design |
| `architecture`, `system` | architecture |
| `memory`, `storage` | storage |
| `lark`, `feishu` | collaboration |

### 1.2 SKILL.md Tags

Tools can declare their capabilities in SKILL.md frontmatter:

```yaml
---
name: playwright
description: Browser automation and testing
capabilities: [verification, frontend, testing]
---
```

### 1.3 Built-in Mapping

The matcher has built-in capability mappings:

```javascript
const TOOL_CAPABILITIES = {
  // Frontend
  'frontend-design': ['frontend', 'design'],
  'react': ['frontend', 'code'],
  'vercel-react-best-practices': ['frontend', 'architecture'],
  
  // Backend
  'supabase': ['backend', 'database'],
  'neon': ['backend', 'database'],
  'prisma': ['backend', 'database'],
  
  // Verification
  'playwright': ['verification', 'frontend'],
  'testing': ['verification'],
  
  // Collaboration
  'lark-*': ['collaboration'],
  'lark-im': ['collaboration'],
  
  // Global
  'memory': ['*'],  // Everyone
  'search': ['*'],  // Everyone
};
```

---

## Step 2: Agent Role Detection

Agents are analyzed across 4 dimensions to determine their roles:

### 2.1 Dimension 1: MD File Content Analysis (Highest Weight)

Read the agent's `.md` configuration file and analyze:
- Existing tool list (if already configured)
- Keywords: code, design, architecture, requirements, etc.
- Verbs: generate, design, analyze, build, etc.
- Deliverables: "requirements doc", "design spec", "code implementation"

### 2.2 Dimension 2: Permission Chain Analysis

From `opencode.json`, analyze what other agents this agent can call:
- Can call `AICA` → likely architect
- Can call `AITA` → likely designer
- Can call `AIUIUX` → likely BA

### 2.3 Dimension 3: Description Field Analysis

Check the `description` field in agent config:
- Role keywords
- Action verbs
- Output descriptions

### 2.4 Dimension 4: Name Pattern (Fallback)

Check agent name for common patterns:
- `*coder*`, `*developer*`, `*engineer*` → coder
- `*designer*`, `*ui*`, `*ux*` → designer
- `*architect*`, `*ta*` → architect
- `*ba*`, `*analyst*`, `*需求*` → ba

---

## Step 3: Role Scoring

Each dimension contributes a score:

```
Total Score = Dimension1_Score + Dimension2_Score + Dimension3_Score + Dimension4_Score
```

### Example Output

```
AICA:
   Identified: coder (score: 49), designer (score: 38), architect (score: 31)
   
   Evidence:
   - coder (49) <- MD:keyword:coding, MD:verb:generate, MD:deliverable:code
   - designer (38) <- MD:existing_tools, MD:keyword:design
   - architect (31) <- MD:keyword:architecture, MD:verb:architect
```

---

## Step 4: Matching Algorithm

### 4.1 Basic Matching

```
For each tool:
  1. Get tool capabilities
  2. For each agent:
     - Get agent roles (with scores)
     - Calculate overlap score
     - If score > threshold, add to recommendations
```

### 4.2 Rule Override

Custom rules in config take precedence:

```yaml
rules:
  "playwright": ["verification", "frontend"]  # Force these tags
  "memory": ["*"]  # Everyone gets memory
```

### 4.3 Exclusion

Excluded tools are never allocated:

```yaml
exclude:
  - "chrome-cdp"  # Won't be allocated
```

### 4.4 Global Tools

Tools with `*` capability are allocated to ALL agents:

```yaml
TOOL_CAPABILITIES = {
  'memory': ['*'],
  'search': ['*'],
}
```

---

## Matching Flowchart

```
┌─────────────────┐
│   Tool Found    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Get Capabilities│
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Rule    │──Yes──→ Apply rule override
    │ Override?│
    └────┬────┘
         │ No
         ↓
    ┌────┴────┐
    │ Excluded?│──Yes──→ Skip
    └────┬────┘
         | No
         ↓
┌─────────────────┐
│ Get Agent Roles │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Calculate Match │
│    Score        │
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Score   │──Yes──→ Add to recommendations
    │ > 0?     │
    └────┬────┘
         | No
         ↓
┌─────────────────┐
│ Skip (no match) │
└─────────────────┘
```

---

## Customization

### Adding Custom Rules

Edit `tool-allocator.config.yaml`:

```yaml
rules:
  "my-custom-tool": ["frontend", "design"]
```

### Excluding Tools

```yaml
exclude:
  - "experimental-tool"
```

### Custom Agent Tags

```yaml
agents:
  - name: "MyAgent"
    tags: ["custom-tag"]
```

---

## Debugging

To see how matching works:

```bash
node scripts/index.js debug
```

This shows:
- All detected roles for each agent
- Evidence sources
- Match scores