import { vi } from 'vitest';
import { MockTranslationService } from '$lib/services/mock-translation-service';

class GlobalMockTranslationService extends MockTranslationService {
  async init(): Promise<void> {
    // 実際の翻訳サービス初期化は不要なので空実装
  }
}

const translationService = new GlobalMockTranslationService('en');

vi.mock('$lib/services/paraglide-translation-service.svelte', () => ({
  __esModule: true,
  translationService
}));
