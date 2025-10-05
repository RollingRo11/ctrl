import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Info, TrendingUp, Lightbulb, BarChart3, RefreshCw, Play, Pause, Save, Trash2, Copy } from 'lucide-react';
import { datacenterProjects } from '../data/datacenters';

type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';
type GeoDiversification = 'Single Region' | 'Multi-Region' | 'Global';
type ReinvestmentStrategy = 'Withdraw Returns' | 'Compound Returns';

interface SimulationInputs {
  investmentAmount: number;
  timeline: number;
  riskTolerance: RiskTolerance;
  gpuFarmPercent: number;
  geoDiversification: GeoDiversification;
  reinvestmentStrategy: ReinvestmentStrategy;
}

interface ForecastVariable {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  tooltip: string;
}

interface AIInsight {
  type: 'positive' | 'warning' | 'opportunity';
  message: string;
  icon: string;
}

interface SavedScenario extends SimulationInputs {
  id: string;
  name: string;
  savedAt: Date;
}

const Simulation = () => {
  const [inputs, setInputs] = useState<SimulationInputs>({
    investmentAmount: 10000,
    timeline: 3,
    riskTolerance: 'Moderate',
    gpuFarmPercent: 50,
    geoDiversification: 'Multi-Region',
    reinvestmentStrategy: 'Compound Returns',
  });

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(100);
  const [selectedCompareScenarios, setSelectedCompareScenarios] = useState<string[]>([]);

  const applyPreset = (preset: string) => {
    resetAnimation();
    switch (preset) {
      case 'conservative':
        setInputs({
          investmentAmount: 5000,
          timeline: 5,
          riskTolerance: 'Conservative',
          gpuFarmPercent: 30,
          geoDiversification: 'Global',
          reinvestmentStrategy: 'Compound Returns',
        });
        break;
      case 'aggressive':
        setInputs({
          investmentAmount: 25000,
          timeline: 2,
          riskTolerance: 'Aggressive',
          gpuFarmPercent: 80,
          geoDiversification: 'Single Region',
          reinvestmentStrategy: 'Compound Returns',
        });
        break;
      case 'green':
        setInputs({
          investmentAmount: 15000,
          timeline: 4,
          riskTolerance: 'Moderate',
          gpuFarmPercent: 40,
          geoDiversification: 'Multi-Region',
          reinvestmentStrategy: 'Compound Returns',
        });
        break;
      case 'early-stage':
        setInputs({
          investmentAmount: 20000,
          timeline: 3,
          riskTolerance: 'Aggressive',
          gpuFarmPercent: 70,
          geoDiversification: 'Single Region',
          reinvestmentStrategy: 'Compound Returns',
        });
        break;
    }
  };

  const saveScenario = () => {
    const scenario: SavedScenario = {
      ...inputs,
      id: `scenario-${Date.now()}`,
      name: `${inputs.riskTolerance} - ${formatCurrency(inputs.investmentAmount)} - ${inputs.timeline}y`,
      savedAt: new Date(),
    };
    setSavedScenarios([...savedScenarios, scenario]);
  };

  const deleteScenario = (id: string) => {
    setSavedScenarios(savedScenarios.filter(s => s.id !== id));
    setSelectedCompareScenarios(selectedCompareScenarios.filter(sid => sid !== id));
  };

  const loadScenario = (scenario: SavedScenario) => {
    resetAnimation();
    setInputs({
      investmentAmount: scenario.investmentAmount,
      timeline: scenario.timeline,
      riskTolerance: scenario.riskTolerance,
      gpuFarmPercent: scenario.gpuFarmPercent,
      geoDiversification: scenario.geoDiversification,
      reinvestmentStrategy: scenario.reinvestmentStrategy,
    });
  };

  const toggleCompareScenario = (id: string) => {
    if (selectedCompareScenarios.includes(id)) {
      setSelectedCompareScenarios(selectedCompareScenarios.filter(sid => sid !== id));
    } else if (selectedCompareScenarios.length < 3) {
      setSelectedCompareScenarios([...selectedCompareScenarios, id]);
    }
  };

  // Animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnimating) {
      interval = setInterval(() => {
        setAnimationProgress((prev) => {
          if (prev >= 100) {
            setIsAnimating(false);
            return 100;
          }
          return prev + 1;
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isAnimating]);

  const handlePlayPause = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (animationProgress >= 100) {
        setAnimationProgress(0);
      }
      setIsAnimating(true);
    }
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setAnimationProgress(100);
  };

  // Utility function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  // Calculate forecasting variables
  const forecastVariables: ForecastVariable[] = useMemo(() => {
    const baseGrowth = inputs.riskTolerance === 'Aggressive' ? 45 : inputs.riskTolerance === 'Moderate' ? 32 : 22;
    const utilization = inputs.gpuFarmPercent > 60 ? 87 : inputs.gpuFarmPercent > 40 ? 78 : 72;

    return [
      {
        label: 'AI/ML Market Demand Growth',
        value: `${baseGrowth}% projected`,
        trend: 'up',
        tooltip: 'Expected growth in AI compute demand based on industry forecasts and adoption rates'
      },
      {
        label: 'Average GPU Utilization Rate',
        value: `${utilization}%`,
        trend: 'stable',
        tooltip: 'Percentage of time GPUs are actively processing workloads and generating revenue'
      },
      {
        label: 'Energy Cost Trends',
        value: inputs.geoDiversification === 'Global' ? 'Stable +2.1%' : 'Up +5.3%',
        trend: inputs.geoDiversification === 'Global' ? 'stable' : 'up',
        tooltip: 'Projected energy cost changes affecting operational expenses and margins'
      },
      {
        label: 'Hardware Depreciation Rate',
        value: '15.5% annually',
        trend: 'down',
        tooltip: 'Rate at which GPU hardware loses value due to technological advancement'
      },
      {
        label: 'Competition Index',
        value: inputs.riskTolerance === 'Aggressive' ? 'High' : inputs.riskTolerance === 'Moderate' ? 'Medium' : 'Low',
        trend: 'up',
        tooltip: 'Level of market competition for compute resources in target segments'
      },
      {
        label: 'Regulatory Risk Score',
        value: inputs.geoDiversification === 'Single Region' ? '6/10' : inputs.geoDiversification === 'Multi-Region' ? '4/10' : '3/10',
        trend: inputs.geoDiversification === 'Single Region' ? 'up' : 'stable',
        tooltip: 'Assessment of regulatory and compliance risks across deployment regions'
      },
    ];
  }, [inputs]);

  // Calculate projection data
  const projectionData = useMemo(() => {
    const baseAPY = inputs.riskTolerance === 'Aggressive' ? 0.21 : inputs.riskTolerance === 'Moderate' ? 0.17 : 0.14;
    const volatility = inputs.riskTolerance === 'Aggressive' ? 0.08 : inputs.riskTolerance === 'Moderate' ? 0.05 : 0.03;
    const compoundBonus = inputs.reinvestmentStrategy === 'Compound Returns' ? 1.15 : 1.0;
    const geoBonus = inputs.geoDiversification === 'Global' ? 1.08 : inputs.geoDiversification === 'Multi-Region' ? 1.04 : 1.0;

    const effectiveAPY = baseAPY * compoundBonus * geoBonus;
    const months = inputs.timeline * 12;
    const data = [];

    for (let i = 0; i <= months; i++) {
      const yearsFraction = i / 12;
      const expectedValue = inputs.investmentAmount * Math.pow(1 + effectiveAPY, yearsFraction);
      const bestValue = inputs.investmentAmount * Math.pow(1 + effectiveAPY + volatility, yearsFraction);
      const worstValue = inputs.investmentAmount * Math.pow(1 + effectiveAPY - volatility, yearsFraction);

      data.push({
        month: i,
        label: i % 12 === 0 ? `Year ${i / 12}` : '',
        expected: Math.round(expectedValue),
        best: Math.round(bestValue),
        worst: Math.round(worstValue),
      });
    }

    return data;
  }, [inputs]);

  // Animated projection data
  const animatedProjectionData = useMemo(() => {
    const visiblePoints = Math.floor((projectionData.length * animationProgress) / 100);
    return projectionData.slice(0, Math.max(2, visiblePoints));
  }, [projectionData, animationProgress]);

  // Portfolio allocation data
  const allocationData = useMemo(() => {
    return [
      { name: 'GPU Farms', value: inputs.gpuFarmPercent, color: '#a3e635' },
      { name: 'Datacenters', value: 100 - inputs.gpuFarmPercent, color: '#84cc16' },
    ];
  }, [inputs.gpuFarmPercent]);

  // Risk breakdown radar chart
  const riskBreakdownData = useMemo(() => {
    const marketRisk = inputs.riskTolerance === 'Aggressive' ? 85 : inputs.riskTolerance === 'Moderate' ? 60 : 35;
    const geoRisk = inputs.geoDiversification === 'Single Region' ? 75 : inputs.geoDiversification === 'Multi-Region' ? 45 : 25;
    const concentrationRisk = inputs.gpuFarmPercent > 70 || inputs.gpuFarmPercent < 30 ? 70 : 40;
    const liquidityRisk = inputs.timeline > 5 ? 60 : 35;
    const operationalRisk = inputs.reinvestmentStrategy === 'Compound Returns' ? 55 : 40;

    return [
      { metric: 'Market Risk', value: marketRisk, fullMark: 100 },
      { metric: 'Geographic Risk', value: geoRisk, fullMark: 100 },
      { metric: 'Concentration', value: concentrationRisk, fullMark: 100 },
      { metric: 'Liquidity', value: liquidityRisk, fullMark: 100 },
      { metric: 'Operational', value: operationalRisk, fullMark: 100 },
    ];
  }, [inputs]);

  // Returns distribution by year
  const yearlyReturnsData = useMemo(() => {
    const data = [];
    for (let year = 1; year <= inputs.timeline; year++) {
      const yearIndex = year * 12;
      if (yearIndex < projectionData.length) {
        const yearData = projectionData[yearIndex];
        const prevYearData = projectionData[(year - 1) * 12];
        data.push({
          year: `Year ${year}`,
          return: yearData.expected - prevYearData.expected,
          cumulative: yearData.expected - inputs.investmentAmount,
        });
      }
    }
    return data;
  }, [projectionData, inputs]);

  // Comparison data for saved scenarios
  const comparisonData = useMemo(() => {
    if (selectedCompareScenarios.length === 0) return null;

    const compareScenarios = savedScenarios.filter(s => selectedCompareScenarios.includes(s.id));

    return compareScenarios.map(scenario => {
      const baseAPY = scenario.riskTolerance === 'Aggressive' ? 0.21 : scenario.riskTolerance === 'Moderate' ? 0.17 : 0.14;
      const compoundBonus = scenario.reinvestmentStrategy === 'Compound Returns' ? 1.15 : 1.0;
      const geoBonus = scenario.geoDiversification === 'Global' ? 1.08 : scenario.geoDiversification === 'Multi-Region' ? 1.04 : 1.0;
      const effectiveAPY = baseAPY * compoundBonus * geoBonus;
      const finalValue = scenario.investmentAmount * Math.pow(1 + effectiveAPY, scenario.timeline);

      return {
        name: scenario.name,
        finalValue: Math.round(finalValue),
        initialInvestment: scenario.investmentAmount,
        return: Math.round(finalValue - scenario.investmentAmount),
        apy: (effectiveAPY * 100).toFixed(1),
      };
    });
  }, [selectedCompareScenarios, savedScenarios]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const finalExpected = projectionData[projectionData.length - 1].expected;
    const totalReturn = finalExpected - inputs.investmentAmount;
    const returnPercent = ((finalExpected / inputs.investmentAmount - 1) * 100);
    const annualAPY = (Math.pow(finalExpected / inputs.investmentAmount, 1 / inputs.timeline) - 1) * 100;

    // Find break-even point
    let breakEvenMonth = 0;
    for (let i = 0; i < projectionData.length; i++) {
      if (projectionData[i].expected > inputs.investmentAmount) {
        breakEvenMonth = i;
        break;
      }
    }

    const totalDividends = totalReturn * 0.65;
    const riskScore = inputs.riskTolerance === 'Aggressive' ? 8.2 : inputs.riskTolerance === 'Moderate' ? 5.5 : 3.1;

    return {
      totalReturn,
      returnPercent,
      annualAPY,
      breakEvenMonth,
      totalDividends,
      riskScore,
    };
  }, [projectionData, inputs]);

  // Generate AI insights
  const aiInsights: AIInsight[] = useMemo(() => {
    const insights: AIInsight[] = [];
    const builtProjects = datacenterProjects.filter(p => p.buildStatus === 'Built');
    const raisingProjects = datacenterProjects.filter(p => p.buildStatus === 'Raising');
    const bestAPY = Math.max(...builtProjects.map(p => p.expectedAPY));
    const bestProject = builtProjects.find(p => p.expectedAPY === bestAPY);

    if (bestProject) {
      insights.push({
        type: 'positive',
        message: `Based on current trends, investing in ${bestProject.name} has 73% probability of exceeding ${bestProject.expectedAPY}% APY`,
        icon: '✓',
      });
    }

    // Add negative outcome warnings
    if (inputs.riskTolerance === 'Aggressive' && inputs.timeline < 3) {
      insights.push({
        type: 'warning',
        message: '⚠️ High-risk short-term investments have 32% probability of -15% to -25% losses during market downturns',
        icon: '⚠️',
      });
    }

    if (inputs.geoDiversification === 'Single Region' && inputs.gpuFarmPercent > 60) {
      insights.push({
        type: 'warning',
        message: '⚠️ Heavy concentration in single region carries 28% risk of significant losses from localized energy cost spikes or regulatory changes',
        icon: '⚠️',
      });
    }

    // Add GPU obsolescence risk
    if (inputs.gpuFarmPercent > 70 && inputs.timeline > 4) {
      insights.push({
        type: 'warning',
        message: '⚠️ GPU-heavy portfolio over 4+ years faces 40% probability of -20% to -30% value loss due to hardware obsolescence',
        icon: '⚠️',
      });
    }

    const strongRaisingProject = raisingProjects.find(p => p.fundingPercentage < 20 && p.expectedAPY > 20);
    if (strongRaisingProject && inputs.riskTolerance === 'Aggressive') {
      insights.push({
        type: 'opportunity',
        message: `💡 ${strongRaisingProject.name} in fundraising phase shows strong fundamentals with ${strongRaisingProject.expectedAPY}% projected APY, but carries 25% default risk`,
        icon: '💡',
      });
    }

    // Add market downturn risk
    if (inputs.riskTolerance === 'Aggressive' && inputs.reinvestmentStrategy === 'Compound Returns') {
      insights.push({
        type: 'warning',
        message: '⚠️ Aggressive compounding strategy has 35% probability of -10% to -40% drawdowns during AI market corrections',
        icon: '⚠️',
      });
    }

    const avgRiskScore = inputs.riskTolerance === 'Aggressive' ? 40 : inputs.riskTolerance === 'Moderate' ? 0 : -35;
    insights.push({
      type: avgRiskScore > 20 ? 'warning' : 'positive',
      message: `Your portfolio is ${Math.abs(avgRiskScore)}% ${avgRiskScore > 0 ? 'more' : 'less'} volatile than average investor`,
      icon: avgRiskScore > 20 ? '⚠️' : '✓',
    });

    if (inputs.geoDiversification === 'Global') {
      insights.push({
        type: 'positive',
        message: '✓ Global diversification reduces exposure to regional regulatory and energy market risks by 45%',
        icon: '✓',
      });
    }

    return insights;
  }, [inputs]);

  // Monte Carlo distribution data
  const monteCarloData = useMemo(() => {
    if (!showMonteCarlo) return [];

    const finalValue = projectionData[projectionData.length - 1].expected;
    const baseVolatility = inputs.riskTolerance === 'Aggressive' ? 0.25 : inputs.riskTolerance === 'Moderate' ? 0.15 : 0.08;
    const stdDev = finalValue * baseVolatility;

    const bins: { min: number; max: number; count: number; label: string }[] = [];
    const numBins = 20;
    const minValue = finalValue - 3 * stdDev;
    const maxValue = finalValue + 3 * stdDev;
    const binWidth = (maxValue - minValue) / numBins;

    for (let i = 0; i < numBins; i++) {
      const midpoint = minValue + (i + 0.5) * binWidth;
      bins.push({
        min: minValue + i * binWidth,
        max: minValue + (i + 1) * binWidth,
        count: 0,
        label: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(midpoint),
      });
    }

    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const randNormal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const simulatedValue = finalValue + randNormal * stdDev;

      const binIndex = Math.floor((simulatedValue - minValue) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex].count++;
      }
    }

    return bins.map(bin => ({
      value: (bin.min + bin.max) / 2,
      count: bin.count,
      probability: (bin.count / iterations) * 100,
      label: bin.label,
    }));
  }, [showMonteCarlo, projectionData, inputs.riskTolerance]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-terminal-surface border border-terminal-accent p-3 rounded">
          <p className="text-white text-sm mb-2">Month {payload[0].payload.month}</p>
          <p className="text-terminal-success text-sm">Best: {formatCurrency(payload[0].payload.best)}</p>
          <p className="text-terminal-accent text-sm">Expected: {formatCurrency(payload[0].payload.expected)}</p>
          <p className="text-terminal-warning text-sm">Worst: {formatCurrency(payload[0].payload.worst)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Animation Controls */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-normal text-white">Investment Simulation</h1>
          <p className="text-terminal-muted">Forecast and test investment scenarios using AI-powered predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
          >
            {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAnimating ? 'Pause' : 'Play'}
          </Button>
          <Button
            onClick={resetAnimation}
            variant="outline"
            className="border-terminal-border text-white hover:bg-terminal-border"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-terminal-muted">Quick Presets:</span>
        <Button
          onClick={() => applyPreset('conservative')}
          size="sm"
          className="bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border hover:border-terminal-accent"
        >
          Conservative: Steady Income
        </Button>
        <Button
          onClick={() => applyPreset('aggressive')}
          size="sm"
          className="bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border hover:border-terminal-accent"
        >
          Aggressive: High Growth
        </Button>
        <Button
          onClick={() => applyPreset('green')}
          size="sm"
          className="bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border hover:border-terminal-accent"
        >
          Green Energy Focus
        </Button>
        <Button
          onClick={() => applyPreset('early-stage')}
          size="sm"
          className="bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border hover:border-terminal-accent"
        >
          Early Stage Opportunities
        </Button>
      </div>

      {/* Investment Parameters - At Top */}
      <Card className="bg-terminal-surface border-terminal-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-terminal-accent" />
            Investment Scenario Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Investment Amount */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-terminal-text">Investment Amount</label>
                <span className="text-terminal-accent font-semibold">{formatCurrency(inputs.investmentAmount)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={inputs.investmentAmount}
                onChange={(e) => {
                  setInputs({ ...inputs, investmentAmount: Number(e.target.value) });
                  resetAnimation();
                }}
                className="w-full h-2 bg-terminal-border rounded-lg appearance-none cursor-pointer accent-terminal-accent"
              />
              <div className="flex justify-between text-xs text-terminal-muted">
                <span>$500</span>
                <span>$100K</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-terminal-text">Investment Timeline</label>
                <span className="text-terminal-accent font-semibold">{inputs.timeline} years</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={inputs.timeline}
                onChange={(e) => {
                  setInputs({ ...inputs, timeline: Number(e.target.value) });
                  resetAnimation();
                }}
                className="w-full h-2 bg-terminal-border rounded-lg appearance-none cursor-pointer accent-terminal-accent"
              />
              <div className="flex justify-between text-xs text-terminal-muted">
                <span>1 year</span>
                <span>10 years</span>
              </div>
            </div>

            {/* Portfolio Mix */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-terminal-text">Portfolio Mix</label>
                <span className="text-terminal-accent font-semibold">
                  {inputs.gpuFarmPercent}% GPU / {100 - inputs.gpuFarmPercent}% DC
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={inputs.gpuFarmPercent}
                onChange={(e) => {
                  setInputs({ ...inputs, gpuFarmPercent: Number(e.target.value) });
                  resetAnimation();
                }}
                className="w-full h-2 bg-terminal-border rounded-lg appearance-none cursor-pointer accent-terminal-accent"
              />
              <div className="flex justify-between text-xs text-terminal-muted">
                <span>100% DC</span>
                <span>100% GPU</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Risk Tolerance */}
            <div className="space-y-3">
              <label className="text-sm text-terminal-text">Risk Tolerance</label>
              <div className="flex gap-2">
                {(['Conservative', 'Moderate', 'Aggressive'] as RiskTolerance[]).map((risk) => (
                  <Button
                    key={risk}
                    onClick={() => {
                      setInputs({ ...inputs, riskTolerance: risk });
                      resetAnimation();
                    }}
                    size="sm"
                    className={
                      inputs.riskTolerance === risk
                        ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90 flex-1 text-xs'
                        : 'bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border flex-1 text-xs'
                    }
                  >
                    {risk}
                  </Button>
                ))}
              </div>
            </div>

            {/* Geographic Diversification */}
            <div className="space-y-3">
              <label className="text-sm text-terminal-text">Geographic Diversification</label>
              <select
                value={inputs.geoDiversification}
                onChange={(e) => {
                  setInputs({ ...inputs, geoDiversification: e.target.value as GeoDiversification });
                  resetAnimation();
                }}
                className="w-full bg-terminal-bg border border-terminal-border text-white p-2 rounded hover:border-terminal-accent focus:border-terminal-accent focus:outline-none text-sm"
              >
                <option>Single Region</option>
                <option>Multi-Region</option>
                <option>Global</option>
              </select>
            </div>

            {/* Reinvestment Strategy */}
            <div className="space-y-3">
              <label className="text-sm text-terminal-text">Reinvestment Strategy</label>
              <div className="flex gap-2">
                {(['Withdraw Returns', 'Compound Returns'] as ReinvestmentStrategy[]).map((strategy) => (
                  <Button
                    key={strategy}
                    onClick={() => {
                      setInputs({ ...inputs, reinvestmentStrategy: strategy });
                      resetAnimation();
                    }}
                    size="sm"
                    className={
                      inputs.reinvestmentStrategy === strategy
                        ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90 flex-1 text-xs'
                        : 'bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border flex-1 text-xs'
                    }
                  >
                    {strategy === 'Withdraw Returns' ? 'Withdraw' : 'Compound'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Projection Chart - Smaller */}
      <Card className="bg-terminal-surface border-terminal-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Portfolio Value Projection</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-terminal-muted">
                Progress: <span className="text-terminal-accent font-semibold">{animationProgress}%</span>
              </div>
              <Button
                size="sm"
                onClick={saveScenario}
                className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Scenario
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={animatedProjectionData}>
              <defs>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => value % 12 === 0 ? `Y${value / 12}` : ''}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#f8fafc' }}
                iconType="line"
              />
              <Area
                type="monotone"
                dataKey="best"
                stroke="#84cc16"
                strokeWidth={1}
                fill="transparent"
                name="Best Case"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke="#a3e635"
                strokeWidth={3}
                fill="url(#colorExpected)"
                name="Expected Case"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="worst"
                stroke="#f59e0b"
                strokeWidth={1}
                fill="transparent"
                name="Worst Case"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics - Immediately Below Chart */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Total Projected Return</div>
            <div className="text-2xl font-semibold text-terminal-accent">{formatCurrency(metrics.totalReturn)}</div>
            <div className="text-sm text-terminal-success">+{metrics.returnPercent.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Expected Annual APY</div>
            <div className="text-2xl font-semibold text-terminal-accent">{metrics.annualAPY.toFixed(1)}%</div>
            <div className="text-sm text-terminal-muted">Per year</div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Break-even Point</div>
            <div className="text-2xl font-semibold text-terminal-accent">{metrics.breakEvenMonth}</div>
            <div className="text-sm text-terminal-muted">months</div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Total Dividends</div>
            <div className="text-2xl font-semibold text-terminal-accent">{formatCurrency(metrics.totalDividends)}</div>
            <div className="text-sm text-terminal-muted">Estimated</div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Risk Score</div>
            <div className="text-2xl font-semibold text-terminal-accent">{metrics.riskScore.toFixed(1)}/10</div>
            <div className="text-sm text-terminal-muted">
              {metrics.riskScore < 4 ? 'Low' : metrics.riskScore < 7 ? 'Medium' : 'High'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-colors">
          <CardContent className="pt-6">
            <div className="text-xs text-terminal-muted mb-1">Confidence Level</div>
            <div className="text-2xl font-semibold text-terminal-accent">
              {inputs.geoDiversification === 'Global' ? '87%' : inputs.geoDiversification === 'Multi-Region' ? '78%' : '65%'}
            </div>
            <div className="text-sm text-terminal-muted">AI Model</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Forecasting Variables */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-terminal-accent" />
                AI Forecasting Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {forecastVariables.map((variable, idx) => (
                  <div
                    key={idx}
                    className="bg-terminal-bg border border-terminal-border p-3 rounded hover:border-terminal-accent transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-terminal-muted">{variable.label}</span>
                      <div className="relative group/tooltip">
                        <Info className="w-3 h-3 text-terminal-muted hover:text-terminal-accent cursor-help" />
                        <div className="absolute right-0 top-5 w-48 bg-terminal-bg border border-terminal-accent p-2 rounded text-xs text-white opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10">
                          {variable.tooltip}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{variable.value}</span>
                      <span className={`text-xs ${
                        variable.trend === 'up' ? 'text-terminal-success' :
                        variable.trend === 'down' ? 'text-terminal-danger' :
                        'text-terminal-warning'
                      }`}>
                        {variable.trend === 'up' ? '↑' : variable.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Visualization Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Allocation Pie Chart */}
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-white text-lg">Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid #a3e635' }}
                      formatter={(value: any) => `${value}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-terminal-muted">GPU Farms:</span>
                    <span className="text-white font-semibold">{inputs.gpuFarmPercent}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-terminal-muted">Datacenters:</span>
                    <span className="text-white font-semibold">{100 - inputs.gpuFarmPercent}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Breakdown Radar */}
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-white text-lg">Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskBreakdownData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#d1d5db', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#d1d5db', fontSize: 11 }} />
                    <Radar
                      name="Risk Level"
                      dataKey="value"
                      stroke="#a3e635"
                      fill="#a3e635"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid #a3e635' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Yearly Returns Bar Chart */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-white">Annual Returns Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={yearlyReturnsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="year" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #a3e635' }}
                    formatter={(value: any) => formatCurrency(value)}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ color: '#f8fafc' }} />
                  <Bar dataKey="return" fill="#a3e635" name="Annual Return" />
                  <Bar dataKey="cumulative" fill="#84cc16" name="Cumulative Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monte Carlo Distribution */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Monte Carlo Simulation (1000 iterations)</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowMonteCarlo(!showMonteCarlo)}
                  className={
                    showMonteCarlo
                      ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90'
                      : 'bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border'
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {showMonteCarlo ? 'Hide' : 'Run'} Monte Carlo
                </Button>
              </div>
            </CardHeader>
            {showMonteCarlo && monteCarloData.length > 0 && (
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monteCarloData}>
                    <defs>
                      <linearGradient id="colorMC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="label"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid #a3e635' }}
                      labelStyle={{ color: '#f8fafc' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'count') return [value, 'Occurrences'];
                        if (name === 'probability') return [`${value.toFixed(2)}%`, 'Probability'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="count" fill="url(#colorMC)" name="count" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-terminal-bg p-3 rounded border border-terminal-warning/30">
                    <div className="text-xs text-terminal-muted mb-1">10th Percentile</div>
                    <div className="text-lg font-semibold text-terminal-warning">
                      {formatCurrency(projectionData[projectionData.length - 1].worst * 0.9)}
                    </div>
                    <div className="text-xs text-terminal-muted mt-1">Worst-case scenario</div>
                  </div>
                  <div className="bg-terminal-bg p-3 rounded border border-terminal-accent/30">
                    <div className="text-xs text-terminal-muted mb-1">50th Percentile</div>
                    <div className="text-lg font-semibold text-terminal-accent">
                      {formatCurrency(projectionData[projectionData.length - 1].expected)}
                    </div>
                    <div className="text-xs text-terminal-muted mt-1">Most likely outcome</div>
                  </div>
                  <div className="bg-terminal-bg p-3 rounded border border-terminal-success/30">
                    <div className="text-xs text-terminal-muted mb-1">90th Percentile</div>
                    <div className="text-lg font-semibold text-terminal-success">
                      {formatCurrency(projectionData[projectionData.length - 1].best * 1.1)}
                    </div>
                    <div className="text-xs text-terminal-muted mt-1">Best-case scenario</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-terminal-bg rounded border border-terminal-accent/30 text-center">
                  <p className="text-white">
                    <span className="text-terminal-accent font-semibold text-xl">73%</span> probability of exceeding{' '}
                    <span className="text-terminal-accent font-semibold text-xl">
                      {formatCurrency(projectionData[projectionData.length - 1].expected * 1.15)}
                    </span>{' '}
                    in returns
                  </p>
                  <p className="text-terminal-muted text-sm mt-2">Based on {inputs.riskTolerance.toLowerCase()} risk profile and historical market volatility</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Scenario Comparison */}
          {comparisonData && comparisonData.length > 0 && (
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-white">Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280' }} tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} width={150} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid #a3e635' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ color: '#f8fafc' }} />
                    <Bar dataKey="finalValue" fill="#a3e635" name="Final Value" />
                    <Bar dataKey="return" fill="#84cc16" name="Total Return" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-terminal-border">
                        <th className="text-left py-2 text-terminal-muted">Scenario</th>
                        <th className="text-right py-2 text-terminal-muted">Initial</th>
                        <th className="text-right py-2 text-terminal-muted">Final Value</th>
                        <th className="text-right py-2 text-terminal-muted">Return</th>
                        <th className="text-right py-2 text-terminal-muted">APY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((scenario, idx) => (
                        <tr key={idx} className="border-b border-terminal-border/50">
                          <td className="py-2 text-white">{scenario.name}</td>
                          <td className="text-right py-2 text-terminal-muted">{formatCurrency(scenario.initialInvestment)}</td>
                          <td className="text-right py-2 text-terminal-accent font-semibold">{formatCurrency(scenario.finalValue)}</td>
                          <td className="text-right py-2 text-terminal-success">{formatCurrency(scenario.return)}</td>
                          <td className="text-right py-2 text-white">{scenario.apy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - AI Insights & Saved Scenarios */}
        <div className="space-y-6">
          <Card className="bg-terminal-surface border-terminal-border sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-terminal-accent" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border ${
                    insight.type === 'positive'
                      ? 'bg-terminal-success/10 border-terminal-success/30'
                      : insight.type === 'warning'
                      ? 'bg-terminal-warning/10 border-terminal-warning/30'
                      : 'bg-terminal-accent/10 border-terminal-accent/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      className={`mt-0.5 ${
                        insight.type === 'positive'
                          ? 'bg-terminal-success text-terminal-bg'
                          : insight.type === 'warning'
                          ? 'bg-terminal-warning text-terminal-bg'
                          : 'bg-terminal-accent text-terminal-bg'
                      }`}
                    >
                      {insight.type === 'positive' ? 'Positive' : insight.type === 'warning' ? 'Risk' : 'Opportunity'}
                    </Badge>
                  </div>
                  <p className="text-sm text-white mt-2 leading-relaxed">{insight.message}</p>
                </div>
              ))}

              {/* Recommended Projects */}
              <div className="pt-4 border-t border-terminal-border">
                <h4 className="text-sm font-semibold text-white mb-3">Recommended Projects</h4>
                <div className="space-y-2">
                  {datacenterProjects
                    .filter(p => {
                      if (inputs.riskTolerance === 'Aggressive') return p.buildStatus === 'Raising' && p.expectedAPY > 20;
                      if (inputs.riskTolerance === 'Conservative') return p.buildStatus === 'Built' && p.expectedAPY < 17;
                      return p.buildStatus === 'Built' && p.expectedAPY >= 15 && p.expectedAPY <= 20;
                    })
                    .slice(0, 3)
                    .map((project) => (
                      <div
                        key={project.id}
                        className="bg-terminal-bg border border-terminal-border p-3 rounded hover:border-terminal-accent transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm text-white font-semibold">{project.name}</span>
                          <Badge className="bg-terminal-accent text-terminal-bg text-xs">
                            {project.expectedAPY}% APY
                          </Badge>
                        </div>
                        <p className="text-xs text-terminal-muted">{project.location}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              project.buildStatus === 'Built'
                                ? 'border-terminal-success text-terminal-success text-xs'
                                : 'border-terminal-warning text-terminal-warning text-xs'
                            }
                          >
                            {project.buildStatus}
                          </Badge>
                          <span className="text-xs text-terminal-muted">{project.totalGPUs.toLocaleString()} GPUs</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saved Scenarios Manager */}
          {savedScenarios.length > 0 && (
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Saved Scenarios ({savedScenarios.length})</CardTitle>
                  <Badge className="bg-terminal-accent text-terminal-bg">
                    {selectedCompareScenarios.length} Selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {savedScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`bg-terminal-bg border p-3 rounded transition-all cursor-pointer ${
                      selectedCompareScenarios.includes(scenario.id)
                        ? 'border-terminal-accent'
                        : 'border-terminal-border hover:border-terminal-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm text-white font-semibold mb-1">{scenario.name}</div>
                        <div className="text-xs text-terminal-muted">
                          Saved {new Date(scenario.savedAt).toLocaleDateString()} at {new Date(scenario.savedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => toggleCompareScenario(scenario.id)}
                          disabled={!selectedCompareScenarios.includes(scenario.id) && selectedCompareScenarios.length >= 3}
                          className={
                            selectedCompareScenarios.includes(scenario.id)
                              ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90 h-8 px-2'
                              : 'bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border h-8 px-2'
                          }
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => loadScenario(scenario)}
                          className="bg-terminal-surface text-white border border-terminal-border hover:bg-terminal-border hover:border-terminal-accent h-8 px-2"
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteScenario(scenario.id)}
                          className="bg-terminal-surface text-terminal-danger border border-terminal-border hover:bg-terminal-danger/10 h-8 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-terminal-muted">Risk:</span>{' '}
                        <span className="text-white">{scenario.riskTolerance}</span>
                      </div>
                      <div>
                        <span className="text-terminal-muted">Timeline:</span>{' '}
                        <span className="text-white">{scenario.timeline}y</span>
                      </div>
                      <div>
                        <span className="text-terminal-muted">Mix:</span>{' '}
                        <span className="text-white">{scenario.gpuFarmPercent}% GPU</span>
                      </div>
                      <div>
                        <span className="text-terminal-muted">Geo:</span>{' '}
                        <span className="text-white">{scenario.geoDiversification}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
