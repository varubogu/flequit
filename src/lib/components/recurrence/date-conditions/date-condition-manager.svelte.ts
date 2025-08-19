import type { DateCondition } from '$lib/types/datetime-calendar';
import { generateRandomId } from '$lib/utils/id-utils';
import { SvelteDate } from 'svelte/reactivity';

export class DateConditionManager {
  conditions = $state<DateCondition[]>([]);

  addCondition() {
    const newCondition: DateCondition = {
      id: generateRandomId(),
      relation: 'before',
      reference_date: new SvelteDate()
    };
    this.conditions.push(newCondition);
  }

  removeCondition(id: string) {
    this.conditions = this.conditions.filter((c) => c.id !== id);
  }

  updateCondition(id: string, updates: Partial<DateCondition>) {
    this.conditions = this.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c));
  }

  getConditions(): DateCondition[] {
    return this.conditions;
  }

  setConditions(conditions: DateCondition[]) {
    this.conditions = conditions;
  }
}
