# Git-Cliff Changelog Generation

This project uses [git-cliff](https://git-cliff.org/) to automatically generate changelogs for GitHub releases.

## How It Works

When you push a version tag (e.g., `v0.2.0`), the CI pipeline:

1. Builds the application
2. Generates a changelog using git-cliff based on conventional commits
3. Creates a GitHub release with the generated changelog
4. Attaches DMG files and checksums to the release

## Conventional Commits

Git-cliff parses commits following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

The following commit types are recognized and grouped in the changelog:

- **feat**: 🚀 Features - New features
- **fix**: 🐛 Bug Fixes - Bug fixes
- **docs**: 📚 Documentation - Documentation changes
- **perf**: ⚡ Performance - Performance improvements
- **refactor**: 🚜 Refactor - Code refactoring
- **style**: 🎨 Styling - Code style changes
- **test**: 🧪 Testing - Test additions or changes
- **chore**: ⚙️ Miscellaneous Tasks - Build process, dependencies, etc.
- **ci**: ⚙️ Miscellaneous Tasks - CI/CD changes
- **revert**: ◀️ Revert - Reverted changes

### Examples

```bash
# Feature
git commit -m "feat: add keyboard shortcut customization"
git commit -m "feat(ui): add dark mode toggle"

# Bug fix
git commit -m "fix: resolve crash on startup"
git commit -m "fix(search): handle empty search results"

# Breaking change
git commit -m "feat!: change settings file format"
# or
git commit -m "feat: change settings file format

BREAKING CHANGE: Settings file format has changed from JSON to TOML"

# Documentation
git commit -m "docs: update installation instructions"

# Chore (skipped in changelog if it's deps/pr related)
git commit -m "chore: bump version to 0.2.0"
git commit -m "chore(deps): update dependencies"
```

## Configuration

The changelog generation is configured in `cliff.toml`:

- **Commit parsing**: Conventional commits are parsed and grouped by type
- **Filtering**: Non-conventional commits and certain chore commits are filtered out
- **Formatting**: Changelog is formatted with emojis and sections
- **Breaking changes**: Breaking changes are highlighted with `[**breaking**]`

## Testing Locally

You can test changelog generation locally:

### Install git-cliff

```bash
# macOS
brew install git-cliff

# Or using cargo
cargo install git-cliff
```

### Generate changelog

```bash
# Generate changelog for the latest tag
git cliff --latest

# Generate changelog for a specific tag range
git cliff v0.1.0..v0.2.0

# Generate full changelog
git cliff

# Output to file
git cliff --output CHANGELOG.md
```

### Preview next release

```bash
# See what the next release notes would look like
git cliff --unreleased --strip header
```

## Changelog Format

The generated changelog follows this format:

```markdown
## [0.2.0] - 2024-01-25

### 🚀 Features
- *(ui)* Add dark mode toggle
- Add keyboard shortcut customization

### 🐛 Bug Fixes
- *(search)* Handle empty search results
- Resolve crash on startup

### 📚 Documentation
- Update installation instructions

### ⚙️ Miscellaneous Tasks
- Bump version to 0.2.0
```

## Best Practices

1. **Use conventional commits**: Always follow the conventional commit format
2. **Write clear descriptions**: Make commit messages descriptive and user-friendly
3. **Use scopes**: Add scopes to provide context (e.g., `feat(ui):`, `fix(search):`)
4. **Mark breaking changes**: Use `!` or `BREAKING CHANGE:` footer for breaking changes
5. **Group related changes**: Make atomic commits for related changes
6. **Review before release**: Check the generated changelog before publishing

## Skipped Commits

The following commits are automatically skipped in the changelog:

- `chore(release):` - Release preparation commits
- `chore(deps):` - Dependency updates
- `chore(pr):` - Pull request related chores
- `chore(pull):` - Pull request related chores

## CI Integration

The GitHub Actions workflow (`.github/workflows/release.yml`) includes:

```yaml
- name: Generate changelog with git-cliff
  uses: orhun/git-cliff-action@v4
  id: git-cliff
  with:
    config: cliff.toml
    args: --verbose --latest --strip header
  env:
    OUTPUT: CHANGELOG.md
    GITHUB_REPO: ${{ github.repository }}

- name: Upload to release
  uses: softprops/action-gh-release@v1
  with:
    body: ${{ steps.git-cliff.outputs.content }}
```

## Resources

- [git-cliff Documentation](https://git-cliff.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [git-cliff GitHub Action](https://github.com/orhun/git-cliff-action)
- [Configuration Examples](https://git-cliff.org/docs/usage/examples)
