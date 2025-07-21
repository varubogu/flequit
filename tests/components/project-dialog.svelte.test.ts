import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProjectDialog from '../../src/lib/components/project-dialog.svelte';
import { tick } from 'svelte';

vi.mock('$lib/components/ui/dialog/index.js', async () => {
  const svelte = await import('svelte');

  const createSvelte5Mock = () => {
    return {
      new: (options: any) => {
        // Render the default slot if it exists
        options.props?.$$slots?.default?.();
        return {
          $set: vi.fn(),
          $destroy: vi.fn(),
          // Add any other methods or properties your component expects
        };
      },
    };
  };

  return {
    Root: createSvelte5Mock(),
    Content: createSvelte5Mock(),
    Header: createSvelte5Mock(),
    Title: createSvelte5Mock(),
    Footer: createSvelte5Mock(),
  };
});

describe('ProjectDialog Component', () => {
  let onsave: ReturnType<typeof vi.fn>;
  let onclose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onsave = vi.fn();
    onclose = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      open: true,
      mode: 'add',
      onsave,
      onclose,
    };
    return render(ProjectDialog, { ...defaultProps, ...props });
  };

  test('should render in add mode with correct title', () => {
    renderComponent({ mode: 'add' });
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  test('should render in edit mode with correct title', () => {
    renderComponent({ mode: 'edit' });
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
  });

  test('should bind initial values correctly', () => {
    renderComponent({
      mode: 'edit',
      initialName: 'My Project',
      initialColor: '#ff0000',
    });
    const nameInput = screen.getByLabelText('Project Name');
    const colorInput = screen.getByLabelText('Project Color');
    expect((nameInput as HTMLInputElement).value).toBe('My Project');
    expect((colorInput as HTMLInputElement).value).toBe('#ff0000');
  });

  test('should update form values on input', async () => {
    renderComponent();
    const nameInput = screen.getByLabelText('Project Name');
    const colorInput = screen.getByLabelText('Project Color');

    await fireEvent.input(nameInput, { target: { value: 'New Name' } });
    await fireEvent.input(colorInput, { target: { value: '#00ff00' } });

    expect((nameInput as HTMLInputElement).value).toBe('New Name');
    expect((colorInput as HTMLInputElement).value).toBe('#00ff00');
  });

  test('save button should be disabled if name is empty', () => {
    renderComponent({ initialName: '' });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });

  test('save button should be enabled if name is not empty', async () => {
    renderComponent({ initialName: '' });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText('Project Name');
    await fireEvent.input(nameInput, { target: { value: 'A valid name' } });

    expect(saveButton).not.toBeDisabled();
  });

  test('should call onsave with trimmed name and color on save button click', async () => {
    renderComponent();
    const nameInput = screen.getByLabelText('Project Name');
    await fireEvent.input(nameInput, { target: { value: '  My Project  ' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveButton);

    expect(onsave).toHaveBeenCalledWith({
      name: 'My Project',
      color: '#3b82f6', // default color
    });
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  test('should call onsave on Enter key press in name input', async () => {
    renderComponent();
    const nameInput = screen.getByLabelText('Project Name');
    await fireEvent.input(nameInput, { target: { value: 'Enter Press' } });
    await fireEvent.keyDown(nameInput, { key: 'Enter' });

    expect(onsave).toHaveBeenCalledWith({
      name: 'Enter Press',
      color: '#3b82f6',
    });
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  test('should not call onsave if name is empty on save', async () => {
    renderComponent({ initialName: '' });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveButton);

    const nameInput = screen.getByLabelText('Project Name');
    await fireEvent.keyDown(nameInput, { key: 'Enter' });

    expect(onsave).not.toHaveBeenCalled();
  });

  test('should call onclose on cancel button click', async () => {
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await fireEvent.click(cancelButton);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  test('should reset state when reopened', async () => {
    const { rerender } = renderComponent({
      open: false,
      initialName: 'Old Name',
    });

    // Rerender the component with `open: true` to simulate reopening
    await rerender({
      open: true,
      mode: 'edit',
      initialName: 'New Name',
      initialColor: '#ffffff',
      onsave,
      onclose,
    });

    await tick(); // Wait for state updates

    const newNameInput = screen.getByLabelText('Project Name');
    const newColorInput = screen.getByLabelText('Project Color');

    expect((newNameInput as HTMLInputElement).value).toBe('New Name');
    expect((newColorInput as HTMLInputElement).value).toBe('#ffffff');
  });
});
