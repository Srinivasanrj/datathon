"""
KSP Document RAG Pipeline (Python Edition)
Portable document upload, Zia OCR, text chunking, passage retrieval, and grounded Q&A.
"""

from .ingestion import extract_text_from_file, call_zia_ocr
from .chunker import chunk_text, DocumentChunk
from .retriever import DocumentRetriever
from .extractor import extract_facts, extract_grounded_answer
from .pipeline import DocumentRagPipeline

__all__ = [
    "extract_text_from_file",
    "call_zia_ocr",
    "chunk_text",
    "DocumentChunk",
    "DocumentRetriever",
    "extract_facts",
    "extract_grounded_answer",
    "DocumentRagPipeline",
]
