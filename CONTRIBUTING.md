# Contributing to Ziruna

Thank you for your interest in contributing to the Ziruna SaaS Spend Management Platform! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. **Check Existing Issues** - Before creating a new issue, please search to see if the problem has already been reported.
2. **Use the Issue Template** - When creating a new issue, use the bug report template if available.
3. **Provide Details** - Include as many details as possible: steps to reproduce, expected behavior, actual behavior, screenshots, and environment details.

### Suggesting Enhancements

1. **Check Existing Suggestions** - Review existing enhancement requests before creating a new one.
2. **Use the Feature Request Template** - When suggesting an enhancement, use the feature request template if available.
3. **Provide Context** - Explain why this enhancement would be useful and how it aligns with the project's goals.

### Pull Requests

1. **Fork the Repository** - Fork the repository to your GitHub account.
2. **Create a Branch** - Create a branch for your changes from the `main` branch.
3. **Make Your Changes** - Make your changes following the coding standards.
4. **Write Tests** - Add tests for your changes if applicable.
5. **Run Tests and Linting** - Ensure all tests pass and the code meets linting standards.
6. **Submit a Pull Request** - Submit your changes as a pull request, referencing any related issues.

## Development Process

### Getting Started

Follow the [Development Guide](./docs/DevelopmentGuide.md) to set up your development environment.

### Branch Naming Convention

- `feature/feature-name` - For new features
- `fix/bug-name` - For bug fixes
- `docs/documentation-name` - For documentation changes
- `refactor/refactor-name` - For code refactoring
- `test/test-name` - For adding or modifying tests

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to the build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify source or test files

Examples:
- `feat(subscriptions): add ability to filter by category`
- `fix(auth): resolve issue with token refresh`
- `docs(readme): update installation instructions`

### Code Reviews

All submissions require review. We use GitHub pull requests for this purpose.

## Coding Standards

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Use type unions and intersections where appropriate
- Avoid the `any` type unless absolutely necessary

### React Components

- Use functional components
- Use React Hooks for state and effects
- Implement proper prop validation with TypeScript
- Follow the component file structure:
  1. Imports
  2. Types and interfaces
  3. Component function
  4. Helper functions
  5. Exports

### Styling

- Use Tailwind CSS for styling
- Use the Shadcn UI component library
- Follow the mobile-first approach
- Use the `cn` utility for conditional class names

### Testing

- Write unit tests for utility functions
- Write integration tests for API routes
- Create end-to-end tests for critical user flows

## Release Process

1. **Version Bump** - Version numbers follow [Semantic Versioning](https://semver.org/).
2. **Changelog Update** - Update the [CHANGELOG.md](./docs/CHANGELOG.md) with new changes.
3. **Release Branch** - Create a release branch from `main`.
4. **Testing** - Perform thorough testing on the release branch.
5. **Merge to Main** - Once approved, merge the release branch to `main`.
6. **Tag Release** - Tag the release with the version number.
7. **Deploy** - Deploy the release to production.

## License

By contributing to Ziruna, you agree that your contributions will be licensed under the same license as the project. 