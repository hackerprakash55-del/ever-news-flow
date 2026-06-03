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
