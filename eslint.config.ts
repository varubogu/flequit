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
  // Components層からInfrastructure層への参照を禁止
  {
    files: ['src/lib/components/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/infrastructure/**', '**/infrastructure/**'],
              message:
                '❌ Components層からInfrastructure層への直接アクセスは禁止です。Services層を経由してください。'
            }
          ]
        }
      ]
    }
  },
  // 1. Stores層からServices/Infrastructureへの参照を禁止（責務分離）
  {
    files: ['src/lib/stores/**/*.{ts,svelte.ts}'],

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
            },
            {
              group: ['$lib/infrastructure/**', '**/infrastructure/**'],
              message:
                '❌ Stores層からInfrastructure層への参照は禁止です。Stores層は状態管理のみを担当します。Services層を経由してください。'
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
  // 5. Infrastructure層からServices/Storesへの参照を禁止
  {
    files: ['src/lib/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/services/**', '**/services/**'],
              message:
                '❌ Infrastructure層からServicesへの参照は禁止です。Infrastructure層はStores層からのみ利用されます。'
            },
            {
              group: ['$lib/stores/**', '**/stores/**'],
              message:
                '❌ Infrastructure層からStoresへの参照は禁止です。Infrastructure層は純粋なバックエンド通信のみを担当します。'
            }
          ]
        }
      ]
    }
  },
  // 6. Services層からComponents層への参照を禁止
  {
    files: ['src/lib/services/**/*.{ts,svelte.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/components/**', '**/components/**'],
              message:
                '❌ Services層からComponents層への参照は禁止です。Services層はビジネスロジックのみを担当します。'
            }
          ]
        }
      ]
    }
  },
  // 7. Stores層からComponents層への参照を禁止
  {
    files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/components/**', '**/components/**'],
              message:
                '❌ Stores層からComponents層への参照は禁止です。Stores層は状態管理のみを担当します。'
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
