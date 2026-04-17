#!/usr/bin/env node
/**
 * tool-allocator - Main entry point
 * Tool allocation manager CLI
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

// Config paths
const HOME = process.env.HOME || process.env.USERPROFILE;
const CONFIG_DIR = path.join(HOME, '.config', 'opencode');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');
const GLOBAL_MEMORY = path.join(CONFIG_DIR, 'skills', 'persistent-memory', 'data', '.opencode_memory.md');
const AGENT_DIR = path.join(CONFIG_DIR, 'agent');

// Load config file
function loadConfig() {
    const configPath = path.join(__dirname, '..', 'tool-allocator.config.yaml');
    
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            return parseSimpleYaml(content);
        } catch (e) {
            console.error('Error loading config:', e.message);
        }
    }
    
    return { agents: [], rules: {}, exclude: [] };
}

// Simple YAML parser
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

// Main sync function
function sync() {
    console.log('🔍 Discovering tools...\n');
    
    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();

    let opencodeConfig = {};
    if (fs.existsSync(OPENCODE_JSON)) {
        try {
            opencodeConfig = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
        } catch (e) {
            console.error('Error reading opencode.json:', e.message);
        }
    }

    console.log(`📦 Discovered ${discoveredTools.skills.length} Skills`);
    console.log(`📦 Discovered ${discoveredTools.mcps.length} MCPs`);
    console.log(`👥 Discovered ${agents.length} Agents\n`);

    console.log('🧠 Analyzing Agent roles (multi-dimensional)...\n');
    const agentAnalysis = analyzeAllAgents(agents, AGENT_DIR, opencodeConfig);
    debugAgentRoles(agentAnalysis);

    console.log('📊 Analyzing tool capabilities...\n');
    const analyzedTools = analyzeTools(discoveredTools);

    console.log('🎯 Matching tools to agents...\n');
    const matchedTools = matchAllTools(analyzedTools, agentAnalysis, config);

    const { used, unused } = findUnusedTools(matchedTools, config);

    const updateResults = [];
    
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

    if (fs.existsSync(GLOBAL_MEMORY)) {
        const matrix = generateAllocationMatrix(matchedTools);
        const memoryResult = updateGlobalMemory(GLOBAL_MEMORY, matrix);
        updateResults.push({
            type: 'global-memory',
            ...memoryResult
        });
    }

    const report = generateReport(matchedTools, agents, updateResults);

    console.log('✅ Tool allocation sync complete\n');
    console.log('📊 Allocation Overview:');
    console.log('   ┌' + '─'.repeat(25) + '┬' + '─'.repeat(20) + '┐');
    console.log('   │ ' + 'Tool'.padEnd(23) + ' │ ' + 'Assigned To'.padEnd(18) + ' │');
    console.log('   ├' + '─'.repeat(25) + '┼' + '─'.repeat(20) + '┤');
    
    for (const item of report.matrix) {
        const assignedTo = Array.isArray(item.assignedTo) ? item.assignedTo.join(', ') : item.assignedTo;
        console.log('   │ ' + String(item.tool).padEnd(23) + ' │ ' + assignedTo.padEnd(18) + ' │');
    }
    console.log('   └' + '─'.repeat(25) + '┴' + '─'.repeat(20) + '┘\n');

    if (unused.length > 0) {
        console.log('⚠️  Potentially unused tools:');
        for (const item of unused) {
            console.log(`   - ${item.tool} ← ${item.reason}`);
        }
        console.log('');
    }

    console.log('🔄 Updated:');
    for (const result of updateResults) {
        if (result.type === 'global-memory') {
            console.log(`   ✓ .opencode_memory.md`);
        } else {
            console.log(`   ✓ Agent/${result.agent}.md`);
        }
    }
    console.log('\n💡 Tip: Reload session for agents to detect changes');

    return report;
}

// List current allocation
function list() {
    console.log('📋 Current Tool Allocation\n');

    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();
    
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
            console.log('   (no tools assigned)\n');
        } else {
            for (const tool of tools) {
                console.log(`   - ${tool.tool} (${tool.type})`);
            }
            console.log('');
        }
    }
}

// Check for unused tools
function check() {
    console.log('🔍 Tool Usage Check\n');

    const discoveredTools = discoverTools(OPENCODE_JSON);
    const agents = discoverAgents(OPENCODE_JSON);
    const config = loadConfig();
    
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

    console.log('✅ In Use:');
    for (const item of used) {
        const assignedAgents = item.recommendations.map(r => r.agent).join(', ');
        console.log(`   - ${item.tool} ← ${assignedAgents}`);
    }
    console.log('');

    if (unused.length > 0) {
        console.log('⚠️  Unused:');
        for (const item of unused) {
            console.log(`   - ${item.tool} ← never used`);
        }
        console.log('');
    }
}

// CLI
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
tool-allocator - Tool Allocation Manager

Usage:
  node index.js sync   # Sync all tool allocations
  node index.js list   # View current allocation
  node index.js check  # Check unused tools
`);
}

module.exports = { sync, list, check };