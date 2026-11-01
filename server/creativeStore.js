import fs from 'fs';
import path from 'path';

// Base directory for persistent creative image gallery storage
let baseCreativesDir = path.resolve(process.cwd(), 'data', 'creatives');

try {
  if (!fs.existsSync(baseCreativesDir)) {
    fs.mkdirSync(baseCreativesDir, { recursive: true });
  }
} catch {
  baseCreativesDir = path.resolve('/tmp', 'nova-data', 'creatives');
  try {
    if (!fs.existsSync(baseCreativesDir)) {
      fs.mkdirSync(baseCreativesDir, { recursive: true });
    }
  } catch {
    // In-memory fallback will handle state
  }
}

// In-memory cache fallback for serverless / read-only runtime environments
const inMemoryCreativeStore = new Map();

/**
 * Sanitizes an identifier to prevent path traversal attacks.
 */
export function sanitizeId(id, fallback = null) {
  if (!id || typeof id !== 'string') return fallback;
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  return cleaned || fallback;
}

/**
 * Resolves user creative directory safely.
 */
function getUserCreativesDir(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = path.join(baseCreativesDir, cleanUser);
  try {
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    const imagesDir = path.join(userDir, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    return userDir;
  } catch {
    return null;
  }
}

/**
 * Lists all creative images belonging to a user.
 */
export async function listCreativeImages(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = getUserCreativesDir(cleanUser);
  const images = [];

  if (userDir && fs.existsSync(userDir)) {
    const manifestPath = path.join(userDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (Array.isArray(manifest)) {
          images.push(...manifest);
        }
      } catch (err) {
        console.warn('[CreativeStore] Error reading manifest:', err.message);
      }
    }
  }

  // Merge in-memory images
  for (const [key, item] of inMemoryCreativeStore.entries()) {
    if (item.userId === cleanUser && !images.some((img) => img.id === item.id)) {
      images.push({
        id: item.id,
        title: item.title,
        prompt: item.prompt,
        style: item.style,
        aspectRatio: item.aspectRatio,
        dimensions: item.dimensions,
        engine: item.engine,
        imageUrl: item.imageUrl,
        isEdited: Boolean(item.isEdited),
        createdAt: item.createdAt,
      });
    }
  }

  return images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Gets a specific creative image by ID with full data.
 */
export async function getCreativeImage(userId, imageId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanImgId = sanitizeId(imageId);
  if (!cleanImgId) return null;

  // 1. Try disk
  const userDir = getUserCreativesDir(cleanUser);
  if (userDir && fs.existsSync(userDir)) {
    const itemPath = path.join(userDir, 'images', `${cleanImgId}.json`);
    if (fs.existsSync(itemPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
        if (data.userId === cleanUser) {
          return data;
        }
      } catch (err) {
        console.warn('[CreativeStore] Error reading image from disk:', err.message);
      }
    }
  }

  // 2. Try in-memory
  const memKey = `${cleanUser}:${cleanImgId}`;
  if (inMemoryCreativeStore.has(memKey)) {
    return inMemoryCreativeStore.get(memKey);
  }

  return null;
}

/**
 * Saves a creative image and updates user manifest.
 */
export async function saveCreativeImage(userId, imageData) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const id = sanitizeId(imageData.id) || `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cleanImgId = sanitizeId(id);

  const now = new Date().toISOString();
  const record = {
    id: cleanImgId,
    userId: cleanUser,
    title: typeof imageData.title === 'string' && imageData.title.trim() ? imageData.title.trim().slice(0, 100) : 'Generative Artwork',
    prompt: typeof imageData.prompt === 'string' ? imageData.prompt : '',
    enhancedPrompt: typeof imageData.enhancedPrompt === 'string' ? imageData.enhancedPrompt : null,
    negativePrompt: typeof imageData.negativePrompt === 'string' ? imageData.negativePrompt : null,
    style: imageData.style || 'Photorealistic',
    aspectRatio: imageData.aspectRatio || '1:1',
    dimensions: imageData.dimensions || '1024x1024',
    engine: imageData.engine || 'nova-neural-creative',
    imageUrl: imageData.imageUrl || '',
    originalImageUrl: imageData.originalImageUrl || null,
    isEdited: Boolean(imageData.isEdited),
    editInstruction: imageData.editInstruction || null,
    tags: Array.isArray(imageData.tags) ? imageData.tags : [imageData.style || 'Art', imageData.aspectRatio || '1:1'],
    createdAt: imageData.createdAt || now,
    updatedAt: now,
  };

  // 1. Write item to disk
  const userDir = getUserCreativesDir(cleanUser);
  if (userDir) {
    try {
      const itemPath = path.join(userDir, 'images', `${cleanImgId}.json`);
      fs.writeFileSync(itemPath, JSON.stringify(record, null, 2), 'utf8');

      // Update manifest
      const manifestPath = path.join(userDir, 'manifest.json');
      let manifest = [];
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch {
          manifest = [];
        }
      }
      const existingIdx = manifest.findIndex((m) => m.id === cleanImgId);
      const summary = {
        id: record.id,
        title: record.title,
        prompt: record.prompt,
        style: record.style,
        aspectRatio: record.aspectRatio,
        dimensions: record.dimensions,
        engine: record.engine,
        imageUrl: record.imageUrl,
        isEdited: record.isEdited,
        createdAt: record.createdAt,
      };
      if (existingIdx >= 0) {
        manifest[existingIdx] = summary;
      } else {
        manifest.unshift(summary);
      }
      fs.writeFileSync(manifestPath, JSON.stringify(manifest.slice(0, 100), null, 2), 'utf8');
    } catch (err) {
      console.warn('[CreativeStore] Disk write error, saving to memory fallback:', err.message);
    }
  }

  // 2. Save in-memory
  const memKey = `${cleanUser}:${cleanImgId}`;
  inMemoryCreativeStore.set(memKey, record);

  return record;
}

/**
 * Deletes a creative image and updates manifest.
 */
export async function deleteCreativeImage(userId, imageId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanImgId = sanitizeId(imageId);
  if (!cleanImgId) return false;

  // 1. Delete from disk
  const userDir = getUserCreativesDir(cleanUser);
  if (userDir) {
    const itemPath = path.join(userDir, 'images', `${cleanImgId}.json`);
    if (fs.existsSync(itemPath)) {
      try {
        fs.unlinkSync(itemPath);
      } catch {
        // ignore
      }
    }
    const manifestPath = path.join(userDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const updated = manifest.filter((m) => m.id !== cleanImgId);
        fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2), 'utf8');
      } catch {
        // ignore
      }
    }
  }

  // 2. Delete from memory
  const memKey = `${cleanUser}:${cleanImgId}`;
  inMemoryCreativeStore.delete(memKey);

  return true;
}
