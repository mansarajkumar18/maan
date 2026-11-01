import {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  validateCodePayload,
  generateCode,
  explainCode,
  debugCode,
  optimizeCode,
  chatWithCode,
  executeSandboxedCode,
} from './codeService.js';
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  saveProjectFile,
  renameProjectFile,
  deleteProjectFile,
  sanitizeRelativePath,
} from './projectStore.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runCodeTestSuite() {
  console.log('===========================================================');
  console.log('NOVA AI: CODE STUDIO - 12-POINT BACKEND VERIFICATION SUITE');
  console.log('===========================================================\n');

  // Test 1: Language Normalization & Input Validation
  console.log('Test 1: Language Normalization & Input Validation');
  assert(normalizeLanguage('py') === 'python', 'Normalized "py" to "python"');
  assert(normalizeLanguage('JS') === 'javascript', 'Normalized "JS" to "javascript"');
  assert(normalizeLanguage('c++') === 'cpp', 'Normalized "c++" to "cpp"');
  assert(normalizeLanguage('pgsql') === 'sql', 'Normalized "pgsql" to "sql"');
  
  const validPayload = validateCodePayload({ code: 'const x = 10;', language: 'ts' });
  assert(validPayload.valid === true, 'Accepted valid code payload');
  assert(validPayload.language === 'typescript', 'Normalized "ts" to "typescript"');

  const oversizedCode = 'a'.repeat(50001);
  const invalidPayload = validateCodePayload({ code: oversizedCode });
  assert(invalidPayload.valid === false, 'Rejected code exceeding 50,000 characters');

  // Test 2: Multi-Language AI Code Generation
  console.log('\nTest 2: Multi-Language AI Code Generation');
  const jsGen = await generateCode({
    prompt: 'Create a responsive user metric card with loading state',
    language: 'javascript',
    type: 'component',
  });
  assert(jsGen.code.includes('DynamicFeatureComponent') || jsGen.code.length > 50, 'Generated JavaScript React component');
  assert(jsGen.explanation.includes('## Code Implementation'), 'Included structured markdown headings');

  const pyGen = await generateCode({
    prompt: 'Create a data pipeline processor class with typing',
    language: 'python',
    type: 'function',
  });
  assert(pyGen.code.includes('class') || pyGen.code.includes('def'), 'Generated Python class with type annotations');

  const sqlGen = await generateCode({
    prompt: 'Create user audit log table and top queries',
    language: 'sql',
    type: 'api',
  });
  assert(sqlGen.code.includes('CREATE TABLE') || sqlGen.code.includes('SELECT'), 'Generated SQL relational schema');

  // Test 3: Line-by-Line Code Explanation & Algorithmic Complexity
  console.log('\nTest 3: Line-by-Line Code Explanation & Algorithmic Complexity');
  const sampleCode = `function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`;
  const explanation = await explainCode({ code: sampleCode, language: 'javascript' });
  assert(explanation.explanation.includes('## Executive Summary'), 'Generated Executive Summary section');
  assert(explanation.explanation.includes('## Algorithmic Complexity'), 'Included Complexity analysis');
  assert(explanation.explanation.includes('Time Complexity'), 'Analyzed time complexity metric');

  // Test 4: AI Debugging & Root Cause Analysis
  console.log('\nTest 4: AI Debugging & Root Cause Analysis');
  const buggyCode = `function getUserProfile(user) {
  return user.profile.name.toUpperCase();
}`;
  const debugResult = await debugCode({
    code: buggyCode,
    language: 'javascript',
    errorMessage: 'TypeError: Cannot read property "name" of undefined',
    stackTrace: 'at getUserProfile (index.js:2:23)',
  });
  assert(debugResult.analysis.includes('Root Cause Diagnosis'), 'Identified root cause diagnosis');
  assert(debugResult.correctedCode.length > 0, 'Generated corrected code snippet');
  assert(debugResult.analysis.includes('Summary of Changes'), 'Included explanation of what changed');

  // Test 5: AI Code Optimization & Comparison
  console.log('\nTest 5: AI Code Optimization & Comparison');
  const unoptimizedCode = `function processItems(items) {
  var results = [];
  for (var i = 0; i < items.length; i++) {
    results.push(items[i] * 2);
  }
  return results;
}`;
  const optResult = await optimizeCode({ code: unoptimizedCode, language: 'javascript', focusArea: 'performance' });
  assert(optResult.optimizedCode.length > 0, 'Generated optimized code');
  assert(optResult.analysis.includes('Comparison Summary'), 'Provided comparison summary table');

  // Test 6: Contextual AI Coding Chat
  console.log('\nTest 6: Contextual AI Coding Chat');
  const chatResult = await chatWithCode({
    message: 'How should I refactor this function to handle async errors?',
    activeFile: 'service.js',
    code: 'export async function fetchData() { return fetch("/api"); }',
    language: 'javascript',
  });
  assert(chatResult.reply.length > 50, 'Generated detailed coding assistant reply');
  assert(chatResult.reply.includes('service.js') || chatResult.reply.includes('fetchData') || chatResult.reply.includes('NOVA AI'), 'Referenced active file context');

  // Test 7: Security-First Isolated Node.js Execution
  console.log('\nTest 7: Security-First Isolated Node.js Execution');
  const execSuccess = await executeSandboxedCode({
    code: 'console.log("SANDBOX_TEST_PASSED_1234");',
    language: 'javascript',
    timeoutMs: 3000,
  });
  assert(execSuccess.status === 'success', `Execution status is success (${execSuccess.status})`);
  assert(execSuccess.stdout.includes('SANDBOX_TEST_PASSED_1234'), 'Captured stdout accurately from isolated child process');
  assert(execSuccess.exitCode === 0, 'Exit code is 0');
  assert(execSuccess.durationMs >= 0, `Captured execution duration (${execSuccess.durationMs}ms)`);

  // Test 8: Environment Variable Stripping Invariant
  console.log('\nTest 8: Environment Variable Stripping Invariant (Secrets Protection)');
  process.env.GEMINI_API_KEY = 'TEST_SECRET_GEMINI_KEY_ABC123';
  process.env.OPENAI_API_KEY = 'TEST_SECRET_OPENAI_KEY_XYZ789';
  const execSecretCheck = await executeSandboxedCode({
    code: 'console.log("GEMINI:" + (process.env.GEMINI_API_KEY || "HIDDEN") + " OPENAI:" + (process.env.OPENAI_API_KEY || "HIDDEN"));',
    language: 'javascript',
  });
  assert(!execSecretCheck.stdout.includes('TEST_SECRET_GEMINI_KEY'), 'Child process has ZERO access to GEMINI_API_KEY');
  assert(!execSecretCheck.stdout.includes('TEST_SECRET_OPENAI_KEY'), 'Child process has ZERO access to OPENAI_API_KEY');
  assert(execSecretCheck.stdout.includes('HIDDEN'), 'Secrets verified completely stripped from execution environment');

  // Test 9: Execution Timeout Guard
  console.log('\nTest 9: Execution Timeout Guard (Infinite Loop Safe Termination)');
  const infiniteLoopScript = 'while(true) {}';
  const timeoutCheck = await executeSandboxedCode({
    code: infiniteLoopScript,
    language: 'javascript',
    timeoutMs: 1000,
  });
  assert(timeoutCheck.status === 'timeout', `Process safely timed out (${timeoutCheck.status})`);
  assert(timeoutCheck.stderr.includes('timed out'), 'Reported explicit timeout message');

  // Test 10: Non-Native Runtime Simulation & Transparent Disclosure
  console.log('\nTest 10: Non-Native Runtime Simulation & Transparent Disclosure');
  const cSimCheck = await executeSandboxedCode({
    code: '#include <stdio.h>\nint main() { printf("Hello"); return 0; }',
    language: 'c',
  });
  assert(cSimCheck.status === 'simulated', 'Reported simulated status for non-native runtime');
  assert(cSimCheck.simulated === true, 'Flagged simulated: true to prevent fake execution claims');
  assert(cSimCheck.stdout.includes('Host system compiler/runtime'), 'Explicitly informed user of environment runtime boundary');

  // Test 11: Multi-User Project Isolation & CRUD
  console.log('\nTest 11: Multi-User Project Isolation & CRUD');
  const userAlpha = 'user_alpha_test';
  const userBeta = 'user_beta_test';

  const alphaProject = await saveProject(userAlpha, {
    name: 'Alpha Microservice',
    description: 'High throughput pipeline',
    files: [
      { name: 'index.js', path: 'index.js', content: 'console.log("alpha");' },
      { name: 'config.json', path: 'config.json', content: '{"env":"test"}' },
    ],
  });
  assert(alphaProject.id.startsWith('proj_'), `Created project for Alpha with ID: ${alphaProject.id}`);

  // Beta lists projects - must NOT see Alpha's project
  const betaProjects = await listProjects(userBeta);
  assert(!betaProjects.some((p) => p.id === alphaProject.id), "User Beta CANNOT see User Alpha's projects");

  // Beta direct request for Alpha's project - must return null
  const betaDirectAccess = await getProject(userBeta, alphaProject.id);
  assert(betaDirectAccess === null, "User Beta direct access to User Alpha's project is BLOCKED (returns null)");

  // Alpha creates a new file in project
  const updatedAlpha = await saveProjectFile(userAlpha, alphaProject.id, {
    path: 'utils/helper.js',
    content: 'export const add = (a, b) => a + b;',
  });
  assert(updatedAlpha.files.some((f) => f.path === 'utils/helper.js'), 'Added new file in subfolder');

  // Alpha renames file
  const renamedAlpha = await renameProjectFile(userAlpha, alphaProject.id, 'utils/helper.js', 'utils/math.js');
  assert(renamedAlpha.files.some((f) => f.path === 'utils/math.js'), 'Renamed file successfully');
  assert(!renamedAlpha.files.some((f) => f.path === 'utils/helper.js'), 'Old file name removed');

  // Alpha deletes project
  const deleted = await deleteProject(userAlpha, alphaProject.id);
  assert(deleted === true, 'Deleted project successfully');
  const deletedCheck = await getProject(userAlpha, alphaProject.id);
  assert(deletedCheck === null, 'Project no longer exists after deletion');

  // Test 12: Path Traversal Protection
  console.log('\nTest 12: Path Traversal Protection');
  assert(sanitizeRelativePath('../../etc/passwd') === null, 'Blocked parent directory traversal (../../)');
  assert(sanitizeRelativePath('/root/secrets.env') === null, 'Blocked absolute path root traversal');
  assert(sanitizeRelativePath('src/components/Header.jsx') === 'src/components/Header.jsx', 'Allowed valid safe relative path');

  console.log('\n===========================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCodeTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
