<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import SearchCommand from '$lib/components/command/search-command.svelte';
  import { Search } from 'lucide-svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  const translationService = getTranslationService();
  let showSearchDialog = $state(false);

  // Reactive messages
  const searchLabel = translationService.getMessage('search');

  // Get sidebar state
  const sidebar = useSidebar();

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

<div class={sidebar.state === 'collapsed' ? 'border-b p-2' : 'border-b p-4'}>
  <Button
    variant="ghost"
    class={sidebar.state === 'collapsed'
      ? 'text-muted-foreground hover:text-foreground h-auto w-full justify-center p-3'
      : 'text-muted-foreground h-auto w-full justify-start gap-2 px-3 py-2'}
    onclick={() => (showSearchDialog = true)}
  >
    <Search class={sidebar.state === 'collapsed' ? 'h-4 w-4 flex-shrink-0' : 'h-4 w-4'} />
    {#if sidebar.state !== 'collapsed'}
      <span class="text-sm">{searchLabel()}</span>
      <div class="ml-auto">
        <KeyboardShortcut keys={['cmd', 'k']} />
      </div>
    {/if}
  </Button>
</div>

<SearchCommand bind:open={showSearchDialog} onOpenChange={(open) => (showSearchDialog = open)} />
