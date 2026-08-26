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
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#0f172a'
      }}>
        {/* STANDALONE CHATBOT UI TOP BAR (Modern Minimalist Slate) */}
        <header style={{
          height: '52px',
          background: 'linear-gradient(90deg, #02060E 0%, #03214C 45%, #0356C5 100%)',
          borderBottom: '1.5px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxShadow: '0 4px 20px rgba(2, 6, 14, 0.45)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#02060E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)',
              overflow: 'hidden'
            }}>
              <img src="/ksp_emblem.png" alt="Karnataka State Police Official Emblem" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#ffffff',
                lineHeight: 1.2
              }}>
                <b>KSP DRISHTI</b>
              </h1>
              <div style={{ fontSize: '0.66rem', color: '#93c5fd', fontWeight: 600, marginTop: '1px' }}>
                Unified Karnataka State Police AI Assistant
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(2, 6, 14, 0.55)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              padding: '5px 12px',
              fontSize: '0.75rem',
              color: '#93c5fd',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
            }}>
              <MapPin size={13} color="#38bdf8" />
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Division:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Bengaluru Division" style={{ background: '#03214C', color: '#ffffff' }}>Bengaluru Division</option>
                <option value="Mysuru Division" style={{ background: '#03214C', color: '#ffffff' }}>Mysuru Division</option>
                <option value="Belagavi Division" style={{ background: '#03214C', color: '#ffffff' }}>Belagavi Division</option>
                <option value="Kalaburagi Division" style={{ background: '#03214C', color: '#ffffff' }}>Kalaburagi Division</option>
                <option value="State HQ Command" style={{ background: '#03214C', color: '#ffffff' }}>State HQ Command</option>
              </select>
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
