/**
 * 🛡️ KSP Sentinel AI — Guardrail & Safety Enforcement Service
 * 
 * Provides modular, deterministic input, context, evidence, and output validation:
 * 1. validateInput(message, context)
 * 2. validateResolvedContext(context)
 * 3. validateEvidence(evidenceFacts)
 * 4. validateOutput(answer, evidenceFacts, context)
 * 5. isCasualQuery(message)
 * 6. isOutOfScopeQuery(message)
 * 7. isPromptInjection(message)
 */

// ── 1. CASUAL PATTERNS ────────────────────────────────────────────────────────
const CASUAL_PATTERNS = [
  /^(hi|hello|hey|howdy|heya|hiya|greetings|namaste|vanakkam)\b/i,
  /^good\s*(morning|afternoon|evening|night|day)\b/i,
  /^what'?s?\s*up\b/i,
  /^(sup|yo)\b/i,
  /^(thanks|thank\s*you|thank\s*u|ty|thx|many\s*thanks)\b/i,
  /^(bye|goodbye|cya|see\s*you|take\s*care)\b/i,
  /^(ok|okay|cool|great|awesome|understood|got\s*it|sure|alright|fine)\b/i,
  /^(who\s*are\s*you|what\s*(are|can)\s*you\s*do|help\s*me|what\s*is\s*(ksp|your\s*name)|introduce\s*yourself|what\s*is\s*your\s*purpose)\b/i,
  /^(how\s*are\s*you|how\s*do\s*you\s*work|tell\s*me\s*about\s*yourself)\b/i
];

// ── 2. PROMPT INJECTION & JAILBREAK PATTERNS ──────────────────────────────────
const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|system|prior|above)\s+(instructions|prompts?|rules|commands?|context)\b/i,
  /\b(reveal|show|print|display|dump|leak|output)\s+(me\s+)?(your|the|system)?\s*(system\s*prompt|initial\s*prompt|base\s*prompt|instructions|meta\s*prompt)\b/i,
  /\bwhat\s+(is|are)\s+(your|the)\s+(system\s*prompt|hidden\s*instructions|rules|initial\s*prompt)\b/i,
  /\b(show|reveal|print|give|get|leak|dump|provide)\s+(me\s+)?(the\s+)?(catalyst\s+|zoho\s+)?(api\s*key|access\s*token|refresh\s*token|client\s*secret|credentials?|password|auth\s*header|tokens?)\b/i,
  /\b(catalyst|zoho|oauth|secret)\s+(refresh\s*token|access\s*token|api\s*key|client\s*secret)\b/i,
  /\b(show|print|reveal|dump|read)\s+(the\s+)?(\.env|env\s*file|environment\s*variables?)\b/i,
  /\b(database|catalyst|zoho|postgresql|mysql|mongodb)\s*(credentials?|passwords?|connection\s*string|tokens?)\b/i,
  /\b(dan\s*mode|jailbreak|developer\s*mode\s*enabled|unfiltered\s*mode|bypass\s*filters?)\b/i,
  /\byou\s+are\s+now\s+(unrestricted|in\s+developer\s*mode|in\s+god\s*mode|free\s+of\s+rules)\b/i,
  /\b(system\s*override|override\s*system\s*instructions|disregard\s*rules)\b/i,
  /\bcat\s+(\/etc\/passwd|\.env|\/proc\/version)\b/i,
  /\bcurl\s+.*(metadata\.google|169\.254\.169\.254)\b/i,
  /\bprint\s+.*(process\.env|CATALYST_)\b/i
];

// ── 3. SENSITIVE SECRET & CREDENTIAL PATTERNS ─────────────────────────────────
const SENSITIVE_SECRET_PATTERNS = [
  /CATALYST_DATASTORE_REFRESH_TOKEN/i,
  /CATALYST_CLIENT_SECRET/i,
  /CATALYST_CLIENT_ID/i,
  /CATALYST_REFRESH_TOKEN/i,
  /CLIENT_SECRET/i,
  /ACCESS_TOKEN/i,
  /REFRESH_TOKEN/i,
  /Zoho-oauthtoken\s+[^\s]+/i,
  /\b1000\.[a-f0-9]{32}\.[a-f0-9]{32}\b/i, // Zoho OAuth Refresh Token format
  /\b1000\.[a-f0-9]{32}\b/i                // Zoho OAuth Client ID format
];

