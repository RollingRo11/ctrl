import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Ship, Anchor, DollarSign, AlertCircle, Filter, ArrowUpDown, Zap, Plane, Train } from 'lucide-react';

interface Infrastructure {
  id: string;
  name: string;
  type: 'port' | 'canal' | 'airport' | 'railway' | 'energy';
  location: string;
  currentValue: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  congestion: number;
  throughput: string;
  investmentRequired: number;
  description: string;
  invested: number;
}

const INFRASTRUCTURE_DATA: Infrastructure[] = [
  {
    id: 'la-port',
    name: 'LA/Long Beach Port Expansion',
    type: 'port',
    location: 'Los Angeles, USA',
    currentValue: 5000000,
    expectedReturn: 12.5,
    riskLevel: 'medium',
    congestion: 80,
    throughput: '9.5M TEU/year',
    investmentRequired: 2500000,
    description: 'Expand terminal capacity and automation systems',
    invested: 0
  },
  {
    id: 'suez-upgrade',
    name: 'Suez Canal Digital Infrastructure',
    type: 'canal',
    location: 'Egypt',
    currentValue: 8000000,
    expectedReturn: 15.8,
    riskLevel: 'high',
    congestion: 75,
    throughput: '20,000 ships/year',
    investmentRequired: 5000000,
    description: 'AI-powered traffic management and dredging operations',
    invested: 0
  },
  {
    id: 'singapore-port',
    name: 'Singapore Tuas Megaport',
    type: 'port',
    location: 'Singapore',
    currentValue: 12000000,
    expectedReturn: 10.2,
    riskLevel: 'low',
    congestion: 65,
    throughput: '37M TEU/year',
    investmentRequired: 8000000,
    description: 'World\'s largest fully automated terminal',
    invested: 0
  },
  {
    id: 'panama-expansion',
    name: 'Panama Canal 4th Set of Locks',
    type: 'canal',
    location: 'Panama',
    currentValue: 6500000,
    expectedReturn: 14.0,
    riskLevel: 'high',
    congestion: 60,
    throughput: '13,000 ships/year',
    investmentRequired: 4000000,
    description: 'Additional locks for larger neo-Panamax vessels',
    invested: 0
  },
  {
    id: 'rotterdam-automation',
    name: 'Rotterdam Port Automation',
    type: 'port',
    location: 'Rotterdam, Netherlands',
    currentValue: 4500000,
    expectedReturn: 11.5,
    riskLevel: 'low',
    congestion: 45,
    throughput: '14.5M TEU/year',
    investmentRequired: 3000000,
    description: 'Full terminal automation and green energy transition',
    invested: 0
  },
  {
    id: 'dubai-airport',
    name: 'Dubai Al Maktoum Expansion',
    type: 'airport',
    location: 'Dubai, UAE',
    currentValue: 7500000,
    expectedReturn: 13.2,
    riskLevel: 'medium',
    congestion: 55,
    throughput: '160M passengers/year',
    investmentRequired: 5500000,
    description: 'Largest airport capacity expansion project',
    invested: 0
  },
  {
    id: 'arctic-route',
    name: 'Northern Sea Route Infrastructure',
    type: 'canal',
    location: 'Arctic Ocean',
    currentValue: 10000000,
    expectedReturn: 18.5,
    riskLevel: 'critical',
    congestion: 30,
    throughput: '1,500 ships/year',
    investmentRequired: 7000000,
    description: 'Icebreaker fleet and port facilities for Arctic shipping route',
    invested: 0
  },
  {
    id: 'belt-road',
    name: 'China-Europe Rail Corridor',
    type: 'railway',
    location: 'Eurasia',
    currentValue: 9500000,
    expectedReturn: 16.0,
    riskLevel: 'high',
    congestion: 50,
    throughput: '1.5M TEU/year',
    investmentRequired: 6500000,
    description: 'High-speed freight rail connecting China to Europe',
    invested: 0
  },
  {
    id: 'houston-port',
    name: 'Port of Houston Deep Water Expansion',
    type: 'port',
    location: 'Houston, USA',
    currentValue: 4200000,
    expectedReturn: 11.8,
    riskLevel: 'low',
    congestion: 55,
    throughput: '3.8M TEU/year',
    investmentRequired: 2800000,
    description: 'Deepening channel for larger container ships',
    invested: 0
  },
  {
    id: 'mombasa-port',
    name: 'Mombasa Port Modernization',
    type: 'port',
    location: 'Kenya',
    currentValue: 3500000,
    expectedReturn: 19.5,
    riskLevel: 'high',
    congestion: 70,
    throughput: '1.4M TEU/year',
    investmentRequired: 2200000,
    description: 'Gateway to East Africa with automation upgrades',
    invested: 0
  },
  {
    id: 'malacca-strait',
    name: 'Strait of Malacca Traffic System',
    type: 'canal',
    location: 'Malaysia/Singapore',
    currentValue: 6800000,
    expectedReturn: 14.5,
    riskLevel: 'medium',
    congestion: 70,
    throughput: '84,000 ships/year',
    investmentRequired: 4500000,
    description: 'AI traffic management for world\'s busiest strait',
    invested: 0
  },
  {
    id: 'jnpt-port',
    name: 'Jawaharlal Nehru Port Expansion',
    type: 'port',
    location: 'Mumbai, India',
    currentValue: 5200000,
    expectedReturn: 17.0,
    riskLevel: 'medium',
    congestion: 75,
    throughput: '5.8M TEU/year',
    investmentRequired: 3500000,
    description: 'India\'s largest container port automation project',
    invested: 0
  },
  {
    id: 'hyperloop-cargo',
    name: 'Dubai-Mumbai Hyperloop Cargo',
    type: 'railway',
    location: 'Middle East-Asia',
    currentValue: 15000000,
    expectedReturn: 22.0,
    riskLevel: 'critical',
    congestion: 0,
    throughput: '500K TEU/year (projected)',
    investmentRequired: 12000000,
    description: 'Revolutionary ultra-high-speed cargo transport system',
    invested: 0
  },
  {
    id: 'darwin-port',
    name: 'Port of Darwin Asia Gateway',
    type: 'port',
    location: 'Darwin, Australia',
    currentValue: 3800000,
    expectedReturn: 13.5,
    riskLevel: 'medium',
    congestion: 40,
    throughput: '280K TEU/year',
    investmentRequired: 2500000,
    description: 'Strategic port for Asia-Australia trade route',
    invested: 0
  },
  {
    id: 'texas-solar',
    name: 'Texas Solar Grid Expansion',
    type: 'energy',
    location: 'Texas, USA',
    currentValue: 8500000,
    expectedReturn: 14.2,
    riskLevel: 'medium',
    congestion: 65,
    throughput: '5 GW capacity',
    investmentRequired: 6000000,
    description: 'Large-scale solar farm with battery storage integration',
    invested: 0
  },
  {
    id: 'offshore-wind-uk',
    name: 'North Sea Offshore Wind Farm',
    type: 'energy',
    location: 'United Kingdom',
    currentValue: 12000000,
    expectedReturn: 11.8,
    riskLevel: 'low',
    congestion: 45,
    throughput: '8 GW capacity',
    investmentRequired: 9500000,
    description: 'Advanced offshore wind turbines with smart grid integration',
    invested: 0
  },
  {
    id: 'california-battery',
    name: 'California Grid Battery Storage',
    type: 'energy',
    location: 'California, USA',
    currentValue: 7200000,
    expectedReturn: 16.5,
    riskLevel: 'medium',
    congestion: 70,
    throughput: '3 GWh storage',
    investmentRequired: 5500000,
    description: 'Massive lithium-ion battery arrays for grid stabilization',
    invested: 0
  },
  {
    id: 'nordic-hydro',
    name: 'Nordic Hydroelectric Modernization',
    type: 'energy',
    location: 'Norway/Sweden',
    currentValue: 9800000,
    expectedReturn: 9.5,
    riskLevel: 'low',
    congestion: 30,
    throughput: '6 GW capacity',
    investmentRequired: 7000000,
    description: 'Upgrade existing hydro infrastructure with smart controls',
    invested: 0
  },
  {
    id: 'australia-hvdc',
    name: 'Australia HVDC Transmission',
    type: 'energy',
    location: 'Australia',
    currentValue: 11500000,
    expectedReturn: 13.8,
    riskLevel: 'high',
    congestion: 55,
    throughput: '4 GW transfer',
    investmentRequired: 8500000,
    description: 'High-voltage DC transmission lines connecting renewable zones',
    invested: 0
  },
  {
    id: 'india-smart-grid',
    name: 'India National Smart Grid',
    type: 'energy',
    location: 'India',
    currentValue: 15000000,
    expectedReturn: 18.2,
    riskLevel: 'high',
    congestion: 80,
    throughput: '200M meters',
    investmentRequired: 12000000,
    description: 'AI-powered smart meters and grid management across major cities',
    invested: 0
  },
  {
    id: 'morocco-solar',
    name: 'Sahara Solar Complex',
    type: 'energy',
    location: 'Morocco',
    currentValue: 10500000,
    expectedReturn: 17.5,
    riskLevel: 'medium',
    congestion: 40,
    throughput: '7 GW capacity',
    investmentRequired: 8000000,
    description: 'Concentrated solar power plant with thermal storage',
    invested: 0
  },
  {
    id: 'japan-fusion',
    name: 'Japan Fusion Energy Research',
    type: 'energy',
    location: 'Japan',
    currentValue: 20000000,
    expectedReturn: 25.0,
    riskLevel: 'critical',
    congestion: 0,
    throughput: '500 MW (projected)',
    investmentRequired: 18000000,
    description: 'Next-generation fusion reactor prototype with commercial potential',
    invested: 0
  }
];

