import { useState } from 'react';
import { datacenterProjects } from '../data/datacenters';
import { DatacenterProject } from '../types/datacenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import ProjectDetails from '@/components/ProjectDetails';

type ProjectTypeFilter = 'All' | 'GPU Farm' | 'Datacenter' | 'Energy Grid';
type BuildStatusFilter = 'All' | 'Built' | 'Raising';

const Marketplace = () => {
  const [selectedProject, setSelectedProject] = useState<DatacenterProject | null>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState<ProjectTypeFilter>('All');
  const [buildStatusFilter, setBuildStatusFilter] = useState<BuildStatusFilter>('All');

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

  const filteredProjects = datacenterProjects.filter(p => {
    const matchesProjectType = projectTypeFilter === 'All' || p.projectType === projectTypeFilter;
    const matchesBuildStatus = buildStatusFilter === 'All' || p.buildStatus === buildStatusFilter;
    return matchesProjectType && matchesBuildStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-8">
        <div className="space-y-2 flex-shrink-0">
          <h1 className="text-3xl font-normal text-white">Infrastructure Marketplace</h1>
          <p className="text-terminal-muted">Invest in the future of compute infrastructure</p>
        </div>

        {/* Filter Buttons - Right Side */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-terminal-muted">Project Type:</span>
            <div className="flex gap-2">
              {(['All', 'GPU Farm', 'Datacenter', 'Energy Grid'] as ProjectTypeFilter[]).map((filterType) => (
                <Button
                  key={filterType}
                  onClick={() => setProjectTypeFilter(filterType)}
                  variant={projectTypeFilter === filterType ? 'default' : 'outline'}
                  size="sm"
                  className={
                    projectTypeFilter === filterType
                      ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90'
                      : 'border-terminal-border text-terminal-text hover:bg-terminal-border'
                  }
                >
                  {filterType}
                  {filterType !== 'All' && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-current text-xs"
                    >
                      {datacenterProjects.filter(p => p.projectType === filterType).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-terminal-muted">Build Status:</span>
            <div className="flex gap-2">
              {(['All', 'Built', 'Raising'] as BuildStatusFilter[]).map((filterType) => (
                <Button
                  key={filterType}
                  onClick={() => setBuildStatusFilter(filterType)}
                  variant={buildStatusFilter === filterType ? 'default' : 'outline'}
                  size="sm"
                  className={
                    buildStatusFilter === filterType
                      ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90'
                      : 'border-terminal-border text-terminal-text hover:bg-terminal-border'
                  }
                >
                  {filterType}
                  {filterType !== 'All' && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-current text-xs"
                    >
                      {datacenterProjects.filter(p => p.buildStatus === filterType).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="bg-terminal-surface border-terminal-border">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="text-terminal-muted text-lg">No projects found</div>
              <p className="text-terminal-muted text-sm">
                Try adjusting your filter
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
          <Card
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="bg-terminal-surface border-terminal-border hover:border-terminal-accent transition-all cursor-pointer group"
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-white group-hover:text-terminal-accent transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="text-terminal-muted flex items-center gap-2">
                    <span className="text-terminal-accent">📍</span>
                    {project.location}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(project.status)} text-terminal-bg px-2 py-1`}>
                  {project.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge variant="outline" className="border-terminal-border text-terminal-text">
                  {project.projectType}
                </Badge>
                <Badge
                  variant="outline"
                  className={project.buildStatus === 'Built' ? 'border-terminal-success text-terminal-success' : 'border-terminal-warning text-terminal-warning'}
                >
                  {project.buildStatus === 'Built' ? '✓ Built' : '⚡ Raising'}
                </Badge>
                <span className="text-terminal-muted">•</span>
                <span className="text-terminal-text">{project.startDate}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-muted">Funding Progress</span>
                  <span className="text-terminal-accent font-semibold">
                    {project.fundingPercentage}%
                  </span>
                </div>
                <Progress
                  value={project.fundingPercentage}
                  className="h-2 bg-terminal-border"
                />
                <div className="flex justify-between text-xs text-terminal-muted">
                  <span>{formatCurrency(project.fundingCurrent)} raised</span>
                  <span>{formatCurrency(project.fundingGoal)} goal</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  {project.projectType === 'Energy Grid' ? (
                    <>
                      <div className="text-xs text-terminal-muted">Energy Type</div>
                      <div className="text-lg font-semibold text-terminal-accent">
                        {project.powerCapacity.includes('Solar') ? '☀️ Solar' :
                         project.powerCapacity.includes('Wind') ? '💨 Wind' :
                         project.powerCapacity.includes('Storage') ? '🔋 Battery' :
                         project.powerCapacity.includes('Hydro') ? '💧 Hydro' : '⚡ Grid'}
                      </div>
                      <div className="text-xs text-terminal-muted">{project.powerCapacity}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-terminal-muted">Total GPUs</div>
                      <div className="text-lg font-semibold text-terminal-accent">
                        {project.totalGPUs.toLocaleString()}
                      </div>
                      <div className="text-xs text-terminal-muted">{project.gpuAllocations.length} Types</div>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-terminal-muted">Expected APY</div>
                  <div className="text-lg font-semibold text-terminal-success">
                    {project.expectedAPY}%
                  </div>
                  <div className="text-xs text-terminal-muted">Annual Return</div>
                </div>
              </div>

              <div className="pt-3 border-t border-terminal-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-muted">Min. Investment</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(project.minInvestment)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-terminal-muted">Power Capacity</span>
                  <span className="text-white">{project.powerCapacity}</span>
                </div>
              </div>

              <p className="text-xs text-terminal-muted leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default Marketplace; 