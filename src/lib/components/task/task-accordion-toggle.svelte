<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { ChevronDown, ChevronRight } from 'lucide-svelte';

  interface Props {
    hasSubTasks: boolean;
    isExpanded: boolean;
    onToggle: (event?: Event) => void;
  }

  let { hasSubTasks, isExpanded, onToggle }: Props = $props();
</script>

{#if hasSubTasks}
  <Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground mt-1 h-8 min-h-[32px] w-8 min-w-[32px]"
    onclick={onToggle}
    title="Toggle subtasks"
  >
    {#if isExpanded}
      <ChevronDown class="h-4 w-4" />
    {:else}
      <ChevronRight class="h-4 w-4" />
    {/if}
  </Button>
{:else}
  <div class="mt-1 h-8 min-h-[32px] w-8 min-w-[32px]"></div>
{/if}
