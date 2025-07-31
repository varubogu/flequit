<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import TestDateTimeInput from './test-datetime-input.svelte';
  import { format } from 'date-fns';
  import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';
  import { toast } from 'svelte-sonner';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';

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
  const cancel = reactiveMessage(m.cancel);
  const remove = reactiveMessage(m.remove);
  const formatName = reactiveMessage(m.format_name);
  const enterFormatName = reactiveMessage(m.enter_format_name);
  const close = reactiveMessage(m.close);
  const testDateTimeLabel = reactiveMessage(m.test_datetime);
  const deleteFormatTitle = reactiveMessage(m.delete_format_title);
  const deleteFormatMessage = reactiveMessage(m.delete_format_message);
  const applyDatetimeFormatToTestFormat = reactiveMessage(m.apply_datetime_format_to_test_format);
  const applyTestFormatToDatetimeFormat = reactiveMessage(m.apply_test_format_to_datetime_format);
  const addNewFormat = reactiveMessage(m.add_new_format);
  const editFormat = reactiveMessage(m.edit_format);
  const deleteFormat = reactiveMessage(m.delete);
  const saveFormatLabel = reactiveMessage(m.save_format);
  const cancelEdit = reactiveMessage(m.cancel_edit);

  // 編集モード定義
  type EditMode = 'manual' | 'new' | 'edit';
  
  // 親コンポーネント管理状態
  let testDateTime = $state(new Date());
  let testFormat = $state('');
  let testFormatName = $state('');
  let editMode = $state<EditMode>('manual');
  let editingFormatId = $state<string | null>(null);
  let deleteDialogOpen = $state(false);

  // ストア参照（リアクティブ）
  let currentFormat = $derived(dateTimeFormatStore.currentFormat);

  // 派生状態（自動更新）
  let selectedPreset = $derived(() => {
    const formats = dateTimeFormatStore.allFormats();
    
    // 編集モード時は、編集中のフォーマットを返す
    if (editMode === 'edit' && editingFormatId) {
      return formats.find((f: any) => f.id === editingFormatId) || null;
    }
    
    // 新規追加モード時は、常にカスタムを返す
    if (editMode === 'new') {
      return formats.find((f: any) => f.group === 'カスタム') || null;
    }
    
    // 手入力モード時のみ自動検索
    if (editMode === 'manual') {
      const found = formats.find((f: any) => f.format === testFormat);
      // 該当するフォーマットがない場合は「カスタム」を返す
      if (!found) {
        return formats.find((f: any) => f.group === 'カスタム') || null;
      }
      return found;
    }
    
    return null;
  });

  // フォーマット名入力の活性状態
  let formatNameEnabled = $derived(() => {
    // 手入力モードでは常に読み込み専用
    if (editMode === 'manual') {
      return false;
    }
    
    // 新規追加モードまたは編集モードでは活性
    return editMode === 'new' || editMode === 'edit';
  });

  // 新規追加ボタンは手入力モード時のみ活性
  let addButtonEnabled = $derived(() => editMode === 'manual');

  // 編集・削除ボタンはユーザーカスタムフォーマット選択時かつ手入力モードのみ活性
  let editDeleteButtonEnabled = $derived(() => {
    const preset = selectedPreset();
    return editMode === 'manual' && preset?.group === 'カスタムフォーマット';
  });

  // 保存ボタンの活性状態
  let saveButtonEnabled = $derived(() => {
    // 手入力モードでは無効
    if (editMode === 'manual') {
      return false;
    }
    
    // 新規追加モードまたは編集モードで、必要項目が入力済みの場合のみ活性
    return (editMode === 'new' || editMode === 'edit') && 
           testFormatName.trim() && testFormat.trim();
  });

  // キャンセルボタンの活性状態（新規追加または編集モード時のみ活性）
  let cancelButtonEnabled = $derived(() => {
    return editMode === 'new' || editMode === 'edit';
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
    // 手入力モード以外では自動選択を無効にする
    if (editMode !== 'manual') {
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

  // 重複チェック関数
  function checkDuplicates(formatToCheck: string, nameToCheck: string, excludeId?: string) {
    const formats = dateTimeFormatStore.allFormats();
    
    // 編集モード時は現在編集中のフォーマットを除外して重複チェック
    const filteredFormats = excludeId 
      ? formats.filter(f => f.id !== excludeId)
      : formats;
    
    // フォーマット文字列の重複チェック
    const duplicateByFormat = filteredFormats.find(f => f.format === formatToCheck);
    if (duplicateByFormat) {
      return {
        isDuplicate: true,
        type: 'format',
        existingName: duplicateByFormat.name
      };
    }
    
    // フォーマット名の重複チェック
    const duplicateByName = filteredFormats.find(f => f.name === nameToCheck);
    if (duplicateByName) {
      return {
        isDuplicate: true,
        type: 'name',
        existingFormat: duplicateByName.format
      };
    }
    
    return { isDuplicate: false };
  }

  // 統一保存処理（新規作成 or 上書き）
  function saveFormat() {
    if (testFormatName.trim() && testFormat.trim()) {
      const trimmedName = testFormatName.trim();
      const trimmedFormat = testFormat.trim();
      
      // 重複チェック（編集モード時は現在のフォーマットを除外）
      const duplicateCheck = checkDuplicates(
        trimmedFormat, 
        trimmedName, 
        editMode === 'edit' ? editingFormatId || undefined : undefined
      );
      
      if (duplicateCheck.isDuplicate) {
        if (duplicateCheck.type === 'format') {
          toast.error(`同じフォーマット文字列が既に存在します`, {
            description: `「${duplicateCheck.existingName}」で既に使用されています`
          });
        } else {
          toast.error(`同じフォーマット名が既に存在します`, {
            description: `フォーマット「${duplicateCheck.existingFormat}」で既に使用されています`
          });
        }
        return; // 保存をキャンセル
      }
      
      try {
        if (editMode === 'edit' && editingFormatId) {
          // 編集モード時は上書き
          dateTimeFormatStore.updateCustomFormat(editingFormatId, {
            name: trimmedName,
            format: trimmedFormat
          });
          // 編集モード終了
          editMode = 'manual';
          editingFormatId = null;
          toast.success('フォーマットを更新しました');
        } else {
          // 新規追加時は新規作成
          dateTimeFormatStore.addCustomFormat(trimmedName, trimmedFormat);
          toast.success('新しいフォーマットを保存しました');
          // 新規追加モード終了
          editMode = 'manual';
        }
        testFormatName = ''; // 保存後にクリア
      } catch (error) {
        console.error('Failed to save format:', error);
        toast.error('保存に失敗しました');
      }
    }
  }

  // 新規追加ボタン（新規フォーマット作成モードに設定）
  function startAddMode() {
    // 新規追加モードに変更
    editMode = 'new';
    editingFormatId = null;
    
    // テストフォーマットは現在の値を引き継ぎ、フォーマット名のみクリア
    testFormatName = '';
    
    // selectedPresetは自動的にカスタムになる
  }

  // 編集ボタン（編集モードに入る）
  function startEditMode() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      editMode = 'edit';
      editingFormatId = preset.id as string;
      testFormatName = preset.name;
      testFormat = preset.format;
    }
  }

  // キャンセルボタン（編集モードを終了）
  function cancelEditMode() {
    editMode = 'manual';
    editingFormatId = null;
    // テストフォーマット、フォーマット名はそのまま維持
    // testFormatName = ''; // コメントアウト
    // testFormat = ''; // コメントアウト
  }


  // フォーマット削除確認ダイアログを開く
  function openDeleteDialog() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      deleteDialogOpen = true;
    }
  }

  // フォーマット削除実行
  function deleteCustomFormat() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      try {
        dateTimeFormatStore.removeCustomFormat(preset.id as string);
        // 削除後はカスタムに戻る
        testFormat = '';
        testFormatName = '';
        toast.success('フォーマットを削除しました');
        deleteDialogOpen = false;
      } catch (error) {
        console.error('Failed to delete format:', error);
        toast.error('削除に失敗しました');
        deleteDialogOpen = false;
      }
    }
  }

  function closeDialog() {
    // ダイアログを閉じる前にキャンセル処理を実行
    if (editMode !== 'manual') {
      cancelEditMode();
    }
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
            <h3 class="text-sm font-medium">{testDateTimeLabel()}</h3>
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
            title={applyDatetimeFormatToTestFormat()}
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
            title={applyTestFormatToDatetimeFormat()}
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
                disabled={editMode !== 'manual'}
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
                <!-- 新規追加ボタン -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={startAddMode}
                  title={addNewFormat()}
                  disabled={!addButtonEnabled()}
                >
                  ➕
                </Button>
                
                <!-- 編集ボタン -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={startEditMode}
                  title={editFormat()}
                  disabled={!editDeleteButtonEnabled()}
                >
                  ✏️
                </Button>
                
                <!-- 削除ボタン -->
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onclick={openDeleteDialog}
                  title={deleteFormat()}
                  disabled={!editDeleteButtonEnabled()}
                >
                  🗑️
                </Button>
                
                <!-- 保存ボタン -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={saveFormat}
                  title={saveFormatLabel()}
                  disabled={!saveButtonEnabled()}
                >
                  💾
                </Button>
                
                <!-- キャンセルボタン -->
                <Button 
                  variant="outline" 
                  size="sm" 
                  onclick={cancelEditMode}
                  title={cancelEdit()}
                  disabled={!cancelButtonEnabled()}
                >
                  ❌
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>  
  </div>
{/if}

<!-- 削除確認ダイアログ -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>{deleteFormatTitle()}</AlertDialog.Title>
        <AlertDialog.Description>
          {deleteFormatMessage()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>{cancel()}</AlertDialog.Cancel>
        <AlertDialog.Action onclick={deleteCustomFormat}>{remove()}</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>