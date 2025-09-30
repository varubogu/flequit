import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';
import type { SubtaskRecurrenceService } from '$lib/services/backend/subtask-recurrence-service';

export class SubtaskRecurrenceWebService implements SubtaskRecurrenceService {
  async create(subtaskRecurrence: SubtaskRecurrence): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskRecurrence not implemented', subtaskRecurrence);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async getBySubtaskId(subtaskId: string): Promise<SubtaskRecurrence | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getSubtaskRecurrenceBySubtaskId not implemented', subtaskId);
    return null; // 仮実装としてnullを返す
  }

  async delete(subtaskId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskRecurrence not implemented', subtaskId);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(condition: SubtaskRecurrenceSearchCondition): Promise<SubtaskRecurrence[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchSubtaskRecurrences not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}