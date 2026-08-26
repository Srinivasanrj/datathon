import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, Search, X, CheckCircle2, User, MapPin, Calendar, 
  Download, RefreshCw, Eye, ShieldAlert, Radio, Filter, BadgeCheck,
  FileCheck, Zap, Layers, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getPoliceComplaints } from '../dataset/police_complaint_catalyst_dataset';

/**
 * KSP REGISTERED CASES MASTER LOG & DOSSIER VIEWER
 * Combines Citizen e-Complaints and Police-Initiated Suo Moto Cases in real time.
 */
function RegisteredCasesModal({ currentUser, onClose, onOpenEComplaint, onOpenPoliceComplaint }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'citizen', 'police'
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const isHead = currentUser?.username?.includes('.head') || currentUser?.unitName?.includes('Division Head') || currentUser?.unitName?.includes('Head');
  const userUnit = currentUser?.unitName || 'Bengaluru Urban';

  const loadAllRegisteredCases = async () => {
    setLoading(true);
    let combined = [];

    // 1. Load from localStorage registered complaints
    try {
      const localComplaints = JSON.parse(localStorage.getItem('ksp_registered_complaints') || '[]');
      combined = [...combined, ...localComplaints];
    } catch (e) {}

    // 2. Load from localStorage police-initiated cases
    try {
      const localPoliceCases = JSON.parse(localStorage.getItem('ksp_police_initiated_cases_v1') || '[]');
      const formattedPolice = localPoliceCases.map(p => ({
        id: p.CaseId || p.id,
        reference_number: p.CaseId || p.id,
        fir_number: p.FirNumber,
        type: 'POLICE_INITIATED_SUO_MOTO',
        status: p.CaseStatus || 'ACCUSED_IN_CUSTODY',
        created_at: p.FilingTimestamp || p.IncidentDate,
        complainant: {
          full_name: `${p.OfficerName || 'Duty Officer'} (${p.OfficerRank || 'PSI'})`,
          mobile: p.OfficerBadge || 'KSP Officer',
          email: `${p.PoliceStation || 'Station'} • Beat: ${p.BeatUnit || 'Patrol Unit'}`
        },
        incident: {
          nature: p.CrimeCategory || 'Spot Crime / Suo Moto',
          police_station: p.PoliceStation,
          district: p.SubDivision || 'Bengaluru Urban',
          location: p.SpotLocation,
          description: p.SpotNarrative,
          date_from: p.IncidentDate
        },
        suspect: {
          name: p.SuspectName,
          status: p.SuspectStatus,
          description: p.SuspectDetails
        },
        evidence: {
          seized_items: p.SeizedItems,
          seizure_value: p.SeizureValue,
          witness: p.PanchaWitness
        }
      }));
      combined = [...combined, ...formattedPolice];
    } catch (e) {}

    // 3. Load from Master Dataset Police records
    try {
      const masterPolice = getPoliceComplaints().map(p => ({
        id: p.CaseId,
        reference_number: p.CaseId,
        fir_number: p.FirNumber,
        type: 'POLICE_INITIATED_SUO_MOTO',
        status: p.CaseStatus || 'ACCUSED_IN_CUSTODY',
        created_at: p.FilingTimestamp || p.IncidentDate,
        complainant: {
          full_name: `${p.OfficerName} (${p.OfficerRank})`,
          mobile: p.OfficerBadge,
          email: `${p.PoliceStation} • ${p.BeatUnit}`
        },
        incident: {
          nature: p.CrimeCategory,
          police_station: p.PoliceStation,
          district: p.SubDivision,
          location: p.SpotLocation,
          description: p.SpotNarrative,
          date_from: p.IncidentDate
        },
        suspect: {
          name: p.SuspectName,
          status: p.SuspectStatus,
          description: p.SuspectDetails
        },
        evidence: {
          seized_items: p.SeizedItems,
          seizure_value: p.SeizureValue,
          witness: p.PanchaWitness
        }
      }));
      combined = [...combined, ...masterPolice];
    } catch (e) {}

    // 4. Fetch from Backend /api/complaints and /api/submit_police_case
    try {
      const res1 = await fetch(`/api/complaints?station=${encodeURIComponent(userUnit)}&is_head=${isHead}`);
      if (res1.ok) {
        const data1 = await res1.json();
        if (data1.complaints) combined = [...combined, ...data1.complaints];
      }
    } catch (e) {}

    try {
      const res2 = await fetch(`/api/submit_police_case?station=${encodeURIComponent(userUnit)}`);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.cases) {
          const backendPolice = data2.cases.map(p => ({
            id: p.CaseId || p.id,
            reference_number: p.CaseId || p.id,
            fir_number: p.FirNumber,
            type: 'POLICE_INITIATED_SUO_MOTO',
            status: p.CaseStatus || 'REGISTERED',
            created_at: p.FilingTimestamp || p.created_at,
            complainant: {
              full_name: `${p.OfficerName} (${p.OfficerRank})`,
              mobile: p.OfficerBadge,
              email: p.PoliceStation
            },
            incident: {
              nature: p.CrimeCategory,
              police_station: p.PoliceStation,
              district: p.SubDivision,
              location: p.SpotLocation,
              description: p.SpotNarrative,
              date_from: p.IncidentDate
            }
          }));
          combined = [...combined, ...backendPolice];
        }
      }
    } catch (e) {}

    // Deduplicate by id/reference_number
    const seen = new Set();
    const uniqueList = [];
    for (const item of combined) {
      const key = item.reference_number || item.id || item.CaseId || item.ComplaintId;
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    }

    setCases(uniqueList);
    setLoading(false);
  };

  useEffect(() => {
    loadAllRegisteredCases();
  }, [userUnit, isHead]);

  // Tab Filtering
  const tabFiltered = cases.filter(c => {
    const isPolice = c.type === 'POLICE_INITIATED_SUO_MOTO' || (c.reference_number || '').startsWith('KSP-POL');
    if (activeTab === 'citizen') return !isPolice;
    if (activeTab === 'police') return isPolice;
    return true;
  });

  // Search Filtering
  const filteredCases = tabFiltered.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.reference_number || '').toLowerCase().includes(q) ||
      (c.fir_number || '').toLowerCase().includes(q) ||
      (c.complainant?.full_name || '').toLowerCase().includes(q) ||
      (c.complainant?.mobile || '').includes(q) ||
      (c.incident?.nature || '').toLowerCase().includes(q) ||
      (c.incident?.police_station || '').toLowerCase().includes(q) ||
      (c.incident?.district || '').toLowerCase().includes(q)
    );
  });

  // Citizen vs Police Counts
  const citizenCount = cases.filter(c => !(c.type === 'POLICE_INITIATED_SUO_MOTO' || (c.reference_number || '').startsWith('KSP-POL'))).length;
  const policeCount = cases.filter(c => c.type === 'POLICE_INITIATED_SUO_MOTO' || (c.reference_number || '').startsWith('KSP-POL')).length;

  const downloadPDF = (c) => {
    const isPolice = c.type === 'POLICE_INITIATED_SUO_MOTO' || (c.reference_number || '').startsWith('KSP-POL');
    const doc = new jsPDF();

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 280);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('KARNATAKA STATE POLICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(
      isPolice ? `SUO MOTO SPOT CRIME & SEIZURE RECORD — ${c.reference_number}` : `OFFICIAL e-COMPLAINT / e-FIR RECORD — ${c.reference_number}`,
      105, 27, { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    
    let y = 42;
    if (isPolice) {
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTING OFFICER DETAILS:', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Officer: ${c.complainant?.full_name || 'Duty Inspector'} | Badge: ${c.complainant?.mobile || 'KSP-88421'}`, 20, y); y += 6;
      doc.text(`Station: ${c.incident?.police_station} (${c.incident?.district})`, 20, y); y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text('SPOT SEIZURE & INCIDENT DETAILS:', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Crime Type: ${c.incident?.nature} | Date: ${c.incident?.date_from || 'Spot Log'}`, 20, y); y += 6;
      doc.text(`Location: ${c.incident?.location || 'Spot'}`, 20, y); y += 6;
      doc.text(`Narrative: ${c.incident?.description || 'Offense detected during patrol.'}`, 20, y, { maxWidth: 165 }); y += 14;

      doc.setFont('helvetica', 'bold');
      doc.text('ACCUSED & SEIZURE MEMO (BNSS Sec 105):', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Accused Name: ${c.suspect?.name || 'In Custody'} | Status: ${c.suspect?.status || 'Apprehended'}`, 20, y); y += 6;
      doc.text(`Seized Property: ${c.evidence?.seized_items || 'Property memo attached'}`, 20, y); y += 6;
      doc.text(`Estimated Value: ${c.evidence?.seizure_value || 'Rs. 0'}`, 20, y); y += 10;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLAINANT DETAILS:', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${c.complainant?.full_name} | Contact: ${c.complainant?.mobile}`, 20, y); y += 6;
      doc.text(`Address: ${c.complainant?.present_address || 'Karnataka'}, ${c.complainant?.district || ''}`, 20, y); y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text('INCIDENT DETAILS:', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Nature: ${c.incident?.nature} | Date: ${c.incident?.date_from}`, 20, y); y += 6;
      doc.text(`Police Station: ${c.incident?.police_station}`, 20, y); y += 6;
      doc.text(`Location: ${c.incident?.location}`, 20, y); y += 6;
      doc.text(`Description: ${c.incident?.description || 'N/A'}`, 20, y, { maxWidth: 165 }); y += 14;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('LEGAL STATUS & AUDIT:', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${c.status || 'REGISTERED'}`, 20, y); y += 6;
    doc.text(`Compliance: Section 65B Indian Evidence Act / BNSS Sec 105 Compliant Digital Audit`, 20, y);

    doc.save(`${isPolice ? 'SuoMoto_FIR' : 'eComplaint'}_${c.reference_number}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        background: '#ffffff', width: '100%', maxWidth: '980px', maxHeight: '92vh',
        borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(15,23,42,0.4)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #93c5fd'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)', color: 'white',
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
              <Layers size={24} color="#60a5fa" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                KSP Registered Cases Master Log & DataStore
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#bfdbfe', margin: 0, fontWeight: 600 }}>
                Live Synchronization with Zoho Catalyst Cloud DataStore • Citizen e-FIRs & Police Suo Moto Cases
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Filter Tabs & Search Toolbar */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'all' ? 'white' : '#475569',
                border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>All Cases</span>
              <span style={{ background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#cbd5e1', padding: '1px 6px', borderRadius: '6px', fontSize: '0.66rem' }}>{cases.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('citizen')}
              style={{
                background: activeTab === 'citizen' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'citizen' ? 'white' : '#475569',
                border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>Citizen e-Complaints</span>
              <span style={{ background: activeTab === 'citizen' ? 'rgba(255,255,255,0.25)' : '#cbd5e1', padding: '1px 6px', borderRadius: '6px', fontSize: '0.66rem' }}>{citizenCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('police')}
              style={{
                background: activeTab === 'police' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'police' ? 'white' : '#475569',
                border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <span>Police Suo Moto FIRs</span>
              <span style={{ background: activeTab === 'police' ? 'rgba(255,255,255,0.25)' : '#cbd5e1', padding: '1px 6px', borderRadius: '6px', fontSize: '0.66rem' }}>{policeCount}</span>
            </button>
          </div>

          {/* Search box & Refresh */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, maxWidth: '420px', minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '7px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', flex: 1 }}>
              <Search size={14} style={{ color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search reference #, FIR #, officer/citizen, station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.78rem', width: '100%' }}
              />
            </div>
            <button onClick={loadAllRegisteredCases} style={{ background: 'white', border: '1.5px solid #cbd5e1', padding: '7px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700, color: '#1e3a8a' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Case List Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: '#2563eb' }} />
              Loading Registered Case Records from Catalyst DataStore...
            </div>
          ) : filteredCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <FileText size={40} style={{ margin: '0 auto 12px auto', color: '#cbd5e1', display: 'block' }} />
              <h4 style={{ fontSize: '1rem', color: '#1e3a8a', fontWeight: 800 }}>No registered cases found</h4>
              <p style={{ fontSize: '0.80rem', color: '#64748b', maxWidth: '380px', margin: '6px auto 16px auto' }}>
                No records matched your search criteria or filter. File a new complaint to register records into the system.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {onOpenEComplaint && (
                  <button onClick={() => { onClose(); onOpenEComplaint(); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}>
                    + File Citizen e-Complaint
                  </button>
                )}
                {onOpenPoliceComplaint && (
                  <button onClick={() => { onClose(); onOpenPoliceComplaint(); }} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}>
                    + Initiate Suo Moto FIR
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredCases.map((c) => {
                const isPolice = c.type === 'POLICE_INITIATED_SUO_MOTO' || (c.reference_number || '').startsWith('KSP-POL');
                return (
                  <div
                    key={c.id || c.reference_number}
                    style={{
                      background: '#ffffff',
                      border: isPolice ? '1.5px solid #bfdbfe' : '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#1e3a8a' }}>
                          {c.reference_number || c.id}
                        </span>

                        {c.fir_number && (
                          <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid #bfdbfe' }}>
                            {c.fir_number}
                          </span>
                        )}

                        {/* Type badge */}
                        <span style={{
                          fontSize: '0.62rem',
                          background: isPolice ? '#dbeafe' : '#f1f5f9',
                          color: isPolice ? '#1e40af' : '#475569',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isPolice ? <ShieldAlert size={10} color="#1d4ed8" /> : <User size={10} />}
                          {isPolice ? 'POLICE SUO MOTO' : 'CITIZEN e-FIR'}
                        </span>

                        {/* Status badge */}
                        <span style={{
                          fontSize: '0.62rem',
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 800
                        }}>
                          {c.status || 'REGISTERED'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#1e293b', fontWeight: 700, marginBottom: '2px' }}>
                        {isPolice ? '👮 Reporting Officer: ' : '👤 Complainant: '}
                        <b>{c.complainant?.full_name || 'Duty Official'}</b>
                        <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                          ({c.complainant?.mobile || 'Official Contact'})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.70rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <span>⚖️ Crime Category: <b style={{ color: '#334155' }}>{c.incident?.nature || 'General Crime'}</b></span>
                        <span>•</span>
                        <span>📍 Police Station: <b style={{ color: '#334155' }}>{c.incident?.police_station}</b> ({c.incident?.district || 'Karnataka'})</span>
                        {c.created_at && (
                          <>
                            <span>•</span>
                            <span>🕒 Filed: {c.created_at}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedCase(c)}
                        style={{
                          background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe',
                          padding: '8px 14px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <Eye size={14} /> Dossier
                      </button>
                      <button
                        onClick={() => downloadPDF(c)}
                        style={{
                          background: 'linear-gradient(90deg, #1e3a8a, #2563eb)', color: 'white',
                          border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '0.74rem',
                          fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                        }}
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FULL DOSSIER INSPECTION MODAL */}
        {selectedCase && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '680px', borderRadius: '20px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', border: '2px solid #2563eb', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {selectedCase.type === 'POLICE_INITIATED_SUO_MOTO' || (selectedCase.reference_number || '').startsWith('KSP-POL') ? 'POLICE-INITIATED SUO MOTO CASE DOSSIER' : 'CITIZEN e-COMPLAINT RECORD'}
                  </span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e3a8a', margin: '2px 0 0 0' }}>
                    Case File: {selectedCase.reference_number || selectedCase.id}
                  </h4>
                </div>
                <button onClick={() => setSelectedCase(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <div style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#334155' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px 0' }}><b>{selectedCase.type === 'POLICE_INITIATED_SUO_MOTO' ? 'Reporting Officer:' : 'Complainant Name:'}</b> {selectedCase.complainant?.full_name}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Contact / ID:</b> {selectedCase.complainant?.mobile} {selectedCase.complainant?.email ? `| Email: ${selectedCase.complainant?.email}` : ''}</p>
                  {selectedCase.complainant?.present_address && (
                    <p style={{ margin: '0' }}><b>Address:</b> {selectedCase.complainant?.present_address}, {selectedCase.complainant?.district}</p>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px 0' }}><b>Crime Nature / Category:</b> <span style={{ color: '#1e3a8a', fontWeight: 800 }}>{selectedCase.incident?.nature}</span></p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Police Station:</b> {selectedCase.incident?.police_station} ({selectedCase.incident?.district || 'Karnataka'})</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Incident Date & Time:</b> {selectedCase.incident?.date_from || 'N/A'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Spot Location:</b> {selectedCase.incident?.location || 'N/A'}</p>
                  <p style={{ margin: '0' }}><b>Incident Description:</b> {selectedCase.incident?.description || 'N/A'}</p>
                </div>

                {/* Suspect / Seizure info */}
                {(selectedCase.suspect?.name || selectedCase.evidence?.seized_items || selectedCase.evidence?.property_stolen) && (
                  <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
                    {selectedCase.suspect?.name && (
                      <p style={{ margin: '0 0 4px 0' }}><b>Accused / Suspect:</b> {selectedCase.suspect?.name} ({selectedCase.suspect?.status || 'Identified'})</p>
                    )}
                    {selectedCase.evidence?.seized_items && (
                      <p style={{ margin: '0 0 4px 0' }}><b>Seized Property:</b> {selectedCase.evidence?.seized_items} (Valuation: {selectedCase.evidence?.seizure_value || 'N/A'})</p>
                    )}
                    {selectedCase.evidence?.property_type && (
                      <p style={{ margin: '0' }}><b>Property Involment:</b> {selectedCase.evidence?.property_type} (Valuation: Rs. {selectedCase.evidence?.estimated_value || '0'})</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => downloadPDF(selectedCase)} style={{ background: 'linear-gradient(90deg, #1e3a8a, #2563eb)', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.80rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> Download Official PDF
                </button>
                <button onClick={() => setSelectedCase(null)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.80rem', cursor: 'pointer' }}>
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default RegisteredCasesModal;
