# Rust Design Guidelines

## Overview

This document defines design guidelines for the Tauri (Rust) portion of the Flequit project. It emphasizes clean architecture adoption, proper error handling, and performance optimization implementation guidelines.

## Architecture Structure

### Clean Architecture Adoption (Crate Separation Version)

```
Main Crate (flequit)
├── Application Layer (src-tauri/src/commands)
    ↓
flequit-infrastructure Crate
├── Infrastructure integration
    ↓
flequit-infrastructure-sqlite / flequit-infrastructure-automerge Crates
├── Persistence implementations
    ↓
flequit-core Crate
├── Domain logic (facades/services)
    ↓
flequit-repository -> flequit-model -> flequit-types
```

### Inter-Crate Access Control Rules

- **Main Crate (flequit)**: References `flequit-infrastructure` (and settings/types as needed)
- **Infrastructure crates**: Can depend on `flequit-core`, `flequit-repository`, `flequit-model`, `flequit-types`
- **flequit-core**: Depends on `flequit-repository`, `flequit-model`, `flequit-types`
- **flequit-repository**: Depends on `flequit-model`, `flequit-types`
- **flequit-model**: Depends on `flequit-types`

### Intra-Crate Access Control Rules

#### Main Crate (flequit)

- **commands**: OK to use infrastructure facade/services, NG to bypass infrastructure and call DB adapters directly

#### flequit-core Crate

- **facade**: OK to reference service, NG to reference facade/commands
- **service**: OK to reference repository traits/contracts, NG to reference commands/infrastructure concrete implementations

#### Infrastructure Crates

- **sqlite/automerge adapters**: Own persistence details only, NG to include domain rules
- **integration facade**: Compose infra implementations, NG to include UI/command concerns

## Option Value Processing Conventions

### Basic Option Processing Patterns

#### Single Option Value Processing

```rust
// Use if let Some for single values
pub async fn get_user_display_name(user_id: &UserId) -> Result<String, ServiceError> {
    if let Some(user) = user_repository.find_by_id(user_id).await? {
        return Ok(user.display_name);
    }

    Err(ServiceError::NotFound("User not found".to_string()))
}
```

#### Multiple Option Value Processing

```rust
// For multiple values, store in temporary variables to avoid deep nesting
pub async fn create_task_assignment(
    user_id: &UserId,
    project_id: &ProjectId,
    task_id: &TaskId
) -> Result<TaskAssignment, ServiceError> {
    // Fetch each resource in parallel (receive as Option values)
    let user = user_repository.find_by_id(user_id).await?;
    let project = project_repository.find_by_id(project_id).await?;
    let task = task_repository.find_by_id(task_id).await?;

    // Validate all Option values at once
    let (user, project, task) = match (user, project, task) {
        (Some(u), Some(p), Some(t)) => (u, p, t),
        (None, _, _) => return Err(ServiceError::NotFound("User not found".to_string())),
        (_, None, _) => return Err(ServiceError::NotFound("Project not found".to_string())),
        (_, _, None) => return Err(ServiceError::NotFound("Task not found".to_string())),
    };

    // Actual business logic processing
    validate_assignment_rules(&user, &project, &task)?;

    let assignment = TaskAssignment {
        user_id: user.id,
        project_id: project.id,
        task_id: task.id,
        assigned_at: Utc::now(),
    };

    assignment_repository.create(&assignment).await?;
    Ok(assignment)
}
```

#### Option Value Chaining and Transformation

```rust
// Good example - Option value chaining
pub fn get_task_assignee_email(task: &Task) -> Option<String> {
    task.assignee_id
        .and_then(|id| user_cache.get(&id))
        .and_then(|user| user.email.clone())
        .filter(|email| !email.is_empty())
}

// For complex transformations, process step by step
pub async fn get_task_with_assignee_info(
    task_id: &TaskId
) -> Result<TaskWithAssigneeInfo, ServiceError> {
    let task = task_repository.find_by_id(task_id).await?
        .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;

    let assignee_info = if let Some(assignee_id) = &task.assignee_id {
        let assignee = user_repository.find_by_id(assignee_id).await?;
        assignee.map(|user| AssigneeInfo {
            id: user.id,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
        })
    } else {
        None
    };

    Ok(TaskWithAssigneeInfo {
        task,
        assignee: assignee_info,
    })
}
```

