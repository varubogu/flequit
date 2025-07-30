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

<div class="space-y-3">
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label for="test-date" class="text-sm font-medium mb-2 block">テスト日付</label>
      <input
        id="test-date"
        type="date"
        bind:value={dateValue}
        onchange={handleDateChange}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
    <div>
      <label for="test-time" class="text-sm font-medium mb-2 block">テスト時刻</label>
      <input
        id="test-time"
        type="time"
        step="1"
        bind:value={timeValue}
        onchange={handleTimeChange}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  </div>
</div>