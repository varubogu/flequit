// use serde::{Deserialize, Serialize};
// use std::collections::HashMap;
// use crate::errors::AutomergeError;

// /// Automerge-RepoのためのBulkシリアライゼーション対応トレイト
// pub trait AutomergeBulkSerializable: Serialize + for<'de> Deserialize<'de> {
//     /// 構造体をHashMapに変換（JSONを経由）
//     fn to_value_map(&self) -> Result<HashMap<String, serde_json::Value>, AutomergeError> {
//         let json = serde_json::to_value(self)
//             .map_err(|e| AutomergeError::SerializationError(e.to_string()))?;
//         if let serde_json::Value::Object(map) = json {
//             Ok(map.into_iter().collect())
//         } else {
//             Err(AutomergeError::InvalidValue("Not an object".to_string()))
//         }
//     }

//     /// HashMapから構造体に変換（JSONを経由）
//     fn from_value_map(map: HashMap<String, serde_json::Value>) -> Result<Self, AutomergeError> {
//         let json_obj: serde_json::Map<String, serde_json::Value> = map.into_iter().collect();
//         let json = serde_json::Value::Object(json_obj);
//         serde_json::from_value(json)
//             .map_err(|e| AutomergeError::DeserializationError(e.to_string()))
//     }

//     /// スキーマバージョン
//     fn schema_version() -> &'static str { "1.0" }

//     /// JSON Schema定義（オプション）
//     fn json_schema() -> Option<serde_json::Value> { None }
// }

// // 基本型の自動実装（既存の型に適用）
// use crate::models::project_models::{Project, ProjectMember};
// use crate::models::task_models::{Task, Subtask, Tag};
// use crate::models::user_models::{User};

// impl AutomergeBulkSerializable for Project {}
// impl AutomergeBulkSerializable for Task {}
// impl AutomergeBulkSerializable for Subtask {}
// impl AutomergeBulkSerializable for User {}
// impl AutomergeBulkSerializable for Tag {}
// impl AutomergeBulkSerializable for ProjectMember {}
