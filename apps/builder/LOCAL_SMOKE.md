# Local Smoke

Run these commands from the builder app root:

```bash
npm run env:check
npm run check
npm run build
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
npm run builder:dev
webknife shot http://localhost:3000/login --ci --json
```

Authenticated Webknife smoke needs a valid manually provisioned Supabase user. If login returns `Authentication failed: Bad Request`, fix the test credentials or Supabase auth settings before trusting dashboard/workbench screenshots.
