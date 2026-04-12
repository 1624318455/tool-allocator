/**
 * tool-allocator - 智能匹配模块 v5
 * 基于多维度语义能力的自适应匹配，适用于任何 Agent 名称
 * 
 * 核心改进：
 * 1. 不仅看名称，还分析 MD 文件实际内容
 * 2. 分析已有工具清单（如果已配置了playwright，说明是coder）
 * 3. 分析权限链位置（能调用AICA说明是AITA）
 * 4. 分析描述中的动词（生成= coder, 设计= designer）
 */

const path = require('path');
const fs = require('fs');

// 工具能力定义（工具名称关键词 → 能力标签）
const TOOL_KEYWORDS = {
    // 前端/UI（专门匹配 designer, frontend, coder）
    'frontend-design': ['frontend', 'ui', 'design', 'web'],
    'web-design-guidelines': ['design', 'ui', 'ux', 'web'],
    'ui-ux-pro-max': ['design', 'ui', 'ux', 'designer'],
    
    // React 技术栈（专门匹配 frontend, coder）
    'vercel-react': ['react', 'nextjs', 'frontend'],
    'react-native': ['react', 'mobile', 'frontend'],
    'vercel-composition': ['react', 'component', 'frontend'],
    
    // 编码/开发工具（专门匹配 coder, developer）
    'playwright': ['testing', 'verification', 'browser'],
    'chrome-cdp': ['debug', 'browser', 'chrome'],
    
    // 分析/研究工具（专门匹配 analyst, ba, researcher）
    'summarize': ['summarize', 'summary', 'content'],
    'url-capability': ['analyze', 'capability', 'tool'],
    'research': ['research', 'analyze'],
    
    // 架构/技术工具（专门匹配 architect）
    'architecture': ['architecture', 'technical'],
    
    // 飞书工具 - 精细化分类
    'lark-calendar': ['calendar', 'schedule'],
    'lark-task': ['task', 'todo'],
    'lark-doc': ['document', 'wiki', 'write'],
    'lark-sheets': ['spreadsheet', 'data', 'table'],
    'lark-base': ['database', 'bitable'],
    'lark-wiki': ['wiki', 'knowledge'],
    'lark-im': ['message', 'chat'],
    'lark-mail': ['mail', 'email'],
    'lark-vc': ['meeting', 'video'],
    'lark-minutes': ['meeting', 'minutes', 'summary'],
    'lark-contact': ['contact', 'people'],
    'lark-approval': ['approval', 'workflow'],
    'lark-drive': ['drive', 'file', 'storage'],
    'lark-event': ['event', 'webhook'],
    'lark-whiteboard': ['whiteboard', 'design', 'draw'],
    'lark-workflow-standup': ['standup', 'daily', 'report'],
    'lark-workflow-meeting': ['meeting', 'summary'],
    'lark-openapi': ['api', 'explorer'],
    'lark-skill-maker': ['skill', 'create'],
    'lark-shared': ['shared', 'config'],
    'lark': ['lark'],  // 飞书基础工具 - 不设为全局，根据具体子工具分配
    
    // 全局工具（匹配所有人）
    'memory': ['memory', 'knowledge'],
    'neural-memory': ['memory', 'ai', 'neural'],
    'persistent-memory': ['memory', 'persist'],
    'one-search': ['search', 'web', 'scrape'],
    'websearch': ['search', 'web'],
    
    // 工作流/管理工具（匹配所有人）
    'opencode-agent-relay': ['workflow', 'agent', 'automation'],
    'tool-allocator': ['tool', 'management'],
    'cocoloop': ['skill', 'management'],
    
    // 后端/数据库（专门匹配 architect, backend coder）
    'supabase': ['backend', 'database', 'api'],
    'firebase': ['backend', 'database', 'api'],
    'clerk': ['auth', 'backend', 'security'],
    'neon': ['database', 'postgres'],
    'filesystem': ['file', 'io'],
    
    // 代码生成
    'codegen': ['code', 'generate'],
    'claude-code': ['coding', 'development'],
    'cursor': ['coding', 'development']
};

