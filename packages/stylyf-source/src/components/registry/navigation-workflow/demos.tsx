import { Bell, BriefcaseBusiness, LayoutDashboard, Plus, Settings, Users } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Button } from "~/components/registry/actions-navigation/button";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Tabs } from "~/components/registry/disclosure-overlay/tabs";
import { AppHeader } from "~/components/registry/navigation-workflow/app-header";
import { SidebarNav } from "~/components/registry/navigation-workflow/sidebar-nav";
import { Stepper } from "~/components/registry/navigation-workflow/stepper";
import { TopNavBar } from "~/components/registry/navigation-workflow/top-nav-bar";
import { WizardShell } from "~/components/registry/navigation-workflow/wizard-shell";

function DemoFrame(props: { children: JSX.Element; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4" data-demo={props.item.slug}>
      <div class="ui-demo-chip">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class="ui-demo-frame">{props.children}</div>
    </div>
  );
}

export function StepperPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <Stepper />
    </DemoFrame>
  );
}

export function WizardShellPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <WizardShell
        description="Balance a progress headline, dense step content, and a persistent summary pane without making the transaction feel heavy."
        body={
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Brand setup</Badge>
              <Badge tone="neutral">Draft autosaved</Badge>
            </div>
            <div class="text-sm leading-6 text-muted-foreground">Configure the foundation of the workspace before inviting the rest of the team.</div>
            <Stepper orientation="vertical" />
          </div>
        }
        summary={
          <div class="space-y-4">
            <div>
              <div class="text-sm font-semibold text-foreground">Ready to launch</div>
              <div class="mt-2 text-sm leading-6 text-muted-foreground">The summary rail stays visible for checkpoints, requirements, and transactional reassurance.</div>
            </div>
            <div class="space-y-3">
              <div class="ui-shell flex items-center justify-between px-3 py-3 text-sm">
                <span class="text-muted-foreground">Primary domain</span>
                <span class="font-semibold text-foreground">stylyf.com</span>
              </div>
              <div class="ui-shell flex items-center justify-between px-3 py-3 text-sm">
                <span class="text-muted-foreground">Brand seats</span>
                <span class="font-semibold text-foreground">12 invited</span>
              </div>
            </div>
          </div>
        }
        footer={<div class="flex justify-between gap-3"><Button type="button" tone="outline" intent="neutral">Back</Button><Button type="button">Continue</Button></div>}
      />
    </DemoFrame>
  );
}

export function SidebarNavPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_5.75rem_minmax(0,1fr)]">
        <SidebarNav
          groups={[
            {
              label: "Workspace",
              items: [
                { label: "Overview", active: true, icon: <LayoutDashboard class="size-4" /> },
                { label: "Members", badge: "12", icon: <Users class="size-4" /> },
                { label: "Billing", icon: <BriefcaseBusiness class="size-4" /> },
              ],
            },
            {
              label: "Settings",
              items: [
                { label: "Notifications", badge: "3", icon: <Bell class="size-4" /> },
                { label: "Preferences", icon: <Settings class="size-4" /> },
              ],
            },
          ]}
        />
        <SidebarNav
          collapsed
          title="Compact rail"
          groups={[
            {
              label: "Workspace",
              items: [
                { label: "Overview", active: true, icon: <LayoutDashboard class="size-4" /> },
                { label: "Members", badge: "12", icon: <Users class="size-4" /> },
                { label: "Billing", icon: <BriefcaseBusiness class="size-4" /> },
              ],
            },
            {
              label: "Settings",
              items: [
                { label: "Notifications", badge: "3", icon: <Bell class="size-4" /> },
                { label: "Preferences", icon: <Settings class="size-4" /> },
              ],
            },
          ]}
        />
        <div class="ui-shell-muted border border-border/80 p-[var(--space-5)] shadow-soft">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected workspace</div>
          <div class="mt-3 text-xl font-semibold text-foreground">Overview</div>
          <div class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Pair the navigation shell with adjacent workspace context so the selected route feels grounded.
          </div>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="ui-shell p-4">
              <div class="text-sm font-semibold text-foreground">12 members</div>
              <div class="mt-1 text-sm text-muted-foreground">Role and seat management</div>
            </div>
            <div class="ui-shell p-4">
              <div class="text-sm font-semibold text-foreground">3 alerts</div>
              <div class="mt-1 text-sm text-muted-foreground">Review billing and notification issues</div>
            </div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

export function TopNavBarPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <TopNavBar
        brand="Stylyf Cloud"
        nav={
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <a href="#" class="ui-chip bg-background text-foreground">Product</a>
            <a href="#" class="text-muted-foreground transition hover:text-foreground">Docs</a>
            <a href="#" class="text-muted-foreground transition hover:text-foreground">Pricing</a>
            <a href="#" class="text-muted-foreground transition hover:text-foreground">Security</a>
          </div>
        }
        search={
          <label class="ui-shell flex items-center gap-3 px-3 py-2.5">
            <svg viewBox="0 0 24 24" class="size-4 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              class="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search charts, invoices, and docs"
              value=""
            />
            <span class="ui-chip ui-chip-muted">⌘K</span>
          </label>
        }
        actions={<><Button type="button" tone="outline" intent="neutral">Docs</Button><Button type="button" leftIcon={<Plus />}>New</Button></>}
      />
    </DemoFrame>
  );
}

export function AppHeaderPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <AppHeader
        title="Workspace analytics"
        description="A high-signal workspace header should support orientation, quick actions, and context switching without overpowering the content below."
        meta={
          <>
            <Badge tone="neutral">Updated 3 min ago</Badge>
            <Badge tone="accent">4 live alerts</Badge>
          </>
        }
        actions={<Button type="button">Create report</Button>}
        tabs={
          <Tabs
            defaultValue="overview"
            items={[
              { value: "overview", label: "Overview", description: "Workspace health", content: <div class="hidden" /> },
              { value: "revenue", label: "Revenue", description: "Commercial metrics", content: <div class="hidden" /> },
              { value: "members", label: "Members", description: "Seats and roles", content: <div class="hidden" /> },
            ]}
          />
        }
      />
      <div class="ui-shell-muted border border-border/80 p-[var(--space-5)] shadow-soft">
        <div class="flex flex-wrap items-center gap-3">
          <span class="ui-chip ui-chip-muted">24 reports</span>
          <span class="ui-chip ui-chip-accent">Sync healthy</span>
          <span class="ui-chip ui-chip-secondary">3 teams online</span>
        </div>
      </div>
    </DemoFrame>
  );
}

export const previewBySlug = {
  "app-header": AppHeaderPreview,
  "sidebar-nav": SidebarNavPreview,
  stepper: StepperPreview,
  "top-nav-bar": TopNavBarPreview,
  "wizard-shell": WizardShellPreview,
};
