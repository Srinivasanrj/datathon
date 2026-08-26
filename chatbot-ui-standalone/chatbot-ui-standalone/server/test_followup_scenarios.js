/**
 * Verification Test Script for Conversational Follow-up Context Resolution
 * Tests all 6 scenarios required by the user specification.
 */

import { chatService } from './services/chatService.js';
import { getRecentContext } from './services/memoryService.js';

async function runTests() {
  console.log('===============================================================');
  console.log('   STARTING KSP SENTINEL FOLLOW-UP RESOLUTION TEST SUITE       ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 6;

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Single District Follow-up (Kolar)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Kolar Crime Query -> Follow-up "why is that high?" ---');
  const session1 = `test_kolar_${Date.now()}`;
  const t1_r1 = await chatService.processChatMessage({
    message: 'what is high crime in Kolar?',
    conversationId: session1
  });
  console.log(`Turn 1 Intent: ${t1_r1.context.intent} | District: ${t1_r1.context.district} | Crime: ${t1_r1.context.lastReferencedCrimeType}`);

  const t1_r2 = await chatService.processChatMessage({
    message: 'why is that high?',
    conversationId: session1
  });
  console.log(`Turn 2 Intent: ${t1_r2.context.intent} | District: ${t1_r2.context.district} | Crime: ${t1_r2.context.lastReferencedCrimeType}`);
  console.log(`Turn 2 Briefing snippet: ${t1_r2.answer.substring(0, 120)}...`);

  const t1_pass = t1_r2.context.district?.toLowerCase().includes('kolar') &&
                  t1_r2.context.conversationTopic?.districts?.includes('Kolar');
  if (t1_pass) {
    console.log('✅ TEST 1 PASSED: Correctly resolved Kolar + dominant crime.\n');
    passed++;
  } else {
    console.error('❌ TEST 1 FAILED\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Locality & Crime Type Follow-up (Manipal -> Chain Snatching)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2: Manipal Chain Snatching -> Follow-up "what are the reasons for that?" ---');
  const session2 = `test_manipal_${Date.now()}`;
  const t2_r1 = await chatService.processChatMessage({
    message: 'why is chain snatching high in Manipal?',
    conversationId: session2
  });
  console.log(`Turn 1 District: ${t2_r1.context.district} | Crime: ${t2_r1.context.lastReferencedCrimeType}`);

  const t2_r2 = await chatService.processChatMessage({
    message: 'what are the reasons for that?',
    conversationId: session2
  });
  console.log(`Turn 2 District: ${t2_r2.context.district} | Crime: ${t2_r2.context.lastReferencedCrimeType}`);
  console.log(`Turn 2 Briefing snippet: ${t2_r2.answer.substring(0, 120)}...`);

  const t2_pass = (t2_r2.context.district?.toLowerCase().includes('manipal') || t2_r2.context.district?.toLowerCase().includes('udupi')) &&
                  (t2_r2.context.lastReferencedCrimeType?.toLowerCase().includes('snatching') || t2_r2.context.conversationTopic?.crimeTypes?.some(c => c.toLowerCase().includes('snatching')));
  if (t2_pass) {
    console.log('✅ TEST 2 PASSED: Correctly retained Manipal / Udupi and Chain Snatching.\n');
    passed++;
  } else {
    console.error('❌ TEST 2 FAILED\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Multi-District Comparison Generic Follow-up (Belagavi vs Kalaburagi)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 3: Compare Belagavi and Kalaburagi -> Follow-up "why is that happening?" ---');
  const session3 = `test_comp_why_${Date.now()}`;
  const t3_r1 = await chatService.processChatMessage({
    message: 'compare Belagavi and Kalaburagi',
    conversationId: session3
  });
  console.log(`Turn 1 Districts in topic: ${JSON.stringify(t3_r1.context.conversationTopic?.districts)} | Map: ${JSON.stringify(t3_r1.context.conversationTopic?.districtCrimeMap)}`);

  const t3_r2 = await chatService.processChatMessage({
    message: 'why is that happening?',
    conversationId: session3
  });
  console.log(`Turn 2 Topic: ${JSON.stringify(t3_r2.context.conversationTopic?.topicType)} | Districts: ${JSON.stringify(t3_r2.context.conversationTopic?.districts)}`);
  console.log(`Turn 2 Briefing snippet: ${t3_r2.answer.substring(0, 150)}...`);

  const t3_districts = t3_r2.context.conversationTopic?.districts || [];
  const t3_pass = t3_districts.length >= 2 &&
                  t3_districts.some(d => d.toLowerCase().includes('belagavi')) &&
                  t3_districts.some(d => d.toLowerCase().includes('kalaburagi'));
  if (t3_pass) {
    console.log('✅ TEST 3 PASSED: Retained BOTH Belagavi and Kalaburagi without collapsing to one.\n');
    passed++;
  } else {
    console.error('❌ TEST 3 FAILED\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Comparison Narrowing Follow-up (Belagavi specific)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 4: Compare Belagavi and Kalaburagi -> Follow-up "why is it high in Belagavi?" ---');
  const session4 = `test_comp_narrow_${Date.now()}`;
  const t4_r1 = await chatService.processChatMessage({
    message: 'compare Belagavi and Kalaburagi',
    conversationId: session4
  });

  const t4_r2 = await chatService.processChatMessage({
    message: 'why is it high in Belagavi?',
    conversationId: session4
  });
  console.log(`Turn 2 Topic: ${t4_r2.context.conversationTopic?.topicType} | District: ${t4_r2.context.district} | Crime: ${t4_r2.context.lastReferencedCrimeType}`);
  console.log(`Turn 2 Briefing snippet: ${t4_r2.answer.substring(0, 120)}...`);

  const t4_pass = t4_r2.context.district?.toLowerCase().includes('belagavi') &&
                  !t4_r2.context.district?.toLowerCase().includes('kalaburagi');
  if (t4_pass) {
    console.log('✅ TEST 4 PASSED: Successfully narrowed context specifically to Belagavi.\n');
    passed++;
  } else {
    console.error('❌ TEST 4 FAILED\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Comparison 30-Day Mutation Follow-up (Bengaluru vs Mysuru)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 5: Compare Bengaluru and Mysuru -> Follow-up "what changed in the last 30 days?" ---');
  const session5 = `test_comp_mutation_${Date.now()}`;
  const t5_r1 = await chatService.processChatMessage({
    message: 'Compare Bengaluru and Mysuru based on age and gender',
    conversationId: session5
  });

  const t5_r2 = await chatService.processChatMessage({
    message: 'what changed in the last 30 days?',
    conversationId: session5
  });
  console.log(`Turn 2 Intent: ${t5_r2.context.intent} | Districts: ${JSON.stringify(t5_r2.context.conversationTopic?.districts)}`);
  console.log(`Turn 2 Briefing snippet: ${t5_r2.answer.substring(0, 150)}...`);

  const t5_districts = t5_r2.context.conversationTopic?.districts || [];
  const t5_pass = t5_districts.length >= 2 &&
                  t5_districts.some(d => d.toLowerCase().includes('bengaluru')) &&
                  t5_districts.some(d => d.toLowerCase().includes('mysuru'));
  if (t5_pass) {
    console.log('✅ TEST 5 PASSED: 30-day change analysis remained scoped to BOTH Bengaluru and Mysuru.\n');
    passed++;
  } else {
    console.error('❌ TEST 5 FAILED\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Casual Greeting
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 6: Casual Greeting "hi" ---');
  const session6 = `test_casual_${Date.now()}`;
  const t6_r1 = await chatService.processChatMessage({
    message: 'hi',
    conversationId: session6
  });
  console.log(`Intent: ${t6_r1.context.intent} | Answer: ${t6_r1.answer}`);

  const t6_pass = t6_r1.context.intent === 'casual' && t6_r1.context.rag_used === false;
  if (t6_pass) {
    console.log('✅ TEST 6 PASSED: Casual greeting responded appropriately without crime RAG.\n');
    passed++;
  } else {
    console.error('❌ TEST 6 FAILED\n');
  }

  console.log('===============================================================');
  console.log(`   TEST RESULTS: ${passed}/${total} PASSED                       `);
  console.log('===============================================================');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
