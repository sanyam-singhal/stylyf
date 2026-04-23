import { Title } from "@solidjs/meta";
import { ArrowRight, Boxes, Database, GitBranch, HardDriveUpload, Route, ShieldCheck, Sparkles, TerminalSquare } from "lucide-solid";

const repoUrl = "https://github.com/Depths-AI/stylyf";
const npmUrl = "https://www.npmjs.com/package/@depths/stylyf-cli";

const capabilityCards = [
  {
    icon: Boxes,
    eyebrow: "Frontend assembly",
    title: "Shells, routes, layouts, and copied UI inventory",
    body: "Generate SolidStart structure from a shallow JSON IR instead of hand-writing the same scaffolding every time.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Portable backend path",
    title: "Better Auth + Drizzle + Postgres or SQLite/libsql",
    body: "Use the provider-agnostic branch when you want long-term control, local SQLite smoke tests, or explicit schema ownership.",
  },
  {
    icon: Database,
    eyebrow: "Hosted backend path",
    title: "Supabase auth + data, with Tigris-backed object storage",
    body: "Use the faster hosted branch when you want the shortest route from scaffold to deployment.",
  },
  {
    icon: HardDriveUpload,
    eyebrow: "Storage substrate",
    title: "Presigned upload flows over S3-compatible storage",
    body: "Generated apps keep raw bucket credentials on the server and hand browsers only short-lived presigned URLs.",
  },
];

const deliveryPoints = [
  "Generated apps are standalone checked-in SolidStart source trees.",
  "Generated apps do not import this repo or the Stylyf CLI at runtime.",
  "The same CLI can be reused for first-pass scaffolding and iterative product work.",
];