// ── 4. CRIME INTELLIGENCE TOPICAL KEYWORDS (ALLOWED DOMAIN) ───────────────────
const CRIME_TOPIC_PATTERNS = [
  /\b(crime|crimes|theft|robbery|burglary|murder|homicide|assault|snatching|chain\s*snatching|cyber|fraud|phishing|otp|counterfeit|currency|chit\s*fund|extortion|kidnapping|vandalism|pickpocket|smuggling|narcotics|drugs)\b/i,
  /\b(pattern|patterns|trends?|statistics|stats|hotspots?|locations?|localit(y|ies)|timing|time\s*pattern|modus\s*operandi|m\.?o\.?|offender|suspect|victim|demographics?|age|gender|profile|dossier|fir|cases?|incidents?|mutation|shift|baseline|30\s*days|last\s*30\s*days|historical)\b/i,
  /\b(ksp|police|interdiction|prevention|patrol|checkpoint|surveillance|arrests?|bengaluru|bangalore|mysuru|mysore|belagavi|belgaum|kalaburagi|gulbarga|kolar|udupi|manipal|mangalore|mangaluru|hubballi|dharwad|tumakuru|shivamogga|ballari|bidar|raichur|vijayapura|hassan|mandya|chikkamagaluru|chamarajanagar|davangere|koppal|gadag|bagalkot|haveri|yadgir|uttara\s*kannada|dakshina\s*kannada|kodagu|ramanagara|chikkaballapur)\b/i,
  /\b(compare|contrast|versus|vs\.?|difference\s+between|higher|lower|dominant|most\s*common|frequent)\b/i,
  /\b(why(\s+is\s+(it|that|this))?|what\s+causes?|reasons?|how\s+to\s+prevent|what\s+changed|tell\s+me\s+more|explain\s+(that|this|it)|summarize|summary|what\s+about)\b/i
];

// ── 5. OUT-OF-SCOPE DOMAIN PATTERNS (DISALLOWED) ──────────────────────────────
const OUT_OF_SCOPE_PATTERNS = [
  /\b(recipe|cook(ing)?|bake|baking|ingredients?|chocolate|cake|biryani|pasta|pizza|dessert|curry|soup|bread|dosa|idli|how\s+to\s+(make|cook|bake)\s+.*(cake|food|recipe|dish|tea|coffee))\b/i,
  /\b(write\s+(a\s+)?(python|javascript|java|c\+\+|rust|php|ruby|html|css|sql)\s+(code|script|program|function)|leetcode|debug\s+my\s+code|fibonacci|binary\s*search)\b/i,
  /\b(movie\s*review|actor|actress|bollywood|hollywood|netflix|spotify|song\s*lyrics|chords|oscars?|celebrity\s*gossip)\b/i,
  /\b(weather\s+forecast|will\s+it\s+rain|temperature\s+in|horoscope|zodiac|astrology|tarot)\b/i,
  /\b(symptoms?\s+of|cure\s+for|medical\s*advice|diagnose\s+my|dosage\s+of|prescription)\b/i,
  /\b(crypto(currency)?|bitcoin|ethereum|buy\s+stocks?|forex\s*trading|nft)\b/i,
  /\b(capital\s+of\s+(france|germany|usa|italy|japan|china)|who\s+won\s+the\s+(world\s*cup|ipl|super\s*bowl)|who\s+is\s+the\s+president\s+of\s+(us|france|russia)|who\s+was\s+napoleon|how\s+far\s+is\s+the\s+moon)\b/i,
  /\b(tell\s+me\s+a\s+joke|write\s+a\s+(poem|essay|story|song)|play\s+a\s+game|riddle)\b/i
];

/**
 * 1. Check if message is a casual conversation query (greeting, capability, etc.)
 * @param {string} message
 * @returns {boolean}
 */
export function isCasualQuery(message) {
  if (!message || typeof message !== 'string') return false;
  const q = message.trim();
  return CASUAL_PATTERNS.some(p => p.test(q));
}

/**
 * 2. Check if message is a prompt injection or security exploitation attempt
 * @param {string} message
 * @returns {boolean}
 */
