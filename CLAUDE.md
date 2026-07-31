# CLAUDE.md

This file provides guidance for AI assistants (such as Claude) working in this repository.

## Repository Overview

- **Repository**: Luciano-rep
- **Owner**: lucianogonelli-design
- **Status**: Hosts the institutional website (single-page site) for **Bazar São Benedito** (Bazar SB), a family-run clothing, footwear and variety store in Boituva/SP.

## Project Structure

Static site — plain HTML/CSS/JS, no build step or dependencies. The site lives
under `bazar/`.

```
/
├── bazar/
│   ├── index.html      # Whole page: markup + inline <style> + inline <script>
│   └── assets/
│       ├── logo-branco.png     # logo for dark backgrounds
│       ├── logo-escura.png     # logo for light backgrounds
│       ├── icone.png / favicon.png
│       ├── fachada-historica.jpg
│       ├── fachada-atual.jpg
│       └── loja-interior.jpg
├── README.md           # How to view/publish/edit the site (pt-BR)
└── CLAUDE.md           # AI assistant guidance (this file)
```

### Conventions

- **Language**: All user-facing copy is in Brazilian Portuguese (`pt-BR`).
- **Brand palette (official)**: golden yellow `#FFCC00` + grey `#B3B3B3`, with
  charcoal `#1C1C1C` and white as support. Fonts: *Quicksand* + *Inter*.
- **Logo**: use `logo-branco.png` on dark surfaces and `logo-escura.png` on light
  ones — do not recolor the wordmark.
- **Contact**: WhatsApp `(15) 99701-3188` (wa.me/5515997013188), phone
  `(15) 3263-1030`.
- **Editable placeholders**: opening hours are marked with `<!-- TODO -->` in
  `bazar/index.html` and should be confirmed with the owner.

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
