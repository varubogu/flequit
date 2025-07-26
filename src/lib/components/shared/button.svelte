<script lang="ts">
  import UIButton from '$lib/components/ui/button.svelte';
  import type { VariantProps } from "tailwind-variants";
  import type { Snippet } from "svelte";

  type ButtonVariants = {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  };

  type Props = ButtonVariants & {
    class?: string;
    children?: Snippet;
    onclick?: (event?: Event) => void;
    disabled?: boolean;
    title?: string;
    "aria-label"?: string;
    "data-testid"?: string;
  };

  let { class: className, ...restProps }: Props = $props();
</script>

<UIButton
  class="active:scale-100 active:brightness-[0.4] transition-all duration-100 {className || ''}"
  {...restProps}
/>