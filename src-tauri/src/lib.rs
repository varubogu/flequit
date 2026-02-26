// Module declarations
mod commands;
pub mod logger;
pub mod models;
pub mod state;

// Re-export from flequit-core
pub use flequit_core::*;

use commands::*;
use specta_typescript::Typescript;
use tauri_specta::collect_commands;

use crate::models::account::AccountCommandModel;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ensure directories are created at startup
    tauri::async_runtime::block_on(async {
        let app_state = crate::state::AppState::new()
            .await
            .expect("Failed to create app state");

        tauri::Builder::default()
            .manage(app_state)
            .plugin(tauri_plugin_opener::init())
            .invoke_handler(crate::generate_app_handler!())
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}

pub fn tauri_specta_output() {
    let builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            // TODO: コマンドを追加するには各コマンドに#[specta::specta]属性が必要
            // 現在はフロントエンド側でinvoke()を直接使用する方式で対応
        ])
        .typ::<AccountCommandModel>();

    #[cfg(debug_assertions)]
    builder
        .export(Typescript::default(), "../src/lib/types/bindings.ts")
        .expect("Failed to export typescript bindings");
}
