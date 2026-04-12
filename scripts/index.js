#!/usr/bin/env node
/**
 * tool-allocator - 主入口
 * 工具分配管家的命令行接口
 */

const path = require('path');
const fs = require('fs');
const { discoverTools, discoverAgents } = require('./discover');
const { analyzeTools } = require('./analyzer');
const { matchAllTools, findUnusedTools, analyzeAllAgents, debugAgentRoles } = require('./matcher');
const { 
    generateAllocationMatrix, 
    generateAgentToolSection,
    generateGlobalMemoryMatrix,
    updateAgentConfig,
    updateGlobalMemory,
    generateReport 
} = require('./allocator');

// 配置路径
const HOME = process.env.HOME || process.env.USERPROFILE;
const CONFIG_DIR = path.join(HOME, '.config', 'opencode');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');
const GLOBAL_MEMORY = path.join(CONFIG_DIR, 'skills', 'persistent-memory', 'data', '.opencode_memory.md');
const AGENT_DIR = path.join(CONFIG_DIR, 'agent');

// 加载配置文件
function loadConfig() {
    const configPath = path.join(__dirname, '..', 'tool-allocator.config.yaml');
    
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            // 简单解析 YAML（实际应该用 yaml 库）
            return parseSimpleYaml(content);
        } catch (e) {
            console.error('Error loading config:', e.message);
        }
    }
    
    return { agents: [], rules: {}, exclude: [] };
}

