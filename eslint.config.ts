import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  prettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parser: tseslint.parser
    }
  },
  {
    files: ['src/lib/**/*.{ts,svelte}'],
    ignores: [
      'src/lib/infrastructure/**',
      'src/lib/services/data-service.ts',
      'src/lib/services/domain/settings.ts',
      'src/lib/services/paraglide-translation-service.svelte.ts',
      'src/lib/stores/settings.svelte.ts',
      'src/lib/stores/views-visibility.svelte.ts',
      // Components層の例外（要リファクタリング: data-serviceへのメソッド追加が必要）
      'src/lib/components/task/assignment/task-assignment.svelte',
      'src/lib/components/task/detail/task-detail.svelte',
      'src/lib/components/task/forms/task-date-picker.svelte',
      'src/lib/components/user/user-profile-edit-dialog.svelte'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                '❌ Infrastructure層への直接アクセスは禁止です。services/を経由してください。'
            }
          ]
        }
      ]
    }
  },
  // 循環依存防止ルール（Stores層のみ対象）
  // 注: settingsInitServiceとViewServiceは循環依存がないことを確認済みのため許可
  {
    files: ['src/lib/stores/*.svelte.ts'],
    ignores: [
      'src/lib/stores/settings.svelte.ts',
      'src/lib/stores/view-store.svelte.ts',
      'src/lib/stores/views-visibility.svelte.ts'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/services/domain/**', '**/services/domain/**'],
              message: '❌ Stores層からDomain Servicesへの参照は禁止です（循環依存）。'
            },
            {
              group: ['$lib/services/ui/**', '**/services/ui/**'],
              message: '❌ Stores層からUI Servicesへの参照は禁止です（循環依存）。'
            },
            {
              group: ['$lib/services/composite/**', '**/services/composite/**'],
              message: '❌ Stores層からComposite Servicesへの参照は禁止です（循環依存）。'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/lib/services/data-service.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/stores/**', '**/stores/**'],
              message: '❌ data-serviceからStoresへの参照は禁止です。必要なIDはパラメータで受け取ってください。'
            },
            {
              group: ['$lib/services/domain/**', '**/services/domain/**'],
              message: '❌ data-serviceからDomain Servicesへの参照は禁止です（循環依存）。'
            },
            {
              group: ['$lib/services/ui/**', '**/services/ui/**'],
              message: '❌ data-serviceからUI Servicesへの参照は禁止です（循環依存）。'
            },
            {
              group: ['$lib/services/composite/**', '**/services/composite/**'],
              message: '❌ data-serviceからComposite Servicesへの参照は禁止です（循環依存）。'
            }
          ]
        }
      ]
    }
  },
  {
    ignores: [
      '.svelte-kit/',
      'build/',
      'bun.lockb',
      'dist/',
      'node_modules/',
      'src/paraglide/',
      'src/lib/components/ui/',
      'src-tauri/',
      'package-lock.json',
      'playwright-report/',
      'test-results/',
      'src/lib/types/bindings.ts'
    ]
  }
);
