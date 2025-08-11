import type { Setting } from '$lib/types/task';
import type { SettingService } from '$lib/services/backend/setting-service';

export class WebSettingService implements SettingService {
  async get(key: string): Promise<Setting | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getSetting not implemented', key);
    return null; // 仮実装としてnullを返す
  }

  async update(setting: Setting): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateSetting not implemented', setting);
    return false; // 仮実装として失敗を返す
  }
}
