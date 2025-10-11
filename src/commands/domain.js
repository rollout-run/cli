const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ApiClient = require('../utils/api');

const domainCommand = new Command('domain');

domainCommand
  .description('Manage custom domains for your projects')
  .command('add')
  .description('Add a custom domain to a project')
  .argument('<project>', 'Project name')
  .argument('<domain>', 'Custom domain')
  .action(async (projectName, domain) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      console.log(chalk.blue(`Adding domain ${domain} to project ${projectName}...`));
      
      // Find project
      const projects = await api.getProjects();
      const project = projects.find(p => p.slug === projectName);
      
      if (!project) {
        console.error(chalk.red(`✗ Project not found: ${projectName}`));
        process.exit(1);
      }

      const domainResult = await api.addDomain(project.id, domain);
      
      console.log(chalk.green('✓ Domain added successfully!'));
      console.log(chalk.gray(`Domain: ${domain}`));
      console.log(chalk.gray(`Project: ${project.name}`));
      
      if (domainResult.verification_token) {
        console.log(chalk.yellow('\n⚠️  Domain verification required:'));
        console.log(chalk.gray(`Add this TXT record to your domain DNS:`));
        console.log(chalk.bold(`Name: _rollout-verification`));
        console.log(chalk.bold(`Value: ${domainResult.verification_token}`));
      }
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to add domain:'), error.message);
      process.exit(1);
    }
  });

domainCommand
  .command('remove')
  .description('Remove a custom domain from a project')
  .argument('<project>', 'Project name')
  .argument('<domain>', 'Custom domain')
  .action(async (projectName, domain) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      console.log(chalk.blue(`Removing domain ${domain} from project ${projectName}...`));
      
      // Find project
      const projects = await api.getProjects();
      const project = projects.find(p => p.slug === projectName);
      
      if (!project) {
        console.error(chalk.red(`✗ Project not found: ${projectName}`));
        process.exit(1);
      }

      // Get domains for the project
      const domains = await api.getDomains(project.id);
      const domainToRemove = domains.find(d => d.domain === domain);
      
      if (!domainToRemove) {
        console.error(chalk.red(`✗ Domain not found: ${domain}`));
        process.exit(1);
      }

      await api.removeDomain(project.id, domainToRemove.id);
      
      console.log(chalk.green('✓ Domain removed successfully!'));
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to remove domain:'), error.message);
      process.exit(1);
    }
  });

domainCommand
  .command('list')
  .description('List domains for a project')
  .argument('<project>', 'Project name')
  .action(async (projectName) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      console.log(chalk.blue(`Fetching domains for project ${projectName}...`));
      
      // Find project
      const projects = await api.getProjects();
      const project = projects.find(p => p.slug === projectName);
      
      if (!project) {
        console.error(chalk.red(`✗ Project not found: ${projectName}`));
        process.exit(1);
      }

      const domains = await api.getDomains(project.id);
      
      console.log(chalk.green(`\nDomains for ${project.name}:\n`));
      
      if (domains.length === 0) {
        console.log(chalk.yellow('No custom domains configured.'));
        console.log(chalk.gray(`Default domain: ${api.getProjectUrl(project.slug)}`));
        return;
      }

      domains.forEach((domain, index) => {
        console.log(chalk.bold(`${index + 1}. ${domain.domain}`));
        console.log(chalk.gray(`   Status: ${domain.verified_at ? 'Verified' : 'Pending verification'}`));
        console.log(chalk.gray(`   SSL: ${domain.ssl_enabled ? 'Enabled' : 'Disabled'}`));
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('✗ Failed to fetch domains:'), error.message);
      process.exit(1);
    }
  });

module.exports = domainCommand;