// Agent 角色识别（关键词 → 角色）
// 注意：这个只是兜底规则，优先级低于实际文件内容分析
const ROLE_KEYWORDS = {
    'coder': ['coder', 'coding', 'code', '程序员', '码农', '写代码', '编码'],
    'developer': ['developer', 'dev', 'engineer', '开发', '开发者', '工程师'],
    'frontend': ['frontend', 'front-end', 'front end', '网页前端', '前端'],
    'backend': ['backend', 'back-end', 'back end', '后端'],
    'fullstack': ['fullstack', 'full-stack', 'full stack', '全栈'],
    'designer': ['designer', 'design', '设计师', '设计', 'ui', 'ux', '交互'],
    'ui': ['ui', 'ui/ux', 'uiux', '界面'],
    'ux': ['ux', 'user experience', '用户体验'],
    'architect': ['architect', 'architecture', '架构师', '架构'],
    'analyst': ['analyst', 'analysis', 'analyst', '分析师', '分析'],
    'ba': ['ba', 'business analyst', '需求分析师', '需求', '业务分析'],
    'researcher': ['researcher', 'research', '研究员', '研究'],
    'qa': ['qa', 'tester', 'testing', '测试', '质检'],
    'writer': ['writer', 'documentation', '文档', 'writer'],
    'sre': ['sre', 'devops', '运维', 'operation'],
    'pm': ['pm', 'product manager', '产品经理', 'product']
};

// 动词 → 角色映射（描述中的动词最能说明角色职能）
const VERB_TO_ROLE = {
    // 生成/编写类动词 → coder/developer
    '生成': 'coder',
    '生成代码': 'coder',
    '编写': 'coder',
    '编写代码': 'coder',
    '实现': 'coder',
    '开发': 'coder',
    'coding': 'coder',
    'code generation': 'coder',
    'build': 'coder',
    
    // 设计类动词 → designer
    '设计': 'designer',
    '设计界面': 'designer',
    'design': 'designer',
    'ui design': 'designer',
    '交互设计': 'designer',
    '绘图': 'designer',
    
    // 分析类动词 → analyst/ba
    '分析': 'analyst',
    '需求分析': 'ba',
    'analyze': 'analyst',
    'research': 'researcher',
    
    // 架构类动词 → architect
    '设计架构': 'architect',
    '架构设计': 'architect',
    'architect': 'architect',
    'architecture': 'architect',
    '技术方案': 'architect',
    
    // 文档类动词 → writer
    '编写文档': 'writer',
    '文档': 'writer',
    'documentation': 'writer',
    
    // 测试类动词 → qa
    '测试': 'qa',
    'test': 'qa',
    '验证': 'qa',
    'verification': 'qa'
};

