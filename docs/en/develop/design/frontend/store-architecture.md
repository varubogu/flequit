# Frontend Store Architecture Guidelines

## Purpose

- Treat stores as the unified reactive state cache of the application and delegate side effects to the services layer.
- Clarify dependency structure and initialization order to avoid circular references and bootstrap issues.
- Maintain testability and swap-ability while keeping operational overhead low.

## Core Principles

- Define stores as singletons and initialize them during the application bootstrap phase.
- Compose stores at the root (layout) level and pass instances explicitly to child components (via props or context).
- Keep side effects (persistence, network, composite logic) inside `services/`, while stores expose only state transformations and subscription APIs.
- Keep store-to-store dependencies uni-directional. When mutual access is unavoidable, introduce a façade or dedicated injection point to break cycles.

## Store Categories and Responsibilities

| Category                        | Responsibilities                                                          | Allowed Dependencies                |
| ------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| Domain Store                    | Cache domain data and expose derived values. No side effects.             | Domain utilities (`utils`, `types`) |
| UI Store                        | Manage view-specific state (selection, filters, dialogs, etc.).           | Domain Stores (one-way)             |
| Infrastructure Store (optional) | Hold environment details (backend kind, connectivity). No business logic. | May be read by other layers         |

## Initialization Rules

1. Provide an `initStores()` (or equivalent bootstrap function) that creates all stores and prepares their initial state.
2. Perform dependency injection for services at the same time (e.g., `configureMutations`).
3. Call `initStores()` once from the application entry point (e.g., `src/hooks.client.ts` or the top-level layout in SvelteKit).
4. For testing, supply utilities such as `initStoresForTest()` / `resetStores()` so that individual stores can be created or reset as needed.

## Dependency Injection Guidelines

- Prohibit direct `import` from stores to services. Services receive the required store instances through constructors or factory parameters.
- Inject store instances into services inside the bootstrap function to avoid runtime circular references.
- When a store needs another store, pass the dependency through the constructor and provide defaults during initialization.

## Component Consumption Pattern

- Root (or high-level) components obtain store instances and pass them down via props or context.
- Child components subscribe to the received stores directly using `$derived`, `$state`, etc.
- Limit global imports of store singletons to bootstrap code; at runtime, always use the injected instance.

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';

  // initStores() has already created the instance; pass it to children.
</script>

<Child {taskStore} />
```

```svelte
<!-- Child.svelte -->
<script lang="ts">
  import type { TaskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    taskStore: TaskStore;
  }

  const { taskStore }: Props = $props();

  const selectedTask = $derived(taskStore.selectedTask);
</script>
```

## Testing Guidelines

- Implement `reset()` (or similar) on each store to prevent state leakage between tests.
- Align tests with the injection pattern: provide mock or lightweight store instances via props/context.
- In store unit tests, mock external services so that only pure state transformations and derived logic are verified.

## Naming and Placement

- `stores/<domain>/<domain>-store.svelte.ts` … Domain Store
- `stores/ui/<feature>-store.svelte.ts` … UI Store
- `services/ui/` … UI-specific side effects that depend on stores
- `services/domain/` … Persistence and domain logic
- `init/` or `services/bootstrap/` … Store/service bootstrap logic

## Error and Event Handling

- Avoid registering global events directly inside stores. Let services listen to events and update stores.
- Propagate errors through shared handlers (e.g., `errorStore`) instead of throwing within stores.
