<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
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
    class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1"
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
  <div class="h-8 w-8 min-h-[32px] min-w-[32px] mt-1"></div>
{/if}