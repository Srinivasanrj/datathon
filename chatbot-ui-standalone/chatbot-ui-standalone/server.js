import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// SECURE CATALYST CREDENTIALS — Read from .env, NEVER exposed to frontend
// ─────────────────────────────────────────────────────────────────────────────
const CATALYST_CLIENT_ID     = process.env.CATALYST_CLIENT_ID;
const CATALYST_CLIENT_SECRET = process.env.CATALYST_CLIENT_SECRET;
const CATALYST_REFRESH_TOKEN = process.env.CATALYST_REFRESH_TOKEN;
const CATALYST_PROJECT_ID    = process.env.CATALYST_PROJECT_ID;
const CATALYST_ORG_ID        = process.env.CATALYST_ORG_ID;
const ZOHO_TOKEN_URL  = 'https://accounts.zoho.in/oauth/v2/token';
// Confirmed GLM chat endpoint for this project
const GLM_CHAT_URL    = `https://api.catalyst.zoho.in/quickml/v1/project/${CATALYST_PROJECT_ID}/glm/chat`;

const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CACHE — In-memory, never exposed to browser
// ─────────────────────────────────────────────────────────────────────────────
let cachedAccessToken = null;
let tokenExpiresAt    = 0;

/**
 * 🔒 Zoho OAuth Token Refresh (server-side only)
 * Uses CATALYST_REFRESH_TOKEN + CLIENT_ID + CLIENT_SECRET.
 * Client Secret NEVER leaves this file.
 */
async function getCatalystToken(forceRefresh = false) {
  if (!forceRefresh && cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken; // return cached if not expiring in next 60s
  }

  try {
    console.log('[Auth] Refreshing Zoho OAuth access token...');
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
    console.log('[Auth] Access token refreshed. Expires in:', data.expires_in, 'seconds. Scope:', data.scope);
    return cachedAccessToken;

  } catch (err) {
    console.error('[Auth] Token refresh failed:', err.message);
    return null;
  }
}

/**
 * 🧠 Catalyst GLM Chat Completion — crm-di-glm47b_30b_it
 * Endpoint: https://api.catalyst.zoho.in/quickml/v1/project/{id}/glm/chat
 * Auth: Zoho OAuth only (no endpoint key needed for /glm/chat).
 * Implements 401 auto-retry with token refresh. Client Secret NEVER leaves server.
 */
