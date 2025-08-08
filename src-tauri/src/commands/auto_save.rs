#[tauri::command]
pub fn auto_save() -> Result<(), String> {
    println!("auto_save called");
    Ok(())
}
