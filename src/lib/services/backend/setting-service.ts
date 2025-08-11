import type { Setting } from '$lib/types/task';
import type { SettingInterface } from '$lib/types/crud-interface';

/**
 * 設定管理用のバックエンドサービスインターフェース
 */
export type SettingService = SettingInterface<Setting>;
