import { Meta, Title } from "@solidjs/meta";
import { Bot, GitBranch, MonitorPlay, WandSparkles } from "lucide-solid";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceCreatePageShell } from "~/components/shells/page/resource-create";
import { ProjectsForm } from "~/components/resource-forms/projects-form";
export default function ProjectsNewRoute() {
  return (
    <>
      <Title>New project</Title>
      <Meta name="description" content="New project private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="New project" />
      <Meta property="og:description" content="New project private app surface for Stylyf Builder." />
      <SidebarAppShell
        title="New app draft"
        description="Name the app. Stylyf handles the workspace, repo, IR skeleton, agent instructions, and first git checkpoint behind the scenes."
        navigation={<GeneratedNavigation shell="sidebar-app" />}
      >
        <ResourceCreatePageShell title="Create project" description="For non-technical teammates, intake should feel like naming a draft, not configuring infrastructure. The brief happens in chat after creation.">
          <div class="grid gap-[var(--space-6)] xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div class="builder-panel p-[var(--space-6)]">
              <ProjectsForm mode="create" />
            </div>
            <aside class="builder-panel-ink space-y-5 p-[var(--space-6)]">
              <div class="builder-orb size-12"><WandSparkles class="size-5" /></div>
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ink-foreground/50">Builder contract</p>
                <h3 class="text-2xl font-semibold tracking-[-0.04em] text-ink-foreground">One field, full workspace.</h3>
                <p class="text-sm leading-6 text-ink-foreground/62">After this, the workbench takes over: chat, editable IR panes, iframe preview, screenshots, checks, commits, and pushes.</p>
              </div>
              <div class="space-y-3">
                <div class="builder-rail-card flex gap-3"><Bot class="mt-0.5 size-4 shrink-0" /><span>Prompt and approval events are stored.</span></div>
                <div class="builder-rail-card flex gap-3"><MonitorPlay class="mt-0.5 size-4 shrink-0" /><span>Previews run from generated app workspaces.</span></div>
                <div class="builder-rail-card flex gap-3"><GitBranch class="mt-0.5 size-4 shrink-0" /><span>Accepted iterations become git commits.</span></div>
              </div>
            </aside>
          </div>
        </ResourceCreatePageShell>
      </SidebarAppShell>
    </>
  );
}
