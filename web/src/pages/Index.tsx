import { useState } from "react";
import Navigation from "@/components/Navigation";
import TickerTape from "@/components/TickerTape";
import Intel from "@/pages/Intel";
import Analytics from "@/pages/Analytics";
import Agents from "@/pages/Agents";

const Dashboard = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
    <div className="text-terminal-muted text-lg">Dashboard</div>
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard />;
      case "Tab 1":
        return <Intel />;
      case "Tab 2":
        return <Analytics />;
      case "Tab 3":
        return <Agents />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg terminal-grid">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <TickerTape />
      {renderContent()}
    </div>
  );
};

export default Index;
