import React, { useState } from 'react';
import Chatbot from './components/Chatbot';
import ErrorBoundary from './components/ErrorBoundary';
import { Shield, MapPin, Radio, Sparkles } from 'lucide-react';

/**
 * STANDALONE CHATBOT UI MODULE ENTRY POINT
 * This App component hosts Chatbot.jsx in isolation for easy integration or preview.
 */
function App() {
  const [selectedDivision, setSelectedDivision] = useState('Bengaluru Division');

  const handleAddDocument = (doc) => {
    console.log("Document added to workspace:", doc);
  };

  return (
    <ErrorBoundary>
      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#090d16',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#f8fafc'
      }}>
        {/* STANDALONE CHATBOT UI TOP BAR */}
        <header style={{
          height: '52px',
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(37, 99, 235, 0.5)',
              border: '1px solid rgba(147, 197, 253, 0.4)'
            }}>
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #ffffff 0%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SENTINEL AI CHATBOT — STANDALONE UI MODULE
              </h1>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: '-2px' }}>
                React UI Component Module (`Chatbot.jsx`)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <MapPin size={13} color="#60a5fa" />
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Division:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#60a5fa',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Bengaluru Division" style={{ background: '#0f172a', color: '#f8fafc' }}>Bengaluru Division</option>
                <option value="Mysuru Division" style={{ background: '#0f172a', color: '#f8fafc' }}>Mysuru Division</option>
                <option value="Belagavi Division" style={{ background: '#0f172a', color: '#f8fafc' }}>Belagavi Division</option>
                <option value="Kalaburagi Division" style={{ background: '#0f172a', color: '#f8fafc' }}>Kalaburagi Division</option>
                <option value="State HQ Command" style={{ background: '#0f172a', color: '#f8fafc' }}>State HQ Command</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '0.7rem',
              color: '#34d399',
              fontWeight: 700
            }}>
              <Radio size={12} color="#34d399" />
              <span>UI MODULE READY</span>
            </div>
          </div>
        </header>

        {/* CHATBOT UI COMPONENT CONTAINER */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Chatbot onAddDocument={handleAddDocument} divisionName={selectedDivision} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
