import { useInvestments } from '../contexts/InvestmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { datacenterProjects } from '../data/datacenters';
import InvestmentChatSidebar from '@/components/InvestmentChatSidebar';
import LiveCashflow from '@/components/LiveCashflow';
import DatacenterConstructionUpdates from '@/components/DatacenterConstructionUpdates';
import { generateRevenueHistory } from '../data/revenueHistory';

const Dashboard = () => {
  const { investments, totalInvested, totalValue, totalReturn, availableBalance } = useInvestments();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const portfolioReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const STARTING_BALANCE = 100000;

  // Chart colors - diverse palette
  const COLORS = ['#a3e635', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

  // Portfolio Allocation Data
  const allocationData = investments.map((inv, index) => ({
    name: inv.projectName,
    value: inv.currentValue,
    percentage: totalValue > 0 ? (inv.currentValue / totalValue) * 100 : 0,
    color: COLORS[index % COLORS.length]
  }));

  // Performance over time data (simulated daily values)
  const getPerformanceData = () => {
    if (investments.length === 0) return [];

    const days = 30;
    const data = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      let totalValueAtDay = 0;
      investments.forEach(inv => {
        const invDate = new Date(inv.investmentDate);
        if (date >= invDate) {
          const daysSinceInv = Math.floor((date.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
          const dailyRate = inv.expectedAPY / 365 / 100;
          const growthFactor = Math.pow(1 + dailyRate, daysSinceInv);
          const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // +/- 1% daily variation
          totalValueAtDay += inv.amount * growthFactor * randomFactor;
        }
      });

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: totalValueAtDay,
        invested: totalInvested
      });
    }

    return data;
  };

  const performanceData = getPerformanceData();

  // Individual investment performance comparison (Built datacenters only)
  const getIndividualPerformanceData = () => {
    // Only show built datacenters with actual revenue
    const builtInvestments = investments.filter(inv => {
      const project = datacenterProjects.find(p => p.id === inv.projectId);
      return project?.buildStatus === 'Built';
    });

    if (builtInvestments.length === 0) return [];

    const days = 30;
    const data: any[] = [];
    const today = new Date();

    // Generate revenue history for each built datacenter
    const revenueHistories = new Map<string, any[]>();
    builtInvestments.forEach(inv => {
      const project = datacenterProjects.find(p => p.id === inv.projectId);
      if (!project) return;

      // Estimate average daily revenue based on project size
      const avgDailyRevenue = estimateAvgDailyRevenue(project);
      const history = generateRevenueHistory(inv.projectId, avgDailyRevenue, 90);
      revenueHistories.set(inv.id, history);
    });

    // Create data points for last 30 days
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dataPoint: any = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };

      builtInvestments.forEach(inv => {
        const project = datacenterProjects.find(p => p.id === inv.projectId);
        if (!project) return;

        const history = revenueHistories.get(inv.id);
        const dayData = history?.find(d => d.date === dateString);

        if (dayData) {
          // Calculate user's share of revenue based on ownership percentage
          const ownershipPercentage = (inv.amount / project.fundingGoal) * 100;
          const userRevenue = (dayData.revenue * ownershipPercentage) / 100;

          // Add to initial investment to show total value
          const totalValue = inv.amount + userRevenue * i; // Accumulated over days

          const key = inv.projectName.split(' ').slice(0, 2).join(' ');
          dataPoint[key] = totalValue;
        }
      });

      data.push(dataPoint);
    }

    return data;
  };

  // Estimate daily revenue based on datacenter specs
  const estimateAvgDailyRevenue = (project: any): number => {
    // Base estimates per GPU type ($/day at 85% utilization)
    const dailyRates: { [key: string]: number } = {
      'NVIDIA H100': 2.49 * 24 * 0.85,
      'NVIDIA H200': 3.20 * 24 * 0.85,
      'NVIDIA A100': 1.29 * 24 * 0.85,
      'NVIDIA L40S': 0.89 * 24 * 0.85,
      'NVIDIA V100': 0.49 * 24 * 0.85,
      'NVIDIA B100': 4.50 * 24 * 0.85,
    };

    let totalDaily = 0;
    project.gpuAllocations.forEach((allocation: any) => {
      const rate = dailyRates[allocation.type] || 20; // Default if not found
      totalDaily += allocation.count * rate;
    });

    return totalDaily;
  };

  const individualPerformanceData = getIndividualPerformanceData();
  const builtInvestmentsCount = investments.filter(inv => {
    const project = datacenterProjects.find(p => p.id === inv.projectId);
    return project?.buildStatus === 'Built';
  }).length;

  // APY Comparison Data
  const apyComparisonData = investments.map(inv => ({
    name: inv.projectName.split(' ').slice(0, 2).join(' '), // Shorten names
    apy: inv.expectedAPY,
    return: inv.returnPercentage
  }));

  // GPU Farm vs Datacenter breakdown
  const projectTypeData = investments.reduce((acc, inv) => {
    // Find the project to get its type
    const project = datacenterProjects.find(p => p.id === inv.projectId);
    const type = project?.projectType || 'Unknown';

    const existing = acc.find(item => item.type === type);
    if (existing) {
      existing.value += inv.currentValue;
      existing.count += 1;
    } else {
      acc.push({
        type,
        value: inv.currentValue,
        count: 1
      });
    }
    return acc;
  }, [] as Array<{ type: string; value: number; count: number }>);

  return (
    <div className="p-6 flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Dashboard Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-normal text-white">Investment Dashboard</h1>
          <p className="text-terminal-muted">Track your GPU datacenter portfolio</p>
        </div>

      {/* Individual Investment Comparison Chart */}
      {builtInvestmentsCount > 0 && individualPerformanceData.length > 0 && (
        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader>
            <CardTitle className="text-terminal-accent">Live Revenue Comparison - Built Datacenters</CardTitle>
            <p className="text-sm text-terminal-muted mt-1">
              Real revenue performance from operational facilities ({builtInvestmentsCount} {builtInvestmentsCount === 1 ? 'datacenter' : 'datacenters'})
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={individualPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrencyFull(value)}
                  contentStyle={{
                    backgroundColor: '#111111',
                    border: '1px solid #1f2937',
                    borderRadius: '0',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend wrapperStyle={{ color: '#6b7280' }} />
                {investments
                  .filter(inv => {
                    const project = datacenterProjects.find(p => p.id === inv.projectId);
                    return project?.buildStatus === 'Built';
                  })
                  .map((inv, index) => {
                    const key = inv.projectName.split(' ').slice(0, 2).join(' ');
                    return (
                      <Line
                        key={inv.id}
                        type="monotone"
                        dataKey={key}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        name={key}
                        dot={false}
                        connectNulls
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-terminal-muted font-normal">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{formatCurrency(availableBalance)}</div>
            <p className="text-xs text-terminal-muted mt-1">
              of {formatCurrency(STARTING_BALANCE)} starting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-terminal-muted font-normal">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-terminal-accent">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-terminal-muted mt-1">
              {investments.length} active {investments.length === 1 ? 'investment' : 'investments'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-terminal-muted font-normal">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{formatCurrency(totalValue)}</div>
            <p className={`text-xs mt-1 ${portfolioReturnPercentage >= 0 ? 'text-terminal-success' : 'text-terminal-danger'}`}>
              {portfolioReturnPercentage >= 0 ? '▲' : '▼'} {Math.abs(portfolioReturnPercentage).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-terminal-muted font-normal">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${totalReturn >= 0 ? 'text-terminal-success' : 'text-terminal-danger'}`}>
              {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
            </div>
            <p className="text-xs text-terminal-muted mt-1">
              All-time P&L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Allocation Pie Chart */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">Portfolio Allocation</CardTitle>
              <p className="text-sm text-terminal-muted mt-1">Distribution by project</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name.split(' ')[0]} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #1f2937',
                      borderRadius: '0',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {allocationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
                      <span className="text-terminal-text">{item.name}</span>
                    </div>
                    <span className="text-terminal-muted">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* GPU Farm vs Datacenter Breakdown */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">GPU Farms vs Datacenters</CardTitle>
              <p className="text-sm text-terminal-muted mt-1">Investment by project type</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, value }) => `${type}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #1f2937',
                      borderRadius: '0',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {projectTypeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3" style={{ backgroundColor: index === 0 ? '#3b82f6' : '#f59e0b' }} />
                      <span className="text-terminal-text">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-terminal-muted">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-terminal-muted">{item.count} {item.count === 1 ? 'project' : 'projects'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* APY Comparison Bar Chart */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">Expected APY vs. Current Returns</CardTitle>
              <p className="text-sm text-terminal-muted mt-1">Performance comparison</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #1f2937',
                      borderRadius: '0',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#6b7280' }}
                  />
                  <Bar dataKey="apy" fill="#84cc16" name="Expected APY" />
                  <Bar dataKey="return" fill="#a3e635" name="Current Return" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Cashflow & Construction Updates */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveCashflow />
          <DatacenterConstructionUpdates />
        </div>
      )}


      {/* Investments List */}
      {investments.length === 0 ? (
        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="text-terminal-muted text-lg">No investments yet</div>
              <p className="text-terminal-muted text-sm">
                Visit the Marketplace to start investing in GPU datacenters
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-terminal-surface border-terminal-border">
          <CardHeader>
            <CardTitle className="text-terminal-accent">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="bg-terminal-bg border border-terminal-border p-4 hover:border-terminal-accent transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold">{investment.projectName}</h3>
                      <p className="text-xs text-terminal-muted mt-1">
                        Invested on {formatDate(investment.investmentDate)}
                      </p>
                    </div>
                    <div className={`text-right ${investment.returnPercentage >= 0 ? 'text-terminal-success' : 'text-terminal-danger'}`}>
                      <div className="text-lg font-semibold">
                        {investment.returnPercentage >= 0 ? '+' : ''}{investment.returnPercentage.toFixed(2)}%
                      </div>
                      <div className="text-xs">
                        {investment.totalReturn >= 0 ? '+' : ''}{formatCurrency(investment.totalReturn)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-terminal-muted text-xs mb-1">Initial Investment</div>
                      <div className="text-white font-semibold">{formatCurrencyFull(investment.amount)}</div>
                    </div>
                    <div>
                      <div className="text-terminal-muted text-xs mb-1">Current Value</div>
                      <div className="text-white font-semibold">{formatCurrencyFull(investment.currentValue)}</div>
                    </div>
                    <div>
                      <div className="text-terminal-muted text-xs mb-1">Expected APY</div>
                      <div className="text-terminal-success font-semibold">{investment.expectedAPY}%</div>
                    </div>
                    <div>
                      <div className="text-terminal-muted text-xs mb-1">Shares Owned</div>
                      <div className="text-terminal-accent font-semibold">{investment.shares.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Value Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-terminal-muted mb-1">
                      <span>Performance</span>
                      <span>{((investment.currentValue / investment.amount) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min((investment.currentValue / investment.amount) * 100, 100)}
                      className="h-1.5 bg-terminal-border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* AI Chat Sidebar */}
      <div className="w-96 flex-shrink-0">
        <InvestmentChatSidebar />
      </div>
    </div>
  );
};

export default Dashboard;
