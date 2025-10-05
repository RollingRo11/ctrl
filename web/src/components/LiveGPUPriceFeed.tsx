import { useEffect, useState, useRef } from "react";
import { getGPUPricing, getGPUPricingSync, GPUPricing } from '../lib/gpuPricing';

const LiveGPUPriceFeed = () => {
  const [gpuPrices, setGpuPrices] = useState<GPUPricing[]>(getGPUPricingSync());
  const tickerRef = useRef<HTMLDivElement>(null);

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

  // Create ticker items
  const renderTickerItems = (keyPrefix: string) => {
    return gpuPrices.map((gpu, index) => (
      <span key={`${keyPrefix}-${gpu.gpuType}-${index}`} className="inline-flex items-center gap-4">
        <span className="text-terminal-accent">
          {gpu.gpuType}: ${gpu.pricePerHour.toFixed(2)}/hr
        </span>
        <span className="text-gray-600">|</span>
      </span>
    ));
  };

  return (
    <div className="bg-terminal-bg border-b border-terminal-border overflow-hidden h-10">
      <div className="flex items-center h-full">
        <div className="bg-terminal-accent text-terminal-bg px-3 py-1 text-sm font-semibold">
          LIVE
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={tickerRef}
            className="animate-scroll-text whitespace-nowrap text-sm font-mono flex items-center gap-4"
            style={{ willChange: 'transform' }}
          >
            {renderTickerItems('first')}
            {renderTickerItems('second')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveGPUPriceFeed;
