import { useState } from "react";
import Navigation from "@/components/Navigation";
import TickerTape from "@/components/TickerTape";
import Marketplace from "@/pages/Marketplace";
import Dashboard from "@/pages/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("Marketplace");

  const renderContent = () => {
    switch (activeTab) {
      case "Marketplace":
        return <Marketplace />;
      case "Dashboard":
        return <Dashboard />;
      default:
        return <Marketplace />;
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
