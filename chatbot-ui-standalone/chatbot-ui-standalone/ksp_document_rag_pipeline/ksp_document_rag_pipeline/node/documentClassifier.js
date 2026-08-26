/**
 * Document & Query Intent Classifier (Node.js)
 * Classifies queries into:
 * - 'SECURITY_BLOCK' (prompt injection / credential attempt)
 * - 'CASUAL' (greeting / assistant identity)
 * - 'OUT_OF_SCOPE' (unrelated domain)
 * - 'DOCUMENT' (explicitly asks about uploaded file / FIR)
 * - 'MIXED' (combines document facts and general district crime trends)
 * - 'GENERAL_CRIME' (general crime statistics, comparisons, patterns)
 */

const DISTRICT_PATTERN = /\b(bengaluru(\s+urban|\s+rural)?|bangalore|mysuru|mysore|belagavi|belgaum|kalaburagi|gulbarga|kolar|udupi|manipal|mangalore|mangaluru|hubballi|dharwad|tumakuru|tumkur|shivamogga|shimoga|ballari|bellary|bidar|raichur|vijayapura|bijapur|hassan|mandya|chikkamagaluru|chikmagalur|chamarajanagar|davangere|koppal|gadag|bagalkot|haveri|yadgir|uttara\s*kannada|dakshina\s*kannada|kodagu|coorg|ramanagara|chikkaballapur)\b/i;

const GENERAL_CRIME_INQUIRY_PATTERNS = [
  /\bhighest\s+crime\b/i,
  /\bdominant\s+crime(s)?\b/i,
  /\btop\s+crime(s)?\b/i,
  /\bmost\s+common\s+crime(s)?\b/i,
  /\bcrime\s+trend(s)?\b/i,
  /\bcrime\s+statistic(s)?\b/i,
  /\bcrime(s)?\s+in\s+[a-z]+/i,
  /\bhotspot(s)?\s+in\s+[a-z]+/i,
  /\bcompare\s+[a-z]+\s+(and|vs|versus)\s+[a-z]+/i,
  /\bwhich\s+district\s+has\s+the\s+highest\b/i,
  /\bwhich\s+district\b/i,
  /\bshow\s+crime\b/i,
  /\bchain\s+snatching\s+high\s+in\b/i,
  /\bwhy\s+is\s+.+\s+high\s+in\s+[a-z]+/i,
  /\blast\s*30\s*days\b/i,
  /\b30\s*days\s*trend\b/i,
  /\bbehavioral\s+profile\b/i
];

const DOC_ANCHOR_PATTERNS = [
  /\b(in\s+this|from\s+this|in\s+the|from\s+the|according\s+to\s+the|based\s+on\s+the)\s+(fir|document|uploaded\s*file|file|image|photo|report|record)\b/i,
  /\b(the\s+uploaded|uploaded\s+(fir|file|document|image|photo|pdf))\b/i,
  /\bwhat\s+does\s+\S+\.(webp|jpg|jpeg|png|pdf)\s+say\b/i,
  /\b(summarize|summary|overview|brief|details)\b.*\b(fir|document|uploaded|file|case)\b/i,
  /\b(give\s+)?summary(\s+of\s+(this\s+)?(fir|document|file|case))?\b/i,
  /^summary$/i,
  /^summarize$/i,
  /\bgive\s+(me\s+)?summary\b/i,
  /\bwhat\s+is\s+this\s+(fir|document|case|file)\s+about\b/i
];

const DOC_FIELD_PATTERNS = [
  /\b(who\s+is\s+the\s+accused|accused\s*name|name\s+of\s+accused|suspect\s*name|who\s+is\s+the\s+suspect)\b/i,
  /\b(who\s+is\s+the\s+complainant|complainant\s*name|informant\s*name|who\s+reported|complainant\s+details)\b/i,
  /\b(what\s+sections?|which\s+sections?|sections?\s+mentioned|what\s+section\s+was\s+applied|charged\s+under|ipc\s+sections?|bns\s+sections?|legal\s+sections?)\b/i,
  /\b(fir\s*(no\.?|num|number)|crime\s*(no\.?|num|number)|case\s*(no\.?|num|number))\b/i,
  /\b(incident\s+date|what\s+is\s+the\s+date|date\s+of\s+incident|when\s+did\s+it\s+happen|time\s+of\s+incident|date\s+mentioned)\b/i,
  /\b(place\s+of\s+occurrence|where\s+did\s+it\s+happen|incident\s+location|station\s+name|which\s+police\s+station|doddapete)\b/i,
  /\b(what\s+is\s+name|what\s+is\s+the\s+name|name\s+mentioned|person\s+name)\b/i,
  /\b(what\s+was\s+stolen|stolen\s+property|property\s+stolen|loss\s+amount|value\s+of\s+property)\b/i,
  /\b(what\s+happened\s+in\s+the\s+fir|summary\s+of\s+this\s+fir|details\s+of\s+this\s+fir)\b/i
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /reveal\s+(the\s+)?(system\s+prompt|catalyst|credentials|tokens?|client_secret)/i,
  /show\s+(me\s+)?(the\s+)?(system\s+prompt|catalyst\s+refresh\s+token|secret)/i,
  /CATALYST_CLIENT_SECRET|CATALYST_REFRESH_TOKEN|CATALYST_ACCESS_TOKEN/i
];

