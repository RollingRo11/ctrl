const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

// Get all agents and their status
router.get('/', agentController.getAllAgents);

// Toggle agent active/inactive
router.post('/:agentId/toggle', agentController.toggleAgent);

// Get agent actions log
router.get('/:agentId/actions', agentController.getAgentActions);

// Run scenario simulation
router.post('/simulate', agentController.runSimulation);

// Get agent recommendations
router.post('/:agentId/recommend', agentController.getRecommendation);

// Execute agent action
router.post('/:agentId/execute', agentController.executeAction);

module.exports = router;
