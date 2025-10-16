#!/usr/bin/env node

// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Import commands
const loginCommand = require('../src/commands/login');
const registerCommand = require('../src/commands/register');
const logoutCommand = require('../src/commands/logout');
const deployCommand = require('../src/commands/deploy');
const listCommand = require('../src/commands/list');
const statusCommand = require('../src/commands/status');
const historyCommand = require('../src/commands/history');
const domainCommand = require('../src/commands/domain');

const program = new Command();

program
  .name('rollout')
  .description('Deploy static sites to rollout.run (deploy is the default action)')
  .version(packageJson.version);

// Add commands
program.addCommand(loginCommand);
program.addCommand(registerCommand);
program.addCommand(logoutCommand);
program.addCommand(deployCommand);
program.addCommand(listCommand);
program.addCommand(statusCommand);
program.addCommand(historyCommand);
program.addCommand(domainCommand);

// Set deploy as default action when no subcommand is provided
program.action(async (options) => {
  // Check if help was requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    program.help();
    return;
  }
  
  // Check if version was requested
  if (process.argv.includes('--version') || process.argv.includes('-V')) {
    console.log(packageJson.version);
    return;
  }
  
  // Default to deploy command
  console.log(chalk.blue('🚀 Running deployment...'));
  
  // Parse arguments for deploy command
  const args = process.argv.slice(2); // Remove 'rollout' from args
  const deployArgs = ['.']; // Default folder
  
  // Add any additional arguments that might be deploy-related
  if (args.length > 0 && !args.includes('--help') && !args.includes('-h')) {
    deployArgs[0] = args[0]; // Use first arg as folder if provided
  }
  
  // Run deploy command by calling it directly
  try {
    await deployCommand.parseAsync(['deploy', ...deployArgs]);
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
});

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
