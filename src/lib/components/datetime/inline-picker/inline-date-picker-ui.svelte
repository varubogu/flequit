<script lang="ts">
  import { Switch } from '$lib/components/ui/switch';
  import { CalendarDate } from '@internationalized/date';
  import DateTimeInputs from '../date-inputs/date-time-inputs.svelte';
  import CalendarPicker from '../calendar/calendar-picker.svelte';
  import TaskRecurrenceSelector from '$lib/components/task/task-recurrence-selector.svelte';
    import type { RecurrenceRule } from "$lib/types/datetime-calendar";

  interface Props {
    position: { x: number; y: number };
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    useRangeMode: boolean;
    currentRecurrenceRule: RecurrenceRule | null;
    onDateTimeInputChange: (data: {
      startDate?: string;
      startTime?: string;
      endDate?: string;
      endTime?: string;
    }) => void;
    onCalendarChange: (date: CalendarDate) => void;
    onRangeChange: (start: CalendarDate, end: CalendarDate) => void;
    onRangeModeChange: (checked: boolean) => void;
    onRecurrenceEdit: () => void;
  }

  let {
    position,
    startDate,
    startTime,
    endDate,
    endTime,
    useRangeMode,
    currentRecurrenceRule,
    onDateTimeInputChange,
    onCalendarChange,
    onRangeChange,
    onRangeModeChange,
    onRecurrenceEdit
  }: Props = $props();

  let pickerElement = $state<HTMLElement>();

  // Expose the picker element for outside click detection
  export function getPickerElement() {
    return pickerElement;
  }
</script>

<div
  bind:this={pickerElement}
  class="bg-popover border-border fixed z-50 rounded-lg border p-3 shadow-lg"
  style="left: {position.x}px; top: {position.y}px; width: fit-content; max-width: 320px;"
>
  <!-- Range Mode and Recurrence - 2 Column Layout -->
  <div class="mb-3 grid grid-cols-2 gap-4">
    <!-- Left Column: Range Mode Switch -->
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground text-sm">範囲</span>
      <Switch bind:checked={useRangeMode} onCheckedChange={onRangeModeChange} />
    </div>

    <!-- Right Column: Recurrence Display -->
    <div class="flex items-center justify-end">
      <div class="min-w-0">
        <TaskRecurrenceSelector recurrenceRule={currentRecurrenceRule} onEdit={onRecurrenceEdit} />
      </div>
    </div>
  </div>

  <div class="space-y-3">
    <DateTimeInputs
      {startDate}
      {startTime}
      {endDate}
      {endTime}
      showStartInputs={useRangeMode}
      onInput={onDateTimeInputChange}
    />

    <CalendarPicker
      isRangeMode={useRangeMode}
      {startDate}
      {endDate}
      {onCalendarChange}
      {onRangeChange}
    />
  </div>
</div>
