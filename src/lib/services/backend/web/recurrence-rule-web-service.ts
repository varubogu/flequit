import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence-rule';
import type { RecurrenceRuleService } from '$lib/services/backend/recurrence-rule-service';

export class RecurrenceRuleWebService implements RecurrenceRuleService {
  async create(rule: RecurrenceRule): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createRecurrenceRule not implemented', rule);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(ruleId: string): Promise<RecurrenceRule | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getRecurrenceRule not implemented', ruleId);
    return null; // 仮実装としてnullを返す
  }

  async getAll(): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getAllRecurrenceRules not implemented');
    return []; // 仮実装として空配列を返す
  }

  async update(rule: RecurrenceRule): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateRecurrenceRule not implemented', rule);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(ruleId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteRecurrenceRule not implemented', ruleId);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(condition: RecurrenceRuleSearchCondition): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchRecurrenceRules not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}