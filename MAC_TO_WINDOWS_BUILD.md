# Mac 开发 Windows 打包指南

## 📋 概述

本指南专门针对在 Mac 上开发，但需要打包 Windows 版本的情况。

## 🎯 推荐方案

### 方案 1: GitHub Actions（最推荐）⭐

**优点**:
- ✅ 完全自动化
- ✅ 无需本地 Windows 环境
- ✅ 每次推送代码自动构建
- ✅ 免费（公开仓库）

**步骤**:

1. **创建 GitHub 仓库**（如果还没有）
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/desktop-countdown-timer.git
   git push -u origin main
   ```

2. **使用已创建的 workflow 文件**
   - 文件已创建：`.github/workflows/build-windows.yml`
   - 推送到 GitHub 后会自动触发构建

3. **下载构建结果**
   - 在 GitHub Actions 页面
   - 点击最新的构建任务
   - 在 "Artifacts" 部分下载 Windows 安装包

### 方案 2: Windows 虚拟机

**优点**:
- ✅ 可以本地测试 Windows 版本
- ✅ 构建速度快
- ✅ 可以调试 Windows 特定问题

**缺点**:
- ❌ 需要购买虚拟机软件（Parallels Desktop 或 VMware Fusion）
- ❌ 需要 Windows 许可证
- ❌ 占用磁盘空间

**步骤**:

1. **安装虚拟机软件**
   - Parallels Desktop（推荐，性能好）
   - VMware Fusion（免费版可用）

2. **安装 Windows 11**
   - 下载 Windows 11 ISO
   - 在虚拟机中安装

3. **在虚拟机中设置开发环境**
   ```powershell
   # 安装 Node.js
   # 下载并安装：https://nodejs.org/
   
   # 安装 Rust
   Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
   .\rustup-init.exe
   
   # 安装 Tauri CLI
   npm install -g @tauri-apps/cli
   ```

4. **构建应用**
   ```powershell
   cd tauri-version
   npm install
   npm run tauri build
   ```

### 方案 3: 使用 Windows 云服务器

**优点**:
- ✅ 无需本地虚拟机
- ✅ 按需使用

**缺点**:
- ❌ 需要付费
- ❌ 需要配置服务器

**推荐服务**:
- AWS EC2
- Azure Virtual Machines
- DigitalOcean Droplets

## 🔧 开发工作流

### 在 Mac 上开发

1. **日常开发**（Mac 版本）
   ```bash
   cd tauri-version
   npm run tauri dev
   ```
   这样可以快速测试功能

2. **提交代码**
   ```bash
   git add .
   git commit -m "功能更新"
   git push
   ```

3. **自动构建**
   - GitHub Actions 自动构建 Windows 版本
   - 在 Actions 页面下载构建结果

### 测试 Windows 版本

**选项 1**: 使用虚拟机测试
- 在 Windows 虚拟机中运行构建好的应用

**选项 2**: 使用 GitHub Actions 构建后下载测试
- 下载构建的 .exe 文件
- 在虚拟机或真实 Windows 机器上测试

## 📦 构建配置

### GitHub Actions 配置

已创建的 `.github/workflows/build-windows.yml` 包含：

- ✅ 自动检测代码推送
- ✅ 安装 Node.js 和 Rust
- ✅ 构建 Windows 版本
- ✅ 上传构建产物

### 自定义构建

如果需要修改构建配置，编辑 `tauri-version/src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "targets": "nsis",  // 只构建安装版
      // 或
      "targets": "all"    // 构建所有格式
    }
  }
}
```

## 🐛 常见问题

### Q: GitHub Actions 构建失败？

**A**: 检查：
1. workflow 文件路径是否正确
2. `tauri-version` 目录是否存在
3. 所有依赖是否正确安装
4. 查看 Actions 日志中的错误信息

### Q: 如何在 Mac 上测试 Windows 版本？

**A**: 
1. 使用 Windows 虚拟机
2. 或使用 Wine（不推荐，兼容性问题多）

### Q: 构建速度慢？

**A**: 
- 首次构建需要下载 Rust 工具链，较慢
- 后续构建会使用缓存，较快
- GitHub Actions 通常 5-10 分钟完成

### Q: 可以同时构建 macOS 和 Windows 吗？

**A**: 可以！修改 workflow 文件，添加 macOS 构建任务：

```yaml
build-macos:
  runs-on: macos-latest
  steps:
    # ... 类似配置
```

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri 构建文档](https://tauri.app/v1/guides/building/)
- [Rust 交叉编译](https://rust-lang.github.io/rustup/cross-compilation.html)

## 💡 最佳实践

1. **开发**: 在 Mac 上使用 `tauri dev` 快速迭代
2. **构建**: 使用 GitHub Actions 自动构建 Windows 版本
3. **测试**: 在 Windows 虚拟机中测试最终版本
4. **发布**: 从 GitHub Actions 下载构建产物分发

这样可以最大化开发效率，同时确保 Windows 版本的可靠性。


