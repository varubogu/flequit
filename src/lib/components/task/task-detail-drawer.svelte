<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer';
  import TaskDetail from './task-detail.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  // Reactive messages - 一時的にハードコーディング
  const taskDetails = () => 'タスク詳細';
  const close = () => '閉じる';

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
  <Drawer.Content class="h-[85vh]">
    <div class="mx-auto w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title>{taskDetails()}</Drawer.Title>
        <Drawer.Description class="sr-only">
          タスクの詳細情報を表示・編集します
        </Drawer.Description>
      </Drawer.Header>
      
      <div class="px-4 pb-4 overflow-auto flex-1">
        {#if hasSelectedTask || open}
          <TaskDetail />
        {:else}
          <div class="text-center text-muted-foreground py-8">
            <p>タスクが選択されていません</p>
          </div>
        {/if}
      </div>

      <Drawer.Footer>
        <button 
          onclick={onClose}
          class="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          {close()}
        </button>
      </Drawer.Footer>
    </div>
  </Drawer.Content>
</Drawer.Root>