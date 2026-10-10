import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const host = process.env.TAURI_DEV_HOST;

// Tauri has no Node server, so the app is prerendered with adapter-static (SSG).
// SvelteKit 3 no longer reads svelte.config.js; pass options to this plugin.
// https://v2.tauri.app/start/frontend/sveltekit/
export function flequitSvelteKit() {
  return sveltekit({
    preprocess: vitePreprocess(),
    adapter: adapter(),
    alias: {
      // `$lib` is no longer created automatically. Keep the alias so existing
      // imports stay valid. `alias` is deprecated in favor of `#lib` subpath imports.
      $lib: 'src/lib',
      $paraglide: './src/paraglide'
    }
  });
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['cookie', 'preferredLanguage', 'baseLocale']
    }),
    tailwindcss(),
    flequitSvelteKit(),
    devtoolsJson()
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**']
    }
  }
}));
