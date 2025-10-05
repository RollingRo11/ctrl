const express = require('express');
const router = express.Router();

// Proxy endpoint for Blockchain.com hashrate
router.get('/hashrate', async (req, res) => {
  try {
    const response = await fetch('https://blockchain.info/q/hashrate');
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Blockchain hashrate API error:', error);
    res.status(500).json({ error: 'Failed to fetch hashrate data' });
  }
});

// Proxy endpoint for Blockchain.com difficulty
router.get('/difficulty', async (req, res) => {
  try {
    const response = await fetch('https://blockchain.info/q/getdifficulty');
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Blockchain difficulty API error:', error);
    res.status(500).json({ error: 'Failed to fetch difficulty data' });
  }
});

// Proxy endpoint for Blockchain.com transaction count
router.get('/transactions', async (req, res) => {
  try {
    const response = await fetch('https://blockchain.info/q/24hrtransactioncount');
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Blockchain transactions API error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction data' });
  }
});

module.exports = router;
