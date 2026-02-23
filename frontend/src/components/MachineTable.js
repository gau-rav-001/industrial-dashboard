import React from 'react';
import HealthIndicator, { HealthBadge } from './HealthIndicator';

const MachineTable = ({ machines, onSelectMachine, loading }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading machines...</div>
      </div>
    );
  }

  if (!machines.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-text">No machines found</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Machine ID</th>
            <th>Type</th>
            <th>Health Score</th>
            <th>Status</th>
            <th>Air Temp (K)</th>
            <th>Proc Temp (K)</th>
            <th>Speed (RPM)</th>
            <th>Torque (Nm)</th>
            <th>Tool Wear</th>
            <th>Alerts</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m, i) => {
            const wearPct = Math.min((m.toolWear / 253) * 100, 100);
            const wearColor = m.toolWear > 200 ? '#E74C3C' : m.toolWear > 150 ? '#E67E22' : m.toolWear > 100 ? '#F39C12' : '#27AE60';
            return (
              <tr key={m._id || i} className="clickable" onClick={() => onSelectMachine?.(m.machineId)}>
                <td className="machine-id-cell">{m.machineId}</td>
                <td><span className={`type-badge ${m.machineType}`}>{m.machineType}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <HealthIndicator score={m.healthScore || 0} size="sm" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                      {m.healthScore || 0}
                    </span>
                  </div>
                </td>
                <td><HealthBadge status={m.status || 'GOOD'} /></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.airTemperature?.toFixed(1)}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.processTemperature?.toFixed(1)}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(m.rotationalSpeed)}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.torque?.toFixed(1)}</td>
                <td>
                  <div className="wear-bar-wrap">
                    <div className="wear-bar">
                      <div className="wear-bar-fill" style={{ width: `${wearPct}%`, background: wearColor }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {Math.round(m.toolWear)}
                    </span>
                  </div>
                </td>
                <td>
                  {(m.alerts || []).length > 0 ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.72rem',
                      color: 'var(--error)', background: 'var(--error-bg)',
                      padding: '2px 8px', borderRadius: '20px',
                      border: '1px solid var(--error-border)',
                    }}>
                      ⚠ {m.alerts.length}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ OK</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MachineTable;
