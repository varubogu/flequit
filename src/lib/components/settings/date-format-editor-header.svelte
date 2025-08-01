<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const dateFormatEditor = reactiveMessage(m.date_format_editor);
  const close = reactiveMessage(m.close);
</script>

<div class="flex items-center justify-between mb-6">
  <h2 class="text-xl font-semibold">{dateFormatEditor()}</h2>
  <Button variant="ghost" size="sm" onclick={onClose}>
    {close()}
  </Button>
</div>
