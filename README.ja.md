# Flequit

[English](./README.md) | 日本語

※本プロジェクトは誠意開発中です。

## 概要

- 柔軟なオプションを持つタスク管理アプリ
- あらゆるパターンを網羅する繰り返しオプション
- タスク単位で保存先を柔軟に設定可能（ローカルファイル、クラウドストレージ、WebAPI、自分用のサーバー、公式サーバー）
- 求めるパフォーマンスに応じて複数段階の暗号化設定をサポート（暗号化無し、暗号化する項目の選択や、データのみの暗号化、構造を含めた全体暗号化）
- OS、デバイス、CLIやGUIを問わず、あらゆる場所で動作
- イベントフックを使い、別な処理を実行可能
- 洗練された技術スタックで構成されており、高速に動作
- i18n対応

## 対応プラットフォーム

- Web
- Windows
- macOS
- Linux
- iOS
- Android
- VS Code拡張機能
- JetBrains IDE拡張機能

## 主な機能

### タスク管理

#### タスクのレベル

タスクは以下のレベルで管理できます

1. プロジェクト
2. リスト
3. タスク
4. サブタスク

#### タスクの情報

タスクごとに以下の情報を持ちます

- タスクの状態
- 開始日時
- 終了日時
- 柔軟な繰り返しオプション
- 任意の数のリマインダー
- 期限
- タスクリスト内でのタスクの順序付け
- markdownベースのノート
- 習慣オプション
- 完了時の気分（完璧/良い/普通/悪い/最悪）
- 完了時のコメント
- 保存先（ローカルファイル、クラウドストレージ、WebAPI、任意のサーバー、公式サーバー）を複数個指定可能

#### 過去のタスクの履歴と分析

- 過去のタスクの履歴をファイル容量の許す限り保持します
- 過去のタスクのデータを分析できます。

#### タスクの状態

- 未着手
- 進行中
- 待機中（誰かを待っている）
- 完了
- 中止

#### 繰り返し設定

- [XX]分
- [XX]時間
- [XX]日
- [XX]週
- [XX]月
- [XX]年
- [XX]週目の[XX]日
- [XX]週目の[XX]曜日
- [XX]月の[XX]日
- [XX]月の[XX]曜日
- 毎月[XX]週目の第[XX]曜日から[XX]日後
- 毎月[XX]週目の第[XX]曜日から[XX]日後以降の[XX]曜日
- 毎月[XX]日以降の[平日/休日/祝日/X曜日]
- 毎月[XX]日、ただしそれが[平日/休日/祝日/X曜日]の場合は[前/後]の[XX]曜日

### ストレージオプション

1. ローカルファイル（Excel、SQLite、CSV、JSON、YAML、TOML）
2. ローカルファイル＋クラウドストレージ（Dropbox、GoogleDrive、OneDrive、iCloud、pCloud）
3. Git（GitHub,GitLab,Bitbucketなど）
4. Googleスプレッドシート、Notionなど任意のデータソースAPI
5. 他のタスク管理アプリ・サービスと同期（Microsoft ToDo、Google Todoリスト、Appleリマインダー、GitHub Project）

### UIカスタマイズ

#### テーマ設定

- テーマ切り替え（ライトテーマ、ダークテーマ、カスタムテーマ）
- 背景色
- フォントカラー
- フォントサイズ
- フォントの太さ
- アニメーション（通常、高速、なし）

#### カスタムテーマ

カスタムテーマの公開できるサイトを将来的に作ろうと予定してます。

### イベントフックを利用した自動化

- タスクの追加、変更、削除、完了、中止時に別な処理を実行可能

## 利用方法

### OSストアでクライアントをインストール

- Microsoft Store（Windows）
  - <https://apps.microsoft.com/store/detail/XXXXXXXXXXXXX>
- App Store（macOS、iOS）
  - <https://apps.apple.com/app/XXXXXXXXXXXXX>
- Google Play Store（Android）
  - <https://play.google.com/store/apps/details?id=XXXXXXXXXXXXX>

### パッケージマネージャーでクライアントをインストール

- winget（Windows）

```sh
winget install -e --id FlexibleToDo.FlexibleToDo
```

- brew（macOS、Linux）

```sh
brew install FlexibleToDo.FlexibleToDo
```

- Snap Store（Linux）

```sh
snap install FlexibleToDo.FlexibleToDo
```

- apt（Debian/Ubuntu）

```sh
apt install FlexibleToDo.FlexibleToDo
```

### 拡張機能をインストール

- chromium系ブラウザ
  - <https://chromewebstore.google.com/detail/XXXXXXXXXXXXX>
- Firefox
  - <https://addons.mozilla.org/ja/firefox/addon/XXXXXXXXXXXXX>
- Safari
  - <https://apps.apple.com/app/XXXXXXXXXXXXX>
- VS Code
  - <https://marketplace.visualstudio.com/items?itemName=XXXXXXXXXXXXX>
- JetBrains IDE
  - <https://plugins.jetbrains.com/plugin/XXXXXXXXXXXXX>

## インストールせずオンプレミス版・クラウド版を利用する

※将来開発予定の機能です。

### 開発者の提供するクラウド環境を利用する

- ホスティング先としてCloudflare Pages/Workersを利用しています。
- <https://filetodo-cloud.varubogu.app>

### 自分でホスティングする

- SvelteKitベースのサイトとしても動作予定。
- ホスティング先としてVercelなどにデプロイ可能な他、Dockerコンテナーとして動作させることも可能。

## 予定中の機能・アイディア

- 現時点ではWebフロントエンド部分はSvelteKitだが、Qwikができたら理想かなと思ってる。
  - ただし現時点でカレンダーなどのUIライブラリが不足しているので、それらが解決してからQwikでの動作も予定しています。
- あわよくばv0とかで生成できないかなとも思ってる（画面デザインをnext.jsコード化するのはしてくれた）
- Voiceroidなどの音声合成ソフトを利用して、タスクのメモを読み上げる
- AIと連携して次に何をするか提案（ついでにボイスありにも対応）
- オンライン機能を制限したバイナリの配布、またビルド設定切り替えでそれを実現
  - あるいはオプションが管理者のみ変更できるような設計にするか？
- 各種会話サービス（Alexa、Google Assistant、Siri）と連携
- ウェアラブルデバイスと連携（Apple Watch、Pixel Watchなど）
- ポモドーロタイマーもつけたい
- 将来的にはカレンダーの予定管理も含めて統合的な提供ができればいいなぁ

## ロードマップ

下記を参照

- [ロードマップ](./docs/loadmap.md)

## 余談

Flequitという名称は、柔軟性（<span style="color: red">Fle</span>xible）、高速性（<span style="color: red">Qui</span>ck）、を兼ね備えたタスク管理アプリ（<span style="color: red">To</span>do）で早く仕事を終わらせる（<span style="color: red">Quit</span>）の略称を用いた造語です。
