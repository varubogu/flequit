# Partial Update System Implementation Detailed Design Document

## Overview

This design document details the implementation of a **field-level partial update system** in the Tauri task management application. It achieves efficient partial updates using the `partially` crate, optimizing data transfer while maintaining type safety.

## 1. Background and Issues

### 1.1 Current Problems

- **Data Transfer Efficiency**: Full row data transfer occurs even for column changes
- **Performance**: Unnecessary data transfer and database updates
- **Maintainability**: Creating individual column commands would result in massive code volume

### 1.2 Requirements

- Read: Full data, table-level, row-level, column-level
- Write: Full data (initial only), row-level (new additions), column-level (real-time updates)
- Multiple Repository implementations (SQLite, AutoMerge, future cloud/web)

## 2. Design Policy

1. **Patch/Delta Update Pattern** adoption
2. **`partially` crate** for automatic generation
3. **Coexistence with existing systems** for gradual introduction
4. **Maximum utilization of type safety**

## 3. Technology Selection

### 3.1 Partial Update Library Comparison

| Approach                     | Data Transfer | Implementation Cost | Maintainability | Type Safety | AutoMerge Compatibility |
| ---------------------------- | ------------- | ------------------- | --------------- | ----------- | ----------------------- |
| **Patch Update (partially)** | ⭐⭐⭐        | ⭐⭐⭐⭐            | ⭐⭐⭐⭐        | ⭐⭐⭐      | ⭐⭐⭐                  |
| Field Specific Commands      | ⭐⭐⭐        | ⭐                  | ⭐              | ⭐⭐⭐      | ⭐⭐                    |
| Generic Field Update         | ⭐⭐⭐        | ⭐⭐⭐              | ⭐⭐            | ⭐          | ⭐⭐                    |
| Current State                | ⭐            | ⭐⭐⭐              | ⭐⭐⭐          | ⭐⭐⭐      | ⭐⭐⭐                  |

### 3.2 Adopted Library

**`partially` crate** is adopted

**Adoption Reasons**:

- ✅ Mature API design and rich documentation
- ✅ `apply_some()` for partial application and change detection
- ✅ Detailed field-level control (`#[partially(omit)]` etc.)
- ✅ Development efficiency improvement through automatic generation

## 4. Implementation Specification

### 4.1 Struct Definition

```rust
// models/task.rs
use partially::Partial;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Task {
    #[partially(omit)]  // ID is not update target
    pub id: TaskId,
    pub title: String,
    pub status: TaskStatus,
    pub description: String,
    pub priority: TaskPriority,
    pub assigned_user_id: Option<UserId>,
    pub due_date: Option<DateTime<Utc>>,
    pub tags: Vec<TagId>,
}

// Auto-generated TaskPartial
// pub struct TaskPartial {
//     pub title: Option<String>,
//     pub status: Option<TaskStatus>,
//     pub description: Option<String>,
//     pub priority: Option<TaskPriority>,
//     pub assigned_user_id: Option<Option<UserId>>,
//     pub due_date: Option<Option<DateTime<Utc>>>,
//     pub tags: Option<Vec<TagId>>,
// }
```

### 4.2 Command Layer Implementation

```rust
// commands/task_commands.rs

// Generic patch update command
#[tauri::command]
pub async fn update_task_patch(
    id: String,
    patch: TaskPartial
) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    task_facades::update_task_patch(&task_id, &patch).await
}

// Convenient dedicated commands (using Patch internally)
#[tauri::command]
pub async fn update_task_title(id: String, title: String) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    let patch = TaskPartial {
        title: Some(title),
        ..Default::default()
    };
    task_facades::update_task_patch(&task_id, &patch).await
}

#[tauri::command]
pub async fn update_task_status(id: String, status: TaskStatus) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    let patch = TaskPartial {
        status: Some(status),
        ..Default::default()
    };
    task_facades::update_task_patch(&task_id, &patch).await
}
```

### 4.3 Facade Layer Implementation

```rust
// facades/task_facades.rs

pub async fn update_task_patch(
    task_id: &TaskId,
    patch: &TaskPartial
) -> Result<bool, String> {
    match task_service::update_task_patch(task_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}
```

### 4.4 Service Layer Implementation

```rust
// services/task_service.rs

pub async fn update_task_patch(
    task_id: &TaskId,
    patch: &TaskPartial
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    if let Some(mut task) = repository.tasks.find_by_id(task_id).await? {
        let changed = task.apply_some(patch.clone());
        if changed {
            repository.tasks.save(&task).await?;
        }
        Ok(changed)
    } else {
        Err(ServiceError::NotFound("Task not found".to_string()))
    }
}
```

### 4.5 Frontend Implementation

