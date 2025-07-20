interface Settings {
  timezone: string; // 'system' または IANA timezone identifier
}

class SettingsStore {
  private settings = $state<Settings>({
    timezone: 'system'
  });

  get timezone() {
    return this.settings.timezone;
  }

  get effectiveTimezone() {
    if (this.settings.timezone === 'system') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return this.settings.timezone;
  }

  setTimezone(timezone: string) {
    this.settings.timezone = timezone;
    this.saveSettings();
  }

  private saveSettings() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flequit-settings', JSON.stringify(this.settings));
    }
  }

  private loadSettings() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('flequit-settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.settings = { ...this.settings, ...parsed };
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    }
  }

  constructor() {
    this.loadSettings();
  }
}

export const settingsStore = new SettingsStore();

// 利用可能なタイムゾーンのリスト
export const AVAILABLE_TIMEZONES = [
  { value: 'system', label: 'OSのタイムゾーン' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' }
];