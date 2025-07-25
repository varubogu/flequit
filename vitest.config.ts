import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  resolve: {
    alias: {
      '$paraglide': '/src/paraglide'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
    globals: true,
    // No need for alias, use /svelte5 directly in imports
  }
});
