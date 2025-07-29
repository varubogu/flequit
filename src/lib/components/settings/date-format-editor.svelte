<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';
  import { settingsStore, getAllDateFormats } from '$lib/stores/settings.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';

  interface Props {
    open: boolean;
    dateFormat: string;
    onDateFormatChange: (newFormat: string) => void;
  }

  let { open = $bindable(), dateFormat, onDateFormatChange }: Props = $props();

  // Reactive messages
  const dateFormatEditor = reactiveMessage(m.date_format_editor);
  const dateFormatLabel = reactiveMessage(m.date_format);
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
  const cancel = reactiveMessage(m.cancel);
  const save = reactiveMessage(m.save);
  const close = reactiveMessage(m.close);

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
      return format(previewDate, dateFormat);
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

  function handleDateFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onDateFormatChange(target.value);
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
    onDateFormatChange(testFormatValue);
  }

  function applyToTest() {
    testFormatValue = dateFormat;
    updateSelectedFormatFromTest();
  }

  function resetDateFormat() {
    settingsStore.resetDateFormatToDefault();
    onDateFormatChange(settingsStore.dateFormat);
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

  function closeDialog() {
    open = false;
  }

  // ダイアログが開かれた時の初期化
  $effect(() => {
    if (open) {
      // テストフォーマットは空で開始し、フォーマット選択との紐づきを明確にする
      testFormatValue = '';
      selectedFormatId = 'custom';
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background p-6 rounded-lg border max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">{dateFormatEditor()}</h2>
        <Button variant="ghost" size="sm" onclick={closeDialog}>
          {close()}
        </Button>
      </div>

      <div class="space-y-6">
        <!-- Current Setting Section -->
        <div class="space-y-3">
          <div>
            <label for="date-format-setting" class="text-sm font-medium mb-2 block">{dateFormatLabel()}</label>
            <Input
              id="date-format-setting"
              value={dateFormat}
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
          </div>
        </div>

        <!-- Arrow Buttons for Format Transfer -->
        <div class="flex items-center justify-center gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onclick={applyToTest}
            class="flex items-center justify-center w-8 h-8 p-0"
            title={applyToTestLabel()}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={applyToSetting}
            class="flex items-center justify-center w-8 h-8 p-0"
            title={applyToSettingLabel()}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
            </svg>
          </Button>
        </div>

        <!-- Test Format and Format Selection Section -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Test Format -->
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

              {#if selectedFormatId === 'custom' && testFormatValue.trim()}
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" onclick={() => showSaveDialog = true}>
                    {saveFormat()}
                  </Button>
                </div>
              {/if}
            </div>

            <!-- Format Selection -->
            <div class="space-y-3">
              <div>
                <label for="format-selection" class="text-sm font-medium mb-2 block">{formatSelection()}</label>
                <select
                  id="format-selection"
                  value={selectedFormatId}
                  onchange={handleFormatSelection}
                  class="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                  {#each allFormats as format}
                    <option value={format.id}>
                      {format.name}{format.format ? `: ${format.format}` : ''}
                    </option>
                  {/each}
                </select>
              </div>

              {#if currentSelectedFormat && !currentSelectedFormat.isStandard && selectedFormatId !== 'custom'}
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" onclick={() => startRename(selectedFormatId)}>
                    {rename()}
                  </Button>
                  <Button variant="destructive" size="sm" onclick={() => deleteCustomFormat(selectedFormatId)}>
                    {deleteLabel()}
                  </Button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Save Format Dialog -->
{#if showSaveDialog}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
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
            {cancel()}
          </Button>
          <Button onclick={saveCustomFormat} disabled={!newFormatName.trim()}>
            {save()}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Rename Format Dialog -->
{#if editingFormatId}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
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
            {cancel()}
          </Button>
          <Button onclick={saveRename} disabled={!newFormatName.trim()}>
            {save()}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
