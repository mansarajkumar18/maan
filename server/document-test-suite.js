import zlib from 'zlib';
import {
  parseDocumentBuffer,
  createDocumentChunks,
  generateInitialDocIntelligence,
  executeDocumentAnalysis,
  queryDocument,
} from './documentService.js';
import {
  saveDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from './documentStore.js';

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

function createMockDocx(text) {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`;
  const xmlBuf = Buffer.from(xmlContent, 'utf8');
  const compressed = zlib.deflateRawSync(xmlBuf);
  const fileName = 'word/document.xml';
  const fileNameBuf = Buffer.from(fileName, 'utf8');

  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(0, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(xmlBuf.length, 22);
  header.writeUInt16LE(fileNameBuf.length, 26);
  header.writeUInt16LE(0, 28);

  return Buffer.concat([header, fileNameBuf, compressed]);
}

function createMockPdf(text) {
  const content = `BT /F1 14 Tf (${text}) Tj ET`;
  const streamBuf = Buffer.from(content, 'latin1');
  const deflated = zlib.deflateSync(streamBuf);

  const header = Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${deflated.length} /Filter /FlateDecode >>\nstream\r\n`, 'latin1');
  const footer = Buffer.from(`\r\nendstream\nendobj\nxref\n0 5\ntrailer\n<< /Root 1 0 R >>\n%%EOF`, 'latin1');

  return Buffer.concat([header, deflated, footer]);
}

async function runDocumentTestSuite() {
  console.log('===========================================================');
  console.log('NOVA AI: DOCUMENT INTELLIGENCE - 12-POINT TEST SUITE');
  console.log('===========================================================\n');

  // Test 1: TXT Upload and Text Extraction
  console.log('Test 1: TXT Document Extraction');
  const txtContent = 'MSR Digital Media Nova AI provides frontier intelligence for enterprise workflows. Document processing achieves sub-second semantic retrieval across diverse formats.';
  const txtBuf = Buffer.from(txtContent, 'utf8');
  const txtParsed = parseDocumentBuffer(txtBuf, 'spec.txt', 'txt');
  assert(txtParsed.text.includes('frontier intelligence'), 'Extracted text matches TXT payload');
  assert(txtParsed.pages >= 1, `Calculated page count: ${txtParsed.pages}`);

  // Test 2: DOCX Upload and Text Extraction
  console.log('\nTest 2: DOCX Document Extraction');
  const docxText = 'Distributed multi-agent neural consensus specification for high-throughput stream pipelines.';
  const docxBuf = createMockDocx(docxText);
  const docxParsed = parseDocumentBuffer(docxBuf, 'architecture.docx', 'docx');
  assert(docxParsed.text.includes('Distributed multi-agent'), 'Extracted text matches DOCX content');
  assert(docxParsed.extension === 'docx', 'Identified DOCX format');

  // Test 3: PDF Upload and Text Extraction
  console.log('\nTest 3: PDF Document Extraction');
  const pdfText = 'Quantum Annealing and Adiabatic Co-processor Benchmarks 2026.';
  const pdfBuf = createMockPdf(pdfText);
  const pdfParsed = parseDocumentBuffer(pdfBuf, 'quantum.pdf', 'pdf');
  assert(pdfParsed.text.includes('Quantum Annealing'), 'Extracted text matches PDF stream');
  assert(pdfParsed.pages === 1, 'Estimated PDF page count accurately');

  // Test 4: Unsupported Formats Rejection
  console.log('\nTest 4: Unsupported File Extension Rejection');
  let rejected = false;
  try {
    parseDocumentBuffer(Buffer.from('binary data'), 'image.exe', 'exe');
  } catch (err) {
    rejected = err.message.includes('Unsupported document extension');
  }
  assert(rejected === true, 'Successfully rejected unsupported format (.exe)');

  // Test 5: Empty / Corrupted Files
  console.log('\nTest 5: Empty File Extraction');
  const emptyBuf = Buffer.from('');
  const emptyParsed = parseDocumentBuffer(emptyBuf, 'empty.txt', 'txt');
  assert(emptyParsed.text === '', 'Handled empty document safely without throwing');

  // Test 6: Semantic Chunking Engine
  console.log('\nTest 6: Semantic Chunking Engine');
  const longText = 'Sentence one outlines system state. Sentence two defines network boundaries. Sentence three configures security policies. Sentence four benchmarks throughput. Sentence five ensures data persistence.';
  const chunks = createDocumentChunks(longText, 2, 70);
  assert(chunks.length >= 2, `Segmented long text into ${chunks.length} chunks`);
  assert(chunks[0].page === 1, 'Assigned page index to chunk 1');
  assert(chunks[chunks.length - 1].page === 2, 'Assigned page index to last chunk');

  // Test 7: AI Document Analysis Modes (All 9 operations)
  console.log('\nTest 7: AI Document Analysis Modes');
  const sampleDoc = {
    name: 'enterprise-scaling.txt',
    pages: 3,
    extractedText: 'Project Nova 2026 demonstrates a 4.8x efficiency acceleration. Lead architect Sarah Connor presented findings on October 24. Actionable deliverables include deployment of distributed pipelines and fault-tolerant retries.',
  };

  const summaryRes = await executeDocumentAnalysis('summarize', sampleDoc);
  assert(summaryRes.result.includes('Executive Summary'), 'Executed Executive Summary mode');

  const keypointsRes = await executeDocumentAnalysis('keypoints', sampleDoc);
  assert(keypointsRes.result.includes('Key Points'), 'Executed Key Points mode');

  const topicsRes = await executeDocumentAnalysis('topics', sampleDoc);
  assert(topicsRes.result.includes('Core Topics'), 'Executed Topics & Keywords mode');

  const datesRes = await executeDocumentAnalysis('dates_names', sampleDoc);
  assert(datesRes.result.includes('Dates & Entities'), 'Executed Dates & Names mode');

  const qaRes = await executeDocumentAnalysis('qa', sampleDoc);
  assert(qaRes.result.includes('Q1:'), 'Executed Q&A Generation mode');

  const simplifyRes = await executeDocumentAnalysis('simplify', sampleDoc);
  assert(simplifyRes.result.includes('Plain-English'), 'Executed Paragraph Simplification mode');

  const translateRes = await executeDocumentAnalysis('translate', sampleDoc);
  assert(translateRes.result.includes('Translation'), 'Executed Translation mode');

  const notesRes = await executeDocumentAnalysis('notes', sampleDoc);
  assert(notesRes.result.includes('Structured Notes'), 'Executed Structured Notes mode');

  const actionRes = await executeDocumentAnalysis('actionitems', sampleDoc);
  assert(actionRes.result.includes('Action Items'), 'Executed Action Items mode');

  // Test 8: Document Q&A with Exact Page Citations
  console.log('\nTest 8: Document Q&A with Exact Page Citations');
  const docWithChunks = {
    name: 'ai-report.pdf',
    pages: 4,
    chunks: [
      { id: 1, page: 2, text: 'The compound architecture reduces inference cost by over 72% across 14 enterprise benchmarks.' },
      { id: 2, page: 4, text: 'Security policies mandate zero-trust mutual TLS between autonomous agents.' },
    ],
  };
  const qaAnswer = await queryDocument('What is the inference cost reduction?', docWithChunks);
  assert(qaAnswer.foundInDoc === true, 'Located matching information in document');
  assert(qaAnswer.answer.includes('72%'), 'Accurately extracted fact from document');
  assert(qaAnswer.citations.length > 0 && qaAnswer.citations[0].page === 2, 'Grounded with exact citation: Page 2');

  // Test 9: Uncovered / Out-of-Scope Questions
  console.log('\nTest 9: Out-of-Scope Questions Not in Document');
  const uncoveredAnswer = await queryDocument('What is the capital of Australia?', docWithChunks);
  assert(uncoveredAnswer.foundInDoc === false, 'Recognized question is not covered in document');
  assert(uncoveredAnswer.answer.includes('does not contain information'), 'Explicitly declined to hallucinate false facts');

  // Test 10: User Scoped Document Storage CRUD & Isolation
  console.log('\nTest 10: Multi-User Document Isolation & CRUD');
  const user1 = 'doc_user_1';
  const user2 = 'doc_user_2';

  const docUser1 = await saveDocument(user1, {
    name: 'user1_confidential.txt',
    extractedText: 'Confidential trade secrets.',
  });

  const listUser2 = await listDocuments(user2);
  assert(!listUser2.some((d) => d.id === docUser1.id), 'User 2 cannot see User 1 document in list');

  const crossFetch = await getDocument(user2, docUser1.id);
  assert(crossFetch === null, 'Cross-user direct document access blocked (returns null/403)');

  const deleted = await deleteDocument(user1, docUser1.id);
  assert(deleted === true, 'User 1 successfully deleted document');

  // Test 11: Initial Document Intelligence Generation
  console.log('\nTest 11: Document Metadata & Initial Synthesis');
  const initialIntel = generateInitialDocIntelligence(longText, 2, 'specs.txt');
  assert(initialIntel.metrics.length === 4, 'Generated 4 metric cards');
  assert(initialIntel.keyInsights.length >= 2, 'Generated initial key insights');

  console.log('\n===========================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================\n');
}

runDocumentTestSuite().catch(console.error);
