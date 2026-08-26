/**
 * Deterministic Grounded Document Fact Extractor (Node.js)
 * Extracts structured fields (FIR No, Complainant, Accused, Sections, Location, Date, Stolen Property, Summary)
 * directly from raw text/OCR content without hallucinations.
 */

export function extractStructuredFacts(docName, docContent) {
  if (!docContent || typeof docContent !== 'string') {
    return {
      docName: docName || 'document',
      firNumber: null,
      district: null,
      complainant: null,
      accused: null,
      sections: null,
      location: null,
      incidentDate: null,
      stolenProperty: null,
      rawContent: ''
    };
  }

  const text = docContent.trim();

  const findMatch = (patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) {
        return m[1].replace(/[\.\|\n]+$/, '').trim();
      }
    }
    return null;
  };

  const firNumber = findMatch([
    /crime\s*n[oa][:\.\s]+([^\.\n\|]+)/i,
    /fir\s*(?:no|number)?[:\s]+([^\.\n\|]+)/i,
    /case\s*(?:no|number)?[:\s]+([^\.\n\|]+)/i
  ]);

  const district = findMatch([
    /district[:\s]+([^\.\n\|]+)/i,
    /jurisdiction[:\s]+([^\.\n\|]+)/i,
    /circle(?:\/sub\s*division)?[:\s]+([^\.\n\|]+)/i,
    /(?:in|at|from)\s+([a-zA-Z\s]+?)\s+district/i
  ]);

  const complainant = findMatch([
    /complainant(?:\/informant)?[:\s]+name[:\s]+([^\.\n\|]+)/i,
    /complainant(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
    /informant(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
    /name[:\s]+([^\.\n\|]+)/i
  ]);

  const accused = findMatch([
    /accused(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
    /suspect(?:\s+name)?[:\s]+([^\.\n\|]+)/i,
    /perpetrator(?:\s+name)?[:\s]+([^\.\n\|]+)/i
  ]);

  const sections = findMatch([
    /act\s*&\s*section[:\s]+([^\.\n\|]+)/i,
    /sections?[:\s]+([^\.\n\|]+)/i,
    /acts?[:\s]+([^\.\n\|]+)/i,
    /offence[:\s]+([^\.\n\|]+)/i
  ]);

  const location = findMatch([
    /place\s+of\s+occurrence(?:\s+with\s+full\s+address)?[:\s]+([^\.\n\|]+)/i,
    /incident\s+location[:\s]+([^\.\n\|]+)/i,
    /location[:\s]+([^\.\n\|]+)/i,
    /police\s+station[:\s]+([^\.\n\|]+)/i,
    /ps[:\s]+([^\.\n\|]+)/i,
    /address[:\s]+([^\.\n\|]+)/i
  ]);

  const incidentDate = findMatch([
    /fir\s+date[:\s]+([^\.\n\|]+)/i,
    /incident\s+date(?:\s*&\s*time)?[:\s]+([^\.\n\|]+)/i,
    /from\s+date[:\s]+([^\.\n\|]+)/i,
    /date\s*&\s*time[:\s]+([^\.\n\|]+)/i,
    /date[:\s]+([^\.\n\|]+)/i
  ]);

  const stolenProperty = findMatch([
    /stolen\s+property[:\s]+([^\.\n\|]+)/i,
    /property\s+stolen[:\s]+([^\.\n\|]+)/i,
    /property[:\s]+([^\.\n\|]+)/i,
    /loss[:\s]+([^\.\n\|]+)/i
  ]);

  return {
    docName: docName || 'document',
    firNumber,
    district,
    complainant,
    accused,
    sections,
    location,
    incidentDate,
    stolenProperty,
    rawContent: text
  };
}

export function extractGroundedDocumentAnswer(query, docName, docContent) {
  if (!docContent || !docContent.trim()) {
    return `The uploaded document **${docName}** does not contain readable text.`;
  }

  const q = query.toLowerCase().trim();
  const facts = extractStructuredFacts(docName, docContent);

  // 1. FIR / Crime Number
  if (/\b(fir\s*(no\.?|num|number)|case\s*(no\.?|num|number)|crime\s*(no\.?|num|number))\b/i.test(q)) {
    if (facts.firNumber) {
      return `According to **${docName}**, the FIR / Crime Number is **${facts.firNumber}**.`;
    }
    return `The FIR number was not found in the uploaded document **${docName}**.`;
  }

  // 2. District / Jurisdiction
  if (/\b(district|jurisdiction|city|circle)\b/i.test(q)) {
    if (facts.district) {
      return `According to **${docName}**, the district mentioned is **${facts.district}**.`;
    }
    return `The district was not found in the uploaded document **${docName}**.`;
  }

  // 3. Complainant Name
  if (/\b(complainant|informant|who\s+reported)\b/i.test(q)) {
    if (facts.complainant) {
      return `According to **${docName}**, the complainant is **${facts.complainant}**.`;
    }
    return `The complainant details were not found in the uploaded document **${docName}**.`;
  }

  // 4. Accused / Suspect
  if (/\b(accused|suspect|perpetrator|culprit|who\s+did\s+it)\b/i.test(q)) {
    if (facts.accused) {
      return `According to **${docName}**, the accused are **${facts.accused}**.`;
    }
    return `The accused details were not found in the uploaded document **${docName}**.`;
  }

  // 5. Name in general
  if (/\b(name|who\s+is\s+named)\b/i.test(q)) {
    const name = facts.accused || facts.complainant;
    if (name) {
      return `According to **${docName}**, the name mentioned is **${name}**.`;
    }
    return `The name was not found in the uploaded document **${docName}**.`;
  }

  // 6. Location / Where / Scene
  if (/\b(where|location|place|address|scene|station|ps)\b/i.test(q)) {
    if (facts.location) {
      return `According to **${docName}**, the incident location is **${facts.location}**.`;
    }
    return `The incident location was not found in the uploaded document **${docName}**.`;
  }

  // 7. Incident Timing / When / Date
  if (/\b(when|date|time|timing|timestamp|hour)\b/i.test(q)) {
    if (facts.incidentDate) {
      return `According to **${docName}**, the recorded date/time is **${facts.incidentDate}**.`;
    }
    return `The incident date and time were not found in the uploaded document **${docName}**.`;
  }

  // 8. Legal Sections / Acts
  if (/\b(section|sections|bns|ipc|act|acts|penal|code|charges?)\b/i.test(q)) {
    if (facts.sections) {
      return `According to **${docName}**, the applicable legal sections are **${facts.sections}**.`;
    }
    return `The legal sections were not found in the uploaded document **${docName}**.`;
  }

  // 9. Stolen Property / Loss
  if (/\b(stolen|property|amount|money|cash|gold|loss|vehicle|phone)\b/i.test(q)) {
    if (facts.stolenProperty) {
      return `According to **${docName}**, the recorded property / loss is **${facts.stolenProperty}**.`;
    }
    return `The property / loss details were not found in the uploaded document **${docName}**.`;
  }

  // 10. Summary / Overview / What happened
  if (/\b(summarize|summary|what\s+happened|details|tell\s+me\s+about|narrative|brief)\b/i.test(q)) {
    return `**Summary of ${docName}:**\n\n${docContent}`;
  }

  // Default Grounded Excerpt
  return `According to **${docName}**:\n\n${docContent}`;
}

export default {
  extractStructuredFacts,
  extractGroundedDocumentAnswer
};
