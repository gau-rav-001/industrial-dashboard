/**
 * Machine Health & Analytics Service
 * Calculates health scores and detects anomalies
 */

// Normal operating ranges based on AI4I dataset analysis
const NORMAL_RANGES = {
  airTemperature: { min: 295, max: 304 },        // Kelvin
  processTemperature: { min: 305, max: 314 },     // Kelvin
  rotationalSpeed: { min: 1168, max: 2886 },      // RPM
  torque: { min: 3.8, max: 76.6 },               // Nm
  toolWear: { min: 0, max: 253 },                 // minutes
};

const CRITICAL_THRESHOLDS = {
  airTemperature: { min: 293, max: 306 },
  processTemperature: { min: 303, max: 316 },
  rotationalSpeed: { min: 1100, max: 3000 },
  torque: { min: 2, max: 80 },
  toolWear: { max: 240 },
};

/**
 * Calculate a health score (0-100) for a machine reading
 * 100 = perfect health, 0 = critical failure
 */
const calculateHealthScore = (data) => {
  const {
    airTemperature,
    processTemperature,
    rotationalSpeed,
    torque,
    toolWear,
    failureStatus,
  } = data;

  if (failureStatus) return 0;

  let score = 100;
  let deductions = 0;

  // Tool wear is the strongest indicator (max 40 point deduction)
  const toolWearRatio = toolWear / NORMAL_RANGES.toolWear.max;
  deductions += toolWearRatio * 40;

  // Temperature delta penalty (process - air should be ~10K)
  const tempDelta = processTemperature - airTemperature;
  if (tempDelta < 8 || tempDelta > 12) {
    deductions += Math.min(Math.abs(tempDelta - 10) * 2, 20);
  }

  // Rotational speed deviation
  const speedMid = (NORMAL_RANGES.rotationalSpeed.min + NORMAL_RANGES.rotationalSpeed.max) / 2;
  const speedDev = Math.abs(rotationalSpeed - speedMid) / speedMid;
  deductions += speedDev * 15;

  // Torque deviation
  const torqueMid = (NORMAL_RANGES.torque.min + NORMAL_RANGES.torque.max) / 2;
  const torqueDev = Math.abs(torque - torqueMid) / torqueMid;
  deductions += torqueDev * 10;

  // Out-of-range penalties
  if (airTemperature < CRITICAL_THRESHOLDS.airTemperature.min || airTemperature > CRITICAL_THRESHOLDS.airTemperature.max) {
    deductions += 15;
  }
  if (processTemperature < CRITICAL_THRESHOLDS.processTemperature.min || processTemperature > CRITICAL_THRESHOLDS.processTemperature.max) {
    deductions += 15;
  }

  score = Math.max(0, Math.min(100, score - deductions));
  return Math.round(score);
};

/**
 * Determine machine status label based on health score
 */
const getStatusFromScore = (healthScore, failureStatus) => {
  if (failureStatus) return 'CRITICAL';
  if (healthScore >= 80) return 'GOOD';
  if (healthScore >= 60) return 'WARNING';
  if (healthScore >= 40) return 'POOR';
  return 'CRITICAL';
};

/**
 * Detect specific anomaly types based on sensor data
 */
const detectAnomalies = (data) => {
  const alerts = [];
  const {
    airTemperature,
    processTemperature,
    rotationalSpeed,
    torque,
    toolWear,
  } = data;

  // Tool Wear Failure (TWF)
  if (toolWear > 200) {
    alerts.push({
      type: 'TWF',
      severity: toolWear > 240 ? 'critical' : 'warning',
      message: `Tool wear at ${toolWear} min — replacement recommended`,
    });
  }

  // Heat Dissipation Failure (HDF)
  const tempDelta = processTemperature - airTemperature;
  if (tempDelta < 8.6 && rotationalSpeed < 1380) {
    alerts.push({
      type: 'HDF',
      severity: 'warning',
      message: 'Heat dissipation anomaly detected',
    });
  }

  // Power Failure (PWF)
  const power = torque * rotationalSpeed * (Math.PI / 30); // Watts
  if (power < 3500 || power > 9000) {
    alerts.push({
      type: 'PWF',
      severity: power < 2000 || power > 10000 ? 'critical' : 'warning',
      message: `Power output anomaly: ${Math.round(power)}W`,
    });
  }

  // Overstrain Failure (OSF)
  if (toolWear * torque > 11000) {
    alerts.push({
      type: 'OSF',
      severity: 'critical',
      message: 'Overstrain risk — high torque with worn tool',
    });
  }

  // Temperature range alerts
  if (airTemperature > CRITICAL_THRESHOLDS.airTemperature.max) {
    alerts.push({
      type: 'TEMP',
      severity: 'warning',
      message: `Air temperature elevated: ${airTemperature}K`,
    });
  }

  return alerts;
};

/**
 * Compute summary statistics from an array of machine records
 */
const computeSummaryStats = (machines) => {
  const total = machines.length;
  if (total === 0) return {};

  const failed = machines.filter((m) => m.failureStatus).length;
  const scores = machines.map((m) => m.healthScore || 0);
  const avgHealth = scores.reduce((a, b) => a + b, 0) / total;

  const statusCounts = { GOOD: 0, WARNING: 0, POOR: 0, CRITICAL: 0 };
  machines.forEach((m) => {
    const status = getStatusFromScore(m.healthScore, m.failureStatus);
    statusCounts[status]++;
  });

  return {
    total,
    failed,
    operational: total - failed,
    averageHealthScore: Math.round(avgHealth),
    statusBreakdown: statusCounts,
    failureRate: ((failed / total) * 100).toFixed(2),
  };
};

module.exports = {
  calculateHealthScore,
  getStatusFromScore,
  detectAnomalies,
  computeSummaryStats,
  NORMAL_RANGES,
};
