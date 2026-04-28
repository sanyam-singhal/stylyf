# Builder Operations

`apps/builder` is the internal Stylyf app factory for Depths AI operators. It is not a no-code runtime and it does not deploy generated apps. It produces ordinary generated app repositories for dev review.

## Operator Flow

1. Sign in with the manually onboarded Supabase email/password account.
2. Create a project with a concise product brief.
3. Use the friendly IR panes to shape app kind, theme, data object, routes, and fields.
4. Save the active IR draft.
5. Run Stylyf validation, planning, and generation from the project workbench.
6. Start the local preview when generation succeeds.
7. Run Webknife screenshots against the preview.
8. Send iteration prompts through the agent chat.
9. Approve sensitive requests deliberately before execution.
10. Commit and push accepted iterations for dev-team review.

## Workspaces

Development defaults to `.stylyf-builder/`. Production should set:

```bash
STYLYF_BUILDER_ROOT=/var/lib/stylyf-builder
```

Each project workspace contains:

- `app/`: generated standalone app source
- `specs/`: active Stylyf specs
- `logs/`: redacted command output
- `.webknife/`: visual QA artifacts
- `handoff.md`: dev-review handoff notes
- `repo.json`: generated repository metadata when GitHub is configured

## Git Lifecycle

Accepted iterations should be committed immediately. If `GITHUB_TOKEN` and `GITHUB_ORG` are configured, the builder creates or uses a private org repo and pushes after each accepted commit. Without GitHub credentials, commits remain local and the timeline records the missing push.

Never squash internal work history by default.

## Failure Recovery

- If Stylyf validation fails, inspect the command stderr path in the workbench timeline.
- If preview startup fails, confirm generation completed and dependencies installed.
- If Webknife fails, verify the preview URL is reachable from the VPS.
- If git commit fails, inspect command logs and run `git status` inside the generated app workspace.
- If live `stylyf.com` fails, use `journalctl -u stylyf --no-pager -n 100`.

## Deployment Boundary

`stylyf.com` deploys the builder control plane only. Generated apps are handed to the dev team as repos. The dev team chooses the deployment target per generated app.
