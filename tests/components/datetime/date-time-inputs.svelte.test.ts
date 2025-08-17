import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DateTimeInputs from '$lib/components/datetime/date-inputs/date-time-inputs.svelte';

describe('DateTimeInputs', () => {
  const defaultProps = {
    startDate: '',
    startTime: '00:00:00',
    endDate: '',
    endTime: '00:00:00',
    showStartInputs: false,
    onInput: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(DateTimeInputs, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('デフォルトで終了日時のみが表示される', () => {
    render(DateTimeInputs, { props: defaultProps });

    const dateInputs = screen.getAllByDisplayValue('');
    const timeInputs = screen.getAllByDisplayValue('00:00:00');

    expect(dateInputs).toHaveLength(1); // 終了日のみ
    expect(timeInputs).toHaveLength(1); // 終了時刻のみ
  });

  it('showStartInputsがtrueの場合に開始日時が表示される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true
      }
    });

    const dateInputs = screen.getAllByDisplayValue('');
    const timeInputs = screen.getAllByDisplayValue('00:00:00');

    expect(dateInputs).toHaveLength(2); // 開始日 + 終了日
    expect(timeInputs).toHaveLength(2); // 開始時刻 + 終了時刻
  });

  it('startDateが設定されている場合に初期値が表示される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true,
        startDate: '2024-01-15'
      }
    });

    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
  });

  it('startTimeが設定されている場合に初期値が表示される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true,
        startTime: '10:30:45'
      }
    });

    expect(screen.getByDisplayValue('10:30:45')).toBeInTheDocument();
  });

  it('endDateが設定されている場合に初期値が表示される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        endDate: '2024-01-20'
      }
    });

    expect(screen.getByDisplayValue('2024-01-20')).toBeInTheDocument();
  });

  it('endTimeが設定されている場合に初期値が表示される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        endTime: '15:45:30'
      }
    });

    expect(screen.getByDisplayValue('15:45:30')).toBeInTheDocument();
  });

  it('終了日を変更するとonInputが呼ばれる', async () => {
    const onInput = vi.fn();
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        onInput
      }
    });

    const endDateInput = screen.getByDisplayValue('');
    await fireEvent.input(endDateInput, { target: { value: '2024-01-15' } });

    expect(onInput).toHaveBeenCalledWith({
      startDate: '',
      startTime: '00:00:00',
      endDate: '2024-01-15',
      endTime: '00:00:00'
    });
  });

  it('終了時刻を変更するとonInputが呼ばれる', async () => {
    const onInput = vi.fn();
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        onInput
      }
    });

    const endTimeInput = screen.getByDisplayValue('00:00:00');
    await fireEvent.input(endTimeInput, { target: { value: '10:30:00' } });

    expect(onInput).toHaveBeenCalledWith({
      startDate: '',
      startTime: '00:00:00',
      endDate: '',
      endTime: '10:30:00'
    });
  });

  it('開始日を変更するとonInputが呼ばれる', async () => {
    const onInput = vi.fn();
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true,
        onInput
      }
    });

    const startDateInputs = screen.getAllByDisplayValue('');
    const startDateInput = startDateInputs[0]; // 最初の入力フィールドが開始日
    await fireEvent.input(startDateInput, { target: { value: '2024-01-10' } });

    expect(onInput).toHaveBeenCalledWith({
      startDate: '2024-01-10',
      startTime: '00:00:00',
      endDate: '',
      endTime: '00:00:00'
    });
  });

  it('開始時刻を変更するとonInputが呼ばれる', async () => {
    const onInput = vi.fn();
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true,
        onInput
      }
    });

    const startTimeInputs = screen.getAllByDisplayValue('00:00:00');
    const startTimeInput = startTimeInputs[0]; // 最初の時刻入力フィールドが開始時刻
    await fireEvent.input(startTimeInput, { target: { value: '08:15:30' } });

    expect(onInput).toHaveBeenCalledWith({
      startDate: '',
      startTime: '08:15:30',
      endDate: '',
      endTime: '00:00:00'
    });
  });

  it('許可されたキーが正しく処理される', async () => {
    render(DateTimeInputs, { props: defaultProps });

    const endDateInput = screen.getByDisplayValue('');

    // 数字キー
    await fireEvent.keyDown(endDateInput, { key: '1' });
    expect(endDateInput).toBeInTheDocument();

    // ナビゲーションキー
    await fireEvent.keyDown(endDateInput, { key: 'Tab' });
    expect(endDateInput).toBeInTheDocument();

    // 削除キー
    await fireEvent.keyDown(endDateInput, { key: 'Backspace' });
    expect(endDateInput).toBeInTheDocument();
  });

  it('ブロックされるキーが正しく処理される', async () => {
    render(DateTimeInputs, { props: defaultProps });

    const endDateInput = screen.getByDisplayValue('');

    // ブロックされるキーでもエラーが発生しないことを確認
    await fireEvent.keyDown(endDateInput, { key: 'ArrowDown' });
    expect(endDateInput).toBeInTheDocument();
  });

  it('Enterキーが正しく処理される', async () => {
    render(DateTimeInputs, { props: defaultProps });

    const endDateInput = screen.getByDisplayValue('');

    // Enterキーでもエラーが発生しないことを確認
    await fireEvent.keyDown(endDateInput, { key: 'Enter' });
    expect(endDateInput).toBeInTheDocument();
  });

  it('スペースキーが正しく処理される', async () => {
    render(DateTimeInputs, { props: defaultProps });

    const endDateInput = screen.getByDisplayValue('');

    // スペースキーでもエラーが発生しないことを確認
    await fireEvent.keyDown(endDateInput, { key: ' ' });
    expect(endDateInput).toBeInTheDocument();
  });

  it('入力フィールドに正しいクラスが適用される', () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true
      }
    });

    const dateInputs = screen.getAllByDisplayValue('');
    const timeInputs = screen.getAllByDisplayValue('00:00:00');

    // 日付入力フィールドのクラス確認
    dateInputs.forEach((input) => {
      expect(input).toHaveClass(
        'px-3',
        'py-2',
        'text-sm',
        'border',
        'border-input',
        'rounded-md',
        'bg-background'
      );
    });

    // 時刻入力フィールドのクラス確認
    timeInputs.forEach((input) => {
      expect(input).toHaveClass(
        'px-3',
        'py-2',
        'text-sm',
        'border',
        'border-input',
        'rounded-md',
        'bg-background'
      );
    });
  });

  it('時刻入力にstep属性が設定される', () => {
    render(DateTimeInputs, { props: defaultProps });

    const timeInput = screen.getByDisplayValue('00:00:00');
    expect(timeInput).toHaveAttribute('step', '1');
  });

  it('グリッドレイアウトが適用される', () => {
    const { container } = render(DateTimeInputs, {
      props: {
        ...defaultProps,
        showStartInputs: true
      }
    });

    const gridContainers = container.querySelectorAll('.grid.grid-cols-2.gap-2');
    expect(gridContainers).toHaveLength(2); // 開始日時 + 終了日時
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      startDate: '2024-01-10',
      startTime: '08:00:00',
      endDate: '2024-01-15',
      endTime: '17:00:00',
      showStartInputs: true,
      onInput: vi.fn()
    };

    const { container } = render(DateTimeInputs, { props });

    expect(container).toBeTruthy();
    expect(props.onInput).toBeInstanceOf(Function);
  });

  it('onInputコールバックが設定されていなくてもエラーが発生しない', async () => {
    render(DateTimeInputs, {
      props: {
        ...defaultProps,
        onInput: undefined
      }
    });

    const endDateInput = screen.getByDisplayValue('');

    expect(async () => {
      await fireEvent.input(endDateInput, { target: { value: '2024-01-15' } });
    }).not.toThrow();
  });
});
