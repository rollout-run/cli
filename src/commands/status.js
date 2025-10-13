const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

const statusCommand = new Command('status');

statusCommand
  .description('Show current project status and last deployment')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const currentDir = process.cwd();
      const rolloutDir = path.join(currentDir, '.rollout');
      const configPath = path.join(rolloutDir, 'config.json');
      
      // Check if .rollout directory exists
      if (!await fs.pathExists(rolloutDir)) {
        console.log(chalk.yellow('No .rollout directory found.'));
        console.log(chalk.gray('Deploy a project first to create local tracking.'));
        return;
      }
      
      // Check if config exists
      if (!await fs.pathExists(configPath)) {
        console.log(chalk.yellow('No project configuration found.'));
        console.log(chalk.gray('Deploy a project first to create local tracking.'));
        return;
      }
      
      const config = await fs.readJson(configPath);
      const api = new ApiClient();
      
      console.log(chalk.blue('📊 Project Status\n'));
      
      // Show project info
      console.log(chalk.bold('Project Information:'));
      console.log(chalk.gray(`  Name: ${config.name}`));
      console.log(chalk.gray(`  Slug: ${config.projectSlug}`));
      console.log(chalk.gray(`  ID: ${config.projectId}`));
      console.log(chalk.gray(`  URL: ${api.getProjectUrl(config.projectSlug)}`));
      
      if (config.lastDeployment) {
        const lastDeploy = new Date(config.lastDeployment);
        console.log(chalk.gray(`  Last Deployed: ${lastDeploy.toLocaleString()}`));
      }
      
      // Show last deployment details
      const deploymentsPath = path.join(rolloutDir, 'deployments.json');
      let deployments = [];
      if (await fs.pathExists(deploymentsPath)) {
        deployments = await fs.readJson(deploymentsPath);
        
        if (deployments.length > 0) {
          const lastDeployment = deployments[0];
          
          console.log(chalk.bold('\nLast Deployment:'));
          console.log(chalk.gray(`  Status: ${chalk.green('✓')} ${lastDeployment.status}`));
          console.log(chalk.gray(`  Version: ${lastDeployment.version}`));
          console.log(chalk.gray(`  Files: ${lastDeployment.files}`));
          console.log(chalk.gray(`  Size: ${lastDeployment.size}`));
          console.log(chalk.gray(`  URL: ${lastDeployment.url}`));
          
          if (options.verbose) {
            console.log(chalk.bold('\nDeployment History:'));
            deployments.slice(0, 5).forEach((deployment, index) => {
              const date = new Date(deployment.deployedAt).toLocaleString();
              const status = deployment.status === 'success' ? chalk.green('✓') : chalk.red('✗');
              console.log(chalk.gray(`  ${index + 1}. ${status} ${deployment.version} - ${date} (${deployment.files} files, ${deployment.size})`));
            });
            
            if (deployments.length > 5) {
              console.log(chalk.gray(`  ... and ${deployments.length - 5} more deployments`));
            }
          }
        }
      }
      
      console.log(chalk.gray(`\nTotal Deployments: ${deployments.length}`));
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to get project status:'), error.message);
      process.exit(1);
    }
  });

module.exports = statusCommand;