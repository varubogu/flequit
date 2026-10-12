import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ErrorPanel from '$lib/components/error/error-panel.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';

describe('ErrorPanel', () => {
  beforeEach(() => {
    errorHandler.clearAllErrors();
  });

  it('renders nothing when there are no errors', () => {
    const { container } = render(ErrorPanel);
    expect(container.querySelector('.fixed')).toBeNull();
  });

  it('renders one toast per stored error', () => {
    errorHandler.addError({ type: 'validation', message: 'First', retryable: true });
    errorHandler.addError({ type: 'sync', message: 'Second', retryable: true });

    render(ErrorPanel);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
