# Change Review Playbook

Quick checklist for reviewing recent changes in this repo (use from project root `emr-ai/`). Keep PHI out of logs and screenshots.

## 1) Inspect git state
- `git status -sb` — see local changes
- `git log --oneline -n 5` — recent commits
- `git show --stat <commit>` — scope of last change

## 2) Diff and context
- `git diff` — unstaged changes
- `git diff --cached` — staged changes
- `git show <commit>` — full patch for a commit

## 3) Hotspots to verify
- Auth/middleware: `src/lib/auth.ts`, `src/middleware.ts`
- HIPAA modules: `src/lib/hipaa/*`
- API routes: `src/app/api/**`
- DB schema: `prisma/schema.prisma`
- Docs/Env: `README.md`, `.env.local`, `docs/**`

## 4) Run checks (when write access available)
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test` (or `pnpm test --watch` during dev)
- E2E (if Playwright configured): `pnpm exec playwright test`

## 5) Compliance reminders
- No real PHI in commits, logs, or screenshots
- Validate HIPAA config before prod: env keys, MFA provider, encryption provider, audit backend
- Ensure audit + PHI tracking wrappers are applied to API routes touching patient data

## 6) Summarize findings
- List issues by severity with file:line references
- Note residual risks and missing tests
- Suggest next actions (fixes, tests, config updates)
