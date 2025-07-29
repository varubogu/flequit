<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';
  import { settingsStore, getAvailableTimezones, getAllDateFormats, type CustomDateFormat } from '$lib/stores/settings.svelte';
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
  const resetToDefault = reactiveMessage(m.reset_to_default);
  const preview = reactiveMessage(m.preview);
  const testFormat = reactiveMessage(m.test_format);
  const testPreview = reactiveMessage(m.test_preview);
  const formatSelection = reactiveMessage(m.format_selection);
  const saveFormat = reactiveMessage(m.save_format);
  const rename = reactiveMessage(m.rename);
  const deleteLabel = reactiveMessage(m.delete);
  const applyToSettingLabel = reactiveMessage(m.apply_to_setting);
  const applyToTestLabel = reactiveMessage(m.apply_to_test);
  const formatName = reactiveMessage(m.format_name);
  const enterFormatName = reactiveMessage(m.enter_format_name);
  const addCustomDueDateButton = reactiveMessage(m.add_custom_due_date_button);
  const addCustomDueDate = reactiveMessage(m.add_custom_due_date);

  const availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' }
  ];

  // リアクティブなタイムゾーンリスト
  const availableTimezones = $derived(getAvailableTimezones());
  
  // 全フォーマットリスト
  const allFormats = $derived(getAllDateFormats());
  
  // 状態変数
  let testFormatValue = $state('');
  let selectedFormatId = $state('');
  let showSaveDialog = $state(false);
  let newFormatName = $state('');
  let editingFormatId = $state('');
  
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
  
  // テストフォーマットプレビュー
  const testPreviewValue = $derived(() => {
    try {
      return testFormatValue ? format(previewDate, testFormatValue) : '';
    } catch (error) {
      return 'Invalid format';
    }
  });
  
  // 現在選択されているフォーマット
  const currentSelectedFormat = $derived(allFormats.find(f => f.id === selectedFormatId));

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

  function handleTestFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    testFormatValue = target.value;
    updateSelectedFormatFromTest();
  }

  function updateSelectedFormatFromTest() {
    const matchingFormat = allFormats.find(f => f.format === testFormatValue);
    selectedFormatId = matchingFormat ? matchingFormat.id : 'custom';
  }

  function handleFormatSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedFormatId = target.value;
    
    if (selectedFormatId !== 'custom') {
      const selectedFormat = allFormats.find(f => f.id === selectedFormatId);
      if (selectedFormat) {
        testFormatValue = selectedFormat.format;
      }
    }
  }

  function applyToSetting() {
    settings.dateFormat = testFormatValue;
    settingsStore.setDateFormat(testFormatValue);
  }

  function applyToTest() {
    testFormatValue = settings.dateFormat;
    updateSelectedFormatFromTest();
  }

  function resetDateFormat() {
    settingsStore.resetDateFormatToDefault();
    settings.dateFormat = settingsStore.dateFormat;
  }

  function saveCustomFormat() {
    if (newFormatName.trim() && testFormatValue.trim()) {
      const id = settingsStore.addCustomDateFormat(newFormatName.trim(), testFormatValue);
      selectedFormatId = id;
      showSaveDialog = false;
      newFormatName = '';
    }
  }

  function startRename(formatId: string) {
    const format = allFormats.find(f => f.id === formatId);
    if (format) {
      editingFormatId = formatId;
      newFormatName = format.name;
    }
  }

  function saveRename() {
    if (editingFormatId && newFormatName.trim()) {
      settingsStore.updateCustomDateFormat(editingFormatId, { name: newFormatName.trim() });
      editingFormatId = '';
      newFormatName = '';
    }
  }

  function deleteCustomFormat(formatId: string) {
    settingsStore.removeCustomDateFormat(formatId);
    if (selectedFormatId === formatId) {
      selectedFormatId = 'custom';
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
            {#each availableTimezones as tz}
              <option value={tz.value}>{tz.label}</option>
            {/each}
          </select>
          <p class="mt-1 text-xs text-muted-foreground">
            {currentEffectiveTimezone()}: {settingsStore.effectiveTimezone}
          </p>
        </div>

        <!-- Date Format -->
        <div class="xl:col-span-2">
          <h4 class="text-lg font-medium mb-4">{dateFormat()}</h4>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column: Current Setting -->
            <div class="space-y-3">
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
                <Button variant="outline" size="sm" onclick={resetDateFormat}>
                  {resetToDefault()}
                </Button>
                <Button variant="outline" size="sm" onclick={applyToTest}>
                  {applyToTestLabel()}
                </Button>
              </div>
            </div>

            <!-- Right Column: Test Format -->
            <div class="space-y-3">
              <div>
                <label for="test-format" class="text-sm font-medium mb-2 block">{testFormat()}</label>
                <Input
                  id="test-format"
                  value={testFormatValue}
                  oninput={handleTestFormatChange}
                  placeholder="yyyy年MM月dd日 HH:mm:ss"
                />
              </div>
              
              <!-- Test Preview -->
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium">{testPreview()}:</span>
                <span class="px-2 py-1 bg-muted rounded">{testPreviewValue()}</span>
              </div>

              <div class="flex gap-2">
                <Button variant="outline" size="sm" onclick={applyToSetting}>
                  {applyToSettingLabel()}
                </Button>
                {#if selectedFormatId === 'custom' && testFormatValue.trim()}
                  <Button variant="outline" size="sm" onclick={() => showSaveDialog = true}>
                    {saveFormat()}
                  </Button>
                {/if}
              </div>
            </div>
          </div>

          <!-- Format Selection -->
          <div class="mt-6">
            <label for="format-selection" class="text-sm font-medium mb-2 block">{formatSelection()}</label>
            <div class="flex items-center gap-3">
              <select
                id="format-selection"
                value={selectedFormatId}
                onchange={handleFormatSelection}
                class="flex-1 p-2 border border-input rounded-md bg-background text-foreground"
              >
                {#each allFormats as format}
                  <option value={format.id}>{format.name}</option>
                {/each}
              </select>
              
              {#if currentSelectedFormat && !currentSelectedFormat.isStandard && selectedFormatId !== 'custom'}
                <Button variant="outline" size="sm" onclick={() => startRename(selectedFormatId)}>
                  {rename()}
                </Button>
                <Button variant="destructive" size="sm" onclick={() => deleteCustomFormat(selectedFormatId)}>
                  {deleteLabel()}
                </Button>
              {/if}
            </div>
          </div>
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

<!-- Save Format Dialog -->
{#if showSaveDialog}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background p-6 rounded-lg border max-w-md w-full mx-4">
      <h3 class="text-lg font-medium mb-4">{saveFormat()}</h3>
      <div class="space-y-4">
        <div>
          <label for="new-format-name" class="text-sm font-medium block mb-2">{formatName()}</label>
          <Input
            id="new-format-name"
            bind:value={newFormatName}
            placeholder={enterFormatName()}
          />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" onclick={() => showSaveDialog = false}>
            {reactiveMessage(m.cancel)()}
          </Button>
          <Button onclick={saveCustomFormat} disabled={!newFormatName.trim()}>
            {reactiveMessage(m.save)()}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Rename Format Dialog -->
{#if editingFormatId}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background p-6 rounded-lg border max-w-md w-full mx-4">
      <h3 class="text-lg font-medium mb-4">{rename()}</h3>
      <div class="space-y-4">
        <div>
          <label for="edit-format-name" class="text-sm font-medium block mb-2">{formatName()}</label>
          <Input
            id="edit-format-name"
            bind:value={newFormatName}
            placeholder={enterFormatName()}
          />
        </div>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" onclick={() => editingFormatId = ''}>
            {reactiveMessage(m.cancel)()}
          </Button>
          <Button onclick={saveRename} disabled={!newFormatName.trim()}>
            {reactiveMessage(m.save)()}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
