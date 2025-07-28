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
  let hasSelectedTask = $derived(!!taskStore.selectedTask || !!taskStore.selectedSubTask || taskStore.isNewTaskMode);

  // Drawerが閉じられたときの処理
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }
</script>

<Drawer.Root {open} onOpenChange={handleOpenChange}>
  <Drawer.Content class="h-[85vh] flex flex-col">
    <div class="flex flex-col h-full max-w-sm mx-auto w-full">
      <div class="flex-1 overflow-auto px-4">
        {#if hasSelectedTask || open}
          <TaskDetail isDrawerMode={true} />
        {:else}
          <div class="text-center text-muted-foreground py-8">
            <p>タスクが選択されていません</p>
          </div>
        {/if}
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>