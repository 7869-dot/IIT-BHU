import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from './Galaxy';
import Dock from './Dock';
import TopNavbar from './TopNavbar';
import { VscHome, VscArchive, VscAccount, VscGraphLine } from 'react-icons/vsc';
import { apiService } from './services/api';
import './index.css';

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';
const WS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws');
const toStorageUrl = (path) => {
  if (!path) return '';
  const normalized = path.replace(/\\/g, '/').replace(/^storage\//, '');
  return `${STORAGE_URL}/${normalized}`;
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);

  const fetchLogs = async () => {
    try {
      const rows = await apiService.getSightingLogs();
      const sorted = [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(sorted);
      setBackendOffline(false);
    } catch (err) {
      setBackendOffline(true);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const poll = setInterval(fetchLogs, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/ws/sightings`);
    } catch {
      return () => {};
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'new_sighting_log' && msg.data) {
          setLogs(prev => [msg.data, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          setBackendOffline(false);
        }
      } catch {
        // Ignore malformed payloads from legacy servers.
      }
    };
    ws.onerror = () => {};
    return () => ws.close();
  }, []);

  const items = [
    { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => navigate('/galaxy') },
    { icon: <VscArchive size={18} />, label: 'Archive', onClick: () => navigate('/archive') },
    { icon: <VscAccount size={18} />, label: 'New Profile', onClick: () => navigate('/profile') },
    { icon: <VscGraphLine size={18} />, label: 'Analytics', onClick: () => alert('Already here!') },
  ];

  const highConfidence = useMemo(() => logs.filter(l => l.confidence >= 60).length, [logs]);

  const styles = {
    container: { flex: 1, overflowY: 'auto', padding: isMobile ? '96px 12px 110px' : '120px 24px 140px', width: '100%', maxWidth: '1100px', margin: '0 auto' },
    title: { fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 700, color: '#fff' },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '8px', fontFamily: 'monospace' },
    statRow: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', margin: '24px 0' },
    stat: { background: 'rgba(20,20,20,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' },
    tableWrap: { background: 'rgba(20,20,20,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
    td: { padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' },
    actionLink: { color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }
  };

  return (
    <>
      <div className="bg-container">
        <Galaxy mouseRepulsion density={1} glowIntensity={0.3} saturation={0} hueShift={140} />
      </div>

      <div className="ui-layer">
        <TopNavbar />
        <div style={styles.container}>
          <h1 style={styles.title}>AI Analytics</h1>
          <div style={styles.subtitle}>// LIVE CCTV LOGS DASHBOARD</div>

          <div style={styles.statRow}>
            <div style={styles.stat}><div>Total Logs</div><h2>{logs.length}</h2></div>
            <div style={styles.stat}><div>High Confidence (&gt;=60%)</div><h2>{highConfidence}</h2></div>
            <div style={styles.stat}><div>Status</div><h2>{loading ? 'SYNCING' : 'LIVE'}</h2></div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Location / Camera ID</th>
                  <th style={styles.th}>Confidence</th>
                  <th style={styles.th}>Status / Action Link</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td style={styles.td} colSpan={4}>{loading ? 'Loading logs...' : backendOffline ? 'Backend is offline. Start API server on localhost:8000.' : 'No logs yet.'}</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={styles.td}>{log.location} / {log.camera_id || 'N/A'}</td>
                    <td style={styles.td}>{Math.round(log.confidence)}%</td>
                    <td style={styles.td}>
                      {log.action_link ? (
                        <a
                          href={toStorageUrl(log.action_link)}
                          style={styles.actionLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Footage
                        </a>
                      ) : 'Logged'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Dock items={items} panelHeight={isMobile ? 58 : 68} baseItemSize={isMobile ? 40 : 50} magnification={isMobile ? 56 : 70} />
      </div>
    </>
  );
}
