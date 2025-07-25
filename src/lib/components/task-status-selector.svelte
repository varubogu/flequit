<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Select from '$lib/components/ui/select.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    onStatusChange: (event: Event) => void;
  }

  let { currentItem, onStatusChange }: Props = $props();

  // Reactive messages
  const status = reactiveMessage(m.status);
  const not_started = reactiveMessage(m.not_started);
  const in_progress = reactiveMessage(m.in_progress);
  const waiting = reactiveMessage(m.waiting);
  const completed = reactiveMessage(m.completed);
  const cancelled = reactiveMessage(m.cancelled);
</script>

<div class="min-w-[120px] flex-1">
  <label for="task-status" class="block text-sm font-medium mb-2">{status()}</label>
  <Select
    id="task-status"
    value={currentItem.status}
    onchange={onStatusChange}
    class="w-full"
  >
    <option value="not_started">{not_started()}</option>
    <option value="in_progress">{in_progress()}</option>
    <option value="waiting">{waiting()}</option>
    <option value="completed">{completed()}</option>
    <option value="cancelled">{cancelled()}</option>
  </Select>
</div>