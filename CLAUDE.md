# CLAUDE.md

This file provides guidance for AI assistants (such as Claude) working in this repository.

## Repository Overview

- **Repository**: Luciano-rep
- **Owner**: lucianogonelli-design
- **Status**: New repository — project scaffolding and initial codebase are being established.

## Project Structure

```
/
├── CLAUDE.md              # AI assistant guidance (this file)
├── skills/                # Claude skills collection (see skills/README.md)
│   └── viral-scripts/     # Short-form video script skill (SKILL.md)
├── index.html             # Workshop landing page
├── css/                   # Landing page styles
└── js/                    # Landing page scripts
```

## Skills

This repository doubles as a collection of custom Claude skills under `skills/`.

- Each skill lives in `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) followed by the instructions Claude executes when the skill triggers.
- The directory name must match the skill's `name`.
- To install a skill in Claude Code, copy its folder into `~/.claude/skills/` (personal) or a project's `.claude/skills/`. See `skills/README.md` for details.

## Development Workflow

### Branch Strategy

- **Main branch**: `main` (or `master` — confirm once the first commit establishes it)
- **Feature branches**: Use the `claude/<description>-<id>` naming convention for AI-assisted work
- Always develop on feature branches, never commit directly to the main branch
- Open pull requests for review before merging

### Commits

- Write clear, descriptive commit messages
- Use imperative mood in the subject line (e.g., "Add feature" not "Added feature")
- Keep the subject line under 72 characters
- Add a blank line between the subject and body when a longer explanation is needed

### Getting Started

Once the project is scaffolded, document here:
1. Installation steps (dependencies, environment setup)
2. How to run the project locally
3. How to run tests
4. How to run linting/formatting

## Code Conventions

As the codebase is established, document the following here:
- Programming language(s) and version(s)
- Framework(s) and key libraries
- Code style and formatting rules (linter/formatter configs)
- Naming conventions (files, variables, functions, classes)
- Import ordering conventions
- Error handling patterns

## Testing

Document the testing approach once established:
- Test framework and runner
- Test file naming and location conventions
- How to run the full test suite
- How to run individual tests
- Minimum coverage requirements (if any)

## Key Guidelines for AI Assistants

1. **Read before editing** — Always read a file before proposing changes to it.
2. **Minimal changes** — Only make changes that are directly requested or clearly necessary. Avoid over-engineering.
3. **No guessing** — If something is unclear, investigate the codebase or ask rather than assuming.
4. **Security first** — Never introduce credentials, secrets, or sensitive data into the repository. Avoid common vulnerabilities (injection, XSS, etc.).
5. **Test your changes** — Run the project's test suite after making changes, when a test suite exists.
6. **Respect existing patterns** — Follow the conventions already established in the codebase rather than introducing new ones.
7. **Keep this file updated** — When adding significant new infrastructure (build tools, testing frameworks, CI/CD), update this CLAUDE.md accordingly.
