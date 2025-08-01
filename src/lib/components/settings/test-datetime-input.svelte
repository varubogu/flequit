<script lang="ts">
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';

  interface Props {
    testDateTime: Date;
  }

  let { testDateTime = $bindable() }: Props = $props();

  // 日付部分と時刻部分の分離
  let dateValue = $state('');
  let timeValue = $state('');

  // testDateTimeの変更を監視して入力フィールドに反映
  $effect(() => {
    dateValue = format(testDateTime, 'yyyy-MM-dd');
    timeValue = format(testDateTime, 'HH:mm:ss');
  });

  // 日付変更時の処理
  function handleDateChange() {
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const newDate = new Date(testDateTime);
      newDate.setFullYear(year, month - 1, day);
      testDateTime = newDate;
    }
  }

  // 時刻変更時の処理
  function handleTimeChange() {
    if (timeValue) {
      const [hours, minutes, seconds] = timeValue.split(':').map(Number);
      const newDate = new Date(testDateTime);
      newDate.setHours(hours, minutes, seconds || 0);
      testDateTime = newDate;
    }
  }
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div>
    <input
      id="test-date"
      type="date"
      bind:value={dateValue}
      onchange={handleDateChange}
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
  <div>
    <input
      id="test-time"
      type="time"
      step="1"
      bind:value={timeValue}
      onchange={handleTimeChange}
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
</div>
