import fs from 'fs';
import path from 'path';

// Base directory for persistent coding project storage
let baseProjectsDir = path.resolve(process.cwd(), 'data', 'projects');

try {
  if (!fs.existsSync(baseProjectsDir)) {
    fs.mkdirSync(baseProjectsDir, { recursive: true });
  }
} catch {
  baseProjectsDir = path.resolve('/tmp', 'nova-data', 'projects');
  try {
    if (!fs.existsSync(baseProjectsDir)) {
      fs.mkdirSync(baseProjectsDir, { recursive: true });
    }
  } catch {
    // In-memory fallback will handle state
  }
}

// In-memory cache fallback for serverless / read-only runtime environments
const inMemoryProjectStore = new Map();

/**
 * Sanitizes an identifier to prevent path traversal attacks.
 */
export function sanitizeId(id, fallback = null) {
  if (!id || typeof id !== 'string') return fallback;
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  return cleaned || fallback;
}

/**
 * Validates and normalizes relative file paths inside a project.
 * Blocks absolute paths or parent directory traversal (e.g. "../").
 */
export function sanitizeRelativePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;
  const raw = filePath.trim();
  // Reject absolute paths (starting with / or \ or C:)
  if (raw.startsWith('/') || raw.startsWith('\\') || /^[a-zA-Z]:/.test(raw) || path.isAbsolute(raw)) {
    return null;
  }
  const normalized = raw.replace(/\\/g, '/');
  if (normalized.includes('..')) {
    return null;
  }
  return normalized;
}

/**
 * Resolves user project directory safely.
 */
function getUserProjectsDir(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = path.join(baseProjectsDir, cleanUser);
  try {
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  } catch {
    return null;
  }
}

/**
 * Resolves single project directory safely.
 */
function getProjectDir(userId, projectId) {
  const userDir = getUserProjectsDir(userId);
  const cleanProj = sanitizeId(projectId);
  if (!userDir || !cleanProj) return null;
  const projectDir = path.join(userDir, cleanProj);
  try {
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    return projectDir;
  } catch {
    return null;
  }
}

/**
 * Helper to determine language from file extension.
 */
export function detectLanguageFromFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.jsx':
      return 'javascript';
    case '.py':
      return 'python';
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.json':
      return 'json';
    case '.java':
      return 'java';
    case '.c':
      return 'c';
    case '.cpp':
    case '.cc':
    case '.h':
    case '.hpp':
      return 'cpp';
    case '.sql':
      return 'sql';
    case '.md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

/**
 * Lists all coding projects for a user.
 */
