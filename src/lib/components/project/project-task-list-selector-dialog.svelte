<script lang="ts">
  import type { Project, TaskList } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    open?: boolean;
    currentProjectId?: string;
    currentTaskListId?: string;
    onSave?: (data: { projectId: string; taskListId: string }) => void;
    onClose?: () => void;
  }

  let {
    open = false,
    currentProjectId = '',
    currentTaskListId = '',
    onSave,
    onClose
  }: Props = $props();

  // Reactive messages
  const selectProjectAndTaskList = reactiveMessage(m.select_project_and_task_list);
  const project = reactiveMessage(m.project);
  const taskList = reactiveMessage(m.task_list);
  const save = reactiveMessage(m.save);
  const cancel = reactiveMessage(m.cancel);

  let selectedProjectId = $state(currentProjectId);
  let selectedTaskListId = $state(currentTaskListId);
  let availableTaskLists = $derived(
    selectedProjectId
      ? taskStore.projects.find(p => p.id === selectedProjectId)?.task_lists || []
      : []
  );

  $effect(() => {
    selectedProjectId = currentProjectId;
    selectedTaskListId = currentTaskListId;
  });

  $effect(() => {
    // Reset task list selection when project changes
    if (selectedProjectId !== currentProjectId) {
      selectedTaskListId = '';
    }
  });

  function handleSave() {
    if (selectedProjectId && selectedTaskListId && onSave) {
      onSave({ projectId: selectedProjectId, taskListId: selectedTaskListId });
    }
  }

  function handleClose() {
    onClose?.();
  }
</script>

<Dialog.Root {open}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{selectProjectAndTaskList()}</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- プロジェクト選択 -->
      <div>
        <label for="project-select" class="text-sm font-medium mb-2 block">{project()}</label>
        <select
          id="project-select"
          bind:value={selectedProjectId}
          class="w-full px-3 py-2 border rounded-md text-sm"
        >
          <option value="">プロジェクトを選択</option>
          {#each taskStore.projects as proj (proj.id)}
            <option value={proj.id}>{proj.name}</option>
          {/each}
        </select>
      </div>

      <!-- タスクリスト選択 -->
      <div>
        <label for="tasklist-select" class="text-sm font-medium mb-2 block">{taskList()}</label>
        <select
          id="tasklist-select"
          bind:value={selectedTaskListId}
          disabled={!selectedProjectId}
          class="w-full px-3 py-2 border rounded-md text-sm disabled:opacity-50"
        >
          <option value="">タスクリストを選択</option>
          {#each availableTaskLists as list (list.id)}
            <option value={list.id}>{list.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <Dialog.Footer class="mt-6">
      <Button variant="outline" onclick={handleClose}>
        {cancel()}
      </Button>
      <Button
        onclick={handleSave}
        disabled={!selectedProjectId || !selectedTaskListId}
      >
        {save()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
