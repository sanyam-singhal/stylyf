import { starterSourceFor, targetPath, type RegistryItem } from "~/lib/registry";

const registryComponentSourceLoaders = import.meta.glob("../components/registry/**/*.tsx", {
  import: "default",
  query: "?raw",
}) as Record<string, () => Promise<string>>;

const routeSourceLoaders = import.meta.glob("../routes/**/*.tsx", {
  import: "default",
  query: "?raw",
}) as Record<string, () => Promise<string>>;

function sourceKeyFor(item: RegistryItem) {
  return targetPath(item).replace(/^src\//, "../");
}

export async function loadSourceFor(item: RegistryItem) {
  const key = sourceKeyFor(item);
  const loader = routeSourceLoaders[key] ?? registryComponentSourceLoaders[key];

  if (!loader) {
    return starterSourceFor(item);
  }

  return loader();
}
