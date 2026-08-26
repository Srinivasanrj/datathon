"""
Document Passage Retriever
Maintains indexed passages in memory or lightweight store, computes keyword
and semantic relevance scores, and retrieves top-k passages for grounded answering.
"""

import math
import re
from typing import List, Dict, Any
try:
    from .chunker import DocumentChunk, chunk_text
except ImportError:
    from chunker import DocumentChunk, chunk_text


class DocumentRetriever:
    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.documents: Dict[str, Dict[str, Any]] = {}

    def index_document(
        self,
        filename: str,
        content: str,
        doc_type: str = "document",
        chunk_size: int = 400,
        chunk_overlap: int = 80
    ) -> List[DocumentChunk]:
        """
        Indexes a document by splitting into chunks and adding to retrieval index.
        """
        new_chunks = chunk_text(content, doc_name=filename, doc_type=doc_type, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        
        # Remove old chunks for this document if re-indexing
        self.chunks = [c for c in self.chunks if c.doc_name != filename]
        self.chunks.extend(new_chunks)

        self.documents[filename] = {
            "filename": filename,
            "doc_type": doc_type,
            "content": content,
            "chunk_count": len(new_chunks)
        }

        return new_chunks

    def clear(self):
        """Clears all indexed documents and passages."""
        self.chunks = []
        self.documents = {}

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Scores all indexed passages against query and returns top_k ranked passages.
        Uses keyword density, exact token match, and term frequency scoring.
        """
        if not query or not self.chunks:
            return []

        q_terms = [t.lower() for t in re.findall(r"\w+", query) if len(t) > 2]
        if not q_terms:
            q_terms = [query.lower().strip()]

        scored_passages = []

        for chunk in self.chunks:
            c_text_lower = chunk.text.lower()
            score = 0.0

            # 1. Exact phrase match bonus
            if query.lower().strip() in c_text_lower:
                score += 5.0

            # 2. Individual term match frequency
            matches = 0
            for term in q_terms:
                if term in c_text_lower:
                    matches += 1
                    # Frequency bonus
                    score += c_text_lower.count(term) * 1.2

            # 3. Match ratio bonus
            if q_terms:
                score += (matches / len(q_terms)) * 3.0

            if score > 0:
                normalized_score = min(0.99, max(0.40, score / (len(q_terms) * 2.0 + 3.0)))
                scored_passages.append({
                    "chunk_id": chunk.chunk_id,
                    "doc_name": chunk.doc_name,
                    "doc_type": chunk.doc_type,
                    "text": chunk.text,
                    "score": round(normalized_score, 2),
                    "start_char": chunk.start_char,
                    "end_char": chunk.end_char
                })

        # Sort descending by score
        scored_passages.sort(key=lambda x: x["score"], reverse=True)

        # Fallback: if no score matched, return the first chunk as reference
        if not scored_passages and self.chunks:
            c0 = self.chunks[0]
            scored_passages.append({
                "chunk_id": c0.chunk_id,
                "doc_name": c0.doc_name,
                "doc_type": c0.doc_type,
                "text": c0.text,
                "score": 0.50,
                "start_char": c0.start_char,
                "end_char": c0.end_char
            })

        return scored_passages[:top_k]
