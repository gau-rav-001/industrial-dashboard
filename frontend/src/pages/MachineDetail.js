import React, { useEffect, useState } from 'react';
import { machineService } from '../services/api';
import HealthIndicator, { HealthBadge } from '../components/HealthIndicator';
import AlertPanel from '../components/AlertPanel';
import { ParameterChart } from '../components/ChartsPanel';

const MachineDetail = ({ machineId, onNavigate }) => {
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!machineId) { setError('No machine ID provided'); setLoading(false); return; }
    machineService.getById(machineId)
      .then(res => setMachine(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [machineId]);

  if (loading) return <div className="loading-container" style={{ minHeight: '60vh' }}><div className="loading-spinner" /><div className="loading-text">Loading machine data...</div></div>;
  if (error) return <div style={{ padding: '2rem 0' }}><button className="btn btn-back" onClick={() => onNavigate('machines')} style={{ marginBottom: '1rem' }}>← Back</button><div className="error-box">{error}</div></div>;
  if (!machine) return null;

  const scoreColor = machine.healthScore >= 80 ? '#27AE60' : machine.healthScore >= 60 ? '#F39C12' : machine.healthScore >= 40 ? '#E67E22' : '#E74C3C';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-back" onClick={() => onNavigate('machines')}>← Machines</button>
          <div>
            <div className="page-title">Machine {machine.machineId}</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Type: {machine.machineType === 'H' ? 'High' : machine.machineType === 'M' ? 'Medium' : 'Low'} Quality</span>
              <span>·</span>
              <span>{machine.failureType}</span>
            </div>
          </div>
        </div>
        <HealthBadge status={machine.status} />
      </div>

      {/* Top row */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Health card */}
        <div className="card">
          <div className="section-title">Machine Health</div>
          <div className="health-ring-container">
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HealthIndicator score={machine.healthScore} size="lg" />
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div className="health-score-big" style={{ color: scoreColor }}>{machine.healthScore}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Health</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="metric-row">
                <span className="metric-label">Failure Status</span>
                <span className="metric-value" style={{ color: machine.failureStatus ? 'var(--error)' : 'var(--success)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {machine.failureStatus ? '⚠ Failed' : '✓ Operational'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Failure Type</span>
                <span className="metric-value" style={{ fontSize: '0.78rem' }}>{machine.failureType}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Machine Class</span>
                <span className="metric-value">{machine.machineType === 'H' ? 'High' : machine.machineType === 'M' ? 'Medium' : 'Low'} Quality</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Power Output (est.)</span>
                <span className="metric-value">{Math.round(machine.torque * machine.rotationalSpeed * (Math.PI / 30))} W</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Parameters */}
        <div className="card">
          <div className="section-title">Sensor Parameters</div>
          {[
            ['Air Temperature', `${machine.airTemperature?.toFixed(2)} K`],
            ['Process Temperature', `${machine.processTemperature?.toFixed(2)} K`],
            ['Temp Differential', `${(machine.processTemperature - machine.airTemperature).toFixed(2)} K`],
            ['Rotational Speed', `${Math.round(machine.rotationalSpeed)} RPM`],
            ['Torque', `${machine.torque?.toFixed(2)} Nm`],
            ['Tool Wear', `${Math.round(machine.toolWear)} min${machine.toolWear > 200 ? ' ⚠' : ''}`],
          ].map(([label, value], i) => (
            <div key={i} className="metric-row">
              <span className="metric-label">{label}</span>
              <span className="metric-value" style={{ color: label === 'Tool Wear' && machine.toolWear > 200 ? 'var(--error)' : undefined }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Parameter Overview</div>
          <ParameterChart machine={machine} />
          {(machine.history || []).length > 0 && (
            <>
              <div className="divider" />
              <div className="section-title">Recent Type {machine.machineType} Readings</div>
              <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {machine.history.slice(0, 8).map((h, i) => (
                  <div key={i} className="metric-row">
                    <span className="metric-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{i + 1}</span>
                    <span className="metric-value" style={{ fontSize: '0.78rem' }}>
                      Health: <span style={{ color: h.healthScore > 70 ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{h.healthScore}</span>
                      &nbsp;·&nbsp;Wear: {Math.round(h.toolWear)} min
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="card">
          <div className="section-title">Active Alerts ({(machine.alerts || []).length})</div>
          <AlertPanel alerts={machine.alerts || []} />
        </div>
      </div>
    </div>
  );
};

export default MachineDetail;