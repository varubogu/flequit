import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UserProfileButton from '$lib/components/user/user-profile-button.svelte';

const user = {
  id: 'user-1',
  name: 'Hana Sato',
  email: 'hana@example.com'
};

describe('UserProfileButton', () => {
  test('shows initials, an avatar, or the signed-out icon when collapsed', () => {
    const ontoggle = vi.fn();
    const initials = render(UserProfileButton, {
      props: { user, collapsed: true, showMenu: false, ontoggle }
    });
    expect(screen.getByRole('button')).toHaveTextContent('HS');
    expect(screen.queryByText('Hana Sato')).not.toBeInTheDocument();
    initials.unmount();

    render(UserProfileButton, {
      props: {
        user: { ...user, avatar: 'https://example.com/hana.png' },
        collapsed: true,
        showMenu: false,
        ontoggle
      }
    });
    const image = screen.getByRole('img', { name: 'Hana Sato' });
    expect(image).toHaveAttribute('src', 'https://example.com/hana.png');
  });

  test('shows the signed-out icon without a name when collapsed and unsigned', () => {
    const { container } = render(UserProfileButton, {
      props: { user: null, collapsed: true, showMenu: false, ontoggle: vi.fn() }
    });
    expect(screen.queryByText('not_signed_in')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
