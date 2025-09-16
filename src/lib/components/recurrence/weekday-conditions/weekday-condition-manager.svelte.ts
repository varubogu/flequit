import type { WeekdayCondition } from '$lib/types/datetime-calendar';
import { generateRandomId } from '$lib/utils/id-utils';

export class WeekdayConditionManager {
  conditions = $state<WeekdayCondition[]>([]);

  addCondition() {
    const newCondition: WeekdayCondition = {
      id: generateRandomId(),
      ifWeekday: 'monday',
      thenDirection: 'next',
      thenTarget: 'weekday'
    };
    this.conditions.push(newCondition);
  }

  removeCondition(id: string) {
    this.conditions = this.conditions.filter((c) => c.id !== id);
  }

  updateCondition(id: string, updates: Partial<WeekdayCondition>) {
    this.conditions = this.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c));
  }

  getConditions(): WeekdayCondition[] {
    return this.conditions;
  }

  setConditions(conditions: WeekdayCondition[]) {
    this.conditions = conditions;
  }
}
