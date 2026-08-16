import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_saved_articles",
  title: "List saved articles",
  description: "List the signed-in user's saved GAINN articles, most recently saved first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum number of saved articles to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("saved_articles")
      .select("id, article_id, headline, summary, category, region, source_url, published_at, saved_at")
      .eq("user_id", ctx.getUserId())
      .order("saved_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});