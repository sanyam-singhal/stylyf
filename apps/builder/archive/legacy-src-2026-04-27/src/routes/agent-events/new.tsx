import { Link, Meta, Title } from "@solidjs/meta";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceCreatePageShell } from "~/components/shells/page/resource-create";
import { AgentEventsForm } from "~/components/resource-forms/agent-events-form";
export default function AgentEventsNewRoute() {
  return (
    <>
      <Title>Create Agent event</Title>
      <Meta name="description" content="Create Agent event private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Create Agent event" />
      <Meta property="og:description" content="Create Agent event private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <ResourceCreatePageShell title="Create Agent event" description="Create a new agent event using the generated resource form scaffold.">
          <AgentEventsForm mode="create" />
        </ResourceCreatePageShell>
      </SidebarAppShell>
    </>
  );
}