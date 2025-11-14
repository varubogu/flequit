<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Repeat } from 'lucide-svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import RecurrenceDialogAdvancedContent from '$lib/components/recurrence/dialogs/recurrence-dialog-advanced-content.svelte';
  import { createRecurrenceDialogFacade } from '$lib/components/recurrence/dialogs/recurrence-dialog-facade.svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';

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

  // Translation service
  const translationService = useTranslation();
  const dialogFacade = createRecurrenceDialogFacade({
    onSave: (rule) => {
      console.log('[recurrence-dialog] onSave呼び出し:', rule);
      onSave?.(rule);
    }
  });

  const recurrenceSettings = $derived(translationService.getMessage('recurrence_settings')());

  $effect(() => {
    dialogFacade.setRecurrenceRule(recurrenceRule ?? null);
  });

  $effect(() => {
    dialogFacade.setOpen(open);
  });

  $effect(() => {
    dialogFacade.setContext({
      startDateTime,
      endDateTime,
      isRangeDate
    });
  });

  $effect(() => {
    dialogFacade.setRecurrenceSettingsMessage(recurrenceSettings);
  });

  const logic = dialogFacade.logic;
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="z-[60] max-h-[85vh] !w-[90vw] !max-w-[1200px] overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {recurrenceSettings}
      </Dialog.Title>
    </Dialog.Header>

    <RecurrenceDialogAdvancedContent {logic} />
  </Dialog.Content>
</Dialog.Root>
