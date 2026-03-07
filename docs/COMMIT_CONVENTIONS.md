# Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Code style (formatting, no logic change) |
| refactor | Code refactoring |
| perf | Performance improvement |
| test | Adding/updating tests |
| chore | Build process, dependencies |
| ci | CI/CD changes |
| revert | Reverting changes |

## Scopes

- auth - Authentication & authorization
- user - User management
- profile - User profiles
- connection - Network connections
- marketplace - Marketplace features
- finance - Islamic finance tools
- trust - Trust scores & verification
- notification - Notifications
- api - API endpoints
- db - Database changes
- deps - Dependencies
- config - Configuration

## Examples

```
feat(auth): add JWT token refresh

fix(profile): resolve trust score display issue

docs(api): update authentication documentation

test(connection): add unit tests for acceptRequest

refactor(finance): split IslamicFinanceService into domain services
```

## Commit Message Template

```
# <type>(<scope>): <subject>
# 
# [Explain what changed and why]
#
# [Reference issues: Fixes #123, Closes #456]
```
