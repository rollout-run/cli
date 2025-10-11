const { Command } = require('commander');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

const listCommand = new Command('list');

listCommand
  .description('List your projects')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      console.log(chalk.blue('Fetching projects...'));
      
      const projects = await api.getProjects();
      
      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found. Create one with: rollout deploy'));
        return;
      }

      console.log(chalk.green(`\nFound ${projects.length} project(s):\n`));
      
      projects.forEach((project, index) => {
        console.log(chalk.bold(`${index + 1}. ${project.name}`));
        console.log(chalk.gray(`   URL: ${api.getProjectUrl(project.slug)}`));
        console.log(chalk.gray(`   Status: ${project.status}`));
        
        if (options.verbose) {
          console.log(chalk.gray(`   Created: ${new Date(project.created_at).toLocaleDateString()}`));
          if (project.description) {
            console.log(chalk.gray(`   Description: ${project.description}`));
          }
        }
        
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to fetch projects:'), error.message);
      process.exit(1);
    }
  });

module.exports = listCommand;
