import type {
  RecurrenceRule,
  RecurrenceRulePatch,
  RecurrenceRuleSearchCondition
} from '$lib/types/recurrence';
import type { RecurrenceRuleService } from '$lib/infrastructure/backends/recurrence-rule-service';

export class RecurrenceRuleWebService implements RecurrenceRuleService {
  async create(projectId: string, rule: RecurrenceRule, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createRecurrenceRule not implemented', { projectId, rule, userId });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, ruleId: string, userId: string): Promise<RecurrenceRule | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getRecurrenceRule not implemented', { projectId, ruleId, userId });
    return null; // 仮実装としてnullを返す
  }

  async getAll(projectId: string, userId: string): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getAllRecurrenceRules not implemented', { projectId, userId });
    return []; // 仮実装として空配列を返す
  }

  async update(
    projectId: string,
    ruleId: string,
    patch: RecurrenceRulePatch,
    userId: string
  ): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateRecurrenceRule not implemented', {
      projectId,
      ruleId,
      patch,
      userId
    });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, ruleId: string, userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteRecurrenceRule not implemented', {
      projectId,
      ruleId,
      userId
    });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(
    projectId: string,
    condition: RecurrenceRuleSearchCondition
  ): Promise<RecurrenceRule[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: searchRecurrenceRules not implemented', { projectId, condition });
    return []; // 仮実装として空配列を返す
  }
}
