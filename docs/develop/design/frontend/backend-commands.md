# フロントエンド側のバックエンドコマンド実装

servicesの中でもデータ保存・読み込みなど外部とやり取りが発生するものはservices/backendとして定義します。

## services/backend

- 主にinterfaceを配置し、serviceから呼ばれることを想定する。他からはtauriなのかwebなのかを意識せず使えることが重要である。
- 取り扱うデータ構造ごとに1ファイルとし、それらを総括したBackendServiceというinterfaceも用意する。
- 別ファイルでBackendServiceを実装した具体的なオブジェクトを取得する関数も定義する。
- バックエンド（tauri,web）でデータ取得（同期）時はその部分について表示更新が必要なため、どこの値が更新されたかをtauri/web→フロントエンドへ通知する仕組みを作る

## services/backend/tauri, services/backend/web

- 具体的な処理を実装する。tauriの場合はtauriのコマンドとやりとりし、webの場合はwebサーバーとWebAPIでやり取りを行う。
- 今回はtauriのみ実装し、webは後で実装する。

## 共通事項

- 取り扱うデータ構造はproject,tasklist,task,subtask,tag,setting,accountとする。
- それらのinterfaceとtauri/webの実装を用意する。

### 必要な関数について

- CRUD操作が行えるようにする。
  - 新規作成->オブジェクトを引数、結果はbool（登録成功・失敗）、命名規則はcreateProjectなどとする。
  - 更新->オブジェクトを引数、結果はbool（更新成功・失敗）、命名規則はupdateProjectなどとする。
  - 削除->キー項目であるIDを引数、結果はbool（削除成功・失敗）、命名規則はdeleteProjectなどとする。
  - 検索（1件）->項目であるIDを引数、結果は検索結果の１つのオブジェクト、命名規則はgetProjectなどとする。
  - 検索（複数件）->検索条件用のオブジェクトを引数、結果は検索結果のオブジェクトリスト、命名規則はsearchProjectsなどとする。


※project,tasklist,task,subtask,tagは1件検索と複数件検索の両方を用意し、setting,accountは1件検索のみ用意する

## 型について

型については精査が必要です。
親から子はリスト構造・オブジェクト構造により不要ですが、子から親はIDを持つ必要があります。親が複数存在する場合は１つ上の親のIDのみを保持します。
例えばproject->tasklist->task->subtaskというデータ構造がありますが、taskはtasklistのidを持ち、projectとsubtaskのidは持ちません。

## 順番について

1. 型定義の修正
2. services/backendに定義するインターフェースを定義
3. services/backend/tauri, services/backend/webを実装する（ただしwebは関数群などの表面だけを整備し、内部処理はペンディングのままとする）

## 気をつけること

- services/_backend/配下には既存の実装があります。使えるものはリファクタリングして使ってください。

- services/_backend以下の階層については既存コードの参照チェックは不要で、消したり上書きしても構いません。
  これは新しい方式に対応するためであり、services直下以外からservices/backend以下の階層が使われていたらそのコードは間違いであるためです。
- tauri側で参照されているものがある場合でも無視して改修を進めてください。後でtauriの方を最新仕様に合わせます。
