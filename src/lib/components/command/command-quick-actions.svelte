<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search } from 'lucide-svelte';

  interface Props {
    showAllTasks: string;
    quickActions: string;
    addNewTask: string;
    viewAllTasks: string;
    onSearchExecute: () => void;
    onAddNewTask: () => void;
    onViewAllTasks: () => void;
  }

  let {
    showAllTasks,
    quickActions,
    addNewTask,
    viewAllTasks,
    onSearchExecute,
    onAddNewTask,
    onViewAllTasks
  }: Props = $props();
</script>

<Command.Group heading={showAllTasks}>
  <Command.Item onSelect={onSearchExecute}>
    <Search class="mr-2 h-4 w-4" />
    <span>{showAllTasks}</span>
  </Command.Item>
</Command.Group>

<Command.Group heading={quickActions}>
  <Command.Item onSelect={onAddNewTask}>
    <span>{addNewTask}</span>
    <KeyboardShortcut keys={['cmd', 'n']} class="ml-auto" />
  </Command.Item>
  <Command.Item onSelect={onViewAllTasks}>
    <span>{viewAllTasks}</span>
    <KeyboardShortcut keys={['cmd', 'a']} class="ml-auto" />
  </Command.Item>
</Command.Group>
