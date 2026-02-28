<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Search } from 'lucide-svelte';

  interface CategoryItem {
    id: string;
    name: string;
    description: string;
  }

  interface Props {
    categories: CategoryItem[];
    selectedCategory: string;
    searchQuery: string;
    onSelectCategory: (id: string) => void;
    onSearchQueryChange: (value: string) => void;
    isMobile: boolean;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    searchLabel: string;
  }

  let {
    categories,
    selectedCategory,
    searchQuery,
    onSelectCategory,
    onSearchQueryChange,
    isMobile,
    sidebarOpen,
    toggleSidebar,
    searchLabel
  }: Props = $props();

  function handleCategorySelect(categoryId: string) {
    onSelectCategory(categoryId);
    if (isMobile) {
      toggleSidebar();
    }
  }

  function handleSearchInput(event: Event) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    onSearchQueryChange(target.value);
  }

  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      toggleSidebar();
    }
  }
</script>

<div
  class={`${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : 'relative'} ${
    isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
  } ${isMobile ? 'w-80 max-w-[80vw]' : 'w-80'} bg-background flex flex-shrink-0 flex-col overflow-hidden border-r`}
>
  <div class="border-b p-4">
    <div class="relative">
      <Search
        class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
      />
      <Input
        class="pl-9"
        placeholder={searchLabel}
        value={searchQuery}
        oninput={handleSearchInput}
      />
    </div>
  </div>

  <nav class="flex-1 p-4">
    <div class="space-y-1">
      {#each categories as category (category.id)}
        <Button
          variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
          class="h-auto w-full justify-start p-3 text-left"
          onclick={() => handleCategorySelect(category.id)}
        >
          <div>
            <div class="font-medium">{category.name}</div>
            <div class="text-muted-foreground text-xs">{category.description}</div>
          </div>
        </Button>
      {/each}
    </div>
  </nav>
</div>

{#if isMobile && sidebarOpen}
  <div
    class="fixed inset-0 z-40 bg-black/50"
    role="button"
    tabindex="0"
    onclick={toggleSidebar}
    onkeydown={handleOverlayKeydown}
  ></div>
{/if}
