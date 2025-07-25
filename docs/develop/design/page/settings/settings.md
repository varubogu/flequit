# 設定

- 設定画面はモーダルウインドウとして表示する。
- 画面左上に「戻る」ボタンを配置する。
- 画面左のサイドメニューに設定カテゴリ、画面右にはすべての設定項目を表示する。
- サイドメニューに検索ボックスを用意し、設定項目を検索できるようにする。
- サイドメニューを選択した時、右側の設定項目をその位置までスクロールする。

## 設定項目

- 基本設定
  - 曜日開始日（コンボボックス、選択肢は「日曜日」「月曜日」、デフォルトは「日曜日」）
  - 期限ボタングループの表示有無（いずれもON/OFF、デフォルトは今日、明日、今週がON、それ以外はOFF）
    - 期限切れ
    - 今日
    - 明日
    - 3日
    - 今週
    - 今月
    - 今期
    - 今年
    - 今年度
  - 期限ボタングループ追加（ボタン、任意の日数を入力して「n日以内」項目を追加できる。）
  - 繰り返し設定のカスタム項目追加
- 外観設定
  - テーマ（コンボボックス、選択肢は「デフォルト」「ダーク」「ライト」、デフォルトは「デフォルト」）
    - 将来的に独自のテーマも適用可能にする予定
    - 条件つきテーマも採用予定。期日のものは目立つよう赤文字にするなどの設定を追加予定
  - フォント（コンボボックス、選択肢は「デフォルト」その他インストールされているフォントを列挙する、デフォルトは「デフォルト」）
  - フォントサイズ（数字テキストボックス、デフォルトは「13」）
  - フォントカラー（コンボボックス、選択肢は「デフォルト」「黒」「白」、デフォルトは「デフォルト」）
  - 背景色（コンボボックス、選択肢は「デフォルト」「白」「黒」、デフォルトは「デフォルト」）
- アカウント設定
  - アカウント選択（コンボボックス、選択するとそのアカウント固有の設定が反映される）
    - 選択肢は「ローカルアカウント」を先頭、以降はログインしたアカウントを選択肢として表示される
- アカウント固有の設定（ローカルアカウントを設定した場合、すべての項目を空欄・非活性とする）
  - 組織アイコン（表示のみで変更不可）
  - 組織名（表示のみで変更不可）
  - アカウントアイコン（ファイルアップロードボタン）
  - アカウント名（テキストボックス）
  - メールアドレス（テキストボックス）
  - パスワード（パスワード入力テキストボックス）
  - サーバーURL（テキストボックス）
  - ソーシャルログイン
  - タスクテンプレート
  - 営業曜日
  - 営業時間

## タスクテンプレートについて

ユーザーや組織が定義でき、特定のタスクセットを追加できる仕組み
