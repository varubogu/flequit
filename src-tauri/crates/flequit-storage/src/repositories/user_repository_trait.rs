use async_trait::async_trait;
use flequit_model::{models::user::User, types::id_types::UserId};
use crate::repositories::base_repository_trait::Repository;

/// 統合ユーザーリポジトリトレイト
///
/// Service層はこのトレイトを直接使用し、内部でSQLiteとAutomergeを統合的に処理する。
/// - SQLite: 高速検索とクエリ処理
/// - Automerge: データ永続化と履歴管理
///
/// # 設計思想
///
/// Repository<User>から基本CRUD操作を継承し、
/// ドメイン固有のメソッドのみを追加する最小限の設計。
/// 複雑な検索・集計処理はService層で基本CRUDを組み合わせて実装。
#[async_trait]
pub trait UserRepositoryTrait: Repository<User, UserId> + Send + Sync {}
