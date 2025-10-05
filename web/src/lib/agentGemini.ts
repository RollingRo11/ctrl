import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(API_KEY);

// Agent system prompts
const AGENT_PROMPTS: { [key: string]: string } = {
  'energy-optimizer': 'You are an energy arbitrage optimizer for datacenters. Your goal is to minimize energy cost and emissions while respecting workload latency requirements. Analyze the data and provide actionable recommendations in JSON format with: decision, reasoning, financialImpact, carbonImpact, and affectedLocations.',
  'network-optimizer': 'You are a network latency optimizer. Your goal is to minimize latency and maximize network performance by routing inference jobs to optimal peering hubs. Provide recommendations in JSON format with: decision, reasoning, latencyImpact, financialImpact, and affectedLocations.',
  'supply-chain': 'You are a supply chain resilience agent. Your goal is to identify logistics disruptions and recommend reroutes for GPU shipments and equipment. Provide recommendations in JSON format with: decision, reasoning, delayPrevented, financialImpact, and affectedRoutes.',
  'carbon-offset': 'You are a carbon offset strategist. Your goal is to suggest carbon offset purchases and strategies to minimize emissions. Provide recommendations in JSON format with: decision, reasoning, carbonImpact, cost, and recommendedProjects.',
  'gpu-arbitrage': 'You are a GPU arbitrage optimizer. Your goal is to rebalance compute jobs across datacenters to maximize GPU utilization and revenue. Provide recommendations in JSON format with: decision, reasoning, utilizationIncrease, revenueImpact, and affectedDatacenters.',
  'risk-hedging': 'You are a risk hedging agent. Your goal is to identify geopolitical and logistics risks and propose hedging strategies or insurance. Provide recommendations in JSON format with: decision, reasoning, riskLevel, potentialLoss, and recommendedHedges.',
  'returns-maximizer': 'You are a returns maximizer using Monte Carlo analysis. Your goal is to provide best-case, worst-case, and expected return scenarios. Provide analysis in JSON format with: expectedReturn, bestCase, worstCase, reasoning, and confidence.',
  'compliance-regulatory': 'You are a compliance and regulatory monitoring agent. Your goal is to track regulatory changes, ensure datacenter compliance with local laws, and recommend actions to avoid penalties. Provide recommendations in JSON format with: decision, reasoning, complianceRisk, potentialFines, and recommendedActions.'
};

// Mock context data generators for each agent
const generateMockContext = (agentId: string): any => {
  const baseContext = {
    timestamp: new Date().toISOString(),
    datacenters: [
      { location: 'Virginia', capacity: 1000, utilization: 0.85, energyPrice: 0.12, carbonIntensity: 450 },
      { location: 'Oregon', capacity: 800, utilization: 0.72, energyPrice: 0.08, carbonIntensity: 280 },
      { location: 'Singapore', capacity: 600, utilization: 0.91, energyPrice: 0.18, carbonIntensity: 520 }
    ]
  };

  switch (agentId) {
    case 'energy-optimizer':
      return {
        ...baseContext,
        workloads: [
          { id: 'wl-1', priority: 'high', currentLocation: 'Virginia', gpuHours: 500 },
          { id: 'wl-2', priority: 'medium', currentLocation: 'Singapore', gpuHours: 300 }
        ],
        energy_prices: baseContext.datacenters.map(dc => ({ location: dc.location, price: dc.energyPrice })),
        carbon_intensity: baseContext.datacenters.map(dc => ({ location: dc.location, intensity: dc.carbonIntensity }))
      };

    case 'network-optimizer':
      return {
        ...baseContext,
        workloads: [
          { id: 'wl-1', latencyRequirement: 50, currentLocation: 'Virginia' },
          { id: 'wl-2', latencyRequirement: 100, currentLocation: 'Oregon' }
        ],
        network_latencies: [
          { from: 'Virginia', to: 'US-East', latency: 5 },
          { from: 'Oregon', to: 'US-West', latency: 8 },
          { from: 'Singapore', to: 'APAC', latency: 12 }
        ]
      };

    case 'supply-chain':
      return {
        shipments: [
          { id: 'ship-1', origin: 'Taiwan', destination: 'Virginia', gpuCount: 500, status: 'in-transit', eta: '2025-10-15' },
          { id: 'ship-2', origin: 'China', destination: 'Oregon', gpuCount: 300, status: 'port-congestion', eta: '2025-10-20' }
        ],
        port_congestion: [
          { port: 'Los Angeles', congestionLevel: 'high', delay: 7 },
          { port: 'Seattle', congestionLevel: 'medium', delay: 3 }
        ],
        alternative_routes: [
          { from: 'China', via: 'Vancouver', to: 'Oregon', additionalDays: 2 }
        ]
      };

    case 'gpu-arbitrage':
      return {
        ...baseContext,
        gpu_utilization: baseContext.datacenters.map(dc => ({ location: dc.location, utilization: dc.utilization })),
        job_queue: [
          { priority: 'high', gpuHours: 200, currentQueue: 'Virginia' },
          { priority: 'medium', gpuHours: 150, currentQueue: 'Oregon' }
        ],
        spot_prices: [
          { location: 'Virginia', price: 2.10 },
          { location: 'Oregon', price: 1.95 },
          { location: 'Singapore', price: 2.45 }
        ]
      };

    case 'returns-maximizer':
      return {
        investment_portfolio: [
          { name: 'Virginia DC', invested: 50000, currentValue: 54500, apy: 15 },
          { name: 'Oregon DC', invested: 35000, currentValue: 37200, apy: 12 }
        ],
        market_conditions: {
          gpuDemand: 'high',
          energyCosts: 'rising',
          regulatoryRisk: 'low'
        }
      };

    default:
      return baseContext;
  }
};

