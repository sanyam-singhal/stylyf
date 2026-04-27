import { Link, Meta, Title } from "@solidjs/meta";
import { For, Show } from "solid-js";
import { createAsync } from "@solidjs/router";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { SettingsPageShell } from "~/components/shells/page/settings";
import { Stack } from "~/components/layout/stack";
import { SettingsPanel } from "~/components/registry/form-systems/settings-panel";
import { SettingsRow } from "~/components/registry/form-systems/settings-row";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { getInternalMetrics } from "~/lib/server/queries/internal-metrics";

export default function SettingsRoute() {
  const metrics = createAsync(() => getInternalMetrics());
  return (
    <>
      <Title>Settings</Title>
      <Meta name="description" content="Settings private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Settings" />
      <Meta property="og:description" content="Settings private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <SettingsPageShell title="Settings">
        <Stack>
          <SettingsPanel />
          <SettingsRow />
          <DetailPanel
            title="Internal telemetry"
            description="Supabase-only event counts for builder operations. External telemetry is intentionally not used."
            body={
              <Show when={metrics()?.allowed} fallback={<p class="text-sm text-muted-foreground">Admin-only metrics are hidden for this operator.</p>}>
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground">Counts</h3>
                    <For each={metrics()?.counts ?? []}>
                      {item => (
                        <div class="flex justify-between rounded-[var(--radius-lg)] border border-border/80 bg-background p-3 text-sm">
                          <span>{item.type}</span>
                          <span class="font-semibold text-foreground">{item.count}</span>
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-foreground">Recent</h3>
                    <For each={metrics()?.recent ?? []}>
                      {event => (
                        <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3 text-sm text-muted-foreground">
                          <p class="font-medium text-foreground">{event.type}</p>
                          <p>{event.summary}</p>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            }
          />
        </Stack>
        </SettingsPageShell>
      </SidebarAppShell>
    </>
  );
}
