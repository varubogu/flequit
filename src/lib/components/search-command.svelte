<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search } from "lucide-svelte";
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskService } from '$lib/services/task-service';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = false, onOpenChange }: Props = $props();

  let searchValue = $state('');
  let filteredTasks = $state<TaskWithSubTasks[]>([]);
  let isCommandMode = $derived(searchValue.startsWith('>'));

  // 検索結果の更新
  $effect(() => {
    if (searchValue && !isCommandMode) {
      // タスク検索
      filteredTasks = taskStore.allTasks.filter(task => 
        task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 5); // 最大5件
    } else {
      filteredTasks = [];
    }
  });

  function handleSearchExecute() {
    if (searchValue && !isCommandMode) {
      // 「現在の条件で検索」を実行
      console.log('Searching for:', searchValue);
      closeDialog();
    }
  }

  function handleTaskSelect(task: TaskWithSubTasks) {
    TaskService.selectTask(task.id);
    closeDialog();
  }

  function handleCommandSelect(command: string) {
    console.log('Command selected:', command);
    closeDialog();
  }

  function closeDialog() {
    searchValue = '';
    onOpenChange?.(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    } else if (event.key === 'Enter' && searchValue && !isCommandMode) {
      handleSearchExecute();
    }
  }
</script>

<Command.Dialog 
  bind:open 
  onOpenChange={onOpenChange}
  class="max-w-2xl"
>
  <Command.Input 
    placeholder={isCommandMode ? "Type a command..." : "Search tasks..."} 
    bind:value={searchValue}
    onkeydown={handleKeyDown}
  />
  <Command.List>
    <Command.Empty>
      {#if isCommandMode}
        No commands found.
      {:else}
        No tasks found.
      {/if}
    </Command.Empty>

    {#if isCommandMode}
      <!-- コマンドモード -->
      <Command.Group heading="Commands">
        <Command.Item onSelect={() => handleCommandSelect('settings')}>
          <span>Settings</span>
        </Command.Item>
        <Command.Item onSelect={() => handleCommandSelect('help')}>
          <span>Help</span>
        </Command.Item>
      </Command.Group>
    {:else if searchValue}
      <!-- 検索モード -->
      <Command.Group heading="Search">
        <Command.Item onSelect={handleSearchExecute}>
          <Search class="h-4 w-4 mr-2" />
          <span>Search for "{searchValue}"</span>
        </Command.Item>
      </Command.Group>

      {#if filteredTasks.length > 0}
        <Command.Group heading="Tasks">
          {#each filteredTasks as task (task.id)}
            <Command.Item onSelect={() => handleTaskSelect(task)}>
              <span class="truncate">{task.title}</span>
              {#if task.description}
                <span class="text-xs text-muted-foreground ml-2 truncate">
                  {task.description}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      {/if}
    {:else}
      <!-- デフォルト表示 -->
      <Command.Group heading="Quick Actions">
        <Command.Item onSelect={() => console.log('Add task')}>
          <span>Add New Task</span>
          <KeyboardShortcut keys={['cmd', 'n']} class="ml-auto" />
        </Command.Item>
        <Command.Item onSelect={() => console.log('View all')}>
          <span>View All Tasks</span>
          <KeyboardShortcut keys={['cmd', 'a']} class="ml-auto" />
        </Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>