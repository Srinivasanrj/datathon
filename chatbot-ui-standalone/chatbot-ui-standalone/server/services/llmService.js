/**
 * LLM Reasoning Service — Catalyst GLM Integration
 * Communicates securely with Zoho Catalyst QuickML GLM endpoint (crm-di-glm47b_30b_it).
 * Client secret and tokens remain strictly server-side.
 */

import dotenv from 'dotenv';
dotenv.config();

const CATALYST_CLIENT_ID     = process.env.CATALYST_CLIENT_ID;
const CATALYST_CLIENT_SECRET = process.env.CATALYST_CLIENT_SECRET;
const CATALYST_REFRESH_TOKEN = process.env.CATALYST_QUICKML_REFRESH_TOKEN || process.env.CATALYST_REFRESH_TOKEN || '1000.bc1979065adc3aa90a6595e132e2afa9.0ac730c66c0267f2b002a28ee1e587dc';
const CATALYST_PROJECT_ID    = process.env.CATALYST_PROJECT_ID || '54626000000013049';
const CATALYST_ORG_ID        = process.env.CATALYST_ORG_ID || '60077159195';

const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token';
const GLM_CHAT_URL   = `https://api.catalyst.zoho.in/quickml/v1/project/${CATALYST_PROJECT_ID}/glm/chat`;

let cachedAccessToken = null;
let tokenExpiresAt    = 0;

/**
 * 🔒 Zoho OAuth Token Management for QuickML GLM (server-side only)
 */
export async function getCatalystToken(forceRefresh = false) {
  if (!forceRefresh && cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  try {
    console.log('[LLMService] Refreshing Zoho OAuth access token for QuickML...');
    const res = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     CATALYST_CLIENT_ID,
        client_secret: CATALYST_CLIENT_SECRET,
        refresh_token: CATALYST_REFRESH_TOKEN
      }).toString()
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`OAuth Error: ${data.error} — ${data.error_description || ''}`);
    }

    cachedAccessToken = data.access_token;
    tokenExpiresAt    = Date.now() + (data.expires_in || 3600) * 1000;
    console.log('[LLMService] Token refreshed. Expires in:', data.expires_in, 'seconds.');
    return cachedAccessToken;
  } catch (err) {
    console.error('[LLMService] Token refresh failed:', err.message);
    return null;
  }
}

class LLMService {
  constructor() {
    this.model = 'crm-di-glm47b_30b_it';
  }

  /**
   * Pre-warm access token on startup
   */
  async prewarm() {
    const token = await getCatalystToken();
    return !!token;
  }

