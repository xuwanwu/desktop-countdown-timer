# 📦 打包版本说明

本文档专门说明如何将应用打包成独立的 `.exe` 安装文件。

---

## 🎯 打包目标

将应用打包成：
- **单个.exe安装文件**
- **用户无需安装Node.js**
- **双击即可安装使用**
- **大小约60MB**

---

## ⚡ 超快速打包（3步）

### 1️⃣ 安装依赖（首次）

```bash
# 双击运行
install.bat

# 或命令行
npm install
```

⏱️ **耗时：** 3-5分钟

### 2️⃣ 准备图标（可选）

```bash
# 双击打开
创建简单图标.html

# 下载生成的图标
# 放到 assets 文件夹
```

⏱️ **耗时：** 2分钟

💡 **提示：** 没图标也能打包，会用默认图标

### 3️⃣ 开始打包

```bash
# 双击运行
package.bat

# 选择选项：1（安装版）
```

⏱️ **耗时：** 首次10分钟，后续3-5分钟

🎉 **完成！** 在 `dist` 文件夹找到安装文件

---

## 📦 打包输出

### 安装版（推荐）

```
dist/倒计时小组件-1.0.0-Setup.exe
```

- **大小：** ~60MB
- **特点：** 自动安装、创建快捷方式、支持卸载
- **适合：** 分发给用户长期使用

### 便携版

```
dist/倒计时小组件-1.0.0-Portable.exe
```

- **大小：** ~120MB
- **特点：** 免安装、双击运行、可放U盘
- **适合：** 临时使用、演讲现场

---

## 🚀 命令速查

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run build` | 打包安装版 |
| `npm run build:portable` | 打包便携版 |
| `npm run build:all` | 打包全部 |
| `npm start` | 开发测试 |

---

## 📋 打包配置

所有配置在 `package.json` 的 `build` 部分：

```json
{
  "build": {
    "appId": "com.countdown.timer",
    "productName": "倒计时小组件",
    "win": {
      "target": ["nsis"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "language": "2052"
    }
  }
}
```

### 关键配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `productName` | 显示名称 | 倒计时小组件 |
| `oneClick` | 一键安装 | false（可自定义） |
| `createDesktopShortcut` | 桌面快捷方式 | true |
| `language` | 安装界面语言 | 2052（简体中文） |

---

## 🎨 自定义图标

### 方式1：使用工具生成

1. 双击 `创建简单图标.html`
2. 选择预设或自定义
3. 下载 `icon.png`
4. 放入 `assets` 文件夹

### 方式2：使用现有图片

1. 准备PNG图片（256x256或512x512）
2. 重命名为 `icon.png`
3. 放入 `assets` 文件夹

### 方式3：在线工具

- https://icon.kitchen/
- https://www.favicon-generator.org/

---

## ⚙️ 修改应用信息

编辑 `package.json`：

```json
{
  "name": "你的应用名",
  "version": "1.0.0",
  "description": "你的描述",
  "author": "你的名字",
  "build": {
    "productName": "显示名称",
    "copyright": "Copyright © 2025"
  }
}
```

修改后重新打包即可。

---

## 🐛 常见问题

### ❌ 问题1：Cannot find module 'electron'

**解决：**
```bash
npm install
```

### ❌ 问题2：打包很慢

**原因：** 首次需下载Electron（~100MB）

**加速：**
```bash
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

### ❌ 问题3：磁盘空间不足

**需要：**
- 开发：300MB
- 打包输出：100MB
- 临时文件：200MB
- **总计：** 约600MB

### ❌ 问题4：用户安装时警告

**现象：**
```
Windows已保护你的电脑
```

**解决：** 用户点击"更多信息" → "仍要运行"

**原因：** 应用未签名（需要购买证书）

---

## 📊 打包时间

| 阶段 | 首次 | 后续 |
|------|------|------|
| 下载依赖 | 3分钟 | - |
| 下载Electron | 5分钟 | - |
| 编译打包 | 2分钟 | 2分钟 |
| 生成安装程序 | 2分钟 | 2分钟 |
| **总计** | **~10分钟** | **~4分钟** |

---

## 💾 文件大小

| 项目 | 大小 |
|------|------|
| 源代码 | ~100KB |
| node_modules | ~200MB |
| 打包输出（安装版） | ~60MB |
| 打包输出（便携版） | ~120MB |

---

## 🌐 分发方式

### 直接分发

- 通过网盘（推荐）
- 通过即时通讯工具
- 通过邮件

### GitHub Releases

```bash
1. 在GitHub创建Release
2. 上传.exe文件
3. 填写版本说明
4. 发布
```

### 自建下载页面

```html
<a href="倒计时小组件-1.0.0-Setup.exe" download>
  下载安装包
</a>
```

---

## 🔐 代码签名（可选）

如果想消除Windows安全警告：

1. **购买证书**
   - 价格：$100-500/年
   - 推荐：Sectigo, DigiCert

2. **配置签名**
   ```json
   "win": {
     "certificateFile": "cert.pfx",
     "certificatePassword": "密码"
   }
   ```

3. **重新打包**
   - 用户不再看到警告
   - 提高信任度

---

## 📈 版本管理

### 更新版本号

编辑 `package.json`：
```json
{
  "version": "1.0.1"  // 1.0.0 → 1.0.1
}
```

### 版本号规范

```
主版本.次版本.修订号
  ↓      ↓      ↓
 1  .  0  .  0

1.0.0 → 首次发布
1.0.1 → 修复bug
1.1.0 → 新功能
2.0.0 → 重大更新
```

---

## ✅ 打包前检查

- [ ] 所有功能测试正常
- [ ] 已更新版本号
- [ ] 已更新 CHANGELOG.md
- [ ] 已准备图标（可选）
- [ ] 磁盘空间充足（1GB）
- [ ] 网络连接正常

---

## 📞 获取帮助

| 问题类型 | 查看文档 |
|---------|---------|
| 快速上手 | 快速开始.md |
| 详细教程 | 一键打包说明.md |
| 常见错误 | 一键打包说明.md（常见问题） |
| 功能说明 | README.md |

---

## 🎓 延伸阅读

- **Electron官方文档：** https://www.electronjs.org/
- **electron-builder：** https://www.electron.build/
- **NSIS安装器：** https://nsis.sourceforge.io/

---

## 💡 最佳实践

1. **首次打包前测试**
   ```bash
   npm start  # 确保应用运行正常
   ```

2. **版本管理**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **保留历史版本**
   ```
   releases/
   ├── v1.0.0-Setup.exe
   ├── v1.0.1-Setup.exe
   └── v1.1.0-Setup.exe
   ```

4. **提供更新日志**
   - 用户知道更新了什么
   - 记录在 CHANGELOG.md

---

## 🚀 CI/CD 自动打包（高级）

### GitHub Actions 示例

```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: installer
          path: dist/*.exe
```

---

**现在你可以轻松打包和分发应用了！** 🎉

有问题？查看 **一键打包说明.md** 获取详细帮助。



