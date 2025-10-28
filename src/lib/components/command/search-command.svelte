<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import CommandSearchItem from '$lib/components/command/command-search-item.svelte';
  import CommandTaskItem from '$lib/components/command/command-task-item.svelte';
  import CommandQuickActions from '$lib/components/command/command-quick-actions.svelte';
  import { createSearchMessages } from '$lib/components/command/search-command-messages.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskInteractions } from '$lib/services/ui/task';
  import { selectionStore } from '$lib/stores/selection-store.svelte';

  import { viewStore } from '$lib/stores/view-store.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  // State
  let searchValue = $state('');
  let filteredTasks = $state<TaskWithSubTasks[]>([]);

  // Derived
  const isCommandMode = $derived(searchValue.startsWith('>'));
  const isTagSearch = $derived(searchValue.startsWith('#'));

  // Messages
  const messages = createSearchMessages();

  // Search effect
  $effect(() => {
    if (searchValue && !isCommandMode) {
      if (isTagSearch) {
        const tagQuery = searchValue.slice(1).toLowerCase();
        if (tagQuery) {
          filteredTasks = taskStore.allTasks
            .filter((task) => task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery)))
            .slice(0, 5);
        } else {
          filteredTasks = taskStore.allTasks.filter((task) => task.tags.length > 0).slice(0, 5);
        }
      } else {
        filteredTasks = taskStore.allTasks
          .filter(
            (task) =>
              task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 5);
      }
    } else {
      filteredTasks = [];
    }
  });

  // Event handlers
  function closeDialog() {
    searchValue = '';
    onOpenChange?.(false);
  }

  function handleSearchExecute() {
    if (!isCommandMode) {
      viewStore.performSearch(searchValue);
      closeDialog();
    }
  }

  function handleTaskSelect(task: TaskWithSubTasks) {
    selectionStore.selectTask(task.id);
    closeDialog();
  }

  function handleCommandSelect() {
    closeDialog();
  }

  function handleAddNewTask() {
    let listId = taskStore.selectedListId;

    if (!listId && taskStore.projects.length > 0) {
      const firstProject = taskStore.projects[0];
      if (firstProject.taskLists.length > 0) {
        listId = firstProject.taskLists[0].id;
      }
    }

    if (listId) {
      taskInteractions.startNewTaskMode(listId);
    }

    closeDialog();
  }

  function handleViewAllTasks() {
    viewStore.changeView('all');
    closeDialog();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }
</script>

<Command.Dialog bind:open {onOpenChange} class="max-w-2xl" shouldFilter={false}>
  <Command.Input
    placeholder={isCommandMode
      ? messages.typeACommand()
      : isTagSearch
        ? 'Search tags...'
        : messages.searchTasks()}
    bind:value={searchValue}
    onkeydown={handleKeyDown}
  />
  <Command.List>
    {#if !searchValue}
      <Command.Empty>
        {#if isCommandMode}
          {messages.noCommandsFound()}
        {:else}
          {messages.noTasksFound()}
        {/if}
      </Command.Empty>
    {/if}

    {#if isCommandMode}
      <!-- コマンドモード -->
      <Command.Group heading={messages.commands()}>
        <Command.Item onSelect={handleCommandSelect}>
          <span>{messages.settings()}</span>
        </Command.Item>
        <Command.Item onSelect={handleCommandSelect}>
          <span>{messages.help()}</span>
        </Command.Item>
      </Command.Group>
    {/if}

    {#if searchValue}
      <!-- 検索モード -->
      <Command.Group heading={messages.search()}>
        <CommandSearchItem
          isTagSearch={isTagSearch}
          showAllResultsText={messages.getShowAllResultsFor(searchValue)()}
          onSelect={handleSearchExecute}
        />
      </Command.Group>

      {#if filteredTasks.length > 0}
        <Command.Group heading={messages.jumpToTask()}>
          {#each filteredTasks as task (task.id)}
            <CommandTaskItem {task} {isTagSearch} onSelect={() => handleTaskSelect(task)} />
          {/each}
        </Command.Group>
      {:else}
        <!-- 検索結果が0件の場合でも何か表示して Command.Empty を防ぐ -->
        <Command.Group heading={messages.results()}>
          <div class="text-muted-foreground px-2 py-1.5 text-sm">
            {messages.noMatchingTasksFound()}
          </div>
        </Command.Group>
      {/if}
    {/if}

    {#if !searchValue && !isCommandMode}
      <!-- デフォルト表示（入力が空の場合） -->
      <CommandQuickActions
        showAllTasks={messages.showAllTasks()}
        quickActions={messages.quickActions()}
        addNewTask={messages.addNewTask()}
        viewAllTasks={messages.viewAllTasks()}
        onSearchExecute={handleSearchExecute}
        onAddNewTask={handleAddNewTask}
        onViewAllTasks={handleViewAllTasks}
      />
    {/if}
  </Command.List>
</Command.Dialog>
