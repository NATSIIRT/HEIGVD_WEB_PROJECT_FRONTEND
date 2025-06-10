import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default API URL if not specified in .env
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'
  
  return {
    plugins: [react(), tailwindcss(), wasm(), topLevelAwait(), viteSingleFile()],
    build: {
      target: "esnext",
      assetsInlineLimit: 100000000, // inline everything (JS, CSS, WASM)
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Replace VITE_API_URL with its value during build, using default if not specified
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  }
})
