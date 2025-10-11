const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const chalk = require('chalk');
const { default: ora } = require('ora');
const ApiClient = require('../utils/api');

const deployCommand = new Command('deploy');

deployCommand
  .description('Deploy a static site to Rollout')
  .argument('[folder]', 'Folder to deploy', '.')
  .option('-p, --project <name>', 'Project name (optional, auto-generated Heroku-style)')
  .option('-d, --domain <domain>', 'Custom domain (optional)')
  .option('--commit <hash>', 'Git commit hash')
  .option('--branch <branch>', 'Git branch name')
  .action(async (folder, options) => {
    const api = new ApiClient();
    
    try {
      // Check if user is logged in
      if (!api.token) {
        console.error(chalk.red('✗ Please login first: rollout login'));
        process.exit(1);
      }

      const folderPath = path.resolve(folder);
      
      // Check if folder exists
      if (!await fs.pathExists(folderPath)) {
        console.error(chalk.red(`✗ Folder not found: ${folderPath}`));
        process.exit(1);
      }

      // Check if folder contains files
      const files = await fs.readdir(folderPath);
      if (files.length === 0) {
        console.error(chalk.red('✗ Folder is empty'));
        process.exit(1);
      }

      let projectName = options.project;
      
      // Server will auto-generate project name if not provided
      if (!projectName) {
        console.log(chalk.gray('No project name provided, server will generate one automatically'));
      }

      // Validate project name if provided
      if (projectName && !/^[a-z0-9-]+$/.test(projectName)) {
        console.error(chalk.red('✗ Project name can only contain lowercase letters, numbers, and hyphens'));
        process.exit(1);
      }

      console.log(chalk.blue(`Deploying ${folderPath}${projectName ? ` to ${projectName}` : ''}...`));

      // Get or create project
      let project;
      
      if (projectName) {
        // Look for existing project with this name
        const projects = await api.getProjects();
        project = projects.find(p => p.slug === projectName);
      }
      
      if (!project) {
        const spinner = ora('Creating project...').start();
        try {
          // Create project (server will generate name if not provided)
          project = await api.createProject(projectName, `Deployed from ${folderPath}`);
          spinner.succeed(`Project created: ${project.name}`);
        } catch (error) {
          spinner.fail('Failed to create project');
          throw error;
        }
      }

      // Collect files to deploy
      const spinner = ora('Collecting files...').start();
      const filesToDeploy = await collectFiles(folderPath);
      spinner.succeed(`Found ${filesToDeploy.length} files`);

      // Deploy files
      const deploySpinner = ora('Deploying files...').start();
      try {
        const deployment = await api.deployProject(project.id, filesToDeploy, {
          commitHash: options.commit,
          branch: options.branch,
        });
        
        deploySpinner.succeed('Deployment successful!');
        
        console.log(chalk.green('\n✓ Deployment completed successfully!'));
        console.log(chalk.gray(`Project URL: https://${project.slug}.local.rollout.run`));
        
        if (deployment.deployment_url) {
          console.log(chalk.gray(`Deployment URL: ${deployment.deployment_url}`));
        }
        
      } catch (error) {
        deploySpinner.fail('Deployment failed');
        throw error;
      }
      
    } catch (error) {
      console.error(chalk.red('✗ Deployment failed:'), error.message);
      process.exit(1);
    }
  });

async function collectFiles(folderPath) {
  const files = [];
  
  async function scanDirectory(dir, basePath = '') {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!item.startsWith('.') && item !== 'node_modules') {
          await scanDirectory(itemPath, relativePath);
        }
      } else {
        // Skip hidden files and common build artifacts
        if (!item.startsWith('.') && !isIgnoredFile(item)) {
          const content = await fs.readFile(itemPath);
          files.push({
            name: relativePath,
            buffer: content,
            size: content.length,
          });
        }
      }
    }
  }
  
  await scanDirectory(folderPath);
  return files;
}

function isIgnoredFile(filename) {
  const ignoredExtensions = ['.log', '.tmp', '.temp', '.cache'];
  const ignoredFiles = ['Thumbs.db', 'DS_Store'];
  
  const ext = path.extname(filename).toLowerCase();
  return ignoredExtensions.includes(ext) || ignoredFiles.includes(filename);
}


module.exports = deployCommand;
