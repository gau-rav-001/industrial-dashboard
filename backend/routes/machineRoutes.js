const express = require('express');
const router = express.Router();
const {
  getAllMachines,
  getStatusSummary,
  getMachineById,
  getTrends,
  predictRealtime,
} = require('../controllers/machineController');

// ORDER MATTERS — specific routes before parameterized routes
router.get('/status/summary', getStatusSummary);
router.get('/analytics/trends', getTrends);
router.post('/predict', predictRealtime);
router.get('/', getAllMachines);
router.get('/:id', getMachineById);

module.exports = router;