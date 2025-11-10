import type { Setting, Settings } from '$lib/types/settings';
import type { Tag } from '$lib/types/tag';
import type { TaskWithSubTasks } from '$lib/types/task';

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

export const buildSetting = (overrides: Partial<Setting> = {}): Setting => {
  const base: Setting = {
    id: nextId('setting'),
    key: `app.${sequence}`,
    value: 'value',
    dataType: 'string',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z')
  };
  return {
    ...base,
    ...overrides
  };
};

const buildDueDateButtons = () => ({
  overdue: true,
  today: true,
  tomorrow: true,
  threeDays: true,
  thisWeek: true,
  thisMonth: true,
  thisQuarter: false,
  thisYear: false,
  thisYearEnd: false
});

export const buildSettings = (overrides: Partial<Settings> = {}): Settings => {
  const baseButtons = buildDueDateButtons();

  const base: Settings = {
    theme: 'system',
    language: 'en',
    font: 'system-ui',
    fontSize: 14,
    fontColor: '#333333',
    backgroundColor: '#ffffff',
    weekStart: 'monday',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    customDueDays: [1, 3, 7],
    customDateFormats: [],
    timeLabels: [],
    dueDateButtons: buildDueDateButtons(),
    viewItems: [],
    lastSelectedAccount: 'account-default'
  };

  return {
    ...base,
    ...overrides,
    dueDateButtons: {
      ...baseButtons,
      ...(overrides.dueDateButtons ?? {})
    }
  };
};

export const buildTag = (overrides: Partial<Tag> = {}): Tag => {
  const now = new Date('2025-01-01T00:00:00.000Z');
  const base: Tag = {
    id: nextId('tag'),
    name: 'New Tag',
    color: '#00ff00',
    createdAt: new Date(now),
    updatedAt: new Date(now),
    deleted: false,
    updatedBy: 'test-user-id'
  };

  return {
    ...base,
    ...overrides
  };
};

export const buildTaskWithSubTasks = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => {
  const now = new Date('2025-01-15T12:00:00.000Z');
  const base: TaskWithSubTasks = {
    id: nextId('task'),
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Sample task',
    description: 'Sample description',
    status: 'not_started',
    priority: 1,
    assignedUserIds: [],
    tagIds: [],
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    deleted: false,
    updatedBy: 'test-user-id',
    tags: [],
    subTasks: []
  };

  return {
    ...base,
    ...overrides,
    tags: overrides.tags ?? base.tags,
    subTasks: overrides.subTasks ?? base.subTasks
  };
};
