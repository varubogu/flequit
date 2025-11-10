use chrono::Utc;
use flequit_infrastructure::InfrastructureRepositoriesTrait;
use flequit_model::models::task_projects::task::TaskTree;
use flequit_model::models::task_projects::task_list::{PartialTaskList, TaskList, TaskListTree};
use flequit_model::models::task_projects::SubTaskTree;
use flequit_model::types::id_types::{ProjectId, TaskListId, UserId};
use flequit_repository::repositories::project_patchable_trait::ProjectPatchable;
use flequit_repository::repositories::project_repository_trait::ProjectRepository;
use flequit_types::errors::service_error::ServiceError;

pub async fn create_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list: &TaskList,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    repositories
        .task_lists()
        .save(project_id, task_list, user_id, &now)
        .await?;
    Ok(())
}

pub async fn get_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    list_id: &TaskListId,
) -> Result<Option<TaskList>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    Ok(repositories
        .task_lists()
        .find_by_id(project_id, list_id)
        .await?)
}

pub async fn update_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    task_list_id: &TaskListId,
    patch: &PartialTaskList,
    user_id: &UserId,
) -> Result<bool, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let now = Utc::now();
    Ok(repositories
        .task_lists()
        .patch(project_id, task_list_id, patch, user_id, &now)
        .await?)
}

pub async fn delete_task_list<R>(
    repositories: &R,
    project_id: &ProjectId,
    id: &TaskListId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    repositories.task_lists().delete(project_id, id).await?;
    Ok(())
}

pub async fn list_task_lists<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<TaskList>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    let all_task_lists = repositories.task_lists().find_all(project_id).await?;

    // project_idでフィルタリングは不要（find_allで既にフィルタされている）
    let mut filtered_lists = all_task_lists;

    // order_indexでソート
    filtered_lists.sort_by(|a, b| a.order_index.cmp(&b.order_index));

    Ok(filtered_lists)
}

/// プロジェクトIDからタスクを含むタスクリスト一覧を取得
pub async fn get_task_lists_with_tasks<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<Vec<TaskListTree>, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1. プロジェクトのタスクリストを取得
    let task_lists = list_task_lists(repositories, project_id).await?;

    // 2. プロジェクト内の全タグを1回だけ取得（パフォーマンス最適化）
    // let all_tags = repositories.tags().find_all(project_id).await?;
    // let tag_map: std::collections::HashMap<_, _> = all_tags.into_iter()
    //     .map(|tag| (tag.id.clone(), tag))
    //     .collect();

    // 3. プロジェクト内の全タスクとサブタスクを一括取得（パフォーマンス最適化）
    let all_tasks = repositories.tasks().find_all(project_id).await?;
    let all_subtasks = repositories.sub_tasks().find_all(project_id).await?;

    let mut task_lists_with_tasks = Vec::new();

    // 4. 各タスクリストに対してタスクを取得
    for task_list in task_lists {
        // タスクリストに属するタスクを取得
        let tasks = all_tasks
            .iter()
            .filter(|task| task.list_id == task_list.id)
            .collect::<Vec<_>>();

        let mut tasks_with_subtasks = Vec::new();

        // 5. 各タスクにサブタスクとタグを追加
        for task in tasks {
            // サブタスクを取得
            let subtasks = all_subtasks
                .iter()
                .filter(|subtask| subtask.task_id == task.id)
                .collect::<Vec<_>>();

            // SubTaskからSubTaskTreeに変換
            let mut sub_task_trees = Vec::new();
            for subtask in subtasks {
                let sub_task_tree = SubTaskTree {
                    id: subtask.id.clone(),
                    task_id: subtask.task_id.clone(),
                    title: subtask.title.clone(),
                    description: subtask.description.clone(),
                    status: subtask.status.clone(),
                    priority: subtask.priority,
                    plan_start_date: subtask.plan_start_date,
                    plan_end_date: subtask.plan_end_date,
                    do_start_date: subtask.do_start_date,
                    do_end_date: subtask.do_end_date,
                    is_range_date: subtask.is_range_date,
                    recurrence_rule: subtask.recurrence_rule.clone(),
                    order_index: subtask.order_index,
                    completed: subtask.completed,
                    created_at: subtask.created_at,
                    updated_at: subtask.updated_at,
                    deleted: subtask.deleted,
                    updated_by: subtask.updated_by.clone(),
                    assigned_user_ids: subtask.assigned_user_ids.clone(),
                    tag_ids: subtask.tag_ids.clone(),
                };
                sub_task_trees.push(sub_task_tree);
            }

            let task_tree = TaskTree {
                id: task.id.clone(),
                project_id: task.project_id.clone(),
                list_id: task.list_id.clone(),
                title: task.title.clone(),
                description: task.description.clone(),
                status: task.status.clone(),
                priority: task.priority,
                plan_start_date: task.plan_start_date,
                plan_end_date: task.plan_end_date,
                do_start_date: task.do_start_date,
                do_end_date: task.do_end_date,
                is_range_date: task.is_range_date,
                recurrence_rule: task.recurrence_rule.clone(),
                assigned_user_ids: task.assigned_user_ids.clone(),
                order_index: task.order_index,
                is_archived: task.is_archived,
                created_at: task.created_at,
                updated_at: task.updated_at,
                deleted: task.deleted,
                updated_by: task.updated_by.clone(),
                sub_tasks: sub_task_trees,
                tag_ids: task.tag_ids.clone(),
            };

            tasks_with_subtasks.push(task_tree);
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
            deleted: task_list.deleted,
            updated_by: task_list.updated_by,
            tasks: tasks_with_subtasks,
        };

        task_lists_with_tasks.push(task_list_tree);
    }

    Ok(task_lists_with_tasks)
}
