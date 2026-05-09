# Web API 設計書

Flequit の Web バックエンド (将来実装) の API 設計。現状は Tauri バックエンドが主で、本書は将来 Web 同期を実装する際の指針。

## 1. 基本設計

| 項目 | 内容 |
| --- | --- |
| 形式 | RESTful API |
| 通信 | JSON |
| プロトコル | HTTPS |
| 認証 | Bearer (JWT) |
| ベース URL | `https://api.flequit.com` |
| バージョニング | パスプレフィックス `/v1` |
| リソースパス | `/{resource}` |

### リクエストヘッダー

- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `Accept-Language: ja-JP` 等

### レスポンスフォーマット (共通)

`status` (`success` / `error`) + `data` (成功時) + `error` (`code` + `message`) の構造。

## 2. 認証 API

| エンドポイント | 説明 | 主リクエスト | 主レスポンス |
| --- | --- | --- | --- |
| `POST /v1/auth/login` | ログイン | `email`, `password` | `access_token`, `refresh_token`, `expires_in` |
| `POST /v1/auth/refresh` | トークン更新 | `refresh_token` | `access_token`, `expires_in` |

## 3. 同期 API

| エンドポイント | 説明 | 主リクエスト | 主レスポンス |
| --- | --- | --- | --- |
| `POST /v1/sync/tasks` | タスク同期 (差分送受信) | `last_sync_timestamp`, `changes[{ id, type, timestamp, data }]` (type は create/update/delete) | `sync_timestamp`, `changes[]`, `conflicts[{ id, server_version, client_version }]` |
| `GET /v1/sync/status` | 同期状態確認 | - | `last_sync_timestamp`, `pending_changes` |

## 4. エラー処理

### エラーコード体系

| カテゴリ | コード | 内容 |
| --- | --- | --- |
| 認証 | `AUTH_001` | 認証情報が無効 |
| 認証 | `AUTH_002` | トークンの有効期限切れ |
| 同期 | `SYNC_001` | 同期の競合 |
| 同期 | `SYNC_002` | 無効なタイムスタンプ |
| 一般 | `GENERAL_001` | サーバーエラー |
| 一般 | `GENERAL_002` | 無効なリクエスト |

### エラーレスポンス

`status: "error"` + `error: { code, message, details? }` の構造。

## 5. セキュリティ

### 認証・認可

- JWT ベース
- アクセストークン有効期限: **1 時間**
- リフレッシュトークン有効期限: **30 日**

### 不正アクセス対策

- リクエスト元 IP アドレスの監視
- 異常なリクエストパターンの検出
- アカウントロックアウト (ログイン試行回数制限 + 一時的ロック)

## 6. パフォーマンス最適化

### データ圧縮

- gzip 圧縮の利用
- 大規模データの分割送信
- バッチ処理の最適化

### キャッシュ戦略

- ETag の利用
- 条件付きリクエスト
- キャッシュヘッダーの適切な設定

## 7. API ドキュメント

### OpenAPI 仕様

- OpenAPI 3.0 形式
- SwaggerUI による対話的ドキュメント
- 全エンドポイントの完全な定義 + リクエスト/レスポンスの例示

### 開発者ポータル

- API リファレンス
- 認証ガイド
- サンプルコード
- トラブルシューティング

## 8. 変更管理

### バージョニング方針 (Semantic Versioning)

- **メジャー**: 互換性のない変更
- **マイナー**: 後方互換性のある機能追加
- **パッチ**: バグ修正

### 非推奨化プロセス

- 非推奨の告知期間: **6 ヶ月**
- 移行ガイドの提供
- 旧バージョンのサポート期間を明記
