"""
Example Usage: Python Document RAG Pipeline
Run with: python examples.py
"""

import os
from pipeline import DocumentRagPipeline

def main():
    print("=" * 70)
    print("  KSP DOCUMENT RAG PIPELINE — PYTHON DEMONSTRATION")
    print("=" * 70)

    rag = DocumentRagPipeline()
    session_id = "officer_session_01"

    # Sample FIR Document Text (or pass raw bytes from an image / PDF)
    sample_fir = (
        "KARNATAKA STATE POLICE\n"
        "FIRST INFORMATION REPORT (Under Section 154 Cr.PC)\n"
        "District: Shivamogga | Circle: Shimoga Sub-Division | PS: Doddapete PS\n"
        "Crime No: 0077/2022 | FIR Date: 21/02/2022\n"
        "Act & Section: IPC 1860 (U/s-302,34)\n"
        "Place of occurrence: Opposite kamath petrol bunk Bharathi colony cross, NT Road, Shivamogga\n"
        "Complainant: Smt Padma (Age 52, Housewife)\n"
        "Accused: Suresh Patel and Ramesh Kumar\n"
        "Details: Murder and conspiracy under IPC Section 302, 34."
    )

    # 1. Ingest File
    print("\n1. Ingesting Document...")
    ingest_result = rag.ingest_file(
        file_bytes=sample_fir.encode("utf-8"),
        filename="FIR_0077_2022.txt",
        session_id=session_id
    )
    print(f"-> Ingested: {ingest_result['filename']} ({ingest_result['chunks_count']} chunks indexed)")

    # 2. Querying Document
    queries = [
        "What is the FIR number?",
        "Who is the complainant?",
        "Who is the accused?",
        "What sections are applied?",
        "Where did the incident happen?",
        "Summarize this FIR"
    ]

    print("\n2. Querying Grounded RAG Engine...")
    for q in queries:
        res = rag.query(q, session_id=session_id)
        print(f"\nQ: {q}")
        print(f"A: {res['answer']}")

    # 3. Extract Structured Facts
    print("\n3. Extracting Structured Metadata Facts...")
    facts = rag.get_document_facts(session_id=session_id)
    for k, v in facts.items():
        if k != "raw_text":
            print(f"  • {k}: {v}")

    print("\n" + "=" * 70)
    print("  PYTHON DEMO COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    main()
