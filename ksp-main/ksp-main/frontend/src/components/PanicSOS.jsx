import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, Power, CheckCircle, Navigation, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Icons for police cars and user
const policeIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px #3b82f6; display:flex; align-items:center; justify-content:center; color:white; font-size:9px; font-weight:800;">P</div>`,
  iconSize: [16, 16]
});

const userIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#ef4444; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #ef4444; animation: panic-pulse 1s infinite;"></div>`,
  iconSize: [14, 14]
});

function PanicSOS({ onClose }) {
  const [countdown, setCountdown] = useState(10);
  const [deactivateCode, setDeactivateCode] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [sosStatus, setSosStatus] = useState('Transmitting encrypted distress beacon...');
  
  // Patrol vehicle positions that move closer to the user over time
  const userLatLng = [12.9716, 77.5946];
  const [patrol1, setPatrol1] = useState([12.9850, 77.6100]);
  const [patrol2, setPatrol2] = useState([12.9580, 77.5750]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSosStatus('PATROL EN ROUTE - KSP Command notified.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Update status based on countdown
    if (countdown === 8) setSosStatus('Coordinates Locked: 12.9716° N, 77.5946° E');
    if (countdown === 6) setSosStatus('Dispatch Patrol units KSP-24 & KSP-10 assigned.');
    if (countdown === 4) setSosStatus('Live audio/telemetry link established.');

    return () => clearInterval(timer);
  }, [countdown]);

  // Patrol movement loop (converging on user coords)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPatrol1(prev => {
        const dLat = (userLatLng[0] - prev[0]) * 0.15;
        const dLng = (userLatLng[1] - prev[1]) * 0.15;
        return [prev[0] + dLat, prev[1] + dLng];
      });
      setPatrol2(prev => {
        const dLat = (userLatLng[0] - prev[0]) * 0.12;
        const dLng = (userLatLng[1] - prev[1]) * 0.12;
        return [prev[0] + dLat, prev[1] + dLng];
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, []);

  const handleDeactivate = (e) => {
    if (e) e.preventDefault();
    if (deactivateCode === '911' || deactivateCode === '777' || deactivateCode === 'ksp') {
      onClose();
    } else {
      alert("INVALID DEACTIVATION CODE. ACCESS DENIED.");
      setDeactivateCode('');
    }
  };

  return (
    <div 
      className="calculator-overlay" 
      style={{ 
        background: '#04060e', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: 'inset 0 0 100px rgba(239, 68, 68, 0.15)' 
      }}
    >
      {/* Alarm Siren Flasher effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: countdown % 2 === 0 ? 'var(--danger)' : 'var(--primary)',
          boxShadow: `0 0 20px ${countdown % 2 === 0 ? 'var(--danger)' : 'var(--primary)'}`,
          zIndex: 1000,
          transition: 'background 0.5s'
        }}
      ></div>

      {/* SOS Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
          <Radio className="weather-icon-anim" size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tactical Emergency Channel
          </span>
        </div>
        <div className="status-container" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
          <div className="status-dot" style={{ backgroundColor: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }}></div>
          <span>SOS BROADCAST ACTIVE</span>
        </div>
      </div>

      {/* Main Alert Card */}
      <div 
        style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '24px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)'
        }}
      >
        <ShieldAlert size={48} style={{ color: 'var(--danger)', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: 'white', marginBottom: '8px' }}>
          EMERGENCY DISPATCH TRIGGERED
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Silent distress signal transmitted to SCRB Head Station. GPS location broadcasting.
        </p>

        {countdown > 0 ? (
          <div style={{ margin: '16px 0' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patrol Unit Launch In</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--danger)' }}>
              {countdown}s
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--success)', margin: '24px 0', fontSize: '1rem', fontWeight: 700 }}>
            <CheckCircle size={20} /> PATROL EN ROUTE (ETA 3.8m)
          </div>
        )}

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
          {sosStatus}
        </div>
      </div>

      {/* Tactical Map ( converges vehicles ) */}
      <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--surface-border)', marginBottom: '20px', position: 'relative' }}>
        <MapContainer
          center={userLatLng}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#090c15' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          
          {/* User Location Pin */}
          <Marker position={userLatLng} icon={userIcon}>
            <Popup><b style={{ color: 'red' }}>User Location (Distress Signal)</b></Popup>
          </Marker>

          {/* Converging Patrol Cars */}
          <Marker position={patrol1} icon={policeIcon}>
            <Popup><b>KSP Patrol Unit 24</b><br/>En Route</Popup>
          </Marker>
          <Marker position={patrol2} icon={policeIcon}>
            <Popup><b>KSP Patrol Unit 10</b><br/>En Route</Popup>
          </Marker>
        </MapContainer>
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Navigation size={10} style={{ transform: 'rotate(45deg)' }} /> Telemetry: Patrol convergence active
        </div>
      </div>

      {/* Bottom Command Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.open('tel:112')}
          style={{
            flex: 1,
            background: '#1e293b',
            border: '1px solid #334155',
            color: 'white',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Phone size={14} /> Call Control Room (112)
        </button>
        <button
          onClick={() => setShowDeactivateModal(true)}
          style={{
            flex: 1,
            background: 'var(--danger)',
            border: 'none',
            color: 'white',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px var(--danger-glow)'
          }}
        >
          <Power size={14} /> Deactivate Alert
        </button>
      </div>

      {/* Deactivation Passcode Modal */}
      {showDeactivateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            style={{
              background: '#0d111e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <ShieldAlert size={36} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '8px', fontFamily: 'Outfit' }}>
              Deactivate SOS Channel
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter security bypass passcode to cancel distress broadcast.
            </p>
            
            <form onSubmit={handleDeactivate}>
              <input
                type="password"
                placeholder="Enter Passcode..."
                value={deactivateCode}
                onChange={(e) => setDeactivateCode(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  outline: 'none',
                  letterSpacing: '4px',
                  marginBottom: '16px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowDeactivateModal(false); setDeactivateCode(''); }}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanicSOS;
