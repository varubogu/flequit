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
    pool: 'threads',
    maxWorkers: 4,
    minWorkers: 1,
    // No need for alias, use /svelte5 directly in imports
    server: {
      deps: {
        inline: ['svelte']
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      include: ['src/lib/**/*.{ts,svelte}'],
      exclude: [
        'src/lib/types/bindings.ts',
        'src/lib/data/sample-data.ts',
        'src/lib/components/ui/**',
        'src/paraglide/**',
        'src/lib/**/*.d.ts'
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    }
  }
});
