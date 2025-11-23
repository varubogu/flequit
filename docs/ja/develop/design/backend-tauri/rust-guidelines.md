# Rust設計ガイドライン

## 概要

FlequitプロジェクトのTauri（Rust）部分における設計ガイドラインを定めます。クリーンアーキテクチャの採用、適切なエラーハンドリング、パフォーマンスの最適化を重視した実装指針を示します。

## アーキテクチャ構成

### クリーンアーキテクチャ採用（クレート分割版）

```
メインクレート（flequit）
├── アプリケーション層（commands, controllers, events）
    ↓
flequit-core クレート
├── ドメイン層（facadeが呼び出され、複数のserviceを呼び出し）
    ↓
flequit-storage クレート  
├── データアクセス層（repository, SQLite/Automergeなどの実体）
```

### クレート間アクセス制御ルール

- **メインクレート（flequit）**: flequit-coreのみ参照可能
- **flequit-core**: flequit-storageのみ参照可能
- **flequit-storage**: 外部クレート参照なし（完全独立）

### 各クレート内部のアクセス制御ルール

#### メインクレート（flequit）
- **commands**: flequit-core::facadeはOK、直接service/repositoryはNG

#### flequit-core クレート
- **facade**: serviceはOK、facade/commandsはNG
- **service**: serviceとflequit-storage::repositoryはOK、facadeはNG

#### flequit-storage クレート  
- **repository**: repository内のみOK、外部参照はNG
- **models**: 型定義のみ、ビジネスロジックはNG

## Option値の処理規約

### 基本的なOption処理パターン

#### 単一Option値の処理

```rust
// 1つだけならif let Someを使用
pub async fn get_user_display_name(user_id: &UserId) -> Result<String, ServiceError> {
    if let Some(user) = user_repository.find_by_id(user_id).await? {
        return Ok(user.display_name);
    }
    
    Err(ServiceError::NotFound("User not found".to_string()))
}
```

#### 複数Option値の処理

```rust
// 複数ある場合はネストが深くならないように一時的に変数に格納
pub async fn create_task_assignment(
    user_id: &UserId,
    project_id: &ProjectId,
    task_id: &TaskId
) -> Result<TaskAssignment, ServiceError> {
    // 各リソースを並行して取得（Option値で受け取り）
    let user = user_repository.find_by_id(user_id).await?;
    let project = project_repository.find_by_id(project_id).await?;
    let task = task_repository.find_by_id(task_id).await?;
    
    // 一括でOption値を検証
    let (user, project, task) = match (user, project, task) {
        (Some(u), Some(p), Some(t)) => (u, p, t),
        (None, _, _) => return Err(ServiceError::NotFound("User not found".to_string())),
        (_, None, _) => return Err(ServiceError::NotFound("Project not found".to_string())),
        (_, _, None) => return Err(ServiceError::NotFound("Task not found".to_string())),
    };
    
    // 実際のビジネスロジック処理
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

#### Option値のチェーンと変換

```rust
// 良い例 - Option値のチェーン処理
pub fn get_task_assignee_email(task: &Task) -> Option<String> {
    task.assignee_id
        .and_then(|id| user_cache.get(&id))
        .and_then(|user| user.email.clone())
        .filter(|email| !email.is_empty())
}

// 複雑な変換の場合は段階的に処理
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

## エラーハンドリングパターン

### 階層化されたエラー型

```rust
// Domain層エラー
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

// Repository層エラー
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

// Command層エラー（Tauriレスポンス用）
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

### コンテキスト付きエラー処理

```rust
use anyhow::{Context, Result};

