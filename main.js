const { app, BrowserWindow, Tray, Menu, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');

const fs = require('fs');

let mainWindow;
let tray;
let isQuitting = false;

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'window-config.json');

// 加载窗口配置
function loadWindowConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('加载配置失败:', e);
  }
  return null;
}

// 保存窗口配置
function saveWindowConfig(bounds) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(bounds));
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

// 快捷键配置
let shortcutConfig = {
  toggle: 'Ctrl+Space',
  reset: 'Ctrl+R',
  preset3: 'Ctrl+1',
  preset4: 'Ctrl+2',
  preset6: 'Ctrl+3'
};

// 窗口配置
const WINDOW_WIDTH = 250;
const WINDOW_HEIGHT = 110;
const MIN_WIDTH = 200;    // 最小宽度（80%）
const MAX_WIDTH = 375;    // 最大宽度（150%）
const MIN_HEIGHT = 88;    // 最小高度（80%）
const MAX_HEIGHT = 1000;  // 最大高度（150% * 650px展开高度）
const SNAP_DISTANCE = 50; // 吸附距离阈值

// 当前缩放比例
let currentScale = 1.0;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const config = loadWindowConfig();
  
  let windowX, windowY;
  
  if (config && config.x !== undefined && config.y !== undefined) {
    // 使用保存的位置
    windowX = config.x;
    windowY = config.y;
  } else {
    // 默认右上角
    windowX = width - WINDOW_WIDTH - 20;
    windowY = 20;
  }
  
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
    x: windowX,
    y: windowY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 监听移动事件保存位置
  mainWindow.on('moved', () => {
    const bounds = mainWindow.getBounds();
    saveWindowConfig({ x: bounds.x, y: bounds.y });
  });

  mainWindow.loadFile('index.html');
  
  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();
  
  // 设置窗口级别为最高，确保在全屏应用上方显示
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  // 窗口关闭时隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 创建系统托盘
  createTray();
  
  // 注册全局快捷键
  registerGlobalShortcuts();
}

function createTray() {
  // 创建托盘图标
  tray = new Tray(createTrayIcon());
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: '开始/暂停',
      click: () => {
        mainWindow.webContents.send('shortcut', 'toggle');
      }
    },
    {
      label: '重置',
      click: () => {
        mainWindow.webContents.send('shortcut', 'reset');
      }
    },
    { type: 'separator' },
    {
      label: '快捷时间',
      submenu: [
        {
          label: '3分钟',
          click: () => {
            mainWindow.webContents.send('shortcut', 'preset-3');
          }
        },
        {
          label: '4分钟',
          click: () => {
            mainWindow.webContents.send('shortcut', 'preset-4');
          }
        },
        {
          label: '6分钟',
          click: () => {
            mainWindow.webContents.send('shortcut', 'preset-6');
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '关于倒计时小组件',
          message: '桌面悬浮倒计时小组件',
          detail: `版本：1.0.1\n\n一个功能强大的桌面倒计时工具\n支持全屏PPT上方显示\n\n当前快捷键：\n${shortcutConfig.toggle} - 开始/暂停\n${shortcutConfig.reset} - 重置\n${shortcutConfig.preset3} - 3分钟\n${shortcutConfig.preset4} - 4分钟\n${shortcutConfig.preset6} - 6分钟\n\n可在设置中自定义快捷键`,
          buttons: ['确定']
        });
      }
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('倒计时小组件 - 双击打开');
  tray.setContextMenu(contextMenu);
  
  // 单击显示/隐藏
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // 双击显示并聚焦
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// 创建简单的托盘图标
function createTrayIcon() {
  const { nativeImage } = require('electron');
  
  // 创建一个16x16的红色方块作为托盘图标
  const iconBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEXSURBVDiNpZMxTsNAEEXfzu7aToKN7QQJB+AAnIBrcANOwRW4BQfgCByBKxBRIEGKFJRIKSgo0qRIS1Ekv5HXdkgcfiWNdr/e/L+zK6SUmKZpmsbxOI7jeZ5nGIZh27Zt27Zt27Zt27Zt27Zt27Zt27Zt2/4DZVnW9X1f13Vd13Vd13Vd13Vd13Vd13Vd13Vd13VdFEVRFEVRFEVRFEVRFEVRFEVRFEVRFEVRFEVRFMV/UJZlXdd1Xdd1Xdd1Xdd1Xdd1Xdd1Xdd1Xdd1XRRFURRFURRFURRFURRFURRFURRFURRFURRFURRFcRzHcRzHcRzHcRzHcRzHcRzHcRzHcRzH8TzPMAzDsm3btm3btm3btm3btm3btm3btm3b9h8AgICmivTmCR4AAAAASUVORK5CYII=',
    'base64'
  );
  
  const icon = nativeImage.createFromBuffer(iconBuffer);
  
  // 如果创建失败，尝试使用应用图标
  if (icon.isEmpty()) {
    try {
      // 尝试使用assets中的图标
      const iconPath = path.join(__dirname, 'assets', 'icon.png');
      const fs = require('fs');
      if (fs.existsSync(iconPath)) {
        return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      }
    } catch (e) {
      console.log('无法加载托盘图标，使用默认图标');
    }
  }
  
  return icon;
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 先注销所有快捷键
  globalShortcut.unregisterAll();
  
  // 注册开始/暂停快捷键
  try {
    globalShortcut.register(shortcutConfig.toggle, () => {
      if (mainWindow) {
        mainWindow.webContents.send('shortcut', 'toggle');
      }
    });
  } catch (e) {
    console.error('注册toggle快捷键失败:', e);
  }
  
  // 注册重置快捷键
  try {
    globalShortcut.register(shortcutConfig.reset, () => {
      if (mainWindow) {
        mainWindow.webContents.send('shortcut', 'reset');
      }
    });
  } catch (e) {
    console.error('注册reset快捷键失败:', e);
  }
  
  // 注册3分钟快捷键
  try {
    globalShortcut.register(shortcutConfig.preset3, () => {
      if (mainWindow) {
        mainWindow.webContents.send('shortcut', 'preset-3');
      }
    });
  } catch (e) {
    console.error('注册preset3快捷键失败:', e);
  }
  
  // 注册4分钟快捷键
  try {
    globalShortcut.register(shortcutConfig.preset4, () => {
      if (mainWindow) {
        mainWindow.webContents.send('shortcut', 'preset-4');
      }
    });
  } catch (e) {
    console.error('注册preset4快捷键失败:', e);
  }
  
  // 注册6分钟快捷键
  try {
    globalShortcut.register(shortcutConfig.preset6, () => {
      if (mainWindow) {
        mainWindow.webContents.send('shortcut', 'preset-6');
      }
    });
  } catch (e) {
    console.error('注册preset6快捷键失败:', e);
  }
}

