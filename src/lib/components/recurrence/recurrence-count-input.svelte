<script lang="ts">
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  type Props = {
    value: number | undefined;
    oninput?: (event: Event) => void;
  };

  let { value = $bindable(), oninput }: Props = $props();

  const repeatCountLabel = reactiveMessage(m.repeat_count);
  const infiniteRepeatPlaceholder = reactiveMessage(m.infinite_repeat_placeholder);
  const infiniteRepeatDescription = reactiveMessage(m.infinite_repeat_description);
</script>

<section class="space-y-3">
  <h3 class="text-lg font-semibold">{repeatCountLabel()}</h3>
  <div>
    <input
      type="number"
      bind:value
      min="1"
      class="w-full p-2 border border-border rounded bg-background text-foreground"
      oninput={oninput}
      placeholder={infiniteRepeatPlaceholder()}
    />
    <p class="text-sm text-muted-foreground mt-1">{infiniteRepeatDescription()}</p>
  </div>
</section>
