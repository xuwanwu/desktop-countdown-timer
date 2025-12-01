# Tauri 迁移指南

本指南将帮助您将 Electron 应用迁移到 Tauri。

## 前置要求

1. **安装 Rust**: https://rustup.rs/
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **安装 Tauri CLI**:
   ```bash
   npm install -g @tauri-apps/cli
   ```

3. **安装系统依赖** (Windows):
   - Microsoft Visual C++ Build Tools
   - WebView2 (通常已预装)

## 快速开始

### 步骤 1: 创建 Tauri 项目

在项目根目录运行：

```bash
npm create tauri-app@latest tauri-version
```

选择：
- **前端框架**: Vanilla (HTML/CSS/JS)
- **包管理器**: npm
- **UI 模板**: 选择最简单的

### 步骤 2: 复制前端文件

将以下文件复制到 `tauri-version/src/`:
- `index.html` (已适配 Tauri)
- `styles.css`
- `main.js` (已适配 Tauri，从 renderer.js 转换)

### 步骤 3: 安装依赖

```bash
cd tauri-version
npm install
```

### 步骤 4: 配置 Rust 后端

复制 `src-tauri/src/main.rs` 和 `src-tauri/Cargo.toml` 到新项目。

### 步骤 5: 运行开发版本

```bash
npm run tauri dev
```

### 步骤 6: 打包应用

```bash
npm run tauri build
```

打包后的文件在 `src-tauri/target/release/` 目录。

## 文件结构

```
tauri-version/
├── src/                    # 前端代码
│   ├── index.html
│   ├── styles.css
│   └── main.js
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## 主要改动

### 前端 API 变更

- `ipcRenderer.send()` → `invoke()`
- `ipcRenderer.on()` → `listen()`
- `require('electron')` → `import from '@tauri-apps/api'`

### 后端 API 变更

- Node.js → Rust
- Electron API → Tauri API

详细变更请参考迁移后的代码文件。


