import { defineMiddleware, sendRedirect } from "vinxi/http";
import { createSupabaseServerClient } from "~/lib/supabase";

const protectedRoutes = ["/","/agent-events","/agent-events/:id/edit","/agent-events/new","/projects","/projects/:id","/projects/:id/edit","/projects/new","/settings"] as const;

function shouldSkip(path: string) {
  return path.startsWith("/_build") || path === "/favicon.ico" || path.startsWith("/api/");
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
    if (shouldSkip(event.path)) {
      return;
    }

    const supabase = createSupabaseServerClient(event);
    const { data: userData } = await supabase.auth.getUser();

    if (matchesProtectedRoute(event.path) && !userData.user) {
      await sendRedirect(event, "/login", 302);
      return;
    }
  },
});
