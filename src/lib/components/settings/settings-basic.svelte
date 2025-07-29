<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';
  import { settingsStore, getAvailableTimezones } from '$lib/stores/settings.svelte';
  import DateFormatEditor from '$lib/components/settings/date-format-editor.svelte';
  import { locales } from '$paraglide/runtime';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';

  interface Props {
    settings: {
      weekStart: string;
      timezone: string;
      dateFormat: string;
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
  const dateFormat = reactiveMessage(m.date_format);
  const dateFormatHelp = reactiveMessage(m.date_format_help);
  const preview = reactiveMessage(m.preview);
  const editDateFormat = reactiveMessage(m.edit_date_format);
  const addCustomDueDateButton = reactiveMessage(m.add_custom_due_date_button);
  const addCustomDueDate = reactiveMessage(m.add_custom_due_date);

  const availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' }
  ];

  // リアクティブなタイムゾーンリスト
  const availableTimezones = $derived(getAvailableTimezones());
  
  // 状態変数
  let showDateFormatDialog = $state(false);
  
  // プレビュー用の現在時刻
  let previewDate = new Date();
  
  // 設定フォーマットプレビュー
  const settingPreview = $derived(() => {
    try {
      return format(previewDate, settings.dateFormat);
    } catch (error) {
      return 'Invalid format';
    }
  });

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

  function handleDateFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    settings.dateFormat = target.value;
    settingsStore.setDateFormat(target.value);
  }

  function openDateFormatDialog() {
    showDateFormatDialog = true;
  }


  $effect(() => {
    settingsStore.setTimezone(settings.timezone);
  });
</script>

<section id="settings-basic">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">{generalSettings()}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
            {#each availableTimezones as tz}
              <option value={tz.value}>{tz.label}</option>
            {/each}
          </select>
          <p class="mt-1 text-xs text-muted-foreground">
            {currentEffectiveTimezone()}: {settingsStore.effectiveTimezone}
          </p>
        </div>

        <!-- Date Format -->
        <div class="xl:col-span-3">
          <h4 class="text-lg font-medium mb-4">{dateFormat()}</h4>
          
          <div class="space-y-4">
            <div>
              <label for="date-format-setting" class="text-sm font-medium mb-2 block">{dateFormat()}</label>
              <Input
                id="date-format-setting"
                value={settings.dateFormat}
                oninput={handleDateFormatChange}
                placeholder="yyyy年MM月dd日 HH:mm:ss"
              />
              <p class="text-xs text-muted-foreground mt-1">{dateFormatHelp()}</p>
            </div>
            
            <!-- Setting Preview -->
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">{preview()}:</span>
              <span class="px-2 py-1 bg-muted rounded">{settingPreview()}</span>
            </div>
            
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={openDateFormatDialog}>
                {editDateFormat()}
              </Button>
            </div>
          </div>
        </div>

        <!-- Custom Due Days -->
        <div class="xl:col-span-3">
          <div class="text-sm font-medium mb-3 block">{addCustomDueDateButton()}</div>
          <Button variant="outline" onclick={addCustomDueDay}>
            {addCustomDueDate()}
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Date Format Editor Dialog -->
{#if showDateFormatDialog}
  <DateFormatEditor 
    bind:open={showDateFormatDialog}
    dateFormat={settings.dateFormat}
    onDateFormatChange={(newFormat: string) => {
      settings.dateFormat = newFormat;
      settingsStore.setDateFormat(newFormat);
    }}
  />
{/if}
