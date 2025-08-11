<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';
  import { settingsStore, getAvailableTimezones } from '$lib/stores/settings.svelte';
  import DateFormatEditor from '$lib/components/settings/date-format-editor.svelte';
  import TimeLabelsEditor from '$lib/components/settings/time-labels-editor.svelte';
  import { localeStore, getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    settings: {
      weekStart: string;
      timezone: string;
      dateFormat: string;
      customDueDays: number[];
    };
  }

  let { settings }: Props = $props();

  // 翻訳サービスを取得
  const translationService = getTranslationService();

  // Reactive messages
  const generalSettings = translationService.getMessage('general_settings');
  const language = translationService.getMessage('language');
  const weekStartsOn = translationService.getMessage('week_starts_on');
  const sunday = translationService.getMessage('sunday');
  const monday = translationService.getMessage('monday');
  const timezone = translationService.getMessage('timezone');
  const currentEffectiveTimezone = translationService.getMessage('current_effective_timezone');
  const dateFormat = translationService.getMessage('date_format');
  const preview = translationService.getMessage('preview');
  const editDateFormat = translationService.getMessage('edit_date_format');
  const addCustomDueDateButton = translationService.getMessage('add_custom_due_date_button');
  const addCustomDueDate = translationService.getMessage('add_custom_due_date');

  const availableLanguages = $derived(
    translationService.getAvailableLocales().map((locale) => ({
      value: locale,
      label: locale === 'en' ? 'English' : '日本語'
    }))
  );

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
    } catch {
      return 'Invalid format';
    }
  });

  function addCustomDueDay() {
    console.log('Add custom due day');
  }

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLocale = target.value;
    if (translationService.getAvailableLocales().includes(newLocale)) {
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

  // 初期化後のみタイムゾーンを同期（効果的でない同期を避ける）
  $effect(() => {
    // settingsStoreの値がpropsと異なる場合のみ更新
    if (settingsStore.timezone !== settings.timezone) {
      settingsStore.setTimezone(settings.timezone);
    }
  });
</script>

<section id="settings-basic">
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-lg font-medium">{generalSettings()}</h3>

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
            bind:value={settings.weekStart}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
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

        <!-- Date Format -->
        <div class="xl:col-span-3">
          <h4 class="mb-4 text-lg font-medium">{dateFormat()}</h4>

          <div class="space-y-4">
            <div>
              <label for="date-format-setting" class="mb-2 block text-sm font-medium"
                >{dateFormat()}</label
              >
              <Input
                id="date-format-setting"
                value={settings.dateFormat}
                oninput={handleDateFormatChange}
                placeholder="yyyy年MM月dd日 HH:mm:ss"
              />
            </div>

            <!-- Setting Preview -->
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">{preview()}:</span>
              <span class="bg-muted rounded px-2 py-1">{settingPreview()}</span>
            </div>

            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={openDateFormatDialog}>
                {editDateFormat()}
              </Button>
            </div>
          </div>
        </div>

        <!-- Time Labels -->
        <div class="xl:col-span-3">
          <TimeLabelsEditor />
        </div>

        <!-- Custom Due Days -->
        <div class="xl:col-span-3">
          <div class="mb-3 block text-sm font-medium">{addCustomDueDateButton()}</div>
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
  <DateFormatEditor bind:open={showDateFormatDialog} />
{/if}
