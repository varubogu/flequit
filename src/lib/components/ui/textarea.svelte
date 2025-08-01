<script lang="ts">
  import { cn } from '$lib/utils';

  type Props = {
    class?: string;
    value?: string;
    placeholder?: string;
    id?: string;
    oninput?: (event: Event) => void;
  };

  let { class: className, value = $bindable(), ...restProps }: Props = $props();
</script>

<textarea
  bind:value
  class={cn(
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
></textarea>
