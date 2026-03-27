#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_app_info,
      check_for_updates
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn get_app_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "name": "Aevon",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Professional novel planning and writing platform",
        "author": "Enzonic LLC",
        "website": "https://aevon.ink"
    }))
}

#[tauri::command]
async fn check_for_updates() -> Result<serde_json::Value, String> {
    // Simulate update check
    Ok(serde_json::json!({
        "has_updates": false,
        "current_version": env!("CARGO_PKG_VERSION"),
        "latest_version": env!("CARGO_PKG_VERSION"),
        "update_url": "https://aevon.ink"
    }))
}
