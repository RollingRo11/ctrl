import { useInvestments } from '../contexts/InvestmentContext';
import { datacenterProjects } from '../data/datacenters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const DatacenterConstructionUpdates = () => {
  const { investments } = useInvestments();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get investments in raising/in-progress datacenters
  const raisingInvestments = investments.filter(inv => {
    const project = datacenterProjects.find(p => p.id === inv.projectId);
    return project?.buildStatus === 'Raising';
  });

  if (raisingInvestments.length === 0) {
    return (
      <Card className="bg-terminal-surface border-terminal-border">
        <CardHeader>
          <CardTitle className="text-terminal-accent">Construction Updates</CardTitle>
          <p className="text-sm text-terminal-muted mt-1">Track progress on projects in development</p>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <div className="text-terminal-muted">No investments in projects under construction</div>
            <p className="text-xs text-terminal-muted">
              Invest in "Raising" status projects to track their development
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-terminal-surface border-terminal-border">
      <CardHeader>
        <CardTitle className="text-terminal-accent">Construction Updates</CardTitle>
        <p className="text-sm text-terminal-muted mt-1">Latest news from projects in development</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {raisingInvestments.map(inv => {
          const project = datacenterProjects.find(p => p.id === inv.projectId);
          if (!project) return null;

          return (
            <div key={inv.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-white font-semibold">{project.name}</h4>
                  <p className="text-xs text-terminal-muted mt-1">{project.location}</p>
                </div>
                <Badge variant="outline" className="border-terminal-warning text-terminal-warning">
                  In Progress
                </Badge>
              </div>

              {/* Build Progress */}
              {project.buildProgress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-terminal-muted">Construction Progress</span>
                    <span className="text-terminal-accent font-semibold">
                      {project.buildProgress}%
                    </span>
                  </div>
                  <Progress
                    value={project.buildProgress}
                    className="h-2 bg-terminal-border"
                  />
                </div>
              )}

              {/* Latest Updates */}
              {project.constructionUpdates && project.constructionUpdates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-terminal-muted font-semibold">Recent Updates</div>
                  {project.constructionUpdates.slice(0, 3).map((update, idx) => (
                    <div
                      key={idx}
                      className="bg-terminal-bg border-l-2 border-terminal-accent pl-3 py-2"
                    >
                      <div className="text-xs text-terminal-muted mb-1">
                        {formatDate(update.date)}
                      </div>
                      <div className="text-sm text-terminal-text">
                        {update.update}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Estimated Completion */}
              <div className="pt-3 border-t border-terminal-border flex justify-between text-xs">
                <span className="text-terminal-muted">Expected Launch</span>
                <span className="text-white font-semibold">{project.startDate}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DatacenterConstructionUpdates;
