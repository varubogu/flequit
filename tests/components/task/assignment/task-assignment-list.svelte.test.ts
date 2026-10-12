import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskAssignmentList from '$lib/components/task/assignment/task-assignment-list.svelte';
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

describe('TaskAssignmentList', () => {
  it('shows an empty message when nobody is assigned', () => {
    render(TaskAssignmentList, {
      props: { assignedUsers: [], isLoading: false, onUnassign: vi.fn() }
    });

    expect(screen.getByText('まだユーザーが割り当てられていません')).toBeInTheDocument();
  });

  it('renders initials or an avatar and unassigns the user', async () => {
    const onUnassign = vi.fn();
    render(TaskAssignmentList, {
      props: {
        assignedUsers: [
          buildUser(),
          buildUser({
            id: 'user-2',
            displayName: '',
            handleId: 'grace hopper',
            avatarUrl: 'https://example.test/grace.png'
          })
        ],
        isLoading: false,
        onUnassign
      }
    });

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('grace hopper')).toBeInTheDocument();
    expect(screen.getByAltText('grace hopper')).toHaveAttribute(
      'src',
      'https://example.test/grace.png'
    );

    const buttons = screen.getAllByRole('button');
    await fireEvent.click(buttons[0]);
    expect(onUnassign).toHaveBeenCalledWith('user-1');
  });

  it('disables unassign while loading', () => {
    render(TaskAssignmentList, {
      props: {
        assignedUsers: [buildUser()],
        isLoading: true,
        onUnassign: vi.fn()
      }
    });

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
