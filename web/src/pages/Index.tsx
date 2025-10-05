import { useState } from "react";
import Navigation from "@/components/Navigation";
import LiveGPUPriceFeed from "@/components/LiveGPUPriceFeed";
import Marketplace from "@/pages/Marketplace";
import Dashboard from "@/pages/Dashboard";
import Simulation from "@/pages/Simulation";
import Financial from "@/pages/Financial";
import Demand from "@/pages/Demand";
import Logistics from "@/pages/Logistics";
import Agents from "@/pages/Agents";

const Index = () => {
  const [activeTab, setActiveTab] = useState("Marketplace");

  const renderContent = () => {
    switch (activeTab) {
      case "Marketplace":
        return <Marketplace />;
      case "Wallet":
        return <Dashboard />;
      case "Logistics":
        return <Logistics />;
      case "Agents":
        return <Agents />;
      case "Demand":
        return <Demand />;
      case "Reports":
        return <Financial />;
      default:
        return <Marketplace />;
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg terminal-grid">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <LiveGPUPriceFeed />
      {renderContent()}
    </div>
  );
};

export default Index;