## Error Handling Patterns

### Hierarchical Error Types

```rust
// Domain layer errors
#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Validation failed: {0}")]
    Validation(String),

    #[error("Business rule violation: {0}")]
    BusinessRule(String),

    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),

    #[error("External service error: {0}")]
    ExternalService(String),
}

// Repository layer errors
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Automerge error: {0}")]
    Automerge(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

// Command layer errors (for Tauri responses)
#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Service error: {0}")]
    Service(#[from] ServiceError),

    #[error("Serialization error: {0}")]
    Serialization(String),
}
```

### Contextual Error Handling

```rust
use anyhow::{Context, Result};

pub async fn sync_project_data(project_id: &ProjectId) -> Result<SyncResult> {
    // Get local data
    let local_data = local_repository
        .get_project_data(project_id)
        .await
        .with_context(|| format!("Failed to get local project data: {}", project_id))?;

    // Sync with remote data
    let remote_changes = remote_sync_service
        .fetch_changes(project_id, local_data.last_sync_timestamp)
        .await
        .context("Failed to fetch remote changes")?;

    // Conflict resolution
    let resolved_data = conflict_resolver
        .resolve_conflicts(&local_data, &remote_changes)
        .context("Failed to resolve data conflicts")?;

    // Save locally
    local_repository
        .save_project_data(project_id, &resolved_data)
        .await
        .with_context(|| format!("Failed to save resolved data for project: {}", project_id))?;

    Ok(SyncResult {
        conflicts_resolved: resolved_data.conflicts.len(),
        changes_applied: remote_changes.len(),
    })
}
```

## Module Design Patterns

### Repository Pattern

```rust
// Trait definition
#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError>;
    async fn find_by_project(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError>;
    async fn save(&self, task: &Task) -> Result<(), RepositoryError>;
    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError>;

    // Complex queries
    async fn find_by_assignee_and_status(
        &self,
        assignee_id: &UserId,
        status: TaskStatus
    ) -> Result<Vec<Task>, RepositoryError>;
}

// SQLite implementation
pub struct SqliteTaskRepository {
    pool: SqlitePool,
}

#[async_trait]
impl TaskRepository for SqliteTaskRepository {
    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        let row = sqlx::query_as::<_, Task>(
            "SELECT * FROM tasks WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await?;

        Ok(row)
    }

    async fn find_by_assignee_and_status(
        &self,
        assignee_id: &UserId,
        status: TaskStatus
    ) -> Result<Vec<Task>, RepositoryError> {
        let tasks = sqlx::query_as::<_, Task>(
            r#"
            SELECT * FROM tasks
            WHERE assignee_id = ? AND status = ?
            ORDER BY created_at DESC
            "#
        )
        .bind(assignee_id.to_string())
        .bind(status.to_string())
        .fetch_all(&self.pool)
        .await?;

        Ok(tasks)
    }
}

// Automerge implementation
pub struct AutomergeTaskRepository {
    document_manager: Arc<DocumentManager>,
}

#[async_trait]
impl TaskRepository for AutomergeTaskRepository {
    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError> {
        let doc = self.document_manager
            .get_project_document(&id.project_id)
            .await?;

        let tasks: Vec<Task> = doc.get("tasks")
            .map_err(|e| RepositoryError::Automerge(e.to_string()))?;

        Ok(tasks.into_iter().find(|task| &task.id == id))
    }
}
```

### Service Layer Implementation

