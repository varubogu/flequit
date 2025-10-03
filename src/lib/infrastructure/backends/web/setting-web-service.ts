import type { Setting } from '$lib/types/settings';
import type { SettingService } from '$lib/infrastructure/backends/setting-service';

export class SettingWebService implements SettingService {
  async get(key: string): Promise<Setting | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getSetting not implemented', key);
    return null; // 仮実装としてnullを返す
  }

  async getAll(): Promise<Setting[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getAllSettings not implemented');

    // 仮実装として空の設定配列を返す（他のサービスと同様の仮実装パターン）
    return []; // 実際のWeb APIが実装されるまでの仮実装
  }

  async update(setting: Setting): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateSetting not implemented', setting);
    return false; // 仮実装として失敗を返す
  }
}
