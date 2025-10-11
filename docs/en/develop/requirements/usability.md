# Usability Design Document

## 1. Keyboard Operation

### 1.1 Basic Policy

- All functions operable with keyboard only
- Design supporting mouse operation, keyboard operation, and touch operation
- Realize efficient workflows
- All of these are implemented on the frontend (Svelte side)
- Also create CLI version for PC and server use

### 1.2 Shortcut Keys

Initial settings are as follows, and users can customize them themselves.

- Basic Operations
  - Create Task: Ctrl+N
  - Create Subtask: Ctrl+Shift+N
  - Edit Task: Enter
  - Delete Task: Delete, Backspace
  - Search: Ctrl+F
  - Duplicate: Ctrl+D
- Navigation
  - Move between tasks: ↑↓
  - Move between sidebar, task list, task details: ←, →, Tab for →, Shift+Tab for ← ※Loops
  - Switch Project: Ctrl+P
  - Tag Operations: Ctrl+T
  - vim mode also supported (hjkl for movement), configurable as option
- Customization
  - User-defined shortcuts
  - Command palette support
  - Key binding settings UI

### 1.3 Focus Management

- Visual focus display
- Logical focus order
- Focus trap within modals
- Focus position retention

## 2. Multilingual Support

### 2.1 Paraglide Implementation

- Message Management
  - Centralized translation key management
  - Type-safe translation
  - Automatic message extraction
- Supported Languages
  - Japanese (default)
  - English
  - Other languages (added based on demand)

### 2.2 Language Switching

- Language Selection UI
  - Switching in settings screen
  - Language selection persistence
- Dynamic Content
  - Multilingual support for user input
  - Date/time format localization
  - Number format localization

### 2.3 Fallback

- Handling of untranslated text
- Automatic switching to default language
- Detection of translation omissions

## 3. UI/UX Design

### 3.1 Visual Feedback

- Clear focus state indication
- Operation result notifications
- Error display improvements
- Progress indication

### 3.2 Layout

- Consistent structure
- Logical placement
- Appropriate spacing
- Responsive support

### 3.3 Text Display

- Readable fonts
- Appropriate font sizes
- Sufficient line spacing
- Text contrast

### 3.4 Data Protection Features

#### 3.4.1 Unsaved Changes Confirmation

- **Target Operations**
  - Selecting different task while editing task details
  - Screen switching via side menu
  - Closing browser tab/window operations
  - Page navigation operations

- **Confirmation Conditions**
  - Show confirmation dialog only when in edit mode and changes exist from original data
  - No confirmation needed if completely matches original data

- **Confirmation Dialog**
  - Message: "There are unsaved changes. Are you sure you want to discard them?"
  - Options: "Save and Move" / "Discard and Move" / "Cancel"
  - Keyboard Operation: Escape to cancel, Enter to discard and move

- **Behavior Specifications**
  - "Save and Move": Save current changes then execute operation
  - "Discard and Move": Discard changes and execute operation
  - "Cancel": Cancel operation and continue edit mode

#### 3.4.2 Auto-save Functionality

- Temporary save of data being edited (using localStorage)
- Recovery functionality on application abnormal termination
- Configurable auto-save intervals

## 4. Customization Features

### 4.1 User Settings

- Font size adjustment
- Contrast adjustment
- Animation control
- Keyboard shortcut settings

### 4.2 Theme Settings

- Light/Dark mode
- Custom themes
- Color settings
