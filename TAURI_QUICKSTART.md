# Tauri 迁移快速开始

## 📁 已创建的文件

所有 Tauri 迁移所需的文件已创建在项目根目录：

### 前端文件
- `tauri-main.js` - 适配 Tauri API 的前端代码（从 renderer.js 转换）

### Rust 后端文件
- `src-tauri-main.rs` - Rust 后端主文件（从 main.js 转换）

### 配置文件
- `tauri-Cargo.toml` - Rust 依赖配置
- `tauri.conf.json` - Tauri 应用配置
- `tauri-package.json` - 前端依赖配置

### 文档
- `TAURI_MIGRATION.md` - 详细迁移指南

## 🚀 使用步骤（Mac 开发 → Windows 打包）

### 1. 在 Mac 上安装 Rust

```bash
# macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 或访问 https://rustup.rs/
# 安装完成后重启终端或运行：
source $HOME/.cargo/env
```

### 2. 安装 Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

### 3. 创建 Tauri 项目

```bash
# 在项目根目录运行
npm create tauri-app@latest tauri-version

# 选择：
# - 前端框架: Vanilla (HTML/CSS/JS)
# - 包管理器: npm
```

### 4. 复制文件到新项目

```bash
# Mac 命令
cp index.html tauri-version/src/
cp styles.css tauri-version/src/
cp tauri-main.js tauri-version/src/main.js

# 复制 Rust 后端
cp src-tauri-main.rs tauri-version/src-tauri/src/main.rs

# 复制配置文件
cp tauri-Cargo.toml tauri-version/src-tauri/Cargo.toml
cp tauri.conf.json tauri-version/src-tauri/tauri.conf.json
cp tauri-package.json tauri-version/package.json
```

### 5. 安装依赖

```bash
cd tauri-version
npm install
```

### 6. 修改 index.html

在 `tauri-version/src/index.html` 中，将脚本引用改为：

```html
<script type="module" src="main.js"></script>
```

### 7. 在 Mac 上运行开发版本（测试）

```bash
npm run tauri dev
```

这会运行 macOS 版本，用于开发测试。

### 8. 打包 Windows 版本

**重要**: Tauri 交叉编译到 Windows 比较复杂，推荐以下方案：

#### 方案 A: 使用 GitHub Actions（推荐）⭐

创建 `.github/workflows/build-windows.yml`:

```yaml
name: Build Windows

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Install dependencies
        run: npm install
      - name: Build Tauri app
        run: npm run tauri build -- --target x86_64-pc-windows-msvc
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/
```

#### 方案 B: 使用 Windows 虚拟机

1. 在 Mac 上安装 Parallels Desktop 或 VMware Fusion
2. 安装 Windows 11 虚拟机
3. 在虚拟机中安装 Rust 和 Node.js
4. 在虚拟机中运行 `npm run tauri build`

#### 方案 C: 使用交叉编译（复杂，不推荐）

```bash
# 安装 Windows 目标
rustup target add x86_64-pc-windows-msvc

# 安装 Windows 链接器（需要 Wine 或 Windows SDK）
# 然后尝试构建（可能遇到问题）
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**推荐使用方案 A（GitHub Actions）**，自动化且可靠。

打包后的 Windows 文件在 `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/` 目录。

## ⚠️ 注意事项

### Mac 开发 Windows 打包的特殊说明

1. **开发环境**: 在 Mac 上可以正常开发 macOS 版本进行测试
2. **Windows 打包**: 推荐使用 GitHub Actions 或 Windows 虚拟机
3. **图标文件**: 需要准备 Windows 图标（.ico 格式）

### 全局快捷键

Tauri 1.x 的全局快捷键需要使用插件。您需要：

1. 安装全局快捷键插件：
```bash
cd src-tauri
cargo add global-hotkey
```

2. 在 `main.rs` 中添加全局快捷键注册代码（参考 `src-tauri-main.rs` 中的注释）

### 系统托盘

Tauri 1.x 的系统托盘需要使用 `tray-icon` feature（已在 Cargo.toml 中启用）。

如果需要更高级的托盘功能，可以考虑使用 `tauri-plugin-tray`。

### 图标文件

需要准备图标文件并放在 `src-tauri/icons/` 目录：
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS - 开发用)
- `icon.ico` (Windows - 打包用)

**Mac 上转换图标**:
```bash
# 使用 sips 转换 PNG 到 ICO（需要安装 ImageMagick 或在线工具）
# 或使用在线工具：https://convertio.co/png-ico/
```

可以使用现有的 `assets/icon.png` 转换。

## 📊 预期效果

- **体积**: 5-15MB（相比 Electron 的 120-150MB 减少 90%+）
- **启动时间**: < 1秒（相比 Electron 的 3秒）
- **内存占用**: 10-20MB（相比 Electron 的 50MB）

## 🔧 故障排除

### Mac 开发相关问题

**问题**: 在 Mac 上无法直接打包 Windows 版本
- **解决**: 使用 GitHub Actions 或 Windows 虚拟机

**问题**: 交叉编译失败
- **解决**: 不推荐交叉编译，使用原生 Windows 环境构建

### Rust 编译错误

如果遇到编译错误，检查：
1. Rust 版本是否 >= 1.70
2. 所有依赖是否正确安装
3. Cargo.toml 配置是否正确

### 前端错误

如果前端报错，检查：
1. `@tauri-apps/api` 是否正确安装
2. 导入路径是否正确
3. 浏览器控制台的错误信息

### 窗口不显示

检查：
1. `tauri.conf.json` 中的窗口配置
2. Rust 代码中的窗口创建逻辑
3. 是否有权限问题

### Windows 打包问题

**问题**: GitHub Actions 构建失败
- **解决**: 检查 workflow 文件配置，确保路径正确

**问题**: 虚拟机中构建慢
- **解决**: 这是正常的，Windows 构建需要下载工具链，首次较慢

## 📚 更多资源

- [Tauri 官方文档](https://tauri.app/)
- [Tauri API 参考](https://tauri.app/api/)
- [Rust 官方文档](https://doc.rust-lang.org/)

