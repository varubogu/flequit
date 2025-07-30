<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import TestDateTimeInput from './test-datetime-input.svelte';
  import { format } from 'date-fns';
  import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  // リアクティブメッセージ
  const dateFormatEditor = reactiveMessage(m.date_format_editor);
  const dateFormatLabel = reactiveMessage(m.date_format);
  const preview = reactiveMessage(m.preview);
  const testFormatLabel = reactiveMessage(m.test_format);
  const testPreview = reactiveMessage(m.test_preview);
  const formatSelection = reactiveMessage(m.format_selection);
  const formatName = reactiveMessage(m.format_name);
  const enterFormatName = reactiveMessage(m.enter_format_name);
  const close = reactiveMessage(m.close);

  // 親コンポーネント管理状態
  let testDateTime = $state(new Date());
  let testFormat = $state('');
  let testFormatName = $state('');

  // ストア参照（リアクティブ）
  let currentFormat = $derived(dateTimeFormatStore.currentFormat);

  // 派生状態（自動更新）
  let selectedPreset = $derived(() => {
    const formats = dateTimeFormatStore.allFormats();
    return formats.find((f: any) => f.format === testFormat) || null;
  });

  let showCustomActions = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタム' || preset?.group === 'カスタムフォーマット';
  });

  let showFormatName = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタム' || preset?.group === 'カスタムフォーマット';
  });

  let showFormatNameLabel = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタムフォーマット';
  });

  let showAddButton = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタム' || preset?.group === 'カスタムフォーマット';
  });

  let showUpdateButton = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタムフォーマット';
  });

  let showDeleteButton = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタムフォーマット';
  });

  // プレビュー（派生状態）
  let dateTimeFormatPreview = $derived(() => {
    try {
      return format(testDateTime, currentFormat);
    } catch (error) {
      return 'Invalid format';
    }
  });

  let testFormatPreview = $derived(() => {
    try {
      return testFormat ? format(testDateTime, testFormat) : '';
    } catch (error) {
      return 'Invalid format';
    }
  });

  // 初期化（ダイアログ開いた時）
  let isInitialized = $state(false);
  
  $effect(() => {
    if (open && !isInitialized) {
      testFormat = dateTimeFormatStore.currentFormat;
      testDateTime = new Date(); // 現在日時で初期化
      testFormatName = '';
      isInitialized = true;
    } else if (!open) {
      isInitialized = false;
    }
  });

  // 日時フォーマット変更時（即座にストア反映）
  function handleDateTimeFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dateTimeFormatStore.setCurrentFormat(target.value);
  }

  // テストフォーマット変更時（自動選択更新）
  function handleTestFormatChange() {
    // selectedPresetが$derivedで自動更新される
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      testFormatName = preset.name;
    } else {
      testFormatName = '';
    }
  }

  // テストフォーマット選択変更時
  function handleFormatSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    
    if (selectedId === '-10') { // カスタム
      // 何もしない
      return;
    }
    
    const selectedFormat = dateTimeFormatStore.allFormats().find((f: any) => f.id.toString() === selectedId);
    if (selectedFormat) {
      testFormat = selectedFormat.format;
      if (selectedFormat.group === 'カスタムフォーマット') {
        testFormatName = selectedFormat.name;
      } else {
        testFormatName = '';
      }
    }
  }

  // ↓ボタン（日時フォーマット → テストフォーマット）
  function copyToTest() {
    testFormat = currentFormat;
  }

  // ↑ボタン（テストフォーマット → 日時フォーマット）
  function copyToMain() {
    dateTimeFormatStore.setCurrentFormat(testFormat);
  }

  // フォーマット追加
  function addCustomFormat() {
    if (testFormatName.trim() && testFormat.trim()) {
      try {
        dateTimeFormatStore.addCustomFormat(testFormatName.trim(), testFormat);
        // 追加したフォーマットを選択状態にする
        // selectedPresetが自動更新される
      } catch (error) {
        console.error('Failed to add custom format:', error);
      }
    }
  }

  // フォーマット上書き
  function updateCustomFormat() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット' && testFormatName.trim()) {
      dateTimeFormatStore.updateCustomFormat(preset.id as string, {
        name: testFormatName.trim(),
        format: testFormat
      });
    }
  }

  // フォーマット削除
  function deleteCustomFormat() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      if (confirm('削除しますか？')) {
        dateTimeFormatStore.removeCustomFormat(preset.id as string);
        // 削除後はカスタムに戻る
        testFormat = '';
        testFormatName = '';
      }
    }
  }

  function closeDialog() {
    open = false;
  }
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
        <!-- テスト日時入力 -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium">テスト日時</h3>
          <TestDateTimeInput bind:testDateTime />
        </div>

        <!-- 日時フォーマット -->
        <div class="space-y-3">
          <div>
            <label for="datetime-format" class="text-sm font-medium mb-2 block">{dateFormatLabel()}</label>
            <Input
              id="datetime-format"
              value={currentFormat}
              oninput={handleDateTimeFormatChange}
              placeholder="yyyy年MM月dd日 HH:mm:ss"
            />
          </div>

          <!-- 日時フォーマットプレビュー -->
          <div class="flex items-center gap-2 text-sm">
            <span class="font-medium">{preview()}:</span>
            <span class="px-2 py-1 bg-muted rounded">{dateTimeFormatPreview()}</span>
          </div>
        </div>

        <!-- 矢印ボタン -->
        <div class="flex items-center justify-center gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onclick={copyToTest}
            class="flex items-center justify-center w-8 h-8 p-0"
            title="日時フォーマットをテストフォーマットに反映"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={copyToMain}
            class="flex items-center justify-center w-8 h-8 p-0"
            title="テストフォーマットを日時フォーマットに反映"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
            </svg>
          </Button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- テストフォーマット -->
          <div class="space-y-3">
            <div>
              <label for="test-format" class="text-sm font-medium mb-2 block">{testFormatLabel()}</label>
              <Input
                id="test-format"
                bind:value={testFormat}
                oninput={handleTestFormatChange}
                placeholder="yyyy年MM月dd日 HH:mm:ss"
              />
            </div>

            <!-- テストフォーマットプレビュー -->
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium">{testPreview()}:</span>
              <span class="px-2 py-1 bg-muted rounded">{testFormatPreview()}</span>
            </div>
          </div>

          <!-- テストフォーマット選択 -->
          <div class="space-y-3">
            <div>
              <label for="format-selection" class="text-sm font-medium mb-2 block">{formatSelection()}</label>
              <select
                id="format-selection"
                value={selectedPreset()?.id?.toString() || ''}
                onchange={handleFormatSelection}
                class="w-full p-2 border border-input rounded-md bg-background text-foreground"
              >
                {#each dateTimeFormatStore.allFormats() as formatItem}
                  <option value={formatItem.id.toString()}>
                    {formatItem.name}{formatItem.format ? `: ${formatItem.format}` : ''}
                  </option>
                {/each}
              </select>
            </div>
          </div>
        </div>

        <!-- フォーマット名・操作ボタン -->
        {#if showCustomActions()}
          <div class="space-y-3 border-t pt-4">
            {#if showFormatNameLabel()}
              <div class="text-sm font-medium">変更前ラベル</div>
            {/if}
            
            {#if showFormatName()}
              <div>
                <label for="format-name" class="text-sm font-medium mb-2 block">{formatName()}</label>
                <Input
                  id="format-name"
                  bind:value={testFormatName}
                  placeholder={enterFormatName()}
                />
              </div>
            {/if}

            <div class="flex gap-2">
              {#if showAddButton()}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={addCustomFormat}
                  disabled={!testFormatName.trim() || !testFormat.trim()}
                >
                  フォーマット追加
                </Button>
              {/if}

              {#if showUpdateButton()}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={updateCustomFormat}
                  disabled={!testFormatName.trim()}
                >
                  フォーマット上書き
                </Button>
              {/if}

              {#if showDeleteButton()}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onclick={deleteCustomFormat}
                >
                  フォーマット削除
                </Button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>  
  </div>
{/if}