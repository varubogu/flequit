import { invoke } from '@tauri-apps/api/core';
import type {
  RecurrenceRule,
  RecurrenceRulePatch,
  RecurrenceRuleSearchCondition
} from '$lib/types/recurrence';
import type { RecurrenceRuleService } from '$lib/infrastructure/backends/recurrence-rule-service';

/**
 * Rust側のコマンドモデルから TypeScript の RecurrenceRule に変換
 * - Rust: details (JSON文字列) → TypeScript: pattern (オブジェクト)
 * - Rust: adjustment (JSON文字列) → TypeScript: adjustment (オブジェクト)
 */
function convertFromTauriModel(tauriModel: Record<string, unknown>): RecurrenceRule {
  const rule: RecurrenceRule = {
    id: tauriModel.id as string,
    unit: tauriModel.unit as RecurrenceRule['unit'],
    interval: tauriModel.interval as number,
    daysOfWeek: tauriModel.daysOfWeek as RecurrenceRule['daysOfWeek'],
    endDate: tauriModel.endDate ? new Date(tauriModel.endDate as string) : undefined,
    maxOccurrences: tauriModel.maxOccurrences as number | undefined,
    createdAt: tauriModel.createdAt ? new Date(tauriModel.createdAt as string) : undefined,
    updatedAt: tauriModel.updatedAt ? new Date(tauriModel.updatedAt as string) : undefined,
    deleted: tauriModel.deleted as boolean | undefined,
    updatedBy: tauriModel.updatedBy as string | undefined
  };

  // details (JSON文字列) → pattern (オブジェクト)
  if (tauriModel.details && typeof tauriModel.details === 'string') {
    try {
      rule.pattern = JSON.parse(tauriModel.details);
    } catch (error) {
      console.error('Failed to parse details:', error);
    }
  }

  // adjustment (JSON文字列) → adjustment (オブジェクト)
  // Rust側の RecurrenceAdjustmentCommandModel から TypeScript の RecurrenceAdjustment に変換
  if (tauriModel.adjustment && typeof tauriModel.adjustment === 'string') {
    try {
      const adjustmentModel = JSON.parse(tauriModel.adjustment);
      // Rust側は snake_case なので変換が必要
      rule.adjustment = {
        dateConditions: adjustmentModel.date_conditions || [],
        weekdayConditions: adjustmentModel.weekday_conditions || []
      };
    } catch (error) {
      console.error('Failed to parse adjustment:', error);
    }
  }

  return rule;
}

export class RecurrenceRuleTauriService implements RecurrenceRuleService {
  async create(projectId: string, rule: RecurrenceRule, userId: string): Promise<boolean> {
    // Rust側のコマンドモデルに合わせて変換
    // - TypeScript: pattern → Rust: details (JSON文字列)
    // - TypeScript: adjustment → Rust: adjustment (JSON文字列)

    // adjustment を Rust側の RecurrenceAdjustmentCommandModel に変換
    let adjustmentForTauri: string | undefined = undefined;
    if (rule.adjustment) {
      // Rust側のフィールド名は snake_case
      const adjustmentModel = {
        id: crypto.randomUUID(), // 新規作成時にIDを生成
        recurrence_rule_id: rule.id || crypto.randomUUID(), // rule.idがなければ生成
        date_conditions: rule.adjustment.dateConditions || [],
        weekday_conditions: rule.adjustment.weekdayConditions || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted: false,
        updated_by: userId
      };
      adjustmentForTauri = JSON.stringify(adjustmentModel);
    }

    const ruleForTauri = {
      id: rule.id || crypto.randomUUID(), // idがなければ生成
      unit: rule.unit,
      interval: rule.interval,
      daysOfWeek: rule.daysOfWeek,
      // pattern を details にマッピングし、JSON文字列に変換
      details: rule.pattern ? JSON.stringify(rule.pattern) : undefined,
      // adjustment をJSON文字列に変換
      adjustment: adjustmentForTauri,
      endDate: rule.endDate,
      maxOccurrences: rule.maxOccurrences,
      createdAt: rule.createdAt || new Date(),
      updatedAt: rule.updatedAt || new Date(),
      deleted: false,
      updatedBy: userId
    };

    try {
      console.log(
        '[RecurrenceRuleTauriService.create] Sending rule:',
        JSON.stringify(ruleForTauri, null, 2)
      );
      const result = await invoke('create_recurrence_rule', {
        projectId,
        rule: ruleForTauri,
        userId
      });
      console.log('[RecurrenceRuleTauriService.create] Success:', result);
      return result as boolean;
    } catch (error) {
      console.error('[RecurrenceRuleTauriService.create] Failed to create recurrence rule:', error);
      return false;
    }
  }

  async get(projectId: string, ruleId: string, userId: string): Promise<RecurrenceRule | null> {
    try {
      const result = (await invoke('get_recurrence_rule', { projectId, ruleId, userId })) as Record<
        string,
        unknown
      > | null;
      if (!result) return null;
      return convertFromTauriModel(result);
    } catch (error) {
      console.error('Failed to get recurrence rule:', error);
      return null;
    }
  }

  async getAll(projectId: string, userId: string): Promise<RecurrenceRule[]> {
    try {
      const result = (await invoke('get_all_recurrence_rules', { projectId, userId })) as Record<
        string,
        unknown
      >[];
      return result.map(convertFromTauriModel);
    } catch (error) {
      console.error('Failed to get all recurrence rules:', error);
      return [];
    }
  }

  async update(
    projectId: string,
    ruleId: string,
    patch: RecurrenceRulePatch,
    userId: string
  ): Promise<boolean> {
    try {
      // Rust側のコマンドモデルに合わせて変換
      const patchForTauri: Record<string, unknown> = {
        id: ruleId
      };

      // フィールドごとに変換
      if (patch.unit !== undefined) patchForTauri.unit = patch.unit;
      if (patch.interval !== undefined) patchForTauri.interval = patch.interval;
      if (patch.daysOfWeek !== undefined) patchForTauri.daysOfWeek = patch.daysOfWeek;
      if (patch.endDate !== undefined) patchForTauri.endDate = patch.endDate;
      if (patch.maxOccurrences !== undefined) patchForTauri.maxOccurrences = patch.maxOccurrences;

      // pattern を details にマッピングし、JSON文字列に変換
      if (patch.pattern !== undefined) {
        patchForTauri.details = patch.pattern ? JSON.stringify(patch.pattern) : null;
      }

      // adjustment をJSON文字列に変換
      if (patch.adjustment !== undefined) {
        if (patch.adjustment) {
          // Rust側のフィールド名は snake_case
          const adjustmentModel = {
            id: crypto.randomUUID(), // 更新時にIDを生成
            recurrence_rule_id: ruleId,
            date_conditions: patch.adjustment.dateConditions || [],
            weekday_conditions: patch.adjustment.weekdayConditions || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted: false,
            updated_by: userId
          };
          patchForTauri.adjustment = JSON.stringify(adjustmentModel);
        } else {
          patchForTauri.adjustment = null;
        }
      }

      const result = await invoke('update_recurrence_rule', {
        projectId,
        patch: patchForTauri,
        userId
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update recurrence rule:', error);
      return false;
    }
  }

  async delete(projectId: string, ruleId: string, userId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_recurrence_rule', { projectId, ruleId, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete recurrence rule:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(
    projectId: string,
    _condition: RecurrenceRuleSearchCondition
  ): Promise<RecurrenceRule[]> {
    try {
      // TODO: search_recurrence_rules コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_recurrence_rules is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search recurrence rules:', error);
      return [];
    }
  }
}
