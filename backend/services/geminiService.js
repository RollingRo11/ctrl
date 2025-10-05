const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API (set GEMINI_API_KEY in environment variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const AGENT_PROMPTS = {
  'energy-optimizer': {
    system: 'You are an energy arbitrage optimizer for datacenters. Your goal is to minimize energy cost and emissions while respecting workload latency requirements. Analyze the data and provide actionable recommendations in JSON format with: decision, reasoning, financialImpact, carbonImpact, and affectedLocations.',
    dataFields: ['workloads', 'energy_prices', 'carbon_intensity', 'current_allocations']
  },
  'network-optimizer': {
    system: 'You are a network latency optimizer. Your goal is to minimize latency and maximize network performance by routing inference jobs to optimal peering hubs. Provide recommendations in JSON format with: decision, reasoning, latencyImpact, financialImpact, and affectedLocations.',
    dataFields: ['workloads', 'network_latencies', 'peering_points', 'traffic_patterns']
  },
  'supply-chain': {
    system: 'You are a supply chain resilience agent. Your goal is to identify logistics disruptions and recommend reroutes for GPU shipments and equipment. Provide recommendations in JSON format with: decision, reasoning, delayPrevented, financialImpact, and affectedRoutes.',
    dataFields: ['shipments', 'port_congestion', 'flight_delays', 'alternative_routes']
  },
  'carbon-offset': {
    system: 'You are a carbon offset strategist. Your goal is to suggest carbon offset purchases and strategies to minimize emissions. Provide recommendations in JSON format with: decision, reasoning, carbonImpact, cost, and recommendedProjects.',
    dataFields: ['current_emissions', 'carbon_prices', 'offset_projects', 'budget']
  },
  'gpu-arbitrage': {
    system: 'You are a GPU arbitrage optimizer. Your goal is to rebalance compute jobs across datacenters to maximize GPU utilization and revenue. Provide recommendations in JSON format with: decision, reasoning, utilizationIncrease, revenueImpact, and affectedDatacenters.',
    dataFields: ['gpu_utilization', 'job_queue', 'datacenter_capacity', 'spot_prices']
  },
  'risk-hedging': {
    system: 'You are a risk hedging agent. Your goal is to identify geopolitical and logistics risks and propose hedging strategies or insurance. Provide recommendations in JSON format with: decision, reasoning, riskLevel, potentialLoss, and recommendedHedges.',
    dataFields: ['geopolitical_events', 'supply_chain_risks', 'market_volatility', 'exposure']
  },
  'returns-maximizer': {
    system: 'You are a returns maximizer using Monte Carlo analysis. Your goal is to provide best-case, worst-case, and expected return scenarios. Provide analysis in JSON format with: expectedReturn, bestCase, worstCase, reasoning, and confidence.',
    dataFields: ['investment_portfolio', 'market_conditions', 'historical_performance', 'risk_factors']
  },
  'compliance-regulatory': {
    system: 'You are a compliance and regulatory monitoring agent. Your goal is to track regulatory changes, ensure datacenter compliance with local laws, and recommend actions to avoid penalties. Provide recommendations in JSON format with: decision, reasoning, complianceRisk, potentialFines, and recommendedActions.',
    dataFields: ['regulatory_updates', 'compliance_status', 'upcoming_regulations', 'datacenter_locations']
  }
};

// Get agent recommendation
exports.getAgentRecommendation = async (agentId, contextData) => {
  try {
    const prompt = AGENT_PROMPTS[agentId];
    if (!prompt) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const userPrompt = `${prompt.system}

Context Data:
${JSON.stringify(contextData, null, 2)}

Please analyze this data and provide your recommendation in valid JSON format only. Do not include any markdown formatting or code blocks, just the raw JSON object.`;

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const recommendation = JSON.parse(jsonText);

    return {
      agentId,
      timestamp: new Date().toISOString(),
      recommendation
    };
  } catch (error) {
    console.error('Gemini API error:', error);

    // Return a fallback recommendation if Gemini fails
    return {
      agentId,
      timestamp: new Date().toISOString(),
      recommendation: {
        decision: 'Unable to generate recommendation',
        reasoning: `Error: ${error.message}`,
        error: true
      }
    };
  }
};

// Run scenario simulation
exports.runScenarioSimulation = async (agentId, scenario, contextData) => {
  try {
    const prompt = AGENT_PROMPTS[agentId];
    if (!prompt) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const userPrompt = `${prompt.system}

Scenario Simulation:
${JSON.stringify(scenario, null, 2)}

Current Context Data:
${JSON.stringify(contextData, null, 2)}

Please analyze how this scenario would affect operations and provide your simulation results in valid JSON format only. Include: impact, recommendation, reasoning, bestCase, worstCase, and expectedOutcome. Do not include any markdown formatting or code blocks.`;

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const simulation = JSON.parse(jsonText);

    return {
      timestamp: new Date().toISOString(),
      scenario: scenario.description,
      simulation
    };
  } catch (error) {
    console.error('Gemini simulation error:', error);

    return {
      timestamp: new Date().toISOString(),
      scenario: scenario.description,
      simulation: {
        impact: 'Unable to simulate',
        reasoning: `Error: ${error.message}`,
        error: true
      }
    };
  }
};