export function isPromptInjection(message) {
  if (!message || typeof message !== 'string') return false;
  const q = message.trim();
  return PROMPT_INJECTION_PATTERNS.some(p => p.test(q));
}

/**
 * 3. Check if message is outside the supported crime intelligence domain
 * @param {string} message
 * @param {Object} [context={}]
 * @returns {boolean}
 */
export function isOutOfScopeQuery(message, context = {}) {
  if (!message || typeof message !== 'string') return true;
  const q = message.trim();

  // Casual queries are handled by casual path, not flagged as out_of_scope
  if (isCasualQuery(q)) {
    return false;
  }

  // If prompt injection, handled by security guardrail
  if (isPromptInjection(q)) {
    return false;
  }

  // Explicitly matches out-of-scope domain topics (cooking, weather, general coding, etc.)
  const matchesOutOfScope = OUT_OF_SCOPE_PATTERNS.some(p => p.test(q));
  if (matchesOutOfScope) {
    return true;
  }

  // Check if message matches crime intelligence domain
  const matchesCrimeTopic = CRIME_TOPIC_PATTERNS.some(p => p.test(q));
  if (matchesCrimeTopic) {
    return false;
  }

  // If there is an active conversational crime topic, short follow-ups are in-scope
  const hasActiveCrimeContext = context?.conversationTopic?.topicType && context.conversationTopic.topicType !== 'general';
  if (hasActiveCrimeContext) {
    const isShortFollowUp = q.split(/\s+/).length <= 8;
    if (isShortFollowUp) {
      return false;
    }
  }

  // If length is very short and no crime keywords found, default to false if neutral
  if (q.split(/\s+/).length <= 3) {
    return false;
  }

  return true;
}

/**
 * 4. Validate incoming user input message
 * @param {string} message
 * @param {Object} [context={}]
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateInput(message, context = {}) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Message content is required.',
      category: 'invalid_input'
    };
  }

  const cleanMessage = message.trim();

  // Check Prompt Injection
  if (isPromptInjection(cleanMessage)) {
    return {
      allowed: false,
      reason: 'Security violation: prompt injection, system instruction extraction, or credential exfiltration detected.',
      category: 'prompt_injection'
    };
  }

  // Check Casual Query
  if (isCasualQuery(cleanMessage)) {
    return {
      allowed: true,
      reason: null,
      category: 'casual'
    };
  }

  // Check Out of Scope Query
  if (isOutOfScopeQuery(cleanMessage, context)) {
    return {
      allowed: false,
      reason: 'This question is outside the supported scope of Karnataka State Police crime intelligence analysis.',
      category: 'out_of_scope'
    };
  }

  // Valid Crime Intelligence Query
  return {
    allowed: true,
    reason: null,
    category: 'crime_intelligence'
  };
}

/**
 * 5. Validate resolved conversational context before processing
 * @param {Object} context
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateResolvedContext(context) {
  if (!context || typeof context !== 'object') {
    return {
      allowed: true,
      reason: null,
      category: 'valid_context'
    };
  }

  const topic = context.conversationTopic || {};

  // Validate comparison topic coherence (Requirement 6)
  if (topic.topicType === 'comparison') {
    const districts = Array.isArray(topic.districts) ? topic.districts : [];
    if (districts.length < 2) {
      return {
        allowed: false,
        reason: 'Incoherent comparison context: expected at least 2 comparison jurisdictions but found only 1.',
        category: 'invalid_context'
      };
    }
  }

  return {
    allowed: true,
    reason: null,
    category: 'valid_context'
  };
}

/**
 * 6. Validate retrieved evidence facts before sending to LLM
 * @param {string} evidenceFacts
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateEvidence(evidenceFacts) {
  if (!evidenceFacts || typeof evidenceFacts !== 'string' || evidenceFacts.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Insufficient verified crime data for this question.',
      category: 'insufficient_evidence'
    };
  }

  const clean = evidenceFacts.trim().toLowerCase();

  if (
    clean === 'no specific intelligence facts available for this query.' ||
    clean === 'no specific intelligence facts available.' ||
    clean.includes('no specific location hotspots documented') ||
    clean.includes('no recorded synthetic cases found') ||
    clean.includes('no recorded cases found') ||
    clean.includes('0 matching cases') ||
    clean.includes('0 documented cases') ||
    clean.includes('0 total cases') ||
    clean.length < 15
  ) {
    return {
      allowed: false,
      reason: 'Insufficient verified crime data for this question.',
      category: 'insufficient_evidence'
    };
  }

  return {
    allowed: true,
    reason: null,
    category: 'sufficient_evidence'
  };
}

/**
 * 7. Validate LLM generated output response before returning to user
 * @param {string} answer
 * @param {string} [evidenceFacts='']
 * @param {Object} [context={}]
 * @returns {{ allowed: boolean, reason: string|null, category: string }}
 */
