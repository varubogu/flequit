use automerge::{Automerge, AutomergeError, ObjId, ObjType, ScalarValue};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::types::task_types::*;

/// Automergeドキュメントとの高レベルインターフェース
/// 構造化データの読み書きを一括で行う抽象化レイヤー
pub trait AutomergeInterface {
    /// 構造体をAutomergeオブジェクトに書き込む
    fn put_struct<T: AutomergeSerializable>(&mut self, parent: &ObjId, key: &str, data: &T) -> Result<ObjId, AutomergeError>;

    /// Automergeオブジェクトから構造体を読み込む
    fn get_struct<T: AutomergeSerializable>(&self, obj: &ObjId, schema_version: Option<&str>) -> Result<T, AutomergeError>;

    /// オプショナルフィールドを含む構造体を読み込む（バージョン互換性対応）
    fn get_struct_safe<T: AutomergeSerializable>(&self, obj: &ObjId) -> Result<T, AutomergeError>;
}

/// Automergeでシリアライズ可能な型のトレイト
pub trait AutomergeSerializable: Sized {
    /// 構造体をAutomergeオブジェクトに書き込む
    fn to_automerge(&self, doc: &mut Automerge, obj: &ObjId) -> Result<(), AutomergeError>;

    /// Automergeオブジェクトから構造体を読み込む
    fn from_automerge(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError>;

    /// バージョン互換性を考慮した読み込み（デフォルト値で補完）
    fn from_automerge_safe(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError> {
        Self::from_automerge(doc, obj)
    }

    /// スキーマバージョンを取得
    fn schema_version() -> &'static str {
        "1.0"
    }
}

/// Automergeの実装
impl AutomergeInterface for Automerge {
    fn put_struct<T: AutomergeSerializable>(&mut self, parent: &ObjId, key: &str, data: &T) -> Result<ObjId, AutomergeError> {
        let obj = self.put_object(parent, key, ObjType::Map)?;

        // スキーマバージョンを記録
        self.put(&obj, "_schema_version", T::schema_version())?;
        self.put(&obj, "_updated_at", chrono::Utc::now().timestamp_millis())?;

        data.to_automerge(self, &obj)?;
        Ok(obj)
    }

    fn get_struct<T: AutomergeSerializable>(&self, obj: &ObjId, schema_version: Option<&str>) -> Result<T, AutomergeError> {
        // スキーマバージョンをチェック
        if let Some(expected_version) = schema_version {
            if let Ok(actual_version) = self.get(obj, "_schema_version") {
                let actual_version_str = actual_version.to_string();
                if actual_version_str != expected_version {
                    log::warn!(
                        "Schema version mismatch: expected {}, found {}. Using safe deserialization.",
                        expected_version, actual_version_str
                    );
                    return T::from_automerge_safe(self, obj);
                }
            }
        }

        T::from_automerge(self, obj)
    }

