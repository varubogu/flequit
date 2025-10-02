import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence';
import type { RecurrenceRuleService } from '$lib/services/backend/recurrence-rule-service';

export class RecurrenceRuleWebService implements RecurrenceRuleService {
  async create(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createRecurrenceRule not implemented', { projectId, rule });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, ruleId: string): Promise<RecurrenceRule | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getRecurrenceRule not implemented', { projectId, ruleId });
    return null; // 仮実装としてnullを返す
  }

  async getAll(projectId: string): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getAllRecurrenceRules not implemented', { projectId });
    return []; // 仮実装として空配列を返す
  }

  async update(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateRecurrenceRule not implemented', { projectId, rule });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, ruleId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteRecurrenceRule not implemented', { projectId, ruleId });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(projectId: string, condition: RecurrenceRuleSearchCondition): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchRecurrenceRules not implemented', { projectId, condition });
    return []; // 仮実装として空配列を返す
  }
}