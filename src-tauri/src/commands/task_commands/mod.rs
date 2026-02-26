//! タスク関連Tauriコマンド
//!
//! タスクのCRUD操作および繰り返しルール管理コマンドを提供する

mod read;
mod recurrence;
mod write;

// 関数の再エクスポート
pub use read::get_task;
pub use recurrence::{
    create_recurrence_adjustment, create_recurrence_details, create_recurrence_rule,
    create_task_recurrence, delete_recurrence_adjustment, delete_recurrence_details,
    delete_recurrence_rule, delete_task_recurrence, get_all_recurrence_rules,
    get_recurrence_adjustments_by_rule_id, get_recurrence_details_by_rule_id, get_recurrence_rule,
    get_task_recurrence_by_task_id, update_recurrence_details, update_recurrence_rule,
};
pub use write::{create_task, delete_task, restore_task, update_task};

// Tauri generate_handler! 用の __cmd__* シンボルの再エクスポート
pub use read::__cmd__get_task;
pub use recurrence::{
    __cmd__create_recurrence_adjustment, __cmd__create_recurrence_details,
    __cmd__create_recurrence_rule, __cmd__create_task_recurrence,
    __cmd__delete_recurrence_adjustment, __cmd__delete_recurrence_details,
    __cmd__delete_recurrence_rule, __cmd__delete_task_recurrence, __cmd__get_all_recurrence_rules,
    __cmd__get_recurrence_adjustments_by_rule_id, __cmd__get_recurrence_details_by_rule_id,
    __cmd__get_recurrence_rule, __cmd__get_task_recurrence_by_task_id,
    __cmd__update_recurrence_details, __cmd__update_recurrence_rule,
};
pub use write::{
    __cmd__create_task, __cmd__delete_task, __cmd__restore_task, __cmd__update_task,
};
