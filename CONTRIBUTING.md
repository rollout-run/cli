# Contributing to @rollout-run/cli

Thank you for your interest in contributing to Rollout CLI! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cli.git
   cd cli
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Link the package for local development:
   ```bash
   npm link
   ```

5. Test your changes:
   ```bash
   npm run dev -- --help
   ```

## Making Changes

### Code Style

- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all commands have proper error handling

### Testing

Before submitting a pull request:

1. Test your changes locally:
   ```bash
   npm run dev deploy test-folder
   ```

2. Verify all commands work:
   ```bash
   rollout --help
   rollout login
   rollout list
   ```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:
```
feat: add support for custom domains
fix: resolve deployment timeout issue
docs: update installation instructions
```

## Submitting Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

## Reporting Issues

When reporting issues, please include:

- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Any error messages

## Feature Requests

For feature requests, please:

- Check existing issues first
- Provide a clear description
- Explain the use case
- Consider if it fits the project's scope

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to create a welcoming environment for all contributors.

## Questions?

Feel free to reach out:

- Open an issue for questions
- Email: hello@rollout.run
- Website: https://rollout.run

Thank you for contributing! 🚀
