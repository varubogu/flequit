use crate::errors::service_error::ServiceError;
use flequit_model::models::task::TaskTree;
use flequit_model::models::task_list::{PartialTaskList, TaskList, TaskListTree};
use crate::repositories::base_repository_trait::{Patchable, Repository};
use crate::repositories::Repositories;
use flequit_model::types::id_types::{ProjectId, TaskListId};

pub async fn create_task_list(task_list: &TaskList) -> Result<(), ServiceError> {
    let repository = Repositories::instance().await;
    repository.task_lists.save(task_list).await?;
    Ok(())
}

pub async fn get_task_list(list_id: &TaskListId) -> Result<Option<TaskList>, ServiceError> {
    let repository = Repositories::instance().await;
    Ok(repository.task_lists.find_by_id(list_id).await?)
}

pub async fn update_task_list(
    task_list_id: &TaskListId,
    patch: &PartialTaskList,
) -> Result<bool, ServiceError> {
    let repository = Repositories::instance().await;

    // updated_atフィールドを自動設定したパッチを作成
    let mut updated_patch = patch.clone();
    updated_patch.updated_at = Some(chrono::Utc::now());

    let changed = repository
        .task_lists
        .patch(task_list_id, &updated_patch)
        .await?;

    if !changed {
        // パッチ適用で変更がなかった場合、エンティティが存在するかチェック
        if repository
            .task_lists
            .find_by_id(task_list_id)
            .await?
            .is_none()
        {
            return Err(ServiceError::NotFound("TaskList not found".to_string()));
        }
    }

    Ok(changed)
}

pub async fn delete_task_list(id: &TaskListId) -> Result<(), ServiceError> {
    let repository = Repositories::instance().await;
    repository.task_lists.delete(id).await?;
    Ok(())
}

pub async fn list_task_lists(_project_id: &str) -> Result<Vec<TaskList>, ServiceError> {
    let repository = Repositories::instance().await;
    let all_task_lists = repository.task_lists.find_all().await?;

    // project_idでフィルタリング
    let mut filtered_lists = all_task_lists
        .into_iter()
        // .filter(|tl| tl.project_id.to_string() == project_id)
        .collect::<Vec<_>>();

    // order_indexでソート
    filtered_lists.sort_by(|a, b| a.order_index.cmp(&b.order_index));

    Ok(filtered_lists)
}

/// プロジェクトIDからタスクを含むタスクリスト一覧を取得
pub async fn get_task_lists_with_tasks(
    project_id: &ProjectId,
) -> Result<Vec<TaskListTree>, ServiceError> {
    let repository = Repositories::instance().await;

    // 1. プロジェクトのタスクリストを取得
    let task_lists = list_task_lists(&project_id.to_string()).await?;

    let mut task_lists_with_tasks = Vec::new();

    // 2. 各タスクリストに対してタスクを取得
    for task_list in task_lists {
        // タスクリストに属するタスクを取得
        let tasks = repository
            .tasks
            .find_all()
            .await?
            .into_iter()
            .filter(|task| task.list_id == task_list.id)
            .collect::<Vec<_>>();

        let mut tasks_with_subtasks = Vec::new();

        // 3. 各タスクにサブタスクとタグを追加
        for task in tasks {
            // サブタスクを取得
            let subtasks = repository
                .sub_tasks
                .find_all()
                .await?
                .into_iter()
                .filter(|subtask| subtask.task_id == task.id)
                .collect::<Vec<_>>();

            // タグを取得（タスクに関連付けられたタグ）
            let tags = if !task.tag_ids.is_empty() {
                repository
                    .tags
                    .find_all()
                    .await?
                    .into_iter()
                    .filter(|tag| task.tag_ids.contains(&tag.id))
                    .collect::<Vec<_>>()
            } else {
                Vec::new()
            };

            // SubTaskからSubTaskTreeに変換
            let mut sub_task_trees = Vec::new();
            for subtask in subtasks {
                // サブタスクに関連するタグを取得
                let subtask_tags = if !subtask.tag_ids.is_empty() {
                    repository
                        .tags
                        .find_all()
                        .await?
                        .into_iter()
                        .filter(|tag| subtask.tag_ids.contains(&tag.id))
                        .collect::<Vec<_>>()
                } else {
                    Vec::new()
                };

                use flequit_model::models::subtask::SubTaskTree;
                let sub_task_tree = SubTaskTree {
                    id: subtask.id,
                    task_id: subtask.task_id,
                    title: subtask.title,
                    description: subtask.description,
                    status: subtask.status,
                    priority: subtask.priority,
                    plan_start_date: subtask.plan_start_date,
                    plan_end_date: subtask.plan_end_date,
                    do_start_date: subtask.do_start_date,
                    do_end_date: subtask.do_end_date,
                    is_range_date: subtask.is_range_date,
                    recurrence_rule: subtask.recurrence_rule,
                    order_index: subtask.order_index,
                    completed: subtask.completed,
                    created_at: subtask.created_at,
                    updated_at: subtask.updated_at,
                    assigned_user_ids: subtask.assigned_user_ids,
                    tags: subtask_tags,
                };
                sub_task_trees.push(sub_task_tree);
            }

            let tasktree = TaskTree {
                id: task.id,
                project_id: task.project_id,
                list_id: task.list_id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                plan_start_date: task.plan_start_date,
                plan_end_date: task.plan_end_date,
                do_start_date: task.do_start_date,
                do_end_date: task.do_end_date,
                is_range_date: task.is_range_date,
                recurrence_rule: task.recurrence_rule,
                assigned_user_ids: task.assigned_user_ids,
                order_index: task.order_index,
                is_archived: task.is_archived,
                created_at: task.created_at,
                updated_at: task.updated_at,
                sub_tasks: sub_task_trees,
                tags,
            };

            tasks_with_subtasks.push(tasktree);
        }

        // TaskListTreeを構築
        let task_list_tree = TaskListTree {
            id: task_list.id,
            project_id: task_list.project_id,
            name: task_list.name,
            description: task_list.description,
            color: task_list.color,
            order_index: task_list.order_index,
            is_archived: task_list.is_archived,
            created_at: task_list.created_at,
            updated_at: task_list.updated_at,
            tasks: tasks_with_subtasks,
        };

        task_lists_with_tasks.push(task_list_tree);
    }

    Ok(task_lists_with_tasks)
}
