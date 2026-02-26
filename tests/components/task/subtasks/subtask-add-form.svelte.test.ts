import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import SubTaskAddForm from '$lib/components/task/forms/subtask-add-form.svelte';

const setup = () => {
  const onSubTaskAdded = vi.fn();
  const onCancel = vi.fn();
  const result = render(SubTaskAddForm, { onSubTaskAdded, onCancel });

  const textbox = result.getByRole('textbox');
  const addButton = result.getByTitle('add_subtask');
  const cancelButton = result.getByTitle('cancel');

  return { result, textbox, addButton, cancelButton, onSubTaskAdded, onCancel };
};

describe('SubTaskAddForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and actions', () => {
    const { textbox, addButton, cancelButton } = setup();
    expect(textbox).toBeInTheDocument();
    expect(addButton).toBeDisabled();
    expect(cancelButton).toBeInTheDocument();
  });

  it('enables save button when title entered', async () => {
    const { textbox, addButton } = setup();
    await fireEvent.input(textbox, { target: { value: 'New subtask' } });
    expect(addButton).not.toBeDisabled();
  });

  it('invokes onSubTaskAdded when save clicked', async () => {
    const { textbox, addButton, onSubTaskAdded } = setup();
    await fireEvent.input(textbox, { target: { value: 'New subtask' } });
    await fireEvent.click(addButton);
    expect(onSubTaskAdded).toHaveBeenCalledWith('New subtask');
    expect(textbox).toHaveValue('');
    expect(addButton).toBeDisabled();
  });

  it('does not submit empty titles', async () => {
    const { addButton, onSubTaskAdded } = setup();
    await fireEvent.click(addButton);
    expect(onSubTaskAdded).not.toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    const { textbox, onSubTaskAdded, onCancel } = setup();
    await fireEvent.input(textbox, { target: { value: 'Keyboard subtask' } });
    await fireEvent.keyDown(textbox, { key: 'Enter' });
    expect(onSubTaskAdded).toHaveBeenCalledWith('Keyboard subtask');
    await fireEvent.keyDown(textbox, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('clears input when cancel clicked', async () => {
    const { textbox, cancelButton, onCancel } = setup();
    await fireEvent.input(textbox, { target: { value: 'Temp value' } });
    await fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
    expect(textbox).toHaveValue('');
  });
});