const CASUAL_PATTERNS = [
  /^(hi|hello|hey|hii|good\s+morning|good\s+evening|good\s+afternoon)$/i,
  /^who\s+are\s+you\??$/i,
  /^what\s+can\s+you\s+do\??$/i,
  /^help$/i
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(recipe|cook(ing)?|bake|baking|chocolate|cake|biryani|pasta|pizza|weather|forecast|horoscope|crypto|bitcoin|stock\s*market|cricket\s*score)\b/i
];

export function classifyQuery(query, uploadedDoc = null, context = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return 'OUT_OF_SCOPE';
  }

  const q = query.trim();

  // 1. Security check
  if (PROMPT_INJECTION_PATTERNS.some(p => p.test(q))) {
    return 'SECURITY_BLOCK';
  }

  // 2. Casual greeting check
  if (CASUAL_PATTERNS.some(p => p.test(q))) {
    return 'CASUAL';
  }

  // 3. Out of scope check
  if (OUT_OF_SCOPE_PATTERNS.some(p => p.test(q))) {
    return 'OUT_OF_SCOPE';
  }

  const hasDistrict = DISTRICT_PATTERN.test(q);
  const isGeneralCrimeInquiry = GENERAL_CRIME_INQUIRY_PATTERNS.some(p => p.test(q));
  const isComparison = /\b(compare|versus|vs\.?|difference\s+between)\b/i.test(q);
  const hasDocAnchor = DOC_ANCHOR_PATTERNS.some(p => p.test(q));
  const hasDocField = DOC_FIELD_PATTERNS.some(p => p.test(q));

  // 4. MIXED Query: Explicit Document Reference + General Crime / District Statistical Query
  if (uploadedDoc && hasDocAnchor && (hasDistrict || isGeneralCrimeInquiry || isComparison)) {
    return 'MIXED';
  }

  // 5. GENERAL CRIME Priority when district or comparison is explicitly requested
  if ((hasDistrict && isGeneralCrimeInquiry) || isComparison || (hasDistrict && !hasDocAnchor && !hasDocField)) {
    return 'GENERAL_CRIME';
  }

  // 6. DOCUMENT Query
  if (uploadedDoc) {
    if (hasDocAnchor) return 'DOCUMENT';
    if (hasDocField && !isGeneralCrimeInquiry && !isComparison) return 'DOCUMENT';

    const prevTurnWasDoc = context?.conversationTopic?.topicType === 'document_qa' || context?.conversationTopic?.lastIntent === 'document_qa';
    if (prevTurnWasDoc && !hasDistrict && !isGeneralCrimeInquiry && !isComparison) {
      if (/\b(section|name|who|where|when|date|time|station|age|caste|religion|occupation|accused|complainant|witness|stolen|amount|why|details|officer|suspect)\b/i.test(q)) {
        return 'DOCUMENT';
      }
    }
  }

  // 7. General Crime Domain
  if (hasDistrict || isGeneralCrimeInquiry) {
    return 'GENERAL_CRIME';
  }

  // 8. Fallback for active uploaded document
  if (uploadedDoc && !hasDistrict && !isGeneralCrimeInquiry && !isComparison) {
    return 'DOCUMENT';
  }

  return 'GENERAL_CRIME';
}

export function isDocumentQuery(query, uploadedDoc, context = {}) {
  if (!uploadedDoc) return false;
  return classifyQuery(query, uploadedDoc, context) === 'DOCUMENT';
}

export default {
  classifyQuery,
  isDocumentQuery
};
