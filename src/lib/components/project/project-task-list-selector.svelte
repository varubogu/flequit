<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { Edit3 } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    projectInfo: {
      project: { id: string; name: string; color?: string };
      taskList: { id: string; name: string };
    } | null;
    onEdit?: () => void;
  }

  let { projectInfo, onEdit }: Props = $props();

  const project = reactiveMessage(m.project);
  const task_list = reactiveMessage(m.task_list);
  const change = reactiveMessage(m.change);
</script>

{#if projectInfo}
  <div class="border rounded-lg p-4 bg-muted/50">
    <div class="flex items-center justify-between">
      <div class="space-y-2">
        <div class="text-sm">
          <span class="font-medium">{project()}:</span>
          <span class="ml-2 inline-flex items-center gap-1">
            <div
              class="w-2 h-2 rounded-full"
              style="background-color: {projectInfo.project.color || '#3b82f6'}"
            ></div>
            {projectInfo.project.name}
          </span>
        </div>
        <div class="text-sm">
          <span class="font-medium">{task_list()}:</span>
          <span class="ml-2">{projectInfo.taskList.name}</span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onclick={onEdit}
      >
        <Edit3 class="h-4 w-4 mr-1" />
        {change()}
      </Button>
    </div>
  </div>
{/if}
