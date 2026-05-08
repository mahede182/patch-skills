import fs from 'fs-extra';
import path from 'path';
import { existsSync } from 'fs';
import { config } from '../config.js';
import { parsePatchFilename } from './patch.js';

/**
 * Get the root directory of the current project
 */
export function getProjectRoot() {
  return process.cwd();
}

/**
 * Get the .agents/skills directory path
 */
export function getSkillsDir() {
  return path.join(getProjectRoot(), ...config.skillsDir.split('/'));
}

/**
 * Get the patches directory path
 */
export function getPatchesDir() {
  return path.join(getProjectRoot(), config.patchesDir);
}

/**
 * Get the path to a specific skill directory
 */
export function getSkillPath(skillName) {
  return path.join(getSkillsDir(), skillName);
}

/**
 * Get the path to the SKILL.md file for a skill
 */
export function getSkillFilePath(skillName) {
  return path.join(getSkillPath(skillName), config.skillFilename);
}

/**
 * Get the path to a patch file
 * Supports versioned filenames: skills+<skill-name>+<version>.patch
 */
export function getPatchFilePath(skillName, version = null) {
  if (version) {
    return path.join(getPatchesDir(), `${config.patchPrefix}${skillName}+${version}${config.patchExtension}`);
  }
  return path.join(getPatchesDir(), `${config.patchPrefix}${skillName}${config.patchExtension}`);
}

/**
 * Find the latest patch file for a skill (highest version)
 */
export function findLatestPatch(skillName) {
  const patchesDir = getPatchesDir();
  if (!existsSync(patchesDir)) return null;

  const files = fs.readdirSync(patchesDir);
  const patches = files
    .map(file => parsePatchFilename(file))
    .filter(parsed => parsed && parsed.skillName === skillName)
    .sort((a, b) => compareVersions(b.version || '0.0.0', a.version || '0.0.0'));

  return patches[0] || null;
}

/**
 * Simple semver comparison (a > b returns 1, a < b returns -1, equal returns 0)
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

/**
 * Verify that a skill exists
 */
export function skillExists(skillName) {
  const skillPath = getSkillPath(skillName);
  const skillFile = getSkillFilePath(skillName);
  return existsSync(skillPath) && existsSync(skillFile);
}

/**
 * Verify that .agents/skills directory exists
 */
export function skillsDirExists() {
  return existsSync(getSkillsDir());
}

/**
 * Verify that patches directory exists
 */
export function patchesDirExists() {
  return existsSync(getPatchesDir());
}

/**
 * Check if a patch file exists for a skill
 */
export function patchExists(skillName) {
  return existsSync(getPatchFilePath(skillName));
}
