# Datetime Format Specifications

## Data Structure

Refer to the following implementation files:

- `src/lib/types/datetime-format.ts` (domain types)
- `src/lib/stores/datetime-format.svelte.ts` (store state and persistence behavior)

## Format Application Targets

- All datetime input components
- All datetime display components

## About group(enum)

Groups are roughly classified into 4 types:

1. Default (empty string) ※Always one, defined in app and unchangeable
2. Preset (app-defined) ※Defined in app and unchangeable
3. Custom (user free text input) ※Always one, user input completed
4. Custom Format (user-defined format)

## About ID System

- **App Fixed Data (Default/Preset)**: Use negative integers (e.g., -1, -2, etc.)
- **User Custom Data (Custom Format)**: Use UUID
- App fixed data is not saved to database, defined in program

## Data Provided by App

- Data corresponding to Default (id:-1, name:meaning of "Default" according to language setting, format:empty string, group:default, order:0
- Data corresponding to Preset, standard settings by country defined ※Managed as objects in TypeScript files
  - Examples:
    - id:jp-0, name:Japan (Gregorian, 24-hour), format:yyyy年MM月dd日 HH:mm:ss, group:preset, order:0
    - id:jp-1, name:Japan (Era, 12-hour), format:yyyy年MM月dd日 hh:mm:ss, group:preset, order:0
    - id:en-1, name:America, format:MM/dd/yyyy HH:mm:ss, group:preset, order:1
- Data corresponding to "Custom" (id:-2, name:meaning of "Custom" according to language setting, format:empty string, group:custom, order:0

# Component List

## Test Datetime Input (Date, Time Input) ※New component to create

- Used for datetime format and test format preview
- Reflects current datetime on dialog initial display, then user can freely input

## Datetime Format (Text Box)

- Format handled in app
- Always synchronized with settings store (reflected to caller)

## Datetime Format Preview

- Display datetime using test datetime input and datetime format content

## "↓" Button

- Reflects datetime format to test format

## "↑" Button

- Reflects test format to datetime format

## Test Format (Text Box)

- Text box for users to try before changing datetime format

## Test Format Preview

- Display datetime using test datetime input and test format content

## Test Format Selection (Combo Box)

- Linked to test format
- Reflects to test format on selection change

## Format Name Change Before Label

- Display only when "Custom Format" is selected in format selection
- Display as "Change Before Label" → "Format Name Text Box"

## Format Name Text Box

- Display only when "Custom" or "Custom Format" is selected in format selection
- Item for naming or changing custom format

## "Add Format" Button

- Display only when "Custom" or "Custom Format" is selected in format selection
- Button for adding custom format

## "Overwrite Format" Button

- Display only when "Custom Format" is selected in format selection
- Button for saving custom format

## "Delete Format" Button

- Display only when "Custom Format" is selected in format selection
- Button for deleting custom format
- Show confirmation dialog before deletion

## Processing Content by Event

### Initial Display

Copy datetime format content to test format (no synchronization)
Accompanied by changes in "Test Format Selection" selection state, then changes in "Format Name" and "Save Format" display state

### Datetime Format Input Change

Update linked store

### ↓ Button Press

Reflect datetime format to test format
Accompanied by changes in "Test Format Selection", "Format Name", and "Save Format" state

### ↑ Button Press

Reflect test format to datetime format

### Test Format Input Change

- If format matches existing one, automatically select it in "Test Format Selection". Then display state of "Change Before Format Name", "Format Name", "Add Format", "Overwrite Format" changes

### Test Format Selection Combo Box Selection Change

- If "Custom" is selected, do nothing
- If other than "Custom", selection state of "Test Format Selection" changes based on input content, accompanied by changes in "Format Name" and "Save Format" display state

### Format Name Text Box Change

Nothing special

### Add Format Press

Perform new format addition
Assign new UUID for id. If collision occurs, reassign up to 10 times until success.

### Overwrite Format Press

Directly overwrite format with matching id

# UI State Management Design

## State Owner and Responsibility

### Store Management (Immediate Reflection)

- `currentFormat`: Current datetime format (setting value)
- `customFormats`: List of user-defined custom formats
- `allFormats`: Integrated list of app fixed + custom formats ($derived)

### Parent Component Management (Local State)

- `testDateTime`: Test datetime input
- `testFormat`: Test format (trial, independent from store)
- `testFormatName`: Format name input
- `selectedPreset`: Selected preset (automatically calculated from testFormat with $derived)

## Reactive Update Patterns

### Initialization

```typescript
$effect(() => {
  testFormat = store.currentFormat; // Get initial value from store
});
```

### State Synchronization

- **Datetime Format Change**: Immediate store reflection (power outage protection)
- **Custom Format Operations**: Immediate store reflection
- **Test Format Change**: selectedPreset automatically updated with $derived

# Notes

- Use Svelte5 runes etc. to express processing content by event without breakdown

## Validation Policy

- Datetime format string validity check is user responsibility, app basically performs no validation
- Save and display even invalid formats as-is, handle errors appropriately when actual datetime conversion fails

## Internationalization Policy

- Multi-language support for preset names and UI display based on language setting in Svelte store
- Display names for app fixed data (default/preset) are dynamically generated in program based on language setting
