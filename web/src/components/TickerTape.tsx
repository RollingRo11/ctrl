import { useEffect, useState } from "react";

const TickerTape = () => {
  const messages = [
    "CTRL | SYSTEM READY",
    "STATUS: OPERATIONAL",
    "ALL SYSTEMS NOMINAL"
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="bg-terminal-bg border-b border-terminal-border overflow-hidden h-10">
      <div className="flex items-center h-full">
        <div className="bg-terminal-accent text-terminal-bg px-3 py-1 text-sm font-semibold">
          LIVE
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div className="animate-scroll-text whitespace-nowrap text-terminal-accent text-sm font-mono">
            {messages[currentMessage]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
