import type { Setting } from '$lib/types/task';
import type { SettingService } from '$lib/services/backend/setting-service';

export class WebSettingService implements SettingService {
  async get(key: string): Promise<Setting | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getSetting not implemented', key);
    throw new Error('Not implemented for web mode');
  }

  async update(setting: Setting): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateSetting not implemented', setting);
    throw new Error('Not implemented for web mode');
  }
}
