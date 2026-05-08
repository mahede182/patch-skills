import fs from 'fs-extra';
import path from 'path';
import { applyPatch } from 'diff';
import { logger } from '../utils/logger.js';
import { getPatchesDir, getSkillFilePath, skillExists, patchesDirExists } from '../utils/paths.js';
import { parsePatchFilename } from '../utils/patch.js';

/**
 * Verify that all patches apply cleanly without applying them
 */
export async function verifyCommand(options = {}) {
  const { verbose = false, include, exclude } = options;

  if (!patchesDirExists()) {
    logger.warning('No patches directory found');
    return { valid: true, patches: [] };
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

  // Apply include/exclude filters
  if (include && include.length > 0) {
    patchFiles = patchFiles.filter(parsed => include.includes(parsed.skillName));
  }

  if (exclude && exclude.length > 0) {
    patchFiles = patchFiles.filter(parsed => !exclude.includes(parsed.skillName));
  }

  // Group by skill and take only latest version
  const latestBySkill = new Map();
  for (const parsed of patchFiles) {
    const existing = latestBySkill.get(parsed.skillName);
    if (!existing || compareVersions(parsed.version || '0.0.0', existing.version || '0.0.0') > 0) {
      latestBySkill.set(parsed.skillName, parsed);
    }
  }
  patchFiles = Array.from(latestBySkill.values());

  if (patchFiles.length === 0) {
    logger.info('No patches to verify');
    return { valid: true, patches: [] };
  }

  logger.section(`Verifying ${patchFiles.length} patch(es)...`);

  const results = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const parsed of patchFiles) {
    const result = await verifyPatchFile(parsed, patchesDir, verbose);
    results.push({ skillName: parsed.skillName, patchFile: parsed, ...result });

    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  // Summary
  logger.section('');
  if (invalidCount === 0) {
    logger.success(`All ${validCount} patch(es) can be applied cleanly`);
  } else {
    logger.error(`${invalidCount} patch(es) cannot be applied, ${validCount} valid`);
  }

  return { valid: invalidCount === 0, patches: results };
}

/**
 * Verify a single patch file applies cleanly
 */
async function verifyPatchFile(parsed, patchesDir, verbose) {
  const patchFileName = `skills+${parsed.skillName}${parsed.version ? '+' + parsed.version : ''}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);
  const patchContent = fs.readFileSync(patchFilePath, 'utf8');
  const skillName = parsed.skillName;

  logger.verbose(`Verifying: ${patchFileName}`, verbose);

  // Check if skill exists
  if (!skillExists(skillName)) {
    const message = `Skill "${skillName}" not found`;
    logger.error(`${patchFileName}: ${message}`);
    return { valid: false, message };
  }

  const skillFilePath = getSkillFilePath(skillName);
  const fileContent = fs.readFileSync(skillFilePath, 'utf8');

  // Try to apply patch
  const result = applyPatch(fileContent, patchContent);

  if (result === false) {
    const message = 'Patch does not apply cleanly';
    logger.error(`✗ ${skillName}${parsed.version ? ' v' + parsed.version : ''}: ${message}`);
    return { valid: false, message };
  }

  logger.success(`${skillName}${parsed.version ? ' v' + parsed.version : ''}`);
  return { valid: true, message: 'Patch applies cleanly' };
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
