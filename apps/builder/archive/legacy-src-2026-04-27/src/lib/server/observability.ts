export const serviceInfo: { name: string; database: string; auth: string; storage: string } = {
  "name": "Stylyf Builder",
  "database": "supabase",
  "auth": "supabase",
  "storage": "s3"
};

export function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", event, service: serviceInfo.name, time: new Date().toISOString(), ...data }));
}

export function logError(event: string, error: unknown, data: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", event, service: serviceInfo.name, time: new Date().toISOString(), message, ...data }));
}