```typescript
// lib/services/task-service.ts
import { invoke } from '@tauri-apps/api/tauri';

export interface TaskPatch {
  title?: string;
  status?: TaskStatus;
  description?: string;
  priority?: TaskPriority;
  assigned_user_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

// Generic patch update
export async function updateTaskPatch(id: string, patch: TaskPatch): Promise<boolean> {
  return await invoke<boolean>('update_task_patch', { id, patch });
}

// Convenient dedicated functions
export async function updateTaskTitle(id: string, title: string): Promise<boolean> {
  return await invoke<boolean>('update_task_title', { id, title });
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  return await invoke<boolean>('update_task_status', { id, status });
}
```

```typescript
// lib/utils/task-patch.ts
// Change detection based on Svelte 5 runes
export function createTaskPatch(original: Task, current: Task): TaskPatch {
  const patch: TaskPatch = {};

  if (original.title !== current.title) patch.title = current.title;
  if (original.status !== current.status) patch.status = current.status;
  if (original.description !== current.description) patch.description = current.description;
  if (original.priority !== current.priority) patch.priority = current.priority;
  if (original.assigned_user_id !== current.assigned_user_id) {
    patch.assigned_user_id = current.assigned_user_id;
  }
  if (original.due_date !== current.due_date) patch.due_date = current.due_date;
  if (JSON.stringify(original.tags) !== JSON.stringify(current.tags)) {
    patch.tags = current.tags;
  }

  return patch;
}
```

## 5. Implementation Issues and Countermeasures

### 5.1 Validation Strategy

**Issue**: Consistency checking during partial updates
**Countermeasures**:

- Field-level validation
- Combination validation with existing data
- Business rule application in Service layer

### 5.2 Performance Optimization

**Issue**: Performance impact from frequent partial updates
**Countermeasures**:

- Debounce implementation in frontend
- Consider batch updates
- SQL optimization in Repository layer

### 5.3 AutoMerge Integration Considerations

**Issue**: Consistency between AutoMerge and SQLite two-layer structure
**Countermeasures**:

- Partial updates executed efficiently on SQLite side
- AutoMerge side uses traditional save() for full storage
- Automatic consistency during synchronization

## 6. Gradual Introduction Plan

### Phase 1: Foundation Implementation

- Add `partially` crate dependency
- Add `Partial` derive to `Task` struct
- Implement basic patch update commands

### Phase 2: Feature Extension

- Add dedicated commands for frequently used fields
- Implement change detection system in frontend
- Strengthen error handling and validation

### Phase 3: Optimization

- Performance measurement and adjustment
- SQL optimization in Repository layer
- AutoMerge synchronization efficiency

### Phase 4: Other Entity Expansion

- Apply to Project, Subtask, Tag, etc.
- Establish unified patch update patterns

## 7. Testing Strategy

### 7.1 Unit Tests

- Test patch application logic
- Test change detection functionality
- Test validation rules

### 7.2 Integration Tests

- Integration tests from Command layer to Repository layer
- AutoMerge and SQLite consistency tests

### 7.3 E2E Tests

- Complete flow from frontend to backend
- Real-time update behavior confirmation

## 8. Performance Considerations

### 8.1 Frontend Optimization

- **Debounce Implementation**: Batch processing of frequent field changes
- **Change Detection Optimization**: Efficient diff detection with Svelte 5 runes
- **Cache Strategy**: Local state management before patch application

### 8.2 Backend Optimization

- **SQL Optimization**: Efficient UPDATE statements for partial updates
- **Memory Management**: Minimize temporary objects during partial updates
- **Sync Processing**: Efficient consistency management between AutoMerge and SQLite

## 9. Implementation Checklist

### Phase 1 Implementation Checkpoints

- [ ] Add `partially` crate to Cargo.toml
- [ ] Add `#[derive(Partial)]` to Task struct
- [ ] Implement `update_task_patch` command
- [ ] Facade layer patch processing logic
- [ ] Service layer `apply_some()` integration
- [ ] Frontend TaskPatch type definition

### Phase 2 Feature Extension Checkpoints

- [ ] Add dedicated commands for frequent fields
- [ ] Frontend change detection utility
- [ ] Strengthen validation rules
- [ ] Improve error handling

## 10. Summary

This implementation detailed design document achieves the following:

1. **Efficient Data Updates**: Network load reduction by transferring only changed fields
2. **Type Safety**: Safe partial updates through `partially` crate and Rust type system
3. **Maintainability**: Code duplication reduction and maintainability improvement through macro automatic generation
4. **Implementation Specificity**: Ready-to-use code examples and gradual introduction plan

This design enables building an efficient and maintainable field-level partial update system.
