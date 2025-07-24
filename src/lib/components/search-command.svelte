<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search, Hash } from "lucide-svelte";
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskService } from '$lib/services/task-service';
  import { ViewService } from '$lib/services/view-service';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  let searchValue = $state('');
  let filteredTasks = $state<TaskWithSubTasks[]>([]);
  let isCommandMode = $derived(searchValue.startsWith('>'));
  let isTagSearch = $derived(searchValue.startsWith('#'));

  // Reactive messages
  const searchTasks = reactiveMessage(m.search_tasks);
  const typeACommand = reactiveMessage(m.type_a_command);
  const noCommandsFound = reactiveMessage(m.no_commands_found);
  const noTasksFound = reactiveMessage(m.no_tasks_found);
  const commands = reactiveMessage(m.commands);
  const settings = reactiveMessage(m.settings);
  const help = reactiveMessage(m.help);
  const search = reactiveMessage(m.search);
  const showAllResultsFor = reactiveMessage(m.show_all_results_for);
  const jumpToTask = reactiveMessage(m.jump_to_task);
  const results = reactiveMessage(m.results);
  const noMatchingTasksFound = reactiveMessage(m.no_matching_tasks_found);
  const showAllTasks = reactiveMessage(m.show_all_tasks);
  const quickActions = reactiveMessage(m.quick_actions);
  const addNewTask = reactiveMessage(m.add_new_task);
  const viewAllTasks = reactiveMessage(m.view_all_tasks);

  // 検索結果の更新
  $effect(() => {
    if (searchValue && !isCommandMode) {
      if (isTagSearch) {
        // タグ検索
        const tagQuery = searchValue.slice(1).toLowerCase();
        if (tagQuery) {
          filteredTasks = taskStore.allTasks.filter(task =>
            task.tags.some(tag => tag.name.toLowerCase().includes(tagQuery))
          ).slice(0, 5); // 最大5件
        } else {
          // "#"のみの場合はタグ付きタスクを表示
          filteredTasks = taskStore.allTasks.filter(task => task.tags.length > 0).slice(0, 5);
        }
      } else {
        // 通常のタスク検索
        filteredTasks = taskStore.allTasks.filter(task =>
          task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchValue.toLowerCase())
        ).slice(0, 5); // 最大5件
      }
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
    placeholder={isCommandMode ? typeACommand() : isTagSearch ? "Search tags..." : searchTasks()}
    bind:value={searchValue}
    onkeydown={handleKeyDown}
  />
  <Command.List>
    {#if !searchValue}
      <Command.Empty>
        {#if isCommandMode}
          {noCommandsFound()}
        {:else}
          {noTasksFound()}
        {/if}
      </Command.Empty>
    {/if}

    {#if isCommandMode}
      <!-- コマンドモード -->
      <Command.Group heading={commands()}>
        <Command.Item onSelect={() => handleCommandSelect('settings')}>
          <span>{settings()}</span>
        </Command.Item>
        <Command.Item onSelect={() => handleCommandSelect('help')}>
          <span>{help()}</span>
        </Command.Item>
      </Command.Group>
    {/if}

    {#if searchValue}
      <!-- 検索モード -->
      <Command.Group heading={search()}>
        <Command.Item onSelect={handleSearchExecute}>
          {#if isTagSearch}
            <Hash class="h-4 w-4 mr-2" />
          {:else}
            <Search class="h-4 w-4 mr-2" />
          {/if}
          <span>{showAllResultsFor({ searchValue })}</span>
        </Command.Item>
      </Command.Group>

      {#if filteredTasks.length > 0}
        <Command.Group heading={jumpToTask()}>
          {#each filteredTasks as task (task.id)}
            <Command.Item onSelect={() => handleTaskSelect(task)}>
              <span class="truncate font-medium">{task.title}</span>
              {#if isTagSearch && task.tags.length > 0}
                <div class="flex gap-1 ml-2">
                  {#each task.tags as tag (tag.id)}
                    <span class="inline-flex items-center px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">
                      #{tag.name}
                    </span>
                  {/each}
                </div>
              {:else if task.description}
                <span class="text-xs text-muted-foreground ml-2 truncate">
                  {task.description}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      {:else}
        <!-- 検索結果が0件の場合でも何か表示して Command.Empty を防ぐ -->
        <Command.Group heading={results()}>
          <div class="px-2 py-1.5 text-sm text-muted-foreground">
            {noMatchingTasksFound()}
          </div>
        </Command.Group>
      {/if}
    {/if}

    {#if !searchValue && !isCommandMode}
      <!-- デフォルト表示（入力が空の場合） -->
      <Command.Group heading={search()}>
        <Command.Item onSelect={() => handleSearchExecute()}>
          <Search class="h-4 w-4 mr-2" />
          <span>{showAllTasks()}</span>
        </Command.Item>
      </Command.Group>
      <!-- デフォルト表示 -->
      <Command.Group heading={quickActions()}>
        <Command.Item onSelect={() => console.log('Add task')}>
          <span>{addNewTask()}</span>
          <KeyboardShortcut keys={['cmd', 'n']} class="ml-auto" />
        </Command.Item>
        <Command.Item onSelect={() => console.log('View all')}>
          <span>{viewAllTasks()}</span>
          <KeyboardShortcut keys={['cmd', 'a']} class="ml-auto" />
        </Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
