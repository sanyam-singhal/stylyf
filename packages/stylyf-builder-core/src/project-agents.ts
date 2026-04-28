export type ProjectAgentsInput = {
  projectName: string;
};

export function renderProjectAgentsMarkdown(input: ProjectAgentsInput) {
  return `# AGENTS

## Mission

You are operating inside a Stylyf Builder project workspace for "${input.projectName}".

Create a standalone SolidStart app in \`app/\` while keeping the app structure reproducible through explicit Stylyf IR in \`specs/\`. Stylyf CLI is the assembly line. Raw source editing is the fallback, not the default.

## Tool Assumptions

The builder host should provide current global tools:

\`\`\`bash
npm i -g @depths/stylyf-cli@latest @depths/webknife@latest @openai/codex@latest
stylyf --version
webknife --help
codex --version
gh auth status
\`\`\`

If a tool is missing, report it clearly before changing source.

## Hard Rules

- Use Stylyf CLI before raw source edits whenever the request can be expressed through app kind, backend, media, experience, objects, flows, surfaces, routes, sections, APIs, server modules, fixtures, or deployment metadata.
- Prefer editing JSON spec chunks under \`specs/\`, then run \`stylyf compose\`, \`stylyf validate\`, \`stylyf plan\`, and \`stylyf generate\`.
- Use \`stylyf search\` and \`stylyf inspect\` before selecting components or patterns.
- Only hand-edit generated source when Stylyf cannot express the requested behavior, when emitted code is faulty, or when final product polish is needed after IR generation.
- Before every hand edit, add a note to \`handoff.md\` explaining why the Stylyf IR path was insufficient.
- Use Webknife for visual validation and interaction checks. Do not claim UI quality without screenshot or interaction artifacts.
- Keep media assets in object storage via presigned URL flows. Do not store variable-sized blobs in Postgres.
- Commit accepted progress and push immediately when the builder asks for handoff.

## Preferred Stylyf-First Loop

1. Inspect the user request and current specs.
2. Refresh operating context if needed:

\`\`\`bash
stylyf intro --topic operator
stylyf intro --topic composition
stylyf intro --topic ui
stylyf intro --topic backend
\`\`\`

3. Search before composing:

\`\`\`bash
stylyf search "<intent>" --limit 8
stylyf inspect component <component-id>
\`\`\`

4. Edit or add explicit chunks under \`specs/\`. Keep chunks small and named after their purpose, for example:

\`\`\`txt
specs/base.json
specs/style.chunk.json
specs/routes.chunk.json
specs/data.chunk.json
specs/api.chunk.json
specs/media.chunk.json
\`\`\`

5. Compose and validate:

\`\`\`bash
stylyf compose --base specs/base.json --with specs/*.chunk.json --output stylyf.spec.json
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --resolved
\`\`\`

6. Generate or refresh the app:

\`\`\`bash
stylyf generate --spec stylyf.spec.json --target app
\`\`\`

7. Validate the generated app:

\`\`\`bash
cd app
npm run check
npm run build
\`\`\`

8. Use Webknife against the preview URL:

\`\`\`bash
webknife shot http://localhost:<port> --ci --json
webknife interact http://localhost:<port> --steps ../specs/webknife.steps.yaml --ci --json
webknife ui:review --url http://localhost:<port>
\`\`\`

9. If acceptable, commit and push:

\`\`\`bash
git status --short
git add .
git commit -m "<clear iteration summary>"
git push
\`\`\`

## Codex Session Expectations

- New project sessions are started by the builder in this workspace.
- Existing project sessions may be resumed by the builder.
- Stay within this project workspace unless explicitly instructed.
- Do not alter builder host state, global auth, or unrelated repositories.
- Do not print secret values. You may mention missing env key names.

## Workspace Map

- \`AGENTS.md\`: this operating contract.
- \`specs/\`: source-owned Stylyf IR chunks and interaction scripts.
- \`stylyf.spec.json\`: composed active spec.
- \`app/\`: generated standalone SolidStart app.
- \`logs/\`: command logs.
- \`screenshots/\`: selected visual artifacts.
- \`.webknife/\`: Webknife artifacts.
- \`handoff.md\`: decisions, hand-edit reasons, and human review notes.
`;
}
