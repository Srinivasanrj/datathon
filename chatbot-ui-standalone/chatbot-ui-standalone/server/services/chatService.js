/**
 * Chat Service Orchestrator
 * Coordinates conversational memory, crime intelligence retrieval,
 * guardrail safety enforcement, and LLM reasoning.
 * Uses persistent Zoho Catalyst Data Store table: ChatMemory (54626000000092001)
 */

import memoryService, { getRecentContext, saveConversationTurn } from './memoryService.js';
import crimePatternService, { extractExplicitDistrict, extractAllDistricts, extractLocation } from './crimePatternService.js';
import llmService from './llmService.js';
import guardrailService from './guardrailService.js';
import { extractCrimeType } from '../../src/crimepattern/crimePatternEngine.js';

// Casual conversation matcher (greeting, gratitude, identification)
const CASUAL_PATTERNS = /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening|night)|what'?s?\s*up|sup|thanks|thank\s*you|ty|bye|goodbye|ok|okay|cool|great|awesome|who\s*are\s*you|what\s*(are|can)\s*you\s*do|help\s*me|what\s*is\s*(ksp|your\s*name)|introduce\s*yourself)\b/i;

/**
 * Lightweight follow-up / context-dependent query detector
 */
export function isFollowUpQuery(query) {
  if (!query) return false;
  const q = query.trim().toLowerCase();

  const followUpPatterns = [
    /\bwhy\s+(is|are|was|were|did|does|do)?\s*(that|this|it|these|those)\b/i,
    /\bwhy\s*\?/i,
    /^why\b/i,
    /\bwhy\s+is\s+(it|that|this)\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhy\s+is\s+(that|this)\s+crime\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhy\s+is\s+.+\s+(high|higher|increasing|happening|occurring|rising)\b/i,
    /\bwhat\s+(causes?|caused|are\s+the\s+reasons?\s+for)\s*(that|this|it|these)?\b/i,
    /\bwhat\s+are\s+the\s+reasons\b/i,
    /\bwhat\s+changed\b/i,
    /\bwhat\s+happened\s*(there|here)?\b/i,
    /\btell\s+me\s+more\b/i,
    /\bexplain\s+(that|this|it|these|more)\b/i,
    /\bhow\s+to\s+prevent\s*(it|this|that)?\b/i,
    /\bwhat\s+about\s+(this|that|it)\b/i,
    /\bwhat\s+about\s+.+\s*(specifically)?\b/i,
    /\bwhich\s+(one|district|city|area|jurisdiction)\b/i,
    /\bwhich\s+is\s+(higher|lower|worse|better|more)\b/i,
    /\bwhich\s+one\s+(has|is)\b/i,
    /\bcompare\s+(them|both|again)\b/i,
    /\bwhat\s+has\s+changed\b/i,
    /\blast\s+30\s+days\b/i,
    /\b30\s+days\b/i,
    /\bgive\s+(me\s+)?summary\b/i,
    /\bsummarize\b/i,
    /^summary$/i
  ];

  return followUpPatterns.some(pattern => pattern.test(q));
}

