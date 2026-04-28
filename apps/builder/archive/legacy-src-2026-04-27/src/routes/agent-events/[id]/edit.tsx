import { Link, Meta, Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceEditPageShell } from "~/components/shells/page/resource-edit";
import { AgentEventsForm } from "~/components/resource-forms/agent-events-form";
export default function AgentEventsIdEditRoute() {
  const params = useParams();
  return (
    <>
      <Title>Edit Agent event</Title>
      <Meta name="description" content="Edit Agent event private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Edit Agent event" />
      <Meta property="og:description" content="Edit Agent event private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <ResourceEditPageShell title="Edit Agent event" description="Edit an existing agent event using the generated resource form scaffold.">
          <AgentEventsForm mode="edit" resourceId={params.id ?? ""} />
        </ResourceEditPageShell>
      </SidebarAppShell>
    </>
  );
}