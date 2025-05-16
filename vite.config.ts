import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), viteSingleFile()],
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000, // inline everything (JS, CSS, WASM)
    cssCodeSplit: false,
  },
});
