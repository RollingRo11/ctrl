const express = require('express');
const router = express.Router();
const { fetchRunPodPricing } = require('../services/runpod');
const { fetchVastAIPricing } = require('../services/vastai');

// Get aggregated GPU pricing from all sources
router.get('/', async (req, res) => {
  try {
    console.log('Fetching GPU pricing from all sources...');

    // Fetch from all sources in parallel
    const [runpodData, vastaiData] = await Promise.allSettled([
      fetchRunPodPricing(),
      fetchVastAIPricing(),
    ]);

    const pricing = [];

    // Process RunPod data
    if (runpodData.status === 'fulfilled' && runpodData.value) {
      pricing.push(...runpodData.value);
      console.log(`✅ RunPod: ${runpodData.value.length} GPU types fetched`);
    } else {
      console.warn('⚠️  RunPod fetch failed:', runpodData.reason?.message);
    }

    // Process Vast.ai data
    if (vastaiData.status === 'fulfilled' && vastaiData.value) {
      pricing.push(...vastaiData.value);
      console.log(`✅ Vast.ai: ${vastaiData.value.length} GPU types fetched`);
    } else {
      console.warn('⚠️  Vast.ai fetch failed:', vastaiData.reason?.message);
    }

    // Aggregate and deduplicate by GPU type
    const aggregated = aggregatePricing(pricing);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      sources: {
        runpod: runpodData.status === 'fulfilled',
        vastai: vastaiData.status === 'fulfilled',
      },
      pricing: aggregated,
    });
  } catch (error) {
    console.error('Error fetching GPU pricing:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Aggregate pricing from multiple sources
function aggregatePricing(pricingData) {
  const grouped = {};

  pricingData.forEach(item => {
    const key = item.gpuType;

    if (!grouped[key]) {
      grouped[key] = {
        gpuType: item.gpuType,
        prices: [],
        sources: [],
      };
    }

    grouped[key].prices.push(item.pricePerHour);
    grouped[key].sources.push(item.source);
  });

  // Calculate average, min, max for each GPU type
  return Object.values(grouped).map(gpu => {
    const prices = gpu.prices;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      gpuType: gpu.gpuType,
      pricePerHour: parseFloat(avgPrice.toFixed(3)),
      minPrice: parseFloat(minPrice.toFixed(3)),
      maxPrice: parseFloat(maxPrice.toFixed(3)),
      sources: [...new Set(gpu.sources)],
      demand: avgPrice > 2.5 ? 'High' : avgPrice > 1.0 ? 'Medium' : 'Low',
      lastUpdated: new Date().toISOString(),
    };
  }).sort((a, b) => b.pricePerHour - a.pricePerHour); // Sort by price descending
}

module.exports = router;
