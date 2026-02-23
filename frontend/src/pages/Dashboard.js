import React, { useEffect, useState, useCallback } from 'react';
import { machineService } from '../services/api';
import { StatusDoughnut, HealthTrendChart, ToolWearChart } from '../components/ChartsPanel';
import MachineTable from '../components/MachineTable';
import AlertPanel from '../components/AlertPanel';

const StatCard = ({ label, value, sub, colorClass, icon, accentColor }) => (
  <div className={`card stat-card ${colorClass} animate-in`}>
    <div className="stat-card-accent" style={{ background: accentColor }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ marginTop: '0.35rem' }}>{value}</div>
        {sub && <div className="stat-sub" style={{ marginTop: '0.3rem' }}>{sub}</div>}
      </div>
      <div className="stat-icon" style={{ background: accentColor + '18', fontSize: '1.3rem' }}>{icon}</div>
    </div>
  </div>
);

const Dashboard = ({ onNavigate }) => {
  const [summary, setSummary] = useState(null);
  const [machines, setMachines] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, machinesRes] = await Promise.all([
        machineService.getSummary(),
        machineService.getAll({ limit: 10, sort: '-timestamp' }),
      ]);
      setSummary(summaryRes);
      setMachines(machinesRes.data || []);
      const alerts = [];
      (machinesRes.data || []).forEach(m => (m.alerts || []).forEach(a => alerts.push({ ...a, machineId: m.machineId })));
      setAllAlerts(alerts.slice(0, 8));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <div className="loading-container" style={{ minHeight: '60vh' }}><div className="loading-spinner" /><div className="loading-text">Loading dashboard...</div></div>;

  if (error) return (
    <div style={{ padding: '2rem 0' }}>
      <div className="error-box">
        <strong>⚠ Connection Error:</strong> {error}<br />
        <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.4rem', display: 'block' }}>Ensure the backend is running on port 5000 and MongoDB is connected.</span>
      </div>
    </div>
  );

  const s = summary?.summary || {};
  const avg = summary?.avgStats || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Operations Overview</div>
          <div className="page-subtitle">Industrial Equipment Monitoring · AI4I Predictive Maintenance Dataset</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('predict')}>⚡ Predict</button>
          <button className="btn btn-primary" onClick={() => onNavigate('machines')}>View All Machines →</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats">
        <StatCard label="Total Machines" value={s.total?.toLocaleString() || '—'} sub="in dataset" colorClass="blue" icon="🏭" accentColor="#1E3A5F" />
        <StatCard label="Operational" value={s.operational?.toLocaleString() || '—'} sub={s.total ? `${(100 - parseFloat(s.failureRate)).toFixed(1)}% uptime` : ''} colorClass="green" icon="✅" accentColor="#27AE60" />
        <StatCard label="Failures" value={s.failed?.toLocaleString() || '—'} sub={s.failureRate ? `${s.failureRate}% failure rate` : ''} colorClass="red" icon="⚠️" accentColor="#E74C3C" />
        <StatCard label="Avg Health Score" value={s.averageHealthScore || '—'} sub="out of 100" colorClass="orange" icon="💊" accentColor="#F39C12" />
        <StatCard label="Avg Tool Wear" value={avg.avgToolWear ? Math.round(avg.avgToolWear) + ' min' : '—'} sub="minutes worn" colorClass="teal" icon="🔧" accentColor="#4A90A4" />
        <StatCard label="Avg Torque" value={avg.avgTorque ? avg.avgTorque.toFixed(1) + ' Nm' : '—'} sub="rotational force" colorClass="blue" icon="⚙️" accentColor="#1E3A5F" />
      </div>

      {/* Charts Row */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card animate-in">
          <div className="section-title">Fleet Status Breakdown</div>
          <StatusDoughnut breakdown={s.statusBreakdown || {}} />
        </div>
        <div className="card animate-in">
          <div className="section-title">Health Score Trend</div>
          <HealthTrendChart />
        </div>
        <div className="card animate-in">
          <div className="section-title">Tool Wear Distribution</div>
          <ToolWearChart machines={machines} />
        </div>
      </div>

      {/* Table + Alerts */}
      <div className="grid-2">
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="section-title" style={{ margin: 0 }}>Recent Readings</div>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }} onClick={() => onNavigate('machines')}>See all</button>
          </div>
          <MachineTable machines={machines} onSelectMachine={id => onNavigate('machine-detail', id)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card animate-in">
            <div className="section-title">Active Alerts</div>
            <AlertPanel alerts={allAlerts} />
          </div>
          {summary?.failureByType?.filter(f => f._id !== 'No Failure').length > 0 && (
            <div className="card animate-in">
              <div className="section-title">Failure Type Breakdown</div>
              {summary.failureByType.filter(f => f._id !== 'No Failure').map((f, i) => (
                <div key={i} className="metric-row">
                  <span className="metric-label">{f._id}</span>
                  <span className="metric-value" style={{ color: 'var(--error)', fontWeight: 700 }}>{f.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
