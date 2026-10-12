<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import type { ComponentProps } from 'svelte';

  // TriggerProps は vaul-svelte 0.3.2 の名前空間に無い。コンポーネント props から取る。
  let { el = $bindable(undefined), ...restProps }: ComponentProps<typeof DrawerPrimitive.Trigger> =
    $props();
</script>

<DrawerPrimitive.Trigger bind:el data-slot="drawer-trigger" {...restProps} />
