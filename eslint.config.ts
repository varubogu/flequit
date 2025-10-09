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
  // 1. Stores層からServicesへの参照を禁止（循環依存防止）
  {
    files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
    ignores: [
      'src/lib/stores/settings.svelte.ts',
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
  // 2. Domain ServicesからUI/Composite Servicesへの参照を禁止（階層違反）
  {
    files: ['src/lib/services/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/services/ui/**', '**/services/ui/**'],
              message: '❌ Domain ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
            },
            {
              group: ['$lib/services/composite/**', '**/services/composite/**'],
              message: '❌ Domain ServicesからComposite Servicesへの参照は禁止です（下位層→上位層）。'
            }
          ]
        }
      ]
    }
  },
  // 3. Composite ServicesからUI Servicesへの参照を禁止（階層違反）
  {
    files: ['src/lib/services/composite/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/services/ui/**', '**/services/ui/**'],
              message: '❌ Composite ServicesからUI Servicesへの参照は禁止です（下位層→上位層）。'
            }
          ]
        }
      ]
    }
  },
  // 4. Utils/Types層からStores/Services/Infrastructureへの参照を禁止
  {
    files: ['src/lib/utils/**/*.ts', 'src/lib/types/**/*.ts'],
    ignores: ['src/lib/types/bindings.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/stores/**', '**/stores/**'],
              message:
                '❌ Utils/Types層からStoresへの参照は禁止です。純粋な関数・型定義のみにしてください。'
            },
            {
              group: ['$lib/services/**', '**/services/**'],
              message:
                '❌ Utils/Types層からServicesへの参照は禁止です。純粋な関数・型定義のみにしてください。'
            },
            {
              group: ['$lib/infrastructure/**', '**/infrastructure/**'],
              message:
                '❌ Utils/Types層からInfrastructureへの参照は禁止です。純粋な関数・型定義のみにしてください。'
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
