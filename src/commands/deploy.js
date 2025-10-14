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
      
      // First, check if there's already a project linked to this directory
      const rolloutDir = path.join(folderPath, '.rollout');
      const configPath = path.join(rolloutDir, 'config.json');
      
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        if (config.projectId) {
          // Try to find the existing project
          const projects = await api.getProjects();
          project = projects.find(p => p.id === config.projectId);
          if (project) {
            console.log(chalk.gray(`Using existing project: ${project.name}`));
          }
        }
      }
      
      // If no existing project found, look for project by name or create new one
      if (!project) {
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
        
        // Save local tracking information
        await saveLocalTracking(folderPath, project, deployment, filesToDeploy);
        
        console.log(chalk.green('\n✓ Deployment completed successfully!'));
        console.log(chalk.gray(`Project URL: ${api.getProjectUrl(project.slug)}`));
        
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

async function saveLocalTracking(folderPath, project, deployment, filesToDeploy) {
  try {
    const rolloutDir = path.join(folderPath, '.rollout');
    
    // Ensure .rollout directory exists
    await fs.ensureDir(rolloutDir);
    
    // Calculate total size
    const totalSize = filesToDeploy.reduce((sum, file) => sum + file.size, 0);
    const formattedSize = formatBytes(totalSize);
    
    // Save project config
    const configPath = path.join(rolloutDir, 'config.json');
    const config = {
      projectId: project.id,
      projectSlug: project.slug,
      name: project.name,
      lastDeployment: new Date().toISOString()
    };
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    // Load existing deployments or create new array
    const deploymentsPath = path.join(rolloutDir, 'deployments.json');
    let deployments = [];
    if (await fs.pathExists(deploymentsPath)) {
      deployments = await fs.readJson(deploymentsPath);
    }
    
    // Add new deployment record
    const deploymentRecord = {
      id: deployment.deployment?.id || `deployment-${Date.now()}`,
      version: deployment.deployment?.version || 'unknown',
      status: 'success',
      url: deployment.deployment_url || `https://${project.slug}.${process.env.ROLLOUT_DOMAIN || 'rollout.run'}`,
      deployedAt: new Date().toISOString(),
      files: filesToDeploy.length,
      size: formattedSize
    };
    
    deployments.unshift(deploymentRecord); // Add to beginning
    
    // Keep only last 50 deployments
    if (deployments.length > 50) {
      deployments = deployments.slice(0, 50);
    }
    
    await fs.writeJson(deploymentsPath, deployments, { spaces: 2 });
    
  } catch (error) {
    // Don't fail deployment if local tracking fails
    console.log(chalk.yellow('⚠️  Warning: Could not save local tracking information'));
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = deployCommand;