export interface AgentRecommendation {
  agentId: string;
  timestamp: string;
  recommendation: {
    decision: string;
    reasoning: string;
    financialImpact?: string;
    carbonImpact?: string;
    affectedLocations?: string[];
    utilizationIncrease?: string;
    revenueImpact?: string;
    affectedDatacenters?: string[];
    [key: string]: any;
  };
}

// Get agent recommendation using Gemini
export async function getAgentRecommendation(agentId: string, contextData?: any): Promise<AgentRecommendation> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'demo-key') {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = AGENT_PROMPTS[agentId];
    if (!systemPrompt) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Use provided context or generate mock data
    const context = contextData || generateMockContext(agentId);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt
    });

    const prompt = `
Context Data:
${JSON.stringify(context, null, 2)}

Please analyze this data and provide your recommendation in valid JSON format only. Do not include any markdown formatting or code blocks, just the raw JSON object. Make sure the JSON has the required fields as specified in the system instruction.
`;

    const result = await model.generateContent(prompt);
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
  } catch (error: any) {
    console.error('Gemini API error:', error);

    // Return a fallback recommendation if Gemini fails
    return {
      agentId,
      timestamp: new Date().toISOString(),
      recommendation: {
        decision: 'Unable to generate recommendation',
        reasoning: error.message || 'An error occurred while calling the Gemini API',
        error: true
      }
    };
  }
}

// Run scenario simulation
export async function runScenarioSimulation(
  agentId: string,
  scenario: { description: string; parameters?: any },
  contextData?: any
): Promise<{
  timestamp: string;
  scenario: string;
  simulation: any;
}> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'demo-key') {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = AGENT_PROMPTS[agentId];
    if (!systemPrompt) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const context = contextData || generateMockContext(agentId);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt
    });

    const prompt = `
Scenario Simulation:
${JSON.stringify(scenario, null, 2)}

Current Context Data:
${JSON.stringify(context, null, 2)}

Please analyze how this scenario would affect operations and provide your simulation results in valid JSON format only. Include: impact, recommendation, reasoning, bestCase, worstCase, and expectedOutcome. Do not include any markdown formatting or code blocks.
`;

    const result = await model.generateContent(prompt);
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
  } catch (error: any) {
    console.error('Gemini simulation error:', error);

    return {
      timestamp: new Date().toISOString(),
      scenario: scenario.description,
      simulation: {
        impact: 'Unable to simulate',
        reasoning: error.message || 'An error occurred while calling the Gemini API',
        error: true
      }
    };
  }
}
