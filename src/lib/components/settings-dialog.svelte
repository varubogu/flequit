<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import Dialog from '$lib/components/ui/dialog.svelte';
  import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { ArrowLeft, Search } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  // Settings categories
  const categories = [
    { id: 'basic', name: 'General', description: 'Week start, due date buttons' },
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
    theme: themeStore.theme,
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

  function addCustomDueDay() {
    // TODO: Implement custom due day addition
    console.log('Add custom due day');
  }

  // Watch for theme changes and apply immediately
  $effect(() => {
    themeStore.setTheme(settings.theme);
  });

  // Initialize settings from store when dialog opens
  $effect(() => {
    if (open) {
      settings.theme = themeStore.theme;
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
          <!-- Basic Settings -->
          <section id="settings-basic">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-4">General Settings</h3>
                
                <!-- Settings Grid -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <!-- Week Start -->
                  <div>
                    <label for="week-start" class="text-sm font-medium">Week starts on</label>
                    <select id="week-start" bind:value={settings.weekStart} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="sunday">Sunday</option>
                      <option value="monday">Monday</option>
                    </select>
                  </div>

                  <!-- Due Date Buttons -->
                  <div>
                    <div class="text-sm font-medium mb-3 block">Due Date Button Visibility</div>
                    <div class="grid grid-cols-2 gap-2">
                      <label class="flex items-center gap-2">
                        <input id="due-overdue" type="checkbox" bind:checked={settings.dueDateButtons.overdue} class="rounded" />
                        <span class="text-sm">Overdue</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-today" type="checkbox" bind:checked={settings.dueDateButtons.today} class="rounded" />
                        <span class="text-sm">Today</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-tomorrow" type="checkbox" bind:checked={settings.dueDateButtons.tomorrow} class="rounded" />
                        <span class="text-sm">Tomorrow</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-three-days" type="checkbox" bind:checked={settings.dueDateButtons.threeDays} class="rounded" />
                        <span class="text-sm">3 Days</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-this-week" type="checkbox" bind:checked={settings.dueDateButtons.thisWeek} class="rounded" />
                        <span class="text-sm">This Week</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-this-month" type="checkbox" bind:checked={settings.dueDateButtons.thisMonth} class="rounded" />
                        <span class="text-sm">This Month</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-this-quarter" type="checkbox" bind:checked={settings.dueDateButtons.thisQuarter} class="rounded" />
                        <span class="text-sm">This Quarter</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-this-year" type="checkbox" bind:checked={settings.dueDateButtons.thisYear} class="rounded" />
                        <span class="text-sm">This Year</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input id="due-this-fiscal-year" type="checkbox" bind:checked={settings.dueDateButtons.thisYearEnd} class="rounded" />
                        <span class="text-sm">This Fiscal Year</span>
                      </label>
                    </div>
                  </div>

                  <!-- Custom Due Days -->
                  <div class="xl:col-span-2">
                    <div class="text-sm font-medium mb-3 block">Add Custom Due Date Button</div>
                    <Button variant="outline" onclick={addCustomDueDay}>
                      Add Custom Due Date
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Appearance Settings -->
          <section id="settings-appearance">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-4">Appearance Settings</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <!-- Theme -->
                  <div>
                    <label for="theme-select" class="text-sm font-medium">Theme</label>
                    <select id="theme-select" bind:value={settings.theme} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="default">Default (System: {themeStore.systemTheme})</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                    <p class="mt-1 text-xs text-muted-foreground">
                      Current: {themeStore.effectiveTheme}
                    </p>
                  </div>

                  <!-- Font -->
                  <div>
                    <label for="font-select" class="text-sm font-medium">Font</label>
                    <select id="font-select" bind:value={settings.font} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="default">Default</option>
                      <option value="system">System Font</option>
                      <option value="arial">Arial</option>
                      <option value="helvetica">Helvetica</option>
                    </select>
                  </div>

                  <!-- Font Size -->
                  <div>
                    <label for="font-size" class="text-sm font-medium">Font Size</label>
                    <Input
                      id="font-size"
                      type="number"
                      bind:value={settings.fontSize}
                      min="10"
                      max="24"
                      class="mt-1"
                    />
                  </div>

                  <!-- Font Color -->
                  <div>
                    <label for="font-color" class="text-sm font-medium">Font Color</label>
                    <select id="font-color" bind:value={settings.fontColor} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="default">Default</option>
                      <option value="black">Black</option>
                      <option value="white">White</option>
                    </select>
                  </div>

                  <!-- Background Color -->
                  <div>
                    <label for="background-color" class="text-sm font-medium">Background Color</label>
                    <select id="background-color" bind:value={settings.backgroundColor} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="default">Default</option>
                      <option value="white">White</option>
                      <option value="black">Black</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Account Settings -->
          <section id="settings-account">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-4">Account Settings</h3>
                
                <div class="space-y-6">
                  <!-- Account Selection -->
                  <div class="max-w-md">
                    <label for="account-type" class="text-sm font-medium">Account Type</label>
                    <select id="account-type" bind:value={settings.selectedAccount} class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm">
                      <option value="local">Local Account</option>
                      <option value="cloud">Cloud Account</option>
                    </select>
                  </div>

                  {#if settings.selectedAccount !== 'local'}
                    <!-- Organization Info (Read-only) -->
                    <div class="p-4 bg-muted rounded-lg max-w-lg">
                      <h4 class="font-medium mb-2">Organization</h4>
                      <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 bg-primary rounded-full"></div>
                        <span class="text-sm">Example Organization</span>
                      </div>
                    </div>

                    <!-- Account Details -->
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <!-- Account Icon -->
                      <div>
                        <div class="text-sm font-medium mb-1">Account Icon</div>
                        <Button variant="outline" class="mt-1 w-full">
                          Choose File
                        </Button>
                      </div>

                      <!-- Account Name -->
                      <div>
                        <label for="account-name" class="text-sm font-medium">Account Name</label>
                        <Input id="account-name" bind:value={settings.accountName} class="mt-1" />
                      </div>

                      <!-- Email -->
                      <div>
                        <label for="email-address" class="text-sm font-medium">Email Address</label>
                        <Input id="email-address" type="email" bind:value={settings.email} class="mt-1" />
                      </div>

                      <!-- Password -->
                      <div>
                        <label for="password" class="text-sm font-medium">Password</label>
                        <Input id="password" type="password" bind:value={settings.password} class="mt-1" />
                      </div>

                      <!-- Server URL -->
                      <div class="md:col-span-2">
                        <label for="server-url" class="text-sm font-medium">Server URL</label>
                        <Input id="server-url" bind:value={settings.serverUrl} class="mt-1" />
                      </div>
                    </div>
                  {:else}
                    <p class="text-sm text-muted-foreground p-4 bg-muted rounded-lg max-w-2xl">
                      Using local account. To access cloud features, select a cloud account above.
                    </p>
                  {/if}
                </div>
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>