pub async fn sync_project_data(project_id: &ProjectId) -> Result<SyncResult> {
    // ローカルデータの取得
    let local_data = local_repository
        .get_project_data(project_id)
        .await
        .with_context(|| format!("Failed to get local project data: {}", project_id))?;
    
    // リモートデータとの同期
    let remote_changes = remote_sync_service
        .fetch_changes(project_id, local_data.last_sync_timestamp)
        .await
        .context("Failed to fetch remote changes")?;
    
    // 競合解決
    let resolved_data = conflict_resolver
        .resolve_conflicts(&local_data, &remote_changes)
        .context("Failed to resolve data conflicts")?;
    
    // ローカルに保存
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

## モジュール設計パターン

### Repository パターン

```rust
// トレイト定義
#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn find_by_id(&self, id: &TaskId) -> Result<Option<Task>, RepositoryError>;
    async fn find_by_project(&self, project_id: &ProjectId) -> Result<Vec<Task>, RepositoryError>;
    async fn save(&self, task: &Task) -> Result<(), RepositoryError>;
    async fn delete(&self, id: &TaskId) -> Result<(), RepositoryError>;
    
    // 複雑なクエリ
    async fn find_by_assignee_and_status(
        &self, 
        assignee_id: &UserId, 
        status: TaskStatus
    ) -> Result<Vec<Task>, RepositoryError>;
}

// SQLite実装
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

// Automerge実装
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

### Service層の実装

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
        // 1. リソースの存在確認
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
        
        // 2. ビジネスルール検証
        self.validate_assignment_permission(&task, &assigner)?;
        self.validate_assignee_capability(&task, &assignee)?;
        
        // 3. タスク更新
        let mut updated_task = task;
        updated_task.assignee_id = Some(*assignee_id);
        updated_task.updated_at = Utc::now();
        
        // 4. 永続化
        self.task_repository.save(&updated_task).await?;
        
        // 5. 副作用（通知等）
        self.notification_service
            .notify_task_assigned(&updated_task, &assignee, &assigner)
            .await
            .unwrap_or_else(|e| {
                // 通知失敗はログ出力のみ、メイン処理は継続
                log::warn!("Failed to send assignment notification: {}", e);
            });
        
        Ok(updated_task)
    }
    
    fn validate_assignment_permission(
        &self, 
        task: &Task, 
        assigner: &User
    ) -> Result<(), ServiceError> {
        // プロジェクトメンバーのみアサイン可能
        if !assigner.can_assign_tasks_in_project(&task.project_id) {
            return Err(ServiceError::BusinessRule(
                "Insufficient permission to assign tasks".to_string()
            ));
        }
        
        // 完了済みタスクはアサイン不可
        if task.status == TaskStatus::Completed {
            return Err(ServiceError::BusinessRule(
                "Cannot assign completed task".to_string()
            ));
        }
        
        Ok(())
    }
}
```

## パフォーマンス最適化

### データベースアクセスの最適化

```rust
// 良い例 - バッチ処理でN+1問題を回避
impl TaskService {
    pub async fn get_project_tasks_with_assignees(
        &self,
        project_id: &ProjectId
    ) -> Result<Vec<TaskWithAssignee>, ServiceError> {
        // JOINを使用して1回のクエリで取得
        let tasks_with_assignees = self.task_repository
            .find_with_assignees_by_project(project_id)
            .await?;
            
        Ok(tasks_with_assignees)
    }
}

// Repository実装
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
                    // ... 他のフィールド
                },
                assignee: row.assignee_id.map(|id| User {
                    id: UserId::parse(&id).unwrap(),
                    display_name: row.assignee_name.unwrap_or_default(),
                    avatar_url: row.assignee_avatar,
                    // ... 他のフィールド
                })
            })
            .collect();
            
        Ok(tasks_with_assignees)
    }
}
```

### トランザクション管理

データベーストランザクション管理については、専用の[トランザクション管理設計書](transaction-management.md)を参照してください。

**重要な原則:**

1. **Facade層でのみトランザクション制御**
   - Facade層がトランザクションの開始、コミット、ロールバックを行う
   - Repository層は`_with_txn`メソッドでトランザクションオブジェクトを受け取る
   - ネストしたトランザクションを開始しない

2. **Repository層のパターン**
   ```rust
   // Facade層からトランザクションを受け取る
   pub async fn delete_with_txn(
       &self,
       txn: &sea_orm::DatabaseTransaction,
       project_id: &ProjectId,
       id: &EntityId,
   ) -> Result<(), RepositoryError> {
       Entity::delete_by_id((...))
           .exec(txn)  // 提供されたトランザクションを使用
           .await?;
       Ok(())
   }
   ```

3. **Facade層のパターン**
   ```rust
   pub async fn delete_entity<R>(
       repositories: &R,
       project_id: &ProjectId,
       id: &EntityId,
   ) -> Result<bool, String>
   where
       R: InfrastructureRepositoriesTrait + TransactionManager<Transaction = DatabaseTransaction>,
   {
       // 1. トランザクション開始
       let txn = repositories.begin().await?;
       
       let sqlite_repos_guard = repositories.sqlite_repositories()?.read().await;
       
       // 2. トランザクション内で操作を実行
       sqlite_repos_guard.related_entity
           .delete_related_with_txn(&txn, project_id, id).await?;
       sqlite_repos_guard.entity
           .delete_with_txn(&txn, project_id, id).await?;
       
       drop(sqlite_repos_guard);
       
       // 3. トランザクションをコミット
       repositories.commit(txn).await?;
       
       // 4. Automerge操作（トランザクション外）
       repositories.entity().delete(project_id, id).await?;
       
       Ok(true)
   }
   ```

4. **ロールバックを伴うエラーハンドリング**
   ```rust
   // 操作が失敗した場合、ロールバックは自動（トランザクションがドロップされる）
   // 明示的なエラーハンドリングの場合:
   if let Err(e) = sqlite_repos_guard.entity.delete_with_txn(&txn, id).await {
       drop(sqlite_repos_guard);
       repositories.rollback(txn).await?;
       return Err(format!("削除に失敗: {:?}", e));
   }
   ```

5. **実装状況**
   - ✅ タグ削除 - 完全なトランザクション制御
   - ✅ タスク削除 - トランザクション付き完全カスケード削除
   - ✅ プロジェクト削除 - トランザクション付き完全カスケード削除
   - 詳細は[実装状況](transaction-management.md#11-実装状況)を参照

**トランザクションを使用すべき場合:**
- 複数の関連エンティティをアトミックに変更する必要がある
- 複数のテーブルにわたるカスケード削除
- 操作間でデータ整合性が必要

**トランザクションを使用すべきでない場合:**
- 関連のない単一エンティティ操作
- 読み取り専用クエリ
- Automerge操作（CRDTベース、トランザクション不要）

### メモリ効率の最適化

```rust
// 良い例 - ストリーミング処理で大量データを効率処理
pub async fn export_project_data(
    &self,
    project_id: &ProjectId,
    writer: impl AsyncWrite + Unpin
) -> Result<(), ServiceError> {
    let mut csv_writer = AsyncWriterBuilder::new().create_writer(writer);
    
    // ヘッダー書き込み
    csv_writer.write_record(&["id", "title", "status", "assignee", "created_at"])
        .await?;
    
    // データをストリームで処理（メモリ使用量を一定に保つ）
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

### 並行処理の活用

```rust
// 良い例 - 並行処理で応答性を向上
pub async fn sync_multiple_projects(
    &self,
    project_ids: &[ProjectId]
) -> Result<Vec<SyncResult>, ServiceError> {
    use futures::future::join_all;
    
    // 各プロジェクトの同期を並行実行
    let sync_futures = project_ids
        .iter()
        .map(|project_id| self.sync_project_data(project_id))
        .collect::<Vec<_>>();
    
    let results = join_all(sync_futures).await;
    
    // 結果をまとめて返す（部分的な失敗も許容）
    let (successes, failures): (Vec<_>, Vec<_>) = results
        .into_iter()
        .enumerate()
        .partition_map(|(i, result)| {
            match result {
                Ok(sync_result) => Either::Left(sync_result),
                Err(e) => Either::Right((project_ids[i], e)),
            }
        });
    
    // 失敗した同期をログ出力
    for (project_id, error) in failures {
        log::error!("Failed to sync project {}: {}", project_id, error);
    }
    
    Ok(successes)
}
```

## テストパターン

### Repository層のテスト

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
        
        // マイグレーション実行
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

### Service層のモックテスト

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
            // ... 他のフィールド
        };
        
        let assignee = User {
            id: assignee_id,
            display_name: "John Doe".to_string(),
            // ... 他のフィールド
        };
        
        let assigner = User {
            id: assigner_id,
            display_name: "Jane Smith".to_string(),
            can_assign_tasks: true,
            // ... 他のフィールド
        };
        
        // Mock設定
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

このガイドラインに従って実装することで、保守性が高く、パフォーマンスに優れた堅牢なRustアプリケーションを構築できます。