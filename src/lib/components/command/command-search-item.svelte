<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import { Search, Hash } from 'lucide-svelte';

  interface Props {
    isTagSearch: boolean;
    showAllResultsText: string;
    onSelect: () => void;
  }

  let { isTagSearch, showAllResultsText, onSelect }: Props = $props();
</script>

<Command.Item {onSelect}>
  {#if isTagSearch}
    <Hash class="mr-2 h-4 w-4" />
  {:else}
    <Search class="mr-2 h-4 w-4" />
  {/if}
  <span>{showAllResultsText}</span>
</Command.Item>