# Tool Allocator - Configuration Guide

## Overview

Tool-allocator uses a YAML configuration file to control tool allocation behavior. The config file is optional - the tool works well with defaults but can be customized for specific needs.

## Configuration File Location

```
tool-allocator/
└── tool-allocator.config.yaml
```

**Note**: The config file is auto-created on first run if it doesn't exist.

## Configuration Structure

```yaml
# Agent definitions (auto-read from opencode.json, can override)
agents:
  - name: "AICA"
    tags: ["frontend", "backend", "verification"]
  - name: "AIUIUX"
    tags: ["design", "ui-ux"]

# Custom matching rules
rules:
  # Tool name → Agent tags
  "frontend-design": ["frontend", "design"]
  "playwright": ["verification", "frontend"]
  "memory": ["*"]  # * = everyone
  "search": ["*"]

# Exclude tools from allocation
exclude:
  - "chrome-cdp"  # Duplicate of playwright
```

---

## agents Section

### Purpose

Define agent roles with tags for matching. Normally auto-detected from opencode.json, but can be manually specified here.

### Format

```yaml
agents:
  - name: "AgentName"
    tags: ["tag1", "tag2"]
```

### Example

```yaml
agents:
  - name: "Coder"
    tags: ["frontend", "backend", "verification"]
  - name: "Designer"
    tags: ["design", "ui-ux"]
  - name: "Architect"
    tags: ["architecture", "technical-design"]
```

---

## rules Section

### Purpose

Override or add custom matching rules. Maps tool names to agent tags.

### Format

```yaml
rules:
  "tool-name": ["tag1", "tag2"]
```

### Special Values

| Value | Meaning |
|-------|---------|
| `*` | Match all agents |
| `tag` | Match agents with this tag |

### Common Patterns

```yaml
# Frontend tools
"frontend-design": ["frontend", "design"]
"react": ["frontend", "code"]

# Backend tools
"prisma": ["backend", "database"]
"api": ["backend", "architecture"]

# Testing tools
"playwright": ["verification", "frontend"]
"vitest": ["frontend", "testing"]

# Global tools
"memory": ["*"]
"search": ["*"]
```

---

## exclude Section

### Purpose

Prevent specific tools from being allocated to any agent.

### Format

```yaml
exclude:
  - "tool-name-1"
  - "tool-name-2"
```

### Example

```yaml
exclude:
  - "chrome-cdp"  # Duplicates playwright
  - "experimental-tool"  # Not ready for use
```

---

## Complete Example

```yaml
# Agent definitions
agents:
  - name: "AICA"
    tags: ["coding", "frontend", "backend"]
  - name: "AIUIUX"
    tags: ["design", "ui", "ux"]
  - name: "AITA"
    tags: ["architecture", "technical"]

# Custom matching rules
rules:
  # Frontend
  "frontend-design": ["frontend", "design", "ui", "ux"]
  "react": ["frontend", "coding"]
  "vercel-react-best-practices": ["frontend", "architecture"]
  
  # Database
  "supabase": ["backend", "architecture"]
  "neon": ["backend", "architecture"]
  "prisma": ["backend"]
  
  # Testing
  "playwright": ["verification", "frontend"]
  "testing": ["verification"]
  
  # Global
  "memory": ["*"]
  "search": ["*"]
  "lark-*": ["*"]

# Excluded tools
exclude:
  - "chrome-cdp"
  - "deprecated-tool"
  - "experimental-feature"
```

---

## Troubleshooting

### Config Not Loading

**Symptom**: Rules not being applied

**Check**:
1. File exists at `tool-allocator.config.yaml`
2. Valid YAML syntax
3. No trailing spaces

### Rules Not Working

**Symptom**: Custom rules ignored

**Check**:
1. Tool name matches exactly
2. Tags exist in agent definitions
3. Case sensitivity (rules are case-sensitive)

### Exclude Not Working

**Symptom**: Excluded tools still assigned

**Check**:
1. Tool name is exact match
2. Run `sync` after updating config

---

## Reset to Defaults

To reset configuration:

1. Delete `tool-allocator.config.yaml`
2. Run `node scripts/index.js sync`
3. New default config will be created