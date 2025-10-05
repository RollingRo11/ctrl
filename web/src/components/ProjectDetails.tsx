import { useState } from 'react';
import { DatacenterProject } from '../types/datacenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInvestments } from '../contexts/InvestmentContext';

interface ProjectDetailsProps {
  project: DatacenterProject;
  onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
  const { addInvestment, availableBalance } = useInvestments();
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [showInvestForm, setShowInvestForm] = useState(false);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-terminal-success';
      case 'Coming Soon': return 'bg-terminal-warning';
      case 'Funded': return 'bg-terminal-accent';
      default: return 'bg-terminal-muted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-terminal-bg border-2 border-terminal-accent max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-terminal-surface border-b border-terminal-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-normal text-white">{project.name}</h2>
            <Badge className={`${getStatusColor(project.status)} text-terminal-bg px-3 py-1`}>
              {project.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-terminal-muted hover:text-white hover:bg-terminal-border"
          >
            ✕ Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-terminal-accent">Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Location</span>
                  <span className="text-white">{project.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Coordinates</span>
                  <span className="text-white text-sm">{project.coordinates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Operator</span>
                  <span className="text-white">{project.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Project Type</span>
                  <span className="text-white">{project.projectType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Start Date</span>
                  <span className="text-white">{project.startDate}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-terminal-surface border-terminal-border">
              <CardHeader>
                <CardTitle className="text-terminal-accent">Infrastructure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Power Capacity</span>
                  <span className="text-white font-semibold">{project.powerCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Network Capacity</span>
                  <span className="text-white font-semibold">{project.networkCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Cooling System</span>
                  <span className="text-white">{project.coolingType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-muted">Uptime SLA</span>
                  <span className="text-terminal-success font-semibold">{project.uptime}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GPU Allocation Section */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">GPU Configuration</CardTitle>
              <p className="text-sm text-terminal-muted mt-1">
                Total: {project.totalGPUs.toLocaleString()} GPUs across {project.gpuAllocations.length} types
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.gpuAllocations.map((gpu, index) => (
                  <div
                    key={index}
                    className="bg-terminal-bg border border-terminal-border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-accent font-semibold">{gpu.type}</span>
                      <Badge variant="outline" className="border-terminal-border text-terminal-text">
                        {gpu.count.toLocaleString()} units
                      </Badge>
                    </div>
                    <div className="text-sm text-terminal-muted">{gpu.specs}</div>
                    <div className="text-xs text-terminal-muted">
                      {((gpu.count / project.totalGPUs) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Funding Section */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-muted">Funding Progress</span>
                  <span className="text-terminal-accent font-semibold text-lg">
                    {project.fundingPercentage}%
                  </span>
                </div>
                <Progress
                  value={project.fundingPercentage}
                  className="h-3 bg-terminal-border"
                />
                <div className="flex justify-between text-sm text-terminal-muted">
                  <span>{formatCurrency(project.fundingCurrent)} raised</span>
                  <span>{formatCurrency(project.fundingGoal)} goal</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-terminal-border">
                <div className="space-y-1">
                  <div className="text-xs text-terminal-muted">Expected APY</div>
                  <div className="text-2xl font-semibold text-terminal-success">
                    {project.expectedAPY}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-terminal-muted">Min. Investment</div>
                  <div className="text-2xl font-semibold text-white">
                    {formatCurrency(project.minInvestment)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-terminal-muted">Remaining</div>
                  <div className="text-2xl font-semibold text-terminal-accent">
                    {formatCurrency(project.fundingGoal - project.fundingCurrent)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-terminal-surface border-terminal-border">
            <CardHeader>
              <CardTitle className="text-terminal-accent">About This Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-terminal-text leading-relaxed">{project.description}</p>
            </CardContent>
          </Card>

          {/* Investment Form */}
          {showInvestForm && (
            <Card className="bg-terminal-surface border-terminal-accent border-2">
              <CardHeader>
                <CardTitle className="text-terminal-accent">Make Investment</CardTitle>
                <p className="text-sm text-terminal-muted mt-1">
                  Available Balance: {formatCurrency(availableBalance)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-terminal-text">Investment Amount</label>
                  <Input
                    type="number"
                    placeholder={`Minimum ${formatCurrency(project.minInvestment)}`}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="bg-terminal-bg border-terminal-border text-terminal-text"
                    min={project.minInvestment}
                    max={availableBalance}
                  />
                </div>

                {investmentAmount && parseFloat(investmentAmount) >= project.minInvestment && (
                  <div className="bg-terminal-bg p-4 space-y-2 border border-terminal-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-terminal-muted">Investment Amount</span>
                      <span className="text-white">{formatCurrency(parseFloat(investmentAmount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-terminal-muted">Expected APY</span>
                      <span className="text-terminal-success">{project.expectedAPY}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-terminal-muted">Est. Annual Return</span>
                      <span className="text-terminal-accent font-semibold">
                        {formatCurrency(parseFloat(investmentAmount) * (project.expectedAPY / 100))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInvestForm(false);
                      setInvestmentAmount('');
                    }}
                    className="flex-1 border-terminal-border text-terminal-text hover:bg-terminal-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const amount = parseFloat(investmentAmount);
                      if (amount >= project.minInvestment && amount <= availableBalance) {
                        addInvestment(project.id, project.name, amount, project.expectedAPY);
                        setShowInvestForm(false);
                        setInvestmentAmount('');
                        onClose();
                      }
                    }}
                    disabled={
                      !investmentAmount ||
                      parseFloat(investmentAmount) < project.minInvestment ||
                      parseFloat(investmentAmount) > availableBalance
                    }
                    className="flex-1 bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
                  >
                    Confirm Investment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          {!showInvestForm && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setShowInvestForm(true)}
                className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90 px-8 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={project.status === 'Coming Soon'}
              >
                {project.status === 'Coming Soon' ? 'Coming Soon' : 'Invest Now'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
