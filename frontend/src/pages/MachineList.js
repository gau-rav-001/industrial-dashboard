import React, { useEffect, useState, useCallback } from 'react';
import { machineService } from '../services/api';
import MachineTable from '../components/MachineTable';

const MachineList = ({ onNavigate }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, page, sort: '-timestamp' };
      if (filter) params.status = filter;
      const res = await machineService.getAll(params);
      setMachines(res.data || []);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { fetchMachines(); }, [fetchMachines]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-back" onClick={() => onNavigate('dashboard')}>← Dashboard</button>
          <div>
            <div className="page-title">Machine Registry</div>
            <div className="page-subtitle">{total.toLocaleString()} total records</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="filter-tabs">
            {[['', 'All'], ['operational', 'Operational'], ['failed', 'Failed']].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('predict')}>⚡ Predict</button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <MachineTable machines={machines} loading={loading} onSelectMachine={id => onNavigate('machine-detail', id)} />
        <div className="pagination">
          <span className="pagination-info">Page {page} of {totalPages} · {total.toLocaleString()} records</span>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
        </div>
      </div>
    </div>
  );
};

export default MachineList;