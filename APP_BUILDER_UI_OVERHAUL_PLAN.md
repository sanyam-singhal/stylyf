# Stylyf Builder UI Overhaul Plan

## Canonical Visual References

The generated moodboards are now part of the repo and are the visual target for the overhaul:

- `apps/builder/design/moodboards/builder-dashboard-reference.png`
- `apps/builder/design/moodboards/builder-studio-reference.png`
- `apps/builder/design/moodboards/builder-workbench-reference.png`

These images capture the intended product: a calm internal AI app studio, not an admin dashboard and not a technical control panel.

## Non-Negotiable Product Direction

- The app is for non-technical teammates.
- The user should never need to understand SolidStart, Stylyf IR, Webknife, Git, routes, schemas, workspaces, CLI commands, or deployment to use the builder.
- Chat is the primary authoring path.
- Live preview is open by default and visually dominant.
- Editor controls are secondary, clean, collapsible, and plain-English.
- Technical details exist only in the review/handoff trail.
- We will not keep incrementally patching the current layout. The route UI should be rewritten from first principles while preserving backend/server action logic.

## Current State To Discard

The current scratch UI work made useful backend smoke progress but failed visually:

- Dashboard still reads like a generated scaffold plus sidebar.
- Studio still has dashboard/menu gravity instead of builder gravity.
- The page hierarchy is tall and scroll-heavy instead of workspace-like.
- The language still leaks implementation framing.
- The live preview is not the center of the experience.
- The chat does not feel like ChatGPT.

The next implementation should replace the route composition rather than trying to rescue the existing layout.

## Visual System

### Theme

- Background: warm ivory canvas with subtle radial warmth.
- Text: deep charcoal, high contrast, editorial weight.
- Primary action: restrained coral.
- Support accents: blue-green and quiet teal.
- Focus rail: deep ink, used sparingly.
- Radii: low and crisp. Avoid childish pills except for tiny status chips.
- Shadows: soft but disciplined; panels should feel layered, not floating randomly.

### Components To Add Locally For Builder App

Keep these builder-specific primitives small and disciplined inside `apps/builder/src/app.css` and route-local JSX:

- `builder-product-shell`: full-height app frame.
- `builder-mini-rail`: narrow navigation/product rail, not a full dashboard sidebar.
- `builder-dashboard-hero`: dashboard intent panel.
- `builder-draft-card`: visual project card with preview/status/action.
- `builder-studio-shell`: three-pane studio grid.
- `builder-chat-pane`: ChatGPT-like message surface and sticky composer.
- `builder-preview-pane`: dominant preview/browser canvas.
- `builder-control-rail`: right collapsible editor stack.
- `builder-control-section`: reusable collapsible section.
- `builder-review-trail`: secondary technical/review timeline.

Do not sprawl one-off styles for every tiny element. Prefer a compact set of named primitives plus existing token variables.

## Route Architecture

### `/login`

Keep the current login structure mostly intact unless it clashes with the new app shell.

Goals:

- Professional internal entry point.
- No unnecessary app-builder complexity.
- Clear email/password form.

### `/`

Dashboard must become a calm app lobby.

Visible structure:

- Thin product rail on the left.
- Large hero: "Build a useful app from an idea."
- Primary CTA: "Start new app."
- Three plain examples: "Rating site", "Review queue", "Content directory" or similar.
- Existing drafts as cards, not a table.
- Each card shows:
  - app name
  - short plain-language brief or "Needs a brief"
  - preview thumbnail placeholder/status
  - status in user language: "Draft", "Preview ready", "Needs review"
  - action: "Continue"

Hidden from primary dashboard:

- workspace path
- repo name
- raw status internals
- command counts
- technical tool names

### `/projects/new`

Create should remain one-field.

Visible structure:

- Minimal shell.
- Prompt: "Name your app draft."
- Single field: project name.
- Button: "Create app draft."
- Side panel with examples of good names, not backend lifecycle promises.

Server behavior stays unchanged:

- derive slug
- create Supabase row
- bootstrap workspace
- write `AGENTS.md`
- local git bootstrap
- optional GitHub disabled in local smoke

### `/projects/:id`

Studio must become the core product.

Desktop structure:

- No dashboard sidebar dominating the screen.
- Optional narrow mini rail or compact top bar only.
- Three-pane layout:
  - Left: chat pane, around 28-32% width.
  - Center: live preview pane, dominant and open by default.
  - Right: collapsible controls rail, around 18-22% width.

