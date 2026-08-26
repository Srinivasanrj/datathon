/**
 * ZOHO CATALYST DATASTORE AUTOMATIC POLICE-INITIATED COMPLAINT SYNC SERVICE
 * Handles real-time INSERT, UPDATE, and ZCQL query execution for PoliceInitiatedComplaints table.
 */

import { savePoliceComplaint, getPoliceComplaints } from '../dataset/police_complaint_catalyst_dataset';

/**
 * Automatically pushes new police-initiated / suo-motu case to Catalyst DataStore
 */
export async function pushPoliceCaseToCatalyst(caseData) {
  console.log('📡 Pushing Police-Initiated Case to Catalyst DataStore...', caseData.CaseId || caseData.id);

  // 1. Save to local synchronized state engine
  const savedRecord = savePoliceComplaint(caseData);

  // 2. POST to KSP Flask backend /api/submit_police_case
  const PROXY_URL = '/catalyst-api/server/submit_police_case/';
  const DIRECT_CLOUD_URL = 'https://kspcrimeintelligenceplatform-60077159195.development.catalystserverless.in/server/submit_police_case/';
  const BACKEND_URL = '/api/submit_police_case';

  const catalystPayload = {
    CaseId: String(savedRecord.CaseId || caseData.CaseId || 'KSP-POL-2026-00000'),
    FirNumber: String(savedRecord.FirNumber || caseData.FirNumber || 'FIR-2026-BLR-0000'),
    OfficerBadge: String(savedRecord.OfficerBadge || caseData.OfficerBadge || 'KGID-00000'),
    OfficerName: String(savedRecord.OfficerName || caseData.OfficerName || 'Duty Officer'),
    OfficerRank: String(savedRecord.OfficerRank || caseData.OfficerRank || 'Police Sub-Inspector (PSI)'),
    Division: String(savedRecord.Division || caseData.Division || 'Bengaluru'),
    SubDivision: String(savedRecord.SubDivision || caseData.SubDivision || 'Bengaluru Urban'),
    PoliceStation: String(savedRecord.PoliceStation || caseData.PoliceStation || 'Central PS'),
    BeatUnit: String(savedRecord.BeatUnit || caseData.BeatUnit || 'Beat Sector 1'),
    CrimeCategory: String(savedRecord.CrimeCategory || caseData.CrimeCategory || 'Spot Operation'),
    IncidentDate: String(savedRecord.IncidentDate || caseData.IncidentDate || new Date().toISOString().split('T')[0]),
    SpotLocation: String(savedRecord.SpotLocation || caseData.SpotLocation || 'Karnataka'),
    SpotNarrative: String(savedRecord.SpotNarrative || caseData.SpotNarrative || 'Patrol discovery logged.'),
    SuspectStatus: String(savedRecord.SuspectStatus || caseData.SuspectStatus || 'Apprehended'),
    SuspectName: String(savedRecord.SuspectName || caseData.SuspectName || 'Unknown Accused'),
    SuspectDetails: String(savedRecord.SuspectDetails || caseData.SuspectDetails || 'N/A'),
    SeizedItems: String(savedRecord.SeizedItems || caseData.SeizedItems || 'No property listed'),
    SeizureValue: String(savedRecord.SeizureValue || caseData.SeizureValue || '0'),
    PanchaWitness: String(savedRecord.PanchaWitness || caseData.PanchaWitness || 'Independent Witness'),
    EvidenceCount: String(savedRecord.EvidenceCount || caseData.EvidenceCount || '1'),
    CaseStatus: String(savedRecord.CaseStatus || caseData.CaseStatus || 'ACCUSED_IN_CUSTODY'),
    FilingTimestamp: String(savedRecord.FilingTimestamp || caseData.FilingTimestamp || new Date().toISOString()),
    InvestigationSummary: String(savedRecord.InvestigationSummary || caseData.InvestigationSummary || 'Officer initiated investigation on spot.')
  };

  // 1. Post to Catalyst Cloud via Proxy
  let catalystSuccess = false;
  try {
    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalystPayload)
      });
    } catch (proxyErr) {
      console.warn('Proxy route unavailable, trying direct cloud endpoint...', proxyErr);
    }

    if (!response || !response.ok) {
      response = await fetch(DIRECT_CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalystPayload)
      });
    }

    if (response && response.ok) {
      const data = await response.json();
      console.log('✅ Catalyst DataStore PoliceInitiatedComplaints row written! Result:', data);
      catalystSuccess = true;
    }
  } catch (err) {
    console.warn('⚠️ Catalyst Cloud API call error:', err);
  }

  // 2. Also post to local backend store for synchronization
  try {
    await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalystPayload)
    });
  } catch (e) {}

  return { success: true, record: savedRecord, catalystSuccess };
}

/**
 * Automatically updates case status in Catalyst DataStore
 */
export async function updatePoliceCaseInCatalyst(caseIdOrFir, updates = {}) {
  console.log('🔄 Updating Police Case in Catalyst DataStore:', caseIdOrFir, updates);

  const records = getPoliceComplaints();
  const index = records.findIndex(r => r.CaseId === caseIdOrFir || r.FirNumber === caseIdOrFir);

  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    try {
      localStorage.setItem('ksp_police_initiated_cases_v1', JSON.stringify(records));
      window.dispatchEvent(new CustomEvent('ksp-police-case-updated', { detail: { updated: records[index] } }));
    } catch (e) {}

    // Cloud ZCQL Update
    try {
      if (typeof window !== 'undefined' && window.catalyst && window.catalyst.zcql) {
        const updateSet = Object.entries(updates)
          .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
          .join(', ');
        
        await window.catalyst.zcql().executeZCQLQuery(
          `UPDATE PoliceInitiatedComplaints SET ${updateSet} WHERE CaseId = '${records[index].CaseId}'`
        );
        console.log('✅ Catalyst Cloud update completed for Police Case:', records[index].CaseId);
      }
    } catch (cloudErr) {
      console.warn('Catalyst ZCQL update warning:', cloudErr);
    }

    return records[index];
  }

  return null;
}

export default {
  pushPoliceCaseToCatalyst,
  updatePoliceCaseInCatalyst
};
