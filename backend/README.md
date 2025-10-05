# CTRL Backend - GPU Pricing API Server

Backend server that aggregates real-time GPU pricing from multiple cloud providers.

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure API Keys**

Create a `.env` file in the `backend` directory:

```bash
# Copy example file
cp .env.example .env
```

Then edit `.env` and add your API keys:

```env
PORT=3001

# RunPod API Key
# Get from: https://www.runpod.io/console/user/settings
RUNPOD_API_KEY=your_runpod_key_here

# Vast.ai API Key
# Get from: https://vast.ai/console/cli/
VASTAI_API_KEY=your_vastai_key_here
```

## Getting API Keys

### RunPod
1. Go to https://www.runpod.io/console/user/settings
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste into `.env`

### Vast.ai
1. Go to https://vast.ai/console/cli/
2. Copy the API key shown
3. Paste into `.env`

## Running the Server

```bash
npm start
# or
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### GET /api/gpu-pricing
Returns aggregated GPU pricing from all configured sources.

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "sources": {
    "runpod": true,
    "vastai": true
  },
  "pricing": [
    {
      "gpuType": "NVIDIA H100",
      "pricePerHour": 2.49,
      "minPrice": 1.99,
      "maxPrice": 2.99,
      "sources": ["RunPod", "Vast.ai"],
      "demand": "High",
      "lastUpdated": "2025-10-04T12:00:00.000Z"
    }
  ]
}
```

### GET /health
Health check endpoint.

## Features

- Real-time GPU pricing from RunPod GraphQL API
- Real-time GPU pricing from Vast.ai REST API
- Automatic price aggregation and normalization
- Fallback handling if APIs are unavailable
- CORS enabled for frontend integration

## Notes

- Backend must be running for frontend to fetch real GPU prices
- If API keys are not configured, those sources will be skipped
- Frontend will use fallback data if backend is unavailable
