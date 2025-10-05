export interface Investment {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  shares: number;
  investmentDate: string;
  expectedAPY: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
}

export interface InvestmentContextType {
  investments: Investment[];
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  availableBalance: number;
  addInvestment: (projectId: string, projectName: string, amount: number, expectedAPY: number) => void;
}
