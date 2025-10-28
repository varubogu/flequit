import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
import Root from '$lib/components/ui/range-calendar/range-calendar.svelte';
import Cell from '$lib/components/ui/range-calendar/range-calendar-cell.svelte';
import Day from '$lib/components/ui/range-calendar/range-calendar-day.svelte';
import Grid from '$lib/components/ui/range-calendar/range-calendar-grid.svelte';
import Header from '$lib/components/ui/range-calendar/range-calendar-header.svelte';
import Months from '$lib/components/ui/range-calendar/range-calendar-months.svelte';
import GridRow from '$lib/components/ui/range-calendar/range-calendar-grid-row.svelte';
import Heading from '$lib/components/ui/range-calendar/range-calendar-heading.svelte';
import HeadCell from '$lib/components/ui/range-calendar/range-calendar-head-cell.svelte';
import NextButton from '$lib/components/ui/range-calendar/range-calendar-next-button.svelte';
import PrevButton from '$lib/components/ui/range-calendar/range-calendar-prev-button.svelte';
import MonthSelect from '$lib/components/ui/range-calendar/range-calendar-month-select.svelte';
import YearSelect from '$lib/components/ui/range-calendar/range-calendar-year-select.svelte';
import Caption from '$lib/components/ui/range-calendar/range-calendar-caption.svelte';
import Nav from '$lib/components/ui/range-calendar/range-calendar-nav.svelte';
import Month from '$lib/components/ui/range-calendar/range-calendar-month.svelte';

const GridHead = RangeCalendarPrimitive.GridHead;
const GridBody = RangeCalendarPrimitive.GridBody;

export {
  Day,
  Cell,
  Grid,
  Header,
  Months,
  GridRow,
  Heading,
  GridBody,
  GridHead,
  HeadCell,
  NextButton,
  PrevButton,
  MonthSelect,
  YearSelect,
  Caption,
  Nav,
  Month,
  //
  Root as RangeCalendar
};
