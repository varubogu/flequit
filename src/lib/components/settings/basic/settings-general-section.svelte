<script lang="ts">
  import Select from '$lib/components/ui/select.svelte';
  import { localeStore } from '$lib/stores/locale.svelte';
  import { getAvailableTimezones } from '$lib/stores/settings.svelte';
  import { useSettingsSection } from './hooks/use-settings-section.svelte';
  import type { WeekStart } from '$lib/types/settings';

  interface Props {
    weekStart: string;
    timezone: string;
    onWeekStartChange?: (weekStart: string) => void;
    onTimezoneChange?: (timezone: string) => void;
  }

  let { weekStart, timezone, onWeekStartChange, onTimezoneChange }: Props = $props();

  const { translationService, settingsStore } = useSettingsSection();

  // Reactive messages
  const language = translationService.getMessage('language');
  const weekStartsOn = translationService.getMessage('week_starts_on');
  const sunday = translationService.getMessage('sunday');
  const monday = translationService.getMessage('monday');
  const timezoneLabel = translationService.getMessage('timezone');
  const currentEffectiveTimezone = translationService.getMessage('current_effective_timezone');

  const availableLanguages = $derived(
    translationService.getAvailableLocales().map((locale) => ({
      value: locale,
      label: locale === 'en' ? 'English' : '日本語'
    }))
  );

  const availableTimezones = $derived(getAvailableTimezones());

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLocale = target.value;
    if (translationService.getAvailableLocales().includes(newLocale)) {
      localeStore.setLocale(newLocale);
      settingsStore.setLanguage(newLocale);
    }
  }

  function handleWeekStartChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newWeekStart = target.value as WeekStart;
    onWeekStartChange?.(newWeekStart);
    settingsStore.setWeekStart(newWeekStart);
  }

  function handleTimezoneChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newTimezone = target.value;
    onTimezoneChange?.(newTimezone);
    settingsStore.setTimezone(newTimezone);
  }
</script>

<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
  <!-- Language -->
  <div>
    <label for="language-select" class="text-sm font-medium">{language()}</label>
    <Select
      id="language-select"
      value={localeStore.locale}
      onchange={handleLanguageChange}
      class="mt-1"
    >
      {#each availableLanguages as lang (lang.value)}
        <option value={lang.value}>{lang.label}</option>
      {/each}
    </Select>
  </div>

  <!-- Week Start -->
  <div>
    <label for="week-start" class="text-sm font-medium">{weekStartsOn()}</label>
    <select
      id="week-start"
      value={weekStart}
      onchange={handleWeekStartChange}
      class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
    >
      <option value="sunday">{sunday()}</option>
      <option value="monday">{monday()}</option>
    </select>
  </div>

  <!-- Timezone -->
  <div>
    <label for="timezone-select" class="text-sm font-medium">{timezoneLabel()}</label>
    <select
      id="timezone-select"
      value={timezone}
      onchange={handleTimezoneChange}
      class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
    >
      {#each availableTimezones as tz (tz.value)}
        <option value={tz.value}>{tz.label}</option>
      {/each}
    </select>
    <p class="text-muted-foreground mt-1 text-xs">
      {currentEffectiveTimezone()}: {settingsStore.effectiveTimezone}
    </p>
  </div>
</div>
