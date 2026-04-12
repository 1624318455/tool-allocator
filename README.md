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

## 安装方法

```bash
# 方法一：使用 cocoloop
/cocoloop install tool-allocator

# 方法二：手动安装
# 将此文件夹复制到 ~/.opencode/skills/tool-allocator/
```

## 使用方法

```bash
# 进入脚本目录
cd ~/.opencode/skills/tool-allocator/scripts

# 同步所有工具分配
node index.js sync

# 查看当前分配
node index.js list

# 检查闲置工具
node index.js check
```

## 工作流程

```
安装新工具
    ↓
运行 node index.js sync
    ↓
自动分析工具能力
    ↓
匹配到合适的 Agent
    ↓
更新配置文件
    ↓
Agent 重新加载会话
```

## 输出示例

```
✅ 工具分配同步完成

📊 分配概览：
   ┌────────────────────────┬────────────────────────┐
   │ 工具                   │ 分配给                 │
   ├────────────────────────┼────────────────────────┤
   │ frontend-design        │ Coder                  │
   │ vercel-react-best-... │ Architect, Coder       │
   │ ui-ux-pro-max         │ Designer               │
   │ memory                 │ 所有人                 │
   └────────────────────────┴────────────────────────┘

🔄 已更新：
   ✓ Agent/Coder.md
   ✓ Agent/Designer.md
   ✓ .opencode_memory.md

💡 提示：重新加载会话让 Agent 感知变化
```

## 配置说明

编辑 `tool-allocator.config.yaml` 自定义分配规则：

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

## 前提要求

- Node.js 16+
- OpenCode 环境
- 已安装 MCP 或 Skill
- 已配置 Agent

## 常见问题

**Q: 会覆盖我的手动修改吗？**
A: 不会。只更新"工具清单"部分，其他内容保持不变。

**Q: 分配错了怎么办？**
A: 修改配置文件中的 `rules` 部分，然后重新运行 sync。

## 贡献

欢迎提交 Issue 和 PR！
