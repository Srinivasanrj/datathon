/**
 * Karnataka State Police - Sentinel AI Command Platform
 * App Main Component & Division Console Router
 */

import React, { useState } from 'react';
import { MessageSquare, ShieldAlert, X, BarChart2, Share2, LogOut, Shield, UserCheck, ShieldCheck } from 'lucide-react';
import MainMap from './components/MainMap';
import Insights from './components/Insights';
import Vault from './components/Vault';
import PanicSOS from './components/PanicSOS';
import SocialFeed from './components/SocialFeed';
import Login from './components/Login';
import FullScreenChatbotModal from './components/FullScreenChatbotModal';

// Division Head Console Components
import BengaluruHeadDashboard from './components/BengaluruHeadDashboard';
import MysuruHeadDashboard from './components/MysuruHeadDashboard';
import BelagaviHeadDashboard from './components/BelagaviHeadDashboard';
import KalaburagiHeadDashboard from './components/KalaburagiHeadDashboard';

import KSPLoadingScreen from './components/KSPLoadingScreen';

function App() {
  // App Initial Loading Screen State
  const [isLoading, setIsLoading] = useState(true);

  // Authentication & Officer User State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Application UI State
  const [panicActive, setPanicActive] = useState(false);
  const [leftTab, setLeftTab] = useState('insights');
  const [showChatbot, setShowChatbot] = useState(false);
  const [vaultDocuments, setVaultDocuments] = useState([
    {
      id: 'default-handbook',
      name: 'Citizen_Safety_Handbook.pdf',
      type: 'default',
      size: '2.4 MB',
      date: 'Resource Guide'
    }
  ]);

  const handleAddDocument = (newDocument) => {
    setVaultDocuments((previousDocuments) => [newDocument, ...previousDocuments]);
  };

  const handleLoginSuccess = (userAuthData) => {
    setCurrentUser(userAuthData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // 1. App Bootup Animated GSAP Loading Screen
  if (isLoading) {
    return <KSPLoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // 2. Unauthenticated -> Show Multi-Division Login Portal
  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // 2. Division Head & Police Station Unit Routing
  const username = currentUser?.username || '';
  const divId = currentUser?.division?.id || '';

  const isBengaluruUser = username === 'ksp.bengaluru.head' || username.startsWith('ksp.bengaluru') || username.startsWith('ksp.chikkaballapura') || username.startsWith('ksp.chitradurga') || username.startsWith('ksp.davanagere') || username.startsWith('ksp.kolar') || username.startsWith('ksp.kgf') || username.startsWith('ksp.ramanagara') || username.startsWith('ksp.tumakuru') || divId === 'bengaluru';
  const isMysuruUser = username === 'ksp.mysuru.head' || username.startsWith('ksp.mysuru') || username.startsWith('ksp.chamarajanagara') || username.startsWith('ksp.chikkamagaluru') || username.startsWith('ksp.dakshina.kannada') || username.startsWith('ksp.hassan') || username.startsWith('ksp.kodagu') || username.startsWith('ksp.mandya') || username.startsWith('ksp.udupi') || divId === 'mysuru';
  const isBelagaviUser = username === 'ksp.belagavi.head' || username.startsWith('ksp.belagavi') || username.startsWith('ksp.bagalkote') || username.startsWith('ksp.dharwad') || username.startsWith('ksp.gadag') || username.startsWith('ksp.haveri') || username.startsWith('ksp.uttara.kannada') || username.startsWith('ksp.vijayapura') || divId === 'belagavi';
  const isKalaburagiUser = username === 'ksp.kalaburagi.head' || username.startsWith('ksp.kalaburagi') || username.startsWith('ksp.ballari') || username.startsWith('ksp.bidar') || username.startsWith('ksp.koppal') || username.startsWith('ksp.raichur') || username.startsWith('ksp.vijayanagara') || username.startsWith('ksp.yadgir') || divId === 'kalaburagi';

  if (isBengaluruUser) {
    return <BengaluruHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (isMysuruUser) {
    return <MysuruHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (isBelagaviUser) {
    return <BelagaviHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (isKalaburagiUser) {
    return <KalaburagiHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // 3. State Control Room (HQ Command Console UI)
  return (
    <div className="app-window" style={{ background: '#f8fafc' }}>
      {/* Top Header Bar matching user screenshot */}
      <header className="main-header" style={{ borderBottom: '2px solid #2563eb', background: 'rgba(255,255,255,0.95)' }}>
        <div className="header-logo">
          <img src="/ksp_police_logo.png" alt="KSP Crest" className="logo-image" />
          <div className="header-title">
            <h1 style={{ background: 'linear-gradient(to right, #1d4ed8, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              KARNATAKA STATE POLICE
            </h1>
            <p style={{ color: '#2563eb', fontWeight: 700, margin: 0, fontSize: '0.7rem' }}>
              SENTINEL COMMAND CENTRE AI • SECURE WEB CONSOLE
            </p>
          </div>
        </div>

        <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* User Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(29,78,216,0.12))',
            border: '1px solid #bfdbfe'
          }}>
            <ShieldCheck size={16} style={{ color: '#2563eb' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1.1 }}>
                {currentUser?.unitName || 'State Control Room (HQ)'}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#2563eb', fontWeight: 700 }}>
                Officer: {currentUser?.username || 'State Police Director (SCRB)'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '0.68rem', background: '#2563eb', color: 'white',
                border: 'none', padding: '4px 10px', borderRadius: '6px',
                fontWeight: 700, cursor: 'pointer', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <LogOut size={12} /> Log Out
            </button>
          </div>

          {/* Status Indicator */}
          <div className="status-container" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <div className="status-dot" style={{ background: '#059669' }}></div>
            <span style={{ color: '#047857', fontWeight: 700 }}>System Secure & Active</span>
          </div>

          {/* Panic SOS Button */}
          <button 
            className="sos-toggle-btn"
            onClick={() => setPanicActive(true)}
            style={{
              background: '#dc2626', color: 'white', border: 'none',
              padding: '6px 14px', borderRadius: '100px', fontWeight: 800,
              fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
            }}
          >
            <ShieldAlert size={15} /> Panic Mode
          </button>
        </div>
      </header>

      {/* Panic Emergency Overlay */}
      {panicActive && (
        <PanicSOS onClose={() => setPanicActive(false)} />
      )}

      {/* 3-Column Desktop Grid Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Analytics & Social Feed */}
        <div className="dashboard-panel">
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', margin: '12px 12px 0 12px' }}>
            <button
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', background: leftTab === 'insights' ? 'white' : 'transparent', color: leftTab === 'insights' ? '#2563eb' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: leftTab === 'insights' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              onClick={() => setLeftTab('insights')}
            >
              <BarChart2 size={15} /> Crime Analytics
            </button>
            <button
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', background: leftTab === 'social' ? 'white' : 'transparent', color: leftTab === 'social' ? '#2563eb' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: leftTab === 'social' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              onClick={() => setLeftTab('social')}
            >
              <Share2 size={15} /> Social MCP Feed
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {leftTab === 'insights' ? <Insights /> : <SocialFeed />}
          </div>
        </div>

        {/* Center Column: Interactive Map Interface */}
        <div className="view-map-container" style={{ position: 'relative' }}>
          <MainMap />
        </div>

        {/* Right Column: Encrypted RAG Document Vault */}
        <div className="dashboard-panel">
          <Vault documents={vaultDocuments} onAddDocument={handleAddDocument} />
        </div>
      </div>



      {/* Floating KSP DRISHTI Assistant Trigger */}
      <button
        className="floating-chatbot-trigger"
        onClick={() => setShowChatbot(!showChatbot)}
        title={showChatbot ? "Close KSP DRISHTI" : "Open KSP DRISHTI AI Assistant"}
        aria-label="KSP DRISHTI Assistant"
      >
        {showChatbot ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {/* Full-Screen KSP DRISHTI Modal */}
      {showChatbot && (
        <FullScreenChatbotModal
          initialDivision="State HQ Command"
          onClose={() => setShowChatbot(false)}
          onAddDocument={handleAddDocument}
        />
      )}
    </div>
  );
}

export default App;