```rust
pub struct TaskService {
    task_repository: Arc<dyn TaskRepository>,
    user_repository: Arc<dyn UserRepository>,
    project_repository: Arc<dyn ProjectRepository>,
    notification_service: Arc<NotificationService>,
}

impl TaskService {
    pub async fn assign_task(
        &self,
        task_id: &TaskId,
        assignee_id: &UserId,
        assigner_id: &UserId
    ) -> Result<Task, ServiceError> {
        // 1. Verify resource existence
        let task = self.task_repository
            .find_by_id(task_id)
            .await?
            .ok_or_else(|| ServiceError::NotFound("Task not found".to_string()))?;

        let assignee = self.user_repository
            .find_by_id(assignee_id)
            .await?
            .ok_or_else(|| ServiceError::NotFound("Assignee not found".to_string()))?;

        let assigner = self.user_repository
            .find_by_id(assigner_id)
            .await?
            .ok_or_else(|| ServiceError::NotFound("Assigner not found".to_string()))?;

        // 2. Business rule validation
        self.validate_assignment_permission(&task, &assigner)?;
        self.validate_assignee_capability(&task, &assignee)?;

        // 3. Update task
        let mut updated_task = task;
        updated_task.assignee_id = Some(*assignee_id);
        updated_task.updated_at = Utc::now();

        // 4. Persist
        self.task_repository.save(&updated_task).await?;

        // 5. Side effects (notifications, etc.)
        self.notification_service
            .notify_task_assigned(&updated_task, &assignee, &assigner)
            .await
            .unwrap_or_else(|e| {
                // Log notification failure only, continue main processing
                log::warn!("Failed to send assignment notification: {}", e);
            });

        Ok(updated_task)
    }

    fn validate_assignment_permission(
        &self,
        task: &Task,
        assigner: &User
    ) -> Result<(), ServiceError> {
        // Only project members can assign tasks
        if !assigner.can_assign_tasks_in_project(&task.project_id) {
            return Err(ServiceError::BusinessRule(
                "Insufficient permission to assign tasks".to_string()
            ));
        }

        // Cannot assign completed tasks
        if task.status == TaskStatus::Completed {
            return Err(ServiceError::BusinessRule(
                "Cannot assign completed task".to_string()
            ));
        }

        Ok(())
    }
}
```

## Performance Optimization

### Database Access Optimization

```rust
// Good example - Batch processing to avoid N+1 problem
impl TaskService {
    pub async fn get_project_tasks_with_assignees(
        &self,
        project_id: &ProjectId
    ) -> Result<Vec<TaskWithAssignee>, ServiceError> {
        // Use JOIN to fetch in single query
        let tasks_with_assignees = self.task_repository
            .find_with_assignees_by_project(project_id)
            .await?;

        Ok(tasks_with_assignees)
    }
}

// Repository implementation
impl SqliteTaskRepository {
    async fn find_with_assignees_by_project(
        &self,
        project_id: &ProjectId
    ) -> Result<Vec<TaskWithAssignee>, RepositoryError> {
        let rows = sqlx::query!(
            r#"
            SELECT
                t.*,
                u.id as assignee_id,
                u.display_name as assignee_name,
                u.avatar_url as assignee_avatar
            FROM tasks t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.project_id = ?
            ORDER BY t.created_at DESC
            "#,
            project_id.to_string()
        )
        .fetch_all(&self.pool)
        .await?;

        let tasks_with_assignees = rows
            .into_iter()
            .map(|row| TaskWithAssignee {
                task: Task {
                    id: TaskId::parse(&row.id).unwrap(),
                    title: row.title,
                    status: TaskStatus::from_str(&row.status).unwrap(),
                    // ... other fields
                },
                assignee: row.assignee_id.map(|id| User {
                    id: UserId::parse(&id).unwrap(),
                    display_name: row.assignee_name.unwrap_or_default(),
                    avatar_url: row.assignee_avatar,
                    // ... other fields
                })
            })
            .collect();

        Ok(tasks_with_assignees)
    }
}
```

### Transaction Management

For database transaction management, see the dedicated [Transaction Management Design Document](transaction-management.md).

**Key Principles:**

1. **Transaction Control at Facade Layer Only**
   - Facade layer starts, commits, and rolls back transactions
   - Repository layer accepts transaction objects via `_with_txn` methods
   - Never start nested transactions

