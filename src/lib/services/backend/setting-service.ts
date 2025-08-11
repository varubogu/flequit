import type { Setting } from '$lib/types/task';
import type { SettingInterface } from '$lib/types/crud-interface';

/**
 * 設定管理用のバックエンドサービスインターフェース
 */
export interface SettingService extends SettingInterface<Setting> {}
