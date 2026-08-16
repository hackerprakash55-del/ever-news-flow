import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "remove_saved_article",
  title: "Remove saved article",
  description: "Remove an article from the signed-in user's GAINN reading list.",
  inputSchema: {
    article_id: z.string().trim().min(1).describe("Identifier of the saved article to remove."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ article_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", ctx.getUserId())
      .eq("article_id", article_id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Removed article ${article_id} from the reading list.` }] };
  },
});