const { Command } = require('commander');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

const statusCommand = new Command('status');

statusCommand
  .description('Check deployment status')
  .argument('<project>', 'Project name')
  .option('-d, --deployment <id>', 'Specific deployment ID')
  .action(async (projectName, options) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      console.log(chalk.blue(`Checking status for project ${projectName}...`));
      
      // Find project
      const projects = await api.getProjects();
      const project = projects.find(p => p.slug === projectName);
      
      if (!project) {
        console.error(chalk.red(`✗ Project not found: ${projectName}`));
        process.exit(1);
      }

      console.log(chalk.green(`\nProject: ${project.name}`));
      console.log(chalk.gray(`URL: ${api.getProjectUrl(project.slug)}`));
      console.log(chalk.gray(`Status: ${project.status}`));
      
      if (options.deployment) {
        // Show specific deployment status
        const deployment = await api.getDeploymentStatus(project.id, options.deployment);
        
        console.log(chalk.green(`\nDeployment ${deployment.version}:`));
        console.log(chalk.gray(`Status: ${deployment.status}`));
        console.log(chalk.gray(`Files: ${deployment.file_count}`));
        console.log(chalk.gray(`Size: ${formatBytes(deployment.total_size)}`));
        
        if (deployment.deployed_at) {
          console.log(chalk.gray(`Deployed: ${new Date(deployment.deployed_at).toLocaleString()}`));
        }
        
        if (deployment.commit_hash) {
          console.log(chalk.gray(`Commit: ${deployment.commit_hash}`));
        }
        
        if (deployment.branch) {
          console.log(chalk.gray(`Branch: ${deployment.branch}`));
        }
        
      } else {
        // Show latest deployment status
        if (project.latest_deployment && project.latest_deployment.length > 0) {
          const deployment = project.latest_deployment[0];
          
          console.log(chalk.green(`\nLatest Deployment:`));
          console.log(chalk.gray(`Version: ${deployment.version}`));
          console.log(chalk.gray(`Status: ${deployment.status}`));
          console.log(chalk.gray(`Files: ${deployment.file_count}`));
          console.log(chalk.gray(`Size: ${formatBytes(deployment.total_size)}`));
          
          if (deployment.deployed_at) {
            console.log(chalk.gray(`Deployed: ${new Date(deployment.deployed_at).toLocaleString()}`));
          }
          
          if (deployment.commit_hash) {
            console.log(chalk.gray(`Commit: ${deployment.commit_hash}`));
          }
          
          if (deployment.branch) {
            console.log(chalk.gray(`Branch: ${deployment.branch}`));
          }
        } else {
          console.log(chalk.yellow('\nNo deployments found.'));
          console.log(chalk.gray('Deploy your first site with: rollout deploy'));
        }
      }
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to check status:'), error.message);
      process.exit(1);
    }
  });

module.exports = statusCommand;