export function validateOutput(answer, evidenceFacts = '', context = {}) {
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Generated response is empty.',
      category: 'empty_response'
    };
  }

  // 1. Secret & Credential Leakage Check (Requirement 5 & 8)
  for (const secretPattern of SENSITIVE_SECRET_PATTERNS) {
    if (secretPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'Security violation: potential credential, token, or secret exposure detected in generated output.',
        category: 'secret_leak'
      };
    }
  }

  // 2. System Instruction Leakage Check
  const systemEchoPatterns = [
    /You are a senior crime intelligence analyst/i,
    /Verified Intelligence Facts:/i,
    /naturalPrompt/i,
    /templateInstruction/i,
    /Produce a structured intelligence briefing/i
  ];
  for (const echoPattern of systemEchoPatterns) {
    if (echoPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'System instruction exposure detected in generated response.',
        category: 'system_prompt_leak'
      };
    }
  }

  // 3. Unsupported / Fabricated Database Claims (Requirement 8)
  const fabricatedClaims = [
    /\b(according\s+to|accessing|querying)\s+(aadhaar|uidai)\s*(database|records?)/i,
    /\b(cbi|interpol|raw|fbi|cia)\s+(national\s+)?(central\s+database|classified\s+server)/i,
    /\baccessing\s+(banking\s+network|live\s+cctv\s+feeds?|intercepting\s+phone\s+calls?)/i
  ];
  for (const fabPattern of fabricatedClaims) {
    if (fabPattern.test(answer)) {
      return {
        allowed: false,
        reason: 'Response contains unsupported claims regarding external database or surveillance access.',
        category: 'unsupported_claims'
      };
    }
  }

  // 4. Unsupported Causal & Motivation Speculation (Strict Evidence Grounding)
  const unsupportedCausalPatterns = [
    /\b(exploits?\s+the\s+trust\s+dynamics|provides?\s+a\s+cover\s+of\s+darkness|high\s+cash\s+turnover\s+makes|vehicles?\s+are\s+frequently\s+left\s+unattended|target\s+cash-rich\s+businesses|exploit\s+financially\s+desperate|fewer\s+witnesses\s+allow|because\s+it\s+has\s+many\s+vulnerable\s+shopkeepers|because\s+there\s+are\s+fewer\s+witnesses|offenders?\s+choose\s+.*because|offenders?\s+target\s+.*because\s+they\s+are\s+vulnerable)\b/i
  ];

  const efClean = (evidenceFacts || '').toLowerCase();
  for (const causalPattern of unsupportedCausalPatterns) {
    if (causalPattern.test(answer) && !causalPattern.test(efClean)) {
      return {
        allowed: false,
        reason: 'Response contains unsupported causal or motivational claims not established by verified evidence.',
        category: 'unsupported_causal_explanation'
      };
    }
  }

  // 5. Unsupported Percentage Statistics Grounding Check
  if (evidenceFacts && evidenceFacts.trim().length > 0) {
    const percentageMatches = answer.match(/\b(\d{1,3})%/g) || [];
    for (const pMatch of percentageMatches) {
      const numStr = pMatch.replace('%', '');
      if (!efClean.includes(pMatch) && !efClean.includes(`${numStr}%`) && !efClean.includes(numStr)) {
        return {
          allowed: false,
          reason: `Response contains unsupported percentage (${pMatch}) not established by evidence facts.`,
          category: 'unsupported_statistic'
        };
      }
    }
  }

  return {
    allowed: true,
    reason: null,
    category: 'verified_output'
  };
}

export const guardrailService = {
  validateInput,
  validateResolvedContext,
  validateEvidence,
  validateOutput,
  isCasualQuery,
  isOutOfScopeQuery,
  isPromptInjection
};

export default guardrailService;
