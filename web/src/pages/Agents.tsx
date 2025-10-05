import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, TrendingUp, AlertTriangle, Play, Pause, Settings, Zap, Activity, DollarSign, BarChart3, Clock, CheckCircle2, XCircle } from 'lucide-react';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import { getAgentRecommendation, AgentRecommendation } from '@/lib/agentGemini';

interface Agent {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  status: 'idle' | 'active' | 'alert';
  description?: string;
  capabilities?: string[];
}

interface ActionLog {
  id: number;
  agentId: string;
  agentName: string;
  timestamp: string;
  action: string;
  reasoning: string;
  financialImpact?: string;
  carbonImpact?: string;
  affectedLocations?: string[];
}

interface DeployedAgent extends Agent {
  deployedAt?: string;
  lastAction?: string;
  tasksCompleted?: number;
  autoRun?: boolean;
  runInterval?: number; // minutes
}

const AGENT_DESCRIPTIONS: { [key: string]: { description: string; capabilities: string[]; useCase: string } } = {
  'energy-optimizer': {
    description: 'Optimizes energy costs and carbon emissions across datacenters',
    capabilities: ['Energy price monitoring', 'Workload redistribution', 'Carbon intensity analysis'],
    useCase: 'Automatically moves workloads to cheapest/cleanest energy regions'
  },
  'network-optimizer': {
    description: 'Minimizes latency and maximizes network performance',
    capabilities: ['Latency monitoring', 'Traffic routing', 'Peering optimization'],
    useCase: 'Routes inference jobs to nearest peering hubs for fastest response'
  },
  'supply-chain': {
    description: 'Monitors and mitigates supply chain disruptions',
    capabilities: ['Port congestion tracking', 'Shipment monitoring', 'Route optimization'],
    useCase: 'Alerts on GPU shipment delays and suggests alternative routes'
  },
  'carbon-offset': {
    description: 'Manages carbon offset strategy and purchases',
    capabilities: ['Emissions tracking', 'Offset recommendations', 'Project evaluation'],
    useCase: 'Recommends carbon offset purchases to meet sustainability goals'
  },
  'gpu-arbitrage': {
    description: 'Maximizes GPU utilization and compute revenue',
    capabilities: ['Utilization monitoring', 'Job balancing', 'Spot price tracking'],
    useCase: 'Rebalances workloads across datacenters to maximize GPU revenue'
  },
  'risk-hedging': {
    description: 'Identifies and hedges operational risks',
    capabilities: ['Geopolitical monitoring', 'Risk assessment', 'Hedge recommendations'],
    useCase: 'Alerts on supply chain risks and suggests insurance/hedges'
  },
  'returns-maximizer': {
    description: 'Analyzes and maximizes investment returns',
    capabilities: ['Monte Carlo simulation', 'ROI analysis', 'Risk modeling'],
    useCase: 'Provides best/worst/expected return scenarios for investments'
  },
  'compliance-regulatory': {
    description: 'Monitors regulatory compliance and legal requirements',
    capabilities: ['Regulatory tracking', 'Compliance auditing', 'Risk assessment'],
    useCase: 'Ensures datacenters comply with local laws and avoid penalties'
  }
};

