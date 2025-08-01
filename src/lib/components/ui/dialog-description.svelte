<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    class?: string;
  };

  let { class: className, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Description class={cn('text-muted-foreground text-sm', className)} {...restProps}>
  {@render children?.()}
</DialogPrimitive.Description>
