import { BarChart3, Bell, BriefcaseBusiness, LayoutDashboard, Plus, Settings, Users } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Button } from "~/components/registry/actions-navigation/button";
import { Tabs } from "~/components/registry/disclosure-overlay/tabs";
import { SearchField } from "~/components/registry/form-systems/search-field";
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
        body={
          <div class="space-y-4">
            <div class="text-sm font-semibold text-foreground">Brand setup</div>
            <div class="text-sm leading-6 text-muted-foreground">Configure the foundation of the workspace before inviting the rest of the team.</div>
            <Stepper orientation="vertical" />
          </div>
        }
        summary={
          <div class="space-y-3">
            <div class="text-sm font-semibold text-foreground">Summary</div>
            <div class="text-sm leading-6 text-muted-foreground">The wizard shell reserves a consistent side summary for transactional flows.</div>
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
      <div class="max-w-sm">
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
      </div>
    </DemoFrame>
  );
}

export function TopNavBarPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <TopNavBar
        nav={<div class="flex flex-wrap gap-4 text-sm text-muted-foreground"><a href="#" class="text-foreground">Product</a><a href="#">Docs</a><a href="#">Pricing</a></div>}
        search={<SearchField />}
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
