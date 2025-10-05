export interface GPUAllocation {
  type: string;
  count: number;
  specs?: string;
}

export interface DatacenterProject {
  id: string;
  name: string;
  location: string;
  totalGPUs: number;
  gpuAllocations: GPUAllocation[];
  fundingGoal: number;
  fundingCurrent: number;
  fundingPercentage: number;
  expectedAPY: number;
  minInvestment: number;
  projectType: 'GPU Farm' | 'Datacenter';
  status: 'Active' | 'Coming Soon' | 'Funded';
  buildStatus: 'Raising' | 'Built';
  powerCapacity: string;
  startDate: string;
  description: string;
  imageUrl?: string;
  coordinates?: string;
  operatorName?: string;
  networkCapacity?: string;
  coolingType?: string;
  uptime?: string;
  buildProgress?: number; // 0-100 for raising/in-progress projects
  constructionUpdates?: Array<{
    date: string;
    update: string;
  }>;
}
