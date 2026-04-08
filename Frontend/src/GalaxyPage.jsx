import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from './Galaxy';
import Dock from './Dock';
import BorderGlow from './BorderGlow';
import CircularGallery from './CircularGallery';
import TopNavbar from './TopNavbar';
import { VscHome, VscArchive, VscAccount, VscGraphLine } from 'react-icons/vsc';
import { BsStars } from 'react-icons/bs';
import './index.css';

function GalaxyPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [demoContent, setDemoContent] = useState(window.innerWidth > 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const items = [
    { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => alert('Dashboard!') },
    { icon: <VscArchive size={18} />, label: 'Archive', onClick: () => navigate('/archive') },
    { icon: <VscAccount size={18} />, label: 'New Profile', onClick: () => navigate('/profile') },
    { icon: <VscGraphLine size={18} />, label: 'Analytics', onClick: () => navigate('/analytics') },
  ];

  return (
    <>
      <div className="bg-container">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>

      <div className="ui-layer">
        <TopNavbar />

        {/* Corner Toggle */}
        <div style={{ position: 'absolute', bottom: isMobile ? '88px' : '20px', right: isMobile ? '16px' : '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 500 }}>Demo Content</span>
          <div
            onClick={() => setDemoContent(!demoContent)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: demoContent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              position: 'relative', cursor: 'pointer',
              transition: 'background 0.3s'
            }}>
            <div style={{
              position: 'absolute', top: '2px', left: demoContent ? '22px' : '2px',
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              transition: 'left 0.3s'
            }} />
          </div>
        </div>

        {/* Floating Cards Array */}
        {demoContent && !isMobile && (
          <div style={{ 
            position: 'absolute', 
            top: '28%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', gap: '2rem', width: '95%', maxWidth: '1400px', padding: '0 2rem',
            justifyContent: 'center', alignItems: 'stretch'
          }}>
            {[
              {
                title: "Active Cases",
                count: "178",
                desc: "Missing reports registered in Mumbai this past month."
              },
              {
                title: "Critical - Unresolved",
                count: "17",
                desc: "High-priority cases currently under active field investigation."
              },
              {
                title: "Resolved Cases",
                count: "2,165",
                desc: "Persons successfully traced and reunited with families last year."
              },
              {
                title: "Pending Cases",
                count: "36",
                desc: "Total ongoing backlogged missing reports requiring attention."
              }
            ].map((data, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor="35 70 60"
                  backgroundColor="#060010"
                  borderRadius={24}
                  glowRadius={30}
                  glowIntensity={0.8}
                  coneSpread={25}
                  animated={false}
                  colors={['#c88439', '#26415e', '#e8c872']}
                  className="card-glow-instance"
                >
                  <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                      {data.title}
                    </h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#c88439', marginBottom: '0.75rem', lineHeight: 1 }}>
                      {data.count}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', lineHeight: 1.5, marginTop: 'auto' }}>
                      {data.desc}
                    </p>
                  </div>
                </BorderGlow>
              </div>
            ))}
          </div>
        )}

        {/* Circular Media Gallery */}
        {demoContent && !isMobile && (
          <div style={{
            position: 'absolute',
            top: '48%', 
            bottom: '80px', // leaving space for dock
            left: 0,
            right: 0,
            overflow: 'hidden',
            pointerEvents: 'auto'
          }}>
            <CircularGallery 
              bend={3} 
              textColor="#ffffff" 
              borderRadius={0.05} 
              scrollSpeed={2}
              scrollEase={0.05}
            />
          </div>
        )}

        {/* Mac-style Interactive Dock */}
        <Dock
          items={items}
          panelHeight={isMobile ? 58 : 68}
          baseItemSize={isMobile ? 40 : 50}
          magnification={isMobile ? 56 : 70}
        />
      </div>
    </>
  );
}

export default GalaxyPage;
