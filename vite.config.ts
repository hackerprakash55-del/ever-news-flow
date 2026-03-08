import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Target modern browsers — smaller output, no legacy polyfills
    target: "es2020",
    // Split vendor chunks for better long-term caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached across deploys
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          // Router — separate so nav changes don't bust React cache
          "vendor-router": ["react-router-dom"],
          // Supabase client — large, rarely changes
          "vendor-supabase": ["@supabase/supabase-js"],
          // Lucide icons — 157KB, split so it caches independently
          "vendor-icons": ["lucide-react"],
          // Radix UI primitives
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],
          // Query layer
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
    // Raise warning threshold slightly (default 500kb) — we're chunking explicitly
    chunkSizeWarningLimit: 600,
  },
}));
