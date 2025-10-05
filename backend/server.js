const express = require('express');
const cors = require('cors');
require('dotenv').config();

const gpuPricingRouter = require('./routes/gpuPricing');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/gpu-pricing', gpuPricingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 GPU Pricing API: http://localhost:${PORT}/api/gpu-pricing`);
});
