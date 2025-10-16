const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const ApiClient = require('../utils/api');

const statusCommand = new Command('status');

statusCommand
  .description('Show current project status and last deployment')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      const currentDir = process.cwd();
      const rolloutDir = path.join(currentDir, '.rollout');
      const configPath = path.join(rolloutDir, 'config.json');
      
      // Check if .rollout directory exists
      if (!await fs.pathExists(rolloutDir)) {
        console.log(chalk.yellow('📁 No .rollout directory found.'));
        console.log(chalk.gray('Deploy a project first to create project tracking.'));
        return;
      }
      
      // Check if config exists
      if (!await fs.pathExists(configPath)) {
        console.log(chalk.yellow('⚙️  No project configuration found.'));
        console.log(chalk.gray('Deploy a project first to create project tracking.'));
        return;
      }
      
      const config = await fs.readJson(configPath);
      
      // Get project details from API
      const projects = await api.getProjects();
      const project = projects.find(p => p.id === config.projectId);
      
      if (!project) {
        console.log(chalk.red('❌ Project not found.'));
        console.log(chalk.gray('The project may have been deleted or you may not have access.'));
        return;
      }
      
      // Get latest deployment from API
      const deploymentsData = await api.getDeployments(config.projectId, 1);
      const deployments = deploymentsData.data || deploymentsData;
      const latestDeployment = deployments.length > 0 ? deployments[0] : null;
      
      // Header
      console.log(chalk.blue.bold('📊 Project Status\n'));
      
      // Project Information Card
      console.log(chalk.bgBlue.white.bold(' PROJECT INFORMATION '));
      console.log(chalk.white('┌─────────────────────────────────────────────────────────┐'));
      console.log(chalk.white('│') + chalk.bold(` Name:     `) + chalk.white(`${project.name}`.padEnd(45)) + chalk.white('│'));
      console.log(chalk.white('│') + chalk.bold(` Slug:     `) + chalk.white(`${project.slug}`.padEnd(45)) + chalk.white('│'));
      console.log(chalk.white('│') + chalk.bold(` ID:       `) + chalk.white(`${project.id}`.padEnd(45)) + chalk.white('│'));
      console.log(chalk.white('│') + chalk.bold(` URL:      `) + chalk.blue(`${api.getProjectUrl(project.slug)}`.padEnd(45)) + chalk.white('│'));
      console.log(chalk.white('│') + chalk.bold(` Status:   `) + chalk.green(`${project.status || 'active'}`.padEnd(45)) + chalk.white('│'));
      console.log(chalk.white('└─────────────────────────────────────────────────────────┘\n'));
      
      // Latest Deployment Card
      if (latestDeployment) {
        const statusColor = latestDeployment.status === 'success' ? chalk.green : 
                           latestDeployment.status === 'failed' ? chalk.red : chalk.yellow;
        const statusIcon = latestDeployment.status === 'success' ? '✅' : 
                          latestDeployment.status === 'failed' ? '❌' : '⏳';
        
        console.log(chalk.bgGreen.white.bold(' LATEST DEPLOYMENT '));
        console.log(chalk.white('┌─────────────────────────────────────────────────────────┐'));
        console.log(chalk.white('│') + chalk.bold(` Status:   `) + statusColor(`${statusIcon} ${latestDeployment.status}`.padEnd(45)) + chalk.white('│'));
        console.log(chalk.white('│') + chalk.bold(` Version:  `) + chalk.white(`${latestDeployment.version}`.padEnd(45)) + chalk.white('│'));
        console.log(chalk.white('│') + chalk.bold(` Files:    `) + chalk.white(`${latestDeployment.file_count || 0}`.padEnd(45)) + chalk.white('│'));
        console.log(chalk.white('│') + chalk.bold(` Size:     `) + chalk.white(`${formatBytes(latestDeployment.total_size || 0)}`.padEnd(45)) + chalk.white('│'));
        
        if (latestDeployment.deployed_at) {
          const deployDate = new Date(latestDeployment.deployed_at);
          console.log(chalk.white('│') + chalk.bold(` Deployed: `) + chalk.white(`${deployDate.toLocaleString()}`.padEnd(45)) + chalk.white('│'));
        }
        
        if (latestDeployment.deployment_url) {
          const shortUrl = latestDeployment.deployment_url.length > 35 
            ? '...' + latestDeployment.deployment_url.slice(-32) 
            : latestDeployment.deployment_url;
          console.log(chalk.white('│') + chalk.bold(` URL:      `) + chalk.blue(`${shortUrl}`.padEnd(45)) + chalk.white('│'));
        }
        
        console.log(chalk.white('└─────────────────────────────────────────────────────────┘\n'));
      } else {
        console.log(chalk.bgYellow.white.bold(' NO DEPLOYMENTS '));
        console.log(chalk.white('┌─────────────────────────────────────────────────────────┐'));
        console.log(chalk.white('│') + chalk.yellow(' No deployments found for this project. '.padEnd(45)) + chalk.white('│'));
        console.log(chalk.white('│') + chalk.gray(' Run "rollout deploy" to create your first deployment. '.padEnd(45)) + chalk.white('│'));
        console.log(chalk.white('└─────────────────────────────────────────────────────────┘\n'));
      }
      
      // Recent Deployments Table (if verbose)
      if (options.verbose && deployments.length > 1) {
        console.log(chalk.blue.bold('📜 Recent Deployments\n'));
        
        const table = new Table({
          head: [
            chalk.bold('Version'),
            chalk.bold('Status'),
            chalk.bold('Date'),
            chalk.bold('Files'),
            chalk.bold('Size')
          ],
          colWidths: [8, 12, 20, 8, 12],
          style: {
            head: [],
            border: ['gray']
          }
        });
        
        deployments.slice(0, 5).forEach((deployment) => {
          const date = new Date(deployment.deployed_at || deployment.created_at);
          const status = deployment.status === 'success' 
            ? chalk.green('✅ Success') 
            : deployment.status === 'failed'
            ? chalk.red('❌ Failed')
            : chalk.yellow('⏳ Pending');
          
          const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          
          table.push([
            chalk.bold(deployment.version?.toString() || 'N/A'),
            status,
            formattedDate,
            deployment.file_count?.toString() || '0',
            formatBytes(deployment.total_size || 0)
          ]);
        });
        
        console.log(table.toString());
        
        if (deployments.length > 5) {
          console.log(chalk.gray(`\n... and ${deployments.length - 5} more deployments`));
          console.log(chalk.gray(`Run "rollout history" to see all deployments`));
        }
      }
      
      // Quick Actions
      console.log(chalk.blue.bold('🚀 Quick Actions\n'));
      console.log(chalk.gray('• ') + chalk.white('rollout deploy') + chalk.gray(' - Deploy current directory'));
      console.log(chalk.gray('• ') + chalk.white('rollout history') + chalk.gray(' - View deployment history'));
      console.log(chalk.gray('• ') + chalk.white('rollout status --verbose') + chalk.gray(' - Show detailed information'));
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to get project status:'), error.message);
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

module.exports = statusCommand;