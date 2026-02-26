import { getTranslationService } from '$lib/stores/locale.svelte';
import type { ITranslationService } from '$lib/services/translation-service';

/**
 * useTranslation - 翻訳サービスを取得するComposable
 *
 * 責務: コンポーネントに翻訳機能を提供する統一的なインターフェース
 *
 * 利点:
 * - テスト時のモック化が容易
 * - 依存関係の注入パターンに準拠
 * - Svelte 5のrunesパターンに適合
 *
 * @example
 * ```typescript
 * import { useTranslation } from '$lib/hooks/use-translation.svelte';
 *
 * const t = useTranslation();
 * const message = t.getMessage('key');
 * ```
 */
export function useTranslation(): ITranslationService {
  return getTranslationService();
}
