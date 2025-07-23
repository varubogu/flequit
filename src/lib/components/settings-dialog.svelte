<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import Dialog from '$lib/components/ui/dialog.svelte';
  import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { ArrowLeft, Search } from 'lucide-svelte';
  import SettingsBasic from './settings/settings-basic.svelte';
  import SettingsViews from './settings/settings-views.svelte';
  import SettingsAppearance from './settings/settings-appearance.svelte';
  import SettingsAccount from './settings/settings-account.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  // Settings categories
  const categories = [
    { id: 'basic', name: 'General', description: 'Week start, due date buttons' },
    { id: 'views', name: 'Views', description: 'Control which views appear in sidebar' },
    { id: 'appearance', name: 'Appearance', description: 'Theme, font, color settings' },
    { id: 'account', name: 'Account', description: 'Account selection and settings' }
  ];

  let selectedCategory = $state('basic');
  let searchQuery = $state('');
  let settingsContentElement: HTMLElement;

  // Mock settings state
  let settings = $state({
    // Basic Settings
    weekStart: 'sunday',
    timezone: settingsStore.timezone,
    dueDateButtons: {
      overdue: false,
      today: true,
      tomorrow: true,
      threeDays: false,
      thisWeek: true,
      thisMonth: false,
      thisQuarter: false,
      thisYear: false,
      thisYearEnd: false
    },
    customDueDays: [] as number[],

    // Appearance Settings
    font: 'default',
    fontSize: 13,
    fontColor: 'default',
    backgroundColor: 'default',

    // Account Settings
    selectedAccount: 'local',
    accountIcon: null as string | null,
    accountName: '',
    email: '',
    password: '',
    serverUrl: ''
  });

  function handleCategorySelect(categoryId: string) {
    selectedCategory = categoryId;
    scrollToCategory(categoryId);
  }

  function scrollToCategory(categoryId: string) {
    const element = document.getElementById(`settings-${categoryId}`);
    if (element && settingsContentElement) {
      const containerRect = settingsContentElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = settingsContentElement.scrollTop + elementRect.top - containerRect.top - 20;

      settingsContentElement.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }

  function handleClose() {
    onOpenChange?.(false);
  }


  // Watch for timezone changes and apply immediately
  $effect(() => {
    settingsStore.setTimezone(settings.timezone);
  });

  // Initialize settings from store when dialog opens
  $effect(() => {
    if (open) {
      settings.timezone = settingsStore.timezone;
    }
  });
</script>

<Dialog bind:open onOpenChange={onOpenChange}>
  <DialogContent class="max-w-[98vw] w-[98vw] h-[98vh] p-0 sm:max-w-[98vw] flex flex-col" showCloseButton={false}>
    <!-- Header -->
    <div class="flex items-center p-6 border-b flex-shrink-0">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" onclick={handleClose}>
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <h2 class="text-xl font-semibold">Settings</h2>
          <p class="text-sm text-muted-foreground">Configure your application preferences</p>
        </div>
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <!-- Left Sidebar -->
      <div class="w-80 border-r flex flex-col flex-shrink-0">
        <!-- Search -->
        <div class="p-4 border-b">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              class="pl-9"
              placeholder="Search settings..."
              bind:value={searchQuery}
            />
          </div>
        </div>

        <!-- Categories -->
        <nav class="flex-1 p-4">
          <div class="space-y-1">
            {#each categories as category (category.id)}
              <Button
                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                class="w-full justify-start h-auto p-3 text-left"
                onclick={() => handleCategorySelect(category.id)}
              >
                <div>
                  <div class="font-medium">{category.name}</div>
                  <div class="text-xs text-muted-foreground">{category.description}</div>
                </div>
              </Button>
            {/each}
          </div>
        </nav>
      </div>

      <!-- Right Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div class="flex-1 overflow-auto" bind:this={settingsContentElement}>
        <div class="p-8 space-y-12 max-w-none w-full">
          <SettingsBasic {settings} />

          <SettingsViews />

          <SettingsAppearance {settings} />

          <SettingsAccount {settings} />
        </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

