# Stylyf Builder Visual Intent

## What

Stylyf Builder is an internal app studio for non-technical teammates. Its job is not to expose the stack. Its job is to let a teammate say, "I need a small useful app," then guide that idea into a visual, reviewable draft that a developer can later harden and deploy.

The interface should feel like a focused AI workroom:

- A calm dashboard where the user sees existing drafts and one obvious way to start a new one.
- A studio where chat feels primary, familiar, and forgiving, like ChatGPT.
- A live preview that is open by default because the app is judged visually, not by logs.
- Editor controls that are present but quiet: collapsible, labeled in product language, and only expanded when the user wants precision.
- Technical events, commits, screenshots, and agent details pushed into a review trail, not the main mental model.

## Why

Current AI app builders converge on the same user expectation: prompt first, see the app quickly, then refine visually. 2026 comparisons of Lovable, Bolt, v0, and similar tools consistently frame successful builders around fast prompt-to-working-app loops, live preview, code ownership, and progressive control rather than upfront configuration. The important warning is that capability alone is not enough; non-technical users need clarity, low decision load, and visible progress.

Dashboard and complex-tool UX guidance points in the same direction: show the primary task first, disclose advanced controls gradually, and avoid clutter that forces users to parse implementation state before they understand what to do. Progressive disclosure is especially relevant here: the app can be powerful underneath, but the visible surface should reveal complexity only when the user demonstrates intent.

The design therefore optimizes for momentum and trust:

- Momentum: the user should know the next action within three seconds.
- Trust: the user should always see what the builder is making.
- Control: deeper editing exists, but it should feel optional, not mandatory.
- Reviewability: developers still get artifacts, commits, and logs, but those belong in a secondary trail.

## How

### Dashboard

The dashboard should be a product lobby, not an admin panel.

- Primary headline: "Build a small app from an idea."
- Primary action: "Start new app."
- Existing projects: visual draft cards with status, last preview, and "Continue."
- Empty state: examples of what can be built, written in plain language.
- Hidden by default: workspace paths, repo names, command names, schema terms, "IR", "Webknife", and deployment mechanics.

### Studio

The studio should use a three-zone composition:

- Left: Chat rail. Familiar conversation rhythm, message bubbles, sticky prompt box, suggested next prompts, no database jargon.
- Center: Live preview. Open by default, visually dominant, framed like a browser/device canvas, with clear loading and empty states.
- Right: Collapsible controls. "App outline", "Screens", "Data to track", "Style", "Review trail". Each section is optional and plain-English.

The first visible screen should answer:

- What app am I building?
- What should I ask next?
- What does it currently look like?
- Where do I refine details if chat is too vague?

### Theme

The visual language should be professional, quiet, and editorial, not toy-like.

- Palette: warm ivory background, charcoal text, restrained coral action color, soft blue-green support accents, deep ink for focused rails.
- Typography: large confident headings, readable body copy, compact labels only for navigation and status.
- Shape: low radii and crisp panels; avoid pill overload.
- Density: generous enough to feel calm, but not sparse enough to waste the workspace.
- Motion: minimal. Use state transitions for panels, previews, and generation progress, not decorative animation.

### Interaction Rules

- One major primary action per view.
- Chat is the default path; controls are precision tools.
- Preview stays visible by default.
- Technical state is translated into user state: "Checking outline", "Building draft", "Opening preview", "Taking screenshot", "Ready for review."
- Any code, command, or repo language must be behind an advanced/review section.

## Web Context Used

- AI app-builder landscape and user expectations: https://designrevision.com/blog/ai-app-builders
- 2026 builder tradeoffs across Lovable, Bolt, v0, Cursor, and similar tools: https://tessellatelabs.com/knowledge/best-ai-builder-in-2026
- Dashboard clarity and progressive disclosure guidance: https://www.uxpin.com/studio/blog/dashboard-design-principles/
- Progressive disclosure principle for complex tools: https://www.uxgroundwork.com/learn/ux-design-principles/progressive-disclosure
- Chat-only limitations and the need for hybrid chat plus visual/state surfaces: https://arxiv.org/abs/2602.00947
