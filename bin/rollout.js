#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Import commands
const loginCommand = require('../src/commands/login');
const logoutCommand = require('../src/commands/logout');
const deployCommand = require('../src/commands/deploy');
const listCommand = require('../src/commands/list');
const domainCommand = require('../src/commands/domain');
const statusCommand = require('../src/commands/status');

const program = new Command();

program
  .name('rollout')
  .description('A CLI for deploying static sites to rollout.sh')
  .version(packageJson.version);

// Add commands
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(deployCommand);
program.addCommand(listCommand);
program.addCommand(domainCommand);
program.addCommand(statusCommand);

// Global error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  // Don't show error for help command
  if (err.message !== '(outputHelp)') {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}