// 能力到角色的映射（工具能力 → 应该分配给的 Agent 角色）
// 优先级：专一角色 > 多角色 > 全局
const CAPABILITY_TO_AGENT = {
    // 前端/设计 → 主要 designer，次要 frontend
    'frontend': ['designer', 'frontend'],
    'ui': ['designer'],
    'design': ['designer'],
    'web': ['designer', 'frontend'],
    
    // React → 主要 frontend/coder
    'react': ['frontend', 'coder'],
    'nextjs': ['frontend', 'coder'],
    'mobile': ['frontend', 'coder'],
    'component': ['frontend', 'designer'],
    
    // 测试/调试 → 主要 qa，次要 coder
    'testing': ['qa', 'coder'],
    'verification': ['qa', 'coder'],
    'debug': ['qa', 'coder'],
    'browser': ['qa', 'frontend'],
    
    // 分析/研究 → 主要 ba/analyst
    'summarize': ['ba'],
    'summary': ['ba', 'analyst'],
    'content': ['analyst', 'ba'],
    'analyze': ['analyst', 'ba'],
    'capability': ['analyst', 'ba'],
    'research': ['analyst', 'ba'],
    
    // 联系人/通讯录 → 主要 ba
    'contact': ['ba'],
    
    // 架构 → 主要 architect
    'architecture': ['architect'],
    'technical': ['architect'],
    
    // 后端/数据库 → 主要 architect，次要 backend
    'backend': ['architect'],
    'database': ['architect'],
    'api': ['architect'],
    'auth': ['architect'],
    'security': ['architect'],
    
    // 代码 → 主要 coder
    'code': ['coder'],
    'generate': ['coder'],
    'coding': ['coder'],
    'development': ['coder'],
    
    // 文档 → 主要 ba/analyst
    'document': ['ba', 'analyst'],
    'write': ['ba', 'analyst'],
    
    // 飞书 → 主要 ba（业务分析工具）
    'calendar': ['ba'],
    'schedule': ['ba'],
    'task': ['ba'],
    'todo': ['ba'],
    'meeting': ['ba'],
    'video': ['ba'],
    'message': ['ba'],
    'mail': ['ba'],
    'chat': ['ba'],
    'wiki': ['ba'],
    'approval': ['ba'],
    'drive': ['ba'],
    'file': ['ba'],
    'storage': ['ba'],
    'lark': ['ba'],  // 飞书基础给 BA
    
    // 全局 → 所有人
    'memory': ['*'],
    'knowledge': ['*'],
    'persist': ['*'],
    'search': ['*'],
    'web': ['*'],
    'scrape': ['*'],
    
    // 工作流 → 所有人
    'workflow': ['*'],
    'automation': ['*'],
    'tool': ['*'],
    'management': ['*'],
    'skill': ['*'],
    
    // 画板 → 主要 designer
    'whiteboard': ['designer'],
    'draw': ['designer'],
    
    // 表格/数据 → 主要 ba
    'table': ['ba'],
    'spreadsheet': ['ba'],
    
    // 共享配置 → 全局
    'shared': ['*'],
    
    // 事件/Webhook → 主要 ba
    'webhook': ['ba'],
    'event': ['ba']
};

// ========================================
// 多维度角色分析引擎
// ========================================

// 维度1：分析 Agent MD 文件内容
function analyzeAgentMdFile(agentName, agentDir) {
    const mdPath = path.join(agentDir, `${agentName}.md`);
    const content = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf-8') : '';
    const contentLower = content.toLowerCase();
    
    const roles = new Set();
    const evidence = [];
    
    // 1.1 检查已有工具清单（最可靠的信号）
    const toolPatterns = [
        // 测试工具
        { pattern: /playwright|chrom[e]?[ -]?cdp/i, role: 'qa', weight: 10 },
        // 前端工具
        { pattern: /frontend[ -]?design|vercel[ -]?react|react[ -]?native/i, role: 'frontend', weight: 8 },
        // 设计工具
        { pattern: /ui[ -]?ux|whiteboard|design/i, role: 'designer', weight: 8 },
        // 飞书工具
        { pattern: /lark[ -]?(calendar|calendar|doc|wiki|task|approval)/i, role: 'ba', weight: 5 },
        // 架构工具
        { pattern: /supabase|firebase|clerk|neon|backend/i, role: 'architect', weight: 7 },
        // 记忆工具（全局）
        { pattern: /memory|persistent/i, role: '*', weight: 1 }
    ];
    
    for (const { pattern, role, weight } of toolPatterns) {
        if (pattern.test(content)) {
            roles.add(role);
            evidence.push({ type: '已有工具', role, weight });
        }
    }
    
    // 1.2 检查角色关键词（从文件内容）
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            if (regex.test(contentLower)) {
                roles.add(role);
                evidence.push({ type: `关键词:${keyword}`, role, weight: 3 });
            }
        }
    }
    
    // 1.3 检查动词（最说明问题）
    for (const [verb, role] of Object.entries(VERB_TO_ROLE)) {
        if (contentLower.includes(verb.toLowerCase())) {
            roles.add(role);
            evidence.push({ type: `动词:${verb}`, role, weight: 5 });
        }
    }
    
    // 1.4 检查交付物关键词（BA/UI/架构/代码）
    const deliverablePatterns = [
        { pattern: /需求文档|PRD|需求分析/i, role: 'ba' },
        { pattern: /设计规范|UI设计|原型/i, role: 'designer' },
        { pattern: /架构方案|技术方案|架构设计/i, role: 'architect' },
        { pattern: /生产代码|代码实现|功能实现/i, role: 'coder' }
    ];
    
    for (const { pattern, role } of deliverablePatterns) {
        if (pattern.test(content)) {
            roles.add(role);
            evidence.push({ type: '交付物', role, weight: 6 });
        }
    }
    
    return { roles: Array.from(roles), evidence };
}