2. **Repository Layer Pattern**

   ```rust
   // Accept transaction from Facade layer
   pub async fn delete_with_txn(
       &self,
       txn: &sea_orm::DatabaseTransaction,
       project_id: &ProjectId,
       id: &EntityId,
   ) -> Result<(), RepositoryError> {
       Entity::delete_by_id((...))
           .exec(txn)  // Use provided transaction
           .await?;
       Ok(())
   }
   ```

3. **Facade Layer Pattern**

   ```rust
   pub async fn delete_entity<R>(
       repositories: &R,
       project_id: &ProjectId,
       id: &EntityId,
   ) -> Result<bool, String>
   where
       R: InfrastructureRepositoriesTrait + TransactionManager<Transaction = DatabaseTransaction>,
   {
       // 1. Begin transaction
       let txn = repositories.begin().await?;

       let sqlite_repos_guard = repositories.sqlite_repositories()?.read().await;

       // 2. Execute operations within transaction
       sqlite_repos_guard.related_entity
           .delete_related_with_txn(&txn, project_id, id).await?;
       sqlite_repos_guard.entity
           .delete_with_txn(&txn, project_id, id).await?;

       drop(sqlite_repos_guard);

       // 3. Commit transaction
       repositories.commit(txn).await?;

       // 4. Automerge operations (outside transaction)
       repositories.entity().delete(project_id, id).await?;

       Ok(true)
   }
   ```

4. **Error Handling with Rollback**

   ```rust
   // If operation fails, rollback is automatic (transaction dropped)
   // For explicit error handling:
   if let Err(e) = sqlite_repos_guard.entity.delete_with_txn(&txn, id).await {
       drop(sqlite_repos_guard);
       repositories.rollback(txn).await?;
       return Err(format!("Failed to delete: {:?}", e));
   }
   ```

