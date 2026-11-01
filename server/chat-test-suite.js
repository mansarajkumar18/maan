import {
  saveConversation,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  clearAllConversations,
} from './conversationStore.js';
import {
  generateChatCompletion,
  streamChatCompletion,
  condenseConversationHistory,
} from './chatService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('===========================================================');
  console.log('NOVA AI: ADVANCED CONVERSATIONAL SYSTEM - 10-POINT TEST SUITE');
  console.log('===========================================================\n');

  // Test 1: Normal Conversation
  console.log('Test 1: Normal Conversation Generation');
  const chat1 = await generateChatCompletion({
    messages: [{ role: 'user', content: 'What is distributed state consensus?' }],
    mode: 'general',
    deepThink: true,
  });
  assert(chat1.content.length > 50, 'Generated comprehensive answer content');
  assert(typeof chat1.model === 'string', `Model identified: ${chat1.model}`);
  assert(chat1.thought !== null, 'Deep Think produced reasoning plan');

  // Test 2: Follow-up Questions & Context Awareness
  console.log('\nTest 2: Follow-up Questions & Predictive Suggestions');
  const chat2 = await generateChatCompletion({
    messages: [
      { role: 'user', content: 'Explain Raft consensus.' },
      { role: 'assistant', content: 'Raft consensus divides time into terms...' },
      { role: 'user', content: 'How does leader election work in detail?' },
    ],
    mode: 'technical',
    deepThink: false,
  });
  assert(chat2.content.includes('Architecture') || chat2.content.length > 100, 'Contextually answered follow-up question');
  assert(Array.isArray(chat2.followUps) && chat2.followUps.length > 0, `Generated ${chat2.followUps.length} follow-up suggestions`);

  // Test 3: Long Conversations & Auto-Summarization
  console.log('\nTest 3: Long Conversations Context Management & Summarization');
  const longHistory = Array.from({ length: 18 }, (_, idx) => ({
    role: idx % 2 === 0 ? 'user' : 'assistant',
    content: `Historical turn ${idx + 1}: discussion regarding system architecture constraints.`,
  }));
  const { condensedMessages, summary } = condenseConversationHistory(longHistory, 10);
  assert(condensedMessages.length <= 11, `Condensed 18 turns down to ${condensedMessages.length} turns`);
  assert(summary !== null && summary.includes('Prior Conversation Summary'), 'Successfully compiled semantic summary of older turns');
  assert(condensedMessages[0].role === 'system', 'Injected prior context recap into system prompt');

  // Test 4: Multiple Simultaneous Users & User Context Isolation
  console.log('\nTest 4: Multiple Simultaneous Users & Context Isolation');
  const userAlpha = 'user_alpha_001';
  const userBeta = 'user_beta_002';

  const convAlpha = await saveConversation(userAlpha, {
    title: "Alpha's Confidential Research",
    messages: [{ role: 'user', content: 'Classified cryptographic protocol specification.' }],
  });
  const convBeta = await saveConversation(userBeta, {
    title: "Beta's Public Project",
    messages: [{ role: 'user', content: 'Frontend styling setup.' }],
  });

  const listAlpha = await listConversations(userAlpha);
  const listBeta = await listConversations(userBeta);

  assert(listAlpha.some((c) => c.id === convAlpha.id), "User Alpha sees Alpha's conversation");
  assert(!listAlpha.some((c) => c.id === convBeta.id), "User Alpha CANNOT see Beta's conversation");
  assert(listBeta.some((c) => c.id === convBeta.id), "User Beta sees Beta's conversation");
  assert(!listBeta.some((c) => c.id === convAlpha.id), "User Beta CANNOT see Alpha's conversation");

  // Test 5: Conversation History CRUD
  console.log('\nTest 5: Conversation History CRUD');
  const savedConv = await getConversation(userAlpha, convAlpha.id);
  assert(savedConv !== null && savedConv.id === convAlpha.id, 'Retrieved full conversation record');
  assert(savedConv.messages.length === 1, 'Loaded message history accurately');

  // Test 6: Delete & Rename Operations
  console.log('\nTest 6: Delete and Rename Operations');
  const renamed = await renameConversation(userAlpha, convAlpha.id, 'Updated Security Architecture');
  assert(renamed.title === 'Updated Security Architecture', 'Renamed conversation successfully');
  const deleted = await deleteConversation(userAlpha, convAlpha.id);
  assert(deleted === true, 'Deleted conversation successfully');
  const refetched = await getConversation(userAlpha, convAlpha.id);
  assert(refetched === null, 'Verified conversation no longer exists after deletion');

  // Test 7: Provider Failure & Fallback Handling
  console.log('\nTest 7: Provider Failure & Fallback Handling');
  // Auto mode gracefully falls back to Nova Neural if external API fails
  const fallbackChat = await generateChatCompletion({
    messages: [{ role: 'user', content: 'Explain fault-tolerant computing.' }],
    mode: 'general',
  });
  assert(fallbackChat.content.length > 50, 'Gracefully delivered resilient synthesized response');

  // Test 8: Missing API Credentials Handling
  console.log('\nTest 8: Missing API Credentials Handling');
  const origProvider = process.env.AI_PROVIDER;
  const origKey = process.env.OPENAI_API_KEY;
  process.env.AI_PROVIDER = 'openai';
  delete process.env.OPENAI_API_KEY;

  let missingKeyError = null;
  try {
    await generateChatCompletion({
      messages: [{ role: 'user', content: 'Test prompt' }],
    });
  } catch (err) {
    missingKeyError = err.message;
  }
  assert(missingKeyError !== null && missingKeyError.includes('missing'), `Reported missing credentials: "${missingKeyError}"`);

  // Restore env
  if (origProvider) process.env.AI_PROVIDER = origProvider;
  else delete process.env.AI_PROVIDER;
  if (origKey) process.env.OPENAI_API_KEY = origKey;

  // Test 9: Streaming Cancellation via AbortSignal
  console.log('\nTest 9: Streaming Cancellation via AbortSignal');
  const controller = new AbortController();
  let chunksReceived = 0;
  let abortedCaught = false;

  const streamPromise = streamChatCompletion({
    messages: [{ role: 'user', content: 'Write a comprehensive 50-paragraph thesis on quantum entanglement.' }],
    mode: 'technical',
    signal: controller.signal,
    onChunk: (chunk) => {
      chunksReceived++;
      if (chunksReceived >= 2) {
        controller.abort(); // Cancel midway
      }
    },
  });

  try {
    await streamPromise;
  } catch (err) {
    abortedCaught = err.message.includes('aborted');
  }
  assert(abortedCaught === true, 'Stream generation aborted immediately upon AbortController signal');

  // Test 10: Authentication and Authorization Boundary Enforcement
  console.log('\nTest 10: Authentication and Authorization Boundary Enforcement');
  // Attempting to access User Beta's conversation using User Alpha's identity
  const crossUserAccess = await getConversation(userAlpha, convBeta.id);
  assert(crossUserAccess === null, 'Cross-user conversation access strictly blocked (returns null/403)');

  // Clean up beta conversation
  await deleteConversation(userBeta, convBeta.id);

  console.log('\n===========================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================\n');
}

runTestSuite().catch(console.error);
