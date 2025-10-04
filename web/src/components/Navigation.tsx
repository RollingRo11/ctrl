import { Button } from "@/components/ui/button";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const tabs = ["Dashboard", "Tab 1", "Tab 2", "Tab 3"];

  return (
    <nav className="bg-terminal-surface px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setActiveTab("Dashboard")}>
            <img src="/oplogo.png" alt="ctrl Logo" className="w-8 h-8" />
            <div className="text-2xl font-normal text-white font-sans">
              ctrl
            </div>
          </div>
          <div className="flex items-center space-x-5 ml-24">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`px-4 py-2 transition-all font-sans ${
                  activeTab === tab
                    ? "bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
                    : "text-white hover:text-terminal-text hover:bg-terminal-border"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-sm text-white font-sans border border-white/50 rounded-full px-3 py-1 flex items-center space-x-2">
          <span>System Status: <span className="text-terminal-success">OPERATIONAL</span></span>
          <div className="w-2 h-2 bg-terminal-success rounded-full animate-pulse-green"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
