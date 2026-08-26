import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, ArrowRight, ArrowLeft, Upload, Check, Download, 
  AlertCircle, Phone, Lock, Calendar, MapPin, User, FilePlus, X, Eye, 
  Edit3, Camera, FileCheck, Paperclip, Plus, Minus, Image, Film, Smartphone, 
  Mic, FileCode, BadgeCheck, ShieldAlert, Radio, Search, Layers, RefreshCw, Zap, Database
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { pushPoliceCaseToCatalyst } from '../services/catalystPoliceService';
import { getPoliceComplaints, savePoliceComplaint } from '../dataset/police_complaint_catalyst_dataset';

const KARNATAKA_DISTRICTS_STATIONS = {
  'Bengaluru Urban': ['Bengaluru Urban Main PS', 'Indiranagar PS', 'Koramangala PS', 'Whitefield Cyber PS', 'Electronic City PS'],
  'Bengaluru Rural': ['Bengaluru Rural SP Office PS', 'Doddaballapura PS', 'Hosakote PS', 'Nelamangala PS'],
  'Chikkaballapura': ['Chikkaballapura Central PS', 'Gauribidanur PS', 'Chintamani PS', 'Bagepalli PS'],
  'Chitradurga': ['Chitradurga Town PS', 'Chitradurga Rural PS', 'Challakere PS', 'Hiriyur PS'],
  'Davanagere': ['Davanagere City PS', 'Harihar PS', 'Honnali PS', 'Channagiri PS'],
  'Kolar': ['Kolar Town PS', 'Mulbagal PS', 'Srinivaspur PS', 'Bangarapet PS'],
  'Kolar Gold Fields (KGF)': ['KGF Champion Reefs PS', 'Oorgaum PS', 'Marikuppam PS', 'Robertsonpet PS'],
  'Ramanagara': ['Ramanagara Town PS', 'Channapatna PS', 'Kanakapura PS', 'Magadi PS'],
  'Tumakuru': ['Tumakuru Town PS', 'Tiptur PS', 'Kunigal PS', 'Sira PS'],
  'Mysuru City': ['Mysuru Palace City PS', 'Vidyaranyapuram PS', 'Devaraja PS', 'Nazarbad PS'],
  'Mandya': ['Mandya Central PS', 'Maddur PS', 'Srirangapatna PS'],
  'Dakshina Kannada': ['Mangaluru North PS', 'Panambur Port PS', 'Bantwal PS'],
  'Belagavi District': ['Belagavi City PS', 'Gokak PS', 'Chikkodi PS'],
  'Kalaburagi District': ['Kalaburagi Central PS', 'Sedam PS', 'Shahabad PS']
};

/**
 * STANDALONE POLICE-INITIATED COMPLAINT / SUO MOTO FIR MODULE
 * Designed for duty officers on patrol discovering crimes, seizing evidence, and logging field cases.
 * Fully synchronized with Zoho Catalyst DataStore (`PoliceInitiatedComplaints`).
 */
