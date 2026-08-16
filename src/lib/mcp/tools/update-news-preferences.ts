import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_news_preferences",
  title: "Update news preferences",
  description: "Update the signed-in user's GAINN news categories and regions.",
  inputSchema: {
    categories: z.array(z.string().trim().min(1)).max(20).optional().describe("Preferred news categories."),
    regions: z.array(z.string().trim().min(1)).max(20).optional().describe("Preferred regions, e.g. India, Delhi."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ categories, regions }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!categories && !regions) {
      return { content: [{ type: "text", text: "Provide categories, regions, or both." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const payload: Record<string, unknown> = { user_id: ctx.getUserId() };
    if (categories) payload.categories = categories;
    if (regions) payload.regions = regions;
    const { data, error } = await supabase
      .from("news_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("categories, regions, updated_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? {}, null, 2) }],
      structuredContent: { preferences: data?.[0] ?? null },
    };
  },
});