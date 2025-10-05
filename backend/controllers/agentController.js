const geminiService = require('../services/geminiService');
const dataService = require('../services/dataService');

// In-memory store for agent states (use database in production)
const agentStates = {
  'energy-optimizer': { id: 'energy-optimizer', name: 'Energy Optimizer', icon: '⚡', active: false, status: 'idle' },
  'network-optimizer': { id: 'network-optimizer', name: 'Network/Latency Optimizer', icon: '🌐', active: false, status: 'idle' },
  'supply-chain': { id: 'supply-chain', name: 'Supply Chain Resilience Agent', icon: '🚢', active: false, status: 'idle' },
  'carbon-offset': { id: 'carbon-offset', name: 'Carbon Offset Strategist', icon: '🌱', active: false, status: 'idle' },
  'gpu-arbitrage': { id: 'gpu-arbitrage', name: 'GPU Arbitrage Agent', icon: '🎮', active: false, status: 'idle' },
  'risk-hedging': { id: 'risk-hedging', name: 'Risk Hedging Agent', icon: '🛡', active: false, status: 'idle' },
  'returns-maximizer': { id: 'returns-maximizer', name: 'Returns Maximizer', icon: '📈', active: false, status: 'idle' },
  'compliance-regulatory': { id: 'compliance-regulatory', name: 'Compliance & Regulatory Agent', icon: '⚖️', active: false, status: 'idle' }
};

const actionLogs = [];

// Get all agents
exports.getAllAgents = async (req, res) => {
  try {
    res.json({
      agents: Object.values(agentStates),
      recentActions: actionLogs.slice(-20).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle agent active/inactive
exports.toggleAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentStates[agentId];

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.active = !agent.active;
    agent.status = agent.active ? 'active' : 'idle';

    // Log the toggle action
    actionLogs.push({
      id: Date.now(),
      agentId,
      agentName: agent.name,
      timestamp: new Date().toISOString(),
      action: agent.active ? 'activated' : 'deactivated',
      reasoning: agent.active ? 'Agent enabled by user' : 'Agent disabled by user'
    });

    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get agent actions
exports.getAgentActions = async (req, res) => {
  try {
    const { agentId } = req.params;
    const actions = actionLogs.filter(log => log.agentId === agentId);
    res.json({ actions: actions.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get agent recommendation
exports.getRecommendation = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentStates[agentId];

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Fetch relevant data based on agent type
    const contextData = await dataService.getDataForAgent(agentId);

    // Get Gemini recommendation
    const recommendation = await geminiService.getAgentRecommendation(agentId, contextData);

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Execute agent action
exports.executeAction = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action } = req.body;
    const agent = agentStates[agentId];

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log the action
    const logEntry = {
      id: Date.now(),
      agentId,
      agentName: agent.name,
      timestamp: new Date().toISOString(),
      action: action.decision || action.action,
      reasoning: action.reasoning,
      financialImpact: action.financialImpact,
      carbonImpact: action.carbonImpact,
      affectedLocations: action.affectedLocations || []
    };

    actionLogs.push(logEntry);

    res.json({ success: true, log: logEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Run scenario simulation
exports.runSimulation = async (req, res) => {
  try {
    const { scenario, agentIds } = req.body;

    // Run simulation with Gemini for each agent
    const results = await Promise.all(
      agentIds.map(async (agentId) => {
        const contextData = await dataService.getDataForAgent(agentId);
        const simulation = await geminiService.runScenarioSimulation(agentId, scenario, contextData);
        return {
          agentId,
          agentName: agentStates[agentId]?.name,
          ...simulation
        };
      })
    );

    res.json({ scenario, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
