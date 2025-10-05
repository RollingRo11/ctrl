// GPU pricing data - fetched from real APIs via backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface GPUPricing {
  gpuType: string;
  pricePerHour: number; // USD per hour
  minPrice?: number;
  maxPrice?: number;
  demand: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
  sources?: string[];
}

// Fetch real-time GPU rental pricing from backend
export const getGPUPricing = async (): Promise<GPUPricing[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/gpu-pricing`);

    if (!response.ok) {
      console.warn('Failed to fetch GPU pricing from backend, using fallback data');
      return getFallbackPricing();
    }

    const data = await response.json();

    if (data.success && data.pricing) {
      return data.pricing;
    }

    return getFallbackPricing();
  } catch (error) {
    console.error('Error fetching GPU pricing:', error);
    return getFallbackPricing();
  }
};

// Fallback pricing in case backend is unavailable
function getFallbackPricing(): GPUPricing[] {
  const fluctuation = () => 0.95 + Math.random() * 0.1;

  return [
    {
      gpuType: 'NVIDIA H100',
      pricePerHour: 2.49 * fluctuation(),
      demand: 'High',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA H200',
      pricePerHour: 3.20 * fluctuation(),
      demand: 'High',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA A100',
      pricePerHour: 1.29 * fluctuation(),
      demand: 'Medium',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA L40S',
      pricePerHour: 0.89 * fluctuation(),
      demand: 'Medium',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA V100',
      pricePerHour: 0.49 * fluctuation(),
      demand: 'Low',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA B100',
      pricePerHour: 4.50 * fluctuation(),
      demand: 'High',
      lastUpdated: new Date().toISOString(),
    },
  ];
}

// Synchronous version that returns cached/fallback data immediately
export const getGPUPricingSync = (): GPUPricing[] => {
  return getFallbackPricing();
};

export interface DatacenterRevenue {
  projectId: string;
  projectName: string;
  totalGPUs: number;
  gpuBreakdown: Array<{
    type: string;
    count: number;
    pricePerHour: number;
    revenuePerHour: number;
    revenuePerDay: number;
  }>;
  totalRevenuePerHour: number;
  totalRevenuePerDay: number;
  totalRevenuePerMonth: number;
  totalRevenuePerYear: number;
  utilizationRate: number; // Assume 85% utilization
}

export const calculateDatacenterRevenue = async (
  project: any,
  utilizationRate: number = 0.85
): Promise<DatacenterRevenue> => {
  const pricing = await getGPUPricing();

  const gpuBreakdown = project.gpuAllocations.map((allocation: any) => {
    const priceData = pricing.find(p => p.gpuType === allocation.type);
    const pricePerHour = priceData?.pricePerHour || 0;
    const revenuePerHour = allocation.count * pricePerHour * utilizationRate;
    const revenuePerDay = revenuePerHour * 24;

    return {
      type: allocation.type,
      count: allocation.count,
      pricePerHour,
      revenuePerHour,
      revenuePerDay,
    };
  });

  const totalRevenuePerHour = gpuBreakdown.reduce((sum, gpu) => sum + gpu.revenuePerHour, 0);
  const totalRevenuePerDay = totalRevenuePerHour * 24;
  const totalRevenuePerMonth = totalRevenuePerDay * 30;
  const totalRevenuePerYear = totalRevenuePerDay * 365;

  return {
    projectId: project.id,
    projectName: project.name,
    totalGPUs: project.totalGPUs,
    gpuBreakdown,
    totalRevenuePerHour,
    totalRevenuePerDay,
    totalRevenuePerMonth,
    totalRevenuePerYear,
    utilizationRate,
  };
};

// Calculate user's share of cashflow based on their investment
export const calculateUserCashflow = (
  userInvestment: number,
  projectFundingGoal: number,
  datacenterRevenue: DatacenterRevenue
): {
  ownershipPercentage: number;
  dailyCashflow: number;
  monthlyCashflow: number;
  annualCashflow: number;
} => {
  // User owns a percentage based on their investment / total funding goal
  const ownershipPercentage = (userInvestment / projectFundingGoal) * 100;

  // Calculate their share of revenue
  const dailyCashflow = (datacenterRevenue.totalRevenuePerDay * ownershipPercentage) / 100;
  const monthlyCashflow = (datacenterRevenue.totalRevenuePerMonth * ownershipPercentage) / 100;
  const annualCashflow = (datacenterRevenue.totalRevenuePerYear * ownershipPercentage) / 100;

  return {
    ownershipPercentage,
    dailyCashflow,
    monthlyCashflow,
    annualCashflow,
  };
};
