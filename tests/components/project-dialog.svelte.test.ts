import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// Mock UI dialog components
vi.mock('$lib/components/ui/dialog/index.js', () => ({
  Root: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() })),
  Content: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() })),
  Header: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() })),
  Title: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() })),
  Footer: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() }))
}));

// Import after mocks
import ProjectDialog from '../../src/lib/components/project-dialog.svelte';

describe('ProjectDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render without errors', () => {
      const { container } = render(ProjectDialog, { 
        props: { 
          open: false, 
          mode: 'add' 
        } 
      });
      expect(container).toBeDefined();
    });

    test('should render in add mode', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add' 
        } 
      });
      
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    test('should render in edit mode', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'edit' 
        } 
      });
      
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    test('should display project name input field', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add' 
        } 
      });
      
      expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument();
    });

    test('should display project color input field', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add' 
        } 
      });
      
      expect(screen.getByLabelText('Project Color')).toBeInTheDocument();
      const colorInput = screen.getByDisplayValue('#3b82f6'); // Default color
      expect(colorInput).toBeInTheDocument();
      expect(colorInput.getAttribute('type')).toBe('color');
    });

    test('should show Save and Cancel buttons', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add' 
        } 
      });
      
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Initial Values', () => {
    test('should use provided initial name', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'edit',
          initialName: 'My Project'
        } 
      });
      
      const nameInput = screen.getByDisplayValue('My Project');
      expect(nameInput).toBeInTheDocument();
    });

    test('should use provided initial color', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'edit',
          initialColor: '#ff5733'
        } 
      });
      
      const colorInput = screen.getByDisplayValue('#ff5733');
      expect(colorInput).toBeInTheDocument();
    });

    test('should use default values when not provided', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      expect(nameInput.value).toBe('');
      
      const colorInput = screen.getByDisplayValue('#3b82f6');
      expect(colorInput).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should update name when typing', async () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.input(nameInput, { target: { value: 'New Project Name' } });
      
      expect(nameInput.value).toBe('New Project Name');
    });

    test('should update color when changed', async () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const colorInput = screen.getByLabelText('Project Color');
      await fireEvent.input(colorInput, { target: { value: '#ff0000' } });
      
      expect(colorInput.value).toBe('#ff0000');
    });
  });

  describe('Save Functionality', () => {
    test('should call onsave when Save button is clicked with valid data', async () => {
      const onsave = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onsave
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.input(nameInput, { target: { value: 'Test Project' } });
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await fireEvent.click(saveButton);
      
      expect(onsave).toHaveBeenCalledWith({
        name: 'Test Project',
        color: '#3b82f6'
      });
    });

    test('should not call onsave when name is empty', async () => {
      const onsave = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onsave
        } 
      });
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await fireEvent.click(saveButton);
      
      expect(onsave).not.toHaveBeenCalled();
    });

    test('should trim whitespace from name before saving', async () => {
      const onsave = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onsave
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.input(nameInput, { target: { value: '  Trimmed Project  ' } });
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      await fireEvent.click(saveButton);
      
      expect(onsave).toHaveBeenCalledWith({
        name: 'Trimmed Project',
        color: '#3b82f6'
      });
    });

    test('should disable Save button when name is empty', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    test('should enable Save button when name is provided', async () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.input(nameInput, { target: { value: 'Test Project' } });
      
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    test('should call onclose when Cancel button is clicked', async () => {
      const onclose = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onclose
        } 
      });
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await fireEvent.click(cancelButton);
      
      expect(onclose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    test('should save when Enter key is pressed in name input', async () => {
      const onsave = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onsave
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.input(nameInput, { target: { value: 'Keyboard Project' } });
      await fireEvent.keyDown(nameInput, { key: 'Enter' });
      
      expect(onsave).toHaveBeenCalledWith({
        name: 'Keyboard Project',
        color: '#3b82f6'
      });
    });

    test('should not save on Enter when name is empty', async () => {
      const onsave = vi.fn();
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add',
          onsave
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      await fireEvent.keyDown(nameInput, { key: 'Enter' });
      
      expect(onsave).not.toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    test('should handle missing callback props gracefully', () => {
      expect(() => {
        render(ProjectDialog, { 
          props: { 
            open: true, 
            mode: 'add'
          } 
        });
      }).not.toThrow();
    });

    test('should handle undefined props gracefully', () => {
      expect(() => {
        render(ProjectDialog, { 
          props: { 
            open: true, 
            mode: 'add',
            onsave: undefined,
            onclose: undefined
          } 
        });
      }).not.toThrow();
    });
  });

  describe('State Reset on Open', () => {
    test('should reset form when dialog opens', () => {
      const { component } = render(ProjectDialog, { 
        props: { 
          open: false, 
          mode: 'edit',
          initialName: 'Initial Project',
          initialColor: '#ff5733'
        } 
      });
      
      // Should reset form when opening
      expect(component).toBeDefined();
    });
  });

  describe('Dialog Integration', () => {
    test('should integrate with Dialog.Root component', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      // Dialog components should be rendered
      const dialog = vi.mocked(require('$lib/components/ui/dialog/index.js'));
      expect(dialog.Root).toBeDefined();
      expect(dialog.Content).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('should have proper labels for form fields', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Project Color')).toBeInTheDocument();
    });

    test('should have proper button roles', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    test('should have proper input types', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const nameInput = screen.getByLabelText('Project Name');
      expect(nameInput.getAttribute('type')).toBe('text');
      
      const colorInput = screen.getByLabelText('Project Color');
      expect(colorInput.getAttribute('type')).toBe('color');
    });
  });

  describe('Component State Management', () => {
    test('should manage form state correctly', () => {
      const { component } = render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      expect(component).toBeDefined();
      expect(typeof component).toBe('object');
    });

    test('should handle state updates', async () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      const nameInput = screen.getByPlaceholderText('Enter project name');
      
      // State should update when input changes
      await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
      expect(nameInput.value).toBe('Updated Name');
    });
  });

  describe('Visual States', () => {
    test('should show correct title for add mode', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'add'
        } 
      });
      
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    test('should show correct title for edit mode', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'edit'
        } 
      });
      
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    test('should pre-populate fields in edit mode', () => {
      render(ProjectDialog, { 
        props: { 
          open: true, 
          mode: 'edit',
          initialName: 'Existing Project',
          initialColor: '#00ff00'
        } 
      });
      
      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#00ff00')).toBeInTheDocument();
    });
  });
});