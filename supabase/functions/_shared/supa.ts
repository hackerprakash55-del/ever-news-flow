import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function userClient(authHeader: string | null) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: { persistSession: false },
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    },
  );
}

export async function requireAdmin(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const supa = userClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supa.auth.getClaims(token);
  if (error || !data?.claims) {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }
  const userId = data.claims.sub as string;
  const svc = serviceClient();
  const { data: roles } = await svc
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roles) return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, userId };
}

/**
 * Allows only internal service-role callers (cron / other edge functions)
 * or an authenticated admin user. Everyone else is rejected.
 */
export async function requireServiceOrAdmin(req: Request) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (serviceKey && (bearer === serviceKey || cronSecret === serviceKey)) {
    return { ok: true as const, service: true };
  }
  if (!bearer) return { ok: false as const, status: 401, error: "Unauthorized" };

  try {
    const auth = await requireAdmin(authHeader);
    if (auth.ok) return { ok: true as const, service: false, userId: auth.userId };
    return { ok: false as const, status: auth.status, error: auth.error };
  } catch (_e) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
}

