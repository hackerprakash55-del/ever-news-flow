import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "save_article",
  title: "Save article",
  description: "Save a news article to the signed-in user's GAINN reading list.",
  inputSchema: {
    article_id: z.string().trim().min(1).describe("Stable identifier of the article (URL or GAINN article id)."),
    headline: z.string().trim().min(1).describe("Article headline."),
    summary: z.string().trim().optional().describe("Short summary of the article."),
    category: z.string().trim().optional().describe("Article category, e.g. politics."),
    region: z.string().trim().optional().describe("Region the story belongs to."),
    source_url: z.string().url().optional().describe("Original source URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("saved_articles")
      .upsert(
        {
          user_id: ctx.getUserId(),
          article_id: input.article_id,
          headline: input.headline,
          summary: input.summary ?? null,
          category: input.category ?? null,
          region: input.region ?? null,
          source_url: input.source_url ?? null,
        },
        { onConflict: "user_id,article_id" },
      )
      .select("id, article_id, headline, saved_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved "${input.headline}".` }],
      structuredContent: { article: data?.[0] ?? null },
    };
  },
});