use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
//use super::super::main::g_app;

pub fn msg_box(msg: String) {
    println!("from JS:{}", "Error in the formula");


    
    /*  let parent_window = tauri::Manager::get_window(&window, "main").unwrap();
            let label = parent_window.label();
            let parent_window1 = parent_window.get_window(label).unwrap();
            tauri::async_runtime::spawn(async move {
                message(Some(&parent_window1), "Title", "Error in the formula");
            });
    */
   /*  let answer = app.dialog()
        .message(msg)
        .title("Info")
        .buttons(MessageDialogButtons::OkCancelCustom("Ok".to_string(), "Cancel".to_string()))
        .blocking_show();
    */

 /*    let answer = tauri::App.dialog()
        .message("You have an error in a formula")
        .title("Warning")
        .buttons(MessageDialogButtons::Ok())
        .blocking_show();
*/
}
