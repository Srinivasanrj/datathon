/**
 * Example Usage: Node.js Document RAG Pipeline
 * Run with: node examples.js
 */

import { DocumentQaService, classifyQuery, extractStructuredFacts } from './index.js';

const rag = new DocumentQaService();
const sessionId = 'officer_node_session_01';

const sampleFir = `KARNATAKA STATE POLICE
FIRST INFORMATION REPORT (Under Section 154 Cr.PC)
District: Shivamogga | Circle: Shimoga Sub-Division | PS: Doddapete PS
Crime No: 0077/2022 | FIR Date: 21/02/2022
Act & Section: IPC 1860 (U/s-302,34)
Place of occurrence: Opposite kamath petrol bunk Bharathi colony cross, NT Road, Shivamogga
Complainant: Smt Padma (Age 52, Housewife)
Accused: Suresh Patel and Ramesh Kumar
Details: Murder and conspiracy under IPC Section 302, 34.`;

console.log('='.repeat(70));
console.log('  KSP DOCUMENT RAG PIPELINE — NODE.JS DEMONSTRATION');
console.log('='.repeat(70));

// 1. Ingest Document
console.log('\n1. Indexing Document into RAG Store...');
const indexRes = rag.indexDocument(sessionId, 'FIR_0077_2022.webp', sampleFir, 'Image/OCR Document');
console.log(`-> Document indexed: ${indexRes.filename} (${indexRes.chunkCount} vector chunks)`);

// 2. Query Classification
console.log('\n2. Testing Query Classification...');
const testQueries = [
  'What is the accused name?',
  'highest crime in Bengaluru Urban',
  'Based on the FIR, what crime occurred and how common is that crime in Bengaluru?',
  'hi'
];

for (const q of testQueries) {
  const qType = rag.classify(q, sessionId);
  console.log(`Query: "${q}" -> Classification: [${qType}]`);
}

// 3. Grounded Q&A Execution
console.log('\n3. Grounded Question Answering...');
const docQuestions = [
  'What is the accused name?',
  'What sections are mentioned in the FIR?',
  'Where did the incident happen?',
  'Who is the complainant?',
  'Summarize this FIR'
];

for (const q of docQuestions) {
  const res = rag.answerQuery(q, sessionId);
  console.log(`\nQ: ${q}`);
  console.log(`A: ${res.answer}`);
  console.log(`Source: ${res.sources[0]?.docName} (Match: ${res.sources[0]?.score * 100}%)`);
}

// 4. Extract Structured Facts
console.log('\n4. Extracting Structured Metadata Facts...');
const facts = rag.getStructuredFacts(sessionId);
for (const [k, v] of Object.entries(facts)) {
  if (k !== 'rawContent') {
    console.log(`  • ${k}: ${v}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('  NODE.JS DEMO COMPLETED SUCCESSFULLY');
console.log('='.repeat(70));
