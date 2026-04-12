/**
 * tool-allocator - 工具发现模块
 * 扫描本地安装的 MCP 和 Skill
 */

const fs = require('fs');
const path = require('path');

// 扫描目录下的所有工具
function scanDirectory(dir, extensions = ['.md']) {
    const tools = [];
    
    if (!fs.existsSync(dir)) {
        return tools;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
            // 检查是否有 SKILL.md
            const skillPath = path.join(fullPath, 'SKILL.md');
            if (fs.existsSync(skillPath)) {
                tools.push({
                    name: item.name,
                    path: fullPath,
                    type: 'skill',
                    skillFile: skillPath
                });
            } else {
                // 递归扫描子目录
                const subTools = scanDirectory(fullPath, extensions);
                tools.push(...subTools);
            }
        }
    }
    
    return tools;
}

// 发现所有 MCP（从 opencode.json）
function discoverMCPs(opencodeConfig) {
    const mcps = [];
    
    if (!opencodeConfig || !opencodeConfig.mcp) {
        return mcps;
    }

    for (const [name, config] of Object.entries(opencodeConfig.mcp)) {
        if (config && config.enabled !== false) {
            mcps.push({
                name: name,
                type: 'mcp',
                command: config.command || [],
                description: getMCPDescription(name)
            });
        }
    }
    
    return mcps;
}

// MCP 描述映射
function getMCPDescription(name) {
    const descriptions = {
        'memory': '知识图谱记忆',
        'playwright': '浏览器自动化',
        'lark': '飞书集成',
        'one-search': '网络搜索',
        'chrome-cdp': 'Chrome 调试'
    };
    return descriptions[name] || name;
}

// 主发现函数
function discoverTools(opencodeJsonPath) {
    const result = {
        skills: [],
        mcps: [],
        timestamp: new Date().toISOString()
    };

    // 扫描 Skill 目录
    const skillPaths = [
        path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'opencode', 'skills'),
        path.join(process.env.HOME || process.env.USERPROFILE, '.agents', 'skills'),
        path.join(process.env.HOME || process.env.USERPROFILE, '.opencode', 'skills')
    ];

    for (const skillPath of skillPaths) {
        const skills = scanDirectory(skillPath);
        for (const skill of skills) {
            if (!result.skills.find(s => s.name === skill.name)) {
                result.skills.push(skill);
            }
        }
    }

    // 读取 opencode.json 发现 MCP
    if (fs.existsSync(opencodeJsonPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
            result.mcps = discoverMCPs(config);
        } catch (e) {
            console.error('Error reading opencode.json:', e.message);
        }
    }

    return result;
}

// 发现所有 Agent
function discoverAgents(opencodeJsonPath) {
    const agents = [];
    
    if (!fs.existsSync(opencodeJsonPath)) {
        return agents;
    }

    try {
        const fileContent = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
        
        if (fileContent.agent) {
            for (const [name, agentConfig] of Object.entries(fileContent.agent)) {
                agents.push({
                    name: name,
                    description: agentConfig.description || '',
                    mode: agentConfig.mode || 'subagent'
                });
            }
        }
    } catch (e) {
        console.error('Error reading opencode.json:', e.message);
    }

    return agents;
}

module.exports = {
    discoverTools,
    discoverAgents,
    scanDirectory
};
