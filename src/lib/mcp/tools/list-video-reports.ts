import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_video_reports",
  title: "List AI video reports",
  description:
    "List GAINN's AI-generated video news reports, newest first, with title, category, duration and narration script.",
  inputSchema: {
    category: z.string().trim().min(1).optional().describe("Optional category filter, e.g. politics or crime."),
    include_script: z.boolean().default(false).describe("Include the full narration script for each report."),
    limit: z.number().int().min(1).max(25).default(10).describe("Maximum number of reports to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, include_script, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("generated_videos")
      .select(
        include_script
          ? "id, title, category, duration, thumbnail_url, generated_at, script, short_script"
          : "id, title, category, duration, thumbnail_url, generated_at",
      )
      .order("generated_at", { ascending: false })
      .limit(limit ?? 10);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { reports: data ?? [] },
    };
  },
});