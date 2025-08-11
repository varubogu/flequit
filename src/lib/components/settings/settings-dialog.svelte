<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import Dialog from '$lib/components/ui/dialog.svelte';
  import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { ArrowLeft, Search, Menu } from 'lucide-svelte';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import SettingsBasic from './settings-basic.svelte';
  import SettingsViews from './settings-views.svelte';
  import SettingsAppearance from './settings-appearance.svelte';
  import SettingsAccount from './settings-account.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  const translationService = getTranslationService();
  // Mobile detection
  const isMobile = new IsMobile();
  let sidebarOpen = $state(false);

  // Reactive messages
  const settingsTitle = translationService.getMessage('settings');
  const configurePreferences = translationService.getMessage('configure_preferences');
  const searchSettings = translationService.getMessage('search_settings');
  const general = translationService.getMessage('general');
  const views = translationService.getMessage('views');
  const appearance = translationService.getMessage('appearance');
  const account = translationService.getMessage('account');
  const generalDescription = translationService.getMessage('general_description');
  const viewsDescription = translationService.getMessage('views_description');
  const appearanceDescription = translationService.getMessage('appearance_description');
  const accountDescription = translationService.getMessage('account_description');

  // Settings categories with reactive messages
  const categories = $derived([
    { id: 'basic', name: general(), description: generalDescription() },
    { id: 'views', name: views(), description: viewsDescription() },
    { id: 'appearance', name: appearance(), description: appearanceDescription() },
    { id: 'account', name: account(), description: accountDescription() }
  ]);

  let selectedCategory = $state('basic');
  let searchQuery = $state('');
  let settingsContentElement: HTMLElement;

  // Mock settings state
  let settings = $state({
    // Basic Settings
    weekStart: settingsStore.weekStart,
    timezone: settingsStore.timezone,
    dateFormat: settingsStore.dateFormat,
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
    // モバイルでカテゴリを選択したらサイドバーを閉じる
    if (isMobile.current) {
      sidebarOpen = false;
    }
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
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

  function handleWeekStartChange(weekStart: string) {
    settings.weekStart = weekStart;
    settingsStore.setWeekStart(weekStart);
  }

  function handleTimezoneChange(timezone: string) {
    settings.timezone = timezone;
    settingsStore.setTimezone(timezone);
  }

  function handleClose() {
    onOpenChange?.(false);
  }

  // Initialize settings from store when dialog opens
  $effect(() => {
    if (open) {
      settings.weekStart = settingsStore.weekStart;
      settings.timezone = settingsStore.timezone;
      // デスクトップでは常にサイドバーを開く、モバイルでは閉じる
      sidebarOpen = !isMobile.current;
    }
  });
</script>

<Dialog bind:open {onOpenChange}>
  <DialogContent
    class="flex h-[98vh] w-[98vw] max-w-[98vw] flex-col overflow-hidden p-0 sm:max-w-[98vw]"
    showCloseButton={false}
  >
    <!-- Header -->
    <div class="flex w-full min-w-0 flex-shrink-0 items-center border-b p-6">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <Button variant="ghost" size="icon" onclick={handleClose}>
          <ArrowLeft class="h-4 w-4" />
        </Button>
        {#if isMobile.current}
          <Button variant="ghost" size="icon" onclick={toggleSidebar}>
            <Menu class="h-4 w-4" />
          </Button>
        {/if}
        <div class="min-w-0 flex-1">
          <h2 class="truncate text-xl font-semibold">{settingsTitle()}</h2>
          <p class="text-muted-foreground truncate text-sm">{configurePreferences()}</p>
        </div>
      </div>
    </div>

    <div class="relative flex min-h-0 w-full flex-1 overflow-hidden">
      <!-- Desktop Sidebar / Mobile Overlay Sidebar -->
      <div
        class={`
        ${isMobile.current ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : 'relative'} 
        ${isMobile.current && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'} 
        ${isMobile.current ? 'w-80 max-w-[80vw]' : 'w-80'} 
        bg-background flex flex-shrink-0 flex-col overflow-hidden border-r
      `}
      >
        <!-- Search -->
        <div class="border-b p-4">
          <div class="relative">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
            />
            <Input class="pl-9" placeholder={searchSettings()} bind:value={searchQuery} />
          </div>
        </div>

        <!-- Categories -->
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

      <!-- Mobile Backdrop -->
      {#if isMobile.current && sidebarOpen}
        <div
          class="fixed inset-0 z-40 bg-black/50"
          onclick={() => (sidebarOpen = false)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
        ></div>
      {/if}

      <!-- Right Content -->
      <div class="flex w-full min-w-0 flex-1 flex-col overflow-hidden">
        <div class="w-full flex-1 overflow-auto" bind:this={settingsContentElement}>
          <div class="w-full max-w-none space-y-12 p-4 sm:p-8">
            <SettingsBasic {settings} onWeekStartChange={handleWeekStartChange} onTimezoneChange={handleTimezoneChange} />

            <SettingsViews />

            <SettingsAppearance {settings} />

            <SettingsAccount {settings} />
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