const Agents = () => {
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<DeployedAgent | null>(null);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const { toast } = useToast();

  const API_BASE = 'http://localhost:3001/api';

  // Default agents list (frontend-only, no backend needed)
  const DEFAULT_AGENTS: DeployedAgent[] = [
    { id: 'energy-optimizer', name: 'Energy Optimizer', icon: '⚡', active: false, status: 'idle' },
    { id: 'network-optimizer', name: 'Network Optimizer', icon: '🌐', active: false, status: 'idle' },
    { id: 'supply-chain', name: 'Supply Chain Monitor', icon: '🚚', active: false, status: 'idle' },
    { id: 'carbon-offset', name: 'Carbon Offset Agent', icon: '🌱', active: false, status: 'idle' },
    { id: 'gpu-arbitrage', name: 'GPU Arbitrage', icon: '💹', active: false, status: 'idle' },
    { id: 'risk-hedging', name: 'Risk Hedging', icon: '🛡️', active: false, status: 'idle' },
    { id: 'returns-maximizer', name: 'Returns Maximizer', icon: '📈', active: false, status: 'idle' },
    { id: 'compliance-regulatory', name: 'Compliance Monitor', icon: '⚖️', active: false, status: 'idle' }
  ];

  // Fetch agents and action logs
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAgents(data.agents);
      setActionLogs(data.recentActions || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Use default agents if backend is not available
      if (agents.length === 0) {
        setAgents(DEFAULT_AGENTS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Deploy/Undeploy agent (local state management)
  const toggleAgent = async (agentId: string) => {
    try {
      setAgents(prev => prev.map(a => {
        if (a.id === agentId) {
          const newActive = !a.active;
          toast({
            title: newActive ? 'Agent Deployed' : 'Agent Stopped',
            description: `${a.name} is now ${newActive ? 'running' : 'stopped'}`
          });
          return { ...a, active: newActive, status: newActive ? 'active' : 'idle' };
        }
        return a;
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle agent',
        variant: 'destructive'
      });
    }
  };

  // Run agent analysis (using frontend Gemini)
  const runAgent = async (agentId: string) => {
    setLoadingRecommendation(true);
    try {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'demo-key') {
        toast({
          title: 'API Key Missing',
          description: 'Please configure VITE_GEMINI_API_KEY in your .env file',
          variant: 'destructive'
        });
        setLoadingRecommendation(false);
        return;
      }

      // Call Gemini directly from frontend
      const data = await getAgentRecommendation(agentId);
      setRecommendation(data);

      toast({
        title: 'Analysis Complete',
        description: 'Agent has generated recommendations',
      });
    } catch (error: any) {
      console.error('Agent analysis error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to run agent analysis',
        variant: 'destructive'
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Execute agent action
  const executeAction = async (agentId: string, action: any) => {
    try {
      const response = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      await response.json();

      toast({
        title: 'Action Executed',
        description: 'Agent recommendation has been applied',
      });

      fetchAgents();
      setRecommendation(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute action',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-terminal-bg">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-accent" />
      </div>
    );
  }

  const activeAgents = agents.filter(a => a.active);
  const deployedCount = activeAgents.length;

  return (
    <div className="min-h-screen bg-terminal-bg p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-terminal-muted">Deployed Agents</p>
                <p className="text-3xl font-bold text-white">{deployedCount}</p>
              </div>
              <Activity className="w-8 h-8 text-terminal-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-terminal-muted">Actions Today</p>
                <p className="text-3xl font-bold text-white">{actionLogs.length}</p>
              </div>
              <Zap className="w-8 h-8 text-terminal-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-terminal-muted">Est. Savings</p>
                <p className="text-3xl font-bold text-terminal-success">$12.4K</p>
              </div>
              <DollarSign className="w-8 h-8 text-terminal-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-terminal-muted">Efficiency Gain</p>
                <p className="text-3xl font-bold text-terminal-accent">+18%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-terminal-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList className="bg-terminal-surface border border-terminal-border">
          <TabsTrigger value="deploy">Deploy Agents</TabsTrigger>
          <TabsTrigger value="monitor">Monitor & Control</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="simulator">Scenario Testing</TabsTrigger>
        </TabsList>

        {/* Deploy Agents Tab */}
        <TabsContent value="deploy" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {agents.map((agent) => {
              const info = AGENT_DESCRIPTIONS[agent.id];
              return (
                <Card key={agent.id} className="bg-terminal-surface border-terminal-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{agent.icon}</span>
                        <div>
                          <CardTitle className="text-white">{agent.name}</CardTitle>
                          <Badge variant={agent.active ? 'default' : 'outline'} className="mt-1">
                            {agent.active ? 'Deployed' : 'Available'}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={agent.active}
                        onCheckedChange={() => toggleAgent(agent.id)}
                      />
                    </div>
                    <CardDescription className="text-terminal-muted">
                      {info?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {info?.capabilities.map((cap, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-terminal-bg rounded border border-terminal-border">
                      <p className="text-xs text-terminal-muted">
                        <strong>Use Case:</strong> {info?.useCase}
                      </p>
                    </div>

                    {agent.active && (
                      <Button
                        onClick={() => {
                          setSelectedAgent(agent);
                          runAgent(agent.id);
                        }}
                        disabled={loadingRecommendation}
                        className="w-full bg-terminal-accent hover:bg-terminal-accent/90"
                      >
                        {loadingRecommendation && selectedAgent?.id === agent.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Running Analysis...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Analysis
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Monitor & Control Tab */}
        <TabsContent value="monitor">
          <div className="grid grid-cols-3 gap-6">
            {/* Active Agents List */}
            <div className="col-span-1">
              <Card className="bg-terminal-surface border-terminal-border">
                <CardHeader>
                  <CardTitle className="text-white">Active Agents</CardTitle>
                  <CardDescription className="text-terminal-muted">
                    Currently deployed and running
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {activeAgents.length === 0 ? (
                      <p className="text-center text-terminal-muted py-8">No active agents</p>
                    ) : (
                      <div className="space-y-3">
                        {activeAgents.map((agent) => (
                          <Card
                            key={agent.id}
                            className={`cursor-pointer bg-terminal-bg border-terminal-border hover:border-terminal-accent transition-all ${
                              selectedAgent?.id === agent.id ? 'border-terminal-accent' : ''
                            }`}
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{agent.icon}</span>
                                  <span className="text-sm font-medium text-white">
                                    {agent.name.split(' ')[0]}
                                  </span>
                                </div>
                                <div className="w-2 h-2 bg-terminal-success rounded-full animate-pulse-green" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Agent Control Panel */}
            <div className="col-span-2">
              {selectedAgent && selectedAgent.active ? (
                <Card className="bg-terminal-surface border-terminal-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedAgent.icon}</span>
                        <div>
                          <CardTitle className="text-white">{selectedAgent.name}</CardTitle>
                          <CardDescription className="text-terminal-muted">
                            Agent Control Panel
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAgent(selectedAgent.id)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Agent
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => runAgent(selectedAgent.id)}
                        disabled={loadingRecommendation}
                        className="bg-terminal-accent hover:bg-terminal-accent/90"
                      >
                        {loadingRecommendation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Now
                          </>
                        )}
                      </Button>
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>

                    {/* Recommendation Display */}
                    {recommendation && recommendation.agentId === selectedAgent.id && (
                      <div className="space-y-4 p-4 border border-terminal-accent rounded-lg bg-terminal-bg">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-terminal-accent" />
                          <h4 className="font-semibold text-white">AI Recommendation</h4>
                        </div>

                        <div>
                          <Label className="text-terminal-muted text-xs">DECISION</Label>
                          <p className="text-white mt-1">{recommendation.recommendation.decision}</p>
                        </div>

                        <div>
                          <Label className="text-terminal-muted text-xs">REASONING</Label>
                          <p className="text-sm text-terminal-muted mt-1">
                            {recommendation.recommendation.reasoning}
                          </p>
                        </div>

                        {recommendation.recommendation.financialImpact && (
                          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                            <DollarSign className="w-4 h-4 text-terminal-success" />
                            <span className="font-semibold text-terminal-success">
                              {recommendation.recommendation.financialImpact}
                            </span>
                          </div>
                        )}

                        {recommendation.recommendation.carbonImpact && (
                          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                            <span>🌱</span>
                            <span className="font-semibold text-terminal-success">
                              {recommendation.recommendation.carbonImpact}
                            </span>
                          </div>
                        )}

                        {!recommendation.recommendation.error && (
                          <Button
                            onClick={() => executeAction(selectedAgent.id, recommendation.recommendation)}
                            className="w-full bg-terminal-success hover:bg-terminal-success/90"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Execute Recommendation
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-terminal-surface border-terminal-border">
                  <CardContent className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <Brain className="w-16 h-16 text-terminal-muted mx-auto mb-4" />
                      <p className="text-terminal-muted">
                        Select an active agent to view controls
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs">
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-white">Activity Log</CardTitle>
              <CardDescription className="text-terminal-muted">
                All agent actions and decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {actionLogs.length === 0 ? (
                    <p className="text-center text-terminal-muted py-8">
                      No activity yet. Deploy and run agents to see their actions.
                    </p>
                  ) : (
                    actionLogs.map((log) => (
                      <Card key={log.id} className="bg-terminal-bg border-l-4 border-l-terminal-accent">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-terminal-accent">
                                {log.agentName}
                              </Badge>
                              <span className="text-xs text-terminal-muted">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="font-semibold text-white">{log.action}</p>
                            <p className="text-sm text-terminal-muted">{log.reasoning}</p>

                            <div className="flex gap-4 text-sm">
                              {log.financialImpact && (
                                <span className="text-terminal-success font-medium">
                                  💰 {log.financialImpact}
                                </span>
                              )}
                              {log.carbonImpact && (
                                <span className="text-terminal-success font-medium">
                                  🌱 {log.carbonImpact}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario Testing Tab */}
        <TabsContent value="simulator">
          <ScenarioSimulator agents={agents} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Agents;
