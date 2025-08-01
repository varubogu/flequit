<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    onCopyToTest: () => void;
    onCopyToMain: () => void;
  }

  let { onCopyToTest, onCopyToMain }: Props = $props();

  const applyDatetimeFormatToTestFormat = reactiveMessage(m.apply_datetime_format_to_test_format);
  const applyTestFormatToDatetimeFormat = reactiveMessage(m.apply_test_format_to_datetime_format);
</script>

<div class="flex items-center justify-center gap-2 py-2">
  <Button
    variant="outline"
    size="sm"
    onclick={onCopyToTest}
    class="flex items-center justify-center w-8 h-8 p-0"
    title={applyDatetimeFormatToTestFormat()}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
    </svg>
  </Button>
  <Button
    variant="outline"
    size="sm"
    onclick={onCopyToMain}
    class="flex items-center justify-center w-8 h-8 p-0"
    title={applyTestFormatToDatetimeFormat()}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
  </Button>
</div>
