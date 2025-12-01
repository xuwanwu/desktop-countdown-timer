// Tauri 后端主文件
// 从 Electron main.js 转换而来

use tauri::{Manager, Window, AppHandle};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// 窗口配置常量
const WINDOW_WIDTH: f64 = 250.0;
const WINDOW_HEIGHT: f64 = 110.0;
const MIN_WIDTH: f64 = 200.0;
const MAX_WIDTH: f64 = 375.0;
const MIN_HEIGHT: f64 = 88.0;
const MAX_HEIGHT: f64 = 1000.0;
const SNAP_DISTANCE: f64 = 50.0;

// 快捷键配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ShortcutConfig {
    toggle: String,
    reset: String,
    preset3: String,
    preset4: String,
    preset6: String,
}

impl Default for ShortcutConfig {
    fn default() -> Self {
        ShortcutConfig {
            toggle: "Ctrl+Space".to_string(),
            reset: "Ctrl+R".to_string(),
            preset3: "Ctrl+1".to_string(),
            preset4: "Ctrl+2".to_string(),
            preset6: "Ctrl+3".to_string(),
        }
    }
}

// 窗口位置配置
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WindowConfig {
    x: f64,
    y: f64,
}

// 获取配置文件路径
fn get_config_path(app: &AppHandle) -> PathBuf {
    app.path_resolver()
        .app_data_dir()
        .unwrap()
        .join("window-config.json")
}

// 加载窗口配置
fn load_window_config(app: &AppHandle) -> Option<WindowConfig> {
    let config_path = get_config_path(app);
    
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<WindowConfig>(&content) {
                return Some(config);
            }
        }
    }
    None
}

// 保存窗口配置
fn save_window_config(app: &AppHandle, config: &WindowConfig) {
    let config_path = get_config_path(app);
    
    // 确保目录存在
    if let Some(parent) = config_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    
    if let Ok(json) = serde_json::to_string(config) {
        let _ = fs::write(&config_path, json);
    }
}

// 调整窗口高度
#[tauri::command]
fn resize_window(window: Window, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::LogicalSize::new(WINDOW_WIDTH, height))
        .map_err(|e| e.to_string())?;
    Ok(())
}

// 窗口缩放
#[tauri::command]
fn resize_window_scale(window: Window, scale: f64) -> Result<(), String> {
    let new_width = (WINDOW_WIDTH * scale).round();
    let new_height = (WINDOW_HEIGHT * scale).round();
    
    window
        .set_size(tauri::LogicalSize::new(new_width, new_height))
        .map_err(|e| e.to_string())?;
    Ok(())
}

// 窗口移动处理（包含角落吸附）
#[tauri::command]
fn window_moved(window: Window, x: f64, y: f64) -> Result<(), String> {
    // 获取屏幕尺寸
    let monitor = window.current_monitor()
        .map_err(|_| "无法获取显示器信息")?
        .ok_or("无法获取显示器信息")?;
    
    let screen_size = monitor.size();
    let screen_width = screen_size.width as f64;
    let screen_height = screen_size.height as f64;
    
    let window_size = window.outer_size()
        .map_err(|e| e.to_string())?;
    let window_width = window_size.width as f64;
    let window_height = window_size.height as f64;
    
    let mut new_x = x;
    let mut new_y = y;
    
    // 左上角吸附
    if x < SNAP_DISTANCE && y < SNAP_DISTANCE {
        new_x = 0.0;
        new_y = 0.0;
    }
    // 右上角吸附
    else if x > screen_width - window_width - SNAP_DISTANCE && y < SNAP_DISTANCE {
        new_x = screen_width - window_width;
        new_y = 0.0;
    }
    // 左下角吸附
    else if x < SNAP_DISTANCE && y > screen_height - window_height - SNAP_DISTANCE {
        new_x = 0.0;
        new_y = screen_height - window_height;
    }
    // 右下角吸附
    else if x > screen_width - window_width - SNAP_DISTANCE 
         && y > screen_height - window_height - SNAP_DISTANCE {
        new_x = screen_width - window_width;
        new_y = screen_height - window_height;
    }
    
    // 设置新位置
    window
        .set_position(tauri::LogicalPosition::new(new_x, new_y))
        .map_err(|e| e.to_string())?;
    
    // 保存位置
    let app = window.app_handle();
    save_window_config(&app, &WindowConfig { x: new_x, y: new_y });
    
    Ok(())
}

// 更新快捷键配置
#[tauri::command]
fn update_shortcuts(
    app: AppHandle,
    config: ShortcutConfig,
) -> Result<(), String> {
    // 这里需要实现全局快捷键注册
    // 注意：Tauri 1.x 的全局快捷键需要使用插件或外部库
    // 暂时保存配置，实际注册需要在窗口创建时处理
    
    let config_path = app.path_resolver()
        .app_data_dir()
        .unwrap()
        .join("shortcut-config.json");
    
    if let Some(parent) = config_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    
    if let Ok(json) = serde_json::to_string(&config) {
        let _ = fs::write(&config_path, json);
    }
    
    // 发送事件通知前端
    app.emit_all("shortcuts-updated", &config)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 创建主窗口
            let window = tauri::WindowBuilder::new(
                app,
                "main",
                tauri::WindowUrl::App("index.html".into())
            )
            .title("倒计时小组件")
            .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
            .min_inner_size(MIN_WIDTH, MIN_HEIGHT)
            .max_inner_size(MAX_WIDTH, MAX_HEIGHT)
            .decorations(false)  // 无边框
            .transparent(true)    // 透明
            .always_on_top(true)  // 始终置顶
            .skip_taskbar(false)
            .resizable(false)
            .build()
            .map_err(|e| e.to_string())?;
            
            // 加载保存的窗口位置
            if let Some(config) = load_window_config(app) {
                window
                    .set_position(tauri::LogicalPosition::new(config.x, config.y))
                    .ok();
            } else {
                // 默认位置：右上角
                if let Ok(monitor) = window.current_monitor() {
                    if let Some(monitor) = monitor {
                        let screen_size = monitor.size();
                        let screen_width = screen_size.width as f64;
                        let default_x = screen_width - WINDOW_WIDTH - 20.0;
                        let default_y = 20.0;
                        window
                            .set_position(tauri::LogicalPosition::new(default_x, default_y))
                            .ok();
                    }
                }
            }
            
            // 设置窗口可见性（全屏应用上方显示）
            // Tauri 1.x 需要额外配置
            
            // 创建系统托盘
            // 注意：需要启用 tauri-plugin-tray 或使用系统托盘 API
            // 这里提供基础实现示例
            
            // 监听窗口关闭事件（隐藏到托盘而不是退出）
            let app_handle = app.handle().clone();
            window.listen("tauri://close-requested", move |_| {
                let window = app_handle.get_window("main").unwrap();
                window.hide().ok();
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            resize_window,
            resize_window_scale,
            window_moved,
            update_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


