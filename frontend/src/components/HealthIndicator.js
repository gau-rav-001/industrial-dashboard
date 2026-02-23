import React from 'react';

const HealthIndicator = ({ score, size = 'md' }) => {
  const getColor = (s) => {
    if (s >= 80) return '#27AE60';
    if (s >= 60) return '#F39C12';
    if (s >= 40) return '#E67E22';
    return '#E74C3C';
  };

  const color = getColor(score);
  const radius = size === 'lg' ? 52 : size === 'sm' ? 16 : 32;
  const stroke = size === 'lg' ? 6 : size === 'sm' ? 3 : 4;
  const dim = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={dim/2} cy={dim/2} r={radius} fill="none" stroke="#e0e6ed" strokeWidth={stroke} />
      <circle
        cx={dim/2} cy={dim/2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={progress}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

export const HealthBadge = ({ status }) => (
  <span className={`health-badge ${status}`}>{status}</span>
);

export default HealthIndicator;