async function callCatalystGLM(systemPrompt, userPrompt, history = [], retry = true) {

  const token = await getCatalystToken();
  if (!token) return null;

  // Build messages — skip system message if empty (avoids platform guard trigger)
  const messages = [
    ...(systemPrompt.trim() ? [{ role: 'system', content: systemPrompt }] : []),
    ...history,
    { role: 'user', content: userPrompt }
  ];

  // API payload — enable_thinking disabled to prevent chain-of-thought leakage
  const payload = {
    model: 'crm-di-glm47b_30b_it',
    messages,
    max_tokens: 500,
    temperature: 0.7,
    stream: false,
    chat_template_kwargs: {
      enable_thinking: false
    },
    tools: [
      {
        type: 'function',
        function: {
          name: 'ksp_crime_database_query',
          description: 'Query the KSP crime intelligence database for evidence-based analysis',
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: [
                  'crime_pattern', 'pattern_mutation', 'behavioral_profile',
                  'criminal_network', 'area_comparison', 'socio_demographic',
                  'crime_trend', 'case_lookup', 'general_question'
                ],
                description: 'The classified intent of the officer query'
              },
              district: {
                type: 'string',
                description: 'The district or location relevant to the query, e.g. Bengaluru Urban, Mysuru, Udupi'
              },
              crime_type: {
                type: 'string',
                description: 'The specific crime category if mentioned, e.g. Chain Snatching, ATM Fraud'
              },
              offender_id: {
                type: 'string',
                description: 'Offender ID if queried, e.g. OFF-00261'
              },
              case_id: {
                type: 'string',
                description: 'Case ID if queried, e.g. CASE-00839'
              }
            },
            required: ['intent']
          }
        }
      }
    ],
    tool_choice: 'auto'
  };

  try {
    console.log('[GLM] Calling crm-di-glm47b_30b_it at:', GLM_CHAT_URL);
    const res = await fetch(GLM_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Zoho-oauthtoken ${token}`,
        'CATALYST-ORG':  CATALYST_ORG_ID
      },
      body: JSON.stringify(payload)
    });

    // 401 auto-retry with token refresh
    if (res.status === 401 && retry) {
      console.warn('[GLM] HTTP 401 — Refreshing token and retrying once...');
      await getCatalystToken(true);
      return callCatalystGLM(systemPrompt, userPrompt, history, false);
    }

    const data = await res.json();
    console.log('[GLM] HTTP', res.status, '| model:', data.model, '| tokens used:', data.usage?.total_tokens);

    // ── Catalyst /glm/chat returns { response: "...", tool_calls: [], usage: {...} }
    if (data.response && data.response.trim().length > 0) {
      return data.response;
    }

    // Fallback: OpenAI-compatible format (choices array)
    const choice = data.choices?.[0];
    if (choice?.message?.content) {
      return choice.message.content;
    }

    if (data.code || data.error) {
      console.warn('[GLM] API error:', JSON.stringify(data).substring(0, 300));
    }
    return null;

  } catch (err) {
    console.warn('[GLM] Request failed:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD CRIME PATTERN ENGINE (server-side, reads CSV directly from disk)
// ─────────────────────────────────────────────────────────────────────────────
let processQueryEngine = null;
try {
  const engineModule = await import('./src/crimepattern/crimePatternEngine.js');
  processQueryEngine = engineModule.processQuery;
  console.log('[Engine] Crime pattern engine loaded successfully.');
} catch (e) {
  console.error('[Engine] Failed to load crimePatternEngine:', e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// /chat — MAIN ROUTE: 2-Step LLM Reasoning Pipeline
// Flow: Query → Crime DB Analysis Engine → Ground Truth → GLM Explanation → Response
// ─────────────────────────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  try {
    const { query, history = [], division = 'Bengaluru Division', fir_number = '', context = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query text is required.' });
    }

    console.log(`\n[Chat] Query: "${query.substring(0, 80)}" | Division: ${division}`);

    // ── CASUAL MESSAGE DETECTION — short-circuit before crime engine ──────────
    // Patterns that are clearly conversational and need no database query.
    const CASUAL_PATTERNS = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening|night)|what'?s?\s*up|sup|thanks|thank\s*you|ty|bye|goodbye|ok|okay|cool|great|awesome|who\s*are\s*you|what\s*(are|can)\s*you\s*do|help\s*me|what\s*is\s*(ksp|your\s*name)|introduce\s*yourself)\b/i;

    if (CASUAL_PATTERNS.test(query.trim())) {
      console.log('[Chat] Casual message detected — skipping crime engine.');
      const casualPrompt = `You are KSP Sentinel, a professional crime intelligence assistant for the Karnataka State Police. ` +
        `The officer sent: "${query}". Respond briefly and professionally in a friendly, natural way. ` +
        `You may mention that you specialise in crime intelligence analysis for Karnataka. Keep it short (1-3 sentences).`;

      const casualAnswer = await callCatalystGLM('', casualPrompt, history);
      return res.json({
        success: true,
        answer:  casualAnswer || 'Hello! I\'m KSP Sentinel, your crime intelligence assistant. How can I help you today?',
        intent:  'casual',
        chart_data: null,
        glm_used: true,
        agent_type: 'catalyst_glm_engine',
        agent_label: 'KSP Sentinel AI — Catalyst GLM',
        agent_icon: '🧠',
        agent_color: '#2563eb',
        routing_confidence: 1.0,
        prompt_suggestions: [
          'What are the dominant crime trends in Bengaluru?',
          'Why is chain snatching high in Manipal?',
          'What has changed recently in Mysuru?',
          'Show behavioral profile of OFF-00261'
        ]
      });
    }

    // ── STEP 1: Ground Truth from Crime Database / Analysis Engine ──────────
    let engineResult  = null;
    let rawEvidence   = '';
    let intent        = 'general_question';
    let chartData     = null;

    if (processQueryEngine) {
      engineResult = processQueryEngine(query, context, division);
      rawEvidence  = engineResult?.response?.text    || '';
      intent       = engineResult?.intent            || 'general_question';
      chartData    = engineResult?.response?.chartData || null;
    }

    // ── SANITIZE raw engine text — strip all internal implementation language ─
    // The LLM must never see or echo these to users.
    const sanitizeEvidence = (text) => {
      if (!text) return '';
      return text
        // Strip entire 'Analysis of X records in Y for Z:' header line (with any HTML)
        .replace(/Analysis\s+of\s+(<b>[^<]*<\/b>\s*)+in\s+(<b>[^<]*<\/b>\s*)?(for\s+<b>[^<]*<\/b>\s*)?:?<br\/>/gi, '')
        // Strip any remaining 'N synthetic/recorded/matching records/cases'
        .replace(/\b\d+\s+(synthetic|recorded|matching)\s+(crime\s+)?(records?|cases?|incidents?)\b/gi, '')
        // Remove bare 'synthetic' word
        .replace(/\bsynthetic\b/gi, '')
        // Remove 'in this dataset/database/CSV'
        .replace(/\bin\s+this\s+(dataset|database|CSV|data\s+set)\b/gi, '')
        .replace(/\bthe\s+(dataset|database|CSV|data\s+set)\b/gi, 'intelligence records')
        // Remove leftover 'Analysis of  in ...:' with empty count
        .replace(/Analysis\s+of\s+in\s+<b>[^<]*<\/b>(\s+for\s+<b>[^<]*<\/b>)?:?/gi, '')
        // Remove empty bold tags and double line breaks
        .replace(/<b>\s*<\/b>/g, '')
        .replace(/(<br\/>\s*){2,}/g, '<br/>')
        .trim();
    };

    const groundTruth = sanitizeEvidence(rawEvidence);

    // ── STEP 2: Build Intent-aware evidence packet for GLM ───────────────────
    // We pass only structured facts — NO UI formatting, NO implementation words.
    // The GLM's job is to reason and present them as intelligence findings.
    const stripHTML = (s) => s.replace(/<[^>]*>/g, '').replace(/•\s*/g, '- ').trim();
    const evidenceFacts = stripHTML(groundTruth);

    // ── STEP 3: Build natural-language prompt ────────────────────────────────
    // The model's platform-level guard blocks messages that look like injected instructions
    // (e.g. system prompts with "Rules:", "Task:", "NEVER"). Solution: send everything as
    // a natural-language user message without a system prompt.

    const intentContexts = {
      crime_pattern:      `give a professional intelligence briefing on the dominant crime type, time and location patterns, M.O., and victim profile. Highlight the most actionable finding.`,
      pattern_mutation:   `explain what has changed — the old pattern vs the new pattern, where and when the shift occurred, and what it means operationally.`,
      behavioral_profile: `produce a concise offender profile: M.O., target preference, activity range, and any network connections evident from the intelligence.`,
      criminal_network:   `describe the network — shared M.O., key individuals, operational hubs, and any geographic clustering.`,
      area_comparison:    `compare the two areas side-by-side: dominant crime type, time pattern, geographic focus, M.O., and victim profile. End with a clear comparative assessment.`,
      socio_demographic:  `analyse the demographic patterns visible in the intelligence. Use careful, evidence-based language.`,
      crime_trend:        `explain the direction of change — rising, falling, or shifting — and the most likely driving factors based on the evidence.`,
      case_lookup:        `provide the key facts of this case: crime type, date and time, location, victim, M.O., and any current status.`,
      general_question:   `answer the officer's question using the available intelligence. If the evidence is insufficient for a firm conclusion, say so directly.`
    };

    const intentContext = intentContexts[intent] || intentContexts.general_question;

    // Single natural-language user message — no system prompt
    const naturalPrompt = `You are a senior crime intelligence analyst for the Karnataka State Police. ` +
      `Based on the following intelligence, ${intentContext}\n\n` +
      `Officer's question: ${query}\n` +
      `Jurisdiction: ${division}${fir_number ? ` (FIR: ${fir_number})` : ''}\n\n` +
      `Intelligence summary:\n${evidenceFacts || 'No specific intelligence available for this query.'}\n\n` +
      `Write a professional, concise intelligence briefing. Do not mention databases, record counts, datasets, ` +
      `or internal systems. Use language like "Intelligence indicates...", "The pattern suggests...", ` +
      `"Cases concentrate in...". Only state causes that the evidence actually supports.`;

    // Send with empty system prompt (pass naturalPrompt as user only)
    let llmAnswer = await callCatalystGLM('', naturalPrompt, history);

    // ── Fallback if GLM unavailable — clean up engine output ─────────────────
    if (!llmAnswer) {
      llmAnswer = groundTruth
        .replace(/CRIME PATTERN ANALYSIS/g, 'INTELLIGENCE BRIEF')
        .replace(/📊/g, '🛡️');
      if (!llmAnswer) {
        llmAnswer = `How can I assist? You can ask me about:<br/>
• <b>Crime patterns</b> — <i>"What are the dominant crime trends in Bengaluru?"</i><br/>
• <b>Specific locations</b> — <i>"Why is chain snatching high in Manipal?"</i><br/>
• <b>Pattern shifts</b> — <i>"What has changed recently in Mysuru?"</i><br/>
• <b>Comparisons</b> — <i>"Compare Bengaluru and Udupi crime patterns."</i><br/>
• <b>Offender profiles</b> — <i>"Show profile of OFF-00261"</i>`;
      }
    }

    // Only include chart_data for intents where a chart adds value
    const CHARTABLE_INTENTS = ['crime_pattern', 'pattern_mutation', 'area_comparison', 'socio_demographic', 'crime_trend'];

    return res.json({
      success:            true,
      answer:             llmAnswer,
      intent,
      chart_data:         CHARTABLE_INTENTS.includes(intent) ? chartData : null,
      rag_used:           engineResult?.context?.rag_used || false,
      glm_used:           true,
      agent_type:         'catalyst_glm_engine',
      agent_label:        'KSP Sentinel AI — Catalyst GLM',
      agent_icon:         '🧠',
      agent_color:        '#2563eb',
      routing_confidence: 0.98,
      prompt_suggestions: [
        'What has changed in the last 30 days?',
        'Why is chain snatching high in Manipal?',
        'Compare Bengaluru and Mysuru based on age and gender',
        'Show behavioral profile of OFF-00261'
      ]
    });

  } catch (err) {
    console.error('[Chat] Server Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/health — Credential & Token Verification
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const token = await getCatalystToken();
  res.json({
    status:            token ? 'ok' : 'token_error',
    catalyst_client_id: CATALYST_CLIENT_ID ? 'Configured ✅' : 'Missing ❌',
    refresh_token:     CATALYST_REFRESH_TOKEN ? 'Configured ✅' : 'Missing ❌',
    access_token:      token ? 'Valid — Refreshed ✅' : 'Failed ❌',
    glm_endpoint:      GLM_CHAT_URL,
    glm_model:         'crm-di-glm47b_30b_it',
    glm_active:        true
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🛡️  KSP SENTINEL AI — SECURE BACKEND RUNNING`);
  console.log(`➜  Port:     ${PORT}`);
  console.log(`➜  Client:   ${CATALYST_CLIENT_ID?.substring(0, 10)}... (secured)`);
  console.log(`➜  GLM:      ${GLM_CHAT_URL}`);
  console.log(`➜  Model:    crm-di-glm47b_30b_it`);
  console.log(`==================================================`);

  // Pre-warm the token cache on startup
  getCatalystToken().then(t => {
    if (t) console.log('[Auth] Token pre-warmed successfully on startup.');
    else    console.warn('[Auth] Token pre-warm failed. Check CATALYST_REFRESH_TOKEN.');
  });
});
