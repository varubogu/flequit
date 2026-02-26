# General Coding Rules

## File Structure

### Basic Principles

- **Single Responsibility Principle**: One function per file
- **File Size**: Mandatory split when exceeding 200 lines, consider splitting at 100 lines

### Naming Conventions

- **Components**: Kebab-case (`task-item.svelte`)
- **Others**: Follow TypeScript standard conventions

## Internationalization Support

- All UI-related text must support multiple languages
- UI language can be selected in settings screen, with immediate reflection after selection (reactive support, no reload required)
- Messages always use internationalization with Inlang Paraglide

### Usage

```typescript
import * as m from '$paraglide/messages';
import { reactiveMessage } from '$lib/stores/locale.svelte';
const msg_task_title = reactiveMessage(m.task_title());
```

```svelte
<h1>{$msg_task_title}</h1>
```

## Development Constraints

- **Development Server**: `bun run dev` is prohibited (user is using it)
- **E2E Tests**: Prohibited to run all, only individual file execution allowed
- **Test Timeout**: Number of tests in file × 1 minute
