const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ApiClient = require('../utils/api');

const registerCommand = new Command('register');

registerCommand
  .description('Register a new Rollout account')
  .option('-n, --name <name>', 'Full name')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .action(async (options) => {
    const api = new ApiClient();
    
    try {
      let name = options.name;
      let email = options.email;
      let password = options.password;

      // If name/email/password not provided via options, prompt for them
      if (!name || !email || !password) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Full name:',
            default: name,
            validate: (input) => {
              if (!input) return 'Name is required';
              return true;
            },
          },
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
              if (input.length < 8) return 'Password must be at least 8 characters';
              return true;
            },
          },
          {
            type: 'password',
            name: 'password_confirmation',
            message: 'Confirm password:',
            mask: '*',
            validate: (input, answers) => {
              if (!input) return 'Password confirmation is required';
              if (input !== answers.password) return 'Passwords do not match';
              return true;
            },
          },
        ]);
        
        name = answers.name;
        email = answers.email;
        password = answers.password;
      }

      console.log(chalk.blue('Creating account...'));
      
      const result = await api.register(name, email, password);
      
      console.log(chalk.green('✓ Account created successfully!'));
      console.log(chalk.gray(`Welcome, ${result.user.name}!`));
      console.log(chalk.gray(`You are now logged in and ready to deploy.`));
      
    } catch (error) {
      console.error(chalk.red('✗ Registration failed:'), error.message);
      process.exit(1);
    }
  });

module.exports = registerCommand;
