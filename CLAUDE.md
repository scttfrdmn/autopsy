# CLAUDE.md

## Response Style
- Concise by default. No explanations unless asked.
- No file creation unless explicitly requested.
- Fix bugs silently unless cause is non-obvious.

## Development Workflow

### Planning Mode
**Use plan mode for non-trivial features** - Enter plan mode when:
- Feature spans multiple components or files
- Multiple valid implementation approaches exist
- Architectural decisions need to be made
- User requirements need clarification

**Plan mode process:**
1. Use `EnterPlanMode` tool to explore codebase
2. Launch Explore agents to understand existing patterns
3. Launch Plan agent to design implementation
4. Ask clarifying questions via `AskUserQuestion`
5. Write detailed plan to plan file
6. Use `ExitPlanMode` to get approval before implementing

### Issue Documentation
**Document plans as GitHub issues:**
- Create issue for each major feature/fix before starting
- Include clear scope, acceptance criteria, and tasks
- Link related issues and PRs
- Update issue with implementation notes as you work
- Close with summary comment when complete

**Create milestones for releases:**
- Group related issues under version milestones (e.g., v0.1.0)
- Track progress toward release goals
- Use milestone due dates to guide priorities

**Use labels consistently:**
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- `type:feature`, `type:bug`, `type:refactor`, `type:docs`, `type:test`
- `component:ui`, `component:background`, `component:storage`, `component:network`
- Create custom labels as needed for project-specific categories

## TypeScript Standards
- TypeScript 5.x with strict mode enabled
- Run `npm run build` to verify type checking
- No `any` types unless absolutely necessary
- Use proper interfaces/types for all data structures
- Prefer type inference where types are obvious

## Code Style
- Use descriptive variable names
- Prefer `const` over `let`; avoid `var`
- Arrow functions for callbacks
- Async/await over raw promises
- Early returns to avoid deep nesting

## Chrome Extension Patterns
- Manifest V3 structure
- Background service workers (not persistent background pages)
- Message passing between popup and background
- Proper permission declarations in manifest.json
- Handle suspended/resumed service worker lifecycle

## Testing
- Test builds before commits: `npm run build`
- Verify extension loads in `chrome://extensions/`
- Test all user interactions manually
- Check console for errors in popup and background contexts

## Security
- Never log sensitive tab data or URLs
- Validate all message passing data
- Sanitize user inputs
- Be careful with `<all_urls>` permission usage

## Git & GitHub
- Use `gh` CLI for all GitHub operations
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Branch naming: `feat/`, `fix/`, `refactor/` prefixes
- PR per feature/fix; link to issue

## Pre-commit Checks
- Run before every commit: `npm run build`
- Verify no TypeScript errors
- Test extension loads in Chrome

## Project Tracking
- Track all work via GitHub Issues
- Use GitHub Projects for planning/status
- Use Milestones for releases/versions
- Create labels as needed if no good existing match
- Close issues via commit message: `Fixes #123`

## Do Not
- Create README, docs, or configs unless asked
- Add dependencies without justification
- Use `any` type without reason
- Ignore TypeScript errors
- Add console.logs for debugging (remove after)
