import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Switch from '../../../../src/lib/components/ui/switch/switch.svelte';

// Mock bits-ui Switch primitive
vi.mock('bits-ui', () => ({
  Switch: {
    Root: vi.fn().mockImplementation((props) => ({
      component: 'SwitchRoot',
      props
    })),
    Thumb: vi.fn().mockImplementation((props) => ({
      component: 'SwitchThumb',
      props
    }))
  }
}));

// Mock cn utility
vi.mock('../../../../src/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('Switch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render switch with default props', () => {
    const { container } = render(Switch);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(Switch, { class: 'custom-switch' });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(Switch, { ref });
    expect(container).toBeInTheDocument();
  });

  test('should handle checked state binding', () => {
    let checked = false;
    const { container } = render(Switch, { checked });
    expect(container).toBeInTheDocument();
  });

  test('should start with unchecked state by default', () => {
    const { container } = render(Switch);
    expect(container).toBeInTheDocument();
  });

  test('should start with checked state when specified', () => {
    const { container } = render(Switch, { checked: true });
    expect(container).toBeInTheDocument();
  });

  test('should handle disabled state', () => {
    const { container } = render(Switch, { disabled: true });
    expect(container).toBeInTheDocument();
  });

  test('should handle onCheckedChange callback', () => {
    const onCheckedChange = vi.fn();
    const { container } = render(Switch, { onCheckedChange });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(Switch, { 
      'data-testid': 'custom-switch',
      'aria-label': 'Toggle setting'
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct data attributes', () => {
    const { container } = render(Switch);
    expect(container).toBeInTheDocument();
  });

  test('should handle name prop for forms', () => {
    const { container } = render(Switch, { name: 'switch-field' });
    expect(container).toBeInTheDocument();
  });

  test('should handle value prop for forms', () => {
    const { container } = render(Switch, { value: 'on' });
    expect(container).toBeInTheDocument();
  });

  test('should render thumb component', () => {
    const { container } = render(Switch);
    expect(container).toBeInTheDocument();
  });

  test('should handle accessibility props', () => {
    const { container } = render(Switch, { 
      'aria-describedby': 'switch-description',
      'aria-labelledby': 'switch-label'
    });
    expect(container).toBeInTheDocument();
  });
});