class ChatService {
  /**
   * Process incoming chat request
   * @param {Object} params
   * @param {string} params.message - User question
   * @param {string} [params.conversationId] - Unique conversation session ID
   * @param {string} [params.division] - Active division/district (e.g. Bengaluru Division)
   * @param {string} [params.fir_number] - Active FIR reference if any
   * @param {Object} [params.context] - Additional context parameters
   */
  async processChatMessage({ message, conversationId, division = 'Bengaluru Division', fir_number = '', context = {} }) {
    // ── 1. RECEIVE USER MESSAGE ──────────────────────────────────────────────
    const activeConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userQuery = (message || '').trim();

    if (!userQuery) {
      throw new Error('Message content is required.');
    }

    console.log(`\n[ChatService] [${activeConversationId}] Query: "${userQuery.substring(0, 80)}" | Division: ${division}`);

    // ── 3. LOAD PERSISTENT MEMORY FROM CATALYST CHATMEMORY ──────────────────
    console.log(`[ChatService] Loading persistent memory for session [${activeConversationId}]`);
    let recentContext = { formattedHistory: [] };
    let existingContext = {};

    try {
      recentContext = await memoryService.getRecentContext(activeConversationId, 10);
      existingContext = {
        lastReferencedDistrict: recentContext.lastReferencedDistrict || null,
        lastReferencedDivision: recentContext.lastReferencedDivision || null,
        lastReferencedCrimeType: recentContext.lastReferencedCrimeType || null,
        lastReferencedEntity: recentContext.lastReferencedEntity || null,
        lastIntent: recentContext.lastIntent || null,
        conversationTopic: recentContext.conversationTopic || {
          conversationIntent: 'general',
          comparedDistricts: [],
          activeDistrict: null,
          activeCrimeType: null,
          referencedEntity: null,
          topicType: 'general',
          districts: [],
          divisions: [],
          crimeTypes: [],
          referencedEntities: [],
          districtCrimeMap: {},
          lastUserQuery: '',
          lastIntent: '',
          lastValidTurn: null
        }
      };
    } catch (memErr) {
      console.warn(`[ChatService] Memory retrieval notice for session [${activeConversationId}]:`, memErr.message);
    }

    const history = recentContext.formattedHistory || [];
    const prevTopic = existingContext.conversationTopic || {};

    // ── Diagnostic Logging for Previous Valid Context ─────────────────────────
    const prevCompared = (prevTopic.comparedDistricts && prevTopic.comparedDistricts.length > 0)
      ? prevTopic.comparedDistricts
      : (prevTopic.topicType === 'comparison' ? prevTopic.districts : []);
    const prevActive = prevTopic.activeDistrict || (prevTopic.topicType !== 'comparison' ? prevTopic.districts?.[0] : null);

    console.log(`[Context] Previous valid intent: ${prevTopic.conversationIntent || prevTopic.lastIntent || 'None'}`);
    console.log(`[Context] Compared districts: ${prevCompared && prevCompared.length > 0 ? prevCompared.join(', ') : 'None'}`);
    console.log(`[Context] Active district: ${prevActive || 'None'}`);

    // ── 2. GUARDRAIL INPUT VALIDATION ────────────────────────────────────────
    const inputValidation = guardrailService.validateInput(userQuery, existingContext);
    console.log(`[Guardrail] Input: allowed=${inputValidation.allowed} (category: ${inputValidation.category})`);

    if (!inputValidation.allowed) {
      let blockedAnswer = '';
      let blockedIntent = 'security_block';

      if (inputValidation.category === 'prompt_injection') {
        console.warn(`[Guardrail] Blocked prompt injection or credential request: "${userQuery}"`);
        blockedAnswer = "Access restricted. KSP Sentinel AI operates under strict law enforcement safety protocols. System instructions, API tokens, and internal configurations cannot be displayed or revealed.";
        blockedIntent = 'security_block';
      } else if (inputValidation.category === 'out_of_scope') {
        console.log(`[Guardrail] Blocked out-of-scope query: "${userQuery}"`);
        blockedAnswer = "I am KSP Sentinel, your specialized crime intelligence assistant for the Karnataka State Police. I can only assist with crime pattern analysis, district crime statistics, modus operandi, area comparisons, and investigative queries for Karnataka jurisdictions.";
        blockedIntent = 'out_of_scope';
      } else {
        blockedAnswer = inputValidation.reason || "Unable to process message.";
        blockedIntent = 'invalid_input';
      }

      const blockedResponseContext = {
        ...existingContext,
        intent: blockedIntent,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_assistant',
        agent_label: 'KSP Sentinel AI — Catalyst GLM'
      };

      // ── 10. SAVE TURN TO CATALYST CHATMEMORY (WITHOUT CORRUPTING ACTIVE CONTEXT) ──
      try {
        console.log(`[ChatService] Saving conversation turn for session [${activeConversationId}]`);
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: blockedAnswer,
          division: existingContext.lastReferencedDistrict || 'Bengaluru Urban',
          district: existingContext.lastReferencedDistrict || 'Bengaluru Urban',
          crimeType: null,
          referencedEntity: null,
          intent: blockedIntent,
          conversationTopic: existingContext.conversationTopic || null
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      // ── 11. RETURN RESPONSE CONTRACT ─────────────────────────────────────────
      return {
        success: true,
        answer: blockedAnswer,
        conversationId: activeConversationId,
        context: blockedResponseContext
      };
    }

    // ── 4. RESOLVE PREVIOUS CONVERSATIONAL CONTEXT ───────────────────────────
    const explicitLocObj = extractLocation(userQuery, null);
    const districtsInQuery = extractAllDistricts(userQuery);
    const explicitDistrict = districtsInQuery.length > 0 ? districtsInQuery[0] : (explicitLocObj?.district || null);
    const explicitLocality = explicitLocObj?.type === 'locality' ? explicitLocObj.name : null;
    const explicitCrimeInQuery = extractCrimeType(userQuery);
    const isFollowUp = isFollowUpQuery(userQuery);

    let effectiveDistricts = [];
    let effectiveDistrict = null;
    let effectiveCrime = explicitCrimeInQuery || null;
    let effectiveTopicType = 'general';
    let preservedComparisonDistricts = (prevTopic.comparedDistricts && prevTopic.comparedDistricts.length >= 2)
      ? [...prevTopic.comparedDistricts]
      : (prevTopic.topicType === 'comparison' && Array.isArray(prevTopic.districts) && prevTopic.districts.length >= 2 ? [...prevTopic.districts] : []);

    if (CASUAL_PATTERNS.test(userQuery)) {
      // Casual query
      effectiveDistrict = 'Bengaluru Urban';
      effectiveDistricts = ['Bengaluru Urban'];
    } else if (districtsInQuery.length >= 2) {
      // Fresh Multi-District Comparison Query (e.g. "compare Belagavi and Kalaburagi")
      effectiveDistricts = [districtsInQuery[0], districtsInQuery[1]];
      effectiveDistrict = `${districtsInQuery[0]}, ${districtsInQuery[1]}`;
      effectiveTopicType = 'comparison';
      preservedComparisonDistricts = [districtsInQuery[0], districtsInQuery[1]];
    } else if (isFollowUp && preservedComparisonDistricts.length >= 2) {
      // Follow-up on a comparison topic (or narrowing from a comparison)
      const compDistricts = preservedComparisonDistricts;

      // Check if user explicitly names ONE of the compared districts in follow-up
      const matchingNarrowDist = compDistricts.find(d => {
        const dClean = d.toLowerCase();
        return userQuery.toLowerCase().includes(dClean) || (explicitDistrict && explicitDistrict.toLowerCase() === dClean);
      });

      if (matchingNarrowDist) {
        // Explicit Narrowing to ONE district (e.g. "Why is it high in Belagavi?" or "Why is Kalaburagi higher?")
        effectiveDistricts = [matchingNarrowDist];
        effectiveDistrict = matchingNarrowDist;
        effectiveCrime = prevTopic.districtCrimeMap?.[matchingNarrowDist] || explicitCrimeInQuery || null;
        effectiveTopicType = 'district_crime';

        console.log(`[Context] Resolved district: ${matchingNarrowDist} (narrowed from comparison)`);
        console.log(`[Context] Resolved crime types: ${effectiveCrime || 'All'}`);
      } else if (explicitCrimeInQuery && !explicitDistrict) {
        // Crime-to-district mapping (Rule D)
        let mappedDist = null;
        for (const d of compDistricts) {
          const dCrime = prevTopic.districtCrimeMap?.[d];
          if (dCrime && dCrime.toLowerCase().includes(explicitCrimeInQuery.toLowerCase())) {
            mappedDist = d;
            break;
          }
        }
        effectiveDistrict = mappedDist || compDistricts[0];
        effectiveDistricts = [effectiveDistrict];
        effectiveCrime = explicitCrimeInQuery;
        effectiveTopicType = 'district_crime';

        console.log(`[Context] Resolved crime: ${explicitCrimeInQuery} -> mapped to ${effectiveDistrict}`);
      } else {
        // Generic / Ambiguous comparison follow-up:
        // "Why is that high?", "Why is that happening?", "Which one is higher?", "Compare them again"
        // MUST PRESERVE BOTH DISTRICTS!
        effectiveDistricts = [...compDistricts];
        effectiveDistrict = compDistricts.join(', ');
        effectiveCrime = prevTopic.crimeTypes?.join(', ') || null;
        effectiveTopicType = 'comparison';

        console.log(`[Context] Preserved comparison districts: ${compDistricts.join(', ')}`);
        console.log(`[Context] Preserved crime types: ${prevTopic.crimeTypes?.join(', ') || 'All'}`);
      }
    } else if (isFollowUp && (prevTopic.topicType === 'district_crime' || existingContext.lastReferencedDistrict) && !explicitDistrict) {
      // Single district follow-up with no new explicit location (e.g. "Why is that crime high?")
      const singleDist = prevTopic.activeDistrict || prevTopic.districts?.[0] || existingContext.lastReferencedDistrict;
      const singleCrime = explicitCrimeInQuery || prevTopic.activeCrimeType || prevTopic.crimeTypes?.[0] || existingContext.lastReferencedCrimeType || null;

      effectiveDistricts = [singleDist];
      effectiveDistrict = singleDist;
      effectiveCrime = singleCrime;
      effectiveTopicType = 'district_crime';

      console.log(`[Context] Resolved single district: ${effectiveDistrict}`);
      console.log(`[Context] Resolved crime types: ${effectiveCrime || 'All'}`);
    } else if (explicitDistrict) {
      // Explicit District / Locality in current query (Highest priority for explicit location!)
      effectiveDistricts = [explicitDistrict];
      effectiveDistrict = explicitLocality || explicitDistrict;
      effectiveTopicType = 'district_crime';
    } else if (existingContext.lastReferencedDistrict) {
      effectiveDistricts = prevTopic.districts?.length > 0 ? prevTopic.districts : [existingContext.lastReferencedDistrict];
      effectiveDistrict = existingContext.lastReferencedDistrict;
      effectiveTopicType = prevTopic.topicType || 'district_crime';
    } else if (division && division !== 'Bengaluru Division' && division !== 'State HQ Command') {
      const explicitReq = extractExplicitDistrict(division);
      const reqDist = explicitReq || division.replace(/ Division| State HQ Command/gi, '').trim();
      effectiveDistricts = [reqDist];
      effectiveDistrict = reqDist;
      effectiveTopicType = 'district_crime';
    } else {
      effectiveDistricts = ['Bengaluru Urban'];
      effectiveDistrict = 'Bengaluru Urban';
      effectiveTopicType = 'district_crime';
    }

    console.log(`[Context] Final resolved context: Topic="${effectiveTopicType}", Districts=[${effectiveDistricts.join(', ')}], ActiveDistrict="${effectiveDistrict}", Crime="${effectiveCrime || 'All'}"`);

    const mergedContext = {
      ...existingContext,
      ...context,
      districts: effectiveDistricts,
      lastReferencedDistrict: effectiveDistrict,
      lastReferencedCrimeType: effectiveCrime || existingContext.lastReferencedCrimeType,
      conversationTopic: {
        ...prevTopic,
        conversationIntent: effectiveTopicType === 'comparison' ? 'area_comparison' : 'district_crime',
        comparedDistricts: preservedComparisonDistricts,
        activeDistrict: effectiveTopicType === 'comparison' ? null : effectiveDistrict,
        activeCrimeType: effectiveCrime,
        topicType: effectiveTopicType,
        districts: effectiveDistricts,
        crimeTypes: effectiveCrime ? [effectiveCrime] : (prevTopic.crimeTypes || [])
      }
    };

    // ── 5. GUARDRAIL RESOLVED CONTEXT VALIDATION ─────────────────────────────
    const contextValidation = guardrailService.validateResolvedContext(mergedContext);
    console.log(`[Guardrail] Context: allowed=${contextValidation.allowed} (category: ${contextValidation.category})`);

    if (!contextValidation.allowed) {
      console.warn(`[Guardrail] Context validation notice: ${contextValidation.reason}`);
    }

    // ── PATH A: Casual Conversation ──────────────────────────────────────────
    if (CASUAL_PATTERNS.test(userQuery)) {
      console.log('[ChatService] Intent: Casual conversation');
      let answer = await llmService.generateCasualResponse(userQuery, history);

      if (!answer) {
        answer = "Hello Officer! I'm KSP Sentinel, your crime intelligence assistant. How can I assist you with district crime patterns or investigative queries today?";
      }

      // Output validation
      const outputValidation = guardrailService.validateOutput(answer, '', mergedContext);
      console.log(`[Guardrail] Output: allowed=${outputValidation.allowed} (category: ${outputValidation.category})`);

      const responseContext = {
        ...mergedContext,
        intent: 'casual',
        division: effectiveDistrict,
        district: effectiveDistrict,
        rag_used: false,
        chart_data: null,
        agent_type: 'sentinel_assistant',
        agent_label: 'KSP Sentinel AI — Catalyst GLM',
        conversationTopic: {
          conversationIntent: 'casual',
          comparedDistricts: preservedComparisonDistricts,
          activeDistrict: null,
          activeCrimeType: null,
          topicType: 'general',
          districts: [],
          divisions: [],
          crimeTypes: [],
          referencedEntities: [],
          districtCrimeMap: {},
          lastUserQuery: userQuery,
          lastIntent: 'casual',
          lastValidTurn: {
            userQuery,
            intent: 'casual',
            createdAt: new Date().toISOString()
          }
        }
      };

      // ── 10. SAVE TURN TO CATALYST CHATMEMORY ─────────────────────────────────
      try {
        console.log(`[ChatService] Saving conversation turn for session [${activeConversationId}]`);
        await memoryService.saveConversationTurn({
          sessionId: activeConversationId,
          userQuery,
          assistantResponse: answer,
          division: effectiveDistrict,
          district: effectiveDistrict,
          crimeType: null,
          referencedEntity: null,
          intent: 'casual',
          conversationTopic: responseContext.conversationTopic
        });
      } catch (saveErr) {
        console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
      }

      // ── 11. RETURN RESPONSE CONTRACT ─────────────────────────────────────────
      return {
        success: true,
        answer,
        conversationId: activeConversationId,
        context: responseContext
      };
    }

    // ── 6. RUN CRIME PATTERN ANALYSIS ────────────────────────────────────────
    console.log(`[CrimePatternService] Analyzing crime query for district: ${effectiveDistrict}`);
    const analysis = crimePatternService.analyzeQuery(userQuery, mergedContext, effectiveDistrict);
    const intent = analysis.intent || 'general_question';
    const isChartable = crimePatternService.isChartableIntent(intent);
    const chartData = isChartable ? analysis.chartData : null;
    const finalResolvedDistrict = analysis.engineResult?.context?.lastReferencedDistrict || effectiveDistrict;
    const compData = analysis.engineResult?.response?.data;

    // ── 7. GUARDRAIL EVIDENCE VALIDATION ─────────────────────────────────────
    const evidenceValidation = guardrailService.validateEvidence(analysis.evidenceFacts);
    console.log(`[Guardrail] Evidence: allowed=${evidenceValidation.allowed} (category: ${evidenceValidation.category})`);

    let targetDivision = finalResolvedDistrict;
    if ((intent === 'area_comparison' || intent === 'comparative_explanation' || intent === 'comparative_mutation') && effectiveDistricts.length >= 2) {
      targetDivision = `${effectiveDistricts[0]} vs ${effectiveDistricts[1]}`;
    } else if (compData?.name1 && compData?.name2) {
      targetDivision = `${compData.name1} vs ${compData.name2}`;
    }

    let answer = '';

    if (!evidenceValidation.allowed) {
      // Grounding Requirement: Do not call LLM to fabricate statistics if evidence is insufficient
      console.warn(`[Guardrail] Insufficient evidence detected for query: "${userQuery}". Skipping LLM fabrication.`);
      answer = "I cannot provide an intelligence briefing for this query because verified crime records are insufficient or unavailable in the Karnataka State Police dataset for the requested location or criteria.";
    } else {
      // ── 8. CALL LLM SERVICE ────────────────────────────────────────────────
      console.log(`[LLMService] Calling GLM intelligence brief for division: ${targetDivision}`);
      answer = await llmService.generateIntelligenceBrief({
        query: userQuery,
        division: targetDivision,
        fir_number,
        intent,
        evidenceFacts: analysis.evidenceFacts,
        history
      });

      // Fallback if LLM is temporarily unreachable
      if (!answer) {
        answer = analysis.sanitizedEvidence
          .replace(/CRIME PATTERN ANALYSIS/g, 'INTELLIGENCE BRIEF')
          .replace(/📊/g, '🛡️');

        if (!answer) {
          answer = `I can provide crime intelligence analysis for Karnataka. You can ask about:\n` +
            `• Dominant crime trends in a district\n` +
            `• Location-specific patterns (e.g. "Why is chain snatching high in Manipal?")\n` +
            `• Recent pattern shifts\n` +
            `• Area comparisons (e.g. "Compare Bengaluru and Mysuru")\n` +
            `• Offender behavioral profiles`;
        }
      }
    }

    // ── 9. GUARDRAIL OUTPUT VALIDATION ───────────────────────────────────────
    const outputValidation = guardrailService.validateOutput(answer, analysis.evidenceFacts, mergedContext);
    console.log(`[Guardrail] Output: allowed=${outputValidation.allowed} (category: ${outputValidation.category})`);

    if (!outputValidation.allowed) {
      console.warn(`[Guardrail] Output validation notice: ${outputValidation.reason}`);
      if (
        outputValidation.category === 'unsupported_causal_explanation' ||
        outputValidation.category === 'unsupported_statistic' ||
        outputValidation.category === 'unsupported_claims' ||
        outputValidation.category === 'secret_leak' ||
        outputValidation.category === 'system_prompt_leak'
      ) {
        answer = analysis.sanitizedEvidence
          .replace(/CRIME PATTERN ANALYSIS/g, 'INTELLIGENCE BRIEF')
          .replace(/📊/g, '🛡️') || "The generated analysis was sanitized in accordance with law enforcement evidence standards.";

        if (userQuery.toLowerCase().includes('why') || userQuery.toLowerCase().includes('cause')) {
          answer += `\n\nNote: The available verified records document the empirical pattern and modus operandi, but do not establish the underlying causal factors.`;
        }
      }
    }

    // Construct structured conversation topic for state persistence
    let updatedTopic;
    if (intent === 'area_comparison' || intent === 'comparative_explanation' || intent === 'comparative_mutation' || effectiveDistricts.length >= 2) {
      const d1 = compData?.name1 || effectiveDistricts[0];
      const d2 = compData?.name2 || effectiveDistricts[1];
      const c1 = compData?.fp1?.dominantCrime?.name || compData?.mut1?.fp2?.dominantCrime?.name || '';
      const c2 = compData?.fp2?.dominantCrime?.name || compData?.mut2?.fp2?.dominantCrime?.name || '';

      updatedTopic = {
        conversationIntent: intent,
        comparedDistricts: [d1, d2],
        activeDistrict: null,
        activeCrimeType: [c1, c2].filter(Boolean).join(', ') || null,
        referencedEntity: null,
        topicType: 'comparison',
        districts: [d1, d2],
        divisions: [division],
        crimeTypes: [c1, c2].filter(Boolean),
        referencedEntities: [],
        districtCrimeMap: {
          [d1]: c1,
          [d2]: c2
        },
        lastUserQuery: userQuery,
        lastIntent: intent,
        lastValidTurn: {
          userQuery,
          intent,
          district: `${d1}, ${d2}`,
          crimeType: [c1, c2].filter(Boolean).join(', '),
          createdAt: new Date().toISOString()
        }
      };
    } else {
      const resolvedDist = analysis.engineResult?.context?.lastReferencedDistrict || effectiveDistrict;
      const resolvedCrime = analysis.engineResult?.context?.lastReferencedCrimeType || effectiveCrime || '';

      updatedTopic = {
        conversationIntent: intent,
        comparedDistricts: preservedComparisonDistricts,
        activeDistrict: resolvedDist,
        activeCrimeType: resolvedCrime || null,
        referencedEntity: null,
        topicType: 'district_crime',
        districts: [resolvedDist],
        divisions: [division],
        crimeTypes: resolvedCrime ? [resolvedCrime] : [],
        referencedEntities: [],
        districtCrimeMap: {
          ...(prevTopic.districtCrimeMap || {}),
          [resolvedDist]: resolvedCrime
        },
        lastUserQuery: userQuery,
        lastIntent: intent,
        lastValidTurn: {
          userQuery,
          intent,
          district: resolvedDist,
          crimeType: resolvedCrime,
          createdAt: new Date().toISOString()
        }
      };
    }

    const responseContext = {
      ...mergedContext,
      ...(analysis.engineResult?.context || {}),
      intent,
      division: finalResolvedDistrict,
      district: finalResolvedDistrict,
      lastReferencedDistrict: finalResolvedDistrict,
      fir_number: fir_number || null,
      rag_used: evidenceValidation.allowed && (analysis.engineResult?.context?.rag_used || true),
      chart_data: evidenceValidation.allowed ? chartData : null,
      agent_type: 'sentinel_intelligence',
      agent_label: 'KSP Sentinel AI — Catalyst GLM',
      conversationTopic: updatedTopic,
      prompt_suggestions: [
        'What has changed in the last 30 days?',
        'Why is chain snatching high in Manipal?',
        'Compare Bengaluru and Mysuru based on age and gender',
        'Show behavioral profile of OFF-00261'
      ]
    };

    // ── 10. SAVE TURN TO CATALYST CHATMEMORY ─────────────────────────────────
    try {
      console.log(`[ChatService] Saving conversation turn for session [${activeConversationId}]`);
      await memoryService.saveConversationTurn({
        sessionId: activeConversationId,
        userQuery,
        assistantResponse: answer,
        division: finalResolvedDistrict,
        district: finalResolvedDistrict,
        crimeType:
          responseContext.lastReferencedCrimeType ||
          responseContext.crimeType ||
          null,
        referencedEntity:
          responseContext.lastReferencedEntity ||
          null,
        intent: responseContext.intent || intent,
        conversationTopic: updatedTopic
      });
    } catch (saveErr) {
      console.warn(`[ChatService] Memory save notice for session [${activeConversationId}]:`, saveErr.message);
    }

    // ── 11. RETURN RESPONSE CONTRACT ─────────────────────────────────────────
    return {
      success: true,
      answer,
      conversationId: activeConversationId,
      context: responseContext
    };
  }
}

export const chatService = new ChatService();
export default chatService;