export const InfrastructureInvestment: React.FC = () => {
  const [investments, setInvestments] = useState<Record<string, number>>(
    INFRASTRUCTURE_DATA.reduce((acc, item) => ({ ...acc, [item.id]: item.invested }), {})
  );
  const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'roi' | 'risk' | 'location' | 'congestion'>('roi');
  const [filterType, setFilterType] = useState<'all' | 'port' | 'canal' | 'airport' | 'railway' | 'energy'>('all');

  const totalInvested = Object.values(investments).reduce((sum, val) => sum + val, 0);
  const estimatedReturns = INFRASTRUCTURE_DATA.reduce((sum, infra) => {
    const invested = investments[infra.id] || 0;
    return sum + (invested * infra.expectedReturn / 100);
  }, 0);

  const handleInvest = () => {
    if (selectedInfra && investmentAmount > 0) {
      setInvestments(prev => ({
        ...prev,
        [selectedInfra.id]: (prev[selectedInfra.id] || 0) + investmentAmount
      }));
      setInvestmentAmount(0);
    }
  };

  const handleDivest = (infraId: string, amount: number) => {
    setInvestments(prev => ({
      ...prev,
      [infraId]: Math.max(0, (prev[infraId] || 0) - amount)
    }));
  };

  // Filtered and sorted infrastructure
  const filteredAndSortedInfra = useMemo(() => {
    let filtered = INFRASTRUCTURE_DATA.filter(infra =>
      filterType === 'all' || infra.type === filterType
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          return b.expectedReturn - a.expectedReturn;
        case 'risk':
          const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        case 'location':
          return a.location.localeCompare(b.location);
        case 'congestion':
          return b.congestion - a.congestion;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sortBy, filterType]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'port': return <Ship className="h-4 w-4" />;
      case 'canal': return <Anchor className="h-4 w-4" />;
      case 'airport': return <Plane className="h-4 w-4" />;
      case 'railway': return <Train className="h-4 w-4" />;
      case 'energy': return <Zap className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Portfolio</CardTitle>
          <CardDescription>Track your infrastructure investments and returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-900 border border-blue-500 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">${(totalInvested / 1000000).toFixed(2)}M</div>
              <div className="text-sm text-gray-400">Total Invested</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-green-500 rounded-lg">
              <div className="text-2xl font-bold text-green-400">${(estimatedReturns / 1000000).toFixed(2)}M</div>
              <div className="text-sm text-gray-400">Est. Annual Returns</div>
            </div>
            <div className="text-center p-4 bg-gray-900 border border-purple-500 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {totalInvested > 0 ? ((estimatedReturns / totalInvested) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-400">Avg ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Opportunities List */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Investment Opportunities</CardTitle>
            <CardDescription>Filter and sort infrastructure investments</CardDescription>

            {/* Filters and Sort */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 flex items-center">
                  <Filter className="h-3 w-3 mr-1" />
                  Type
                </label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="port">Ports</SelectItem>
                    <SelectItem value="canal">Canals</SelectItem>
                    <SelectItem value="airport">Airports</SelectItem>
                    <SelectItem value="railway">Railways</SelectItem>
                    <SelectItem value="energy">Energy Grids</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 flex items-center">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roi">Highest ROI</SelectItem>
                    <SelectItem value="risk">Lowest Risk</SelectItem>
                    <SelectItem value="location">Location A-Z</SelectItem>
                    <SelectItem value="congestion">Highest Congestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredAndSortedInfra.map((infra) => {
                  const invested = investments[infra.id] || 0;
                  const investmentProgress = (invested / infra.investmentRequired) * 100;

                  return (
                    <div
                      key={infra.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-lg hover:border-blue-400 bg-gray-900 ${
                        selectedInfra?.id === infra.id ? 'border-blue-500 bg-gray-800' : 'border-gray-700'
                      }`}
                      onClick={() => setSelectedInfra(infra)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(infra.type)}
                          <div>
                            <div className="font-semibold text-sm">{infra.name}</div>
                            <div className="text-xs text-gray-500">{infra.location}</div>
                          </div>
                        </div>
                        <Badge className={getRiskColor(infra.riskLevel)} variant="secondary">
                          {infra.expectedReturn}% APY
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Invested:</span>
                          <span className="font-bold text-white">${(invested / 1000000).toFixed(2)}M</span>
                        </div>
                        <Progress value={investmentProgress} className="h-1" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Congestion: {infra.congestion}%</span>
                        <span className="text-gray-400">{infra.throughput}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Investment Details */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              {selectedInfra ? selectedInfra.name : 'Select Infrastructure'}
            </CardTitle>
            <CardDescription>
              {selectedInfra ? selectedInfra.description : 'Choose an opportunity to invest'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {selectedInfra ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400">Required</div>
                    <div className="font-bold text-white">${(selectedInfra.investmentRequired / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400">Your Investment</div>
                    <div className="font-bold text-white">${((investments[selectedInfra.id] || 0) / 1000000).toFixed(2)}M</div>
                  </div>
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400">Expected ROI</div>
                    <div className="font-bold text-green-400">{selectedInfra.expectedReturn}%</div>
                  </div>
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400">Risk Level</div>
                    <Badge className={getRiskColor(selectedInfra.riskLevel)}>
                      {selectedInfra.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Investment Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Investment Amount: ${(investmentAmount / 1000000).toFixed(2)}M</label>
                  <Slider
                    value={[investmentAmount]}
                    onValueChange={(val) => setInvestmentAmount(val[0])}
                    max={5000000}
                    step={100000}
                    className="w-full"
                  />
                </div>

                {/* Projected Returns */}
                {investmentAmount > 0 && (
                  <div className="p-3 bg-gray-900 border border-green-500 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Projected Annual Returns</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${((investmentAmount * selectedInfra.expectedReturn) / 100 / 1000000).toFixed(2)}M
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleInvest}
                    className="w-full"
                    disabled={investmentAmount === 0}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Invest ${(investmentAmount / 1000000).toFixed(2)}M
                  </Button>

                  {investments[selectedInfra.id] > 0 && (
                    <Button
                      onClick={() => handleDivest(selectedInfra.id, investments[selectedInfra.id])}
                      variant="outline"
                      className="w-full"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Divest All (${(investments[selectedInfra.id] / 1000000).toFixed(2)}M)
                    </Button>
                  )}
                </div>

                {/* Risk Warning */}
                {(selectedInfra.riskLevel === 'high' || selectedInfra.riskLevel === 'critical') && (
                  <div className="flex items-start space-x-2 p-3 bg-gray-900 border border-orange-500 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5" />
                    <div className="text-xs text-orange-300">
                      This is a {selectedInfra.riskLevel}-risk investment. Expected returns may vary due to geopolitical factors and congestion levels.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select an infrastructure opportunity from the list
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
