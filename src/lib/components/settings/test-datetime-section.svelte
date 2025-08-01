<script lang="ts">
  import TestDateTimeInput from './test-datetime-input.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    testDateTime: Date;
  }
  let { testDateTime = $bindable() }: Props = $props();

  const testDateTimeLabel = reactiveMessage(m.test_datetime);
</script>

<div>
  <div class="flex items-center gap-4 mb-2">
    <h3 class="text-sm font-medium">{testDateTimeLabel()}</h3>
    <TestDateTimeInput bind:testDateTime />
  </div>
</div>