Chat pane:

- Header: app name and simple status.
- Conversation-style bubbles:
  - welcome/helper bubble if no messages
  - latest prompt/event summaries from `agent_events`
  - pending/result messages from submissions
- Sticky composer at bottom.
- Suggested prompt chips:
  - "Make the homepage clearer"
  - "Add a review queue"
  - "Improve the visual style"
  - "Show me the next draft"
- Submitting chat still calls `sendAgentPrompt`.

Preview pane:

- Open by default.
- If no generated app/preview yet, show a polished empty preview state with:
  - "No preview yet"
  - "Build the first draft to see it here"
  - button group: "Check outline", "Build draft", "Open preview"
- If preview exists, show iframe inside browser chrome.
- Preview controls are human-labeled:
  - "Build draft" -> `runStylyfProjectStep(generate)`
  - "Open preview" -> `startProjectPreview`
  - "Take screenshot" -> `runWebknifeScreenshot`
  - "Review polish" -> `runWebknifeUiReview`
- Internal step outputs should be translated into human messages.

Control rail:

- Collapsible sections:
  - App outline
  - Screens
  - Things to track
  - Visual style
  - Review trail
- The advanced JSON/spec editor should be collapsed by default and renamed "Advanced blueprint JSON".
- Save action label: "Save outline".
- The rail writes through `saveIrDraft`.

Review trail:

- Secondary section.
- Shows screenshots, checks, commits, and handoff checkpoints.
- Uses human labels first.
- Technical command details are nested behind "Advanced details."

## Backend Alignment

Preserve the current working backend seams:

- Supabase auth and RLS-backed project records.
- `createBuilderProject`.
- `saveIrDraft`.
- `runStylyfProjectStep`.
- `sendAgentPrompt`.
- `startProjectPreview` / `stopProjectPreview`.
- `runWebknifeScreenshot` / `runWebknifeUiReview`.
- `commitAndPushProject`.

Do not rework backend logic during the visual overhaul unless a UI flow exposes a real backend bug.

## Testing Path

Use the `AGENTS.md` authenticated UI flow:

1. Start local builder on `localhost:3000`.
2. Set:
   - `STYLYF_BUILDER_AGENT_ADAPTER=manual`
   - `STYLYF_BUILDER_CREATE_GITHUB_REPOS=false`
3. Seed authenticated browser context by calling:
   - `POST http://localhost:3000/api/auth/sign-in/password`
4. Add the returned Supabase auth cookie to Playwright/Webknife context.
5. Go directly to:
   - `/`
   - `/projects/new`
   - `/projects/:id`
6. Screenshot:
   - dashboard top
   - dashboard draft cards
   - create form
   - studio top
   - chat + preview
   - controls rail
   - review trail
7. Inspect screenshots before declaring success.

Do not repeatedly test login unless auth itself is the task.

## Commit Plan

### Commit 1: Visual intent and references

- Add intent doc.
- Store moodboards in repo.
- Add this overhaul plan.

### Commit 2: Builder shell and CSS primitives

- Add disciplined builder-specific shell classes.
- Replace large scaffold sidebar with compact mini rail/top product frame for builder pages.
- Keep CSS token-driven and limited.
- Validate: `npm run builder:check`.

### Commit 3: Dashboard rewrite

- Rewrite `/` into the calm app lobby.
- Remove technical dashboard language.
- Convert project list to visual draft cards.
- Screenshot dashboard via authenticated cookie flow.

### Commit 4: Create route rewrite

- Rewrite `/projects/new` as a one-field app draft flow.
- Keep create action unchanged.
- Screenshot create route.

### Commit 5: Studio rewrite

- Rewrite `/projects/:id` into three-pane studio:
  - Chat pane
  - Preview pane
  - Collapsible controls rail
- Preserve server actions.
- Screenshot top and mid-page.

### Commit 6: Review trail and interaction polish

- Make review/handoff secondary and human-readable.
- Add advanced technical details only inside collapsed panels.
- Verify buttons map to the correct server actions.
- Screenshot after interactions.

### Commit 7: End-to-end validation checkpoint

- Run `npm run builder:check`.
- Run `npm run builder:build`.
- Run authenticated screenshot flow.
- Update `ISSUES.md` only if real scaffold/backend defects are discovered.
