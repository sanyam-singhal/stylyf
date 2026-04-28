const importMetaSource = ((import.meta as { env?: Record<string, string | undefined> }).env ?? {}) as Record<string, string | undefined>;
const processSource = typeof process !== "undefined" ? process.env : {};
const publicSource = { ...processSource, ...importMetaSource };

function requiredPublic(name: string, aliases: string[] = []) {
  const value = [name, ...aliases].map(key => publicSource[key]).find(Boolean);
  if (!value) throw new Error(`Missing required public env: ${[name, ...aliases].join(" or ")}`);
  return value;
}

function optionalPublic(name: string) {
  return publicSource[name];
}

export const publicEnv = {
  VITE_SUPABASE_URL: requiredPublic("VITE_SUPABASE_URL", ["SUPABASE_URL"]),
  VITE_SUPABASE_PUBLISHABLE_KEY: requiredPublic("VITE_SUPABASE_PUBLISHABLE_KEY", ["SUPABASE_PUBLISHABLE_KEY"]),
};

export type PublicEnv = typeof publicEnv;
