<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Repeat } from 'lucide-svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import RecurrenceDialogAdvancedContent from './shared/recurrence-dialog-advanced-content.svelte';
  import { RecurrenceDialogAdvancedLogic } from './shared/recurrence-dialog-advanced-logic.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    recurrenceRule?: RecurrenceRule | null;
    onSave?: (rule: RecurrenceRule | null) => void;
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    recurrenceRule,
    onSave,
    startDateTime,
    endDateTime,
    isRangeDate
  }: Props = $props();

  // Initialize logic

  const logic = new RecurrenceDialogAdvancedLogic(
    recurrenceRule,
    onSave,
    startDateTime,
    endDateTime,
    isRangeDate
  );

  // Track open state changes and sync on open
  $effect(() => {
    // Re-initialize when dialog opens to sync with latest props
    if (open) {
      logic.updateFromRecurrenceRule(recurrenceRule);
    }
  });

  // Sync recurrenceRule prop changes with logic (only when dialog is closed)
  $effect(() => {
    // Only update when dialog is closed to avoid overwriting user's changes
    if (!open) {
      logic.updateFromRecurrenceRule(recurrenceRule);
    }
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="z-[60] max-h-[85vh] !w-[90vw] !max-w-[1200px] overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {logic.recurrenceSettings()}
      </Dialog.Title>
    </Dialog.Header>

    <RecurrenceDialogAdvancedContent {logic} />
  </Dialog.Content>
</Dialog.Root>
