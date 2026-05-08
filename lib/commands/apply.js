import fs from 'fs-extra';
import { applyPatch } from 'diff';
import path from 'path';
import { getPatchesDir, getSkillFilePath, patchesDirExists } from '../utils/paths.js';
import { logger } from '../utils/logger.js';
import { parsePatchFilename } from '../utils/patch.js';

const ORIG_DIR = '.orig';

/**
 * Apply all patches from the patches directory
 */
export async function applyCommand(options = {}) {
  const { verbose = false, include, exclude } = options;

  if (!patchesDirExists()) {
    logger.warning('No patches directory found');
    return;
  }

  const patchesDir = getPatchesDir();
  let patchFiles = fs
    .readdirSync(patchesDir)
    .map(file => parsePatchFilename(file))
    .filter(parsed => parsed !== null)
    .sort((a, b) => {
      if (a.skillName !== b.skillName) {
        return a.skillName.localeCompare(b.skillName);
      }
      return compareVersions(a.version || '0.0.0', b.version || '0.0.0');
    });

  // Apply include filter
  if (include && include.length > 0) {
    patchFiles = patchFiles.filter(parsed => include.includes(parsed.skillName));
  }

  // Apply exclude filter
  if (exclude && exclude.length > 0) {
    patchFiles = patchFiles.filter(parsed => !exclude.includes(parsed.skillName));
  }

  // Group by skill name and take only the latest version for each
  const latestBySkill = new Map();
  for (const parsed of patchFiles) {
    const existing = latestBySkill.get(parsed.skillName);
    if (!existing || compareVersions(parsed.version || '0.0.0', existing.version || '0.0.0') > 0) {
      latestBySkill.set(parsed.skillName, parsed);
    }
  }
  patchFiles = Array.from(latestBySkill.values());

  if (patchFiles.length === 0) {
    logger.warning('No patches found to apply');
    return;
  }

  logger.section(`Applying ${patchFiles.length} patch(es)...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const patchFile of patchFiles) {
    try {
      await applyPatchFile(patchFile, patchesDir, verbose);
      successCount++;
    } catch (error) {
      logger.error(`Failed to apply ${patchFile.skillName}: ${error.message}`);
      failureCount++;
    }
  }

  logger.section('');
  if (failureCount === 0) {
    logger.success(`${successCount} patch(es) applied successfully`);
  } else {
    logger.error(`${successCount} applied, ${failureCount} failed`);
    process.exit(1);
  }
}

/**
 * Apply a single patch file
 */
async function applyPatchFile(parsed, patchesDir, verbose = false) {
  const patchFileName = `skills+${parsed.skillName}${parsed.version ? '+' + parsed.version : ''}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);
  const patchContent = fs.readFileSync(patchFilePath, 'utf8');

  const skillName = parsed.skillName;
  const skillFilePath = getSkillFilePath(skillName);

  logger.verbose(`Applying patch: ${patchFileName}`, verbose);
  logger.verbose(`  Target: ${skillFilePath}`, verbose);

  if (!fs.existsSync(skillFilePath)) {
    throw new Error(`Skill file not found at ${skillFilePath}`);
  }

  // Apply patch
  const fileContent = fs.readFileSync(skillFilePath, 'utf8');
  const result = applyPatch(fileContent, patchContent);

  if (result === false) {
    throw new Error(`Patch does not apply cleanly to ${skillName}`);
  }

  // Write result
  fs.writeFileSync(skillFilePath, result, 'utf8');

  // Ensure .orig exists in patches/.orig/ (for fresh installs)
  const origFilePath = path.join(getPatchesDir(), ORIG_DIR, `${skillName}.md.orig`);
  if (!fs.existsSync(origFilePath)) {
    await fs.ensureDir(path.join(getPatchesDir(), ORIG_DIR));
    fs.writeFileSync(origFilePath, result, 'utf8');
  }

  if (verbose) {
    logger.verbose(`  ✓ Applied successfully`, verbose);
  } else {
    logger.success(`${skillName}${parsed.version ? ' v' + parsed.version : ''}`);
  }
}

/**
 * Simple semver comparison
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    if (partA > partB) return 1;
    if (partA < partB) return -1;
  }
  return 0;
}
