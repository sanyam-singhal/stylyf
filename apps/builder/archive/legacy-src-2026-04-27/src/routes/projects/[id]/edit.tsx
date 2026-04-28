import { Link, Meta, Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceEditPageShell } from "~/components/shells/page/resource-edit";
import { ProjectsForm } from "~/components/resource-forms/projects-form";
export default function ProjectsIdEditRoute() {
  const params = useParams();
  return (
    <>
      <Title>Edit Project</Title>
      <Meta name="description" content="Edit Project private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Edit Project" />
      <Meta property="og:description" content="Edit Project private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <ResourceEditPageShell title="Edit Project" description="Edit an existing project using the generated resource form scaffold.">
          <ProjectsForm mode="edit" resourceId={params.id ?? ""} />
        </ResourceEditPageShell>
      </SidebarAppShell>
    </>
  );
}