import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from './Galaxy';
import Dock from './Dock';
import TopNavbar from './TopNavbar';
import { VscHome, VscArchive, VscAccount, VscGraphLine, VscSearch } from 'react-icons/vsc';
import { apiService } from './services/api';
import './index.css';

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';
const toStorageUrl = (path) => {
  if (!path) return '';
  const normalized = path.replace(/\\/g, '/').replace(/^storage\//, '');
  return `${STORAGE_URL}/${normalized}`;
};

// Mock Data
const CASES = [
  {id:'MP-2026-0248',name:'Anjali Kumari',initials:'AK',age:14,gender:'Female',location:'Hazratganj, Lucknow',state:'Uttar Pradesh',date:'2026-04-03',status:'CRITICAL',match:84,officer:'SI Sharma',flags:['MINOR','TRAFFICKING RISK']},
  {id:'MP-2026-0247',name:'Mohit Kumar',initials:'MK',age:8,gender:'Male',location:'Kanpur Bus Stand, Kanpur',state:'Uttar Pradesh',date:'2026-04-03',status:'CRITICAL',match:61,officer:'SI Sharma',flags:['MINOR']},
  {id:'MP-2026-0246',name:'Priya Sharma',initials:'PS',age:22,gender:'Female',location:'Connaught Place, Delhi',state:'Delhi',date:'2026-04-04',status:'CRITICAL',match:0,officer:'Unassigned',flags:[]},
  {id:'MP-2026-0245',name:'Ravi Mishra',initials:'RM',age:67,gender:'Male',location:'Railway Station, Lucknow',state:'Uttar Pradesh',date:'2026-03-29',status:'ACTIVE',match:42,officer:'CI Verma',flags:['ELDERLY']},
  {id:'MP-2026-0244',name:'Sunita Devi',initials:'SD',age:45,gender:'Female',location:'Civil Lines, Allahabad',state:'Uttar Pradesh',date:'2026-03-26',status:'WATCH',match:12,officer:'SI Tiwari',flags:[]},
  {id:'MP-2026-0243',name:'Arjun Singh',initials:'AS',age:16,gender:'Male',location:'Bhopal Central, MP',state:'Madhya Pradesh',date:'2026-04-01',status:'ACTIVE',match:73,officer:'SI Patel',flags:['MINOR']},
  {id:'MP-2026-0242',name:'Meena Rawat',initials:'MR',age:55,gender:'Female',location:'Sector 14, Gurgaon',state:'Delhi',date:'2026-03-30',status:'ACTIVE',match:38,officer:'CI Kapoor',flags:['MENTAL ILLNESS']},
  {id:'MP-2026-0241',name:'Deepa Rani',initials:'DR',age:32,gender:'Female',location:'Agra Fort Area, Agra',state:'Uttar Pradesh',date:'2026-03-22',status:'RESOLVED',match:96,officer:'SI Sharma',flags:[]},
  {id:'MP-2026-0240',name:'Ramesh Yadav',initials:'RY',age:28,gender:'Male',location:'Andheri West, Mumbai',state:'Maharashtra',date:'2026-03-28',status:'WATCH',match:21,officer:'PI Naik',flags:[]},
  {id:'MP-2026-0239',name:'Kavita Joshi',initials:'KJ',age:11,gender:'Female',location:'Patna Junction, Patna',state:'Bihar',date:'2026-04-02',status:'CRITICAL',match:55,officer:'SI Roy',flags:['MINOR','TRAFFICKING RISK']},
  {id:'MP-2026-0238',name:'Suresh Gupta',initials:'SG',age:70,gender:'Male',location:'Varanasi Ghat, Varanasi',state:'Uttar Pradesh',date:'2026-03-25',status:'RESOLVED',match:89,officer:'CI Verma',flags:['ELDERLY']},
  {id:'MP-2026-0237',name:'Pooja Verma',initials:'PV',age:19,gender:'Female',location:'Jaipur Old City, Jaipur',state:'Rajasthan',date:'2026-03-31',status:'ACTIVE',match:47,officer:'SI Meena',flags:[]},
];

export default function ArchivePage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [cases, setCases] = useState([]);
  const [dbStats, setDbStats] = useState({ all: 0, crit: 0, act: 0, watch: 0, res: 0 });
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sightings, stats] = await Promise.all([
        apiService.getAllSightings(),
        apiService.getDashboardStats()
      ]);

      setDbStats({
        all: stats.total_sightings,
        crit: stats.total_alerts,
        act: stats.total_sightings - stats.total_alerts,
        watch: 0,
        res: 0
      });

      // Map backend sightings to frontend format
      const mapped = sightings.map(s => ({
        id: `SG-${s.id.toString().padStart(4, '0')}`,
        name: stats.victim_name || 'Registered Victim',
        initials: (stats.victim_name || 'RV').split(' ').map(n => n[0]).join(''),
        age: 'N/A',
        gender: 'N/A',
        location: s.location,
        state: 'N/A', 
        date: s.timestamp.split('T')[0],
        status: s.is_alert ? 'CRITICAL' : 'ACTIVE',
        match: Math.round(s.confidence),
        officer: 'AI Engine',
        flags: s.is_alert ? ['AI MATCH'] : [],
        sighting_image: s.sighting_image,
        annotated_image: s.annotated_image
      }));

      setCases(mapped);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const items = [
    { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => navigate('/galaxy') },
    { icon: <VscArchive size={18} />, label: 'Archive', onClick: () => alert('Already here!') },
    { icon: <VscAccount size={18} />, label: 'New Profile', onClick: () => navigate('/profile') },
    { icon: <VscGraphLine size={18} />, label: 'Analytics', onClick: () => navigate('/analytics') },
  ];

  // Derived state
  const filteredData = useMemo(() => {
    let q = searchQuery.toLowerCase();
    let data = cases.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
      const matchStatus = currentFilter === 'all' || c.status === currentFilter;
      return matchQ && matchStatus;
    });

    data.sort((a, b) => {
      if (sortOption === 'date-asc') return a.date.localeCompare(b.date);
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'conf-desc') return b.match - a.match;
      return b.date.localeCompare(a.date);
    });
    return data;
  }, [searchQuery, currentFilter, cases, sortOption]);

  const stats = dbStats;

  const totalPages = Math.ceil(filteredData.length / PER_PAGE);
  const startIdx = (currentPage - 1) * PER_PAGE;
  const currentData = filteredData.slice(startIdx, startIdx + PER_PAGE);

  // Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(new Set(filteredData.map(c => c.id)));
    else setSelectedRows(new Set());
  };
  const handleSelectRow = (id) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };
  const handleClearSelection = () => setSelectedRows(new Set());

  // Render Helpers
  const statusColors = { CRITICAL: '#f85149', ACTIVE: '#58a6ff', WATCH: '#d29922', RESOLVED: '#3fb950' };

  const styles = {
    container: {
      flex: 1, overflowY: 'auto', padding: isMobile ? '96px 12px 110px 12px' : '120px 24px 140px 24px',
      width: '100%', maxWidth: '1100px', margin: '0 auto', 
      scrollbarWidth: 'none', msOverflowStyle: 'none'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : 0, marginBottom: '30px' },
    title: { fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '8px', fontFamily: 'monospace' },
    actionBtnPrimary: {
      background: '#ffffff', color: '#000000', border: 'none', padding: '10px 24px', borderRadius: '100px',
      fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginLeft: '12px'
    },
    actionBtnGhost: {
      background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 24px', borderRadius: '100px',
      fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
    },
    statsRow: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' },
    miniStat: (active, color) => ({
      background: active ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.4)', 
      border: `1px solid ${active ? color : 'rgba(255, 255, 255, 0.08)'}`,
      borderRadius: '8px', padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s',
      borderTop: `2px solid ${color}`
    }),
    toolbar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    inputContainer: { position: 'relative', flex: '1', minWidth: '200px' },
    input: {
      width: '100%', padding: '12px 16px', paddingLeft: '44px', background: 'rgba(0, 0, 0, 0.4)', 
      border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', 
      fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s'
    },
    select: {
      padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none', cursor: 'pointer'
    },
    tableWrap: { background: 'rgba(20, 20, 20, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 },
    td: { padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', verticalAlign: 'middle', fontSize: '0.9rem' },
    bulkBar: { background: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.2)', borderRadius: '8px', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    pill: (status) => ({
      display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em',
      background: `rgba(${statusColors[status].replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',')}, 0.1)`,
      color: statusColors[status], border: `1px solid rgba(${statusColors[status].replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',')}, 0.3)`
    })
  };

  return (
    <>
      <style>{`
        .archive-container::-webkit-scrollbar { display: none; }
        .archive-input:focus, .archive-select:focus { border-color: rgba(255, 255, 255, 0.4) !important; background: rgba(0, 0, 0, 0.6) !important; }
        .archive-select option { background: #0a0a0a; color: white; }
        .hover-row:hover { background: rgba(255, 255, 255, 0.03); cursor: pointer; }
        .hover-row.selected { background: rgba(88, 166, 255, 0.05); }
        .mini-stat:hover { background: rgba(255, 255, 255, 0.05) !important; border-color: rgba(255, 255, 255, 0.2) !important; }
        .btn-hover:hover { opacity: 0.8; }
        .page-btn { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .page-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .page-btn.active { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); color: #fff; }
        .row-check { width: 16px; height: 16px; accent-color: #58a6ff; cursor: pointer; }
        @media (max-width: 768px) {
          .archive-container h1 { line-height: 1.1; }
          .archive-container table { min-width: 760px; }
        }
      `}</style>

      <div className="bg-container">
        <Galaxy mouseRepulsion density={1} glowIntensity={0.3} saturation={0} hueShift={140} />
      </div>

      <div className="ui-layer">
        <TopNavbar />

        <div className="archive-container" style={styles.container}>
          
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>SIGHTING LOG</h1>
              <div style={styles.subtitle}>// {cases.length} TOTAL RECORDS · {loading ? 'FETCHING...' : 'SYNCHRONIZED'}</div>
            </div>
            <div>
              <button style={styles.actionBtnGhost} className="btn-hover">⬇ EXPORT</button>
              <button style={styles.actionBtnPrimary} className="btn-hover" onClick={() => navigate('/profile')}>+ NEW CASE</button>
            </div>
          </div>

          <div style={styles.statsRow}>
            <div className="mini-stat" style={styles.miniStat(currentFilter === 'all', '#fff')} onClick={() => { setCurrentFilter('all'); setCurrentPage(1); }}>
              <div style={styles.miniStatVal}>{stats.all}</div>
              <div style={styles.miniStatLabel}>All Cases</div>
            </div>
            <div className="mini-stat" style={styles.miniStat(currentFilter === 'CRITICAL', statusColors.CRITICAL)} onClick={() => { setCurrentFilter('CRITICAL'); setCurrentPage(1); }}>
              <div style={styles.miniStatVal}>{stats.crit}</div>
              <div style={styles.miniStatLabel}>Critical</div>
            </div>
            <div className="mini-stat" style={styles.miniStat(currentFilter === 'ACTIVE', statusColors.ACTIVE)} onClick={() => { setCurrentFilter('ACTIVE'); setCurrentPage(1); }}>
              <div style={styles.miniStatVal}>{stats.act}</div>
              <div style={styles.miniStatLabel}>Active</div>
            </div>
            <div className="mini-stat" style={styles.miniStat(currentFilter === 'WATCH', statusColors.WATCH)} onClick={() => { setCurrentFilter('WATCH'); setCurrentPage(1); }}>
              <div style={styles.miniStatVal}>{stats.watch}</div>
              <div style={styles.miniStatLabel}>Watch</div>
            </div>
            <div className="mini-stat" style={styles.miniStat(currentFilter === 'RESOLVED', statusColors.RESOLVED)} onClick={() => { setCurrentFilter('RESOLVED'); setCurrentPage(1); }}>
              <div style={styles.miniStatVal}>{stats.res}</div>
              <div style={styles.miniStatLabel}>Resolved</div>
            </div>
          </div>

          {selectedRows.size > 0 && (
            <div style={styles.bulkBar}>
              <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '0.85rem' }}>{selectedRows.size} SELECTED</span>
              <button style={{...styles.actionBtnGhost, padding: '6px 14px', fontSize: '0.75rem', marginRight: 0}}>ASSIGN OFFICER</button>
              <button style={{...styles.actionBtnGhost, padding: '6px 14px', fontSize: '0.75rem', marginRight: 0}}>CHANGE STATUS</button>
              <button style={{...styles.actionBtnGhost, padding: '6px 14px', fontSize: '0.75rem', marginRight: 0, borderColor: 'rgba(248,81,73,0.3)', color: '#f85149'}}>ARCHIVE</button>
              <div style={{flex: 1}}></div>
              <button style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '0.8rem' }} onClick={handleClearSelection}>✕ CLEAR</button>
            </div>
          )}

          <div style={styles.toolbar}>
            <div style={styles.inputContainer}>
              <VscSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
              <input 
                className="archive-input" style={styles.input} placeholder="Search name, case ID, location..." 
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            <select className="archive-select" style={styles.select} value={stateFilter} onChange={e => { setStateFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">ALL STATES</option>
              <option>Uttar Pradesh</option>
              <option>Delhi</option>
              <option>Maharashtra</option>
              <option>Bihar</option>
              <option>Madhya Pradesh</option>
              <option>Rajasthan</option>
            </select>
            <select className="archive-select" style={styles.select} value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">ALL GENDERS</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <select className="archive-select" style={styles.select} value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="date-desc">NEWEST FIRST</option>
              <option value="date-asc">OLDEST FIRST</option>
              <option value="name-asc">NAME A→Z</option>
              <option value="conf-desc">HIGHEST MATCH</option>
            </select>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{...styles.th, paddingLeft: '24px'}}>Person</th>
                  <th style={styles.th}>Demographics</th>
                  <th style={styles.th}>Last Location</th>
                  <th style={styles.th}>Reported</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>AI Match</th>
                  <th style={{...styles.th, paddingRight: '24px', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      // NO RECORDS FOUND
                    </td>
                  </tr>
                ) : currentData.map(c => (
                  <tr key={c.id} className={`hover-row ${selectedRows.has(c.id) ? 'selected' : ''}`} onClick={() => handleSelectRow(c.id)}>
                    <td style={{...styles.td, paddingLeft: '24px'}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden' }}>
                          {c.annotated_image ? (
                            <img src={toStorageUrl(c.annotated_image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : c.initials}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: '2px' }}>{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{...styles.td, color: 'rgba(255,255,255,0.6)'}}>{c.age} &middot; {c.gender}</td>
                    <td style={{...styles.td, color: 'rgba(255,255,255,0.6)'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <span style={{...styles.statusDot, background: statusColors[c.status]}}></span>
                        <div style={{maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.location}</div>
                      </div>
                    </td>
                    <td style={{...styles.td, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: '0.8rem'}}>{c.date}</td>
                    <td style={styles.td}>
                      <span style={styles.pill(c.status)}>{c.status}</span>
                    </td>
                    <td style={styles.td}>
                      {c.match > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${c.match}%`, background: c.match >= 80 ? statusColors.RESOLVED : c.match >= 50 ? statusColors.WATCH : statusColors.CRITICAL }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: c.match >= 80 ? statusColors.RESOLVED : c.match >= 50 ? statusColors.WATCH : statusColors.CRITICAL }}>{c.match}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>PENDING</span>
                      )}
                    </td>
                    <td style={{...styles.td, paddingRight: '24px', textAlign: 'right'}} onClick={e => e.stopPropagation()}>
                      <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }} className="btn-hover">VIEW</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={styles.pagination}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                Showing {filteredData.length === 0 ? 0 : startIdx + 1}&ndash;{Math.min(startIdx + PER_PAGE, filteredData.length)} of {filteredData.length} records
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>&lsaquo;</button>
                {Array.from({length: totalPages}, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>&rsaquo;</button>
              </div>
            </div>
          </div>

        </div>

        <Dock items={items} panelHeight={isMobile ? 58 : 68} baseItemSize={isMobile ? 40 : 50} magnification={isMobile ? 56 : 70} />
      </div>
    </>
  );
}
