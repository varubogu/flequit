<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    keys: string[];
    class?: string;
    hideOnMobile?: boolean;
  }

  let { keys, class: className = '', hideOnMobile = true }: Props = $props();

  let isMac = $state(false);
  let isMobile = $state(false);

  onMount(() => {
    // プラットフォーム検出
    isMac =
      navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
      navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

    // モバイル検出
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  });

  function formatKey(key: string): string {
    const lowercaseKey = key.toLowerCase();

    switch (lowercaseKey) {
      case 'cmd':
      case 'command':
        return isMac ? '⌘' : 'Ctrl';
      case 'ctrl':
      case 'control':
        return isMac ? '⌃' : 'Ctrl';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'enter':
        return '↵';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'space':
        return '␣';
      case 'tab':
        return '⇥';
      case 'backspace':
        return '⌫';
      case 'delete':
        return isMac ? '⌦' : 'Del';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'left':
        return '←';
      case 'right':
        return '→';
      default:
        return key.toUpperCase();
    }
  }

  let shouldHide = $derived(hideOnMobile && isMobile);
</script>

{#if !shouldHide}
  <kbd
    class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none {className}"
  >
    {#each keys as key, index}
      {#if index > 0}
        <span class="text-xs">+</span>
      {/if}
      <span class="text-xs">{formatKey(key)}</span>
    {/each}
  </kbd>
{/if}
