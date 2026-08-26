import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Shield, BarChart2, Share2, Crown, Building2, Search, MessageSquare, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import DivisionStatisticsPanel from './DivisionStatisticsPanel';
import SocialFeed from './SocialFeed';
import PanicSOS from './PanicSOS';
import FullScreenChatbotModal from './FullScreenChatbotModal';

import bengaluruGeoJSON from '../data/bengaluru_zones.json';
import mysuruGeoJSON from '../data/mysuru_zones.json';
import belagaviGeoJSON from '../data/belagavi_zones.json';
import kalaburagiGeoJSON from '../data/kalaburagi_zones.json';

const GEOJSON_MAP = {
  bengaluru: bengaluruGeoJSON,
  mysuru: mysuruGeoJSON,
  belagavi: belagaviGeoJSON,
  kalaburagi: kalaburagiGeoJSON
};

const TILE_PROVIDERS = {
  google_street: {
    name: 'Google Street',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  },
  google_satellite: {
    name: 'Google Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }
};

// Red pill pin badge matching user screenshot (e.g., 📍 KOLAR GOLD FIELDS)
const createStationPinIcon = (zoneName, color) => {
  return L.divIcon({
    className: 'ksp-station-pin-marker',
    html: `
      <div style="
        position: relative;
        background: ${color || '#dc2626'};
        color: #ffffff;
        padding: 5px 12px;
        border-radius: 8px;
        font-weight: 900;
        font-size: 11px;
        letter-spacing: 0.5px;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border: 1.5px solid #ffffff;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <span style="font-size: 11px;">📍</span>
        <span>${zoneName.toUpperCase()}</span>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${color || '#dc2626'};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

function DivisionDashboard({
  divisionName,
  overallStats,
  zonesData,
  centerCoords,
  initialZoom = 8,
  hotspots = [],
  currentUser,
  onLogout
}) {
  const divKey = divisionName.toLowerCase();
  const divisionGeoJSON = GEOJSON_MAP[divKey] || bengaluruGeoJSON;

  const isHead = currentUser?.username?.includes('.head') ||
    currentUser?.unitName?.includes('Division Head') ||
    currentUser?.role?.includes('Head') ||
    currentUser?.username === `ksp.${divKey}.head`;

  // Find user's station zone if they are a station account
  const userUnitZone = zonesData.find(z =>
    (currentUser?.username && z.username === currentUser.username) ||
    (currentUser?.unitName && z.name.toLowerCase() === (currentUser.unitName || '').toLowerCase()) ||
    (currentUser?.unitName && (currentUser.unitName || '').toLowerCase().includes(z.name.toLowerCase()))
  ) || zonesData[0];

  const [panicActive, setPanicActive] = useState(false);
  const [leftTab, setLeftTab] = useState('insights');
  const [selectedZone, setSelectedZone] = useState(() => isHead ? null : userUnitZone);
  const [mapStyle, setMapStyle] = useState('google_street');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const activeZone = selectedZone || (!isHead ? userUnitZone : null);

  useEffect(() => {
    if (!isHead && userUnitZone && mapInstance) {
      mapInstance.flyTo(userUnitZone.coords, 11);
    }
  }, [mapInstance, isHead, userUnitZone]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val) return;
    const match = zonesData.find(z => z.name.toLowerCase().includes(val.toLowerCase()) || z.sector.toLowerCase().includes(val.toLowerCase()));
    if (match && mapInstance) {
      mapInstance.flyTo(match.coords, 11);
      if (isHead || userUnitZone?.name === match.name) {
        setSelectedZone(match);
      }
    }
  };

  const resetMap = () => {
    if (mapInstance) {
      if (isHead) {
        setSelectedZone(null);
        mapInstance.flyTo(centerCoords, initialZoom);
      } else if (userUnitZone) {
        setSelectedZone(userUnitZone);
        mapInstance.flyTo(userUnitZone.coords, 11);
      }
    }
  };

  return (
    <div className="app-window" style={{ background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 1. TOP HEADER BAR */}
      <header className="main-header" style={{
        background: '#ffffff',
        borderBottom: '2px solid #e2e8f0',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        zIndex: 10,
        height: '64px'
      }}>
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/ksp_police_logo.png" alt="KSP Crest" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <div className="header-title" style={{ textAlign: 'left' }}>
            <h1 style={{ color: '#0284c7', fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '0.3px' }}>
              {activeZone ? `${activeZone.name.toUpperCase()} POLICE STATION COMMAND` : `${divisionName.toUpperCase()} DIVISION COMMAND`}
            </h1>
            <p style={{ color: '#475569', fontWeight: 700, margin: '2px 0 0 0', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>KARNATAKA STATE POLICE</span> • 
              <span>{activeZone ? activeZone.sector.toUpperCase() : `${divisionName.toUpperCase()} HEADQUARTERS`}</span> • 
              <span>{isHead ? 'IGP / ADGP EXCLUSIVE CONSOLE' : 'STATION UNIT RESTRICTED ACCESS'}</span>
            </p>
          </div>
        </div>

        <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Unit Badge (Green box) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px', borderRadius: '8px',
            background: '#dcfce7', border: '1px solid #86efac'
          }}>
            <Shield size={16} style={{ color: '#166534' }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', lineHeight: 1.1 }}>
                {activeZone ? `${activeZone.name} Station Unit` : `${divisionName} Head Unit`}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#15803d', fontWeight: 700 }}>
                {currentUser?.username || 'ksp.user'} • {isHead ? 'All Units Access' : 'Restricted Station Access'}
              </span>
            </div>
          </div>

          {/* Panic Mode */}
          <button
            onClick={() => setPanicActive(true)}
            style={{
              background: '#ef4444', color: '#ffffff', border: 'none',
              padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.74rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
            }}
          >
            <ShieldAlert size={15} /> Panic Mode
          </button>

          {/* Log Out */}
          <button
            onClick={onLogout}
            style={{
              background: '#0d9488', color: '#ffffff', border: 'none',
              padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.74rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN DASHBOARD GRID */}
      <div className="dashboard-grid" style={{ flex: 1, padding: '12px', gap: '12px', display: 'grid', gridTemplateColumns: '320px 1fr 360px', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Analytics & Subdivisions */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', margin: '10px 10px 0 10px', borderRadius: '10px' }}>
            <button
              onClick={() => setLeftTab('insights')}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem',
                background: leftTab === 'insights' ? '#ffffff' : 'transparent',
                color: leftTab === 'insights' ? '#0284c7' : '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: leftTab === 'insights' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <BarChart2 size={14} /> {activeZone ? `${activeZone.name} Station Analytics` : `${divisionName} Analytics`}
            </button>
            <button
              onClick={() => setLeftTab('social')}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem',
                background: leftTab === 'social' ? '#ffffff' : 'transparent',
                color: leftTab === 'social' ? '#0284c7' : '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: leftTab === 'social' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Share2 size={14} /> Social MCP Feed
            </button>
          </div>

          {leftTab === 'insights' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Subdivisions Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', letterSpacing: '0.5px' }}>
                  {divisionName.toUpperCase()} DIVISION SUBDIVISIONS:
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                  background: isHead ? '#fef3c7' : '#fef2f2',
                  color: isHead ? '#b45309' : '#b91c1c',
                  border: `1px solid ${isHead ? '#fde68a' : '#fca5a5'}`
                }}>
                  {isHead ? '👑 All Subdivisions Access' : `🔒 Locked to ${userUnitZone.name}`}
                </span>
              </div>

              {/* Subdivision Cards List */}
              {zonesData.map((zone, idx) => {
                const isSelected = activeZone?.name === zone.name;
                const isLocked = !isHead && userUnitZone?.name !== zone.name;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedZone(zone);
                        if (mapInstance) mapInstance.flyTo(zone.coords, 11);
                      }
                    }}
                    style={{
                      background: isSelected ? '#eff6ff' : isLocked ? '#f8fafc' : '#ffffff',
                      border: `1.5px solid ${isSelected ? '#3b82f6' : isLocked ? '#e2e8f0' : '#cbd5e1'}`,
                      borderRadius: '10px', padding: '10px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isLocked ? 0.75 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem' }}>
                        {isLocked ? '🔒' : isSelected ? '🛡️' : '📍'}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isLocked ? '#64748b' : '#0f172a' }}>
                          {zone.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                          {zone.sector} • {isLocked ? 'Restricted Data' : 'Station Unit Data'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                        background: isLocked ? '#f1f5f9' : '#dcfce7',
                        color: isLocked ? '#64748b' : '#166534',
                        border: `1px solid ${isLocked ? '#cbd5e1' : '#86efac'}`
                      }}>
                        {isLocked ? 'LOCKED ●' : 'ACTIVE ●'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <SocialFeed />
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Interactive Map with GeoJSON Boundaries & Legend Overlay */}
        <div className="view-map-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
          
          {/* Top Search Bar */}
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <Search size={16} style={{ color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={`Search ${divisionName} Division subdivisions (e.g., Urban, KGF, Tumakuru, Davanagere)...`}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', background: 'transparent', fontWeight: 600, color: '#0f172a' }}
            />
          </div>

          {/* Action Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={resetMap}
              style={{
                background: '#0284c7', color: '#ffffff', border: 'none',
                padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
              }}
            >
              <Building2 size={13} /> {divisionName} {zonesData.length} Subdivisions
            </button>
            <button
              onClick={() => setSelectedZone(null)}
              style={{
                background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1',
                padding: '6px 14px', borderRadius: '100px', fontWeight: 800, fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap'
              }}
            >
              <Crown size={13} style={{ color: '#d97706' }} /> {divisionName} Division Head View
            </button>
            <button
              onClick={() => setMapStyle('google_street')}
              style={{
                background: mapStyle === 'google_street' ? '#0f172a' : '#ffffff',
                color: mapStyle === 'google_street' ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '100px',
                fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              🗺️ Street
            </button>
            <button
              onClick={() => setMapStyle('google_satellite')}
              style={{
                background: mapStyle === 'google_satellite' ? '#0f172a' : '#ffffff',
                color: mapStyle === 'google_satellite' ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '100px',
                fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              🌐 Satellite
            </button>
          </div>

          {/* Leaflet Map with GeoJSON Layer & Pins matching user image */}
          <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
            <MapContainer
              center={centerCoords}
              zoom={initialZoom}
              zoomControl={true}
              style={{ width: '100%', height: '100%' }}
              ref={setMapInstance}
              attributionControl={false}
            >
              <TileLayer url={TILE_PROVIDERS[mapStyle]?.url || TILE_PROVIDERS.google_street.url} />

              {/* GeoJSON District Boundaries with Dashed stroke (----) matching screenshot */}
              {divisionGeoJSON && (
                <GeoJSON
                  key={`${divKey}-${activeZone?.name || 'all'}`}
                  data={divisionGeoJSON}
                  style={(feature) => {
                    const matchZone = zonesData.find(z => feature.properties.name?.toLowerCase().includes(z.name.toLowerCase()) || z.name.toLowerCase().includes(feature.properties.name?.toLowerCase()));
                    const color = matchZone?.color || feature.properties.color || '#2563eb';
                    const isSelected = activeZone && matchZone && activeZone.name.toLowerCase() === matchZone.name.toLowerCase();

                    return {
                      fillColor: color,
                      fillOpacity: isSelected ? 0.35 : 0.18,
                      color: color,
                      weight: isSelected ? 3 : 2,
                      dashArray: '5, 5'
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    const matchZone = zonesData.find(z => feature.properties.name?.toLowerCase().includes(z.name.toLowerCase()) || z.name.toLowerCase().includes(feature.properties.name?.toLowerCase()));
                    if (matchZone) {
                      layer.on({
                        click: () => {
                          if (isHead || userUnitZone?.name === matchZone.name) {
                            setSelectedZone(matchZone);
                          }
                        }
                      });
                    }
                  }}
                />
              )}

              {/* Station Pin Markers matching red pill in screenshot (📍 KOLAR GOLD FIELDS) */}
              {zonesData.map((zone, idx) => (
                <React.Fragment key={idx}>
                  <Marker
                    position={zone.coords}
                    icon={createStationPinIcon(zone.name, zone.color)}
                    eventHandlers={{
                      click: () => {
                        if (isHead || userUnitZone?.name === zone.name) {
                          setSelectedZone(zone);
                        }
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '6px', textAlign: 'left', minWidth: 210 }}>
                        <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{zone.name}</h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#475569' }}>{zone.sector}</p>
                        <div style={{ marginTop: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#0284c7' }}>
                          Total Cases: {zone.cases?.toLocaleString()}
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Direct Location Map Links:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <a
                              href={`https://www.google.com/maps?q=${zone.coords[0]},${zone.coords[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              Google Maps Location
                            </a>
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${zone.coords[0]}&mlon=${zone.coords[1]}#map=13/${zone.coords[0]}/${zone.coords[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              OpenStreetMap Interactive View
                            </a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {/* Hotspots */}
              {hotspots?.map(hs => (
                <Circle
                  key={hs.id}
                  center={hs.coords}
                  radius={hs.radius}
                  pathOptions={{ fillColor: hs.color, color: hs.color, weight: 2, fillOpacity: 0.25 }}
                />
              ))}
            </MapContainer>

            {/* BENGALURU / DIVISION MAP LEGEND OVERLAY (Bottom Right matching user screenshot) */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              right: '16px',
              zIndex: 1000,
              background: '#ffffff',
              border: '1.5px solid #0284c7',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              minWidth: '290px',
              maxWidth: '320px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '0.3px', marginBottom: '10px', textAlign: 'left' }}>
                {divisionName.toUpperCase()} DIVISION LEGEND
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px', fontSize: '0.68rem', fontWeight: 800 }}>
                {zonesData.map((z, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 12, height: 10, borderRadius: 2, background: z.color, display: 'inline-block', flexShrink: 0 }}></span>
                    <span>{z.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '10px', paddingTop: '6px', fontSize: '0.64rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>
                District Boundary: Dashed line (----)
              </div>
            </div>

            {/* Custom Bottom Right GIS Attribution Bar matching screenshot */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'rgba(255, 255, 255, 0.92)',
              padding: '2px 8px',
              fontSize: '0.62rem',
              color: '#334155',
              fontWeight: 700,
              zIndex: 999,
              borderTopLeftRadius: '6px',
              borderTop: '1px solid #cbd5e1',
              borderLeft: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🇺🇦</span>
              <a href="https://leafletjs.com" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>Leaflet</a>
              <span>|</span>
              <span>© Karnataka State Police GIS Portal</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Statistics Panel */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <DivisionStatisticsPanel
            divisionName={divisionName}
            overallStats={overallStats}
            selectedZoneData={activeZone}
            onResetSelection={() => setSelectedZone(null)}
          />
        </div>

      </div>



      {panicActive && <PanicSOS onClose={() => setPanicActive(false)} />}

      {/* Floating KSP Sentinel AI Assistant Trigger */}
      <button
        className="floating-chatbot-trigger"
        onClick={() => setShowChatbot(!showChatbot)}
        title={showChatbot ? "Close KSP Sentinel AI" : "Open KSP Sentinel AI Intelligence Assistant"}
        aria-label="KSP Sentinel AI Assistant"
      >
        {showChatbot ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {/* Full-Screen KSP Sentinel AI Modal */}
      {showChatbot && (
        <FullScreenChatbotModal
          initialDivision={`${divisionName} Division`}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  );
}

export default DivisionDashboard;
