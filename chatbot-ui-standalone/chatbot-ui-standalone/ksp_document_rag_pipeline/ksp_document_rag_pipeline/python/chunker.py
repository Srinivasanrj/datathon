"""
Document Text Chunker
Splits long documents and OCR extracts into manageable, overlapping passages
with character/token metadata for dense vector search and citation.
"""

from typing import List, Dict, Any


class DocumentChunk:
    def __init__(self, chunk_id: int, text: str, start_char: int, end_char: int, doc_name: str, doc_type: str = "document"):
        self.chunk_id = chunk_id
        self.text = text
        self.start_char = start_char
        self.end_char = end_char
        self.doc_name = doc_name
        self.doc_type = doc_type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "text": self.text,
            "start_char": self.start_char,
            "end_char": self.end_char,
            "doc_name": self.doc_name,
            "doc_type": self.doc_type
        }


def chunk_text(
    text: str,
    doc_name: str = "document",
    doc_type: str = "document",
    chunk_size: int = 400,
    chunk_overlap: int = 80
) -> List[DocumentChunk]:
    """
    Splits text into overlapping chunks.
    Ensures natural paragraph and sentence boundaries where possible.
    """
    if not text or not text.strip():
        return []

    clean_text = text.strip()
    chunks = []
    
    # If text is shorter than chunk size, return single chunk
    if len(clean_text) <= chunk_size:
        return [DocumentChunk(0, clean_text, 0, len(clean_text), doc_name, doc_type)]

    step = max(1, chunk_size - chunk_overlap)
    idx = 0
    chunk_id = 0

    while idx < len(clean_text):
        end = min(len(clean_text), idx + chunk_size)
        
        # Try to break at a newline or space near the boundary
        if end < len(clean_text):
            last_break = clean_text.rfind("\n", idx + step, end)
            if last_break == -1:
                last_break = clean_text.rfind(" ", idx + step, end)
            if last_break != -1 and last_break > idx:
                end = last_break

        chunk_str = clean_text[idx:end].strip()
        if chunk_str:
            chunks.append(DocumentChunk(
                chunk_id=chunk_id,
                text=chunk_str,
                start_char=idx,
                end_char=end,
                doc_name=doc_name,
                doc_type=doc_type
            ))
            chunk_id += 1

        idx += step

    return chunks
