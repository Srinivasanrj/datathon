/**
 * Document Passage Retriever (Node.js)
 * Chunks documents and retrieves top-k relevant passages using keyword density
 * and term-frequency scoring.
 */

export class DocumentChunk {
  constructor(chunkId, text, startChar, endChar, docName, docType = 'document') {
    this.chunkId = chunkId;
    this.text = text;
    this.startChar = startChar;
    this.endChar = endChar;
    this.docName = docName;
    this.docType = docType;
  }
}

export function chunkText(text, docName = 'document', docType = 'document', chunkSize = 400, chunkOverlap = 80) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return [];
  }

  const cleanText = text.trim();
  const chunks = [];

  if (cleanText.length <= chunkSize) {
    return [new DocumentChunk(0, cleanText, 0, cleanText.length, docName, docType)];
  }

  const step = Math.max(1, chunkSize - chunkOverlap);
  let idx = 0;
  let chunkId = 0;

  while (idx < cleanText.length) {
    let end = Math.min(cleanText.length, idx + chunkSize);

    if (end < cleanText.length) {
      let lastBreak = cleanText.lastIndexOf('\n', end);
      if (lastBreak === -1 || lastBreak < idx + step) {
        lastBreak = cleanText.lastIndexOf(' ', end);
      }
      if (lastBreak !== -1 && lastBreak > idx) {
        end = lastBreak;
      }
    }

    const chunkStr = cleanText.slice(idx, end).trim();
    if (chunkStr) {
      chunks.push(new DocumentChunk(chunkId, chunkStr, idx, end, docName, docType));
      chunkId++;
    }

    idx += step;
  }

  return chunks;
}

export class DocumentRetriever {
  constructor() {
    this.chunks = [];
    this.documents = new Map();
  }

  indexDocument(filename, content, docType = 'document', chunkSize = 400, chunkOverlap = 80) {
    const newChunks = chunkText(content, filename, docType, chunkSize, chunkOverlap);
    this.chunks = this.chunks.filter(c => c.docName !== filename);
    this.chunks.push(...newChunks);

    this.documents.set(filename, {
      filename,
      docType,
      content,
      chunkCount: newChunks.length
    });

    return newChunks;
  }

  clear() {
    this.chunks = [];
    this.documents.clear();
  }

  retrieve(query, topK = 3) {
    if (!query || this.chunks.length === 0) {
      return [];
    }

    const qTerms = query.toLowerCase().match(/\w+/g)?.filter(t => t.length > 2) || [query.toLowerCase().trim()];
    const scored = [];

    for (const chunk of this.chunks) {
      const cText = chunk.text.toLowerCase();
      let score = 0.0;

      if (cText.includes(query.toLowerCase().trim())) {
        score += 5.0;
      }

      let matches = 0;
      for (const term of qTerms) {
        if (cText.includes(term)) {
          matches++;
          const termCount = (cText.match(new RegExp(term, 'g')) || []).length;
          score += termCount * 1.2;
        }
      }

      if (qTerms.length > 0) {
        score += (matches / qTerms.length) * 3.0;
      }

      if (score > 0) {
        const normScore = Math.min(0.99, Math.max(0.40, score / (qTerms.length * 2.0 + 3.0)));
        scored.push({
          chunkId: chunk.chunkId,
          docName: chunk.docName,
          docType: chunk.docType,
          text: chunk.text,
          score: Math.round(normScore * 100) / 100,
          startChar: chunk.startChar,
          endChar: chunk.endChar
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0 && this.chunks.length > 0) {
      const c0 = this.chunks[0];
      scored.push({
        chunkId: c0.chunkId,
        docName: c0.docName,
        docType: c0.docType,
        text: c0.text,
        score: 0.50,
        startChar: c0.startChar,
        endChar: c0.endChar
      });
    }

    return scored.slice(0, topK);
  }
}

export default {
  DocumentChunk,
  chunkText,
  DocumentRetriever
};
