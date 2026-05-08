import chalk from 'chalk';

/**
 * Consistent logging utility for patch-skills
 */
export const logger = {
  info(message) {
    console.log(chalk.blue(message));
  },

  success(message) {
    console.log(chalk.green(`✓ ${message}`));
  },

  warning(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
  },

  error(message) {
    console.error(chalk.red(`✖ ${message}`));
  },

  verbose(message, isVerbose) {
    if (isVerbose) {
      console.log(chalk.gray(`  ${message}`));
    }
  },

  section(title) {
    console.log(chalk.blue(`\n${title}`));
  },
};
