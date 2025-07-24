<script lang="ts">
  import Button from "$lib/components/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import { reactiveMessage } from "$lib/stores/locale.svelte";
  import * as m from "$paraglide/messages";

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

  // Reactive message functions
  const account_settings = reactiveMessage(m.account_settings);
  const account_type = reactiveMessage(m.account_type);
  const local_account = reactiveMessage(m.local_account);
  const cloud_account = reactiveMessage(m.cloud_account);

  const organization = reactiveMessage(m.organization);
  const example_organization = reactiveMessage(m.example_organization);
  const account_icon = reactiveMessage(m.account_icon);
  const choose_file = reactiveMessage(m.choose_file);
  const account_name = reactiveMessage(m.account_name);
  const email_address = reactiveMessage(m.email_address);
  const server_url = reactiveMessage(m.server_url);
  const local_account_description = reactiveMessage(m.local_account_description);
  const password = reactiveMessage(m.password);
</script>

<section id="settings-account">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">{account_settings()}</h3>

      <div class="space-y-6">
        <!-- Account Selection -->
        <div class="max-w-md">
          <label for="account-type" class="text-sm font-medium"
            >{account_type()}</label
          >
          <select
            id="account-type"
            bind:value={settings.selectedAccount}
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="local">{local_account()}</option>
            <option value="cloud">{cloud_account()}</option>
          </select>
        </div>

        {#if settings.selectedAccount !== "local"}
          <!-- Organization Info (Read-only) -->
          <div class="p-4 bg-muted rounded-lg max-w-lg">
            <h4 class="font-medium mb-2">{organization()}</h4>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-primary rounded-full"></div>
              <span class="text-sm">{example_organization()}</span>
            </div>
          </div>

          <!-- Account Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <!-- Account Icon -->
            <div>
              <div class="text-sm font-medium mb-1">{account_icon()}</div>
              <Button variant="outline" class="mt-1 w-full">
                {choose_file()}
              </Button>
            </div>

            <!-- Account Name -->
            <div>
              <label for="account-name" class="text-sm font-medium"
                >{account_name()}</label
              >
              <Input
                id="account-name"
                bind:value={settings.accountName}
                class="mt-1"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email-address" class="text-sm font-medium"
                >{email_address()}</label
              >
              <Input
                id="email-address"
                type="email"
                bind:value={settings.email}
                class="mt-1"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="text-sm font-medium"
                >{password()}</label
              >
              <Input
                id="password"
                type="password"
                bind:value={settings.password}
                class="mt-1"
              />
            </div>

            <!-- Server URL -->
            <div class="md:col-span-2">
              <label for="server-url" class="text-sm font-medium"
                >{server_url()}</label
              >
              <Input
                id="server-url"
                bind:value={settings.serverUrl}
                class="mt-1"
              />
            </div>
          </div>
        {:else}
          <p
            class="text-sm text-muted-foreground p-4 bg-muted rounded-lg max-w-2xl"
          >
            {local_account_description()}
          </p>
        {/if}
      </div>
    </div>
  </div>
</section>
