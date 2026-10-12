export function createSyncSources() {
  let show = $state(true);
  let currentDate = $state<string | undefined>('2024-05-01T12:00:00.000Z');
  let currentStartDate = $state<string | undefined>('2024-05-02T08:30:00.000Z');
  let isRangeDate = $state<boolean | undefined>(true);

  return {
    get show() {
      return show;
    },
    set show(value: boolean) {
      show = value;
    },
    get currentDate() {
      return currentDate;
    },
    set currentDate(value: string | undefined) {
      currentDate = value;
    },
    get currentStartDate() {
      return currentStartDate;
    },
    set currentStartDate(value: string | undefined) {
      currentStartDate = value;
    },
    get isRangeDate() {
      return isRangeDate;
    },
    set isRangeDate(value: boolean | undefined) {
      isRangeDate = value;
    }
  };
}
