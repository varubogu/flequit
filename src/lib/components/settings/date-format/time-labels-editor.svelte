<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import type { TimeLabel } from '$lib/types/settings';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { Trash2, Plus, Edit2 } from 'lucide-svelte';

  // 翻訳サービスを取得
  const translationService = useTranslation();

  // Reactive messages
  const timeLabels = translationService.getMessage('time_labels');
  const addTimeLabel = translationService.getMessage('add_time_label');
  const timeLabelName = translationService.getMessage('time_label_name');
  const timeLabelTime = translationService.getMessage('time_label_time');
  const add = translationService.getMessage('add');
  const edit = translationService.getMessage('edit');
  const cancel = translationService.getMessage('cancel');
  const save = translationService.getMessage('save');
  const noTimeLabels = translationService.getMessage('no_time_labels');

  // 状態管理
  let showAddForm = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formTime = $state('');

  // 時刻ラベルを時刻順でソート
  const sortedTimeLabels = $derived(
    [...settingsStore.timeLabels].sort((a, b) => a.time.localeCompare(b.time))
  );

  function showAddDialog() {
    resetForm();
    showAddForm = true;
  }

  function showEditDialog(timeLabel: TimeLabel) {
    formName = timeLabel.name;
    formTime = timeLabel.time;
    editingId = timeLabel.id;
    showAddForm = false;
  }

  function resetForm() {
    formName = '';
    formTime = '';
    editingId = null;
    showAddForm = false;
  }

  function handleSubmit() {
    if (!formName.trim() || !formTime) return;

    if (editingId) {
      settingsStore.updateTimeLabel(editingId, { name: formName.trim(), time: formTime });
    } else {
      settingsStore.addTimeLabel(formName.trim(), formTime);
    }
    resetForm();
  }

  function handleDelete(id: string) {
    settingsStore.removeTimeLabel(id);
  }

  // 時刻フォーマットの検証
  function isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  const canSubmit = $derived(formName.trim() && formTime && isValidTime(formTime));
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h4 class="text-lg font-medium">{timeLabels()}</h4>
    <Button size="sm" onclick={showAddDialog}>
      <Plus class="mr-2 h-4 w-4" />
      {addTimeLabel()}
    </Button>
  </div>

  <!-- 時刻ラベル一覧 -->
  {#if sortedTimeLabels.length === 0}
    <p class="text-muted-foreground text-sm">{noTimeLabels()}</p>
  {:else}
    <div class="space-y-2">
      {#each sortedTimeLabels as timeLabel (timeLabel.id)}
        <div class="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div class="font-medium">{timeLabel.name}</div>
            <div class="text-muted-foreground text-sm">{timeLabel.time}</div>
          </div>
          <div class="flex gap-2">
            <Button variant="ghost" size="sm" onclick={() => showEditDialog(timeLabel)}>
              <Edit2 class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onclick={() => handleDelete(timeLabel.id)}>
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- 追加・編集フォーム -->
  {#if showAddForm || editingId}
    <div class="space-y-4 rounded-lg border p-4">
      <h5 class="font-medium">
        {editingId ? edit() : add()}
        {timeLabels()}
      </h5>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="time-label-name" class="mb-1 block text-sm font-medium">
            {timeLabelName()}
          </label>
          <Input id="time-label-name" bind:value={formName} placeholder="朝食" />
        </div>

        <div>
          <label for="time-label-time" class="mb-1 block text-sm font-medium">
            {timeLabelTime()}
          </label>
          <Input id="time-label-time" type="time" bind:value={formTime} />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={resetForm}>
          {cancel()}
        </Button>
        <Button onclick={handleSubmit} disabled={!canSubmit}>
          {save()}
        </Button>
      </div>
    </div>
  {/if}
</div>
