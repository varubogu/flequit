<script lang="ts">
  import TimeLabelsEditor from '$lib/components/settings/date-format/time-labels-editor.svelte';
  import SettingsGeneralSection from './settings-general-section.svelte';
  import SettingsDateFormatSection from './settings-date-format-section.svelte';
  import SettingsCustomDueDaysSection from './settings-custom-due-days-section.svelte';
  import { useSettingsSection } from './hooks/use-settings-section.svelte';

  interface Props {
    settings: {
      weekStart: string;
      timezone: string;
      dateFormat: string;
      customDueDays: number[];
    };
    onWeekStartChange?: (weekStart: string) => void;
    onTimezoneChange?: (timezone: string) => void;
  }

  let { settings, onWeekStartChange, onTimezoneChange }: Props = $props();

  const { translationService, settingsStore } = useSettingsSection();

  // Reactive message
  const generalSettings = translationService.getMessage('general_settings');

  // settingsStoreとの同期
  $effect(() => {
    const currentWeekStart = settingsStore.weekStart;
    if (settings.weekStart !== currentWeekStart) {
      settings.weekStart = currentWeekStart;
    }

    const currentTimezone = settingsStore.timezone;
    if (settings.timezone !== currentTimezone) {
      settings.timezone = currentTimezone;
    }

    const currentDateFormat = settingsStore.dateFormat;
    if (settings.dateFormat !== currentDateFormat) {
      settings.dateFormat = currentDateFormat;
    }
  });
</script>

<section id="settings-basic">
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-lg font-medium">{generalSettings()}</h3>

      <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        <!-- General Settings -->
        <SettingsGeneralSection
          weekStart={settings.weekStart}
          timezone={settings.timezone}
          {onWeekStartChange}
          {onTimezoneChange}
        />

        <!-- Date Format -->
        <SettingsDateFormatSection dateFormat={settings.dateFormat} />

        <!-- Time Labels -->
        <div class="xl:col-span-3">
          <TimeLabelsEditor />
        </div>

        <!-- Custom Due Days -->
        <SettingsCustomDueDaysSection />
      </div>
    </div>
  </div>
</section>
