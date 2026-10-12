import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import ErrorToast from '$lib/components/error/error-toast.svelte';
import { errorHandler, type ErrorInfo } from '$lib/stores/error-handler.svelte';

function buildError(overrides: Partial<ErrorInfo> = {}): ErrorInfo {
  return {
    id: 'error-1',
    type: 'general',
    message: 'Something failed',
    retryable: false,
    timestamp: new Date() as ErrorInfo['timestamp'],
    ...overrides
  };
}

describe('ErrorToast', () => {
  beforeEach(() => {
    errorHandler.clearAllErrors();
  });

  it.each(['sync', 'network', 'validation', 'general'] as const)(
    'renders a %s error',
    (type) => {
      render(ErrorToast, {
        props: {
          error: buildError({
            type,
            details: 'more detail',
            context: { operation: 'save', resourceType: 'task', resourceId: 'task-1' }
          })
        }
      });

      expect(screen.getByText('Something failed')).toBeInTheDocument();
      expect(screen.getByText('more detail')).toBeInTheDocument();
      expect(screen.getByText(/操作: save/)).toBeInTheDocument();
      expect(screen.getByText(/task: task-1/)).toBeInTheDocument();
    }
  );

  it('omits optional details and resource id', () => {
    render(ErrorToast, {
      props: {
        error: buildError({
          context: { operation: 'load' }
        })
      }
    });

    expect(screen.queryByText('more detail')).not.toBeInTheDocument();
    expect(screen.getByText('操作: load')).toBeInTheDocument();
  });

  it('dismisses the error and treats retry as dismiss', async () => {
    errorHandler.addError({ type: 'network', message: 'offline', retryable: true });
    const error = errorHandler.errors[0];
    render(ErrorToast, { props: { error } });

    await fireEvent.click(screen.getByTitle('再試行'));
    expect(errorHandler.errors).toHaveLength(0);
    cleanup();

    errorHandler.addError({ type: 'general', message: 'again', retryable: false });
    const next = errorHandler.errors[0];
    render(ErrorToast, { props: { error: next } });
    expect(screen.queryByTitle('再試行')).not.toBeInTheDocument();
    await fireEvent.click(screen.getByTitle('閉じる'));
    expect(errorHandler.errors).toHaveLength(0);
  });
});
