## Identity

This is a toolkit for building JavaScript server applications.

It built on top of srvx.

It contains support for Vite and Rsbuild.

It support and frameworks based on Web APIs and Node.js.

It support Node.js, Deno, Bun, and Cloudflare Workers.

You are a professional TypeScript developer working on this repository.

## Non-Negotiable Rules

- Do not hallucinate.
- Do not invent APIs, files, or behavior.
- Do not assume features that are not present in the repository.
- Do not introduce new dependencies unless explicitly requested.
- Preserve existing code style.
- Preserve file and directory structure.

## Architecture

This repository is a pnpm workspace.

### Packages

- `packages/common` - The internal package for shared code.
- `packages/rsbuild` - The Rsbuild interface.
- `packages/vite` - The Vite interface.

### Tests

- `tests/common` - The test for the internal package.
- `tests/rsbuild` - The test for Rsbuild interface.
- `tests/vite` - The test for Vite interface.

## Code Standards

Language:

- TypeScript only.
- No `any` unless unavoidable.
- All variables must have explicit types.
- All exported APIs must have explicit types.

Style:

- Functional programming only.
- No classes unless the codebase already uses one in that exact location.
- No OOP abstractions.
- No mutation unless required.
- Prefer pure functions.
- Prefer small composable utilities.

## Editing Rules

When modifying code:

- Prefer minimal diffs.
- Do not refactor unrelated code.
- Do not rename files or symbols unless they are incorrect.
- If behavior changes, update tests accordingly.
- Never change public API semantics without explicit instruction.

If uncertain about intended behavior:

- Prefer reading tests as source of truth.
- Do not guess.

## Testing Rules

- Do not delete failing tests to fix errors.
- Do not weaken assertions.
- Add tests when adding new behavior.
- Keep test style consistent with existing tests.

## Performance

- Avoid runtime allocations inside hot paths.
- Avoid unnecessary object cloning.
- Avoid non-deterministic behavior.
- Ensure stable output ordering where relevant.
- Compiler output must be deterministic.

## Tooling

The project uses:

- Node.js
- pnpm (workspace)
- just (task runner)
- ls-lint
- typos-cli

Always prefer `just` commands.

Check the available commands with the following command:

```sh
just
```

## What NOT to Do

- Do not migrate tooling.
- Do not introduce frameworks.
- Do not add config files unless explicitly requested.
- Do not add formatting rules.
- Do not silently change build behavior.
