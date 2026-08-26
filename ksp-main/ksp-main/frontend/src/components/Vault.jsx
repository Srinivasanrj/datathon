import React, { useState, useEffect } from 'react';
import { FileKey2, FileText, Download, Database, Upload, Trash2, Cpu, CheckCircle } from 'lucide-react';

function Vault({ documents, onAddDocument }) {
  const [ragDatasets, setRagDatasets] = useState([]);
  const [loadingRag, setLoadingRag] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDatasets = async () => {
    setLoadingRag(true);
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (data.success) {
        setRagDatasets(data.datasets);
      }
    } catch (err) {
      console.error("Failed to fetch RAG datasets:", err);
    } finally {
      setLoadingRag(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDownload = (doc) => {
    if (doc.type === 'default') {
      alert("Downloading Citizen Safety Handbook...");
    } else if (doc.type === 'compiled' && doc.downloadFn) {
      doc.downloadFn();
    }
  };

  const handleVaultUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload_dataset', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(`Success! File '${data.filename}' indexed with ${data.chunks_indexed} RAG vector chunks.`);
        fetchDatasets();
        if (onAddDocument) {
          onAddDocument({
            id: 'rag-' + Date.now(),
            name: data.filename,
            type: 'compiled',
            size: data.file_size,
            date: 'RAG Indexed'
          });
        }
      } else {
        alert("Upload error: " + (data.error || "Failed to process file"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error uploading dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (filename) => {
    if (!confirm(`Are you sure you want to remove '${filename}' from RAG Knowledge Store?`)) return;
    try {
      const res = await fetch(`/api/datasets/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDatasets();
      }
    } catch (err) {
      console.error("Error deleting dataset:", err);
    }
  };

  return (
    <div className="vault-content">
      <div>
        <h3 className="section-title">Encrypted Vault & RAG Knowledge Store</h3>
        <p className="section-desc">Active dataset files and vector-indexed RAG documents for RAG Knowledge retrieval.</p>
      </div>

      {/* RAG Knowledge Store Section */}
      <div className="chart-card" style={{ padding: '14px', background: 'rgba(37, 99, 235, 0.04)', borderColor: 'rgba(37, 99, 235, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
            <Cpu size={16} /> RAG Datasets & Vector Store
          </div>
          <label className="calc-trigger-btn" style={{ background: 'var(--primary)', padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Upload size={12} /> Upload PDF / CSV
            <input type="file" accept=".pdf,.csv,.json,.txt" style={{ display: 'none' }} onChange={handleVaultUpload} />
          </label>
        </div>

        {uploading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '6px', textAlign: 'center', fontWeight: 600 }}>
            ⚡ Parsing, chunking & updating SQLite & RAG Knowledge Store...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {ragDatasets.map((ds) => (
            <div key={ds.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--surface-border)', padding: '8px 10px', borderRadius: '10px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={14} style={{ color: ds.file_type === 'pdf' ? 'var(--danger)' : 'var(--success)' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ds.filename}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {ds.file_type.toUpperCase()} • {ds.record_count} Records/Chunks • {ds.upload_date}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--success)', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 6px', borderRadius: '100px', fontWeight: 600 }}>
                  <CheckCircle size={8} style={{ display: 'inline', marginRight: '2px' }} /> Active
                </span>
                {ds.id.startsWith('ds-') && (
                  <Trash2 size={12} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => handleDeleteDataset(ds.filename)} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compiled Local PDF Vault Section */}
      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '6px' }}>
        Compiled Case Documents & Certificates
      </h4>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '16px' }}>
          No custom reports compiled yet. Use the Chatbot to report a Cyber Scam.
        </div>
      ) : (
        documents.map((doc) => (
          <div className="vault-item" key={doc.id}>
            <div className="vault-info">
              <div className={`vault-icon ${doc.type === 'compiled' ? 'pdf' : ''}`}>
                {doc.type === 'compiled' ? <FileText size={20} /> : <FileKey2 size={20} />}
              </div>
              <div className="vault-details">
                <h5>{doc.name}</h5>
                <p>{doc.date} • {doc.size}</p>
              </div>
            </div>
            <div className="vault-action" onClick={() => handleDownload(doc)}>
              <Download size={16} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Vault;
