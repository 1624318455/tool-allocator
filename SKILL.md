---
name: tool-allocator
description: 工具分配管家 — 自动化管理 MCP/Skill 的分配，将本地工具分配给合适的 Agent，解决"工具装了但没人用"的痛点
version: 1.0
created: 2026-04-12
tags: [opencode, tool-management, agent, workflow, automation]
author: memeflyfly
license: MIT
---

# tool-allocator

> 工具分配管家 — 让每个 Agent 知道该用什么工具

## 一句话说明

自动化管理 MCP/Skill 的分配，将本地工具分配给合适的 Agent，解决"工具装了但没人用"的痛点。

## 谁需要这个？

| 你的情况 | 推荐度 |
|----------|--------|
| 安装了 5+ 个 MCP 或 Skill | ⭐⭐⭐⭐⭐ |
| 配置了多个 Agent（BA、Designer、Architect、Coder 等） | ⭐⭐⭐⭐⭐ |
| 经常安装新工具，每次手动改配置太麻烦 | ⭐⭐⭐⭐ |
| Agent 不知道本地有哪些工具可用 | ⭐⭐⭐⭐ |
| 团队多人协作，需要统一工具分配标准 | ⭐⭐⭐⭐ |
| 只装了几个工具，够用 | ⭐ |
| 单 Agent 工作，不需要分配 | ⭐ |

## 解决什么问题？

```
痛点：装了 10 个工具，Agent 只用了 2 个
原因：不知道有这些工具 / 不知道该给谁
影响：工具闲置 = 钱浪费 + 效率损失
```

## 工作原理

```
┌─────────────────────────────────────────────────────────┐
│  1. 发现工具                                             │
│     扫描 ~/.config/opencode/skills/                     │
│     扫描 ~/.agents/skills/                              │
│     扫描 opencode.json 中的 MCP 配置                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. 分析能力                                             │
│     读取每个工具的 SKILL.md                              │
│     提取：名称、描述、用途标签                          │
│     输出：工具能力清单                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. 智能匹配                                             │
│     读取 opencode.json 发现所有 Agent                    │
│     匹配规则：工具能力 ↔ Agent 职责                     │
│     输出：分配推荐方案                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. 同步配置                                             │
│     更新 Agent 配置文件（工具清单部分）                   │
│     更新 .opencode_memory.md（分配矩阵）                 │
│     更新工具分配清单文档（可选）                         │
└─────────────────────────────────────────────────────────┘
```

## 功能列表

| 命令 | 说明 |
|------|------|
| `/tool-allocator sync` | 分析所有工具，生成并同步分配 |
| `/tool-allocator list` | 查看当前工具分配清单 |
| `/tool-allocator add <tool>` | 为单个新工具生成分配 |
| `/tool-allocator check` | 检查工具使用情况，找出闲置工具 |
| `/tool-allocator init` | 初始化配置文件（首次使用） |

## 使用示例

### 首次使用

```bash
# 1. 初始化（创建配置文件）
/tool-allocator init

# 2. 查看当前分配
/tool-allocator list

# 3. 同步分配
/tool-allocator sync
```

### 安装新工具后

```bash
# 方式一：一键同步所有工具
/tool-allocator sync

# 方式二：只为新工具生成分配
/tool-allocator add vercel-next-best-practices
```

### 检查闲置工具

```bash
/tool-allocator check
```

输出示例：
```
📊 工具使用检查

✅ 正在使用：
   - frontend-design ← Coder
   - memory ← 所有人
   - playwright ← Coder, Architect

⚠️ 可能闲置：
   - vercel-react-native-skills ← 从未被使用
   - chrome-cdp ← 与 playwright 功能重复

💡 建议：考虑移除重复工具或更新 Agent 配置
```

## 输出示例

运行 `/tool-allocator sync` 后：

```
✅ 工具分配同步完成

📊 分配概览：
   ┌────────────────────────┬────────────────────────┐
   │ 工具                   │ 分配给                 │
   ├────────────────────────┼────────────────────────┤
   │ frontend-design        │ Coder                  │
   │ vercel-react-best-... │ Architect, Coder       │
   │ ui-ux-pro-max         │ Designer                │
   │ summarize-pro          │ BA                     │
   │ memory                 │ 所有人                 │
   │ playwright             │ Architect, Coder       │
   │ one-search             │ 所有人                 │
   └────────────────────────┴────────────────────────┘

🔄 已更新：
   ✓ Agent/Coder.md（工具清单）
   ✓ Agent/Designer.md（工具清单）
   ✓ Agent/Architect.md（工具清单）
   ✓ Agent/BA.md（工具清单）
   ✓ .opencode_memory.md（分配矩阵）

💡 提示：重新加载会话让 Agent 感知变化
```

## 前提要求

