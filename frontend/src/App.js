import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MachineList from './pages/MachineList';
import MachineDetail from './pages/MachineDetail';
import RealtimePredict from './pages/RealtimePredict';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  const navigate = (page, id = null) => {
    setCurrentPage(page);
    if (id) setSelectedMachineId(id);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'machines': return <MachineList onNavigate={navigate} />;
      case 'machine-detail': return <MachineDetail machineId={selectedMachineId} onNavigate={navigate} />;
      case 'predict': return <RealtimePredict onNavigate={navigate} />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">⚙</div>
          <span className="brand-text">SMARTMONITOR</span>
        </div>
        <div className="navbar-links">
          <button className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className={`nav-link ${currentPage === 'machines' ? 'active' : ''}`} onClick={() => navigate('machines')}>Machines</button>
          <button className={`nav-link ${currentPage === 'predict' ? 'active' : ''}`} onClick={() => navigate('predict')}>⚡ Predict</button>
        </div>
        <div className="navbar-status">
          <span className="status-dot live"></span>
          <span className="status-text">LIVE</span>
        </div>
      </nav>

      <main className="main-content">{renderPage()}</main>

      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--card)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        Developed by{' '}
        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
          Gaurav Kumbhare
        </span>
      </footer>
    </div>
  );
};

export default App;
