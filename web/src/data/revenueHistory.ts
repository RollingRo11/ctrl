// Synthetic revenue history for built datacenters
// Simulates 90 days of historical revenue data

export interface DailyRevenue {
  date: string;
  revenue: number;
  utilization: number;
}

// Generate realistic revenue history for a datacenter
export const generateRevenueHistory = (
  projectId: string,
  avgDailyRevenue: number,
  daysHistory: number = 90
): DailyRevenue[] => {
  const history: DailyRevenue[] = [];
  const today = new Date();

  // Add trend and seasonality
  const seed = projectId.charCodeAt(0); // Deterministic based on project ID

  for (let i = daysHistory; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Base utilization around 85% with variance
    const baseUtilization = 0.85;

    // Add weekly cycle (weekends slightly lower utilization)
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.95 : 1.0;

    // Add some random variation (+/- 10%)
    const randomFactor = 0.9 + (Math.sin(seed + i) * 0.1);

    // Slight upward trend over time (business growth)
    const trendFactor = 1 + ((daysHistory - i) / daysHistory) * 0.15;

    const utilization = baseUtilization * weekendFactor * randomFactor;
    const revenue = avgDailyRevenue * trendFactor * utilization;

    history.push({
      date: date.toISOString().split('T')[0],
      revenue: parseFloat(revenue.toFixed(2)),
      utilization: parseFloat((utilization * 100).toFixed(2)),
    });
  }

  return history;
};

// Get revenue history for all built datacenters
export const getBuiltDatacenterHistory = (projectIds: string[]): Map<string, DailyRevenue[]> => {
  const historyMap = new Map<string, DailyRevenue[]>();

  // Example average daily revenues (would come from real pricing data)
  const avgRevenues: { [key: string]: number } = {
    '1': 95000,  // Phoenix AI Cluster (H100s)
    '2': 52000,  // Iceland Compute Hub (A100s)
    '4': 28000,  // Singapore Edge Node (L40S)
  };

  projectIds.forEach(id => {
    if (avgRevenues[id]) {
      historyMap.set(id, generateRevenueHistory(id, avgRevenues[id]));
    }
  });

  return historyMap;
};
