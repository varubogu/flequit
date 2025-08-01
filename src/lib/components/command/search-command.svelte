<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import * as Command from '$lib/components/ui/command/index.js';
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search, Hash } from 'lucide-svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskService } from '$lib/services/task-service';
  import { viewStore } from '$lib/stores/view-store.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  const translationService = getTranslationService();
  let searchValue = $state('');
  let filteredTasks = $state<TaskWithSubTasks[]>([]);
  let isCommandMode = $derived(searchValue.startsWith('>'));
  let isTagSearch = $derived(searchValue.startsWith('#'));

  // Reactive messages
  const searchTasks = translationService.getMessage('search_tasks');
  const typeACommand = translationService.getMessage('type_a_command');
  const noCommandsFound = translationService.getMessage('no_commands_found');
  const noTasksFound = translationService.getMessage('no_tasks_found');
  const commands = translationService.getMessage('commands');
  const settings = translationService.getMessage('settings');
  const help = translationService.getMessage('help');
  const search = translationService.getMessage('search');
  const showAllResultsFor = $derived(
    translationService.getMessage('show_all_results_for', { searchValue })
  );
  const jumpToTask = translationService.getMessage('jump_to_task');
  const results = translationService.getMessage('results');
  const noMatchingTasksFound = translationService.getMessage('no_matching_tasks_found');
  const showAllTasks = translationService.getMessage('show_all_tasks');
  const quickActions = translationService.getMessage('quick_actions');
  const addNewTask = translationService.getMessage('add_new_task');
  const viewAllTasks = translationService.getMessage('view_all_tasks');

  // 検索結果の更新
  $effect(() => {
    if (searchValue && !isCommandMode) {
      if (isTagSearch) {
        // タグ検索
        const tagQuery = searchValue.slice(1).toLowerCase();
        if (tagQuery) {
          filteredTasks = taskStore.allTasks
            .filter((task) => task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery)))
            .slice(0, 5); // 最大5件
        } else {
          // "#"のみの場合はタグ付きタスクを表示
          filteredTasks = taskStore.allTasks.filter((task) => task.tags.length > 0).slice(0, 5);
        }
      } else {
        // 通常のタスク検索
        filteredTasks = taskStore.allTasks
          .filter(
            (task) =>
              task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 5); // 最大5件
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

  function handleCommandSelect() {
    closeDialog();
  }

  function handleAddNewTask() {
    // Get the current list ID or use the first available list
    let listId = taskStore.selectedListId;

    if (!listId && taskStore.projects.length > 0) {
      // Use the first list of the first project as default
      const firstProject = taskStore.projects[0];
      if (firstProject.task_lists.length > 0) {
        listId = firstProject.task_lists[0].id;
      }
    }

    if (listId) {
      taskStore.startNewTaskMode(listId);
    }

    closeDialog();
  }

  function handleViewAllTasks() {
    viewStore.changeView('all');
    closeDialog();
  }

  function closeDialog() {
    searchValue = '';
    onOpenChange?.(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }
</script>

<Command.Dialog bind:open {onOpenChange} class="max-w-2xl" shouldFilter={false}>
  <Command.Input
    placeholder={isCommandMode ? typeACommand() : isTagSearch ? 'Search tags...' : searchTasks()}
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
        <Command.Item onSelect={handleCommandSelect}>
          <span>{settings()}</span>
        </Command.Item>
        <Command.Item onSelect={handleCommandSelect}>
          <span>{help()}</span>
        </Command.Item>
      </Command.Group>
    {/if}

    {#if searchValue}
      <!-- 検索モード -->
      <Command.Group heading={search()}>
        <Command.Item onSelect={handleSearchExecute}>
          {#if isTagSearch}
            <Hash class="mr-2 h-4 w-4" />
          {:else}
            <Search class="mr-2 h-4 w-4" />
          {/if}
          <span>{showAllResultsFor()}</span>
        </Command.Item>
      </Command.Group>

      {#if filteredTasks.length > 0}
        <Command.Group heading={jumpToTask()}>
          {#each filteredTasks as task (task.id)}
            <Command.Item onSelect={() => handleTaskSelect(task)}>
              <span class="truncate font-medium">{task.title}</span>
              {#if isTagSearch && task.tags.length > 0}
                <div class="ml-2 flex gap-1">
                  {#each task.tags as tag (tag.id)}
                    <span
                      class="bg-secondary text-secondary-foreground inline-flex items-center rounded px-1.5 py-0.5 text-xs"
                    >
                      #{tag.name}
                    </span>
                  {/each}
                </div>
              {:else if task.description}
                <span class="text-muted-foreground ml-2 truncate text-xs">
                  {task.description}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
      {:else}
        <!-- 検索結果が0件の場合でも何か表示して Command.Empty を防ぐ -->
        <Command.Group heading={results()}>
          <div class="text-muted-foreground px-2 py-1.5 text-sm">
            {noMatchingTasksFound()}
          </div>
        </Command.Group>
      {/if}
    {/if}

    {#if !searchValue && !isCommandMode}
      <!-- デフォルト表示（入力が空の場合） -->
      <Command.Group heading={search()}>
        <Command.Item onSelect={() => handleSearchExecute()}>
          <Search class="mr-2 h-4 w-4" />
          <span>{showAllTasks()}</span>
        </Command.Item>
      </Command.Group>
      <!-- デフォルト表示 -->
      <Command.Group heading={quickActions()}>
        <Command.Item onSelect={handleAddNewTask}>
          <span>{addNewTask()}</span>
          <KeyboardShortcut keys={['cmd', 'n']} class="ml-auto" />
        </Command.Item>
        <Command.Item onSelect={handleViewAllTasks}>
          <span>{viewAllTasks()}</span>
          <KeyboardShortcut keys={['cmd', 'a']} class="ml-auto" />
        </Command.Item>
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>
