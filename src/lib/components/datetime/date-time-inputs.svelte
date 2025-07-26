<script lang="ts">
  interface Props {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    showStartInputs?: boolean;
    onInput?: (data: {startDate?: string, startTime?: string, endDate?: string, endTime?: string}) => void;
  }

  let { 
    startDate = '', 
    startTime = '00:00:00', 
    endDate = '', 
    endTime = '00:00:00', 
    showStartInputs = false,
    onInput
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    // Allow normal typing and navigation
    if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Delete' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End' ||
        /^[0-9/-]$/.test(e.key)) {
      return;
    }
    // Block other keys that might trigger calendar
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }
  }

  function handleInput() {
    onInput?.({startDate, startTime, endDate, endTime});
  }
</script>

{#if showStartInputs}
  <!-- Start Date/Time (Range mode only) -->
  <div class="grid grid-cols-2 gap-2">
    <input
      type="date"
      bind:value={startDate}
      oninput={handleInput}
      onkeydown={handleKeydown}
      class="px-3 py-2 text-sm border border-input rounded-md bg-background [&::-webkit-calendar-picker-indicator]:hidden"
    />
    <input
      type="time"
      step="1"
      bind:value={startTime}
      oninput={handleInput}
      class="px-3 py-2 text-sm border border-input rounded-md bg-background"
    />
  </div>
{/if}

<!-- Due Date/Time (Always visible) -->
<div class="grid grid-cols-2 gap-2">
  <input
    type="date"
    bind:value={endDate}
    oninput={handleInput}
    onkeydown={handleKeydown}
    class="px-3 py-2 text-sm border border-input rounded-md bg-background [&::-webkit-calendar-picker-indicator]:hidden"
  />
  <input
    type="time"
    step="1"
    bind:value={endTime}
    oninput={handleInput}
    class="px-3 py-2 text-sm border border-input rounded-md bg-background"
  />
</div>