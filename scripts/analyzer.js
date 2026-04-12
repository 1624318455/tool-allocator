/**
 * tool-allocator - 工具能力分析模块
 * 分析 Skill/MCP 的能力和用途
 */

const fs = require('fs');
const path = require('path');

// 能力标签定义
const CAPABILITY_TAGS = {
    // 前端相关
    'frontend': ['frontend', 'frontend-design', 'ui', 'web', 'css', 'html'],
    'react': ['react', 'nextjs', 'jsx', 'tsx'],
    'react-native': ['react-native', 'mobile', 'rn', 'expo'],
    'design': ['design', 'ui-ux', 'ux', 'visual', '样式', '设计'],
    'component': ['component', 'composition', 'pattern', '组件'],
    
    // 验证相关
    'verification': ['test', 'testing', 'verify', 'validation', 'playwright', 'selenium', 'browser'],
    'debug': ['debug', 'chrome', 'cdp', 'devtools'],
    
    // 文档相关
    'documentation': ['doc', 'readme', 'docs', '文档', '说明'],
    'summarize': ['summarize', 'summary', '摘要', '总结'],
    
    // 记忆相关
    'memory': ['memory', 'remember', '记忆', 'knowledge'],
    'persistent': ['persistent', 'storage', '存储'],
    
    // 搜索相关
    'search': ['search', 'web', '爬虫', '抓取', 'scrape'],
    
    // 飞书相关
    'lark': ['lark', 'feishu', '飞书', 'calendar', 'doc', 'message', 'mail'],
    
    // 架构相关
    'architecture': ['architecture', 'technical', '架构', '技术选型'],
    
    // 分析相关
    'analysis': ['analyze', 'analysis', 'capability', '分析'],
    
    // 工作流相关
    'workflow': ['workflow', 'agent', 'automation', '工作流', '自动化', '接力']
};

// 提取能力标签
function extractTags(content) {
    const tags = new Set();
    const lowerContent = content.toLowerCase();
    
    for (const [tag, keywords] of Object.entries(CAPABILITY_TAGS)) {
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword.toLowerCase())) {
                tags.add(tag);
                break;
            }
        }
    }
    
    return Array.from(tags);
}

// 分析单个 Skill
function analyzeSkill(skill) {
    const result = {
        name: skill.name,
        type: 'skill',
        path: skill.path,
        tags: [],
        description: '',
        recommendedFor: []
    };

    try {
        const content = fs.readFileSync(skill.skillFile, 'utf-8');
        
        // 提取描述（第一行或 description 字段）
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('description:') || line.startsWith('# ')) {
                result.description = line.replace(/^[#]*\s*/, '').trim();
                break;
            }
        }
        
        // 提取标签
        result.tags = extractTags(content);
        
    } catch (e) {
        result.description = skill.name;
    }

    return result;
}

// 分析单个 MCP
function analyzeMCP(mcp) {
    return {
        name: mcp.name,
        type: 'mcp',
        command: mcp.command,
        tags: extractTags(mcp.description),
        description: mcp.description || mcp.name,
        recommendedFor: []
    };
}

// 分析所有工具
function analyzeTools(discoveredTools) {
    const result = {
        skills: [],
        mcps: [],
        allTags: new Set()
    };

    for (const skill of discoveredTools.skills) {
        const analyzed = analyzeSkill(skill);
        result.skills.push(analyzed);
        analyzed.tags.forEach(tag => result.allTags.add(tag));
    }

    for (const mcp of discoveredTools.mcps) {
        const analyzed = analyzeMCP(mcp);
        result.mcps.push(analyzed);
        analyzed.tags.forEach(tag => result.allTags.add(tag));
    }

    result.allTags = Array.from(result.allTags);

    return result;
}

module.exports = {
    analyzeTools,
    analyzeSkill,
    analyzeMCP,
    extractTags,
    CAPABILITY_TAGS
};
