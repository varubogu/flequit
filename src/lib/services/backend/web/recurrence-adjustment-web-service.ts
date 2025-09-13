import type { RecurrenceAdjustment, RecurrenceAdjustmentSearchCondition } from '$lib/types/recurrence-adjustment';
import type { RecurrenceAdjustmentService } from '$lib/services/backend/recurrence-adjustment-service';

export class RecurrenceAdjustmentWebService implements RecurrenceAdjustmentService {
  async create(adjustment: RecurrenceAdjustment): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createRecurrenceAdjustment not implemented', adjustment);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async getByRuleId(ruleId: string): Promise<RecurrenceAdjustment[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getRecurrenceAdjustmentsByRuleId not implemented', ruleId);
    return []; // 仮実装として空配列を返す
  }

  async delete(adjustmentId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteRecurrenceAdjustment not implemented', adjustmentId);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(condition: RecurrenceAdjustmentSearchCondition): Promise<RecurrenceAdjustment[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchRecurrenceAdjustments not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}