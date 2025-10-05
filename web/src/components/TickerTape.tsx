import { useEffect, useState } from "react";
import { getGPUPricing, getGPUPricingSync, GPUPricing } from '../lib/gpuPricing';

const TickerTape = () => {
  const [gpuPrices, setGpuPrices] = useState<GPUPricing[]>(getGPUPricingSync());

  // Fetch real prices on mount and every 60 seconds
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = await getGPUPricing();
      setGpuPrices(prices);
    };

    fetchPrices(); // Initial fetch

    const priceInterval = setInterval(fetchPrices, 60000); // Update every minute

    return () => clearInterval(priceInterval);
  }, []);

  // Create continuous ticker message with all GPU prices
  const createTickerMessage = () => {
    return gpuPrices.map(gpu => {
      const demandIndicator = gpu.demand === 'High' ? '🔥' : gpu.demand === 'Medium' ? '📊' : '📉';
      return `${gpu.gpuType}: $${gpu.pricePerHour.toFixed(2)}/hr ${demandIndicator}`;
    }).join('  •  ');
  };

  const tickerMessage = createTickerMessage();
  // Duplicate the message to create seamless loop
  const continuousMessage = `${tickerMessage}  •  ${tickerMessage}  •  ${tickerMessage}`;

  return (
    <div className="bg-terminal-bg border-b border-terminal-border overflow-hidden h-10">
      <div className="flex items-center h-full">
        <div className="bg-terminal-accent text-terminal-bg px-3 py-1 text-sm font-semibold">
          LIVE
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div className="animate-scroll-text whitespace-nowrap text-terminal-accent text-sm font-mono">
            {continuousMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
