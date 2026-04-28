import { defineMiddleware, sendRedirect } from "vinxi/http";
import { createSupabaseServerClient } from "~/lib/supabase";

const protectedRoutes = ["/", "/projects/new", "/projects/:id"] as const;

function shouldSkip(path: string) {
  return path.startsWith("/_build") || path === "/favicon.ico" || path.startsWith("/api/") || path.startsWith("/auth/") || path === "/login";
}

function matchesProtectedRoute(path: string) {
  return protectedRoutes.some(pattern => {
    if (pattern === path) return true;
    const patternSegments = pattern.split("/").filter(Boolean);
    const pathSegments = path.split("/").filter(Boolean);
    if (patternSegments.length !== pathSegments.length) return false;
    return patternSegments.every((segment, index) => segment.startsWith(":") || segment === pathSegments[index]);
  });
}

export default defineMiddleware({
  async onRequest(event) {
    if (shouldSkip(event.path) || !matchesProtectedRoute(event.path)) return;

    const supabase = createSupabaseServerClient(event);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      await sendRedirect(event, "/login", 302);
    }
  },
});
