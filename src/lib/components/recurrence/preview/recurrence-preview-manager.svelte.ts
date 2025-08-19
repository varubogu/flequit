import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { RecurrenceService } from '$lib/services/recurrence-service';
import { SvelteDate } from 'svelte/reactivity';

export class RecurrencePreviewManager {
  previewDates = $state<Date[]>([]);
  displayCount = $state(15);

  updatePreview(rule: RecurrenceRule | null, startDateTime?: Date, endDateTime?: Date) {
    try {
      if (rule) {
        const baseDate = startDateTime || endDateTime || new SvelteDate();
        const previewLimit = 20;
        this.previewDates = RecurrenceService.generateRecurrenceDates(baseDate, rule, previewLimit);
      } else {
        this.previewDates = [];
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      this.previewDates = [];
    }
  }

  clearPreview() {
    this.previewDates = [];
  }

  getPreviewDates(): Date[] {
    return this.previewDates;
  }

  getDisplayCount(): number {
    return this.displayCount;
  }

  setDisplayCount(count: number) {
    this.displayCount = count;
  }
}
