import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';

// Simple test component that uses error handler directly
import { SvelteComponent } from 'svelte';

// Create a simple test component instead of testing the complex ErrorPanel
const TestComponent = `
<script>
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  const errors = $derived(errorHandler.errors);
</script>

{#if errors.length > 0}
  <div data-testid="error-container" class="error-panel">
    {#each errors as error (error.id)}
      <div data-testid="error-item" class="error-item">
        {error.message}
      </div>
    {/each}
  </div>
{/if}
`;

describe('ErrorPanel (Store Integration)', () => {
  beforeEach(() => {
    // Clear all errors before each test
    errorHandler.clearAllErrors();
  });

  it('should integrate with error handler store', () => {
    // Test the error handler store directly
    expect(errorHandler.errors.length).toBe(0);
    
    // Add an error
    const errorId = errorHandler.addError({
      type: 'validation',
      message: 'Test error message',
      retryable: false
    });
    
    expect(errorHandler.errors.length).toBe(1);
    expect(errorHandler.errors[0].message).toBe('Test error message');
    expect(errorHandler.errors[0].type).toBe('validation');
    expect(errorHandler.errors[0].retryable).toBe(false);
    expect(errorHandler.errors[0].id).toBe(errorId);
  });

  it('should handle multiple errors', () => {
    // Add multiple errors
    const errorId1 = errorHandler.addError({
      type: 'validation',
      message: 'First error',
      retryable: false
    });
    
    const errorId2 = errorHandler.addError({
      type: 'network',
      message: 'Second error',
      retryable: true
    });

    expect(errorHandler.errors.length).toBe(2);
    expect(errorHandler.errors[0].message).toBe('First error');
    expect(errorHandler.errors[1].message).toBe('Second error');
  });

  it('should remove specific errors', () => {
    const errorId1 = errorHandler.addError({
      type: 'validation',
      message: 'First error',
      retryable: false
    });
    
    const errorId2 = errorHandler.addError({
      type: 'network',
      message: 'Second error',
      retryable: true
    });

    expect(errorHandler.errors.length).toBe(2);
    
    // Remove first error
    errorHandler.removeError(errorId1);
    
    expect(errorHandler.errors.length).toBe(1);
    expect(errorHandler.errors[0].message).toBe('Second error');
  });

  it('should clear all errors', () => {
    // Add multiple errors
    errorHandler.addError({
      type: 'validation',
      message: 'First error',
      retryable: false
    });
    
    errorHandler.addError({
      type: 'network',
      message: 'Second error',
      retryable: true
    });

    expect(errorHandler.errors.length).toBe(2);
    
    // Clear all errors
    errorHandler.clearAllErrors();
    
    expect(errorHandler.errors.length).toBe(0);
  });

  it('should handle different error types', () => {
    const errorTypes: Array<{ type: 'sync' | 'validation' | 'network' | 'general', message: string }> = [
      { type: 'sync', message: 'Sync error' },
      { type: 'validation', message: 'Validation error' },
      { type: 'network', message: 'Network error' },
      { type: 'general', message: 'General error' }
    ];

    // Add errors of different types
    errorTypes.forEach(({ type, message }) => {
      errorHandler.addError({ type, message, retryable: false });
    });

    expect(errorHandler.errors.length).toBe(4);
    
    // Check each error type
    errorTypes.forEach((expected, index) => {
      expect(errorHandler.errors[index].type).toBe(expected.type);
      expect(errorHandler.errors[index].message).toBe(expected.message);
    });
  });

  it('should include context information', () => {
    const errorId = errorHandler.addError({
      type: 'validation',
      message: 'Validation failed',
      retryable: false,
      details: 'Field is required',
      context: {
        operation: 'create_task',
        resourceType: 'task',
        resourceId: 'task-123'
      }
    });

    const error = errorHandler.errors[0];
    expect(error.details).toBe('Field is required');
    expect(error.context?.operation).toBe('create_task');
    expect(error.context?.resourceType).toBe('task');
    expect(error.context?.resourceId).toBe('task-123');
  });

  it('should auto-remove non-retryable errors after timeout', () => {
    // Mock setTimeout for testing
    const originalSetTimeout = global.setTimeout;
    let timeoutCallback: (() => void) = () => {};
    
    const mockSetTimeout = vi.fn((callback: () => void, delay: number) => {
      timeoutCallback = callback;
      return 123 as any; // Return a mock timer ID
    }) as any;
    mockSetTimeout.__promisify__ = vi.fn();
    global.setTimeout = mockSetTimeout;

    const errorId = errorHandler.addError({
      type: 'validation',
      message: 'Auto-remove error',
      retryable: false
    });

    expect(errorHandler.errors.length).toBe(1);
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

    // Simulate timeout
    timeoutCallback();

    expect(errorHandler.errors.length).toBe(0);

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  it('should not auto-remove retryable errors', () => {
    // Mock setTimeout for testing
    const mockSetTimeout = vi.fn() as any;
    mockSetTimeout.__promisify__ = vi.fn();
    global.setTimeout = mockSetTimeout;

    const errorId = errorHandler.addError({
      type: 'network',
      message: 'Retryable error',
      retryable: true
    });

    expect(errorHandler.errors.length).toBe(1);
    expect(global.setTimeout).not.toHaveBeenCalled();
  });
});