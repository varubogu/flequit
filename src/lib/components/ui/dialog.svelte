<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import type { Snippet } from "svelte";

  type Props = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  };

  let { open = $bindable(), onOpenChange, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Root {open} {onOpenChange} {...restProps}>
  {@render children?.()}
</DialogPrimitive.Root>