import type { Settings, Theme, WeekStart } from '$lib/types/settings';

export const DEFAULT_VIEW_ITEMS: Settings['viewItems'] = [
  { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
  { id: 'overdue', label: 'Overdue', icon: '🚨', visible: true, order: 1 },
  { id: 'today', label: 'Today', icon: '📅', visible: true, order: 2 },
  { id: 'tomorrow', label: 'Tomorrow', icon: '📆', visible: true, order: 3 },
  { id: 'completed', label: 'Completed', icon: '✅', visible: true, order: 4 },
  { id: 'next3days', label: 'Next 3 Days', icon: '📋', visible: false, order: 5 },
  { id: 'nextweek', label: 'Next Week', icon: '📊', visible: false, order: 6 },
  { id: 'thismonth', label: 'This Month', icon: '📅', visible: false, order: 7 }
];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system' as Theme,
  language: 'ja',
  font: 'default',
  fontSize: 13,
  fontColor: 'default',
  backgroundColor: 'default',
  weekStart: 'sunday' as WeekStart,
  timezone: 'system',
  dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
  customDueDays: [],
  customDateFormats: [],
  timeLabels: [],
  dueDateButtons: {
    overdue: true,
    today: true,
    tomorrow: true,
    threeDays: false,
    thisWeek: true,
    thisMonth: true,
    thisQuarter: false,
    thisYear: false,
    thisYearEnd: false
  },
  viewItems: [...DEFAULT_VIEW_ITEMS],
  lastSelectedAccount: ''
};

export const SETTINGS_STORAGE_KEY = 'flequit-settings';

export function applySettingsPatch(target: Settings, patch: Partial<Settings>) {
  const source: Partial<Settings> = patch;
  if (source.theme !== undefined) target.theme = source.theme;
  if (source.language !== undefined) target.language = source.language;
  if (source.font !== undefined) target.font = source.font;
  if (source.fontSize !== undefined) target.fontSize = source.fontSize;
  if (source.fontColor !== undefined) target.fontColor = source.fontColor;
  if (source.backgroundColor !== undefined) target.backgroundColor = source.backgroundColor;
  if (source.weekStart !== undefined) target.weekStart = source.weekStart;
  if (source.timezone !== undefined) target.timezone = source.timezone;
  if (source.dateFormat !== undefined) target.dateFormat = source.dateFormat;
  if (source.customDueDays !== undefined) target.customDueDays = [...source.customDueDays];
  if (source.customDateFormats !== undefined)
    target.customDateFormats = [...source.customDateFormats];
  if (source.timeLabels !== undefined) target.timeLabels = [...source.timeLabels];
  if (source.dueDateButtons !== undefined)
    target.dueDateButtons = {
      ...target.dueDateButtons,
      ...source.dueDateButtons
    };
  if (source.viewItems !== undefined) target.viewItems = [...source.viewItems];
  if (source.lastSelectedAccount !== undefined)
    target.lastSelectedAccount = source.lastSelectedAccount;
}
