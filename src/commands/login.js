const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

const loginCommand = new Command('login');

loginCommand
  .description('Login to your Rollout account')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .action(async (options) => {
    const api = new ApiClient();
    
    try {
      let email = options.email;
      let password = options.password;

      // If email/password not provided via options, prompt for them
      if (!email || !password) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            default: email,
            validate: (input) => {
              if (!input) return 'Email is required';
              if (!input.includes('@')) return 'Please enter a valid email';
              return true;
            },
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
            mask: '*',
            validate: (input) => {
              if (!input) return 'Password is required';
              return true;
            },
          },
        ]);
        
        email = answers.email;
        password = answers.password;
      }

      console.log(chalk.blue('Logging in...'));
      
      const result = await api.login(email, password);
      
      console.log(chalk.green('✓ Successfully logged in!'));
      console.log(chalk.gray(`Welcome back, ${result.user.name}!`));
      
    } catch (error) {
      console.error(chalk.red('✗ Login failed:'), error.message);
      process.exit(1);
    }
  });

module.exports = loginCommand;
