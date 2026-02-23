import React from 'react';

const AlertPanel = ({ alerts = [] }) => {
  if (!alerts.length) {
    return (
      <div className="empty-state" style={{ padding: '1.5rem' }}>
        <div className="empty-state-icon">✅</div>
        <div className="empty-state-text">No active alerts</div>
      </div>
    );
  }
  return (
    <div>
      {alerts.map((alert, i) => (
        <div key={i} className={`alert-item ${alert.severity}`}>
          <span className="alert-type">[{alert.type}]</span>
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

export default AlertPanel;