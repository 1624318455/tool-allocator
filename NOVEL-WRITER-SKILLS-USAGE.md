# novel-writer-skills 使用指南

## 安装状态

✅ 已安装 13 个 Skills：
- [x] requirement-detector（去AI味）
- [x] style-detector（风格检测）
- [x] setting-detector（类型检测）
- [x] story-consistency-monitor（一致性检查）
- [x] natural-dialogue-techniques（对话技巧）
- [x] scene-structure-techniques（场景结构）
- [x] pre-write-checklist（预写作检查）
- [x] fantasy-world-building（奇幻世界构建）
- [x] romance-novel-conventions（言情规范）
- [x] mystery-novel-conventions（悬疑规范）
- [x] getting-started-guide
- [x] pre-write-checklist
- [x] forgotten-elements-reminder

## 自动激活机制

### 当用户说以下关键词时，自动激活对应 Skill：

| 关键词 | 自动激活 | 功能 |
|--------|--------|------|
| "去AI味" / "AI味太重" | requirement-detector | anti-ai-v4 |
| "口语化" / "自然一点" | style-detector | natural-voice |
| "爽文" / "快节奏" | requirement-detector | fast-paced |
| "言情" / "爱情" | setting-detector | romance.md |
| "悬疑" / "推理" | setting-detector | mystery.md |
| "玄幻" | setting-detector | fantasy.md |

## 你的工作流如何使用

### 当前完整工作流

```
@novel-write [故事idea] 
  ↓
AINovelAssist 输出版本+大纲
  ↓
用户选择版本
  ↓
[使用 chinese-novelist skill 填充正文] ← 可选
  ↓
@novel-critique 审阅（循环5次）
```

### 整合 novel-writer-skills

在 AINovelAssist 写作时，可以通过以下方式使用 Skills：

1. **手动调用**：直接说"/requirement-detector"让它加载去AI味规则
2. **自动激活**：在消息中包含触发关键词

## 核心功能说明

### requirement-detector（去AI味）

触发词：AI味重、去AI味、太机器、不自然

功能：
- 200+ 禁用词汇表
- 6层规则体系
- 极致自然化

使用示例：
```
用户：这段文字AI味太重，帮我改一下
AI：自动加载 anti-ai-v4，应用到当前文本
```

### style-detector（风格检测）

触发词：
- "口语化" → natural-voice 风格
- "文学性" → literary 风格
- "网文" → web-novel 风格
- "古风" → ancient-style 风格
- "极简" → minimal 风格

### setting-detector（类型检测）

触发词：
- "言情" → 加载 romance.md
- "悬疑" → 加载 mystery.md
- "复仇" → 加载 revenge.md
- "玄幻" → 加载 fantasy.md
- "民国" → 加载 china-1920s.md

## tool-allocator 配置

已在 `tool-allocator.config.yaml` 中配置自动分配：

```yaml
novel-agent-skills:
  AINovelAssist:
    - "requirement-detector"
    - "style-detector"
    - "setting-detector"
    - "story-consistency-monitor"
    - "natural-dialogue-techniques"
    - "scene-structure-techniques"
```

## 何时使用

### 推荐使用场景

| 场景 | 使用 Skill |
|------|----------|
| 写对话时 | natural-dialogue-techniques |
| 写场景时 | scene-structure-techniques |
| 担心AI味时 | requirement-detector |
| 确认风格时 | style-detector |
| 需要类型知识时 | setting-detector |
| 检查一致性时 | story-consistency-monitor |

### 不推荐使用

| 场景 | 原因 |
|------|------|
| 用它的7步工作流 | 与你的Agent工作流冲突 |
| 完全替换你的Agent | 你已有完整流程 |

## 下一步

1. 测试：尝试在对话中使用触发词，观察自动激活
2. 调整���根据实际使用调整配置
3. 扩展：可以安装更多 Skill（如 chinese-novelist）

---

## 联系信息

如有问题，检查：
- Skills 安装位置：`~/.opencode/skills/.agents/skills/`
- tool-allocator 配置：`~/.opencode/skills/tool-allocator/tool-allocator.config.yaml`