// 处理窗口吸附
ipcMain.on('window-moved', (event, { x, y }) => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const currentBounds = mainWindow.getBounds();
  const windowWidth = currentBounds.width;
  const windowHeight = currentBounds.height;
  let newX = x;
  let newY = y;
  
  // 左上角
  if (x < SNAP_DISTANCE && y < SNAP_DISTANCE) {
    newX = 0;
    newY = 0;
  }
  // 右上角
  else if (x > width - windowWidth - SNAP_DISTANCE && y < SNAP_DISTANCE) {
    newX = width - windowWidth;
    newY = 0;
  }
  // 左下角
  else if (x < SNAP_DISTANCE && y > height - windowHeight - SNAP_DISTANCE) {
    newX = 0;
    newY = height - windowHeight;
  }
  // 右下角
  else if (x > width - windowWidth - SNAP_DISTANCE && y > height - windowHeight - SNAP_DISTANCE) {
    newX = width - windowWidth;
    newY = height - windowHeight;
  }
  
  // 如果需要吸附，发送新位置
  if (newX !== x || newY !== y) {
    mainWindow.setPosition(newX, newY);
    event.reply('window-snapped', { x: newX, y: newY });
  }
  
  // 保存位置（无论是吸附还是普通移动）
  saveWindowConfig({ x: newX, y: newY });
});

// 设置透明度（已禁用 - 现在只使用CSS变量控制背景透明度，不影响时间显示和进度条）
// ipcMain.on('set-opacity', (event, opacity) => {
//   mainWindow.setOpacity(opacity);
// });

// 调整窗口高度
ipcMain.on('resize-window', (event, height) => {
  const currentBounds = mainWindow.getBounds();
  const newWidth = Math.round(WINDOW_WIDTH * currentScale);
  mainWindow.setBounds({
    x: currentBounds.x,
    y: currentBounds.y,
    width: newWidth,
    height: height
  });
});

// 更新快捷键配置
ipcMain.on('update-shortcuts', (event, newConfig) => {
  shortcutConfig = newConfig;
  registerGlobalShortcuts();
  console.log('快捷键已更新:', shortcutConfig);
});

// 窗口缩放 - 真正改变窗口大小
ipcMain.on('resize-window-scale', (event, scale) => {
  currentScale = scale;
  const baseWidth = WINDOW_WIDTH;
  const baseHeight = WINDOW_HEIGHT;
  const newWidth = Math.round(baseWidth * scale);
  const newHeight = Math.round(baseHeight * scale);
  
  const currentBounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: currentBounds.x,
    y: currentBounds.y,
    width: newWidth,
    height: newHeight
  });
  
  console.log(`窗口缩放至 ${scale * 100}%: ${newWidth}x${newHeight}`);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});

