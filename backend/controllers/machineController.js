const Machine = require('../models/Machine');
const {
  calculateHealthScore,
  getStatusFromScore,
  detectAnomalies,
  computeSummaryStats,
} = require('../services/analyticsService');

/**
 * GET /api/machines
 */
const getAllMachines = async (req, res) => {
  try {
    const { status, type, limit = 100, page = 1, sort = '-timestamp' } = req.query;

    const filter = {};
    if (type) filter.machineType = type;
    if (status === 'failed') filter.failureStatus = true;
    if (status === 'operational') filter.failureStatus = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [machines, total] = await Promise.all([
      Machine.find(filter).sort(sort).limit(parseInt(limit)).skip(skip).lean(),
      Machine.countDocuments(filter),
    ]);

    const enriched = machines.map((m) => ({
      ...m,
      status: getStatusFromScore(m.healthScore, m.failureStatus),
      alerts: detectAnomalies(m),
    }));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/machines/status/summary
 * Uses aggregation only — no full collection load
 */
const getStatusSummary = async (req, res) => {
  try {
    // Use aggregation instead of loading all records
    const [counts, avgStats, failureByType, recentFailures] = await Promise.all([
      Machine.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            failed: { $sum: { $cond: ['$failureStatus', 1, 0] } },
            avgHealth: { $avg: '$healthScore' },
            good: { $sum: { $cond: [{ $gte: ['$healthScore', 80] }, 1, 0] } },
            warning: { $sum: { $cond: [{ $and: [{ $gte: ['$healthScore', 60] }, { $lt: ['$healthScore', 80] }] }, 1, 0] } },
            poor: { $sum: { $cond: [{ $and: [{ $gte: ['$healthScore', 40] }, { $lt: ['$healthScore', 60] }] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $lt: ['$healthScore', 40] }, 1, 0] } },
          },
        },
      ]),
      Machine.aggregate([
        {
          $group: {
            _id: null,
            avgAirTemp: { $avg: '$airTemperature' },
            avgProcessTemp: { $avg: '$processTemperature' },
            avgRotationalSpeed: { $avg: '$rotationalSpeed' },
            avgTorque: { $avg: '$torque' },
            avgToolWear: { $avg: '$toolWear' },
            avgHealthScore: { $avg: '$healthScore' },
          },
        },
      ]),
      Machine.aggregate([
        { $group: { _id: '$failureType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Machine.find({ failureStatus: true }).sort('-timestamp').limit(10).lean(),
    ]);

    const c = counts[0] || {};
    const summary = {
      total: c.total || 0,
      failed: c.failed || 0,
      operational: (c.total || 0) - (c.failed || 0),
      averageHealthScore: Math.round(c.avgHealth || 0),
      failureRate: c.total ? ((c.failed / c.total) * 100).toFixed(2) : '0.00',
      statusBreakdown: {
        GOOD: c.good || 0,
        WARNING: c.warning || 0,
        POOR: c.poor || 0,
        CRITICAL: c.critical || 0,
      },
    };

    res.json({ success: true, summary, recentFailures, failureByType, avgStats: avgStats[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/machines/:id
 */
const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findOne({ machineId: req.params.id }).lean();
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });

    const alerts = detectAnomalies(machine);
    const status = getStatusFromScore(machine.healthScore, machine.failureStatus);
    const history = await Machine.find({ machineType: machine.machineType }).sort('-timestamp').limit(20).lean();

    res.json({
      success: true,
      data: {
        ...machine, status, alerts,
        history: history.map((h) => ({
          timestamp: h.timestamp,
          healthScore: h.healthScore,
          toolWear: h.toolWear,
          rotationalSpeed: h.rotationalSpeed,
          torque: h.torque,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/machines/analytics/trends
 */
const getTrends = async (req, res) => {
  try {
    const { metric = 'healthScore', limit = 50 } = req.query;
    const records = await Machine.find()
      .sort('-timestamp')
      .limit(parseInt(limit))
      .select(`machineId machineType ${metric} timestamp failureStatus`)
      .lean();

    const byType = { L: [], M: [], H: [] };
    records.forEach((r) => {
      if (byType[r.machineType]) byType[r.machineType].push({ x: r.timestamp, y: r[metric], failed: r.failureStatus });
    });

    res.json({ success: true, metric, data: byType });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/machines/predict
 */
const predictRealtime = (req, res) => {
  try {
    const { machineType = 'M', airTemperature, processTemperature, rotationalSpeed, torque, toolWear } = req.body;

    const missing = [];
    if (airTemperature == null) missing.push('airTemperature');
    if (processTemperature == null) missing.push('processTemperature');
    if (rotationalSpeed == null) missing.push('rotationalSpeed');
    if (torque == null) missing.push('torque');
    if (toolWear == null) missing.push('toolWear');
    if (missing.length > 0) return res.status(400).json({ success: false, error: `Missing: ${missing.join(', ')}` });

    const data = {
      machineType,
      airTemperature: parseFloat(airTemperature),
      processTemperature: parseFloat(processTemperature),
      rotationalSpeed: parseFloat(rotationalSpeed),
      torque: parseFloat(torque),
      toolWear: parseFloat(toolWear),
      failureStatus: false,
    };

    const healthScore = calculateHealthScore(data);
    const alerts = detectAnomalies(data);
    const failureStatus = healthScore < 20 || alerts.some(a => a.severity === 'critical');
    const status = getStatusFromScore(healthScore, failureStatus);
    const critical = alerts.find(a => a.severity === 'critical');
    const predictedFailure = alerts.length > 0 ? (critical ? critical.message : alerts[0].message) : 'No Failure Predicted';
    const power = Math.round(data.torque * data.rotationalSpeed * (Math.PI / 30));
    const toolWearRemaining = Math.max(0, 253 - data.toolWear);
    const rulEstimate = toolWearRemaining > 0 ? `~${toolWearRemaining} min of tool life remaining` : 'Tool replacement required immediately';

    res.json({
      success: true,
      prediction: {
        healthScore, status, failureStatus, predictedFailure, alerts, power, rulEstimate,
        tempDifferential: (data.processTemperature - data.airTemperature).toFixed(2),
        inputs: data,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getAllMachines, getStatusSummary, getMachineById, getTrends, predictRealtime };