// 简单 YAML 解析
function parseSimpleYaml(content) {
    const result = { agents: [], rules: {}, exclude: [] };
    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('agents:')) {
            currentSection = 'agents';
        } else if (trimmed.startsWith('rules:')) {
            currentSection = 'rules';
        } else if (trimmed.startsWith('exclude:')) {
            currentSection = 'exclude';
        } else if (trimmed.startsWith('- "') || trimmed.startsWith("- '")) {
            if (currentSection === 'exclude') {
                result.exclude.push(trimmed.replace(/^-\s*["']|["']\s*$/g, ''));
            }
        } else if (trimmed.includes(':')) {
            const [key, value] = trimmed.split(':').map(s => s.trim());
            
            if (currentSection === 'agents' && key === 'name') {
                result.agents.push({ name: value, tags: [] });
            } else if (currentSection === 'agents' && key === 'tags') {
                const tags = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                if (result.agents.length > 0) {
                    result.agents[result.agents.length - 1].tags = tags;
                }
            } else if (currentSection === 'rules' && value.includes('[')) {
                const tags = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/["']/g, ''));
                result.rules[key] = tags;
            }
        }
    }

    return result;
}

// 主同步函数
function sync() {
    console.log('🔍 正在发现工具...\n');
    
    // 发现工具和 Agent
    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();

    // 加载 opencode.json 用于权限链分析
    let opencodeConfig = {};
    if (fs.existsSync(OPENCODE_JSON)) {
        try {
            opencodeConfig = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
        } catch (e) {
            console.error('Error reading opencode.json:', e.message);
        }
    }

    console.log(`📦 发现 ${discoveredTools.skills.length} 个 Skills`);
    console.log(`📦 发现 ${discoveredTools.mcps.length} 个 MCPs`);
    console.log(`👥 发现 ${agents.length} 个 Agents\n`);

    // 多维度 Agent 角色分析
    console.log('🧠 正在多维度分析 Agent 角色...\n');
    const agentAnalysis = analyzeAllAgents(agents, AGENT_DIR, opencodeConfig);

    // 调试：显示 Agent 角色提取
    debugAgentRoles(agentAnalysis);

    // 分析工具
    console.log('📊 正在分析工具能力...\n');
    const analyzedTools = analyzeTools(discoveredTools);

    // 匹配（使用多维度分析结果）
    console.log('🎯 正在匹配工具到 Agent...\n');
    const matchedTools = matchAllTools(analyzedTools, agentAnalysis, config);

    // 检查闲置
    const { used, unused } = findUnusedTools(matchedTools, config);

    // 更新配置
    const updateResults = [];
    
    // 更新每个 Agent 的配置
    for (const agent of agents) {
        const agentPath = path.join(AGENT_DIR, `${agent.name}.md`);
        if (fs.existsSync(agentPath)) {
            const toolSection = generateAgentToolSection(agent.name, matchedTools);
            if (toolSection) {
                const result = updateAgentConfig(agentPath, toolSection);
                updateResults.push({
                    agent: agent.name,
                    ...result
                });
            }
        }
    }

    // 更新全局记忆
    if (fs.existsSync(GLOBAL_MEMORY)) {
        const matrix = generateAllocationMatrix(matchedTools);
        const memoryResult = updateGlobalMemory(GLOBAL_MEMORY, matrix);
        updateResults.push({
            type: 'global-memory',
            ...memoryResult
        });
    }

    // 生成报告
    const report = generateReport(matchedTools, agents, updateResults);

    // 输出报告
    console.log('✅ 工具分配同步完成\n');
    console.log('📊 分配概览：');
    console.log('   ┌' + '─'.repeat(25) + '┬' + '─'.repeat(20) + '┐');
    console.log('   │ ' + '工具'.padEnd(23) + ' │ ' + '分配给'.padEnd(18) + ' │');
    console.log('   ├' + '─'.repeat(25) + '┼' + '─'.repeat(20) + '┤');
    
    for (const item of report.matrix) {
        const assignedTo = Array.isArray(item.assignedTo) ? item.assignedTo.join(', ') : item.assignedTo;
        console.log('   │ ' + String(item.tool).padEnd(23) + ' │ ' + assignedTo.padEnd(18) + ' │');
    }
    console.log('   └' + '─'.repeat(25) + '┴' + '─'.repeat(20) + '┘\n');

    if (unused.length > 0) {
        console.log('⚠️  可能闲置的工具：');
        for (const item of unused) {
            console.log(`   - ${item.tool} ← ${item.reason}`);
        }
        console.log('');
    }

    console.log('🔄 已更新：');
    for (const result of updateResults) {
        if (result.type === 'global-memory') {
            console.log(`   ✓ .opencode_memory.md`);
        } else {
            console.log(`   ✓ Agent/${result.agent}.md`);
        }
    }
    console.log('\n💡 提示：重新加载会话让 Agent 感知变化');

    return report;
}

// 列出当前分配
function list() {
    console.log('📋 当前工具分配清单\n');

    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();
    
    // 加载 opencode.json
    let opencodeConfig = {};
    if (fs.existsSync(OPENCODE_JSON)) {
        try {
            opencodeConfig = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
        } catch (e) {}
    }

    const analyzedTools = analyzeTools(discoveredTools);
    const agentAnalysis = analyzeAllAgents(agents, AGENT_DIR, opencodeConfig);
    const matchedTools = matchAllTools(analyzedTools, agentAnalysis, config);

    for (const agent of agents) {
        const tools = matchedTools.filter(item => 
            item.recommendations.some(r => r.agent === agent.name)
        );

        console.log(`### ${agent.name}`);
        if (tools.length === 0) {
            console.log('   (无分配)\n');
        } else {
            for (const tool of tools) {
                console.log(`   - ${tool.tool} (${tool.type})`);
            }
            console.log('');
        }
    }
}

// 检查闲置工具
function check() {
    console.log('🔍 工具使用检查\n');

    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();
    
    // 加载 opencode.json
    let opencodeConfig = {};
    if (fs.existsSync(OPENCODE_JSON)) {
        try {
            opencodeConfig = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
        } catch (e) {}
    }

    const analyzedTools = analyzeTools(discoveredTools);
    const agentAnalysis = analyzeAllAgents(agents, AGENT_DIR, opencodeConfig);
    const matchedTools = matchAllTools(analyzedTools, agentAnalysis, config);
    const { used, unused } = findUnusedTools(matchedTools, config);

    console.log('✅ 正在使用：');
    for (const item of used) {
        const assignedAgents = item.recommendations.map(r => r.agent).join(', ');
        console.log(`   - ${item.tool} ← ${assignedAgents}`);
    }
    console.log('');

    if (unused.length > 0) {
        console.log('⚠️  可能闲置：');
        for (const item of unused) {
            console.log(`   - ${item.tool} ← 从未被使用`);
        }
        console.log('');
    }
}

// 命令行接口
const command = process.argv[2] || 'sync';

switch (command) {
    case 'sync':
        sync();
        break;
    case 'list':
        list();
        break;
    case 'check':
        check();
        break;
    case 'help':
    default:
        console.log(`
tool-allocator - 工具分配管家

用法：
  node index.js sync   # 同步所有工具分配
  node index.js list   # 查看当前分配
  node index.js check  # 检查闲置工具
`);
}

module.exports = { sync, list, check };
