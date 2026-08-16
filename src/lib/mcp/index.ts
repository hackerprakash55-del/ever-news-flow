import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchVerifiedClaims from "./tools/search-verified-claims";
import listVideoReports from "./tools/list-video-reports";
import listSavedArticles from "./tools/list-saved-articles";
import saveArticle from "./tools/save-article";
import removeSavedArticle from "./tools/remove-saved-article";
import getNewsPreferences from "./tools/get-news-preferences";
import updateNewsPreferences from "./tools/update-news-preferences";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "global-ai-news",
  title: "Global AI News",
  version: "0.1.0",
  instructions:
    "Tools for GAINN, an autonomous AI news agency. Search verified news claims, browse AI-generated video reports, and manage the signed-in user's saved articles and news preferences.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchVerifiedClaims,
    listVideoReports,
    listSavedArticles,
    saveArticle,
    removeSavedArticle,
    getNewsPreferences,
    updateNewsPreferences,
  ],
});