import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ProjectDialog from '$lib/components/project/project-dialog.svelte';

describe('ProjectDialog save and close', () => {
  it('saves a trimmed name on click and on Enter, and ignores a blank name', async () => {
    const onsave = vi.fn();
    const onclose = vi.fn();
    render(ProjectDialog, {
      props: {
        open: true,
        mode: 'add',
        initialName: '  Home  ',
        initialColor: '#112233',
        onsave,
        onclose
      }
    });

    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toHaveValue('  Home  ');
    await fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(onsave).toHaveBeenCalledWith({ name: 'Home', color: '#112233' });
    expect(onclose).toHaveBeenCalledTimes(1);

    await fireEvent.input(screen.getByLabelText('Project Name'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: 'save' }));
    await fireEvent.keyDown(screen.getByLabelText('Project Name'), { key: 'Enter' });
    expect(onsave).toHaveBeenCalledTimes(1);

    await fireEvent.input(screen.getByLabelText('Project Name'), { target: { value: '  Garden ' } });
    await fireEvent.keyDown(screen.getByLabelText('Project Name'), { key: 'Enter' });
    expect(onsave).toHaveBeenLastCalledWith({ name: 'Garden', color: '#112233' });
  });

  it('titles an edit dialog and closes from cancel without a save callback', async () => {
    const onclose = vi.fn();
    render(ProjectDialog, {
      props: { open: true, mode: 'edit', initialName: 'Work', onclose }
    });

    expect(screen.getByText('Edit Project')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(onclose).toHaveBeenCalledOnce();

    await fireEvent.keyDown(screen.getByLabelText('Project Name'), { key: 'a' });
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('resets the fields when the dialog opens again', async () => {
    const view = render(ProjectDialog, {
      props: { open: false, mode: 'add', initialName: 'First', initialColor: '#abcdef', onclose: vi.fn() }
    });
    await view.rerender({
      open: true,
      mode: 'add',
      initialName: 'Second',
      initialColor: '#abcdef',
      onclose: vi.fn()
    });
    expect(screen.getByLabelText('Project Name')).toHaveValue('Second');
  });
});
