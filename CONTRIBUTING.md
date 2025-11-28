# Contributing Guide

## Branch Workflow

This project uses a feature branch workflow for development.

### Quick Start

1. **Create a feature branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

3. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request on GitHub:**
   - Go to your repository on GitHub
   - Click "Compare & pull request"
   - Add a description of your changes
   - Request review if needed
   - Merge after approval

### Branch Naming Conventions

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-user-authentication`)
- `fix/` - Bug fixes (e.g., `fix/elevenlabs-api-error`)
- `refactor/` - Code refactoring (e.g., `refactor/api-routes`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Adding or updating tests (e.g., `test/api-endpoints`)

### Commit Message Format

Use conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add voice chat functionality
fix: resolve ElevenLabs API connection issue
docs: update deployment instructions
```

### Workflow for Different Types of Changes

#### Small Critical Fixes
For urgent production fixes, you can push directly to main:
```bash
git checkout main
git pull origin main
# Make your fix
git add .
git commit -m "fix: urgent production fix description"
git push origin main
```

#### New Features
Always use feature branches:
```bash
git checkout -b feature/new-feature-name
# Make changes
git commit -m "feat: add new feature"
git push origin feature/new-feature-name
# Create PR on GitHub
```

#### Bug Fixes
Use fix branches:
```bash
git checkout -b fix/bug-description
# Make changes
git commit -m "fix: resolve bug description"
git push origin fix/bug-description
# Create PR on GitHub
```

### Vercel Deployment

- **Main branch** → Automatically deploys to production
- **Feature branches** → Vercel creates preview deployments automatically
- Preview deployments allow you to test changes before merging to main

### Before Creating a PR

1. ✅ Make sure your code builds successfully: `npm run build`
2. ✅ Run linting: `npm run lint`
3. ✅ Test your changes locally
4. ✅ Update documentation if needed
5. ✅ Write a clear PR description

### Merging PRs

- Use "Squash and merge" for cleaner commit history
- Delete the branch after merging (GitHub option)
- Always pull latest main after merging: `git checkout main && git pull`

