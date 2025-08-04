<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Button from '$lib/components/shared/button.svelte';
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

  const translationService = getTranslationService();
  // Reactive message functions
  const account_settings = translationService.getMessage('account_settings');
  const account_type = translationService.getMessage('account_type');
  const local_account = translationService.getMessage('local_account');
  const cloud_account = translationService.getMessage('cloud_account');

  const organization = translationService.getMessage('organization');
  const example_organization = translationService.getMessage('example_organization');
  const account_icon = translationService.getMessage('account_icon');
  const choose_file = translationService.getMessage('choose_file');
  const account_name = translationService.getMessage('account_name');
  const email_address = translationService.getMessage('email_address');
  const server_url = translationService.getMessage('server_url');
  const local_account_description = translationService.getMessage('local_account_description');
  const password = translationService.getMessage('password');
</script>

<section id="settings-account">
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-lg font-medium">{account_settings()}</h3>

      <div class="space-y-6">
        <!-- Account Selection -->
        <div class="max-w-md">
          <label for="account-type" class="text-sm font-medium">{account_type()}</label>
          <select
            id="account-type"
            bind:value={settings.selectedAccount}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="local">{local_account()}</option>
            <option value="cloud">{cloud_account()}</option>
          </select>
        </div>

        {#if settings.selectedAccount !== 'local'}
          <!-- Organization Info (Read-only) -->
          <div class="bg-muted max-w-lg rounded-lg p-4">
            <h4 class="mb-2 font-medium">{organization()}</h4>
            <div class="mb-2 flex items-center gap-3">
              <div class="bg-primary h-8 w-8 rounded-full"></div>
              <span class="text-sm">{example_organization()}</span>
            </div>
          </div>

          <!-- Account Details -->
          <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <!-- Account Icon -->
            <div>
              <div class="mb-1 text-sm font-medium">{account_icon()}</div>
              <Button variant="outline" class="mt-1 w-full">
                {choose_file()}
              </Button>
            </div>

            <!-- Account Name -->
            <div>
              <label for="account-name" class="text-sm font-medium">{account_name()}</label>
              <Input id="account-name" bind:value={settings.accountName} class="mt-1" />
            </div>

            <!-- Email -->
            <div>
              <label for="email-address" class="text-sm font-medium">{email_address()}</label>
              <Input id="email-address" type="email" bind:value={settings.email} class="mt-1" />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="text-sm font-medium">{password()}</label>
              <Input id="password" type="password" bind:value={settings.password} class="mt-1" />
            </div>

            <!-- Server URL -->
            <div class="md:col-span-2">
              <label for="server-url" class="text-sm font-medium">{server_url()}</label>
              <Input id="server-url" bind:value={settings.serverUrl} class="mt-1" />
            </div>
          </div>
        {:else}
          <p class="text-muted-foreground bg-muted max-w-2xl rounded-lg p-4 text-sm">
            {local_account_description()}
          </p>
        {/if}
      </div>
    </div>
  </div>
</section>
