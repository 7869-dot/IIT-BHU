import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrismaticBurst from './PrismaticBurst';
import './index.css';

// SVG Icons
const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
    <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(45 12 12)" stroke="white" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(-45 12 12)" stroke="white" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="white" />
  </svg>
);

const HashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', opacity: 0.8 }}>
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="bg-container">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={0.1}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={0}
          mixBlendMode="lighten"
          colors={['#c88439', '#26415e', '#e8c872', '#ffffff', '#472d42']}
        />
      </div>

      <div className="ui-layer">
        <nav className="floating-navbar">
          <div className="brand">
            <LogoIcon />
            <span>Omnyx</span>
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#docs">Docs</a>
          </div>
        </nav>

        <main className="hero-content">
          <div className="badge">
            <HashIcon />
            Missing Persons Identification & Human Trafficking Preventor
          </div>
          <h1 className="hero-title">
            See Everything,<br />
            Find Everyone.
          </h1>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/galaxy')}>Get Started</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </main>
      </div>
    </>
  );
}

export default HomePage;
