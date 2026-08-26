/**
 * KSP Document RAG Pipeline (Node.js Edition)
 * Main Export Module
 */

import { DocumentQaService } from './documentQaService.js';
import { classifyQuery, isDocumentQuery } from './documentClassifier.js';
import { extractGroundedDocumentAnswer, extractStructuredFacts } from './documentExtractor.js';
import { DocumentRetriever, DocumentChunk, chunkText } from './documentRetriever.js';

export {
  DocumentQaService,
  classifyQuery,
  isDocumentQuery,
  extractGroundedDocumentAnswer,
  extractStructuredFacts,
  DocumentRetriever,
  DocumentChunk,
  chunkText
};

export default {
  DocumentQaService,
  classifyQuery,
  isDocumentQuery,
  extractGroundedDocumentAnswer,
  extractStructuredFacts,
  DocumentRetriever,
  DocumentChunk,
  chunkText
};
