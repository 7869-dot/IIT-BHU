import React, { useState, useEffect } from 'react';

// SVG Icons
export const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
    <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(45 12 12)" stroke="white" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(-45 12 12)" stroke="white" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="white" />
  </svg>
);

export default function TopNavbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTimeParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(time).split(', ');

  return (
    <nav className="floating-navbar">
      <div className="brand">
        <LogoIcon />
        <span>Omnyx</span>
      </div>
      <div className="nav-links" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.02em', display: 'flex', gap: '16px' }}>
        <span>{formattedTimeParts[0]}</span>
        <span>{formattedTimeParts[1]}</span>
      </div>
    </nav>
  );
}
