<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';

  interface Props {
    icon: string;
    label: string;
    count: number;
    isActive: boolean;
    onclick: () => void;
  }

  let { icon, label, count, isActive, onclick }: Props = $props();
</script>

<Button
  variant={isActive ? "secondary" : "ghost"}
  class="w-full justify-between p-3 h-auto {isActive ? 'bg-muted' : ''}"
  {onclick}
>
  <div class="flex items-center gap-2">
    <span class="text-lg">{icon}</span>
    <span class="font-medium">{label}</span>
  </div>
  <Badge variant="secondary" class="ml-auto">
    {count}
  </Badge>
</Button>