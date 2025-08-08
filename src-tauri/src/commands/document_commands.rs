
#[tauri::command]
pub fn get_document_state(
) -> Result<Vec<u8>, String> {
    println!("get_document_state called");
    Ok(vec![])
}

#[tauri::command]
pub fn load_document_state(
    data: Vec<u8>,
) -> Result<(), String> {
    println!("load_document_state called");
    println!("data: {:?}", data);
    Ok(())
}

#[tauri::command]
pub fn merge_document(
    data: Vec<u8>,
) -> Result<(), String> {
    println!("merge_document called");
    println!("data: {:?}", data);
    Ok(())
}
