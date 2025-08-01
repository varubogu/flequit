<script lang="ts">
  import { cn } from '$lib/utils';

  type Props = {
    class?: string;
    value?: string | number;
    type?: string;
    placeholder?: string;
    onkeydown?: (event: KeyboardEvent) => void;
    oninput?: (event: Event) => void;
    id?: string;
    min?: string | number;
    max?: string | number;
  };

  let { class: className, type = 'text', value = $bindable(), ...restProps }: Props = $props();
</script>

<input
  {type}
  bind:value
  class={cn(
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
/>