export async function listProjects(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = getUserProjectsDir(cleanUser);
  const projects = [];

  if (userDir && fs.existsSync(userDir)) {
    try {
      const dirs = fs.readdirSync(userDir, { withFileTypes: true });
      for (const dirent of dirs) {
        if (dirent.isDirectory()) {
          const manifestPath = path.join(userDir, dirent.name, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            try {
              const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              projects.push(data);
            } catch {
              // skip corrupted
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ProjectStore] Disk read error, falling back to memory:', err.message);
    }
  }

  // Merge in-memory projects
  for (const [key, proj] of inMemoryProjectStore.entries()) {
    if (proj.userId === cleanUser && !projects.some((p) => p.id === proj.id)) {
      projects.push(proj);
    }
  }

  return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Gets a specific project with all its files.
 */
export async function getProject(userId, projectId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanProj = sanitizeId(projectId);
  if (!cleanProj) return null;

  // 1. Try disk
  const projectDir = getProjectDir(cleanUser, cleanProj);
  if (projectDir && fs.existsSync(projectDir)) {
    const manifestPath = path.join(projectDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (manifest.userId === cleanUser) {
          // Read current files from disk
          const filesDir = path.join(projectDir, 'files');
          const loadedFiles = [];

          if (fs.existsSync(filesDir)) {
            function walkDir(currentDir, relativeBase = '') {
              const items = fs.readdirSync(currentDir, { withFileTypes: true });
              for (const item of items) {
                const itemRelPath = relativeBase ? `${relativeBase}/${item.name}` : item.name;
                const fullItemPath = path.join(currentDir, item.name);
                if (item.isDirectory()) {
                  walkDir(fullItemPath, itemRelPath);
                } else if (item.isFile()) {
                  const content = fs.readFileSync(fullItemPath, 'utf8');
                  loadedFiles.push({
                    name: item.name,
                    path: itemRelPath,
                    content,
                    language: detectLanguageFromFilename(item.name),
                    size: content.length,
                    updatedAt: fs.statSync(fullItemPath).mtime.toISOString(),
                  });
                }
              }
            }
            walkDir(filesDir);
          }

          return {
            ...manifest,
            files: loadedFiles.length > 0 ? loadedFiles : (manifest.files || []),
          };
        }
      } catch (err) {
        console.warn('[ProjectStore] Error loading project from disk:', err.message);
      }
    }
  }

  // 2. Try in-memory fallback
  const memKey = `${cleanUser}:${cleanProj}`;
  if (inMemoryProjectStore.has(memKey)) {
    return inMemoryProjectStore.get(memKey);
  }

  return null;
}

/**
 * Creates or saves a complete project.
 */
export async function saveProject(userId, projectData) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const id = sanitizeId(projectData.id) || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cleanProj = sanitizeId(id);

  const now = new Date().toISOString();
  const name = typeof projectData.name === 'string' && projectData.name.trim() ? projectData.name.trim().slice(0, 100) : 'Untitled Project';
  const description = typeof projectData.description === 'string' ? projectData.description.slice(0, 500) : '';

  // Process files
  const incomingFiles = Array.isArray(projectData.files) ? projectData.files : [];
  const processedFiles = [];

  for (const file of incomingFiles) {
    const rawPath = file.path || file.name || 'index.js';
    const cleanPath = sanitizeRelativePath(rawPath);
    if (!cleanPath) continue;

    const content = typeof file.content === 'string' ? file.content : '';
    const filename = path.basename(cleanPath);
    processedFiles.push({
      name: filename,
      path: cleanPath,
      content,
      language: file.language || detectLanguageFromFilename(filename),
      size: content.length,
      updatedAt: now,
    });
  }

  // If project has no files, provide default template
  if (processedFiles.length === 0) {
    processedFiles.push({
      name: 'index.js',
      path: 'index.js',
      content: `// NOVA AI Code Studio — ${name}\nconsole.log("Ready to build with NOVA AI.");\n`,
      language: 'javascript',
      size: 75,
      updatedAt: now,
    });
  }

  const projectRecord = {
    id: cleanProj,
    userId: cleanUser,
    name,
    description,
    activeFile: projectData.activeFile || processedFiles[0]?.path || 'index.js',
    openTabs: Array.isArray(projectData.openTabs) && projectData.openTabs.length > 0 ? projectData.openTabs : [processedFiles[0]?.path || 'index.js'],
    filesCount: processedFiles.length,
    createdAt: projectData.createdAt || now,
    updatedAt: now,
  };

  // 1. Save to disk
  const projectDir = getProjectDir(cleanUser, cleanProj);
  if (projectDir) {
    try {
      const manifestPath = path.join(projectDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(projectRecord, null, 2), 'utf8');

      const filesDir = path.join(projectDir, 'files');
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }

      for (const f of processedFiles) {
        const fullFilePath = path.join(filesDir, f.path);
        const fileSubDir = path.dirname(fullFilePath);
        if (!fs.existsSync(fileSubDir)) {
          fs.mkdirSync(fileSubDir, { recursive: true });
        }
        fs.writeFileSync(fullFilePath, f.content, 'utf8');
      }
    } catch (err) {
      console.warn('[ProjectStore] Disk write error, saving to memory fallback:', err.message);
    }
  }

  // 2. Save to in-memory store
  const fullRecord = { ...projectRecord, files: processedFiles };
  inMemoryProjectStore.set(`${cleanUser}:${cleanProj}`, fullRecord);

  return fullRecord;
}

/**
 * Creates or updates a single file inside a project.
 */
export async function saveProjectFile(userId, projectId, fileData) {
  const project = await getProject(userId, projectId);
  if (!project) return null;

  const rawPath = fileData.path || fileData.name;
  const cleanPath = sanitizeRelativePath(rawPath);
  if (!cleanPath) {
    throw new Error('Invalid file path or path traversal detected.');
  }

  const content = typeof fileData.content === 'string' ? fileData.content : '';
  const filename = path.basename(cleanPath);
  const language = fileData.language || detectLanguageFromFilename(filename);

  const existingFileIndex = (project.files || []).findIndex((f) => f.path === cleanPath);
  const now = new Date().toISOString();

  const fileObject = {
    name: filename,
    path: cleanPath,
    content,
    language,
    size: content.length,
    updatedAt: now,
  };

  const updatedFiles = [...(project.files || [])];
  if (existingFileIndex >= 0) {
    updatedFiles[existingFileIndex] = fileObject;
  } else {
    updatedFiles.push(fileObject);
  }

  // Update openTabs if new file
  const openTabs = project.openTabs || [];
  if (!openTabs.includes(cleanPath)) {
    openTabs.push(cleanPath);
  }

  return await saveProject(userId, {
    ...project,
    activeFile: cleanPath,
    openTabs,
    files: updatedFiles,
  });
}

/**
 * Renames a file inside a project.
 */
export async function renameProjectFile(userId, projectId, oldPath, newPath) {
  const cleanOld = sanitizeRelativePath(oldPath);
  const cleanNew = sanitizeRelativePath(newPath);
  if (!cleanOld || !cleanNew) {
    throw new Error('Invalid file paths for renaming.');
  }

  const project = await getProject(userId, projectId);
  if (!project) return null;

  const targetFile = (project.files || []).find((f) => f.path === cleanOld);
  if (!targetFile) {
    throw new Error(`File '${cleanOld}' not found in project.`);
  }

  // Delete old file from disk if present
  const projectDir = getProjectDir(userId, projectId);
  if (projectDir) {
    const oldDiskPath = path.join(projectDir, 'files', cleanOld);
    if (fs.existsSync(oldDiskPath)) {
      try {
        fs.unlinkSync(oldDiskPath);
      } catch {
        // ignore
      }
    }
  }

  const updatedFiles = project.files
    .filter((f) => f.path !== cleanOld)
    .concat({
      ...targetFile,
      name: path.basename(cleanNew),
      path: cleanNew,
      language: detectLanguageFromFilename(path.basename(cleanNew)),
      updatedAt: new Date().toISOString(),
    });

  const openTabs = (project.openTabs || []).map((t) => (t === cleanOld ? cleanNew : t));
  const activeFile = project.activeFile === cleanOld ? cleanNew : project.activeFile;

  return await saveProject(userId, {
    ...project,
    activeFile,
    openTabs,
    files: updatedFiles,
  });
}

/**
 * Deletes a file from a project.
 */
export async function deleteProjectFile(userId, projectId, filePath) {
  const cleanPath = sanitizeRelativePath(filePath);
  if (!cleanPath) {
    throw new Error('Invalid file path.');
  }

  const project = await getProject(userId, projectId);
  if (!project) return null;

  // Prevent deleting the last remaining file
  if ((project.files || []).length <= 1) {
    throw new Error('Cannot delete the only file in the project.');
  }

  // Delete from disk
  const projectDir = getProjectDir(userId, projectId);
  if (projectDir) {
    const fullDiskPath = path.join(projectDir, 'files', cleanPath);
    if (fs.existsSync(fullDiskPath)) {
      try {
        fs.unlinkSync(fullDiskPath);
      } catch {
        // ignore
      }
    }
  }

  const updatedFiles = (project.files || []).filter((f) => f.path !== cleanPath);
  const openTabs = (project.openTabs || []).filter((t) => t !== cleanPath);
  const activeFile = project.activeFile === cleanPath ? updatedFiles[0]?.path || 'index.js' : project.activeFile;

  return await saveProject(userId, {
    ...project,
    activeFile,
    openTabs: openTabs.length > 0 ? openTabs : [updatedFiles[0]?.path || 'index.js'],
    files: updatedFiles,
  });
}

/**
 * Deletes an entire project.
 */
export async function deleteProject(userId, projectId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanProj = sanitizeId(projectId);
  if (!cleanProj) return false;

  const projectDir = getProjectDir(cleanUser, cleanProj);
  if (projectDir && fs.existsSync(projectDir)) {
    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch (err) {
      console.warn('[ProjectStore] Error deleting project dir:', err.message);
    }
  }

  const memKey = `${cleanUser}:${cleanProj}`;
  inMemoryProjectStore.delete(memKey);
  return true;
}
