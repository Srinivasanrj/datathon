import React, { useState } from 'react';
import Chatbot from './Chatbot';
import ErrorBoundary from './ErrorBoundary';
import { Shield, MapPin, Radio, X } from 'lucide-react';

/**
 * FULL SCREEN SENTINEL AI CHATBOT MODAL
 * Matches the standalone full-screen console layout with division switching and 100vw/100vh immersive canvas.
 */
function FullScreenChatbotModal({ initialDivision = "Bengaluru Division", onClose, onAddDocument }) {
  const [selectedDivision, setSelectedDivision] = useState(initialDivision || "Bengaluru Division");

  const handleAddDoc = (doc) => {
    if (onAddDocument) onAddDocument(doc);
  };

  return (
    <ErrorBoundary>
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#0f172a',
        overflow: 'hidden'
      }}>
        {/* STANDALONE CHATBOT UI TOP BAR (High-Contrast Midnight Blue Gradient Theme) */}
        <header style={{
          height: '52px',
          minHeight: '52px',
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
            {/* Division Selector */}
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

            {/* Close / Return to Dashboard Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '10px',
                  padding: '5px 14px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Return to Main Dashboard"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                  e.currentTarget.style.color = '#fca5a5';
                }}
              >
                <X size={14} />
                <span>Return to Console</span>
              </button>
            )}
          </div>
        </header>

        {/* CHATBOT UI COMPONENT CONTAINER (FULL HEIGHT) */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <Chatbot onAddDocument={handleAddDoc} divisionName={selectedDivision} onClose={onClose} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default FullScreenChatbotModal;
