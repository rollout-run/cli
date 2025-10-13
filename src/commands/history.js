const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const historyCommand = new Command('history');

historyCommand
  .description('Show deployment history for current project')
  .option('-l, --limit <number>', 'Limit number of deployments to show', '10')
  .action(async (options) => {
    try {
      const currentDir = process.cwd();
      const rolloutDir = path.join(currentDir, '.rollout');
      const deploymentsPath = path.join(rolloutDir, 'deployments.json');
      
      // Check if .rollout directory exists
      if (!await fs.pathExists(rolloutDir)) {
        console.log(chalk.yellow('No .rollout directory found.'));
        console.log(chalk.gray('Deploy a project first to create local tracking.'));
        return;
      }
      
      // Check if deployments file exists
      if (!await fs.pathExists(deploymentsPath)) {
        console.log(chalk.yellow('No deployment history found.'));
        console.log(chalk.gray('Deploy a project first to create local tracking.'));
        return;
      }
      
      const deployments = await fs.readJson(deploymentsPath);
      const limit = parseInt(options.limit);
      
      if (deployments.length === 0) {
        console.log(chalk.yellow('No deployments found.'));
        return;
      }
      
      console.log(chalk.blue(`📜 Deployment History (${deployments.length} total)\n`));
      
      // Show deployments
      const deploymentsToShow = deployments.slice(0, limit);
      
      deploymentsToShow.forEach((deployment, index) => {
        const date = new Date(deployment.deployedAt);
        const status = deployment.status === 'success' ? chalk.green('✓') : chalk.red('✗');
        
        console.log(chalk.bold(`${index + 1}. ${deployment.version}`));
        console.log(chalk.gray(`   Status: ${status} ${deployment.status}`));
        console.log(chalk.gray(`   Date: ${date.toLocaleString()}`));
        console.log(chalk.gray(`   Files: ${deployment.files}`));
        console.log(chalk.gray(`   Size: ${deployment.size}`));
        console.log(chalk.gray(`   URL: ${deployment.url}`));
        console.log('');
      });
      
      if (deployments.length > limit) {
        console.log(chalk.gray(`... and ${deployments.length - limit} more deployments`));
        console.log(chalk.gray(`Use --limit ${deployments.length} to see all deployments`));
      }
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to get deployment history:'), error.message);
      process.exit(1);
    }
  });

module.exports = historyCommand;