  /**
   * Call Catalyst GLM API with prompt and conversational history
   */
  async callGLM(userPrompt, history = [], retry = true) {
    const token = await getCatalystToken();
    if (!token) return null;

    const messages = [
      ...history,
      { role: 'user', content: userPrompt }
    ];

    const payload = {
      model: this.model,
      messages,
      max_tokens: 600,
      temperature: 0.35,
      stream: false,
      chat_template_kwargs: {
        enable_thinking: false
      }
    };

    try {
      console.log('[LLMService] Calling GLM at:', GLM_CHAT_URL);
      const res = await fetch(GLM_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Zoho-oauthtoken ${token}`,
          'CATALYST-ORG':  CATALYST_ORG_ID
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401 && retry) {
        console.warn('[LLMService] HTTP 401 — Refreshing token and retrying...');
        await getCatalystToken(true);
        return this.callGLM(userPrompt, history, false);
      }

      const data = await res.json();
      console.log('[LLMService] HTTP', res.status, '| model:', data.model, '| tokens used:', data.usage?.total_tokens);

      let text = data.response || data.choices?.[0]?.message?.content;
      if (text && typeof text === 'string' && text.trim().length > 0) {
        text = text.trim();
        // If GLM produced thinking trace or "1. Analyze the User's Request", extract the clean answer
        if (text.includes('**Answer:**') || text.includes('**Intelligence Assessment:**') || text.includes('**Summary:**') || text.includes('**INTELLIGENCE BRIEFING')) {
          const matchIdx = text.search(/\*\*(?:Answer:|Intelligence Assessment:|Summary:|INTELLIGENCE BRIEFING)/i);
          if (matchIdx !== -1) {
            text = text.substring(matchIdx).replace(/^\*\*Answer:\*\*\s*/i, '').trim();
          }
        }
        return text;
      }

      if (data.code || data.error) {
        console.warn('[LLMService] API response warning:', JSON.stringify(data).substring(0, 200));
      }
      return null;
    } catch (err) {
      console.error('[LLMService] Request failed:', err.message);
      return null;
    }
  }

  /**
   * Generate a casual conversational response
   */
  async generateCasualResponse(query, history = []) {
    const casualPrompt = `You are KSP Sentinel, a professional crime intelligence assistant for the Karnataka State Police. ` +
      `The officer sent: "${query}". Respond briefly and professionally in a friendly, natural way. ` +
      `You may mention that you specialise in crime intelligence analysis for Karnataka. Keep it short (1-3 sentences).`;

    return await this.callGLM(casualPrompt, history);
  }

  /**
   * Generate a structured intelligence briefing matching the official KSP Sentinel UI format
   */
  async generateIntelligenceBrief({ query, division, fir_number, intent, evidenceFacts, history = [] }) {
    const isWhyQuery = query.toLowerCase().includes('why') || query.toLowerCase().includes('cause') || query.toLowerCase().includes('contribut') || query.toLowerCase().includes('reason');
    const isPreventionQuery = query.toLowerCase().includes('prevent') || query.toLowerCase().includes('mitigat') || query.toLowerCase().includes('action') || query.toLowerCase().includes('stop') || query.toLowerCase().includes('how to prevent');
    const isLocationListQuery = (query.toLowerCase().includes('list the location') || query.toLowerCase().includes('locations in') || query.toLowerCase().includes('show hotspots')) && intent === 'location_analysis';

    let templateInstruction = '';

    if (intent === 'behavioral_profile') {
      templateInstruction = `Produce a structured behavioral dossier in this format:
**BEHAVIORAL DOSSIER — [Offender ID]**
**Offender ID:** [ID] (Repeat / First-Time Offender)
**Demographics:** [Gender], Age Band: [Age]
**Associated Crime Categories:** [Categories from evidence]
**Operational Jurisdiction(s):** [Districts from evidence]
**Primary Modus Operandi:** "[MO summary from evidence]"
**Linked Records:** [X] documented incidents ([Y] active)`;
    } else if (isWhyQuery) {
      templateInstruction = `Produce an evidence-grounded intelligence assessment for ${division}:
**INTELLIGENCE ASSESSMENT — ${division.toUpperCase()}**
**Documented Pattern:** [State the verified dominant crime category, case count, percentage share, and primary modus operandi strictly from the evidence]
**Temporal & Geographic Concentration:** [State the verified peak time window and top locality strictly from the evidence]
**Causal Grounding:** The available verified records document the empirical distribution and modus operandi, but do not establish the underlying causal factors or offender motivations.
**Operational Directive:** [Actionable patrol, checkpoint, or surveillance deployment focusing strictly on the verified hotspot and time window]`;
    } else if (isPreventionQuery) {
      templateInstruction = `Produce a targeted law enforcement mitigation strategy for ${division}:
**INTELLIGENCE ASSESSMENT — MITIGATION STRATEGY**
**Targeted Surveillance:** [Specific plainclothes / vehicular surveillance deployment windows and hotspot sectors from evidence]
**Operational Interdiction:** [Active tactical interdiction measures targeting the specific M.O. from evidence]
**Community & Commercial Engagement:** [Direct preventive engagement with vulnerable businesses, kiosks, or citizen groups]`;
    } else if (isLocationListQuery) {
      templateInstruction = `Produce a structured location hotspot breakdown for ${division}:
**INTELLIGENCE SUMMARY — ${division.toUpperCase()}**
**Primary Location:** [Top Locality Name] ([X] incidents, [X]% share)
**Secondary Location:** [Second Locality Name] ([X] incidents, [X]% share)
**Tertiary Location:** [Third Locality Name] ([X] incidents, [X]% share)`;
    } else if (intent === 'pattern_mutation') {
      templateInstruction = `Produce a pattern mutation briefing explaining the shift in ${division}:
**PATTERN MUTATION SIGNAL — ${division.toUpperCase()}**
**Baseline vs Current Period:** [Comparison of dominant crime categories and frequency strictly from evidence]
**Temporal Shift:** [How peak time windows or operational hours have evolved strictly from evidence]
**Geographic & Locality Evolution:** [Shifts in hotspot localities or target location profiles strictly from evidence]
**Modus Operandi Adaptation:** [Changes in offender tactics, methods, or tools strictly from evidence]
**Command Directive:** [Specific tactical adjustments needed for ground officers based on verified shifts]`;
    } else if (intent === 'comparative_explanation') {
      templateInstruction = `Produce a structured comparative assessment grounded strictly in the verified evidence across ${division}:
**COMPARATIVE INTELLIGENCE ASSESSMENT — ${division ? division.toUpperCase() : 'MULTI-JURISDICTIONAL COMPARISON'}**
**Observed Jurisdictional Patterns:** [Summarize the verified dominant crimes, volume, percentages, and modus operandi for both districts strictly from evidence]
**Temporal & Locality Comparison:** [Contrast the verified peak hours and concentration localities for each jurisdiction strictly from evidence]
**Causal Grounding:** The verified records identify the distinct operational patterns and methods across both jurisdictions, but do not establish the root causal factors or offender motivations.
**Targeted Command Directives:** [Distinct tactical deployment and patrol focus tailored strictly to the verified time windows and hotspots in each jurisdiction]`;
    } else if (intent === 'comparative_mutation') {
      templateInstruction = `Produce a structured comparative 30-day pattern mutation signal assessing recent shifts in ${division}:
**PATTERN MUTATION SIGNAL — ${division ? division.toUpperCase() : 'MULTI-JURISDICTIONAL EVOLUTION'}**
**Recent 30-Day Evolution Across Jurisdictions:** [Compare how the baseline patterns have evolved over the last 30 days in both districts strictly from evidence]
**Temporal & Locality Mutations:** [Detail the specific shifts in peak operational hours, hotspots, and tactics observed in both areas strictly from evidence]
**Operational Command Directives:** [Actionable tactical adjustments recommended for both district commands based on verified shifts]`;
    } else if (intent === 'area_comparison' || query.toLowerCase().includes('compare')) {
      templateInstruction = `Produce a structured comparative intelligence briefing contrasting the two jurisdictions (${division}):
**COMPARATIVE INTELLIGENCE BRIEFING — ${division ? division.toUpperCase() : 'JURISDICTIONAL COMPARISON'}**
**Volume & Dominant Crimes:** [Contrast total documented incident volumes and dominant crime categories with percentage shares for both jurisdictions strictly from evidence]
**Demographic Breakdown (Age & Gender):** [Detail and contrast the offender age distributions and gender shares in both districts strictly from evidence]
**Temporal & Location Signatures:** [Contrast the peak operational time windows and primary target localities in each district strictly from evidence]
**Modus Operandi Divergence:** [Contrast the specific operational techniques and tools employed in both jurisdictions strictly from evidence]
**Comparative Command Directives:** [Distinct tactical deployment and patrol recommendations tailored to each jurisdiction's verified risk profile]`;
    } else {
      // Default: District Intelligence Briefing
      templateInstruction = `Produce a structured intelligence briefing for ${division} matching this exact format:
**INTELLIGENCE BRIEFING — ${division.toUpperCase()}**
**Dominant Crime Type:** [Dominant Crime Category] — [X]% share
**Time Pattern:** Offenses concentrate during [Time Window from evidence]
**Location Pattern:** Cases concentrate in [Top Locality Name] ([X]% share). The target locations are predominantly [Target Location Profile from evidence].
**Modus Operandi:** The dominant technique employed is "[Primary M.O. from evidence]".
**Victim Profile:** Documented victim demographics and profiles from evidence.
**Most Actionable Finding:** The concentration in [Top Locality Name] ([X]% share) during [Time Pattern] under "[Primary M.O.]" indicates a specific operational focus. Deploy targeted patrols and visible checkpoints in [Top Locality Name] during [Time Pattern].`;
    }

    const naturalPrompt = `You are an evidence-grounded crime intelligence assistant for the Karnataka State Police.

Use VERIFIED EVIDENCE as the sole source of factual claims.
Conversation history is provided only for reference resolution.
Do not treat previous assistant statements as evidence.
Do not invent causes, motivations, explanations, statistics, locations, demographic facts, or operational reasons.
If the evidence does not establish why a pattern occurs, explicitly state that the available verified data shows the observed pattern, but does not establish the underlying causal factors.
You may summarize, compare, calculate, and explain relationships that are directly supported by the supplied evidence.
Never manufacture missing evidence.

Officer's Question: "${query}"
Jurisdiction: ${division}${fir_number ? ` (FIR: ${fir_number})` : ''}

Verified Intelligence Facts:
${evidenceFacts || 'No specific intelligence facts available for this query.'}

${templateInstruction}

Guidelines:
- Present verified facts directly supported by the evidence above.
- Do not invent speculative offender psychological motivations, witness presence assertions, or ungrounded economic causes.
- If asked "why" and the evidence only provides pattern/correlation metrics, explicitly clarify that the verified records document the empirical distribution and modus operandi, but do not establish the root causal driver.
- Follow the bold field format shown above.`;

    return await this.callGLM(naturalPrompt, history);
  }
}

export const llmService = new LLMService();
export default llmService;