5. **Implementation Status**
   - ✅ Tag deletion - Complete transaction control
   - ✅ Task deletion - Complete cascade deletion with transaction
   - ✅ Project deletion - Complete cascade deletion with transaction
   - See [Implementation Status](transaction-management.md#11-implementation-status) for details

**When to Use Transactions:**

- Multiple related entities must be modified atomically
- Cascade deletion across multiple tables
- Data consistency requirements across operations

**When NOT to Use Transactions:**

- Single entity operations without relationships
- Read-only queries
- Automerge operations (CRDT-based, no transactions needed)

### Memory Efficiency Optimization

```rust
// Good example - Streaming processing for efficient large data handling
pub async fn export_project_data(
    &self,
    project_id: &ProjectId,
    writer: impl AsyncWrite + Unpin
) -> Result<(), ServiceError> {
    let mut csv_writer = AsyncWriterBuilder::new().create_writer(writer);

    // Write header
    csv_writer.write_record(&["id", "title", "status", "assignee", "created_at"])
        .await?;

    // Process data in stream (maintain constant memory usage)
    let mut task_stream = self.task_repository
        .find_by_project_stream(project_id)
        .await?;

    while let Some(task) = task_stream.next().await {
        let task = task?;
        let assignee_name = if let Some(assignee_id) = &task.assignee_id {
            self.get_user_display_name(assignee_id)
                .await
                .unwrap_or_else(|_| "Unknown".to_string())
        } else {
            "Unassigned".to_string()
        };

        csv_writer.write_record(&[
            task.id.to_string(),
            task.title,
            task.status.to_string(),
            assignee_name,
            task.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
        ]).await?;
    }

    csv_writer.flush().await?;
    Ok(())
}
```

### Concurrent Processing Utilization

```rust
// Good example - Concurrent processing for improved responsiveness
pub async fn sync_multiple_projects(
    &self,
    project_ids: &[ProjectId]
) -> Result<Vec<SyncResult>, ServiceError> {
    use futures::future::join_all;

    // Execute project synchronization concurrently
    let sync_futures = project_ids
        .iter()
        .map(|project_id| self.sync_project_data(project_id))
        .collect::<Vec<_>>();

    let results = join_all(sync_futures).await;

    // Collect results (allow partial failures)
    let (successes, failures): (Vec<_>, Vec<_>) = results
        .into_iter()
        .enumerate()
        .partition_map(|(i, result)| {
            match result {
                Ok(sync_result) => Either::Left(sync_result),
                Err(e) => Either::Right((project_ids[i], e)),
            }
        });

    // Log failed synchronizations
    for (project_id, error) in failures {
        log::error!("Failed to sync project {}: {}", project_id, error);
    }

    Ok(successes)
}
```

## Testing Patterns

### Repository Layer Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;
    use tempfile::NamedTempFile;

    async fn setup_test_db() -> SqlitePool {
        let temp_file = NamedTempFile::new().unwrap();
        let database_url = format!("sqlite:{}", temp_file.path().display());

        let pool = SqlitePool::connect(&database_url).await.unwrap();

        // Run migrations
        sqlx::migrate!("../migrations")
            .run(&pool)
            .await
            .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_find_by_id_existing_task() {
        // Arrange
        let pool = setup_test_db().await;
        let repository = SqliteTaskRepository { pool: pool.clone() };

        let task = Task {
            id: TaskId::new(),
            title: "Test Task".to_string(),
            status: TaskStatus::Todo,
            project_id: ProjectId::new(),
            assignee_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        repository.save(&task).await.unwrap();

        // Act
        let found_task = repository.find_by_id(&task.id).await.unwrap();

        // Assert
        assert!(found_task.is_some());
        assert_eq!(found_task.unwrap().title, "Test Task");
    }

    #[tokio::test]
    async fn test_find_by_id_nonexistent_task() {
        // Arrange
        let pool = setup_test_db().await;
        let repository = SqliteTaskRepository { pool };
        let nonexistent_id = TaskId::new();

        // Act
        let result = repository.find_by_id(&nonexistent_id).await.unwrap();

        // Assert
        assert!(result.is_none());
    }
}
```

### Service Layer Mock Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    use mockall::mock;

    mock! {
        TaskRepo {}

        #[async_trait]
        impl TaskRepository for TaskRepo {
            async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError>;
            async fn save(&self, task: &Task) -> Result<(), RepositoryError>;
        }
    }

    #[tokio::test]
    async fn test_assign_task_success() {
        // Arrange
        let mut mock_task_repo = MockTaskRepo::new();
        let mut mock_user_repo = MockUserRepo::new();

        let task_id = TaskId::new();
        let assignee_id = UserId::new();
        let assigner_id = UserId::new();

        let task = Task {
            id: task_id,
            title: "Test Task".to_string(),
            status: TaskStatus::Todo,
            assignee_id: None,
            // ... other fields
        };

        let assignee = User {
            id: assignee_id,
            display_name: "John Doe".to_string(),
            // ... other fields
        };

        let assigner = User {
            id: assigner_id,
            display_name: "Jane Smith".to_string(),
            can_assign_tasks: true,
            // ... other fields
        };

        // Mock setup
        mock_task_repo
            .expect_find_by_id()
            .with(eq(task_id))
            .times(1)
            .returning(move |_| Ok(Some(task.clone())));

        mock_user_repo
            .expect_find_by_id()
            .with(eq(assignee_id))
            .times(1)
            .returning(move |_| Ok(Some(assignee.clone())));

        mock_task_repo
            .expect_save()
            .times(1)
            .returning(|_| Ok(()));

        let service = TaskService::new(
            Arc::new(mock_task_repo),
            Arc::new(mock_user_repo),
            // ...
        );

        // Act
        let result = service
            .assign_task(&task_id, &assignee_id, &assigner_id)
            .await;

        // Assert
        assert!(result.is_ok());
        let assigned_task = result.unwrap();
        assert_eq!(assigned_task.assignee_id, Some(assignee_id));
    }
}
```

By following these guidelines, you can build a maintainable, high-performance, and robust Rust application.
