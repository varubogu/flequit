type EditableItem = {
  id: string;
  title: string;
  description?: string;
  planStartDate?: Date;
  planEndDate?: Date;
  isRangeDate?: boolean;
  priority?: number;
  recurrenceRule?: { unit: string; interval: number };
} | null;

export function createEditableView(initial: EditableItem = {
  id: 'task-1',
  title: 'Original',
  description: 'notes',
  priority: 2,
  isRangeDate: false
}) {
  let currentItem = $state<EditableItem>(initial);
  let lastSyncedTaskId = $state<string | undefined>(undefined);
  let isNewTaskMode = $state(false);
  let isSubTask = $state(false);

  return {
    get currentItem() {
      return currentItem;
    },
    set currentItem(value: EditableItem) {
      currentItem = value;
    },
    get lastSyncedTaskId() {
      return lastSyncedTaskId;
    },
    get isNewTaskMode() {
      return isNewTaskMode;
    },
    set isNewTaskMode(value: boolean) {
      isNewTaskMode = value;
    },
    get isSubTask() {
      return isSubTask;
    },
    set isSubTask(value: boolean) {
      isSubTask = value;
    },
    setLastSyncedTaskId(itemId: string | undefined) {
      lastSyncedTaskId = itemId;
    }
  };
}
