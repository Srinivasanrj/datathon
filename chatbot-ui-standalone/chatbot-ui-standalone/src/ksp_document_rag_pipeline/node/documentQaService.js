/**
 * High-Level Document RAG QA Service (Node.js)
 * Manages document ingestion, chunking, query classification, passage retrieval,
 * and grounded answering.
 */

import { DocumentRetriever } from './documentRetriever.js';
import { extractGroundedDocumentAnswer, extractStructuredFacts } from './documentExtractor.js';
import { classifyQuery } from './documentClassifier.js';

export class DocumentQaService {
  constructor(options = {}) {
    this.sessionRetrievers = new Map();
    this.sessionDocs = new Map();
    this.options = options;
  }

  getRetriever(sessionId = 'default') {
    if (!this.sessionRetrievers.has(sessionId)) {
      this.sessionRetrievers.set(sessionId, new DocumentRetriever());
    }
    return this.sessionRetrievers.get(sessionId);
  }

  indexDocument(sessionId, filename, content, docType = 'document', chunkSize = 400, chunkOverlap = 80) {
    const retriever = this.getRetriever(sessionId);
    const chunks = retriever.indexDocument(filename, content, docType, chunkSize, chunkOverlap);

    const docMeta = {
      filename,
      docType,
      content,
      chunkCount: chunks.length,
      indexedAt: new Date().toISOString()
    };

    this.sessionDocs.set(sessionId, docMeta);

    return {
      success: true,
      filename,
      docType,
      chunkCount: chunks.length,
      sessionId
    };
  }

  getActiveDocument(sessionId = 'default') {
    return this.sessionDocs.get(sessionId) || null;
  }

  classify(query, sessionId = 'default', context = {}) {
    const activeDoc = this.getActiveDocument(sessionId);
    return classifyQuery(query, activeDoc, context);
  }

  answerQuery(query, sessionId = 'default', options = {}) {
    const activeDoc = this.getActiveDocument(sessionId);
    if (!activeDoc) {
      return {
        success: false,
        answer: 'No document has been uploaded in this session.',
        ragUsed: false,
        sources: []
      };
    }

    const retriever = this.getRetriever(sessionId);
    const topK = options.topK || 3;
    const passages = retriever.retrieve(query, topK);

    // Generate grounded deterministic answer
    const answer = extractGroundedDocumentAnswer(query, activeDoc.filename, activeDoc.content);

    return {
      success: true,
      answer,
      ragUsed: true,
      filename: activeDoc.filename,
      docType: activeDoc.docType,
      sources: passages.map(p => ({
        docName: p.docName,
        docType: p.docType,
        score: p.score,
        passage: p.text
      }))
    };
  }

  getStructuredFacts(sessionId = 'default') {
    const activeDoc = this.getActiveDocument(sessionId);
    if (!activeDoc) return null;
    return extractStructuredFacts(activeDoc.filename, activeDoc.content);
  }

  clearSession(sessionId = 'default') {
    if (this.sessionRetrievers.has(sessionId)) {
      this.sessionRetrievers.get(sessionId).clear();
      this.sessionRetrievers.delete(sessionId);
    }
    this.sessionDocs.delete(sessionId);
  }
}

export default DocumentQaService;
