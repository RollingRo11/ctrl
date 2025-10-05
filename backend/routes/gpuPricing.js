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
    let aggregated = aggregatePricing(pricing);

    // If no pricing data was fetched, use fallback data
    if (aggregated.length === 0) {
      console.log('⚠️  No pricing data from APIs, using fallback data');
      aggregated = getFallbackPricing();
    }

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

// Fallback pricing data when APIs are unavailable
function getFallbackPricing() {
  const fluctuation = () => 0.95 + Math.random() * 0.1;

  return [
    {
      gpuType: 'NVIDIA H100',
      pricePerHour: parseFloat((2.49 * fluctuation()).toFixed(3)),
      minPrice: 2.20,
      maxPrice: 2.80,
      sources: ['Fallback'],
      demand: 'High',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA H200',
      pricePerHour: parseFloat((3.20 * fluctuation()).toFixed(3)),
      minPrice: 2.95,
      maxPrice: 3.50,
      sources: ['Fallback'],
      demand: 'High',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA A100',
      pricePerHour: parseFloat((1.29 * fluctuation()).toFixed(3)),
      minPrice: 1.10,
      maxPrice: 1.50,
      sources: ['Fallback'],
      demand: 'Medium',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA L40S',
      pricePerHour: parseFloat((0.89 * fluctuation()).toFixed(3)),
      minPrice: 0.75,
      maxPrice: 1.00,
      sources: ['Fallback'],
      demand: 'Medium',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA V100',
      pricePerHour: parseFloat((0.49 * fluctuation()).toFixed(3)),
      minPrice: 0.40,
      maxPrice: 0.60,
      sources: ['Fallback'],
      demand: 'Low',
      lastUpdated: new Date().toISOString(),
    },
    {
      gpuType: 'NVIDIA RTX 4090',
      pricePerHour: parseFloat((0.69 * fluctuation()).toFixed(3)),
      minPrice: 0.55,
      maxPrice: 0.85,
      sources: ['Fallback'],
      demand: 'Medium',
      lastUpdated: new Date().toISOString(),
    },
  ].sort((a, b) => b.pricePerHour - a.pricePerHour);
}

module.exports = router;
