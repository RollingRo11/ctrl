const express = require('express');
const cors = require('cors');
require('dotenv').config();

const gpuPricingRouter = require('./routes/gpuPricing');
const financialRouter = require('./routes/financial');
const blockchainRouter = require('./routes/blockchain');
const agentsRouter = require('./routes/agents');
const paymentsRouter = require('./routes/payments');
const voiceRouter = require('./routes/voice');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/gpu-pricing', gpuPricingRouter);
app.use('/api/financial', financialRouter);
app.use('/api/blockchain', blockchainRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/voice', voiceRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 GPU Pricing API: http://localhost:${PORT}/api/gpu-pricing`);
  console.log(`🎙️ Voice API: http://localhost:${PORT}/api/voice`);
});
