import React, { useState } from 'react';
import HealthIndicator, { HealthBadge } from '../components/HealthIndicator';
import AlertPanel from '../components/AlertPanel';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const DEFAULT_VALUES = { machineType: 'M', airTemperature: '300.0', processTemperature: '310.5', rotationalSpeed: '1500', torque: '40.0', toolWear: '100' };

const FIELD_META = {
  airTemperature:     { label: 'Air Temperature',     unit: 'K',   min: 290, max: 320,  step: 0.1, hint: 'Normal: 295–304 K' },
  processTemperature: { label: 'Process Temperature', unit: 'K',   min: 300, max: 330,  step: 0.1, hint: 'Normal: 305–314 K' },
  rotationalSpeed:    { label: 'Rotational Speed',    unit: 'RPM', min: 500, max: 4000, step: 1,   hint: 'Normal: 1168–2886 RPM' },
  torque:             { label: 'Torque',              unit: 'Nm',  min: 1,   max: 100,  step: 0.1, hint: 'Normal: 3.8–76.6 Nm' },
  toolWear:           { label: 'Tool Wear',           unit: 'min', min: 0,   max: 300,  step: 1,   hint: 'Critical: >200 min' },
};

const RealtimePredict = ({ onNavigate }) => {
  const [form, setForm] = useState(DEFAULT_VALUES);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => { setForm(p => ({ ...p, [field]: value })); setResult(null); };

  const handlePredict = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = {
        machineType: form.machineType,
        airTemperature: parseFloat(form.airTemperature),
        processTemperature: parseFloat(form.processTemperature),
        rotationalSpeed: parseFloat(form.rotationalSpeed),
        torque: parseFloat(form.torque),
        toolWear: parseFloat(form.toolWear),
      };

      const response = await fetch(`${API_BASE}/machines/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text(); // read as text first

      if (!text || text.trim() === '') {
        throw new Error('Empty response from server — backend may be sleeping, try again in 30 seconds');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      if (!data.success) throw new Error(data.error || 'Prediction failed');
      setResult(data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.healthScore >= 80 ? '#27AE60' : result.healthScore >= 60 ? '#F39C12' : result.healthScore >= 40 ? '#E67E22' : '#E74C3C'
    : '#4A90A4';

  const recoText = !result ? '' :
    result.healthScore >= 80 ? '✅ Machine is in good health. Continue normal operation and schedule routine inspection.' :
    result.healthScore >= 60 ? '⚠️ Minor issues detected. Monitor closely and plan preventive maintenance within the next maintenance window.' :
    result.healthScore >= 40 ? '🔶 Significant degradation detected. Schedule maintenance soon. Reduce operational load if possible.' :
    '🚨 Critical condition. Immediate maintenance required. Consider halting the machine to prevent further damage.';

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-back" onClick={() => onNavigate('dashboard')}>← Dashboard</button>
          <div>
            <div className="page-title">Real-Time Prediction</div>
            <div className="page-subtitle">Enter sensor values to instantly predict machine health and failure risk</div>
          </div>
        </div>
        <span className="info-chip">⚡ Powered by AI4I Model</span>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* INPUT FORM */}
        <div className="card">
          <div className="section-title">Sensor Input Parameters</div>

          {/* Machine Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
              Machine Type
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[['L', 'Low Quality', '#F39C12'], ['M', 'Medium Quality', '#4A90A4'], ['H', 'High Quality', '#27AE60']].map(([t, label, color]) => (
                <button key={t} onClick={() => handleChange('machineType', t)} style={{
                  flex: 1, padding: '0.6rem 0.5rem',
                  border: `2px solid ${form.machineType === t ? color : 'var(--border)'}`,
                  background: form.machineType === t ? color + '12' : 'transparent',
                  color: form.machineType === t ? color : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>{t === 'L' ? '🔵' : t === 'M' ? '🟡' : '🟢'}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sensor Sliders */}
          {Object.entries(FIELD_META).map(([field, meta]) => (
            <div key={field} style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                  {meta.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>{form[field]}</span>
                  <span className="info-chip" style={{ fontSize: '0.65rem' }}>{meta.unit}</span>
                </div>
              </div>
              <input type="range" min={meta.min} max={meta.max} step={meta.step} value={form[field]}
                onChange={e => handleChange(field, e.target.value)} style={{ width: '100%', cursor: 'pointer', height: '4px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>{meta.min}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{meta.hint}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>{meta.max}</span>
              </div>
              <input type="number" min={meta.min} max={meta.max} step={meta.step} value={form[field]}
                onChange={e => handleChange(field, e.target.value)} />
            </div>
          ))}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={handlePredict} disabled={loading} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '0.7rem' }}>
              {loading ? '⏳ Analyzing...' : '⚡ Predict Now'}
            </button>
            <button onClick={() => { setForm(DEFAULT_VALUES); setResult(null); setError(null); }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Reset
            </button>
          </div>
          {error && <div className="error-box" style={{ marginTop: '1rem' }}>⚠ {error}</div>}
        </div>

        {/* RESULTS */}
        <div>
          {!result && !loading && (
            <div className="card empty-state" style={{ minHeight: '300px' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>⚙️</div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Enter values and click Predict</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Results will appear here instantly</div>
            </div>
          )}

          {loading && (
            <div className="card loading-container" style={{ minHeight: '300px' }}>
              <div className="loading-spinner" />
              <div className="loading-text">Running prediction model...</div>
            </div>
          )}

          {result && (
            <div className="animate-in">
              <div className="card" style={{ marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="section-title" style={{ margin: 0 }}>Prediction Result</div>
                  <HealthBadge status={result.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HealthIndicator score={result.healthScore} size="lg" />
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{result.healthScore}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>Health</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[
                      ['Failure Detected', result.failureStatus ? '⚠ Yes' : '✓ No', result.failureStatus ? 'var(--error)' : 'var(--success)'],
                      ['Estimated Power', `${result.power} W`, null],
                      ['Temp Differential', `${result.tempDifferential} K`, null],
                    ].map(([label, value, color], i) => (
                      <div key={i} className="metric-row">
                        <span className="metric-label">{label}</span>
                        <span className="metric-value" style={{ color: color || undefined, fontWeight: color ? 700 : 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`diagnosis-box ${result.failureStatus ? 'fail' : 'ok'}`}>
                  <div className={`diagnosis-label ${result.failureStatus ? 'fail' : 'ok'}`}>Diagnosis</div>
                  <div className={`diagnosis-value ${result.failureStatus ? 'fail' : 'ok'}`}>{result.predictedFailure}</div>
                </div>
                <div className="rul-box">
                  <div className="rul-label">Remaining Useful Life Estimate</div>
                  <div className="rul-value">{result.rulEstimate}</div>
                </div>
              </div>
              <div className="card" style={{ marginBottom: '1.1rem' }}>
                <div className="section-title">Detected Anomalies ({result.alerts.length})</div>
                <AlertPanel alerts={result.alerts} />
              </div>
              <div className="card">
                <div className="section-title">Maintenance Recommendation</div>
                <div className="reco-box">{recoText}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimePredict;