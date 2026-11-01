import {
  CREATIVE_STYLES,
  ASPECT_RATIOS,
  CREATIVE_TEMPLATES,
  validateImagePayload,
  enhanceCreativePrompt,
  generateCreativeImage,
  editCreativeImage,
} from './creativeService.js';
import {
  listCreativeImages,
  getCreativeImage,
  saveCreativeImage,
  deleteCreativeImage,
  sanitizeId,
} from './creativeStore.js';

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

async function runCreativeTestSuite() {
  console.log('===========================================================');
  console.log('NOVA AI: CREATIVE STUDIO - 16-POINT BACKEND VERIFICATION SUITE');
  console.log('===========================================================\n');

  // Test 1: Creative Styles & Aspect Ratio Specifications
  console.log('Test 1: Creative Styles & Aspect Ratio Specifications');
  assert(CREATIVE_STYLES.length === 10, `Verified 10 official creative styles (Found ${CREATIVE_STYLES.length})`);
  assert(CREATIVE_STYLES.includes('Photorealistic') && CREATIVE_STYLES.includes('Cinematic'), 'Contains Photorealistic and Cinematic styles');
  assert(CREATIVE_STYLES.includes('3D Render') && CREATIVE_STYLES.includes('Anime'), 'Contains 3D Render and Anime styles');
  assert(Boolean(ASPECT_RATIOS['1:1'] && ASPECT_RATIOS['16:9'] && ASPECT_RATIOS['9:16'] && ASPECT_RATIOS['4:3']), 'Verified all 4 aspect ratios (1:1, 16:9, 9:16, 4:3)');

  // Test 2: Input & Image Payload Validation
  console.log('\nTest 2: Input & Image Payload Validation');
  const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const valSuccess = validateImagePayload({ image: validPng, editInstruction: 'Add lighting' });
  assert(valSuccess.valid === true, 'Accepted valid base64 PNG image');

  const invalidFormat = validateImagePayload({ image: 'data:application/octet-stream;base64,AAAA', editInstruction: 'Change' });
  assert(invalidFormat.valid === false, 'Rejected unsupported binary format');

  const oversizedImage = 'data:image/png;base64,' + 'A'.repeat(21 * 1024 * 1024);
  const valOversized = validateImagePayload({ image: oversizedImage });
  assert(valOversized.valid === false, 'Rejected image payload exceeding 15MB limit');

  // Test 3: AI Prompt Enhancement Assistant
  console.log('\nTest 3: AI Prompt Enhancement Assistant');
  const enhanced = await enhanceCreativePrompt('cyberpunk city floating in clouds', {
    style: 'Cinematic',
    aspectRatio: '16:9',
  });
  assert(enhanced.enhancedPrompt && enhanced.enhancedPrompt.length > 50, 'Generated detailed enhanced visual prompt');
  assert(enhanced.negativePrompt && enhanced.negativePrompt.includes('blurry'), 'Generated structured negative prompt');
  assert(enhanced.style === 'Cinematic', 'Preserved target style in prompt enhancement');

  // Test 4: Real AI Text-to-Image Generation (Square 1:1)
  console.log('\nTest 4: Real AI Text-to-Image Generation (Square 1:1)');
  const imgSquare = await generateCreativeImage({
    prompt: 'quantum neural processor core surrounded by ethereal light rays',
    style: '3D Render',
    aspectRatio: '1:1',
  });
  assert(Boolean(imgSquare.imageUrl && imgSquare.imageUrl.length > 100), 'Generated real visual image asset');
  assert(imgSquare.dimensions === '1024x1024', `Dimensions matched 1:1 ratio (${imgSquare.dimensions})`);
  assert(Boolean(imgSquare.engine), `Identified creative engine (${imgSquare.engine})`);

  // Test 5: Real AI Text-to-Image Generation (Landscape 16:9)
  console.log('\nTest 5: Real AI Text-to-Image Generation (Landscape 16:9)');
  const imgLandscape = await generateCreativeImage({
    prompt: 'interstellar exploratory spaceship traveling near radiant nebula',
    style: 'Cinematic',
    aspectRatio: '16:9',
  });
  assert(Boolean(imgLandscape.imageUrl), 'Generated 16:9 landscape asset');
  assert(imgLandscape.dimensions === '1792x1024' || imgLandscape.dimensions === '1280x720', `Dimensions matched 16:9 landscape (${imgLandscape.dimensions})`);

  // Test 6: Portrait Aspect Ratio (9:16)
  console.log('\nTest 6: Portrait Aspect Ratio (9:16)');
  const imgPortrait = await generateCreativeImage({
    prompt: 'fashion model in neon glass armor',
    style: 'Photorealistic',
    aspectRatio: '9:16',
  });
  assert(Boolean(imgPortrait.imageUrl), 'Generated 9:16 portrait visual asset');
  assert(imgPortrait.dimensions === '1024x1792' || imgPortrait.dimensions === '1080x1920', `Dimensions matched 9:16 portrait (${imgPortrait.dimensions})`);

  // Test 7: Standard Aspect Ratio (4:3)
  console.log('\nTest 7: Standard Aspect Ratio (4:3)');
  const imgStandard = await generateCreativeImage({
    prompt: 'modern architectural glass pavilion in redwood forest',
    style: 'Minimalist',
    aspectRatio: '4:3',
  });
  assert(Boolean(imgStandard.imageUrl), 'Generated 4:3 standard visual asset');
  assert(imgStandard.dimensions === '1024x768', `Dimensions matched 4:3 ratio (${imgStandard.dimensions})`);

  // Test 8: Creative Design Generator Templates
  console.log('\nTest 8: Creative Design Generator Templates');
  assert(CREATIVE_TEMPLATES.length >= 5, `Configured ${CREATIVE_TEMPLATES.length} creative canvas templates`);
  const ytTemplate = CREATIVE_TEMPLATES.find((t) => t.id === 'youtube-thumbnail');
  assert(Boolean(ytTemplate && ytTemplate.aspectRatio === '16:9'), 'Verified YouTube Video Thumbnail template (16:9)');
  const instaTemplate = CREATIVE_TEMPLATES.find((t) => t.id === 'instagram-story');
  assert(Boolean(instaTemplate && instaTemplate.aspectRatio === '9:16'), 'Verified Instagram Story / Reel template (9:16)');

  // Test 9: AI Image Editing with Before-and-After
  console.log('\nTest 9: AI Image Editing with Before-and-After');
  const editResult = await editCreativeImage({
    sourceImage: validPng,
    editInstruction: 'Change background to starry night sky with golden volumetric lighting',
    targetStyle: 'Cinematic',
  });
  assert(Boolean(editResult.originalImageUrl === validPng), 'Preserved original source image untouched');
  assert(Boolean(editResult.imageUrl && editResult.imageUrl !== validPng), 'Produced distinct edited visual asset');
  assert(editResult.isEdited === true, 'Flagged isEdited: true for before-and-after view');
  assert(editResult.editInstruction.includes('starry night'), 'Recorded edit instruction metadata');

  // Test 10: User Creative Gallery Storage & Persistence
  console.log('\nTest 10: User Creative Gallery Storage & Persistence');
  const userAlpha = 'user_creative_alpha';
  const savedAlpha = await saveCreativeImage(userAlpha, {
    title: 'Cyberpunk City Skyline',
    prompt: 'Futuristic Tokyo neon skyscrapers in rain',
    style: 'Cyberpunk Neo',
    aspectRatio: '16:9',
    dimensions: '1792x1024',
    imageUrl: validPng,
  });
  assert(savedAlpha.id.startsWith('img_'), `Saved creative image with ID: ${savedAlpha.id}`);
  assert(savedAlpha.userId === userAlpha, 'Tagged image with correct user ID');

  const alphaGallery = await listCreativeImages(userAlpha);
  assert(alphaGallery.some((img) => img.id === savedAlpha.id), 'Listed saved image in user gallery');

  const retrievedAlpha = await getCreativeImage(userAlpha, savedAlpha.id);
  assert(Boolean(retrievedAlpha && retrievedAlpha.title === 'Cyberpunk City Skyline'), 'Retrieved specific image record with full metadata');

  // Test 11: Multi-User Creative Isolation
  console.log('\nTest 11: Multi-User Creative Isolation');
  const userBeta = 'user_creative_beta';
  const betaGallery = await listCreativeImages(userBeta);
  assert(!betaGallery.some((img) => img.id === savedAlpha.id), "User Beta CANNOT see User Alpha's images in gallery");

  const betaDirectRead = await getCreativeImage(userBeta, savedAlpha.id);
  assert(betaDirectRead === null, "User Beta direct read of User Alpha's image is strictly BLOCKED (returns null)");

  // Test 12: Image Deletion with Confirmation
  console.log('\nTest 12: Image Deletion with Confirmation');
  const deletedAlpha = await deleteCreativeImage(userAlpha, savedAlpha.id);
  assert(deletedAlpha === true, 'Deleted image from gallery');
  const checkDeleted = await getCreativeImage(userAlpha, savedAlpha.id);
  assert(checkDeleted === null, 'Verified image record no longer exists after deletion');

  // Test 13: Path Traversal Protection
  console.log('\nTest 13: Path Traversal Protection');
  assert(sanitizeId('../../etc/passwd') !== '../../etc/passwd', 'Sanitized directory traversal string');
  assert(sanitizeId('normal_id_123') === 'normal_id_123', 'Preserved safe alphanumeric identifier');

  // Test 14: Unsupported File Extension Rejection in Payload
  console.log('\nTest 14: Unsupported File Extension Rejection in Payload');
  const exeVal = validateImagePayload({ image: 'data:application/x-msdownload;base64,TVqQAA==' });
  assert(exeVal.valid === false, 'Rejected executable payload format');

  // Test 15: Missing API Credentials Fallback (Resilience)
  console.log('\nTest 15: Missing API Credentials Fallback (Resilience)');
  const savedOpenAi = process.env.OPENAI_API_KEY;
  const savedGemini = process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const fallbackGen = await generateCreativeImage({
    prompt: 'standalone offline test render',
    style: 'Digital Art',
  });
  assert(fallbackGen.imageUrl && fallbackGen.engine === 'nova-neural-creative', 'Gracefully synthesized procedural creative visual without throwing');

  // Restore env
  if (savedOpenAi) process.env.OPENAI_API_KEY = savedOpenAi;
  if (savedGemini) process.env.GEMINI_API_KEY = savedGemini;

  // Test 16: Platform Regression Verification
  console.log('\nTest 16: Platform Regression Verification');
  assert(typeof validateImagePayload === 'function', 'Creative validation helper operational');
  assert(typeof enhanceCreativePrompt === 'function', 'Prompt enhancer helper operational');

  console.log('\n===========================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCreativeTestSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
