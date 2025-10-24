<script lang="ts">
  import TestDateTimeInput from './test-datetime-input.svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  interface Props {
    testDateTime: Date;
  }
  let { testDateTime = $bindable() }: Props = $props();

  const translationService = useTranslation();
  const testDateTimeLabel = translationService.getMessage('test_datetime');
</script>

<div>
  <div class="mb-2 flex items-center gap-4">
    <h3 class="text-sm font-medium">{testDateTimeLabel()}</h3>
    <TestDateTimeInput bind:testDateTime />
  </div>
</div>
