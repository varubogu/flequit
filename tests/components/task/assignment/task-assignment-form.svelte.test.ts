import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskAssignmentForm from '$lib/components/task/assignment/task-assignment-form.svelte';
import type { User } from '$lib/types/user';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    handleId: 'ada',
    displayName: 'Ada Lovelace',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
    updatedBy: 'user-1',
    ...overrides
  };
}

describe('TaskAssignmentForm', () => {
  it('renders nothing when every user is already assigned', () => {
    const { container } = render(TaskAssignmentForm, {
      props: { unassignedUsers: [], isLoading: false, onAssign: vi.fn() }
    });

    expect(container.textContent?.trim()).toBe('');
  });

  it('renders initials or an avatar and assigns the user', async () => {
    const onAssign = vi.fn();
    render(TaskAssignmentForm, {
      props: {
        unassignedUsers: [
          buildUser(),
          buildUser({
            id: 'user-2',
            displayName: '',
            handleId: 'grace',
            avatarUrl: 'https://example.test/grace.png'
          })
        ],
        isLoading: false,
        onAssign
      }
    });

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByAltText('grace')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/ }));
    expect(onAssign).toHaveBeenCalledWith('user-1');
  });

  it('disables assign while loading', () => {
    render(TaskAssignmentForm, {
      props: {
        unassignedUsers: [buildUser()],
        isLoading: true,
        onAssign: vi.fn()
      }
    });

    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeDisabled();
  });
});
