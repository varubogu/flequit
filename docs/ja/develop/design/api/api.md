# API設計書

## 1. 基本設計

### 1.1 API概要

- RESTful API
- JSONベースの通信
- HTTPSによる暗号化
- Bearer認証

### 1.2 エンドポイント構造

- ベースURL: `https://api.flequit.com`
- バージョニング: `/v1`
- リソースパス: `/{resource}`
- 例：`https://api.flequit.com/v1/auth/login`

### 1.3 共通仕様

- リクエストヘッダー
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
  - `Accept-Language: ja-JP`
- レスポンスフォーマット

  ```json
  {
    "status": "success|error",
    "data": {},
    "error": {
      "code": "ERROR_CODE",
      "message": "エラーメッセージ"
    }
  }
  ```

## 2. 認証API

### 2.1 ユーザー認証

```shell
POST /v1/auth/login
```

- リクエスト

  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

- レスポンス

  ```json
  {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": "number"
  }
  ```

### 2.2 トークン更新

```shell
POST /v1/auth/refresh
```

- リクエスト

  ```json
  {
    "refresh_token": "string"
  }
  ```

- レスポンス

  ```json
  {
    "access_token": "string",
    "expires_in": "number"
  }
  ```

## 3. 同期API

### 3.1 タスク同期

```shell
POST /v1/sync/tasks
```

- リクエスト

  ```json
  {
    "last_sync_timestamp": "string",
    "changes": [
      {
        "id": "string",
        "type": "create|update|delete",
        "timestamp": "string",
        "data": {}
      }
    ]
  }
  ```

- レスポンス

  ```json
  {
    "sync_timestamp": "string",
    "changes": [
      {
        "id": "string",
        "type": "create|update|delete",
        "timestamp": "string",
        "data": {}
      }
    ],
    "conflicts": [
      {
        "id": "string",
        "server_version": {},
        "client_version": {}
      }
    ]
  }
  ```

### 3.2 同期状態確認

```shell
GET /v1/sync/status
```

- レスポンス

  ```json
  {
    "last_sync_timestamp": "string",
    "pending_changes": "number"
  }
  ```

## 4. エラー処理

### 4.1 エラーコード

- 認証エラー
  - `AUTH_001`: 認証情報が無効
  - `AUTH_002`: トークンの有効期限切れ
- 同期エラー
  - `SYNC_001`: 同期の競合
  - `SYNC_002`: 無効なタイムスタンプ
- 一般エラー
  - `GENERAL_001`: サーバーエラー
  - `GENERAL_002`: 無効なリクエスト

### 4.2 エラーレスポンス

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーの詳細メッセージ",
    "details": {}
  }
}
```

## 5. セキュリティ

### 5.1 認証・認可

- JWTベースの認証
- アクセストークンの有効期限: 1時間
- リフレッシュトークンの有効期限: 30日

### 5.2 不正アクセス対策

- リクエスト元IPアドレスの監視
- 異常なリクエストパターンの検出
- アカウントロックアウト
  - ログイン試行回数制限
  - 一時的なアカウントロック

## 6. パフォーマンス最適化

### 6.1 データ圧縮

- gzip圧縮の利用
- 大規模データの分割送信
- バッチ処理の最適化

### 6.2 キャッシュ戦略

- ETAGの利用
- 条件付きリクエスト
- キャッシュヘッダーの適切な設定

## 7. APIドキュメント

### 7.1 OpenAPI仕様

- OpenAPI 3.0形式
- SwaggerUIによる対話的ドキュメント
- APIエンドポイントの完全な定義
- リクエスト/レスポンスの例示

### 7.2 開発者ポータル

- APIリファレンス
- 認証ガイド
- サンプルコード
- トラブルシューティング

## 8. 変更管理

### 8.1 バージョニング方針

- メジャーバージョン: 互換性のない変更
- マイナーバージョン: 後方互換性のある機能追加
- パッチバージョン: バグ修正

### 8.2 非推奨化プロセス

- 非推奨の告知期間: 6か月
- 移行ガイドの提供
- 旧バージョンのサポート期間
