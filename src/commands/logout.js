const { Command } = require('commander');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

const logoutCommand = new Command('logout');

logoutCommand
  .description('Logout from your Rollout account')
  .action(async () => {
    const api = new ApiClient();
    
    try {
      console.log(chalk.blue('Logging out...'));
      
      await api.logout();
      
      console.log(chalk.green('✓ Successfully logged out!'));
      
    } catch (error) {
      console.error(chalk.red('✗ Logout failed:'), error.message);
      process.exit(1);
    }
  });

module.exports = logoutCommand;
