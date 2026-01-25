---
inclusion: always
---

# Conventional Commits for git-cliff

## Overview

This project uses [git-cliff](https://git-cliff.org/) for automated changelog generation. All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification to ensure proper changelog formatting.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Feature
feat(parser): add ability to parse arrays
feat(cli): add support for --dry-run flag

# Bug fix
fix(parser): handle empty commit messages gracefully
fix(search): resolve crash when query is empty

# Breaking change (note the !)
feat!: change internal API to use async/await
refactor(core)!: change settings file format from JSON to TOML

# With body and footer
feat(auth): add OAuth2 support

Implement OAuth2 authentication flow with support for
multiple providers including GitHub and Google.

BREAKING CHANGE: Authentication configuration format has changed.
```

## Commit Types

### Primary Types (SemVer Impact)

- **feat**: New feature (correlates to SemVer **MINOR**)
  - `feat: add keyboard shortcut customization`
  - `feat(ui): add dark mode toggle`

- **fix**: Bug fix (correlates to SemVer **PATCH**)
  - `fix: resolve crash on startup`
  - `fix(search): handle empty results correctly`

- **feat!**, **fix!**, **refactor!**: Breaking change (correlates to SemVer **MAJOR**)
  - `feat!: change settings file format`
  - `refactor(core)!: redesign plugin API`

### Supporting Types

- **docs**: Documentation changes
  - `docs: update installation instructions`
  - `docs(api): add examples for authentication`

- **style**: Code style changes (formatting, whitespace)
  - `style: format code with rustfmt`
  - `style(ui): adjust button spacing`

- **refactor**: Code refactoring (no feature change or bug fix)
  - `refactor: simplify error handling logic`
  - `refactor(parser): extract validation into separate function`

- **perf**: Performance improvements
  - `perf: optimize search algorithm`
  - `perf(db): add index for faster queries`

- **test**: Adding or updating tests
  - `test: add property tests for parser`
  - `test(integration): add end-to-end tests`

- **chore**: Build process, dependencies, tooling
  - `chore: bump version to 0.2.0`
  - `chore(deps): update dependencies`

- **ci**: CI/CD changes
  - `ci: add automated release workflow`
  - `ci(github): update actions to v4`

- **revert**: Reverting previous commits
  - `revert: revert "feat: add feature X"`

## Scope (Optional)

Scopes provide additional context about what part of the codebase is affected:

```bash
feat(ui): add dark mode toggle
fix(search): handle empty results
refactor(core): simplify state management
test(integration): add Kubernetes client tests
```

Common scopes for this project:
- `ui` - User interface components
- `search` - Search functionality
- `k8s` - Kubernetes integration
- `settings` - Settings management
- `window` - Window management
- `shortcuts` - Keyboard shortcuts
- `core` - Core application logic
- `cli` - Command-line interface
- `api` - API changes

## Breaking Changes

Breaking changes MUST be indicated in one of two ways:

### 1. Using `!` after type/scope

```bash
feat!: change settings file format
fix(api)!: remove deprecated endpoints
refactor(core)!: redesign plugin system
```

### 2. Using `BREAKING CHANGE:` footer

```bash
feat: redesign authentication system

BREAKING CHANGE: Authentication configuration format has changed.
Users must migrate their config files to the new format.
```

## Body and Footer

### Body (Optional)

Provide additional context about the change:

```bash
feat(search): add fuzzy matching support

Implement fuzzy matching algorithm to improve search results
when users make typos or use partial matches. Uses Levenshtein
distance with configurable threshold.
```

### Footer (Optional)

Reference issues, pull requests, or note breaking changes:

```bash
fix(parser): handle malformed input gracefully

Fixes #123
Closes #456

BREAKING CHANGE: Parser now throws errors instead of returning null.
```

## What Gets Included in Changelog

Based on our `cliff.toml` configuration:

### ✅ Included
- `feat:` - Features section
- `fix:` - Bug Fixes section
- `docs:` - Documentation section
- `perf:` - Performance section
- `refactor:` - Refactor section
- `style:` - Styling section
- `test:` - Testing section
- `chore:` - Miscellaneous Tasks section
- `ci:` - Miscellaneous Tasks section
- `revert:` - Revert section

### ❌ Excluded (Filtered Out)
- `chore(release):` - Release preparation commits
- `chore(deps):` - Dependency updates
- `chore(pr):` - Pull request related chores
- `chore(pull):` - Pull request related chores
- Non-conventional commits (if `filter_unconventional = true`)

## Best Practices

### 1. Write Clear Descriptions
```bash
# ✅ Good
feat(search): add fuzzy matching for ingress names
fix(window): prevent crash when closing during refresh

# ❌ Bad
feat: stuff
fix: bug
```

### 2. Use Present Tense
```bash
# ✅ Good
feat: add feature
fix: resolve issue

# ❌ Bad
feat: added feature
fix: resolved issue
```

### 3. Keep First Line Under 72 Characters
```bash
# ✅ Good
feat(ui): add dark mode toggle with system preference detection

# ❌ Bad (too long)
feat(ui): add dark mode toggle that automatically detects system preferences and updates the theme accordingly
```

### 4. Use Scopes Consistently
```bash
# ✅ Good - Consistent scopes
feat(ui): add button
feat(ui): add modal
fix(ui): adjust spacing

# ❌ Bad - Inconsistent scopes
feat(ui): add button
feat(interface): add modal
fix(frontend): adjust spacing
```

### 5. Group Related Changes
```bash
# ✅ Good - Atomic commits
feat(search): add fuzzy matching
test(search): add fuzzy matching tests

# ❌ Bad - Unrelated changes in one commit
feat: add fuzzy matching and fix window bug and update docs
```

## Testing Your Commits Locally

Before pushing, preview what your commits will look like in the changelog:

```bash
# Install git-cliff
brew install git-cliff

# Preview unreleased changes
git cliff --unreleased --strip header

# Preview specific range
git cliff v0.1.0..HEAD
```

## AI Assistant Guidelines

When creating commits for this project:

1. **Always use conventional commit format**
2. **Choose appropriate type** (feat, fix, docs, etc.)
3. **Add scope when relevant** (ui, search, k8s, etc.)
4. **Mark breaking changes** with `!` or `BREAKING CHANGE:` footer
5. **Write clear, descriptive messages** in present tense
6. **Keep first line under 72 characters**
7. **Add body for complex changes** to provide context
8. **Reference issues** in footer when applicable

### Example Commit Workflow

```bash
# After implementing a feature
git add src/components/SearchInput.tsx
git commit -m "feat(search): add debounced search input

Implement search input with 150ms debounce to reduce
unnecessary API calls and improve performance."

# After fixing a bug
git add src/hooks/useIngresses.ts
git commit -m "fix(k8s): handle connection timeout gracefully

Add proper error handling for Kubernetes API timeouts
to prevent application crashes."

# After breaking change
git add src-tauri/src/settings/mod.rs
git commit -m "refactor(settings)!: migrate to TOML format

BREAKING CHANGE: Settings file format changed from JSON to TOML.
Users must manually migrate their settings or delete the old file."
```

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [git-cliff Documentation](https://git-cliff.org/)
- [Semantic Versioning](https://semver.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

## Summary

**Every commit message MUST follow this format:**

```
<type>[optional scope]: <description>
```

**Common types:** feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Breaking changes:** Add `!` after type/scope OR use `BREAKING CHANGE:` footer

**This ensures:** Automated, well-formatted changelogs for every release.
