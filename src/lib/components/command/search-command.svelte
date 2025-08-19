<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import CommandSearchItem from './command-search-item.svelte';
  import CommandTaskItem from './command-task-item.svelte';
  import CommandQuickActions from './command-quick-actions.svelte';
  import { createSearchLogic } from './search-command-logic.svelte';
  import { createSearchMessages } from './search-command-messages.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  function closeDialog() {
    logic.searchValue.value = '';
    onOpenChange?.(false);
  }

  const logic = createSearchLogic(closeDialog);
  const messages = createSearchMessages();
</script>

<Command.Dialog bind:open {onOpenChange} class="max-w-2xl" shouldFilter={false}>
  <Command.Input
    placeholder={logic.isCommandMode.value
      ? messages.typeACommand()
      : logic.isTagSearch.value
        ? 'Search tags...'
        : messages.searchTasks()}
    bind:value={logic.searchValue.value}
    onkeydown={logic.handleKeyDown}
  />
  <Command.List>
    {#if !logic.searchValue.value}
      <Command.Empty>
        {#if logic.isCommandMode.value}
          {messages.noCommandsFound()}
        {:else}
          {messages.noTasksFound()}
        {/if}
      </Command.Empty>
    {/if}

    {#if logic.isCommandMode.value}
      <!-- コマンドモード -->
      <Command.Group heading={messages.commands()}>
        <Command.Item onSelect={logic.handleCommandSelect}>
          <span>{messages.settings()}</span>
        </Command.Item>
        <Command.Item onSelect={logic.handleCommandSelect}>
          <span>{messages.help()}</span>
        </Command.Item>
      </Command.Group>
    {/if}

    {#if logic.searchValue.value}
      <!-- 検索モード -->
      <Command.Group heading={messages.search()}>
        <CommandSearchItem
          isTagSearch={logic.isTagSearch.value}
          showAllResultsText={messages.getShowAllResultsFor(logic.searchValue.value)()}
          onSelect={logic.handleSearchExecute}
        />
      </Command.Group>

      {#if logic.filteredTasks.value.length > 0}
        <Command.Group heading={messages.jumpToTask()}>
          {#each logic.filteredTasks.value as task (task.id)}
            <CommandTaskItem
              {task}
              isTagSearch={logic.isTagSearch.value}
              onSelect={() => logic.handleTaskSelect(task)}
            />
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

    {#if !logic.searchValue.value && !logic.isCommandMode.value}
      <!-- デフォルト表示（入力が空の場合） -->
      <CommandQuickActions
        showAllTasks={messages.showAllTasks()}
        quickActions={messages.quickActions()}
        addNewTask={messages.addNewTask()}
        viewAllTasks={messages.viewAllTasks()}
        onSearchExecute={logic.handleSearchExecute}
        onAddNewTask={logic.handleAddNewTask}
        onViewAllTasks={logic.handleViewAllTasks}
      />
    {/if}
  </Command.List>
</Command.Dialog>
