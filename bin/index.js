#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { createCommand } from '../lib/commands/create.js';
import { applyCommand } from '../lib/commands/apply.js';
import { verifyCommand } from '../lib/commands/verify.js';
import { markCommand } from '../lib/commands/mark.js';

program
  .name('patch-skills')
  .description('Create and apply patches for skills.')
  .version('1.0.0');

program
  .command('mark <skill-name>')
  .alias('m')
  .description('Mark the current state of a skill as the original baseline')
  .option('-v, --verbose', 'Enable verbose output')
  .action((skillName, options) => {
    markCommand(skillName, options).catch(err => {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    });
  });

program
  .command('create <skill-name>')
  .alias('c')
  .description('Create a patch for a modified skill (requires mark first)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--version <version>', 'Specify patch version (e.g., 1.0.0)')
  .action((skillName, options) => {
    createCommand(skillName, options).catch(err => {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    });
  });

program
  .command('apply')
  .description('Apply all patches from the patches directory')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--include <skills>', 'Comma-separated list of skills to include', (val) => val.split(','))
  .option('--exclude <skills>', 'Comma-separated list of skills to exclude', (val) => val.split(','))
  .action((options) => {
    applyCommand(options).catch(err => {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    });
  });

program
  .command('verify')
  .description('Verify that all patches apply cleanly (without applying)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--include <skills>', 'Comma-separated list of skills to include', (val) => val.split(','))
  .option('--exclude <skills>', 'Comma-separated list of skills to exclude', (val) => val.split(','))
  .action((options) => {
    verifyCommand(options).catch(err => {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    });
  });

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
