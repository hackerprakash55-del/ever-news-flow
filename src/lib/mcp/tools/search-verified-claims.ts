import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_verified_claims",
  title: "Search verified claims",
  description:
    "Search GAINN's verified news claims by keyword or topic. Returns claim text, status, confidence and topic.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Keyword or phrase to search claim text and topic for."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of claims to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const escaped = query.replace(/[%,]/g, " ");
    const { data, error } = await supabase
      .from("claims")
      .select("id, claim_text, topic, status, confidence, last_seen_at")
      .or(`claim_text.ilike.%${escaped}%,topic.ilike.%${escaped}%`)
      .order("last_seen_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { claims: data ?? [] },
    };
  },
});