- OpenCode 环境
- 已安装 MCP 或 Skill（至少 3 个）
- 已配置 Agent（至少 2 个）
- Node.js 16+（用于脚本执行）

## 安装方法

```bash
# 方法一：使用 cocoloop
/cocoloop install tool-allocator

# 方法二：从 GitHub 安装
# 访问 https://github.com/你的用户名/tool-allocator
```

## 配置文件

首次运行 `/tool-allocator init` 会创建 `tool-allocator.config.yaml`：

```yaml
# 工具分配配置

# Agent 定义（自动从 opencode.json 读取，可手动覆盖）
agents:
  - name: "Coder"
    tags: ["frontend", "backend", "verification"]
  - name: "Designer"
    tags: ["design", "ui-ux"]
  - name: "Architect"
    tags: ["architecture", "technical-design"]
  - name: "BA"
    tags: ["research", "documentation"]

# 自定义匹配规则
rules:
  # 工具名称 → 匹配标签
  "frontend-design": ["frontend", "design"]
  "playwright": ["verification", "frontend"]
  "memory": ["*"]  # * 表示所有人
  "search": ["*"]
  "lark-*": ["*"]

# 排除的工具（不分配）
exclude:
  - "chrome-cdp"  # 与 playwright 重复
```

## 分配规则说明

工具根据以下规则自动匹配 Agent：

| 工具能力标签 | 匹配的 Agent 标签 | 示例 |
|-------------|------------------|------|
| `frontend` | `frontend`, `design` | Coder, Designer |
| `verification` | `verification`, `frontend` | Coder, Architect |
| `design` | `design`, `ui-ux` | Designer |
| `documentation` | `documentation`, `research` | BA |
| `architecture` | `architecture`, `technical-design` | Architect |
| `*` | 所有人 | memory, search |

### Agent 角色识别规则（多维度分析）

系统采用**四维度综合分析**来识别 Agent 角色，不依赖名称硬匹配：

#### 维度1：MD 文件内容分析（权重最高）

读取 Agent 配置文件（如 `AIBA.md`），分析：
- **已有工具清单** - 如果已配置了 `playwright`，说明是 qa/coder
- **关键词** - 代码、设计、架构、需求等关键词
- **动词** - 生成(代码)、设计(界面)、分析(需求)等动词
- **交付物描述** - 需求文档、设计规范、架构方案、代码实现

#### 维度2：权限链分析

分析 `opencode.json` 中的权限配置：
- 如果 Agent 能调用 `AICA` → 可能是 `AITA`（架构师）
- 如果 Agent 能调用 `AITA` → 可能是 `AIUIUX`（设计师）

#### 维度3：描述字段分析

分析 `opencode.json` 中的 `description` 字段：
- 检查角色关键词
- 检查动词（生成、设计、分析等）
- 检查输出物描述（"输出需求文档"、"生成代码"等）

#### 维度4：名称分析（兜底）

检查 Agent 名称中是否包含角色关键词：
- `coder`, `developer` → coder
- `designer`, `ui` → designer
- `architect` → architect
- `ba`, `analyst` → ba

### 证据追溯

每次分析都会记录**证据来源**，方便调试和验证：

```
AICA:
   识别角色: coder, designer, qa, architect
   证据来源:
     - coder (得分:43) <- MD文件:关键词:coding, MD文件:动词:生成, 描述:描述动词:生成
     - designer (得分:38) <- MD文件:已有工具, MD文件:关键词:design
```

**自定义识别规则**：如需添加新的角色识别规则，可修改 `scripts/matcher.js` 中的：
- `ROLE_KEYWORDS` - 角色关键词映射
- `VERB_TO_ROLE` - 动词到角色映射
- `CAPABILITY_TO_AGENT` - 能力到 Agent 的映射

## 常见问题

**Q: 会覆盖我的手动修改吗？**
A: 不会。只更新"工具清单"部分，其他内容保持不变。

**Q: 分配错了怎么办？**
A: 修改 `tool-allocator.config.yaml` 中的 `rules` 部分，然后重新运行 sync。

**Q: 支持自定义 Agent 名称吗？**
A: 支持。自动读取 opencode.json 中的 agent 配置，也可手动在配置文件中覆盖。

**Q: 如何让 Agent 感知新工具？**
A: 运行 sync 后，重新加载会话。Agent 会在启动时读取配置文件中的工具清单。

**Q: 可以只分配给部分 Agent 吗？**
A: 可以。在配置文件的 `rules` 中指定，或手动修改 Agent 配置。

## 注意事项

- 首次使用建议先运行 `/tool-allocator list` 查看当前状态
- 同步前会自动备份原文件（.bak 后缀）
- 建议定期运行 `/tool-allocator check` 检查闲置工具

## 贡献

欢迎提交 Issue 和 PR！
