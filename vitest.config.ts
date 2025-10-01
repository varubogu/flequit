import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  resolve: {
    alias: {
      $lib: '/src/lib',
      $paraglide: '/src/paraglide'
    },
    conditions: process.env.VITEST ? ['browser'] : undefined
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
    globals: true,
    maxWorkers: 4,
    // No need for alias, use /svelte5 directly in imports
    server: {
      deps: {
        inline: ['svelte']
      }
    }
  }
});
