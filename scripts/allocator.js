/**
 * tool-allocator - 分配逻辑模块
 * 生成分配方案和更新配置
 */

const fs = require('fs');
const path = require('path');

// 生成分配矩阵
function generateAllocationMatrix(matchedTools) {
    const matrix = [];

    for (const item of matchedTools) {
        const assigned = item.recommendations
            .filter(r => r.confidence === 'high')
            .map(r => r.agent);

        if (assigned.length > 0) {
            matrix.push({
                tool: item.tool,
                type: item.type,
                assignedTo: assigned,
                confidence: 'high',
                tags: item.tags
            });
        }
    }

    return matrix;
}

// 生成 Agent 工具清单部分
function generateAgentToolSection(agentName, matchedTools) {
    const assignedTools = matchedTools
        .filter(item => item.recommendations.some(r => r.agent === agentName && r.confidence === 'high'))
        .map(item => ({
            name: item.tool,
            type: item.type,
            description: item.description || item.tool,
            tags: item.tags
        }));

    if (assignedTools.length === 0) {
        return null;
    }

    const section = `
## 工具清单

| 工具 | 类型 | 描述 | 用途 |
|------|------|------|------|
${assignedTools.map(t => `| ${t.name} | ${t.type} | ${t.description} | ${t.tags.join(', ')} |`).join('\n')}
`;
    return section;
}

// 生成全局记忆分配矩阵
function generateGlobalMemoryMatrix(matchedTools, agents) {
    const globalTools = matchedTools.filter(item => 
        item.recommendations.some(r => r.agent === '所有人' || r.reason === '全局可用工具')
    );

    const agentTools = {};
    for (const agent of agents) {
        agentTools[agent.name] = matchedTools
            .filter(item => item.recommendations.some(r => r.agent === agent.name))
            .map(item => item.tool);
    }

    return {
        matrix: matchedTools.map(item => ({
            tool: item.tool,
            type: item.type,
            assignedTo: item.recommendations.map(r => r.agent).join(', ') || '未分配'
        })),
        globalTools: globalTools.map(t => t.tool),
        agentTools
    };
}

// 更新 Agent 配置文件
function updateAgentConfig(agentPath, newToolSection, backup = true) {
    if (!fs.existsSync(agentPath)) {
        return { success: false, error: '文件不存在' };
    }

    try {
        let content = fs.readFileSync(agentPath, 'utf-8');

        // 备份
        if (backup) {
            const backupPath = agentPath + '.bak';
            fs.writeFileSync(backupPath, content);
        }

        // 检查是否已有工具清单部分
        const toolSectionRegex = /## 工具清单[\s\S]*?(?=## [^#]|$(?!\n##))/;
        
        if (toolSectionRegex.test(content)) {
            // 替换现有部分
            content = content.replace(toolSectionRegex, newToolSection);
        } else {
            // 追加到文件末尾
            content += '\n' + newToolSection;
        }

        fs.writeFileSync(agentPath, content);

        return { success: true, path: agentPath };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// 更新全局记忆文件
function updateGlobalMemory(memoryPath, allocationMatrix, backup = true) {
    if (!fs.existsSync(memoryPath)) {
        return { success: false, error: '文件不存在' };
    }

    try {
        let content = fs.readFileSync(memoryPath, 'utf-8');

        // 备份
        if (backup) {
            const backupPath = memoryPath + '.bak';
            fs.writeFileSync(backupPath, content);
        }

        // 生成新的分配矩阵部分
        const newSection = `

### 工具分配矩阵 (自动生成 ${new Date().toISOString().split('T')[0]})

| 工具 | 类型 | 分配给 |
|------|------|--------|
${allocationMatrix.map(m => `| ${m.tool} | ${m.type} | ${m.assignedTo} |`).join('\n')}
`;

        // 检查是否已有分配矩阵
        const matrixRegex = /### 工具分配矩阵[\s\S]*?(?=### [^#]|$(?!\n###))/;
        
        if (matrixRegex.test(content)) {
            content = content.replace(matrixRegex, newSection.trim());
        } else {
            content += '\n' + newSection;
        }

        fs.writeFileSync(memoryPath, content);

        return { success: true, path: memoryPath };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// 生成报告
function generateReport(matchedTools, agents, updateResults) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTools: matchedTools.length,
            totalAgents: agents.length,
            assignedTools: matchedTools.filter(m => m.recommendations.length > 0).length,
            unassignedTools: matchedTools.filter(m => m.recommendations.length === 0).length
        },
        matrix: generateAllocationMatrix(matchedTools),
        updates: updateResults,
        recommendations: matchedTools.map(m => ({
            tool: m.tool,
            type: m.type,
            recommendedFor: m.recommendations.map(r => ({
                agent: r.agent,
                reason: r.reason,
                confidence: r.confidence
            }))
        }))
    };

    return report;
}

module.exports = {
    generateAllocationMatrix,
    generateAgentToolSection,
    generateGlobalMemoryMatrix,
    updateAgentConfig,
    updateGlobalMemory,
    generateReport
};
