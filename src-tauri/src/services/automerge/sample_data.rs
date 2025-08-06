use automerge::{AutomergeError, ObjType};
use super::core::AutomergeManager;

impl AutomergeManager {
    pub fn initialize_sample_data(&self) -> Result<(), AutomergeError> {
        let mut doc = self.doc.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        let today = chrono::Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp_millis();

        // Initialize projects map
        let projects_obj = doc.put_object(automerge::ROOT, "projects", ObjType::Map)?;
        
        // Project 1: Personal Tasks
        let project1_obj = doc.put_object(&projects_obj, "project-1", ObjType::Map)?;
        doc.put(&project1_obj, "id", "project-1")?;
        doc.put(&project1_obj, "name", "Personal Tasks")?;
        doc.put(&project1_obj, "description", "Personal todo items and tasks")?;
        doc.put(&project1_obj, "color", "#3b82f6")?;
        doc.put(&project1_obj, "order_index", 0)?;
        doc.put(&project1_obj, "is_archived", false)?;
        doc.put(&project1_obj, "created_at", now)?;
        doc.put(&project1_obj, "updated_at", now)?;
        
        let task_lists_obj = doc.put_object(&project1_obj, "task_lists", ObjType::Map)?;
        
        // Task List 1: Daily Tasks
        let list1_obj = doc.put_object(&task_lists_obj, "list-1", ObjType::Map)?;
        doc.put(&list1_obj, "id", "list-1")?;
        doc.put(&list1_obj, "project_id", "project-1")?;
        doc.put(&list1_obj, "name", "Daily Tasks")?;
        doc.put(&list1_obj, "description", "Tasks for today")?;
        doc.put(&list1_obj, "color", "#10b981")?;
        doc.put(&list1_obj, "order_index", 0)?;
        doc.put(&list1_obj, "is_archived", false)?;
        doc.put(&list1_obj, "created_at", now)?;
        doc.put(&list1_obj, "updated_at", now)?;
        
        let tasks_obj = doc.put_object(&list1_obj, "tasks", ObjType::Map)?;
        
        // Task 1: Review morning emails
        let task1_obj = doc.put_object(&tasks_obj, "task-1", ObjType::Map)?;
        doc.put(&task1_obj, "id", "task-1")?;
        doc.put(&task1_obj, "list_id", "list-1")?;
        doc.put(&task1_obj, "title", "Review morning emails")?;
        doc.put(&task1_obj, "description", "Check and respond to important emails")?;
        doc.put(&task1_obj, "status", "not_started")?;
        doc.put(&task1_obj, "priority", 1)?;
        doc.put(&task1_obj, "end_date", today)?;
        doc.put(&task1_obj, "order_index", 0)?;
        doc.put(&task1_obj, "is_archived", false)?;
        doc.put(&task1_obj, "created_at", now)?;
        doc.put(&task1_obj, "updated_at", now)?;
        
        let subtasks1_obj = doc.put_object(&task1_obj, "sub_tasks", ObjType::Map)?;
        let tags1_obj = doc.put_object(&task1_obj, "tags", ObjType::Map)?;
        
        // Subtask 1-1
        let subtask1_obj = doc.put_object(&subtasks1_obj, "subtask-1", ObjType::Map)?;
        doc.put(&subtask1_obj, "id", "subtask-1")?;
        doc.put(&subtask1_obj, "task_id", "task-1")?;
        doc.put(&subtask1_obj, "title", "Check work inbox")?;
        doc.put(&subtask1_obj, "description", "Review all unread emails in work account")?;
        doc.put(&subtask1_obj, "status", "not_started")?;
        doc.put(&subtask1_obj, "priority", 2)?;
        doc.put(&subtask1_obj, "start_date", today + 60 * 60 * 1000)?;
        doc.put(&subtask1_obj, "end_date", today + 3 * 60 * 60 * 1000)?;
        doc.put(&subtask1_obj, "order_index", 0)?;
        doc.put(&subtask1_obj, "created_at", now)?;
        doc.put(&subtask1_obj, "updated_at", now)?;
        doc.put_object(&subtask1_obj, "tags", ObjType::Map)?;
        
        // Task 2: Buy groceries
        let task2_obj = doc.put_object(&tasks_obj, "task-2", ObjType::Map)?;
        doc.put(&task2_obj, "id", "task-2")?;
        doc.put(&task2_obj, "list_id", "list-1")?;
        doc.put(&task2_obj, "title", "Buy groceries")?;
        doc.put(&task2_obj, "description", "Get ingredients for dinner tonight")?;
        doc.put(&task2_obj, "status", "not_started")?;
        doc.put(&task2_obj, "priority", 2)?;
        doc.put(&task2_obj, "end_date", today)?;
        doc.put(&task2_obj, "order_index", 1)?;
        doc.put(&task2_obj, "is_archived", false)?;
        doc.put(&task2_obj, "created_at", now)?;
        doc.put(&task2_obj, "updated_at", now)?;
        doc.put_object(&task2_obj, "sub_tasks", ObjType::Map)?;
        doc.put_object(&task2_obj, "tags", ObjType::Map)?;

        // Initialize tags collection
        let tags_collection = doc.put_object(automerge::ROOT, "tags", ObjType::Map)?;
        
        // Global Tag 1: work
        let global_tag1_obj = doc.put_object(&tags_collection, "tag-1", ObjType::Map)?;
        doc.put(&global_tag1_obj, "id", "tag-1")?;
        doc.put(&global_tag1_obj, "name", "work")?;
        doc.put(&global_tag1_obj, "color", "#f59e0b")?;
        doc.put(&global_tag1_obj, "created_at", now)?;
        doc.put(&global_tag1_obj, "updated_at", now)?;
        
        // Global Tag 2: personal
        let global_tag2_obj = doc.put_object(&tags_collection, "tag-2", ObjType::Map)?;
        doc.put(&global_tag2_obj, "id", "tag-2")?;
        doc.put(&global_tag2_obj, "name", "personal")?;
        doc.put(&global_tag2_obj, "color", "#8b5cf6")?;
        doc.put(&global_tag2_obj, "created_at", now)?;
        doc.put(&global_tag2_obj, "updated_at", now)?;

        // Add tag references to tasks
        let task1_tags_obj = doc.get(&task1_obj, "tags")?;
        let tag1_ref_obj = doc.put_object(&task1_tags_obj, "tag-1", ObjType::Map)?;
        doc.put(&tag1_ref_obj, "id", "tag-1")?;

        let task2_tags_obj = doc.get(&task2_obj, "tags")?;
        let tag2_ref_obj = doc.put_object(&task2_tags_obj, "tag-2", ObjType::Map)?;
        doc.put(&tag2_ref_obj, "id", "tag-2")?;

        Ok(())
    }
}