    fn get_struct_safe<T: AutomergeSerializable>(&self, obj: &ObjId) -> Result<T, AutomergeError> {
        T::from_automerge_safe(self, obj)
    }
}

/// ヘルパーマクロ：Automergeシリアライゼーションの定型コードを生成
#[macro_export]
macro_rules! impl_automerge_serializable {
    ($struct_name:ident, $version:literal, {
        $(required $field:ident: $field_type:ty,)*
        $(optional $opt_field:ident: $opt_type:ty = $default:expr,)*
    }) => {
        impl AutomergeSerializable for $struct_name {
            fn to_automerge(&self, doc: &mut Automerge, obj: &ObjId) -> Result<(), AutomergeError> {
                $(
                    doc.put(obj, stringify!($field), &self.$field)?;
                )*
                $(
                    if let Some(ref value) = self.$opt_field {
                        doc.put(obj, stringify!($opt_field), value)?;
                    }
                )*
                Ok(())
            }

            fn from_automerge(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError> {
                Ok($struct_name {
                    $(
                        $field: extract_value(doc.get(obj, stringify!($field))?)?,
                    )*
                    $(
                        $opt_field: doc.get(obj, stringify!($opt_field)).ok().and_then(|v| extract_value(v).ok()),
                    )*
                })
            }

            fn from_automerge_safe(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError> {
                $(
                    let $field = match doc.get(obj, stringify!($field)) {
                        Ok(value) => extract_value(value)?,
                        Err(_) => {
                            log::warn!("Missing required field '{}' in {}, using default", stringify!($field), stringify!($struct_name));
                            return Err(AutomergeError::InvalidObjectId);
                        }
                    };
                )*

                $(
                    let $opt_field = match doc.get(obj, stringify!($opt_field)) {
                        Ok(value) => extract_value(value).ok(),
                        Err(_) => {
                            log::debug!("Optional field '{}' not found in {}, using default", stringify!($opt_field), stringify!($struct_name));
                            $default
                        }
                    };
                )*

                Ok($struct_name {
                    $($field,)*
                    $($opt_field,)*
                })
            }

            fn schema_version() -> &'static str {
                $version
            }
        }
    };
}

/// Automerge値から型安全な値への変換
pub fn extract_value<T>(value: (automerge::Value, automerge::ObjId)) -> Result<T, AutomergeError>
where
    T: ExtractFromAutomerge,
{
    T::extract_from_automerge(value.0)
}

/// Automerge値から型への抽出トレイト
pub trait ExtractFromAutomerge: Sized {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError>;
}

// 基本型の実装
impl ExtractFromAutomerge for String {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError> {
        match value {
            automerge::Value::Scalar(scalar) => match scalar.as_ref() {
                ScalarValue::Str(s) => Ok(s.clone()),
                _ => Err(AutomergeError::InvalidObjectId),
            },
            _ => Err(AutomergeError::InvalidObjectId),
        }
    }
}

impl ExtractFromAutomerge for i64 {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError> {
        match value {
            automerge::Value::Scalar(scalar) => match scalar.as_ref() {
                ScalarValue::Int(i) => Ok(*i),
                _ => Err(AutomergeError::InvalidObjectId),
            },
            _ => Err(AutomergeError::InvalidObjectId),
        }
    }
}

impl ExtractFromAutomerge for i32 {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError> {
        match value {
            automerge::Value::Scalar(scalar) => match scalar.as_ref() {
                ScalarValue::Int(i) => Ok(*i as i32),
                _ => Err(AutomergeError::InvalidObjectId),
            },
            _ => Err(AutomergeError::InvalidObjectId),
        }
    }
}

impl ExtractFromAutomerge for bool {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError> {
        match value {
            automerge::Value::Scalar(scalar) => match scalar.as_ref() {
                ScalarValue::Boolean(b) => Ok(*b),
                _ => Err(AutomergeError::InvalidObjectId),
            },
            _ => Err(AutomergeError::InvalidObjectId),
        }
    }
}

impl<T: ExtractFromAutomerge> ExtractFromAutomerge for Option<T> {
    fn extract_from_automerge(value: automerge::Value) -> Result<Self, AutomergeError> {
        match T::extract_from_automerge(value) {
            Ok(v) => Ok(Some(v)),
            Err(_) => Ok(None),
        }
    }
}

/// 特定のフィールドを安全に取得するヘルパー関数
pub fn get_field_safe<T: ExtractFromAutomerge>(doc: &Automerge, obj: &ObjId, field: &str, default: T) -> T {
    match doc.get(obj, field) {
        Ok(value) => extract_value(value).unwrap_or(default),
        Err(_) => {
            log::debug!("Field '{}' not found, using default value", field);
            default
        }
    }
}

/// オプションフィールドを安全に取得するヘルパー関数
pub fn get_optional_field<T: ExtractFromAutomerge>(doc: &Automerge, obj: &ObjId, field: &str) -> Option<T> {
    doc.get(obj, field).ok().and_then(|v| extract_value(v).ok())
}

/// 高レベルなAutomergeデータアクセス関数群
/// コレクション操作とオブジェクトアクセスを抽象化

/// 指定されたパスのコレクションを取得またはオブジェクトを作成
pub fn ensure_collection<'a>(doc: &'a mut Automerge, parent: &'a ObjId, key: &'a str) -> Result<(automerge::Value<'a>, automerge::ObjId), AutomergeError> {
    match doc.get(parent, key) {
        Ok(obj) => Ok(obj),
        Err(_) => {
            let obj_id = doc.put_object(parent, key, ObjType::Map)?;
            Ok((automerge::Value::Object(ObjType::Map), obj_id))
        }
    }
}

/// タスクオブジェクトを検索
pub fn find_task_object(doc: &Automerge, task_id: &str) -> Result<Option<automerge::ObjId>, AutomergeError> {
    let Some((_, projects_obj)) = get_object_entry(doc, &automerge::ROOT, "projects") else {
        return Ok(None);
    };

    for project_id in get_keys(doc, &projects_obj) {
        let Some((_, project_obj)) = get_object_entry(doc, &projects_obj, &project_id) else { continue; };
        let Some((_, task_lists_obj)) = get_object_entry(doc, &project_obj, "task_lists") else { continue; };

        for list_id in get_keys(doc, &task_lists_obj) {
            let Some((_, list_obj)) = get_object_entry(doc, &task_lists_obj, &list_id) else { continue; };
            let Some((_, tasks_obj)) = get_object_entry(doc, &list_obj, "tasks") else { continue; };

            if let Some((_, task_obj)) = get_object_entry(doc, &tasks_obj, task_id) {
                return Ok(Some(task_obj));
            }
        }
    }
    Ok(None)
}

/// サブタスクオブジェクトを検索
pub fn find_subtask_object(doc: &Automerge, subtask_id: &str) -> Result<Option<automerge::ObjId>, AutomergeError> {
    let Some((_, projects_obj)) = get_object_entry(doc, &automerge::ROOT, "projects") else {
        return Ok(None);
    };

    for project_id in get_keys(doc, &projects_obj) {
        let Some((_, project_obj)) = get_object_entry(doc, &projects_obj, &project_id) else { continue; };
        let Some((_, task_lists_obj)) = get_object_entry(doc, &project_obj, "task_lists") else { continue; };

        for list_id in get_keys(doc, &task_lists_obj) {
            let Some((_, list_obj)) = get_object_entry(doc, &task_lists_obj, &list_id) else { continue; };
            let Some((_, tasks_obj)) = get_object_entry(doc, &list_obj, "tasks") else { continue; };

            for task_id_key in get_keys(doc, &tasks_obj) {
                let Some((_, task_obj)) = get_object_entry(doc, &tasks_obj, &task_id_key) else { continue; };
                let Some((_, sub_tasks_obj)) = get_object_entry(doc, &task_obj, "sub_tasks") else { continue; };

                if let Some((_, subtask_obj)) = get_object_entry(doc, &sub_tasks_obj, subtask_id) {
                    return Ok(Some(subtask_obj));
                }
            }
        }
    }
    Ok(None)
}

/// タスクにタグを関連付け
pub fn add_tag_to_object(doc: &mut Automerge, object_id: &ObjId, tag_id: &str) -> Result<bool, AutomergeError> {
    let tags_obj = match doc.get(object_id, "tags") {
        Ok(obj) => obj.1,
        Err(_) => doc.put_object(object_id, "tags", ObjType::Map)?,
    };

    let tag_ref_obj = doc.put_object(&tags_obj, tag_id, ObjType::Map)?;
    doc.put(&tag_ref_obj, "id", tag_id)?;
    Ok(true)
}

/// オブジェクトからタグの関連付けを削除
pub fn remove_tag_from_object(doc: &mut Automerge, object_id: &ObjId, tag_id: &str) -> Result<bool, AutomergeError> {
    if let Ok((_, tags_obj)) = doc.get(object_id, "tags") {
        if doc.get(&tags_obj, tag_id).is_ok() {
            match doc.delete(&tags_obj, tag_id) {
                Ok(_) => Ok(true),
                Err(_) => Ok(false),
            }
        } else {
            Ok(false)
        }
    } else {
        Ok(false)
    }
}

/// タグが存在するかチェック
pub fn tag_exists(doc: &Automerge, tag_id: &str) -> bool {
    if let Some((_, tags_obj)) = get_object_entry(doc, &automerge::ROOT, "tags") {
        get_object_entry(doc, &tags_obj, tag_id).is_some()
    } else {
        false
    }
}

/// オブジェクトの更新日時を更新
pub fn update_timestamp(doc: &mut Automerge, object_id: &ObjId) -> Result<(), AutomergeError> {
    let now = chrono::Utc::now().timestamp_millis();
    doc.put(object_id, "updated_at", now)?;
    Ok(())
}

/// 構造化データの一括インポート用のマクロ
#[macro_export]
macro_rules! import_object_fields {
    ($doc:expr, $obj:expr, {
        $(required $field:ident: $value:expr,)*
        $(optional $opt_field:ident: $opt_value:expr,)*
    }) => {
        $(
            $doc.put($obj, stringify!($field), &$value)?;
        )*
        $(
            if let Some(ref value) = $opt_value {
                $doc.put($obj, stringify!($opt_field), value)?;
            }
        )*
    };
}

/// プロジェクト、タスクリスト、タスクを一括でAutomergeドキュメントに書き込み
pub fn import_project_data(
    doc: &mut Automerge,
    projects: Vec<crate::types::task_types::ProjectTree>
) -> Result<(), AutomergeError> {
    use crate::import_object_fields;

    // プロジェクトマップを作成
    let projects_obj = doc.put_object(automerge::ROOT, "projects", ObjType::Map)?;

    for project in projects {
        let project_obj = doc.put_object(&projects_obj, &project.id, ObjType::Map)?;

        import_object_fields!(doc, &project_obj, {
            required id: project.id,
            required name: project.name,
            required order_index: project.order_index,
            required is_archived: project.is_archived,
            required created_at: project.created_at,
            required updated_at: project.updated_at,
            optional description: project.description,
            optional color: project.color,
        });

        // タスクリストを書き込み
        let task_lists_obj = doc.put_object(&project_obj, "task_lists", ObjType::Map)?;
        for task_list in project.task_lists {
            let list_obj = doc.put_object(&task_lists_obj, &task_list.id, ObjType::Map)?;

            import_object_fields!(doc, &list_obj, {
                required id: task_list.id,
                required project_id: task_list.project_id,
                required name: task_list.name,
                required order_index: task_list.order_index,
                required is_archived: task_list.is_archived,
                required created_at: task_list.created_at,
                required updated_at: task_list.updated_at,
                optional description: task_list.description,
                optional color: task_list.color,
            });

            // タスクを書き込み
            let tasks_obj = doc.put_object(&list_obj, "tasks", ObjType::Map)?;
            for task in task_list.tasks {
                let task_obj = doc.put_object(&tasks_obj, &task.id, ObjType::Map)?;

                import_object_fields!(doc, &task_obj, {
                    required id: task.id,
                    required list_id: task.list_id,
                    required title: task.title,
                    required status: task.status,
                    required priority: task.priority,
                    required order_index: task.order_index,
                    required is_archived: task.is_archived,
                    required created_at: task.created_at,
                    required updated_at: task.updated_at,
                    optional description: task.description,
                    optional start_date: task.start_date,
                    optional end_date: task.end_date,
                });

                // サブタスクとタグのマップを初期化
                doc.put_object(&task_obj, "sub_tasks", ObjType::Map)?;
                doc.put_object(&task_obj, "tags", ObjType::Map)?;
            }
        }
    }

    Ok(())
}

/// オブジェクトのキー一覧を取得
pub fn get_keys(doc: &Automerge, obj: &ObjId) -> Vec<String> {
    doc.keys(obj).map(|(_, key)| key).collect()
}

/// オブジェクト内のエントリを安全に取得
pub fn get_object_entry<'a>(doc: &'a Automerge, parent: &'a ObjId, key: &'a str) -> Option<(automerge::Value<'a>, automerge::ObjId)> {
    doc.get(parent, key).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, PartialEq)]
    struct TestStruct {
        id: String,
        name: String,
        count: i64,
        optional_field: Option<String>,
    }

    // TestStruct用の手動実装（マクロ使用例）
    impl AutomergeSerializable for TestStruct {
        fn to_automerge(&self, doc: &mut Automerge, obj: &ObjId) -> Result<(), AutomergeError> {
            doc.put(obj, "id", &self.id)?;
            doc.put(obj, "name", &self.name)?;
            doc.put(obj, "count", self.count)?;
            if let Some(ref value) = self.optional_field {
                doc.put(obj, "optional_field", value)?;
            }
            Ok(())
        }

        fn from_automerge(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError> {
            Ok(TestStruct {
                id: extract_value(doc.get(obj, "id")?)?,
                name: extract_value(doc.get(obj, "name")?)?,
                count: extract_value(doc.get(obj, "count")?)?,
                optional_field: doc.get(obj, "optional_field").ok().and_then(|v| extract_value(v).ok()),
            })
        }

        fn from_automerge_safe(doc: &Automerge, obj: &ObjId) -> Result<Self, AutomergeError> {
            let id = match doc.get(obj, "id") {
                Ok(value) => extract_value(value)?,
                Err(_) => {
                    log::warn!("Missing required field 'id' in TestStruct, using default");
                    return Err(AutomergeError::InvalidObjectId);
                }
            };

            let name = match doc.get(obj, "name") {
                Ok(value) => extract_value(value)?,
                Err(_) => {
                    log::warn!("Missing required field 'name' in TestStruct, using default");
                    return Err(AutomergeError::InvalidObjectId);
                }
            };

            let count = match doc.get(obj, "count") {
                Ok(value) => extract_value(value)?,
                Err(_) => {
                    log::warn!("Missing required field 'count' in TestStruct, using default");
                    return Err(AutomergeError::InvalidObjectId);
                }
            };

            let optional_field = match doc.get(obj, "optional_field") {
                Ok(value) => extract_value(value).ok(),
                Err(_) => {
                    log::debug!("Optional field 'optional_field' not found in TestStruct, using default");
                    None
                }
            };

            Ok(TestStruct {
                id,
                name,
                count,
                optional_field,
            })
        }

        fn schema_version() -> &'static str {
            "1.0"
        }
    }

    #[test]
    fn test_basic_serialization() {
        let mut doc = Automerge::new();
        let root = automerge::ROOT;

        let test_data = TestStruct {
            id: "test-id".to_string(),
            name: "Test Name".to_string(),
            count: 42,
            optional_field: Some("optional value".to_string()),
        };

        let obj = doc.put_struct(&root, "test", &test_data).unwrap();
        let restored = doc.get_struct::<TestStruct>(&obj, Some("1.0")).unwrap();

        assert_eq!(test_data, restored);
    }
}
