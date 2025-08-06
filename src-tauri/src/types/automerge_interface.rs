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
pub fn ensure_collection(doc: &mut Automerge, parent: &ObjId, key: &str) -> Result<(automerge::Value, automerge::ObjId), AutomergeError> {
    match doc.get(parent, key) {
        Ok(obj) => Ok(obj),
        Err(_) => {
            let obj_id = doc.put_object(parent, key, ObjType::Map)?;
            Ok((automerge::Value::Object(ObjType::Map), obj_id))
        }
    }
}

/// オブジェクトのキー一覧を取得
pub fn get_keys(doc: &Automerge, obj: &ObjId) -> Vec<String> {
    doc.keys(obj).map(|(_, key)| key).collect()
}

/// オブジェクト内のエントリを安全に取得
pub fn get_object_entry(doc: &Automerge, parent: &ObjId, key: &str) -> Option<(automerge::Value, automerge::ObjId)> {
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