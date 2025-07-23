<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { settingsStore, AVAILABLE_TIMEZONES } from '$lib/stores/settings.svelte';
  import { locales } from '$paraglide/runtime';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';

  interface Props {
    settings: {
      weekStart: string;
      timezone: string;
      customDueDays: number[];
    };
  }

  let { settings }: Props = $props();

  // Reactive messages
  const generalSettings = reactiveMessage(m.general_settings);
  const language = reactiveMessage(m.language);
  const weekStartsOn = reactiveMessage(m.week_starts_on);
  const sunday = reactiveMessage(m.sunday);
  const monday = reactiveMessage(m.monday);
  const timezone = reactiveMessage(m.timezone);
  const currentEffectiveTimezone = reactiveMessage(m.current_effective_timezone);
  const addCustomDueDateButton = reactiveMessage(m.add_custom_due_date_button);
  const addCustomDueDate = reactiveMessage(m.add_custom_due_date);

  const availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' }
  ];

  function addCustomDueDay() {
    console.log('Add custom due day');
  }

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLocale = target.value;
    if (locales.includes(newLocale as any)) {
      localeStore.setLocale(newLocale);
    }
  }

  $effect(() => {
    settingsStore.setTimezone(settings.timezone);
  });
</script>

<section id="settings-basic">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">{generalSettings()}</h3>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- Language -->
        <div>
          <label for="language-select" class="text-sm font-medium">{language()}</label>
          <Select 
            id="language-select"
            value={localeStore.locale}
            onchange={handleLanguageChange}
            class="mt-1"
          >
            {#each availableLanguages as lang}
              <option value={lang.value}>{lang.label}</option>
            {/each}
          </Select>
        </div>

        <!-- Week Start -->
        <div>
          <label for="week-start" class="text-sm font-medium">{weekStartsOn()}</label>
          <select 
            id="week-start" 
            bind:value={settings.weekStart} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="sunday">{sunday()}</option>
            <option value="monday">{monday()}</option>
          </select>
        </div>

        <!-- Timezone -->
        <div>
          <label for="timezone-select" class="text-sm font-medium">{timezone()}</label>
          <select 
            id="timezone-select" 
            bind:value={settings.timezone} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            {#each AVAILABLE_TIMEZONES as tz}
              <option value={tz.value}>{tz.label}</option>
            {/each}
          </select>
          <p class="mt-1 text-xs text-muted-foreground">
            {currentEffectiveTimezone()}: {settingsStore.effectiveTimezone}
          </p>
        </div>

        <!-- Custom Due Days -->
        <div class="xl:col-span-2">
          <div class="text-sm font-medium mb-3 block">{addCustomDueDateButton()}</div>
          <Button variant="outline" onclick={addCustomDueDay}>
            {addCustomDueDate()}
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>