<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer';
  import TaskDetail from './task-detail.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  // タスクが選択されているかどうか
  let hasSelectedTask = $derived(
    !!taskStore.selectedTask || !!taskStore.selectedSubTask || taskStore.isNewTaskMode
  );

  // Drawerが閉じられたときの処理
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }
</script>

<Drawer.Root {open} onOpenChange={handleOpenChange}>
  <Drawer.Content class="flex h-[85vh] flex-col">
    <div class="mx-auto flex h-full w-full max-w-lg flex-col">
      <div class="flex-1 overflow-auto px-2">
        {#if hasSelectedTask || open}
          <TaskDetail isDrawerMode={true} />
        {:else}
          <div class="text-muted-foreground py-8 text-center">
            <p>タスクが選択されていません</p>
          </div>
        {/if}
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