export default function Home() {
  return (
    <main>
      <Title>Stylyf | Full-stack SolidStart assembly line</Title>

      <section class="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:px-8 lg:py-16">
        <div class="ui-shell relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_38%,color-mix(in_oklab,var(--secondary)_12%,transparent))]" />
          <div class="relative">
            <div class="ui-pillbar inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles class="size-3.5" />
              <span>CLI-first monorepo</span>
            </div>

            <h1 class="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              Stylyf turns repeatable SolidStart app setup into an assembly line.
            </h1>

            <p class="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              It is designed for coding agents and teams who want to start from a serious full-stack baseline: routed
              UI shells, copied SolidJS components, backend wiring, auth, data access, storage helpers, and explicit
              source files ready for normal iterative development.
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-xl)] bg-foreground px-5 text-sm font-medium text-background shadow-soft transition hover:opacity-92"
              >
                <GitBranch class="size-4" />
                <span>View GitHub repo</span>
              </a>
              <a
                href={npmUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-soft transition hover:border-primary/40"
              >
                <PackageBadge />
                <span>Open npm package</span>
              </a>
            </div>

            <div class="mt-8 grid gap-3 sm:grid-cols-3">
              <StatTile label="Current package" value="@depths/stylyf-cli" hint="Published on npm" />
              <StatTile label="Generated contract" value="Standalone source" hint="No runtime CLI dependency" />
              <StatTile label="Primary stack" value="SolidStart v1" hint="JSON-driven app generation" />
            </div>
          </div>
        </div>

        <aside class="ui-shell-muted grid content-start gap-4 p-5 sm:p-6">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">What ships</div>
            <ul class="mt-4 space-y-3 text-sm leading-6 text-foreground">
              <li>App shell, page shell, layout wrappers, routes, and global styling.</li>
              <li>Copied source-owned SolidJS components and composition-ready UI surfaces.</li>
              <li>Backend wiring for either portable or hosted full-stack delivery.</li>
              <li>Typed environment contracts, API routes, and server modules.</li>
            </ul>
          </div>

          <div class="ui-demo-inset">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Install</div>
            <pre class="ui-code mt-3 overflow-x-auto px-4 py-4 text-[12px] leading-6"><code>npm install -g @depths/stylyf-cli</code></pre>
          </div>

          <div class="ui-demo-inset">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">First command</div>
            <pre class="ui-code mt-3 overflow-x-auto px-4 py-4 text-[12px] leading-6"><code>stylyf intro</code></pre>
          </div>
        </aside>
      </section>

      <section id="capabilities" class="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <div class="max-w-3xl">
          <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Core capabilities</div>
          <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            The repo now converges around the CLI, not the old component showcase.
          </h2>
          <p class="mt-4 text-base leading-7 text-muted-foreground">
            The public web surface is intentionally small. The heavier value lives inside the published CLI and the
            source-owned inventory it bundles into generated apps.
          </p>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map(card => (
            <article class="ui-card p-5">
              <div class="inline-flex size-11 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-card text-primary shadow-inset">
                <card.icon class="size-5" />
              </div>
              <div class="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{card.eyebrow}</div>
              <h3 class="mt-2 text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="modes" class="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-8">
        <article class="ui-card p-6">
          <div class="ui-pillbar inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <ShieldCheck class="size-3.5" />
            <span>Portable mode</span>
          </div>
          <h3 class="mt-4 text-2xl font-semibold tracking-tight text-foreground">Better Auth + Drizzle + Postgres or SQLite/libsql</h3>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            Best when we want provider-agnostic auth and ORM control, explicit database ownership, Better Auth plugins,
            and local SQLite smoke tests before moving to managed infrastructure.
          </p>
          <ul class="mt-5 space-y-2 text-sm text-foreground">
            <li>Portable schema ownership with Drizzle migrations.</li>
            <li>SQLite/libsql local testing path already proven.</li>
            <li>Shared Tigris/S3-compatible object storage substrate.</li>
          </ul>
        </article>

        <article class="ui-card p-6">
          <div class="ui-pillbar inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Database class="size-3.5" />
            <span>Hosted mode</span>
          </div>
          <h3 class="mt-4 text-2xl font-semibold tracking-tight text-foreground">Supabase auth + Supabase data SDK + Tigris</h3>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            Best when we want the fastest managed path: Supabase for auth and data, Tigris for object storage, and
            presigned upload flows so browsers never see raw storage credentials.
          </p>
          <ul class="mt-5 space-y-2 text-sm text-foreground">
            <li>Email + password scaffolded and hosted smoke-tested.</li>
            <li>Email OTP also scaffolded for the same branch.</li>
            <li>Live Tigris presigned put/get/delete flow already proven.</li>
          </ul>
        </article>
      </section>

      <section class="mx-auto grid w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-8">
        <article class="ui-shell p-6 sm:p-7">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Why agents use it</div>
          <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">It removes repeatable work, not product decisions.</h2>
          <div class="mt-5 grid gap-3">
            {deliveryPoints.map(point => (
              <div class="ui-shell-muted flex items-start gap-3 px-4 py-4 text-sm leading-6 text-foreground">
                <ArrowRight class="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </article>

        <article id="quickstart" class="ui-shell-muted p-6 sm:p-7">
          <div class="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <TerminalSquare class="size-3.5" />
            <span>Quickstart</span>
          </div>
          <div class="mt-5 space-y-5">
            <div>
              <div class="text-sm font-medium text-foreground">1. Read the operator briefing</div>
              <pre class="ui-code mt-2 overflow-x-auto px-4 py-4 text-[12px] leading-6"><code>stylyf intro</code></pre>
            </div>

            <div>
              <div class="text-sm font-medium text-foreground">2. Validate your shallow JSON IR</div>
              <pre class="ui-code mt-2 overflow-x-auto px-4 py-4 text-[12px] leading-6"><code>stylyf validate --ir app.json</code></pre>
            </div>

            <div>
              <div class="text-sm font-medium text-foreground">3. Generate the app</div>
              <pre class="ui-code mt-2 overflow-x-auto px-4 py-4 text-[12px] leading-6"><code>stylyf generate --ir app.json --target ./my-app</code></pre>
            </div>
          </div>
        </article>
      </section>

      <section class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:pb-16">
        <div class="ui-shell relative overflow-hidden px-6 py-8 text-center sm:px-8 sm:py-10">
          <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_40%,color-mix(in_oklab,var(--primary)_10%,transparent))]" />
          <div class="relative">
            <div class="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Route class="size-3.5" />
              <span>From scaffold to product work</span>
            </div>
            <h2 class="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              Start from a generated full-stack baseline, then keep iterating in ordinary app code.
            </h2>
            <p class="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              That is the whole role of Stylyf: remove the repetitive setup so the next turns go into product logic,
              workflows, policy, and polish instead of rebuilding the same foundation.
            </p>
            <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-xl)] bg-foreground px-5 text-sm font-medium text-background shadow-soft transition hover:opacity-92"
              >
                <GitBranch class="size-4" />
                <span>Open GitHub repo</span>
              </a>
              <a
                href={npmUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-soft transition hover:border-primary/40"
              >
                <PackageBadge />
                <span>View npm package</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatTile(props: { label: string; value: string; hint: string }) {
  return (
    <div class="ui-shell-muted p-4">
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{props.label}</div>
      <div class="mt-2 text-lg font-semibold tracking-tight text-foreground">{props.value}</div>
      <div class="mt-1 text-sm text-muted-foreground">{props.hint}</div>
    </div>
  );
}

function PackageBadge() {
  return <Package2Badge />;
}

function Package2Badge() {
  return <Boxes class="size-4" />;
}
