# Frontend-specific Coding Rules

## Svelte 5 Design Patterns

### State Management
- **$state**: Reactive state
- **$derived**: Derived state (computed properties)
- **$effect**: Side effect processing
- **Class-based stores**: Used for complex state management

### Component Design
- **props**: `let { prop }: Props = $props()`
- **Events**: Prioritize callback functions, use CustomEvent only when necessary
- **Snippets**: Use `Snippet` type for passing child content

## Component Design Principles

- Maintain originality of shadcn-svelte components (`@src/lib/components/ui` as much as possible
- Place feature-specific components in appropriate directories
- Consider functional separation when exceeding 200 lines
- Always internationalize messages using Inlang Paraglide
- When creating component unit tests, do not mock external UI libraries. Mock everything except external UI libraries

### ❌ Prohibited Pattern: `-logic.svelte.ts` Files

**Use of `-logic.svelte.ts` pattern is prohibited in new development.**

Reasons:
- Svelte 5 runes are designed to be used directly within components
- Class-based logic creates excessive abstraction and reduces readability
- Props binding becomes complex and worsens maintainability

**Recommended Pattern**:

```svelte
<!-- ❌ Old pattern (prohibited) -->
<script lang="ts">
  import { TaskItemLogic } from './task-item-logic.svelte';
  const logic = new TaskItemLogic();
</script>

<button onclick={logic.handleEdit.bind(logic)}>Edit</button>

<!-- ✅ New pattern (recommended) -->
<script lang="ts">
  let isEditing = $state(false);
  let editedTitle = $state('');

  function handleEdit() {
    isEditing = true;
  }
</script>

<button onclick={handleEdit}>Edit</button>
```

**Handling Existing Code**:
- Existing `-logic.svelte.ts` files will be gradually migrated
- Use the recommended pattern above when adding new features

## Layer Architecture

For details, refer to `docs/develop/design/frontend/layers.md`.

**Important Rules**:
- ❌ **Direct access from components to `infrastructure/` is prohibited**
- ✅ **Always access via `services/`**
- ❌ **Direct writing to stores is prohibited**
- ✅ **Writing must always go through Domain Service**

```typescript
// ❌ NG: Direct access to Infrastructure layer
import { TauriBackend } from '$lib/infrastructure/backends/tauri';

// ✅ OK: Via Services layer
import { TaskService } from '$lib/services';
```

## Development Workflow

For details, refer to `docs/develop/rules/workflow.md`.
