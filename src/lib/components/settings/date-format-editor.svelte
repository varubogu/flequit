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
  const formatSelection = reactiveMessage(m.format_selection);
  const formatName = reactiveMessage(m.format_name);
  const enterFormatName = reactiveMessage(m.enter_format_name);
  const close = reactiveMessage(m.close);

  // 親コンポーネント管理状態
  let testDateTime = $state(new Date());
  let testFormat = $state('');
  let testFormatName = $state('');
  let isEditMode = $state(false);
  let editingFormatId = $state<string | null>(null);

  // ストア参照（リアクティブ）
  let currentFormat = $derived(dateTimeFormatStore.currentFormat);

  // 派生状態（自動更新）
  let selectedPreset = $derived(() => {
    const formats = dateTimeFormatStore.allFormats();
    
    // 編集モード時は、編集中のフォーマットを返す
    if (isEditMode && editingFormatId) {
      return formats.find((f: any) => f.id === editingFormatId) || null;
    }
    
    const found = formats.find((f: any) => f.format === testFormat);
    // 該当するフォーマットがない場合は「カスタム」を返す
    if (!found) {
      return formats.find((f: any) => f.group === 'カスタム') || null;
    }
    return found;
  });

  // フォーマット名入力の活性状態
  let formatNameEnabled = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタム' || (preset?.group === 'カスタムフォーマット' && isEditMode);
  });

  // 新規追加ボタンは常に活性
  let addButtonEnabled = $derived(() => true);

  // 編集・削除ボタンはユーザーカスタムフォーマット選択時のみ活性
  let editDeleteButtonEnabled = $derived(() => {
    const preset = selectedPreset();
    return preset?.group === 'カスタムフォーマット';
  });

  // 保存ボタンの活性状態
  let saveButtonEnabled = $derived(() => {
    const preset = selectedPreset();
    
    if (preset?.group === 'カスタム') {
      // カスタム選択時：テストフォーマットとフォーマット名が入力済みの場合のみ活性
      return testFormatName.trim() && testFormat.trim();
    } else if (preset?.group === 'カスタムフォーマット') {
      // ユーザー定義カスタムフォーマット選択時：編集モードの場合のみ活性
      return isEditMode && testFormatName.trim() && testFormat.trim();
    }
    
    return false;
  });

  // キャンセルボタンの活性状態（編集モード時のみ活性）
  let cancelButtonEnabled = $derived(() => {
    return isEditMode;
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
    // 編集モード中は自動選択を無効にする
    if (isEditMode) {
      return;
    }
    
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

  // 統一保存処理（新規作成 or 上書き）
  function saveFormat() {
    if (testFormatName.trim() && testFormat.trim()) {
      try {
        if (isEditMode && editingFormatId) {
          // 編集モード時は上書き
          dateTimeFormatStore.updateCustomFormat(editingFormatId, {
            name: testFormatName.trim(),
            format: testFormat
          });
          // 編集モード終了
          isEditMode = false;
          editingFormatId = null;
        } else {
          // 通常時は新規作成
          dateTimeFormatStore.addCustomFormat(testFormatName.trim(), testFormat);
        }
        testFormatName = ''; // 保存後にクリア
      } catch (error) {
        console.error('Failed to save format:', error);
      }
    }
  }

  // 新規追加ボタン（新規フォーマット作成モードに設定）
  function startAddMode() {
    // 編集モードを終了（もしあれば）
    isEditMode = false;
    editingFormatId = null;
    
    // フィールドをクリアして新規作成準備
    testFormat = '';
    testFormatName = '';
    
    // カスタムを選択状態にする（新規作成用）
    // selectedPresetは自動的にカスタムになる
  }

  // 編集ボタン（編集モードに入る）
  function startEditMode() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      isEditMode = true;
      editingFormatId = preset.id as string;
      testFormatName = preset.name;
      testFormat = preset.format;
    }
  }

  // キャンセルボタン（編集モードを終了）
  function cancelEditMode() {
    isEditMode = false;
    editingFormatId = null;
    testFormatName = '';
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
        <div>
          <div class="flex items-center gap-4 mb-2">
            <h3 class="text-sm font-medium">テスト日時</h3>
            <TestDateTimeInput bind:testDateTime />
          </div>
        </div>

        <!-- 日時フォーマット -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <!-- テストフォーマットと選択 -->
        <div class="space-y-4">
          <!-- テストフォーマット入力とプレビュー -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <span class="font-medium">{preview()}:</span>
              <span class="px-2 py-1 bg-muted rounded">{testFormatPreview()}</span>
            </div>
          </div>

          <!-- フォーマット選択行 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- テストフォーマット選択 -->
            <div>
              <label for="format-selection" class="text-sm font-medium mb-2 block">{formatSelection()}</label>
              <select
                id="format-selection"
                value={selectedPreset()?.id?.toString() || ''}
                onchange={handleFormatSelection}
                disabled={isEditMode}
                class="w-full p-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#each dateTimeFormatStore.allFormats() as formatItem}
                  <option value={formatItem.id.toString()}>
                    {formatItem.name}{formatItem.format ? `: ${formatItem.format}` : ''}
                  </option>
                {/each}
              </select>
            </div>

            <!-- フォーマット名・操作ボタン（常時表示） -->
            <div class="space-y-3">
              <!-- フォーマット名入力 -->
              <div>
                <label for="format-name" class="text-sm font-medium mb-2 block">{formatName()}</label>
                <input
                  id="format-name"
                  bind:value={testFormatName}
                  placeholder={enterFormatName()}
                  disabled={!formatNameEnabled()}
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <!-- ボタン群（常時表示） -->
              <div class="flex gap-2 flex-wrap">
                <!-- 新規追加ボタン（常に活性） -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={startAddMode}
                  title="新規追加"
                  disabled={!addButtonEnabled()}
                >
                  ➕
                </Button>
                
                <!-- 編集ボタン（ユーザーカスタムフォーマット選択時のみ活性） -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={startEditMode}
                  title="編集"
                  disabled={!editDeleteButtonEnabled() || isEditMode}
                >
                  ✏️
                </Button>
                
                <!-- 保存ボタン（統一：新規作成 or 上書き） -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={saveFormat}
                  title="保存"
                  disabled={!saveButtonEnabled()}
                >
                  💾
                </Button>
                
                <!-- キャンセルボタン（編集モード時のみ活性） -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={cancelEditMode}
                  title="キャンセル"
                  disabled={!cancelButtonEnabled()}
                >
                  ❌
                </Button>
                
                <!-- 削除ボタン（ユーザーカスタムフォーマット選択時のみ活性） -->
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onclick={deleteCustomFormat}
                  title="削除"
                  disabled={!editDeleteButtonEnabled() || isEditMode}
                >
                  🗑️
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>  
  </div>
{/if}