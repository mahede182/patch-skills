import fs from 'fs-extra';
import path from 'path';
import { skillExists, getSkillFilePath, getPatchesDir } from '../utils/paths.js';
import { logger } from '../utils/logger.js';

const ORIG_DIR = '.orig';

/**
 * Mark a skill's current state as the original baseline
 * This must be run before creating patches
 */
export async function markCommand(skillName, options = {}) {
  const { verbose = false } = options;

  if (!skillExists(skillName)) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  const skillFilePath = getSkillFilePath(skillName);
  const currentContent = fs.readFileSync(skillFilePath, 'utf8');

  // Store original in patches/.orig/
  const patchesDir = getPatchesDir();
  const origDir = path.join(patchesDir, ORIG_DIR);
  await fs.ensureDir(origDir);

  const origFilePath = path.join(origDir, `${skillName}.md.orig`);
  fs.writeFileSync(origFilePath, currentContent, 'utf8');

  logger.success(`Marked "${skillName}" - original saved to ${path.relative(process.cwd(), origFilePath)}`);
  logger.info(`You can now edit ${skillFilePath} and run:`);
  logger.info(`  npx patch-skills create ${skillName}`);

  if (verbose) {
    logger.verbose(`Original content hash: ${currentContent.length} chars`, verbose);
  }
}