// 维度2：分析权限链位置
function analyzePermissionChain(agentName, agentConfig, allAgents) {
    const roles = new Set();
    const evidence = [];
    
    if (!agentConfig || !agentConfig.permission) {
        return { roles: Array.from(roles), evidence };
    }
    
    // 2.1 如果此 Agent 能调用其他 Agent，说明是上游角色
    const canCall = agentConfig.permission.task || {};
    const calledAgents = Object.keys(canCall).filter(a => canCall[a] === 'allow');
    
    if (calledAgents.length > 0) {
        evidence.push({ type: '调用链', detail: `可调用: ${calledAgents.join(', ')}` });
        
        // 越靠后调用，越可能是下游（执行角色）
        if (calledAgents.includes('AICA') || calledAgents.includes('coder')) {
            roles.add('architect'); // 能调用 coder 的，可能是 architect
            evidence.push({ type: '权限推断', role: 'architect', weight: 5 });
        }
        if (calledAgents.includes('AITA') || calledAgents.includes('architect')) {
            roles.add('designer'); // 能调用 architect 的，可能是 designer
            evidence.push({ type: '权限推断', role: 'designer', weight: 5 });
        }
        if (calledAgents.includes('AIUIUX') || calledAgents.includes('designer')) {
            roles.add('ba'); // 能调用 designer 的，可能是 BA
            evidence.push({ type: '权限推断', role: 'ba', weight: 5 });
        }
    }
    
    // 2.2 如果被其他 Agent 调用，说明是下游角色
    for (const [otherAgent, otherConfig] of Object.entries(allAgents)) {
        if (otherAgent === agentName) continue;
        if (otherConfig.permission?.task?.[agentName] === 'allow') {
            evidence.push({ type: '被调用', detail: `被 ${otherAgent} 调用` });
        }
    }
    
    return { roles: Array.from(roles), evidence };
}

// 维度3：分析 Agent 描述字段
function analyzeAgentDescription(agentName, description) {
    const descLower = (description || '').toLowerCase();
    const roles = new Set();
    const evidence = [];
    
    // 3.1 检查角色关键词
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (descLower.includes(keyword.toLowerCase())) {
                roles.add(role);
                evidence.push({ type: `描述关键词:${keyword}`, role, weight: 3 });
            }
        }
    }
    
    // 3.2 检查动词
    for (const [verb, role] of Object.entries(VERB_TO_ROLE)) {
        if (descLower.includes(verb.toLowerCase())) {
            roles.add(role);
            evidence.push({ type: `描述动词:${verb}`, role, weight: 4 });
        }
    }
    
    // 3.3 检查输出物（"输出xxx" = 这个角色负责xxx）
    const outputPatterns = [
        { pattern: /输出需求文档|产出需求/i, role: 'ba' },
        { pattern: /输出设计规范|产出设计/i, role: 'designer' },
        { pattern: /输出架构方案|产出架构/i, role: 'architect' },
        { pattern: /生成代码|产出代码/i, role: 'coder' }
    ];
    
    for (const { pattern, role } of outputPatterns) {
        if (pattern.test(descLower)) {
            roles.add(role);
            evidence.push({ type: '输出物', role, weight: 6 });
        }
    }
    
    return { roles: Array.from(roles), evidence };
}

// 维度4：检查名称中的角色
function analyzeAgentName(agentName) {
    const nameLower = agentName.toLowerCase();
    const roles = new Set();
    const evidence = [];
    
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword.toLowerCase())) {
                roles.add(role);
                evidence.push({ type: `名称:${keyword}`, role, weight: 2 });
            }
        }
    }
    
    return { roles: Array.from(roles), evidence };
}

