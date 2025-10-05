const fetch = require('node-fetch');

const RUNPOD_GRAPHQL_ENDPOINT = 'https://api.runpod.io/graphql';

const GPU_TYPES_QUERY = `
  query GpuTypes {
    gpuTypes(input: {}) {
      id
      displayName
      memoryInGb
      secureCloud
      communityCloud
      securePrice
      communityPrice
      oneMonthPrice
      threeMonthPrice
    }
  }
`;

async function fetchRunPodPricing() {
  const apiKey = process.env.RUNPOD_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  RUNPOD_API_KEY not configured, skipping RunPod');
    return [];
  }

  try {
    const response = await fetch(RUNPOD_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: GPU_TYPES_QUERY,
      }),
    });

    if (!response.ok) {
      throw new Error(`RunPod API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`RunPod GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const gpuTypes = data.data.gpuTypes || [];

    // Transform to standardized format
    return gpuTypes
      .filter(gpu => gpu.securePrice || gpu.communityPrice) // Only include GPUs with pricing
      .map(gpu => {
        // Use the lowest available price (prefer community, fall back to secure)
        const price = gpu.communityPrice || gpu.securePrice || gpu.oneMonthPrice;

        return {
          gpuType: normalizeGPUName(gpu.displayName),
          pricePerHour: parseFloat(price),
          memory: gpu.memoryInGb,
          source: 'RunPod',
          availability: gpu.secureCloud || gpu.communityCloud ? 'Available' : 'Limited',
        };
      })
      .filter(gpu => gpu.pricePerHour > 0); // Remove any with invalid pricing
  } catch (error) {
    console.error('RunPod API error:', error.message);
    throw error;
  }
}

// Normalize GPU names to match our standard format
function normalizeGPUName(name) {
  // Remove extra words and standardize format
  name = name.trim();

  // Map common variations
  const mappings = {
    'H100 80GB PCIe': 'NVIDIA H100',
    'H100 SXM': 'NVIDIA H100',
    'H100 PCIe': 'NVIDIA H100',
    'A100 80GB PCIe': 'NVIDIA A100',
    'A100 80GB SXM': 'NVIDIA A100',
    'A100 40GB PCIe': 'NVIDIA A100',
    'A100 SXM': 'NVIDIA A100',
    'L40S': 'NVIDIA L40S',
    'L40': 'NVIDIA L40S',
    'V100': 'NVIDIA V100',
    'RTX 4090': 'NVIDIA RTX 4090',
    'RTX 3090': 'NVIDIA RTX 3090',
  };

  // Check if name matches any mapping
  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) {
      return value;
    }
  }

  // Default: add NVIDIA prefix if not present
  return name.startsWith('NVIDIA') ? name : `NVIDIA ${name}`;
}

module.exports = { fetchRunPodPricing };
