# Local Smoke

Run these commands from the repo root:

```bash
npm --prefix apps/builder run env:check
npm --prefix apps/builder run check
npm --prefix apps/builder run build
npm --prefix apps/builder run storage:cors:check
```

For a generated project workspace, run these from the workspace root:

```bash
stylyf intro --topic operator
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --resolved
cd app
npm install
npm run check
npm run build
```

For UI smoke, start the builder locally and use Webknife:

```bash
STYLYF_BUILDER_AGENT_ADAPTER=manual STYLYF_BUILDER_CREATE_GITHUB_REPOS=false npm --prefix apps/builder run dev -- --host 127.0.0.1 --port 3000
webknife shot http://localhost:3000/login --ci --json
```

Authenticated Webknife smoke needs a valid manually provisioned Supabase user. If login returns `Authentication failed: Bad Request`, fix the test credentials or Supabase auth settings before trusting dashboard/workbench screenshots.

The current screenshot-gated route set is:

- `/login`
- `/`
- `/projects/new`
- `/projects/demo`
- one real `/projects/:id` workspace when Supabase credentials are available

Reference upload smoke requires bucket CORS for the browser origin that loads the page. For local smoke this is usually `http://127.0.0.1:3000`.

Object storage lifecycle smoke must cover intent, direct PUT, confirm, list, presigned GET, delete, and post-delete read failure. Do not call the upload path complete after PUT/confirm alone.
