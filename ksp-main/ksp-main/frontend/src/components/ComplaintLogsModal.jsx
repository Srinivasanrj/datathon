import React, { useState, useEffect } from 'react';
import { Shield, FileText, Search, X, CheckCircle2, User, MapPin, Calendar, Lock, Download, RefreshCw, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';

function ComplaintLogsModal({ currentUser, onClose }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const isHead = currentUser?.username?.includes('.head') || currentUser?.unitName?.includes('Division Head') || currentUser?.unitName?.includes('Head');
  const userUnit = currentUser?.unitName || 'Bengaluru Urban';

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const url = `/api/complaints?station=${encodeURIComponent(userUnit)}&is_head=${isHead}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [userUnit, isHead]);

  const filteredComplaints = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.reference_number?.toLowerCase().includes(q) ||
      c.complainant?.full_name?.toLowerCase().includes(q) ||
      c.complainant?.mobile?.includes(q) ||
      c.incident?.nature?.toLowerCase().includes(q) ||
      c.incident?.police_station?.toLowerCase().includes(q)
    );
  });

  const downloadPDF = (c) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KARNATAKA STATE POLICE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(`OFFICIAL e-COMPLAINT RECORD — ${c.reference_number}`, 105, 27, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    
    let y = 40;
    doc.text(`Complainant Name: ${c.complainant?.full_name}`, 20, y); y += 6;
    doc.text(`Contact: ${c.complainant?.mobile} | Email: ${c.complainant?.email || 'N/A'}`, 20, y); y += 6;
    doc.text(`ID Proof: ${c.complainant?.id_proof_type} (${c.complainant?.id_proof_number})`, 20, y); y += 6;
    doc.text(`Address: ${c.complainant?.present_address}, ${c.complainant?.district}`, 20, y); y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENT DETAILS:', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nature: ${c.incident?.nature} | Date: ${c.incident?.date_from}`, 20, y); y += 6;
    doc.text(`Police Station: ${c.incident?.police_station}`, 20, y); y += 6;
    doc.text(`Location: ${c.incident?.location}`, 20, y); y += 6;
    doc.text(`Description: ${c.incident?.description}`, 20, y); y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('STATUS & ASSIGNMENT:', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${c.status}`, 20, y); y += 6;
    doc.text(`Assigned Officer: ${c.assigned_officer}`, 20, y);

    doc.save(`eComplaint_${c.reference_number}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
      zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff', width: '100%', maxWidth: '900px', maxHeight: '90vh',
        borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1.5px solid #cbd5e1'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)', color: 'white',
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>
                {isHead ? '🏛️ Divisional Registered Complaints Master Record' : `🔒 ${userUnit} Station Registered Complaints`}
              </h3>
              <p style={{ fontSize: '0.68rem', color: '#bfdbfe', margin: 0 }}>
                {isHead ? 'Division Head View: Accessing all subdivision e-FIR & complaint applications' : `Station House Officer Console • Restricted to ${userUnit} Police Station`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, maxWidth: '400px' }}>
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search reference #, complainant name, mobile or nature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.78rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e3a8a', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              Showing {filteredComplaints.length} Records
            </span>
            <button onClick={fetchComplaints} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading SCRB Complaint Records...</div>
          ) : filteredComplaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No complaint applications found for current criteria.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredComplaints.map((c) => (
                <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'Outfit, sans-serif' }}>{c.reference_number}</span>
                      <span style={{ fontSize: '0.62rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>{c.incident?.nature}</span>
                      <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 700 }}>
                      👤 Complainant: {c.complainant?.full_name} (+91 {c.complainant?.mobile})
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      📍 Police Station: <b>{c.incident?.police_station}</b> ({c.incident?.district}) • Filed: {c.created_at}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> View Full
                    </button>
                    <button
                      onClick={() => downloadPDF(c)}
                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={13} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FULL COMPLAINT INSPECTION MODAL */}
        {selectedComplaint && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '650px', borderRadius: '16px', padding: '20px', maxHeight: '80vh', overflowY: 'auto', border: '2px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid #eff6ff', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e3a8a' }}>e-Complaint Details: {selectedComplaint.reference_number}</h4>
                <button onClick={() => setSelectedComplaint(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ fontSize: '0.76rem', lineHeight: 1.6, color: '#334155' }}>
                <p><b>Complainant:</b> {selectedComplaint.complainant?.full_name} ({selectedComplaint.complainant?.gender}, DOB: {selectedComplaint.complainant?.dob})</p>
                <p><b>Mobile:</b> {selectedComplaint.complainant?.mobile} | <b>Email:</b> {selectedComplaint.complainant?.email}</p>
                <p><b>Address:</b> {selectedComplaint.complainant?.present_address}, {selectedComplaint.complainant?.district}</p>
                <p><b>ID Proof:</b> {selectedComplaint.complainant?.id_proof_type} ({selectedComplaint.complainant?.id_proof_number})</p>
                <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />
                <p><b>Nature of Crime:</b> {selectedComplaint.incident?.nature}</p>
                <p><b>Date & Time:</b> {selectedComplaint.incident?.date_from} at {selectedComplaint.incident?.time_from}</p>
                <p><b>Police Station:</b> {selectedComplaint.incident?.police_station}</p>
                <p><b>Location:</b> {selectedComplaint.incident?.location}</p>
                <p><b>Description:</b> {selectedComplaint.incident?.description}</p>
                <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />
                <p><b>Property Stolen/Damaged:</b> {selectedComplaint.evidence?.property_stolen ? 'Yes' : 'No'} ({selectedComplaint.evidence?.property_type} - Rs. {selectedComplaint.evidence?.estimated_value})</p>
                <p><b>Item Info:</b> {selectedComplaint.evidence?.item_description}</p>
                <p><b>Suspect Info:</b> {selectedComplaint.suspect?.name || 'Unknown'}</p>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => downloadPDF(selectedComplaint)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>Download Official PDF</button>
                <button onClick={() => setSelectedComplaint(null)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ComplaintLogsModal;
