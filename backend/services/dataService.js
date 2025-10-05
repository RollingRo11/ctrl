// Mock data service - integrate real APIs in production
// Real APIs: EIA, ENTSO-E, MarineTraffic, OpenSky, NOAA, Verra, GDELT

const mockData = {
  energyPrices: {
    'Texas': { price: 0.087, currency: 'USD/kWh', updated: new Date().toISOString() },
    'Phoenix': { price: 0.156, currency: 'USD/kWh', updated: new Date().toISOString() },
    'Iceland': { price: 0.084, currency: 'USD/kWh', updated: new Date().toISOString() },
    'Oregon': { price: 0.095, currency: 'USD/kWh', updated: new Date().toISOString() },
    'Virginia': { price: 0.112, currency: 'USD/kWh', updated: new Date().toISOString() }
  },
  carbonIntensity: {
    'Texas': 0.4,
    'Phoenix': 0.3,
    'Iceland': 0.0,
    'Oregon': 0.15,
    'Virginia': 0.35
  },
  networkLatencies: {
    'Texas': { 'Phoenix': 45, 'Iceland': 89, 'Oregon': 52, 'Virginia': 38 },
    'Phoenix': { 'Texas': 45, 'Iceland': 105, 'Oregon': 38, 'Virginia': 72 },
    'Iceland': { 'Texas': 89, 'Phoenix': 105, 'Oregon': 98, 'Virginia': 65 },
    'Oregon': { 'Texas': 52, 'Phoenix': 38, 'Iceland': 98, 'Virginia': 78 },
    'Virginia': { 'Texas': 38, 'Phoenix': 72, 'Iceland': 65, 'Oregon': 78 }
  },
  portCongestion: [
    { port: 'Los Angeles', congestionLevel: 'high', delayDays: 12 },
    { port: 'Singapore', congestionLevel: 'medium', delayDays: 5 },
    { port: 'Rotterdam', congestionLevel: 'low', delayDays: 2 }
  ],
  gpuUtilization: {
    'Texas': 0.78,
    'Phoenix': 0.92,
    'Iceland': 0.65,
    'Oregon': 0.85,
    'Virginia': 0.88
  }
};

