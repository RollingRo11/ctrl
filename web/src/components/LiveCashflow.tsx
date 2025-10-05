import { useInvestments } from '../contexts/InvestmentContext';
import { datacenterProjects } from '../data/datacenters';
import { calculateDatacenterRevenue, calculateUserCashflow, DatacenterRevenue } from '../lib/gpuPricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

const LiveCashflow = () => {
  const { investments } = useInvestments();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [revenueData, setRevenueData] = useState<Map<string, DatacenterRevenue>>(new Map());

  // Fetch revenue data for all built projects
  useEffect(() => {
    const fetchRevenueData = async () => {
      const builtProjects = datacenterProjects.filter(p => p.buildStatus === 'Built');
      const revenueMap = new Map<string, DatacenterRevenue>();

      for (const project of builtProjects) {
        const revenue = await calculateDatacenterRevenue(project);
        revenueMap.set(project.id, revenue);
      }

      setRevenueData(revenueMap);
    };

    fetchRevenueData();

    // Update every 2 minutes
    const interval = setInterval(fetchRevenueData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Update time every minute for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  // Get investments in built datacenters
  const builtInvestments = investments.filter(inv => {
    const project = datacenterProjects.find(p => p.id === inv.projectId);
    return project?.buildStatus === 'Built';
  });

  if (builtInvestments.length === 0) {
    return (
      <Card className="bg-terminal-surface border-terminal-border">
        <CardHeader>
          <CardTitle className="text-terminal-accent">Live Cashflow</CardTitle>
          <p className="text-sm text-terminal-muted mt-1">Real-time revenue from operational datacenters</p>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <div className="text-terminal-muted">No investments in built datacenters yet</div>
            <p className="text-xs text-terminal-muted">
              Invest in projects with "Built" status to start earning live cashflow
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDailyCashflow = builtInvestments.reduce((sum, inv) => {
    const project = datacenterProjects.find(p => p.id === inv.projectId);
    if (!project) return sum;

    const revenue = revenueData.get(project.id);
    if (!revenue) return sum;

    const userCashflow = calculateUserCashflow(inv.amount, project.fundingGoal, revenue);
    return sum + userCashflow.dailyCashflow;
  }, 0);

  const totalMonthlyCashflow = totalDailyCashflow * 30;
  const totalAnnualCashflow = totalDailyCashflow * 365;

  return (
    <Card className="bg-terminal-surface border-terminal-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-terminal-accent">Live Cashflow</CardTitle>
            <p className="text-sm text-terminal-muted mt-1">Real-time revenue from operational datacenters</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-terminal-success rounded-full animate-pulse"></div>
            <span className="text-xs text-terminal-muted">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Cashflow Overview */}
        <div className="bg-terminal-bg border-2 border-terminal-accent p-6 space-y-4">
          <div className="text-center">
            <div className="text-sm text-terminal-muted mb-2">Your Daily Revenue</div>
            <div className="text-4xl font-bold text-terminal-accent">
              {formatCurrency(totalDailyCashflow)}
            </div>
            <div className="text-xs text-terminal-muted mt-2">
              {formatCurrency(totalDailyCashflow / 24)}/hour
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-terminal-border">
            <div className="text-center">
              <div className="text-xs text-terminal-muted mb-1">Monthly</div>
              <div className="text-xl font-semibold text-terminal-success">
                {formatCurrencyCompact(totalMonthlyCashflow)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-terminal-muted mb-1">Annually</div>
              <div className="text-xl font-semibold text-terminal-success">
                {formatCurrencyCompact(totalAnnualCashflow)}
              </div>
            </div>
          </div>
        </div>

        {/* Per-Project Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm text-terminal-muted font-semibold">Project Breakdown</h4>
          {builtInvestments.map(inv => {
            const project = datacenterProjects.find(p => p.id === inv.projectId);
            if (!project) return null;

            const revenue = revenueData.get(project.id);
            if (!revenue) return null;

            const userCashflow = calculateUserCashflow(inv.amount, project.fundingGoal, revenue);

            return (
              <div
                key={inv.id}
                className="bg-terminal-bg border border-terminal-border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-white font-semibold">{project.name}</h5>
                    <p className="text-xs text-terminal-muted mt-1">
                      {userCashflow.ownershipPercentage.toFixed(3)}% ownership
                    </p>
                  </div>
                  <Badge className="bg-terminal-success text-terminal-bg">
                    Live
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-terminal-muted mb-1">Daily</div>
                    <div className="text-terminal-accent font-semibold">
                      {formatCurrency(userCashflow.dailyCashflow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-terminal-muted mb-1">Monthly</div>
                    <div className="text-white font-semibold">
                      {formatCurrencyCompact(userCashflow.monthlyCashflow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-terminal-muted mb-1">Annual</div>
                    <div className="text-white font-semibold">
                      {formatCurrencyCompact(userCashflow.annualCashflow)}
                    </div>
                  </div>
                </div>

                {/* GPU Revenue Breakdown */}
                <div className="pt-3 border-t border-terminal-border space-y-2">
                  <div className="text-xs text-terminal-muted font-semibold mb-2">Revenue by GPU Type</div>
                  {revenue.gpuBreakdown.map((gpu, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-terminal-muted">
                        {gpu.count}× {gpu.type}
                      </span>
                      <span className="text-terminal-text">
                        ${gpu.pricePerHour.toFixed(2)}/hr → {formatCurrency(gpu.revenuePerDay)}/day
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-terminal-border text-xs text-terminal-muted">
                  <div className="flex justify-between">
                    <span>Total Datacenter Revenue</span>
                    <span className="text-terminal-text">{formatCurrencyCompact(revenue.totalRevenuePerDay)}/day</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Utilization Rate</span>
                    <span className="text-terminal-success">{(revenue.utilizationRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveCashflow;
