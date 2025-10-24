<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  interface Props {
    settings: {
      lastSelectedAccount: string;
    };
  }

  let { settings }: Props = $props();

  const translationService = useTranslation();
  // Reactive message functions
  const account_settings = translationService.getMessage('account_settings');
  const account_type = translationService.getMessage('account_type');
  const local_account = translationService.getMessage('local_account');
  const cloud_account = translationService.getMessage('cloud_account');

  const local_account_description = translationService.getMessage('local_account_description');
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
            bind:value={settings.lastSelectedAccount}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="local">{local_account()}</option>
            <option value="cloud">{cloud_account()}</option>
          </select>
        </div>

        {#if settings.lastSelectedAccount !== 'local'}
          <p class="text-muted-foreground bg-muted max-w-2xl rounded-lg p-4 text-sm">
            Cloud account functionality will be available in future versions.
          </p>
        {:else}
          <p class="text-muted-foreground bg-muted max-w-2xl rounded-lg p-4 text-sm">
            {local_account_description()}
          </p>
        {/if}
      </div>
    </div>
  </div>
</section>
