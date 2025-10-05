import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Investment, InvestmentContextType } from '../types/investment';

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const useInvestments = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestments must be used within InvestmentProvider');
  }
  return context;
};

interface InvestmentProviderProps {
  children: ReactNode;
}

export const InvestmentProvider = ({ children }: InvestmentProviderProps) => {
  const STARTING_BALANCE = 100000; // $100k starting balance for demo

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const stored = localStorage.getItem('investments');
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever investments change
  useEffect(() => {
    localStorage.setItem('investments', JSON.stringify(investments));
  }, [investments]);

  // Calculate current values with simulated growth
  const investmentsWithCurrentValue = investments.map(inv => {
    const daysSinceInvestment = Math.floor(
      (new Date().getTime() - new Date(inv.investmentDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Simulate daily growth based on APY
    const dailyRate = inv.expectedAPY / 365 / 100;
    const growthFactor = Math.pow(1 + dailyRate, daysSinceInvestment);

    // Add some randomness for realism (-5% to +5%)
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05);

    const currentValue = inv.amount * growthFactor * randomFactor;
    const totalReturn = currentValue - inv.amount;
    const returnPercentage = ((currentValue - inv.amount) / inv.amount) * 100;

    return {
      ...inv,
      currentValue,
      totalReturn,
      returnPercentage
    };
  });

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = investmentsWithCurrentValue.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturn = totalValue - totalInvested;
  const availableBalance = STARTING_BALANCE - totalInvested;

  const addInvestment = (projectId: string, projectName: string, amount: number, expectedAPY: number) => {
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      projectId,
      projectName,
      amount,
      shares: amount / 1000, // $1000 per share
      investmentDate: new Date().toISOString(),
      expectedAPY,
      currentValue: amount,
      totalReturn: 0,
      returnPercentage: 0
    };

    setInvestments(prev => [...prev, newInvestment]);
  };

  return (
    <InvestmentContext.Provider
      value={{
        investments: investmentsWithCurrentValue,
        totalInvested,
        totalValue,
        totalReturn,
        availableBalance,
        addInvestment
      }}
    >
      {children}
    </InvestmentContext.Provider>
  );
};