// Get data for specific agent type
exports.getDataForAgent = async (agentId) => {
  try {
    switch (agentId) {
      case 'energy-optimizer':
        return {
          workloads: [
            { job: 'Meta Training', location: 'Phoenix', gpuHours: 1000, latency_tolerance_ms: 100 },
            { job: 'Inference Cluster', location: 'Texas', gpuHours: 500, latency_tolerance_ms: 50 }
          ],
          energy_prices: mockData.energyPrices,
          carbon_intensity: mockData.carbonIntensity,
          current_allocations: {
            'Phoenix': 1000,
            'Texas': 500,
            'Iceland': 0,
            'Oregon': 0,
            'Virginia': 0
          }
        };

      case 'network-optimizer':
        return {
          workloads: [
            { job: 'API Inference', source: 'Virginia', qps: 10000, latency_sla: 100 }
          ],
          network_latencies: mockData.networkLatencies,
          peering_points: ['Virginia', 'Texas', 'Oregon'],
          traffic_patterns: {
            'Virginia': 10000,
            'Texas': 3000,
            'Oregon': 2000
          }
        };

      case 'supply-chain':
        return {
          shipments: [
            { id: 'GPU-001', origin: 'Taiwan', destination: 'Texas', eta: '2025-11-15', route: 'Pacific' },
            { id: 'GPU-002', origin: 'Singapore', destination: 'Virginia', eta: '2025-11-10', route: 'Suez' }
          ],
          port_congestion: mockData.portCongestion,
          flight_delays: { average_delay_hours: 4.5 },
          alternative_routes: [
            { from: 'Pacific', to: 'Panama Canal', additional_days: 3, cost_increase: 5000 }
          ]
        };

      case 'carbon-offset':
        return {
          current_emissions: {
            total_tons_per_year: 50000,
            by_location: {
              'Texas': 15000,
              'Phoenix': 12000,
              'Virginia': 18000,
              'Oregon': 3000,
              'Iceland': 0
            }
          },
          carbon_prices: {
            'Verra': 12.5,
            'Gold Standard': 15.0,
            'Direct Air Capture': 150.0
          },
          offset_projects: [
            { name: 'Forest Conservation Brazil', price: 12.5, tons_available: 100000 },
            { name: 'Wind Farm India', price: 14.0, tons_available: 50000 }
          ],
          budget: 500000
        };

      case 'gpu-arbitrage':
        return {
          gpu_utilization: mockData.gpuUtilization,
          job_queue: [
            { job: 'Training', gpu_hours: 500, priority: 'high' },
            { job: 'Batch Inference', gpu_hours: 200, priority: 'medium' }
          ],
          datacenter_capacity: {
            'Texas': 1000,
            'Phoenix': 800,
            'Iceland': 1200,
            'Oregon': 900,
            'Virginia': 1100
          },
          spot_prices: {
            'Texas': 1.2,
            'Phoenix': 1.5,
            'Iceland': 0.9,
            'Oregon': 1.1,
            'Virginia': 1.3
          }
        };

      case 'risk-hedging':
        return {
          geopolitical_events: [
            { region: 'South China Sea', risk_level: 'medium', impact: 'shipping delays' },
            { region: 'Middle East', risk_level: 'high', impact: 'oil prices' }
          ],
          supply_chain_risks: [
            { supplier: 'TSMC', risk: 'earthquake', probability: 0.15 },
            { supplier: 'Samsung', risk: 'trade restrictions', probability: 0.25 }
          ],
          market_volatility: {
            'energy': 0.35,
            'gpu_prices': 0.42,
            'shipping': 0.28
          },
          exposure: {
            'Taiwan': 5000000,
            'China': 2000000,
            'Europe': 3000000
          }
        };

      case 'returns-maximizer':
        return {
          investment_portfolio: {
            datacenters: [
              { location: 'Texas', investment: 10000000, current_value: 12000000, apy: 0.20 },
              { location: 'Iceland', investment: 8000000, current_value: 9500000, apy: 0.18 }
            ],
            total_invested: 18000000,
            current_value: 21500000
          },
          market_conditions: {
            ai_demand_growth: 0.45,
            energy_price_trend: 'stable',
            competition: 'increasing'
          },
          historical_performance: {
            year_1: 0.22,
            year_2: 0.18,
            year_3: 0.20
          },
          risk_factors: [
            { factor: 'regulatory changes', impact: 'medium' },
            { factor: 'tech obsolescence', impact: 'high' }
          ]
        };

      case 'compliance-regulatory':
        return {
          regulatory_updates: [
            { region: 'EU', regulation: 'AI Act 2024', effective_date: '2025-12-01', impact: 'high' },
            { region: 'California', regulation: 'Data Privacy Amendment', effective_date: '2025-06-15', impact: 'medium' },
            { region: 'Texas', regulation: 'Energy Grid Compliance', effective_date: '2025-03-01', impact: 'low' }
          ],
          compliance_status: {
            'Texas': { status: 'compliant', last_audit: '2024-09-15', next_audit: '2025-03-15' },
            'Phoenix': { status: 'needs_attention', last_audit: '2024-08-01', issues: ['water usage permits'] },
            'Virginia': { status: 'compliant', last_audit: '2024-10-01', next_audit: '2025-04-01' },
            'Iceland': { status: 'compliant', last_audit: '2024-07-20', next_audit: '2025-01-20' }
          },
          upcoming_regulations: [
            { title: 'Carbon Border Tax', region: 'EU', estimated_cost: 250000, effective_2026: true },
            { title: 'Mandatory Renewable Energy', region: 'California', estimated_cost: 180000, effective_2025: true }
          ],
          datacenter_locations: ['Texas', 'Phoenix', 'Virginia', 'Iceland', 'Oregon']
        };

      default:
        return {};
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return {};
  }
};

// Fetch real-time energy prices (placeholder for EIA/ENTSO-E integration)
exports.getEnergyPrices = async () => {
  // TODO: Integrate with EIA API (https://www.eia.gov/opendata/)
  // TODO: Integrate with ENTSO-E API (https://transparency.entsoe.eu/)
  return mockData.energyPrices;
};

// Fetch logistics data (placeholder for MarineTraffic/OpenSky integration)
exports.getLogisticsData = async () => {
  // TODO: Integrate with MarineTraffic API
  // TODO: Integrate with OpenSky Network API
  return {
    ports: mockData.portCongestion,
    flights: { average_delay_hours: 4.5 }
  };
};

// Fetch weather and climate data (placeholder for NOAA integration)
exports.getWeatherRisks = async () => {
  // TODO: Integrate with NOAA API
  return {
    hurricanes: [],
    heat_waves: [{ location: 'Phoenix', severity: 'high' }],
    floods: []
  };
};

// Fetch carbon offset data (placeholder for Verra/Gold Standard integration)
exports.getCarbonOffsets = async () => {
  // TODO: Integrate with Verra Registry API
  // TODO: Integrate with Gold Standard API
  return mockData.carbonIntensity;
};
