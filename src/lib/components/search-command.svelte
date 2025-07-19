<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search } from "lucide-svelte";
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskService } from '$lib/services/task-service';
  import { ViewService } from '$lib/services/view-service';
  import { viewStore } from '$lib/stores/view-store.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

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
    if (!isCommandMode) {
      // 検索を実行してタスク一覧に表示（空の場合は全タスク表示）
      viewStore.performSearch(searchValue);
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
  shouldFilter={false}
>
  <Command.Input
    placeholder={isCommandMode ? "Type a command..." : "Search tasks..."}
    bind:value={searchValue}
    onkeydown={handleKeyDown}
  />
  <Command.List>
    {#if !searchValue}
      <Command.Empty>
        {#if isCommandMode}
          No commands found.
        {:else}
          No tasks found.
        {/if}
      </Command.Empty>
    {/if}

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
    {/if}

    {#if searchValue}
      <!-- 検索モード -->
      <Command.Group heading="Search">
        <Command.Item onSelect={handleSearchExecute}>
          <Search class="h-4 w-4 mr-2" />
          <span>Show all results for "{searchValue}"</span>
        </Command.Item>
      </Command.Group>

      {#if filteredTasks.length > 0}
        <Command.Group heading="Jump to Task">
          {#each filteredTasks as task (task.id)}
            <Command.Item onSelect={() => handleTaskSelect(task)}>
              <span class="truncate font-medium">{task.title}</span>
              {#if task.description}
                <span class="text-xs text-muted-foreground ml-2 truncate">
                  {task.description}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      {:else}
        <!-- 検索結果が0件の場合でも何か表示して Command.Empty を防ぐ -->
        <Command.Group heading="Results">
          <div class="px-2 py-1.5 text-sm text-muted-foreground">
            No matching tasks found
          </div>
        </Command.Group>
      {/if}
    {/if}

    {#if !searchValue && !isCommandMode}
      <!-- デフォルト表示（入力が空の場合） -->
      <Command.Group heading="Search">
        <Command.Item onSelect={() => handleSearchExecute()}>
          <Search class="h-4 w-4 mr-2" />
          <span>Show all tasks</span>
        </Command.Item>
      </Command.Group>
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
