// テストは UTC で実行することでローカル・CI 環境の差異をなくす
process.env.TZ = 'UTC';

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
        // Baseline from 2026-02-27 local run
        lines: 80,
        functions: 72,
        branches: 87,
        statements: 80,
        // Services coverage will be raised toward 90% after Issue 01 completion
        'src/lib/services/**/*.{ts,svelte}': {
          lines: 75,
          functions: 82,
          branches: 86,
          statements: 75
        }
      }
    }
  }
});
