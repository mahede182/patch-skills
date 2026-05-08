import fs from 'fs-extra';
import { createPatch } from 'diff';
import path from 'path';
import {
  skillExists,
  getSkillFilePath,
  getPatchesDir,
  getPatchFilePath,
  findLatestPatch,
} from '../utils/paths.js';
import { logger } from '../utils/logger.js';
import { parsePatchFilename } from '../utils/patch.js';

const ORIG_DIR = '.orig';
const INITIAL_VERSION = '1.0.0';

/**
 * Get path to original file stored in patches/.orig/
 */
function getOrigFilePath(skillName) {
  return path.join(getPatchesDir(), ORIG_DIR, `${skillName}.md.orig`);
}

/**
 * Ensure .orig directory exists
 */
async function ensureOrigDir() {
  const origDir = path.join(getPatchesDir(), ORIG_DIR);
  await fs.ensureDir(origDir);
  return origDir;
}

/**
 * Read file content if exists, null otherwise
 */
function readFileSafe(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

/**
 * Delete all patches for a skill
 */
function deleteOldPatches(skillName, patchesDir) {
  if (!fs.existsSync(patchesDir)) return;

  fs.readdirSync(patchesDir).forEach(file => {
    const parsed = parsePatchFilename(file);
    if (parsed?.skillName === skillName) {
      fs.unlinkSync(path.join(patchesDir, file));
    }
  });
}

/**
 * Count changes in patch
 */
function countChanges(patchContent) {
  const lines = patchContent.split('\n');
  const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  return `+${added}/-${removed}`;
}

/**
 * Increment patch version
 */
function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

/**
 * Create a patch for a modified skill
 * Simple workflow:
 * 1. First create: Store original & current state, notify user
 * 2. Second create: Compare current to last patched, create diff from original
 * 3. Update: Replace old patch, update patched state
 */
export async function createCommand(skillName, options = {}) {
  const { verbose = false, version } = options;

  if (!skillExists(skillName)) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  const skillFilePath = getSkillFilePath(skillName);
  const currentContent = fs.readFileSync(skillFilePath, 'utf8');
  const patchesDir = getPatchesDir();
  const origFilePath = getOrigFilePath(skillName);

  // Get stored original from patches/.orig/
  const originalContent = readFileSafe(origFilePath);

  // Require mark first
  if (!originalContent) {
    logger.error(`No original found for "${skillName}".`);
    logger.info(`Run this first to mark the original state:`);
    logger.info(`  npx patch-skills mark ${skillName}`);
    logger.info(`Then edit the skill and run create.`);
    throw new Error(`Skill not marked. Run: npx patch-skills mark ${skillName}`);
  }

  const latestPatch = findLatestPatch(skillName);

  // Determine version
  const newVersion = version || (latestPatch ? incrementVersion(latestPatch.version) : INITIAL_VERSION);
  const isFirstPatch = !latestPatch;

  // Check for changes (compare to original - cumulative patch)
  if (originalContent === currentContent) {
    logger.warning(`No changes detected in "${skillName}".`);
    return;
  }

  // Generate patch: original -> current (cumulative)
  const patchContent = createPatch(
    `${skillName}/SKILL.md`,
    originalContent,
    currentContent,
    'original',
    `v${newVersion}`
  );

  // Delete old patches, write new
  await fs.ensureDir(patchesDir);
  deleteOldPatches(skillName, patchesDir);

  const patchFilePath = getPatchFilePath(skillName, newVersion);
  fs.writeFileSync(patchFilePath, patchContent, 'utf8');

  // Log result
  const action = isFirstPatch ? 'created' : 'updated';
  logger.success(`Patch ${action}: ${path.relative(process.cwd(), patchFilePath)}`);
  logger.verbose(`Changes: ${countChanges(patchContent)}`, verbose);
}