// 主角色提取函数（综合四个维度）
function extractAgentRoles(agent, agentDir, allAgents = {}, maxRoles = 4) {
    const results = {
        name: agent.name,
        dimensions: {},
        allRoles: new Set(),
        evidence: []
    };
    
    // 维度1：MD 文件内容分析（权重最高）
    const mdAnalysis = analyzeAgentMdFile(agent.name, agentDir);
    results.dimensions.mdFile = mdAnalysis;
    mdAnalysis.roles.forEach(r => results.allRoles.add(r));
    results.evidence.push(...mdAnalysis.evidence.map(e => ({ ...e, source: 'MD文件' })));
    
    // 维度2：权限链分析
    const permAnalysis = analyzePermissionChain(agent.name, agent.config, allAgents);
    results.dimensions.permissionChain = permAnalysis;
    permAnalysis.roles.forEach(r => results.allRoles.add(r));
    results.evidence.push(...permAnalysis.evidence.map(e => ({ ...e, source: '权限链' })));
    
    // 维度3：描述字段分析
    const descAnalysis = analyzeAgentDescription(agent.name, agent.description);
    results.dimensions.description = descAnalysis;
    descAnalysis.roles.forEach(r => results.allRoles.add(r));
    results.evidence.push(...descAnalysis.evidence.map(e => ({ ...e, source: '描述' })));
    
    // 维度4：名称分析（权重最低）
    const nameAnalysis = analyzeAgentName(agent.name);
    results.dimensions.name = nameAnalysis;
    nameAnalysis.roles.forEach(r => results.allRoles.add(r));
    results.evidence.push(...nameAnalysis.evidence.map(e => ({ ...e, source: '名称' })));
    
    // 计算每个角色的加权得分
    const roleScores = {};
    for (const evidence of results.evidence) {
        const weight = evidence.weight || 1;
        if (!roleScores[evidence.role]) {
            roleScores[evidence.role] = { score: 0, sources: [] };
        }
        roleScores[evidence.role].score += weight;
        roleScores[evidence.role].sources.push(`${evidence.source}:${evidence.type}`);
    }
    
    // 按得分排序，取前 maxRoles 个
    const sortedRoles = Object.entries(roleScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, maxRoles)
        .map(([role, data]) => ({
            role,
            score: data.score,
            sources: data.sources
        }));
    
    results.finalRoles = sortedRoles;
    results.roles = sortedRoles.map(r => r.role);
    
    return results;
}

// 获取工具的能力标签
function getToolCapabilities(toolName) {
    const name = toolName.toLowerCase();
    
    // 精确匹配
    if (TOOL_KEYWORDS[name]) {
        return TOOL_KEYWORDS[name];
    }
    
    // 前缀/包含匹配
    for (const [key, caps] of Object.entries(TOOL_KEYWORDS)) {
        if (name.includes(key) || key.includes(name.split('-')[0])) {
            return caps;
        }
    }
    
    return [];
}

// 匹配工具到 Agent（使用多维度分析）
function matchToolToAgents(tool, agentAnalysisResults, config = {}) {
    const recommendations = [];
    const toolName = tool.name || '';
    const toolCapabilities = getToolCapabilities(toolName);
    
    if (toolCapabilities.length === 0) {
        return recommendations; // 未知工具，不分配
    }
    
    // 检查是否是全局工具
    const isGlobal = toolCapabilities.some(cap => 
        ['memory', 'knowledge', 'search', 'web', 'workflow', 'automation', 'tool', 'management', 'skill'].includes(cap)
    );
    
    if (isGlobal) {
        // 全局工具：分配给所有人
        return Object.values(agentAnalysisResults).map(agent => ({
            agent: agent.name,
            reason: '全局工具',
            confidence: 'high',
            score: 100
        }));
    }
    
    // 非全局工具：使用多维度分析结果匹配
    for (const agent of Object.values(agentAnalysisResults)) {
        if (!agent.roles || agent.roles.length === 0) continue;
        
        let score = 0;
        const matchedCapabilities = [];
        const matchDetails = [];
        
        for (const cap of toolCapabilities) {
            const targetRoles = CAPABILITY_TO_AGENT[cap];
            if (!targetRoles) continue;
            
            if (targetRoles.includes('*')) {
                score += 5;
                matchedCapabilities.push(cap);
            } else {
                for (const agentRole of agent.roles) {
                    if (targetRoles.includes(agentRole)) {
                        // 根据角色得分加权
                        const roleData = agent.finalRoles.find(r => r.role === agentRole);
                        const weight = roleData ? Math.min(roleData.score / 10, 3) : 1;
                        score += weight;
                        matchedCapabilities.push(`${cap}→${agentRole}(${weight.toFixed(1)})`);
                        matchDetails.push({ cap, agentRole, weight });
                    }
                }
            }
        }
        
        // 名称直接匹配加分
        const agentNameLower = agent.name.toLowerCase();
        const toolMainWord = toolName.split('-')[0].toLowerCase();
        if (agentNameLower.includes(toolMainWord) || toolMainWord.includes(agentNameLower)) {
            score += 10;
            matchedCapabilities.push('名称匹配');
        }
        
        if (score > 0 && matchedCapabilities.length > 0) {
            recommendations.push({
                agent: agent.name,
                reason: matchedCapabilities.slice(0, 3).join(', '),
                confidence: score >= 6 ? 'high' : 'medium',
                score: score,
                agentRoles: agent.roles,
                matchDetails: matchDetails
            });
        }
    }
    
    // 按分数排序
    recommendations.sort((a, b) => b.score - a.score);
    
    // 过滤：只保留分数超过平均值的
    if (recommendations.length > 0) {
        const avgScore = recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length;
        const filtered = recommendations.filter(r => r.score >= avgScore * 0.6 || r.score >= 8);
        return filtered.slice(0, 3);
    }
    
    return recommendations;
}