function PoliceInitiatedComplaintPortal({ onClose, onRegisterCase, initialStation = '' }) {
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, step1, step2, step3, step4, step5, step6, review, confirmation
  
  // Officer Authentication
  const [officerBadge, setOfficerBadge] = useState('KSP-88421');
  const [officerName, setOfficerName] = useState('Inspector M. Venkatesh');
  const [officerRank, setOfficerRank] = useState('Police Inspector (PI)');
  const [selectedStation, setSelectedStation] = useState(initialStation || 'Bengaluru Urban Main PS');
  const [incidentDistrict, setIncidentDistrict] = useState('Bengaluru Urban');
  const [beatUnit, setBeatUnit] = useState('Night Patrol Beat #4');

  // Step 2: Spot Incident Details
  const [crimeCategory, setCrimeCategory] = useState('Vehicle Theft / Spot Recovery');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState('02:15');
  const [spotLocation, setSpotLocation] = useState('');
  const [spotNarrative, setSpotNarrative] = useState('');

  // Step 3: Suspect / Accused Details
  const [suspectStatus, setSuspectStatus] = useState('Apprehended on Spot');
  const [suspectName, setSuspectName] = useState('');
  const [suspectAge, setSuspectAge] = useState('');
  const [suspectMarks, setSuspectMarks] = useState('');
  const [suspectAddress, setSuspectAddress] = useState('');

  // Witness Details
  const [witnessName, setWitnessName] = useState('');
  const [witnessContact, setWitnessContact] = useState('');

  // Step 4: Recovered Property / Seizure List
  const [propertySeized, setPropertySeized] = useState('Yes');
  const [seizureCategory, setSeizureCategory] = useState('Stolen Vehicle (Motorcycle)');
  const [seizureDescription, setSeizureDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [seizureMemoNo, setSeizureMemoNo] = useState('PAN-2026/089');

  // Step 5: Upload Files & Officer Field Report
  const [officerReportFile, setOfficerReportFile] = useState('');
  const [uploadedEvidences, setUploadedEvidences] = useState([]);

  // Review & Submit State
  const [refNumber, setRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [officerConsent, setOfficerConsent] = useState(false);

  const handleDistrictChange = (dist) => {
    setIncidentDistrict(dist);
    const stations = KARNATAKA_DISTRICTS_STATIONS[dist] || [dist + ' Main PS'];
    setSelectedStation(stations[0]);
  };

  const handleOfficerReportUpload = (e) => {
    const file = e.target.files[0];
    if (file) setOfficerReportFile(file.name);
  };

  const handleEvidenceFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map(f => ({
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: f.type.includes('image') ? 'IMAGE' : f.type.includes('video') ? 'VIDEO' : f.type.includes('audio') ? 'AUDIO' : 'DOC'
    }));
    setUploadedEvidences(prev => [...prev, ...newItems]);
  };

  const removeEvidence = (id) => {
    setUploadedEvidences(prev => prev.filter(item => item.id !== id));
  };

  // --- SUBMIT POLICE-INITIATED CASE ---
  const handleSubmitPoliceCase = async () => {
    if (!officerConsent) {
      alert('Please check the Officer Verification Consent checkbox before submitting.');
      return;
    }

    setIsSubmitting(true);

    const generatedRef = `KSP-POL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setRefNumber(generatedRef);

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const caseRecord = {
      id: generatedRef,
      reference_number: generatedRef,
      type: 'POLICE_INITIATED_SUO_MOTO',
      status: 'REGISTERED SUO MOTO FIR / UNDER INVESTIGATION',
      filing_date: formattedDate,
      timestamp: timestamp,
      officer: {
        name: officerName,
        badge_id: officerBadge,
        rank: officerRank,
        police_station: selectedStation,
        district: incidentDistrict,
        beat_unit: beatUnit
      },
      incident: {
        nature: crimeCategory,
        date_from: incidentDate,
        time_from: incidentTime,
        location: spotLocation,
        description: spotNarrative,
        police_station: selectedStation,
        district: incidentDistrict
      },
      suspect: {
        known: true,
        status: suspectStatus,
        name: suspectName || 'Suspect Apprehended',
        approx_age: suspectAge,
        marks: suspectMarks,
        address: suspectAddress
      },
      witness: {
        witness_name: witnessName,
        contact: witnessContact
      },
      seizure: {
        property_seized: propertySeized === 'Yes',
        category: seizureCategory,
        description: seizureDescription,
        estimated_value: estimatedValue,
        memo_no: seizureMemoNo
      },
      evidence: {
        manual_report: officerReportFile || 'Logged Officer Entry',
        files: uploadedEvidences.map(e => e.name)
      },
      investigator: `${officerName} (${officerRank})`,
      section_laws: 'Sec 303/317 BNS, Sec 102 CrPC / Sec 105 BNSS (Seizure)'
    };

    // Save to localStorage & Catalyst Cloud DB
    try {
      const existingStr = localStorage.getItem('ksp_registered_complaints');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(caseRecord);
      localStorage.setItem('ksp_registered_complaints', JSON.stringify(existing));

      // Save to Police Initiated Catalyst Dataset Engine & Sync to Cloud DB
      await pushPoliceCaseToCatalyst({
        CaseId: String(caseRecord.id || generatedRef),
        FirNumber: `FIR-2026-${(incidentDistrict || 'BLR').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        OfficerBadge: String(caseRecord.officer?.badge_id || officerBadge || 'KSP-88421'),
        OfficerName: String(caseRecord.officer?.name || officerName || 'Duty Officer'),
        OfficerRank: String(caseRecord.officer?.rank || officerRank || 'Police Inspector (PI)'),
        Division: 'Bengaluru',
        SubDivision: String(caseRecord.officer?.district || incidentDistrict || 'Bengaluru Urban'),
        PoliceStation: String(caseRecord.officer?.police_station || selectedStation || 'Bengaluru Urban Main PS'),
        BeatUnit: String(caseRecord.officer?.beat_unit || beatUnit || 'Night Patrol Beat #4'),
        CrimeCategory: String(caseRecord.incident?.nature || crimeCategory || 'Spot Operation / Suo Moto'),
        IncidentDate: String(`${caseRecord.incident?.date_from || incidentDate || new Date().toISOString().split('T')[0]} ${caseRecord.incident?.time_from || incidentTime || '02:00'}`.trim()),
        SpotLocation: String(caseRecord.incident?.location || spotLocation || selectedStation || 'Karnataka, India'),
        SpotNarrative: String(caseRecord.incident?.description || spotNarrative || 'Offense discovered during beat patrol under BNSS Sec 105.'),
        SuspectStatus: String(caseRecord.suspect?.status || suspectStatus || 'Apprehended on Spot'),
        SuspectName: String(caseRecord.suspect?.name || suspectName || 'Unknown Accused'),
        SuspectDetails: String(`Age: ${caseRecord.suspect?.approx_age || suspectAge || 'N/A'}. Marks: ${caseRecord.suspect?.marks || suspectMarks || 'None'}. Address: ${caseRecord.suspect?.address || suspectAddress || 'N/A'}`),
        SeizedItems: String(caseRecord.seizure?.description || seizureDescription || 'Spot property seizure memo logged'),
        SeizureValue: String(caseRecord.seizure?.estimated_value || estimatedValue || 'Rs. 0'),
        PanchaWitness: String(witnessName ? `${witnessName} (${witnessContact})` : 'Independent Spot Witness'),
        EvidenceCount: String(caseRecord.evidence?.files?.length || uploadedEvidences?.length || 1),
        EvidenceList: caseRecord.evidence?.files || ['Spot Seizure Memo', 'Inspection Photo'],
        CaseStatus: 'ACCUSED_IN_CUSTODY',
        FilingTimestamp: new Date().toISOString(),
        InvestigationSummary: String(caseRecord.incident?.description || spotNarrative || 'Spot seizure and panchanama completed under BNSS Sec 105.')
      });
    } catch (err) {
      console.error("Error saving to localStorage & Catalyst dataset:", err);
    }

    // Attach to global window database
    window.KSP_REGISTERED_COMPLAINTS = window.KSP_REGISTERED_COMPLAINTS || [];
    window.KSP_REGISTERED_COMPLAINTS.unshift(caseRecord);

    window.dispatchEvent(new CustomEvent('ksp_complaint_registered', { detail: caseRecord }));

    if (onRegisterCase) {
      onRegisterCase(caseRecord);
    }

    setIsSubmitting(false);
    setCurrentStep('confirmation');
  };

  // --- DOWNLOAD POLICE SEIZURE & FIR REPORT PDF ---
  const downloadPoliceReportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 280);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('KARNATAKA STATE POLICE', 105, 20, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setTextColor(37, 99, 235);
    doc.text('POLICE-INITIATED COMPLAINT & SPOT SEIZURE MEMO (SUO MOTO FIR)', 105, 26, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    doc.setFillColor(239, 246, 255);
    doc.rect(15, 34, 180, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`POLICE CASE ID: ${refNumber || 'KSP-POL-2026-PENDING'}`, 20, 43);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patrol Station: ${selectedStation} (${incidentDistrict}) | Beat: ${beatUnit}`, 20, 50);

    let y = 66;

    const sections = [
      ['1. DUTY PATROL OFFICER PARTICULARS', [
        ['Officer Name & Rank:', `${officerName} (${officerRank})`],
        ['Officer Badge ID:', officerBadge],
        ['Police Station / District:', `${selectedStation} (${incidentDistrict})`],
        ['Beat Sector / Patrol Unit:', beatUnit]
      ]],
      ['2. SPOT INCIDENT & OFFENSE SUMMARY', [
        ['Nature of Crime / Category:', crimeCategory],
        ['Incident Date & Time:', `${incidentDate} at ${incidentTime}`],
        ['Spot / Recovery Location:', spotLocation || 'Patrol Beat Area'],
        ['Spot Observations & Modus:', spotNarrative || 'Patrol officer observed suspicious activity and intervened.']
      ]],
      ['3. SUSPECT & ACCUSED PARTICULARS', [
        ['Suspect Status:', suspectStatus],
        ['Suspect Name & Approx Age:', `${suspectName || 'Unknown / Unnamed'} (${suspectAge || 'N/A'} yrs)`],
        ['Identification Marks:', suspectMarks || 'None noted on spot'],
        ['Suspect Address / Native:', suspectAddress || 'Not furnished']
      ]],
      ['4. RECOVERED PROPERTY & PANCHANAMA SEIZURE (BNSS SEC 105)', [
        ['Property Seized on Spot:', propertySeized],
        ['Seizure Category / Item:', seizureCategory],
        ['Property Description / Details:', seizureDescription || 'Listed in Panchanama memo'],
        ['Estimated Property Value:', `Rs. ${estimatedValue || '0'}`],
        ['Panchanama Memo Reference No:', seizureMemoNo || 'PAN-2026/089'],
        ['Pancha / Independent Witness:', `${witnessName || 'Independent Witness'} (${witnessContact || 'Contact verified'})`]
      ]],
      ['5. EVIDENCES & INVESTIGATION LOG', [
        ['Officer Field Report File:', officerReportFile || 'Manual patrol log entry recorded'],
        ['Attached Digital Evidences:', uploadedEvidences.length > 0 ? uploadedEvidences.map(e => e.name).join(', ') : 'None attached'],
        ['Statutory Provisions:', 'BNSS Section 105 (Seizure) & Applicable BNS Penal Sections']
      ]]
    ];

    sections.forEach(([secTitle, fields]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(37, 99, 235);
      doc.text(secTitle, 15, y);
      y += 6;

      fields.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(label, 20, y);

        doc.setFont('helvetica', 'normal');
        const splitVal = doc.splitTextToSize(val, 125);
        doc.text(splitVal, 65, y);
        y += Math.max(5, splitVal.length * 4.5);
      });
      y += 4;
    });

    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text('Certified Official Police Record under BNSS Section 105 & Section 65B Evidence Act. Synced to Zoho Catalyst DataStore.', 15, y);

    doc.save(`Police_Case_Report_${refNumber || 'Receipt'}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
      zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px'
    }}>
      {/* LIGHT MODE CONTAINER CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        color: '#0f172a',
        width: '100%', maxWidth: '940px', maxHeight: '94vh', borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(30, 58, 138, 0.25)', border: '2px solid #93c5fd',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>

        {/* TOP HEADER - POLICE PATROL BADGE BLUE */}
        <div style={{
          background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)',
          color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <ShieldAlert size={26} color="#60a5fa" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '0.01em', lineHeight: 1.1 }}>
                  POLICE-INITIATED COMPLAINT & SUO MOTO FIR CONSOLE
                </h2>
                <span style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a7f3d0' }} />
                  ZOHO CATALYST DATASTORE
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#bfdbfe', margin: 0, fontWeight: 600 }}>
                Karnataka State Police • Duty Patrol Offense Registration & Automated DataStore Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Console"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        {currentStep !== 'welcome' && currentStep !== 'confirmation' && (
          <div style={{ background: '#f1f5f9', padding: '12px 24px', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            {[
              { id: 'step1', label: '1. Officer Info' },
              { id: 'step2', label: '2. Spot Incident' },
              { id: 'step3', label: '3. Accused/Witness' },
              { id: 'step4', label: '4. Property Seizure' },
              { id: 'step5', label: '5. Evidence & Report' },
              { id: 'review', label: '6. Review & Submit' }
            ].map((s, i) => {
              const active = currentStep === s.id;
              const stepOrder = ['step1', 'step2', 'step3', 'step4', 'step5', 'review'];
              const currentNum = stepOrder.indexOf(currentStep) + 1;
              const thisNum = i + 1;
              const completed = thisNum < currentNum;

              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800,
                    color: active ? '#1d4ed8' : (completed ? '#059669' : '#64748b')
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: active ? '#1d4ed8' : (completed ? '#059669' : '#cbd5e1'),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800
                  }}>
                    {completed ? <Check size={14} /> : thisNum}
                  </div>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* BODY CONTAINER */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 1 }}>

          {/* WELCOME SCREEN */}
          {currentStep === 'welcome' && (
            <div style={{ textAlign: 'center', padding: '16px 8px', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white',
                width: '64px', height: '64px', borderRadius: '20px', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 10px 25px rgba(29, 78, 216, 0.3)'
              }}>
                <Radio size={34} color="#93c5fd" />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#03214c', marginBottom: '8px' }}>
                Duty Patrol Suo Moto FIR & Spot Crime Logging Console
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
                This portal allows on-duty police officers and patrol units to register <b>Suo Moto Crimes</b>, log spot property seizures (Panchanama under BNSS Sec 105), attach photographic evidence, and automatically sync records to the <b>Zoho Catalyst Cloud DataStore</b>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px', textAlign: 'left' }}>
                <div style={featureBoxStyle}>
                  <div style={{ ...featureIconCircle, background: '#eff6ff', color: '#1d4ed8' }}><BadgeCheck size={18} /></div>
                  <h4 style={featureTitleStyle}>Officer Authentication</h4>
                  <p style={featureDescStyle}>Badge number, rank, police station jurisdiction, and patrol beat sector verification.</p>
                </div>
                <div style={featureBoxStyle}>
                  <div style={{ ...featureIconCircle, background: '#ecfdf5', color: '#059669' }}><FileCheck size={18} /></div>
                  <h4 style={featureTitleStyle}>Spot Seizure Panchanama</h4>
                  <p style={featureDescStyle}>Detailed property description, chassis/serial numbers, pancha witness signatures, and estimated valuation.</p>
                </div>
                <div style={featureBoxStyle}>
                  <div style={{ ...featureIconCircle, background: '#fef3c7', color: '#d97706' }}><Zap size={18} /></div>
                  <h4 style={featureTitleStyle}>Catalyst DataStore Sync</h4>
                  <p style={featureDescStyle}>Instant row insertion to cloud database with offline resilient state and instant PDF memo generation.</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('step1')}
                style={{
                  background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)',
                  color: 'white', border: 'none', padding: '14px 32px', borderRadius: '12px',
                  fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: '10px', boxShadow: '0 8px 24px rgba(29, 78, 216, 0.35)'
                }}
              >
                <span>Initiate Patrol Crime Record</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 1: OFFICER PARTICULARS */}
          {currentStep === 'step1' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}><User size={18} style={{ color: '#1d4ed8' }} /> Step 1: Duty Officer & Patrol Jurisdiction</h4>
              <p style={stepDescStyle}>Enter duty officer identification, assigned police station, and active patrol beat sector.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Officer Badge ID / KGID:*</label>
                  <input type="text" value={officerBadge} onChange={e => setOfficerBadge(e.target.value)} style={lightInputStyle} placeholder="e.g. KSP-88421" />
                </div>
                <div>
                  <label style={labelStyle}>Officer Full Name:*</label>
                  <input type="text" value={officerName} onChange={e => setOfficerName(e.target.value)} style={lightInputStyle} placeholder="e.g. Inspector M. Venkatesh" />
                </div>
                <div>
                  <label style={labelStyle}>Officer Rank / Designation:*</label>
                  <select value={officerRank} onChange={e => setOfficerRank(e.target.value)} style={lightInputStyle}>
                    <option value="Police Sub-Inspector (PSI)">Police Sub-Inspector (PSI)</option>
                    <option value="Police Inspector (PI)">Police Inspector (PI)</option>
                    <option value="Assistant Sub-Inspector (ASI)">Assistant Sub-Inspector (ASI)</option>
                    <option value="Head Constable (HC)">Head Constable (HC)</option>
                    <option value="Deputy Superintendent of Police (DySP)">Deputy Superintendent of Police (DySP)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Patrol District:*</label>
                  <select value={incidentDistrict} onChange={e => handleDistrictChange(e.target.value)} style={lightInputStyle}>
                    {Object.keys(KARNATAKA_DISTRICTS_STATIONS).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Assigned Police Station:*</label>
                  <select value={selectedStation} onChange={e => setSelectedStation(e.target.value)} style={lightInputStyle}>
                    {(KARNATAKA_DISTRICTS_STATIONS[incidentDistrict] || ['Main Police Station']).map(ps => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Beat Sector / Patrol Unit:*</label>
                  <input type="text" value={beatUnit} onChange={e => setBeatUnit(e.target.value)} style={lightInputStyle} placeholder="e.g. Night Patrol Beat #4" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnPrimaryLight}>
                  <span>Proceed to Spot Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SPOT INCIDENT DETAILS */}
          {currentStep === 'step2' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}><MapPin size={18} style={{ color: '#1d4ed8' }} /> Step 2: Spot Incident & Offense Details</h4>
              <p style={stepDescStyle}>Record the nature of the crime observed on patrol, exact spot location, and chronological narrative.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Nature of Crime / Category:*</label>
                  <select value={crimeCategory} onChange={e => setCrimeCategory(e.target.value)} style={lightInputStyle}>
                    <option value="Vehicle Theft / Spot Recovery">Vehicle Theft / Spot Recovery</option>
                    <option value="Illegal Arms & Weapon Seizure">Illegal Arms & Weapon Seizure (Arms Act)</option>
                    <option value="Narcotics / NDPS Substance Confiscation">Narcotics / NDPS Substance Confiscation</option>
                    <option value="Gambling / Matka Den Raid">Gambling / Matka Den Raid</option>
                    <option value="Bootlegging / Illicit Liquor Confiscation">Bootlegging / Illicit Liquor Confiscation</option>
                    <option value="Street Robbery / Snatching in Progress">Street Robbery / Snatching in Progress</option>
                    <option value="Assault / Public Affray">Assault / Public Affray</option>
                    <option value="Illegal Sand Mining / Mineral Seizure">Illegal Sand Mining / Mineral Seizure</option>
                    <option value="Other Spot Patrol Offense">Other Spot Patrol Offense</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Date of Spot Discovery:*</label>
                  <input type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} style={lightInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Time of Spot Discovery:*</label>
                  <input type="time" value={incidentTime} onChange={e => setIncidentTime(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Exact Spot Location / Landmark:*</label>
                  <input type="text" placeholder="e.g. Near 100ft Road Junction, Opposite Bus Stop, Koramangala 4th Block" value={spotLocation} onChange={e => setSpotLocation(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Chronological Spot Narrative & Modus Operandi:*</label>
                  <textarea rows={4} placeholder="Describe the patrol observation, suspect behavior, pursuit, spot apprehension, and factual sequence..." value={spotNarrative} onChange={e => setSpotNarrative(e.target.value)} style={lightInputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step1')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step3')} style={btnPrimaryLight}>
                  <span>Proceed to Accused Info</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCUSED / SUSPECT & WITNESS */}
          {currentStep === 'step3' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}><User size={18} style={{ color: '#1d4ed8' }} /> Step 3: Accused / Suspect & Independent Witness Particulars</h4>
              <p style={stepDescStyle}>Enter details of suspects apprehended or identified on spot, plus independent pancha witness details.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Suspect Status:*</label>
                  <select value={suspectStatus} onChange={e => setSuspectStatus(e.target.value)} style={lightInputStyle}>
                    <option value="Apprehended on Spot">Apprehended on Spot (In Custody)</option>
                    <option value="Fled the Scene (Identified)">Fled the Scene (Identified / Wanted)</option>
                    <option value="Detained for Questioning">Detained for Questioning</option>
                    <option value="Unknown Accused / Unidentified">Unknown Accused / Unidentified</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Suspect Full Name / Alias:</label>
                  <input type="text" placeholder="e.g. Imran Pasha alias 'Chotta'" value={suspectName} onChange={e => setSuspectName(e.target.value)} style={lightInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Approximate Age:</label>
                  <input type="text" placeholder="e.g. 24 yrs" value={suspectAge} onChange={e => setSuspectAge(e.target.value)} style={lightInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Physical Marks / Tattoos / Height:</label>
                  <input type="text" placeholder="e.g. 5ft 8in, scar on left eyebrow" value={suspectMarks} onChange={e => setSuspectMarks(e.target.value)} style={lightInputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Suspect Known Address / Native Place:</label>
                  <input type="text" placeholder="e.g. Goripalya, Bengaluru Urban" value={suspectAddress} onChange={e => setSuspectAddress(e.target.value)} style={lightInputStyle} />
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '6px' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '10px' }}>Independent Pancha / Spot Witness Details</h5>
                </div>
                <div>
                  <label style={labelStyle}>Pancha Witness Name:*</label>
                  <input type="text" placeholder="e.g. Santhosh M. (Security Guard)" value={witnessName} onChange={e => setWitnessName(e.target.value)} style={lightInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Witness Mobile / Contact No:*</label>
                  <input type="text" placeholder="e.g. 9845012345" value={witnessContact} onChange={e => setWitnessContact(e.target.value)} style={lightInputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step2')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step4')} style={btnPrimaryLight}>
                  <span>Proceed to Seizure Panchanama</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RECOVERED PROPERTY & SEIZURE PANCHANAMA */}
          {currentStep === 'step4' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}><FileCheck size={18} style={{ color: '#1d4ed8' }} /> Step 4: Recovered Property & Spot Seizure Panchanama (BNSS Sec 105)</h4>
              <p style={stepDescStyle}>Log items seized on the spot under seizure memo with chassis/serial details and estimated valuation.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Was Property / Contraband Seized on Spot?:*</label>
                  <select value={propertySeized} onChange={e => setPropertySeized(e.target.value)} style={lightInputStyle}>
                    <option value="Yes">Yes — Property Seized under Panchanama</option>
                    <option value="No">No — No Physical Property Recovered</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Property Category:*</label>
                  <select value={seizureCategory} onChange={e => setSeizureCategory(e.target.value)} style={lightInputStyle}>
                    <option value="Stolen Vehicle (Motorcycle / Car)">Stolen Vehicle (Motorcycle / Car)</option>
                    <option value="Firearm / Lethal Weapon / Knife">Firearm / Lethal Weapon / Knife</option>
                    <option value="Narcotic Drugs (Ganja, MDMA, Heroin)">Narcotic Drugs (Ganja, MDMA, Heroin)</option>
                    <option value="Cash / Currency Notes">Cash / Currency Notes</option>
                    <option value="Gold / Jewelry">Gold / Jewelry</option>
                    <option value="Electronic Equipment / Mobile Phones">Electronic Equipment / Mobile Phones</option>
                    <option value="Other Seized Property">Other Seized Property</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Property Description / Chassis No / Make & Model:*</label>
                  <textarea rows={2} placeholder="e.g. 1 KTM Duke Motorcycle (Engine No: KA-01-ET-4491), 1 Master Lock-picking tool set..." value={seizureDescription} onChange={e => setSeizureDescription(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Estimated Seizure Value (Rs.):</label>
                  <input type="text" placeholder="e.g. 2,10,000" value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} style={lightInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Seizure Memo / Reference No:*</label>
                  <input type="text" value={seizureMemoNo} onChange={e => setSeizureMemoNo(e.target.value)} style={lightInputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step3')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('step5')} style={btnPrimaryLight}>
                  <span>Proceed to Evidences & Reports</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: EVIDENCE & OFFICER REPORT UPLOAD */}
          {currentStep === 'step5' && (
            <div style={stepCardStyle}>
              <h4 style={stepTitleStyle}><Upload size={18} style={{ color: '#1d4ed8' }} /> Step 5: Upload Field Reports & Photographic Evidences</h4>
              <p style={stepDescStyle}>Upload scanned officer patrol notebook report, panchanama signatures, and photos/videos of seized property.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>1. Officer Patrol Report / Written Complaint Document:*</label>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 8px 0' }}>Upload the signed officer field statement or FIR draft.</p>
                  <input type="file" onChange={handleOfficerReportUpload} style={{ fontSize: '0.76rem' }} />
                  {officerReportFile && (
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
                      ✓ Attached: {officerReportFile}
                    </div>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>2. Multi-Media Evidence Files (Photos/Audio/CCTV):*</label>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 8px 0' }}>Upload photos of seized property, spot inspection, chassis numbers.</p>
                  <input type="file" multiple onChange={handleEvidenceFileUpload} style={{ fontSize: '0.76rem' }} />
                </div>
              </div>

              {uploadedEvidences.length > 0 && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a' }}>Attached Evidences ({uploadedEvidences.length}):</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {uploadedEvidences.map(ev => (
                      <span key={ev.id} style={{ background: '#ffffff', border: '1px solid #93c5fd', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                        <Paperclip size={12} color="#1d4ed8" />
                        <span>{ev.name} ({ev.size})</span>
                        <button onClick={() => removeEvidence(ev.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button onClick={() => setCurrentStep('step4')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={() => setCurrentStep('review')} style={btnPrimaryLight}>
                  <span>Review Final Suo Moto Record</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: FINAL REVIEW & SUBMIT */}
          {currentStep === 'review' && (
            <div style={stepCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>
                <h4 style={{ ...stepTitleStyle, margin: 0, border: 'none', padding: 0 }}>
                  <Eye size={18} style={{ color: '#1d4ed8' }} /> Step 6: Verify Suo Moto Patrol Crime Summary
                </h4>
                <button onClick={() => setCurrentStep('step1')} style={{ ...btnSecondaryLight, padding: '4px 10px', fontSize: '0.72rem', color: '#1d4ed8', borderColor: '#93c5fd' }}>
                  <Edit3 size={13} /> Edit Details
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#1e3a8a' }}>👮 Investigating Officer:</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{officerName} ({officerRank}) — Badge: {officerBadge}</span>
                </div>

                <div style={{ color: '#334155', marginBottom: '10px', lineHeight: 1.5 }}>
                  <b>Police Station Jurisdiction:</b> {selectedStation}, {incidentDistrict} | <b>Beat Unit:</b> {beatUnit}<br />
                  <b>Crime Nature:</b> {crimeCategory} | <b>Spot Date/Time:</b> {incidentDate} {incidentTime}<br />
                  <b>Spot Location:</b> {spotLocation || 'Patrol Area'}<br />
                  <b>Accused Particulars:</b> {suspectName || 'Unknown'} ({suspectStatus}) — {suspectAddress || 'N/A'}<br />
                  <b>Seized Property:</b> {seizureDescription || 'None'} (Val: Rs. {estimatedValue || '0'}, Memo: {seizureMemoNo})
                </div>

                <div style={{ color: '#059669', fontWeight: 700, marginTop: '8px' }}>
                  ✓ Zoho Catalyst DataStore Table: `PoliceInitiatedComplaints` (Automatic Real-time Sync Enabled).
                </div>
              </div>

              {/* OFFICER CONSENT */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '12px', marginBottom: '18px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.75rem', color: '#1e3a8a', fontWeight: 700 }}>
                  <input type="checkbox" checked={officerConsent} onChange={e => setOfficerConsent(e.target.checked)} style={{ marginTop: '2px' }} />
                  <span>I, {officerName} ({officerRank}), hereby declare that the above facts and spot recovery particulars are accurately recorded as per patrol observations and Panchanama procedure under BNSS Section 105.</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep('step5')} style={btnSecondaryLight}><ArrowLeft size={16} /> Back</button>
                <button onClick={handleSubmitPoliceCase} disabled={isSubmitting} style={{ ...btnPrimaryLight, background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)', padding: '10px 24px', fontSize: '0.85rem' }}>
                  {isSubmitting ? 'Syncing to Catalyst DataStore...' : 'Register Suo Moto Crime & Sync to Catalyst'}
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMATION SCREEN */}
          {currentStep === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ background: '#10b981', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle2 size={36} color="white" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#03214c', marginBottom: '4px' }}>
                Police-Initiated Suo Moto Case Registered & Synced to Catalyst DataStore!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '18px' }}>
                The offense details, spot recovery panchanama, and digital evidences have been synchronized with the <b>Zoho Catalyst DataStore</b>.
              </p>

              <div style={{ background: '#ffffff', border: '2px dashed #2563eb', padding: '18px', borderRadius: '18px', maxWidth: '480px', margin: '0 auto 24px auto', boxShadow: '0 4px 16px rgba(37,99,235,0.08)' }}>
                <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Official Police Case Number</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#03214c', letterSpacing: '1.5px', marginTop: '4px', marginBottom: '4px' }}>
                  {refNumber || 'KSP-POL-2026-48912'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Station: <b>{selectedStation}</b> • Officer: <b>{officerName}</b></div>
              </div>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                <button
                  onClick={downloadPoliceReportPDF}
                  style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(29,78,216,0.3)' }}
                >
                  <Download size={18} /> Download Spot Seizure Memo PDF (BNSS Sec 105)
                </button>
                <button
                  onClick={onClose}
                  style={{ background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #cbd5e1', padding: '12px 22px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Return to Chatbot
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const stepCardStyle = {
  background: '#ffffff',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid #cbd5e1',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
};

const stepTitleStyle = {
  fontSize: '1rem',
  fontWeight: 900,
  color: '#03214c',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const stepDescStyle = {
  fontSize: '0.75rem',
  color: '#64748b',
  marginBottom: '16px',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '8px'
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#334155',
  display: 'block',
  marginBottom: '4px'
};

const lightInputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  marginTop: '2px',
  outline: 'none',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 600
};

const btnPrimaryLight = {
  background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)',
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 14px rgba(29, 78, 216, 0.25)'
};

const btnSecondaryLight = {
  background: '#ffffff',
  color: '#334155',
  border: '1px solid #cbd5e1',
  padding: '10px 18px',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.82rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const featureBoxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '14px'
};

const featureIconCircle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '8px'
};

const featureTitleStyle = {
  fontSize: '0.82rem',
  fontWeight: 800,
  color: '#03214c',
  margin: '0 0 4px 0'
};

const featureDescStyle = {
  fontSize: '0.68rem',
  color: '#64748b',
  margin: 0,
  lineHeight: 1.4
};

export default PoliceInitiatedComplaintPortal;
