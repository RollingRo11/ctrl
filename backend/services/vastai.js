const fetch = require('node-fetch');

const VASTAI_API_ENDPOINT = 'https://console.vast.ai/api/v0';

async function fetchVastAIPricing() {
  const apiKey = process.env.VASTAI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  VASTAI_API_KEY not configured, skipping Vast.ai');
    return [];
  }

  try {
    // Search for available GPU offers
    const response = await fetch(`${VASTAI_API_ENDPOINT}/bundles/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vast.ai API returned ${response.status}`);
    }

    const data = await response.json();

    // Group by GPU type and find lowest prices
    const gpuPricing = {};

    if (Array.isArray(data?.offers)) {
      data.offers.forEach(offer => {
        if (offer.gpu_name && offer.dph_total) {
          const gpuType = normalizeGPUName(offer.gpu_name);
          const pricePerHour = parseFloat(offer.dph_total);

          if (!gpuPricing[gpuType] || gpuPricing[gpuType] > pricePerHour) {
            gpuPricing[gpuType] = pricePerHour;
          }
        }
      });
    }

    // Transform to standardized format
    return Object.entries(gpuPricing).map(([gpuType, price]) => ({
      gpuType,
      pricePerHour: parseFloat(price.toFixed(3)),
      source: 'Vast.ai',
      availability: 'Available',
    }));
  } catch (error) {
    console.error('Vast.ai API error:', error.message);
    throw error;
  }
}

// Normalize GPU names to match our standard format
function normalizeGPUName(name) {
  name = name.trim().toUpperCase();

  // Common mappings
  if (name.includes('H100')) return 'NVIDIA H100';
  if (name.includes('H200')) return 'NVIDIA H200';
  if (name.includes('A100')) return 'NVIDIA A100';
  if (name.includes('L40S')) return 'NVIDIA L40S';
  if (name.includes('L40')) return 'NVIDIA L40S';
  if (name.includes('V100')) return 'NVIDIA V100';
  if (name.includes('4090') || name.includes('RTX 4090')) return 'NVIDIA RTX 4090';
  if (name.includes('3090') || name.includes('RTX 3090')) return 'NVIDIA RTX 3090';

  return `NVIDIA ${name}`;
}

module.exports = { fetchVastAIPricing };
