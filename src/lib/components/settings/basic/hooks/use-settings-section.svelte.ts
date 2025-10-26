import { settingsStore } from '$lib/stores/settings.svelte';
import { useTranslation } from '$lib/hooks/use-translation.svelte';

/**
 * 設定セクション用の共通composable
 * 翻訳サービスとストア連携を提供
 */
export function useSettingsSection() {
  const translationService = useTranslation();

  return {
    translationService,
    settingsStore
  };
}
