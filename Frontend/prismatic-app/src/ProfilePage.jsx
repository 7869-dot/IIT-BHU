import React from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from './Galaxy';
import Dock from './Dock';
import TopNavbar from './TopNavbar';
import { VscHome, VscArchive, VscAccount, VscSettingsGear } from 'react-icons/vsc';
import './index.css';

export default function ProfilePage() {
  const navigate = useNavigate();

  const items = [
    { icon: <VscHome size={18} />, label: 'Dashboard', onClick: () => navigate('/galaxy') },
    { icon: <VscArchive size={18} />, label: 'Archive', onClick: () => navigate('/archive') },
    { icon: <VscAccount size={18} />, label: 'New Profile', onClick: () => alert('Already here!') },
    { icon: <VscSettingsGear size={18} />, label: 'Settings', onClick: () => alert('Settings!') },
  ];

  const styles = {
    container: {
      flex: 1,
      overflowY: 'auto',
      padding: '120px 24px 140px 24px',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    },
    header: { marginBottom: '40px' },
    title: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px', color: '#fff' },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' },
    card: {
      background: 'rgba(20, 20, 20, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '28px',
      marginBottom: '24px'
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
    cardNum: {
      background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.9)',
      padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'monospace'
    },
    cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' },
    row: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
    field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' },
    fieldFull: { flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    req: { color: '#f85149', marginLeft: '4px' },
    input: {
      width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s'
    },
    select: {
      width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s'
    },
    textarea: {
      width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', outline: 'none', minHeight: '100px', resize: 'vertical', transition: 'all 0.2s'
    },
    tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' },
    tag: {
      padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '4px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', fontFamily: 'monospace', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s'
    },
    uploadBox: {
      border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
    },
    uploadText: { fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' },
    uploadSub: { fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' },
    submitBtn: {
      background: '#ffffff', color: '#000000', border: 'none', padding: '14px 32px', borderRadius: '100px',
      fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '12px', width: '100%'
    }
  };

  return (
    <>
      <style>{`
        .form-container::-webkit-scrollbar { display: none; }
        .arg-input:focus, .arg-select:focus, .arg-textarea:focus { border-color: rgba(255, 255, 255, 0.4) !important; background: rgba(0, 0, 0, 0.6) !important; }
        .tag-active { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; border-color: rgba(255, 255, 255, 0.3) !important; }
        .hover-tag:hover { background: rgba(255, 255, 255, 0.1) !important; }
        .priority-btn { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); text-align: center; cursor: pointer; font-size: 0.8rem; font-family: monospace; color: rgba(255,255,255,0.6); transition: all 0.2s; }
        .priority-btn:hover { background: rgba(255,255,255,0.05); }
        .upload-box:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.4) !important; }
        select.arg-select option { background: #0a0a0a; color: white; }
      `}</style>
      <div className="bg-container">
        <Galaxy mouseRepulsion mouseInteraction density={1} glowIntensity={0.3} saturation={0} hueShift={140} twinkleIntensity={0.3} rotationSpeed={0.1} repulsionStrength={2} autoCenterRepulsion={0} starSpeed={0.5} speed={1} />
      </div>

      <div className="ui-layer">
        <TopNavbar />

        <div className="form-container" style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Register Missing Person</h1>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>01</span>
              <span style={styles.cardTitle}>Personal Identity</span>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>First Name <span style={styles.req}>*</span></label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Anjali" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Middle Name</label>
                <input className="arg-input" style={styles.input} placeholder="Optional" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Name <span style={styles.req}>*</span></label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Kumari" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Age <span style={styles.req}>*</span></label>
                <input type="number" className="arg-input" style={styles.input} placeholder="Years" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Gender <span style={styles.req}>*</span></label>
                <select className="arg-select" style={styles.select}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Blood Group</label>
                <select className="arg-select" style={styles.select}>
                  <option value="">Unknown</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </div>
            <div style={{...styles.row, marginBottom: 0}}>
              <div style={styles.field}>
                <label style={styles.label}>Aadhaar / ID Number</label>
                <input className="arg-input" style={styles.input} placeholder="XXXX-XXXX-XXXX" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nationality</label>
                <input className="arg-input" style={styles.input} defaultValue="Indian" />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>02</span>
              <span style={styles.cardTitle}>Physical Description</span>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Height (cm)</label>
                <input type="number" className="arg-input" style={styles.input} placeholder="e.g. 152" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Weight (kg)</label>
                <input type="number" className="arg-input" style={styles.input} placeholder="e.g. 45" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Complexion</label>
                <select className="arg-select" style={styles.select}>
                  <option value="">Select</option>
                  <option>Fair</option><option>Wheatish</option><option>Medium</option><option>Dark</option>
                </select>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Hair Color</label>
                <select className="arg-select" style={styles.select}>
                  <option>Black</option><option>Brown</option><option>Grey</option><option>White</option><option>Other</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Eye Color</label>
                <select className="arg-select" style={styles.select}>
                  <option>Brown</option><option>Black</option><option>Hazel</option><option>Other</option>
                </select>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Identifying Marks / Tattoos</label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Scar on left cheek, birthmark on right arm" />
              </div>
            </div>
            <div style={{...styles.row, marginBottom: 0}}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Last Seen Wearing</label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Blue school uniform, white sneakers" />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>03</span>
              <span style={styles.cardTitle}>Disappearance Details</span>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Date Last Seen <span style={styles.req}>*</span></label>
                <input type="date" className="arg-input" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Time Last Seen</label>
                <input type="time" className="arg-input" style={styles.input} />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Last Known Location <span style={styles.req}>*</span></label>
                <input className="arg-input" style={styles.input} placeholder="Street / Area / Landmark, City, State" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>District</label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Varanasi" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>State <span style={styles.req}>*</span></label>
                <select className="arg-select" style={styles.select}>
                  <option value="">Select State</option>
                  <option>Uttar Pradesh</option><option>Delhi</option><option>Maharashtra</option>
                  <option>Bihar</option><option>Madhya Pradesh</option><option>Rajasthan</option>
                  <option>West Bengal</option><option>Other</option>
                </select>
              </div>
            </div>
            <div style={{...styles.row, marginBottom: 0}}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Circumstances of Disappearance</label>
                <textarea className="arg-textarea" style={styles.textarea} placeholder="Describe the situation in which the person was last seen..."></textarea>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>04</span>
              <span style={styles.cardTitle}>Profile Photo</span>
            </div>
            <div className="upload-box" style={styles.uploadBox}>
              <div style={styles.uploadText}>Click to upload photo</div>
              <div style={styles.uploadSub}>JPG · PNG · WEBP · MAX 5MB</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>05</span>
              <span style={styles.cardTitle}>Reporter Info</span>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Reporter Name <span style={styles.req}>*</span></label>
                <input className="arg-input" style={styles.input} placeholder="Full name" />
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Relation to Missing Person</label>
                <select className="arg-select" style={styles.select}>
                  <option>Parent</option><option>Spouse</option><option>Sibling</option>
                  <option>Relative</option><option>Friend</option><option>Neighbour</option>
                  <option>Authority</option><option>Other</option>
                </select>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Contact Number <span style={styles.req}>*</span></label>
                <input className="arg-input" style={styles.input} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <div style={{...styles.row, marginBottom: 0}}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Reporting Station / NGO</label>
                <input className="arg-input" style={styles.input} placeholder="e.g. Varanasi Police Station, Bachpan NGO" />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardNum}>06</span>
              <span style={styles.cardTitle}>Additional Media</span>
            </div>
            <div className="upload-box" style={styles.uploadBox}>
              <div style={styles.uploadText}>Drag or click — CCTV clips, photos, documents</div>
              <div style={styles.uploadSub}>MULTIPLE FILES ALLOWED</div>
            </div>
          </div>

          <button style={styles.submitBtn}>REGISTER CASE →</button>
        </div>

        <Dock items={items} panelHeight={68} baseItemSize={50} magnification={70} />
      </div>
    </>
  );
}
