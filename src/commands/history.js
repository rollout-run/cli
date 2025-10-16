const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const ApiClient = require('../utils/api');

const historyCommand = new Command('history');

historyCommand
  .description('Show deployment history for current project')
  .option('-l, --limit <number>', 'Limit number of deployments to show', '10')
  .action(async (options) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      // Find the project for current directory
      const currentDir = process.cwd();
      const rolloutDir = path.join(currentDir, '.rollout');
      const configPath = path.join(rolloutDir, 'config.json');
      
      let projectId = null;
      
      // Check if there's a project linked to this directory
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        if (config.projectId) {
          projectId = config.projectId;
        }
      }
      
      if (!projectId) {
        console.log(chalk.yellow('No project found for current directory.'));
        console.log(chalk.gray('Deploy a project first to create project tracking.'));
        return;
      }
      
      // Get deployments from API
      const limit = parseInt(options.limit);
      const deploymentsData = await api.getDeployments(projectId, limit);
      
      // Handle paginated response
      const deployments = deploymentsData.data || deploymentsData;
      
      if (!deployments || deployments.length === 0) {
        console.log(chalk.yellow('No deployments found for this project.'));
        return;
      }
      
      console.log(chalk.blue(`📜 Deployment History (${deployments.length} deployments)\n`));
      
      // Create table
      const table = new Table({
        head: [
          chalk.bold('Version'),
          chalk.bold('Status'),
          chalk.bold('Date'),
          chalk.bold('Files'),
          chalk.bold('Size'),
          chalk.bold('URL')
        ],
        colWidths: [8, 12, 20, 8, 12, 40],
        style: {
          head: [],
          border: ['gray']
        }
      });
      
      // Add deployments to table
      deployments.forEach((deployment) => {
        const date = new Date(deployment.deployed_at || deployment.created_at);
        const status = deployment.status === 'success' 
          ? chalk.green('✓ Success') 
          : deployment.status === 'failed'
          ? chalk.red('✗ Failed')
          : chalk.yellow('⏳ Pending');
        
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const shortUrl = deployment.deployment_url && deployment.deployment_url.length > 35 
          ? '...' + deployment.deployment_url.slice(-32) 
          : deployment.deployment_url || 'N/A';
        
        // Format file size
        const fileSize = deployment.total_size ? formatBytes(deployment.total_size) : 'N/A';
        
        table.push([
          chalk.bold(deployment.version?.toString() || 'N/A'),
          status,
          formattedDate,
          deployment.file_count?.toString() || '0',
          fileSize,
          chalk.blue(shortUrl)
        ]);
      });
      
      console.log(table.toString());
      
      if (deployments.length >= limit) {
        console.log(chalk.gray(`\nShowing ${limit} most recent deployments`));
        console.log(chalk.gray(`Use --limit ${limit + 10} to see more deployments`));
      }
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to get deployment history:'), error.message);
      process.exit(1);
    }
  });

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = historyCommand;
