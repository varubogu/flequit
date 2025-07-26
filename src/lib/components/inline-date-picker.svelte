<script lang="ts">
  import { Switch } from '$lib/components/ui/switch';
  import { CalendarDate } from '@internationalized/date';
  import { formatDate, formatTime } from '$lib/utils/date-time';
  import DateTimeInputs from './date-time-inputs.svelte'
  import CalendarPicker from './calendar-picker.svelte';
  import TaskRecurrenceSelector from './task-recurrence-selector.svelte';
  import RecurrenceDialogAdvanced from './recurrence-dialog-advanced.svelte';
  import type { RecurrenceRule } from '$lib/types/task';

  interface Props {
    show: boolean;
    currentDate?: string;
    currentStartDate?: string;
    position?: { x: number; y: number };
    isRangeDate?: boolean;
    recurrenceRule?: RecurrenceRule | null;
    onchange?: (data: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean; recurrenceRule?: RecurrenceRule | null }) => void;
    onclose?: () => void;
    onclear?: () => void;
  }

  let { show = false, currentDate = '', currentStartDate = '', position = { x: 0, y: 0 }, isRangeDate = false, recurrenceRule, onchange, onclose }: Props = $props();

  let pickerElement = $state<HTMLElement>();

  let endDate = $state(currentDate ? formatDate(new Date(currentDate)) : '');
  let endTime = $state(currentDate ? formatTime(new Date(currentDate)) : '00:00:00');

  let useRangeMode = $state(isRangeDate);
  let startDate = $state(currentStartDate ? formatDate(new Date(currentStartDate)) : '');
  let startTime = $state(currentStartDate ? formatTime(new Date(currentStartDate)) : '00:00:00');
  
  // 繰り返しダイアログの状態管理
  let recurrenceDialogOpen = $state(false);
  let currentRecurrenceRule = $state<RecurrenceRule | null>(recurrenceRule || null);

  // Sync useRangeMode with isRangeDate prop changes
  $effect(() => {
    useRangeMode = isRangeDate;
  });
  
  // Sync currentRecurrenceRule with recurrenceRule prop changes
  $effect(() => {
    currentRecurrenceRule = recurrenceRule || null;
  });


  $effect(() => {
    if (show && currentDate && typeof currentDate === 'string') {
      const date = new Date(currentDate);
      endDate = formatDate(date);
      endTime = formatTime(date);
    }
  });

  // Update start date/time when currentStartDate changes
  $effect(() => {
    if (currentStartDate && typeof currentStartDate === 'string') {
      const startDateObj = new Date(currentStartDate);
      startDate = formatDate(startDateObj);
      startTime = formatTime(startDateObj);
    } else {
      startDate = '';
      startTime = '00:00:00';
    }
  });

  // Handle click outside and auto-close
  $effect(() => {
    if (!show) return;

    function handleClickOutside(event: MouseEvent) {
      // 繰り返しダイアログが開いている場合は期日ダイアログを閉じない
      if (recurrenceDialogOpen) return;
      
      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        onclose?.();
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // 繰り返しダイアログが開いている場合は、まず繰り返しダイアログを閉じる
        if (recurrenceDialogOpen) {
          recurrenceDialogOpen = false;
          return;
        }
        onclose?.();
      }
    }

    // Add a small delay to avoid immediate closing when opening
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleKeydown, true);
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  });

  function handleDateTimeInputChange(data: {startDate?: string, startTime?: string, endDate?: string, endTime?: string}) {
    if (data.startDate !== undefined) startDate = data.startDate;
    if (data.startTime !== undefined) startTime = data.startTime;
    if (data.endDate !== undefined) endDate = data.endDate;
    if (data.endTime !== undefined) endTime = data.endTime;

    if (useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }

  function handleDateChange() {
    if (endDate) {
      const date = endDate;
      const dateTime = `${endDate}T${endTime}`;

      onchange?.({ date, dateTime, isRangeDate: false, recurrenceRule: currentRecurrenceRule });
    }
  }

  function handleRangeInputChange() {
    if (startDate || endDate) {
      const eventDetail = {
        date: startDate || endDate || '',
        dateTime: `${startDate || endDate || ''}T${startTime}`,
        range: startDate && endDate ? {
          start: `${startDate}T${startTime}`,
          end: `${endDate}T${endTime}`
        } : undefined,
        isRangeDate: true,
        recurrenceRule: currentRecurrenceRule
      };

      onchange?.(eventDetail);
    }
  }

  function handleCalendarChange(date: CalendarDate) {
    endDate = date.toString();
    const dateTime = `${endDate}T${endTime}`;

    onchange?.({ date: endDate, dateTime, isRangeDate: false, recurrenceRule: currentRecurrenceRule });
  }

  function handleRangeChange(start: CalendarDate, end: CalendarDate) {
    startDate = start.toString();
    endDate = end.toString();

    const eventDetail = {
      date: startDate,
      dateTime: `${startDate}T${startTime}`,
      range: {
        start: `${startDate}T${startTime}`,
        end: `${endDate}T${endTime}`
      },
      isRangeDate: true,
      recurrenceRule: currentRecurrenceRule
    };

    onchange?.(eventDetail);
  }
  
  function handleRecurrenceEdit() {
    recurrenceDialogOpen = true;
  }
  
  function handleRecurrenceSave(rule: RecurrenceRule | null) {
    currentRecurrenceRule = rule;
    
    // 現在の日付情報と一緒に繰り返し設定も通知
    if (useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }


</script>

{#if show}
  <div
    bind:this={pickerElement}
    class="fixed bg-popover border border-border rounded-lg shadow-lg p-3 z-50"
    style="left: {position.x}px; top: {position.y}px; width: fit-content; max-width: 320px;"
  >
    <!-- Range Mode and Recurrence - 2 Column Layout -->
    <div class="grid grid-cols-2 gap-4 mb-3">
      <!-- Left Column: Range Mode Switch -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">範囲</span>
        <Switch bind:checked={useRangeMode} onCheckedChange={(checked: boolean) => {
          const eventDetail = {
            date: endDate || '',
            dateTime: `${endDate || ''}T${endTime}`,
            isRangeDate: checked,
            recurrenceRule: currentRecurrenceRule
          };

          onchange?.(eventDetail);
        }} />
      </div>

      <!-- Right Column: Recurrence Display -->
      <div class="flex items-center justify-end">
        <div class="min-w-0">
          <TaskRecurrenceSelector
            recurrenceRule={currentRecurrenceRule}
            onEdit={handleRecurrenceEdit}
          />
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
        onInput={handleDateTimeInputChange}
      />

      <CalendarPicker
        isRangeMode={useRangeMode}
        {startDate}
        {endDate}
        onCalendarChange={handleCalendarChange}
        onRangeChange={handleRangeChange}
      />
    </div>
  </div>
{/if}

<!-- 繰り返しダイアログ - より高いZ-indexで独立して配置 -->
<RecurrenceDialogAdvanced
  bind:open={recurrenceDialogOpen}
  recurrenceRule={currentRecurrenceRule}
  startDateTime={useRangeMode && startDate && startTime ? new Date(`${startDate}T${startTime}`) : undefined}
  endDateTime={endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined}
  isRangeDate={useRangeMode}
  onSave={handleRecurrenceSave}
/>
