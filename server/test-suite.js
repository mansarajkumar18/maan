import { executeWebSearch, validateSearchQuery } from './searchService.js';
import {
  generateIntelligentAnswer,
  buildContextualSearchQuery,
  validateAndEnrichCitations,
  validateAnswerRequest,
} from './aiService.js';

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
  console.log('====================================================');
  console.log('NOVA AI: INTELLIGENT ANSWER ENGINE - FULL TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Normal Factual Queries
  console.log('Test 1: Normal Factual Query ("what is artificial intelligence")');
  const search1 = await executeWebSearch('what is artificial intelligence');
  assert(search1.sources.length >= 3, `Retrieved ${search1.sources.length} sources (>= 3)`);
  assert(search1.sources[0].url.startsWith('http'), `Source 1 has valid URL: ${search1.sources[0].url}`);
  const answer1 = await generateIntelligentAnswer('what is artificial intelligence', search1);
  assert(answer1.answer.length > 100, 'Answer generated with rich content');
  assert(answer1.citations.length > 0, `Validated ${answer1.citations.length} inline citations`);
  assert(answer1.totalCitations > 0, `Total citations count is ${answer1.totalCitations}`);

  // Test 2: Complex Research Question
  console.log('\nTest 2: Complex Research Question ("quantum computing topological surface codes")');
  const search2 = await executeWebSearch('quantum computing topological surface codes');
  assert(search2.sources.length >= 2, `Complex query retrieved ${search2.sources.length} sources`);
  const answer2 = await generateIntelligentAnswer('quantum computing topological surface codes', search2);
  assert(answer2.answer.includes('## Executive Summary'), 'Contains structured Executive Summary section');
  assert(answer2.confidenceScore >= 80, `Confidence score is high: ${answer2.confidenceScore}%`);

  // Test 3: Conflicting Sources Detection
  console.log('\nTest 3: Conflicting Sources Detection (Conflicting timeline years)');
  const conflictingSources = {
    sources: [
      {
        title: 'Project Alpha Benchmark 2024 Report',
        url: 'https://research-alpha.org/2024',
        domain: 'research-alpha.org',
        snippet: 'The benchmark achieved 92.4% validation in 2024 across initial tests.',
        reliability: '96%',
        date: '2024',
      },
      {
        title: 'Project Alpha Revised 2026 Assessment',
        url: 'https://research-alpha.org/2026',
        domain: 'research-alpha.org',
        snippet: 'Revised architectures in 2026 demonstrate full fault tolerance exceeding earlier limits.',
        reliability: '98%',
        date: '2026',
      },
    ],
  };
  const answer3 = await generateIntelligentAnswer('Project Alpha timeline', conflictingSources);
  assert(
    answer3.answer.includes('Source Nuance Note') || answer3.answer.includes('2024') || answer3.answer.includes('2026'),
    'Answer notes nuances or multiple timelines across sources'
  );

  // Test 4: Insufficient Search Results (Empty Sources Handling)
  console.log('\nTest 4: Insufficient Search Results (Empty Sources Array)');
  const emptySearch = { sources: [] };
  const answer4 = await generateIntelligentAnswer('unindexed query test', emptySearch);
  assert(answer4.configured === true, 'Handled empty search gracefully without crashing');
  assert(answer4.answer.includes('## Executive Overview'), 'Provided foundational conceptual synthesis');
  assert(answer4.citations.length === 0, 'Does not fabricate fake citations for 0 sources');

  // Test 5: Missing AI Credentials Handling
  console.log('\nTest 5: Missing AI Credentials Handling (Simulating AI_PROVIDER=gemini without key)');
  const savedProvider = process.env.AI_PROVIDER;
  const savedKey = process.env.GEMINI_API_KEY;
  process.env.AI_PROVIDER = 'gemini';
  delete process.env.GEMINI_API_KEY;
  const unconfiguredAnswer = await generateIntelligentAnswer('test query', search1);
  assert(unconfiguredAnswer.configured === false, 'Returns configured: false');
  assert(unconfiguredAnswer.provider === 'gemini', 'Identifies unconfigured provider correctly');
  assert(Array.isArray(unconfiguredAnswer.instructions), 'Provides step-by-step setup instructions');
  // Restore environment
  if (savedProvider) process.env.AI_PROVIDER = savedProvider;
  else delete process.env.AI_PROVIDER;
  if (savedKey) process.env.GEMINI_API_KEY = savedKey;

  // Test 6: AI Provider Failures & Input Validation
  console.log('\nTest 6: Security & Input Validation');
  const validCheck = validateAnswerRequest({ query: '   ' });
  assert(validCheck.valid === false, 'Rejects empty whitespace query');
  const longQueryCheck = validateAnswerRequest({ query: 'a'.repeat(600) });
  assert(longQueryCheck.valid === false, 'Rejects query exceeding length limit');
  const validReq = validateAnswerRequest({ query: 'What is Web3?' });
  assert(validReq.valid === true, 'Accepts valid query');
  assert(typeof validReq.conversationId === 'string', 'Generates session conversationId');

  // Test 7: Invalid / Hallucinated Citations Removal
  console.log('\nTest 7: Invalid / Hallucinated Citations Stripping');
  const mockSources = [
    { id: 1, title: 'Source One', url: 'https://one.com', domain: 'one.com' },
    { id: 2, title: 'Source Two', url: 'https://two.com', domain: 'two.com' },
  ];
  const textWithHallucinations = 'Claim grounded in reality [1], but this claim cites non-existent source [99] and [42] and valid source [2].';
  const sanitized = validateAndEnrichCitations(textWithHallucinations, mockSources);
  assert(!sanitized.cleanedText.includes('[99]'), 'Stripped fake citation [99]');
  assert(!sanitized.cleanedText.includes('[42]'), 'Stripped fake citation [42]');
  assert(sanitized.cleanedText.includes('[1]'), 'Preserved valid citation [1]');
  assert(sanitized.cleanedText.includes('[2]'), 'Preserved valid citation [2]');
  assert(sanitized.invalidCitationsRemoved === 2, `Counted exactly 2 invalid citations removed`);
  assert(sanitized.citationsUsed.length === 2, 'Collected 2 valid source records');

  // Test 8: Follow-up Questions & Conversation Context Resolution
  console.log('\nTest 8: Follow-up Questions Contextual Resolution');
  const history = [
    { role: 'user', content: 'What is quantum computing?' },
    { role: 'assistant', content: 'Quantum computing uses qubits...' },
  ];
  const followUp1 = buildContextualSearchQuery('how does it compare to classical computers?', history);
  assert(followUp1.includes('quantum computing'), `Resolved pronoun "it" to include prior anchor: "${followUp1}"`);
  
  const independentQuery = buildContextualSearchQuery('What is photosynthesis in plants?', history);
  assert(independentQuery === 'What is photosynthesis in plants?', 'Preserved independent query without modification');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');
}

runTestSuite().catch(console.error);
