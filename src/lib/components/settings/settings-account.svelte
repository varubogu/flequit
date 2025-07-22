<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';

  interface Props {
    settings: {
      selectedAccount: string;
      accountIcon: string | null;
      accountName: string;
      email: string;
      password: string;
      serverUrl: string;
    };
  }

  let { settings }: Props = $props();
</script>

<section id="settings-account">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">Account Settings</h3>

      <div class="space-y-6">
        <!-- Account Selection -->
        <div class="max-w-md">
          <label for="account-type" class="text-sm font-medium">Account Type</label>
          <select 
            id="account-type" 
            bind:value={settings.selectedAccount} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
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