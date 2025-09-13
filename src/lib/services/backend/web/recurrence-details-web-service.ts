import type { RecurrenceDetails, RecurrenceDetailsSearchCondition } from '$lib/types/recurrence-details';
import type { RecurrenceDetailsService } from '$lib/services/backend/recurrence-details-service';

export class RecurrenceDetailsWebService implements RecurrenceDetailsService {
  async create(details: RecurrenceDetails): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createRecurrenceDetails not implemented', details);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async getByRuleId(ruleId: string): Promise<RecurrenceDetails | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getRecurrenceDetailsByRuleId not implemented', ruleId);
    return null; // 仮実装としてnullを返す
  }

  async update(details: RecurrenceDetails): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateRecurrenceDetails not implemented', details);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(detailsId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteRecurrenceDetails not implemented', detailsId);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(condition: RecurrenceDetailsSearchCondition): Promise<RecurrenceDetails[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchRecurrenceDetails not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}