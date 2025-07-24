<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import SearchCommand from '$lib/components/search-command.svelte';
  import { Search } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  let showSearchDialog = $state(false);

  // Reactive messages
  const searchLabel = reactiveMessage(m.search);

  $effect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        showSearchDialog = true;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="p-4 border-b">
  <Button
    variant="ghost"
    class="w-full justify-start gap-2 px-3 py-2 h-auto text-muted-foreground"
    onclick={() => showSearchDialog = true}
  >
    <Search class="h-4 w-4" />
    <span class="text-sm">{searchLabel()}</span>
    <div class="ml-auto">
      <KeyboardShortcut keys={['cmd', 'k']} />
    </div>
  </Button>
</div>

<SearchCommand
  bind:open={showSearchDialog}
  onOpenChange={(open) => showSearchDialog = open}
/>