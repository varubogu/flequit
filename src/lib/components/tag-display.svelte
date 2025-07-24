<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import { X } from 'lucide-svelte';

  interface Props {
    tag: Tag;
    showRemoveButton?: boolean;
    onRemove?: (tagId: string) => void;
    class?: string;
  }

  let { tag, showRemoveButton = false, onRemove, class: className = '' }: Props = $props();

  function handleRemove() {
    onRemove?.(tag.id);
  }
</script>

{#if showRemoveButton}
  <div class="inline-flex items-center gap-1 {className}">
    <Badge
      variant="outline"
      class="text-xs pr-1"
      style="border-color: {tag.color}; color: {tag.color};"
    >
      {tag.name}
      <Button
        variant="ghost"
        size="icon"
        class="h-3 w-3 p-0 ml-1 hover:bg-secondary-foreground/20"
        onclick={handleRemove}
      >
        <X class="h-2 w-2" />
      </Button>
    </Badge>
  </div>
{:else}
  <Badge
    variant="outline"
    class="text-xs {className}"
    style="border-color: {tag.color}; color: {tag.color};"
  >
    {tag.name}
  </Badge>
{/if}