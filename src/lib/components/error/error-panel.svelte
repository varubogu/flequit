<script lang="ts">
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import ErrorToast from './error-toast.svelte';

  const errors = $derived(errorHandler.errors);
</script>

{#if errors.length > 0}
  <div class="fixed top-4 right-4 z-50 max-w-md space-y-2">
    {#each errors as error (error.id)}
      <ErrorToast {error} />
    {/each}
  </div>
{/if}
