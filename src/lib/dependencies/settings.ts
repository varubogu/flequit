import { SettingsService, settingsInitService } from '$lib/services/domain/settings';
import type { Setting, Settings } from '$lib/types/settings';

export interface SettingsGateway {
  loadSettings(): Promise<Settings | null>;
  updateSettingsPartially(partial: Partial<Settings>): Promise<Settings | null>;
}

export function resolveSettingsGateway(): SettingsGateway {
  return SettingsService;
}

export interface SettingsInitGateway {
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(allSettings: Setting[], key: string): Setting | undefined;
  updateSetting(setting: Setting): Promise<void>;
}

export function resolveSettingsInitGateway(): SettingsInitGateway {
  return settingsInitService;
}
