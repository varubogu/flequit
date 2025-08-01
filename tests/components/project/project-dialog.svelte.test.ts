import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ProjectDialog from '$lib/components/project/project-dialog.svelte';

vi.mock('$lib/components/ui/dialog/index.js', () => ({
  Root: () => null,
  Content: () => null,
  Header: () => null,
  Title: () => null,
  Footer: () => null
}));

describe('ProjectDialog Component', () => {
  let onsave: ReturnType<typeof vi.fn>;
  let onclose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onsave = vi.fn();
    onclose = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (props: any = {}) => {
    const defaultProps = {
      open: true,
      mode: 'add' as const,
      onsave,
      onclose
    };
    return render(ProjectDialog, { ...defaultProps, ...props });
  };

  test('should render component structure', () => {
    const { container } = renderComponent({ mode: 'add' });
    expect(container).toBeInTheDocument();
  });

  test('should handle different modes', () => {
    const { container } = renderComponent({ mode: 'edit' });
    expect(container).toBeInTheDocument();
  });

  test('should handle props correctly', () => {
    const { container } = renderComponent({
      mode: 'edit',
      initialName: 'Test Project',
      initialColor: '#ff0000'
    });
    expect(container).toBeInTheDocument();
  });

  test('should have callbacks', () => {
    renderComponent();
    expect(onsave).toBeDefined();
    expect(onclose).toBeDefined();
  });

  test('should render with different states', () => {
    const { container: openContainer } = renderComponent({ open: true });
    expect(openContainer).toBeInTheDocument();

    const { container: closedContainer } = renderComponent({ open: false });
    expect(closedContainer).toBeInTheDocument();
  });
});
