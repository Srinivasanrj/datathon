"""
Unified Document RAG Pipeline (Python)
Provides a clean, modular, session-scoped API for document ingestion,
OCR processing, semantic passage retrieval, and grounded Q&A.
"""

import logging
from typing import Dict, Any, Optional, List
try:
    from .ingestion import extract_text_from_file
    from .retriever import DocumentRetriever
    from .extractor import extract_facts, extract_grounded_answer
except ImportError:
    from ingestion import extract_text_from_file
    from retriever import DocumentRetriever
    from extractor import extract_facts, extract_grounded_answer

logger = logging.getLogger(__name__)


class DocumentRagPipeline:
    def __init__(self):
        # Maps session_id -> DocumentRetriever instance
        self._session_retrievers: Dict[str, DocumentRetriever] = {}
        # Maps session_id -> active document metadata
        self._session_docs: Dict[str, Dict[str, Any]] = {}

    def _get_retriever(self, session_id: str) -> DocumentRetriever:
        if session_id not in self._session_retrievers:
            self._session_retrievers[session_id] = DocumentRetriever()
        return self._session_retrievers[session_id]

    def ingest_file(
        self,
        file_bytes: bytes,
        filename: str,
        session_id: str = "default_session",
        chunk_size: int = 400,
        chunk_overlap: int = 80
    ) -> Dict[str, Any]:
        """
        Ingests a file (PDF, Image, Text, CSV, JSON), runs OCR if applicable,
        chunks text, and indexes it in the session store.
        """
        doc_data = extract_text_from_file(file_bytes, filename)
        retriever = self._get_retriever(session_id)
        
        chunks = retriever.index_document(
            filename=doc_data["filename"],
            content=doc_data["content"],
            doc_type=doc_data["doc_type"],
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        doc_summary = {
            "success": True,
            "filename": doc_data["filename"],
            "doc_type": doc_data["doc_type"],
            "content": doc_data["content"],
            "file_size": doc_data["file_size"],
            "chunks_count": len(chunks),
            "session_id": session_id
        }

        self._session_docs[session_id] = doc_summary
        return doc_summary

    def query(
        self,
        user_query: str,
        session_id: str = "default_session",
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Answers a grounded question from the session's uploaded document.
        """
        doc_info = self._session_docs.get(session_id)
        if not doc_info:
            return {
                "success": False,
                "answer": "No document has been uploaded in this session.",
                "rag_used": False,
                "sources": []
            }

        retriever = self._get_retriever(session_id)
        passages = retriever.retrieve(user_query, top_k=top_k)

        # Generate deterministic grounded factual answer
        answer = extract_grounded_answer(user_query, doc_info["filename"], doc_info["content"])

        return {
            "success": True,
            "answer": answer,
            "rag_used": True,
            "filename": doc_info["filename"],
            "doc_type": doc_info["doc_type"],
            "sources": [
                {
                    "doc_name": p["doc_name"],
                    "doc_type": p["doc_type"],
                    "score": p["score"],
                    "passage": p["text"]
                }
                for p in passages
            ]
        }

    def get_document_facts(self, session_id: str = "default_session") -> Optional[Dict[str, Any]]:
        """Returns structured metadata extracted from the session's active document."""
        doc_info = self._session_docs.get(session_id)
        if not doc_info:
            return None
        return extract_facts(doc_info["filename"], doc_info["content"])

    def clear_session(self, session_id: str):
        """Clears all indexed data for a given session."""
        if session_id in self._session_retrievers:
            self._session_retrievers[session_id].clear()
            del self._session_retrievers[session_id]
        if session_id in self._session_docs:
            del self._session_docs[session_id]
