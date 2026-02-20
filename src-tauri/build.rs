fn main() {
    // build.rsの副作用でウォッチ再起動ループに入るのを避ける。
    // テストDBの再生成は明示コマンドで実行する。
    tauri_build::build()
}
