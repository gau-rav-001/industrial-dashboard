import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { machineService } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const tooltipStyle = {
  backgroundColor: '#1E3A5F',
  borderColor: '#2a5080',
  borderWidth: 1,
  titleColor: '#ffffff',
  bodyColor: 'rgba(255,255,255,0.75)',
  padding: 10,
  cornerRadius: 8,
  titleFont: { family: 'Plus Jakarta Sans', weight: '700', size: 12 },
  bodyFont: { family: 'DM Sans', size: 11 },
};

const axisStyle = {
  ticks: { color: '#8a9ab0', font: { family: 'DM Sans', size: 11 } },
  grid: { color: 'rgba(0,0,0,0.05)' },
  border: { color: 'transparent' },
};

const legendStyle = {
  labels: { color: '#5a6a7a', font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 }, boxWidth: 10, padding: 16 },
};

export const ToolWearChart = ({ machines = [] }) => {
  const buckets = [0, 0, 0, 0, 0];
  machines.forEach(({ toolWear }) => {
    if (toolWear <= 50) buckets[0]++;
    else if (toolWear <= 100) buckets[1]++;
    else if (toolWear <= 150) buckets[2]++;
    else if (toolWear <= 200) buckets[3]++;
    else buckets[4]++;
  });
  const data = {
    labels: ['0–50', '51–100', '101–150', '151–200', '200+'],
    datasets: [{
      label: 'Machines',
      data: buckets,
      backgroundColor: ['rgba(39,174,96,0.7)', 'rgba(74,144,164,0.7)', 'rgba(243,156,18,0.7)', 'rgba(230,126,34,0.7)', 'rgba(231,76,60,0.7)'],
      borderColor: ['#27AE60', '#4A90A4', '#F39C12', '#E67E22', '#E74C3C'],
      borderWidth: 2, borderRadius: 6,
    }],
  };
  return (
    <div style={{ height: 200 }}>
      <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipStyle }, scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true } } }} />
    </div>
  );
};

export const StatusDoughnut = ({ breakdown = {} }) => {
  const { GOOD = 0, WARNING = 0, POOR = 0, CRITICAL = 0 } = breakdown;
  const data = {
    labels: ['Good', 'Warning', 'Poor', 'Critical'],
    datasets: [{
      data: [GOOD, WARNING, POOR, CRITICAL],
      backgroundColor: ['rgba(39,174,96,0.85)', 'rgba(243,156,18,0.85)', 'rgba(230,126,34,0.85)', 'rgba(231,76,60,0.85)'],
      borderColor: ['#27AE60', '#F39C12', '#E67E22', '#E74C3C'],
      borderWidth: 2,
    }],
  };
  return (
    <div style={{ height: 190 }}>
      <Doughnut data={data} options={{
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'right', labels: legendStyle.labels }, tooltip: tooltipStyle },
      }} />
    </div>
  );
};

export const HealthTrendChart = () => {
  const [trendData, setTrendData] = useState(null);
  useEffect(() => {
    machineService.getTrends({ metric: 'healthScore', limit: 40 }).then(r => setTrendData(r.data)).catch(() => {});
  }, []);
  if (!trendData) return <div className="loading-container" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>;

  const makeDataset = (type, color, bg) => ({
    label: `Type ${type}`,
    data: (trendData[type] || []).map(p => p.y),
    borderColor: color, backgroundColor: bg,
    fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2,
  });
  const maxLen = Math.max(...Object.values(trendData).map(d => d.length));
  const labels = Array.from({ length: maxLen }, (_, i) => `#${maxLen - i}`).reverse();
  const data = {
    labels,
    datasets: [
      makeDataset('H', '#27AE60', 'rgba(39,174,96,0.08)'),
      makeDataset('M', '#4A90A4', 'rgba(74,144,164,0.08)'),
      makeDataset('L', '#F39C12', 'rgba(243,156,18,0.08)'),
    ],
  };
  return (
    <div style={{ height: 200 }}>
      <Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: legendStyle, tooltip: tooltipStyle }, scales: { x: axisStyle, y: { ...axisStyle, min: 0, max: 100 } } }} />
    </div>
  );
};

export const ParameterChart = ({ machine }) => {
  if (!machine) return null;
  const data = {
    labels: ['Air Temp', 'Proc Temp', 'Speed÷10', 'Torque', 'Tool Wear'],
    datasets: [{
      label: 'Value',
      data: [machine.airTemperature, machine.processTemperature, machine.rotationalSpeed / 10, machine.torque, machine.toolWear],
      backgroundColor: 'rgba(74,144,164,0.15)',
      borderColor: '#4A90A4', borderWidth: 2, borderRadius: 6,
    }],
  };
  return (
    <div style={{ height: 210 }}>
      <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipStyle }, scales: { x: axisStyle, y: axisStyle } }} />
    </div>
  );
};