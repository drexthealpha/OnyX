use tauri::Manager;

#[tauri::command]
fn get_nerve_port() -> String {
    std::env::var("NERVE_PORT").unwrap_or_else(|_| "3001".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_title("ONYX — Sovereign AI OS").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_nerve_port])
        .run(tauri::generate_context!())
        .expect("error while running ONYX desktop app");
}
