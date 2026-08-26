"""
Deterministic Legal Document & Grounded Fact Extractor
Extracts verified facts (FIR No, Complainant, Accused, Sections, Incident Location, Dates, Summary)
directly from raw text/OCR passages without hallucinations.
"""

import re
from typing import Dict, Any, Optional


def find_first_match(patterns, text: str) -> Optional[str]:
    """Helper to find the first capturing group match from regex patterns."""
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m and m.group(1):
            val = m.group(1).strip()
            # Clean trailing punctuation and pipes
            val = re.sub(r"[\.\|\n]+$", "", val).strip()
            if val:
                return val
    return None


def extract_facts(doc_name: str, doc_content: str) -> Dict[str, Any]:
    """
    Extracts all structured fields from a legal document/FIR text into a clean dictionary.
    """
    text = doc_content or ""

    fir_no = find_first_match([
        r"crime\s*n[oa][:\.\s]+([^\.\n\|]+)",
        r"fir\s*(?:no|number)?[:\s]+([^\.\n\|]+)",
        r"case\s*(?:no|number)?[:\s]+([^\.\n\|]+)"
    ], text)

    district = find_first_match([
        r"district[:\s]+([^\.\n\|]+)",
        r"jurisdiction[:\s]+([^\.\n\|]+)",
        r"circle(?:\/sub\s*division)?[:\s]+([^\.\n\|]+)",
        r"(?:in|at|from)\s+([a-zA-Z\s]+?)\s+district"
    ], text)

    complainant = find_first_match([
        r"complainant(?:\/informant)?[:\s]+name[:\s]+([^\.\n\|]+)",
        r"complainant(?:\s+name)?[:\s]+([^\.\n\|]+)",
        r"informant(?:\s+name)?[:\s]+([^\.\n\|]+)",
        r"name[:\s]+([^\.\n\|]+)"
    ], text)

    accused = find_first_match([
        r"accused(?:\s+name)?[:\s]+([^\.\n\|]+)",
        r"suspect(?:\s+name)?[:\s]+([^\.\n\|]+)",
        r"perpetrator(?:\s+name)?[:\s]+([^\.\n\|]+)"
    ], text)

    sections = find_first_match([
        r"act\s*&\s*section[:\s]+([^\.\n\|]+)",
        r"sections?[:\s]+([^\.\n\|]+)",
        r"acts?[:\s]+([^\.\n\|]+)",
        r"offence[:\s]+([^\.\n\|]+)"
    ], text)

    location = find_first_match([
        r"place\s+of\s+occurrence(?:\s+with\s+full\s+address)?[:\s]+([^\.\n\|]+)",
        r"incident\s+location[:\s]+([^\.\n\|]+)",
        r"location[:\s]+([^\.\n\|]+)",
        r"police\s+station[:\s]+([^\.\n\|]+)",
        r"ps[:\s]+([^\.\n\|]+)",
        r"address[:\s]+([^\.\n\|]+)"
    ], text)

    incident_date = find_first_match([
        r"fir\s+date[:\s]+([^\.\n\|]+)",
        r"incident\s+date(?:\s*&\s*time)?[:\s]+([^\.\n\|]+)",
        r"from\s+date[:\s]+([^\.\n\|]+)",
        r"date\s*&\s*time[:\s]+([^\.\n\|]+)",
        r"date[:\s]+([^\.\n\|]+)"
    ], text)

    stolen_property = find_first_match([
        r"stolen\s+property[:\s]+([^\.\n\|]+)",
        r"property\s+stolen[:\s]+([^\.\n\|]+)",
        r"property[:\s]+([^\.\n\|]+)",
        r"loss[:\s]+([^\.\n\|]+)"
    ], text)

    return {
        "document_name": doc_name,
        "fir_number": fir_no,
        "district": district,
        "complainant": complainant,
        "accused": accused,
        "sections": sections,
        "location": location,
        "incident_date": incident_date,
        "stolen_property": stolen_property,
        "raw_text": text
    }


def extract_grounded_answer(query: str, doc_name: str, doc_content: str) -> str:
    """
    Deterministically answers specific factual questions from the document text.
    """
    if not doc_content or not doc_content.strip():
        return f"The uploaded document **{doc_name}** does not contain readable text."

    q = query.lower().strip()
    facts = extract_facts(doc_name, doc_content)

    # 1. FIR / Crime Number
    if any(k in q for k in ["fir no", "fir number", "crime no", "crime number", "case no", "case number"]):
        if facts["fir_number"]:
            return f"According to **{doc_name}**, the FIR / Crime Number is **{facts['fir_number']}**."
        return f"The FIR number was not found in **{doc_name}**."

    # 2. District / Location Mentioned
    if "district" in q or "jurisdiction" in q or "circle" in q:
        if facts["district"]:
            return f"According to **{doc_name}**, the district mentioned is **{facts['district']}**."
        return f"The district was not found in **{doc_name}**."

    # 3. Complainant Name
    if "complainant" in q or "informant" in q or "who reported" in q:
        if facts["complainant"]:
            return f"According to **{doc_name}**, the complainant is **{facts['complainant']}**."
        return f"The complainant details were not found in **{doc_name}**."

    # 4. Accused / Suspect
    if "accused" in q or "suspect" in q or "perpetrator" in q:
        if facts["accused"]:
            return f"According to **{doc_name}**, the accused are **{facts['accused']}**."
        return f"The accused details were not found in **{doc_name}**."

    # 5. Name in general
    if "name" in q:
        name = facts["accused"] if "accused" in q else (facts["complainant"] or facts["accused"])
        if name:
            return f"According to **{doc_name}**, the name is **{name}**."
        return f"The name was not found in **{doc_name}**."

    # 6. Legal Sections / Acts
    if any(k in q for k in ["section", "sections", "ipc", "bns", "act", "acts", "charge"]):
        if facts["sections"]:
            return f"According to **{doc_name}**, the legal sections are **{facts['sections']}**."
        return f"The legal sections were not found in **{doc_name}**."

    # 7. Incident Location / Place
    if any(k in q for k in ["where", "location", "place", "address", "station", "scene"]):
        if facts["location"]:
            return f"According to **{doc_name}**, the incident occurred at **{facts['location']}**."
        return f"The incident location was not found in **{doc_name}**."

    # 8. Incident Timing / Date
    if any(k in q for k in ["when", "date", "time", "timing", "timestamp"]):
        if facts["incident_date"]:
            return f"According to **{doc_name}**, the incident date is **{facts['incident_date']}**."
        return f"The incident date was not found in **{doc_name}**."

    # 9. Stolen Property / Loss
    if any(k in q for k in ["stolen", "property", "amount", "money", "cash", "loss"]):
        if facts["stolen_property"]:
            return f"According to **{doc_name}**, the stolen property / loss is **{facts['stolen_property']}**."
        return f"The property loss was not found in **{doc_name}**."

    # 10. Summary / Overview
    if any(k in q for k in ["summary", "summarize", "what happened", "overview", "details"]):
        return f"**Summary of {doc_name}:**\n\n{doc_content}"

    # Default Grounded Return
    return f"According to **{doc_name}**:\n\n{doc_content[:400]}"
