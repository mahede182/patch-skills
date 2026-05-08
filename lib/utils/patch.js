import { config } from '../config.js';

/**
 * Parse a patch filename to extract skill name and version
 * Format: skills+<skill-name>+<version>.patch or skills+<skill-name>.patch
 */
export function parsePatchFilename(filename) {
  const { patchPrefix, patchExtension } = config;

  if (!filename.startsWith(patchPrefix) || !filename.endsWith(patchExtension)) {
    return null;
  }

  const innerPart = filename
    .slice(patchPrefix.length)
    .slice(0, -patchExtension.length);

  // Check if version is included (format: name+version)
  const lastPlusIndex = innerPart.lastIndexOf('+');
  if (lastPlusIndex > 0) {
    return {
      skillName: innerPart.slice(0, lastPlusIndex),
      version: innerPart.slice(lastPlusIndex + 1),
    };
  }

  // No version, just skill name
  return {
    skillName: innerPart,
    version: null,
  };
}

/**
 * Build a patch filename from skill name and optional version
 * Format: skills+<skill-name>+<version>.patch
 */
export function buildPatchFilename(skillName, version = '1.0.0') {
  if (version) {
    return `${config.patchPrefix}${skillName}+${version}${config.patchExtension}`;
  }
  return `${config.patchPrefix}${skillName}${config.patchExtension}`;
}

/**
 * Validate that a patch content is a valid unified diff
 */
export function isValidPatchContent(content) {
  const lines = content.split('\n');

  // Must have at least a header line and some diff content
  if (lines.length < 3) return false;

  // Check for unified diff markers
  const hasDiffHeader = lines.some(line => line.startsWith('--- ') || line.startsWith('+++ '));
  const hasHunkHeader = lines.some(line => /^@@ -\d+/.test(line));

  return hasDiffHeader && hasHunkHeader;
}

/**
 * Extract changed files info from patch content
 */
export function getPatchStats(content) {
  const lines = content.split('\n');
  const added = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  const filesChanged = lines.filter(l => l.startsWith('--- ')).length;

  return { added, removed, filesChanged };
}

/**
 * Extract original content from patch header comments
 */
export function extractOriginalFromHeader(patchContent) {
  const ORIGINAL_HEADER = '# ---ORIGINAL---\n';
  const ORIGINAL_END = '# ---END---\n';

  const startIdx = patchContent.indexOf(ORIGINAL_HEADER);
  if (startIdx === -1) return '';

  const endIdx = patchContent.indexOf(ORIGINAL_END, startIdx);
  if (endIdx === -1) return '';

  const headerSection = patchContent.slice(startIdx + ORIGINAL_HEADER.length, endIdx);

  return headerSection.split('\n').map(line => line.replace(/^# /, '')).join('\n');
}
