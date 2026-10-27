import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries go in their own files instead of one ~1 MB bundle. They rarely
        // change, so after a deploy browsers keep them cached and only re-download the app code.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // The HEIC photo converter (about 3 MB) stays in its own file, loaded only when a HEIC
          // photo is picked or shown (src/lib/heic.ts imports it on demand)
          if (id.includes("heic-to")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "react";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("date-fns")) return "date-fns";
          return "vendor";
        },
      },
    },
  },
}));
