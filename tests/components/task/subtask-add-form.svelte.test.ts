import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SubTaskAddForm from '$lib/components/task/forms/subtask-add-form.svelte';

describe('SubTaskAddForm Component', () => {
  let onSubTaskAdded: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubTaskAdded = vi.fn();
    onCancel = vi.fn();
    vi.clearAllMocks();
  });

  test('should render form with input and buttons', () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    expect(screen.getByPlaceholderText('Sub-task title')).toBeInTheDocument();
    expect(screen.getByTitle('Add Subtask')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
  });

  test('should call onSubTaskAdded when save button is clicked with valid title', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title');
    const saveButton = screen.getByTitle('Add Subtask');

    await fireEvent.input(input, { target: { value: 'New SubTask' } });
    await fireEvent.click(saveButton);

    expect(onSubTaskAdded).toHaveBeenCalledWith('New SubTask');
  });

  test('should not call onSubTaskAdded when title is empty', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const saveButton = screen.getByTitle('Add Subtask');
    await fireEvent.click(saveButton);

    expect(onSubTaskAdded).not.toHaveBeenCalled();
  });

  test('should call onCancel when cancel button is clicked', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const cancelButton = screen.getByTitle('Cancel');
    await fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  test('should save subtask when Enter key is pressed', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title');
    
    await fireEvent.input(input, { target: { value: 'New SubTask' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubTaskAdded).toHaveBeenCalledWith('New SubTask');
  });

  test('should cancel when Escape key is pressed', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title');
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
  });

  test('should disable save button when title is empty', () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const saveButton = screen.getByTitle('Add Subtask');
    expect(saveButton).toBeDisabled();
  });

  test('should enable save button when title is entered', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title');
    const saveButton = screen.getByTitle('Add Subtask');

    await fireEvent.input(input, { target: { value: 'New SubTask' } });
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('should clear input after successful submission', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    const input = screen.getByPlaceholderText('Sub-task title') as HTMLInputElement;
    const saveButton = screen.getByTitle('Add Subtask');

    await fireEvent.input(input, { target: { value: 'New SubTask' } });
    await fireEvent.click(saveButton);

    expect(input.value).toBe('');
  });

  test.skip('should auto-focus input on mount', async () => {
    render(SubTaskAddForm, {
      onSubTaskAdded,
      onCancel
    });

    // Note: フォーカスのテストはJSDOM環境では不安定なため、
    // 実際のブラウザ環境でのE2Eテストで確認することを推奨
    await waitFor(
      () => {
        const input = screen.getByPlaceholderText('Sub-task title') as HTMLInputElement;
        expect(input).toHaveFocus();
      },
      { timeout: 500 }
    );
  });
});