// 匹配所有工具
function matchAllTools(analyzedTools, agentAnalysisResults, config = {}) {
    const result = [];

    for (const skill of analyzedTools.skills) {
        const matches = matchToolToAgents(skill, agentAnalysisResults, config);
        result.push({
            tool: skill.name,
            type: 'skill',
            tags: skill.tags,
            description: skill.description,
            recommendations: matches
        });
    }

    for (const mcp of analyzedTools.mcps) {
        const matches = matchToolToAgents(mcp, agentAnalysisResults, config);
        result.push({
            tool: mcp.name,
            type: 'mcp',
            tags: mcp.tags,
            description: mcp.description,
            recommendations: matches
        });
    }

    return result;
}

// 检查闲置工具
function findUnusedTools(matchedTools) {
    const unused = [];
    const used = [];

    for (const item of matchedTools) {
        if (item.recommendations.length === 0) {
            unused.push({
                tool: item.tool,
                type: item.type,
                reason: '没有匹配的 Agent'
            });
        } else {
            used.push(item);
        }
    }

    return { used, unused };
}

// 调试：显示 Agent 多维度提取结果
function debugAgentRoles(agentAnalysisResults) {
    console.log('\n🔍 Agent 角色多维度分析:');
    console.log('='.repeat(80));
    
    for (const agent of Object.values(agentAnalysisResults)) {
        console.log(`\n📌 ${agent.name}`);
        console.log(`   识别角色: ${agent.roles.join(', ') || '(未识别)'}`);
        console.log('   证据来源:');
        for (const r of agent.finalRoles || []) {
            console.log(`     - ${r.role} (得分:${r.score}) <- ${r.sources.join(', ')}`);
        }
    }
    console.log('');
}

// 分析所有 Agent（返回详细结果，供外部使用）
function analyzeAllAgents(agents, agentDir, opencodeConfig) {
    const results = {};
    
    // 构建权限图
    const allAgents = {};
    if (opencodeConfig && opencodeConfig.agent) {
        for (const [name, config] of Object.entries(opencodeConfig.agent)) {
            allAgents[name] = config;
        }
    }
    
    for (const agent of agents) {
        results[agent.name] = extractAgentRoles(
            agent, 
            agentDir, 
            allAgents,
            4
        );
    }
    
    return results;
}

module.exports = {
    matchToolToAgents,
    matchAllTools,
    findUnusedTools,
    extractAgentRoles,
    analyzeAllAgents,
    debugAgentRoles,
    getToolCapabilities,
    analyzeAgentMdFile,
    analyzePermissionChain,
    analyzeAgentDescription,
    analyzeAgentName,
    TOOL_KEYWORDS,
    ROLE_KEYWORDS,
    VERB_TO_ROLE,
    CAPABILITY_TO_AGENT
};
