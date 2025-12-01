const { ipcRenderer } = require('electron');

// 状态管理
let timerState = {
  totalSeconds: 180, // 默认3分钟
  remainingSeconds: 180,
  isRunning: false,
  isOvertime: false,
  interval: null
};

// DOM元素 - 将在init中获取
let timeDisplay, progressFill, controlPanel, startBtn, pauseBtn, resetBtn;
let presetBtns, customMinutes, setCustomBtn, opacitySlider, opacityValue;
let contextMenu, dragHandle, settingsBtn, shortcutHeader, shortcutContent;
let shortcutToggle, recordBtns, saveShortcutsBtn, resetShortcutsBtn;
let scaleSlider, scaleValue, presetConfigHeader, presetConfigContent;
let preset1Value, preset2Value, preset3Value, savePresetsBtn;

// 快捷键配置
let shortcutConfig = {
  toggle: 'Ctrl+Space',
  reset: 'Ctrl+R',
  preset3: 'Ctrl+1',
  preset4: 'Ctrl+2',
  preset6: 'Ctrl+3'
};

// 快捷时间配置
let presetTimes = {
  preset1: 3,
  preset2: 4,
  preset3: 6
};

// 快捷键录制状态
let isRecording = false;
let currentRecordingAction = null;

// 初始化 - 确保DOM加载完成后执行
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('初始化开始...');
  
  // 获取DOM元素
  timeDisplay = document.getElementById('timeDisplay');
  progressFill = document.getElementById('progressFill');
  controlPanel = document.getElementById('controlPanel');
  startBtn = document.getElementById('startBtn');
  pauseBtn = document.getElementById('pauseBtn');
  resetBtn = document.getElementById('resetBtn');
  presetBtns = document.querySelectorAll('.preset-btn');
  customMinutes = document.getElementById('customMinutes');
  setCustomBtn = document.getElementById('setCustomBtn');
  opacitySlider = document.getElementById('opacitySlider');
  opacityValue = document.getElementById('opacityValue');
  contextMenu = document.getElementById('contextMenu');
  dragHandle = document.getElementById('dragHandle');
  settingsBtn = document.getElementById('settingsBtn');
  shortcutHeader = document.getElementById('shortcutHeader');
  shortcutContent = document.getElementById('shortcutContent');
  shortcutToggle = document.getElementById('shortcutToggle');
  recordBtns = document.querySelectorAll('.record-btn');
  saveShortcutsBtn = document.getElementById('saveShortcuts');
  resetShortcutsBtn = document.getElementById('resetShortcuts');
  scaleSlider = document.getElementById('scaleSlider');
  scaleValue = document.getElementById('scaleValue');
  presetConfigHeader = document.getElementById('presetConfigHeader');
  presetConfigContent = document.getElementById('presetConfigContent');
  preset1Value = document.getElementById('preset1Value');
  preset2Value = document.getElementById('preset2Value');
  preset3Value = document.getElementById('preset3Value');
  savePresetsBtn = document.getElementById('savePresets');
  
  // 检查关键元素是否存在
  if (!settingsBtn) {
    console.error('settingsBtn 元素未找到！');
    return;
  }
  console.log('settingsBtn 找到:', settingsBtn);
  
  // 加载快捷键配置
  loadShortcutConfig();
  
  // 更新显示
  updateDisplay();
  
  // 绑定事件
  bindEvents();
  
  // 设置悬停监听器
  setupHoverListeners();
  
  // 监听全局快捷键
  listenToShortcuts();
  
  // 设置折叠监听器，实现动态高度
  setupCollapseListeners();
  
  // 显示快捷键配置
  displayShortcuts();
  
  // 更新快捷按钮显示
  updatePresetButtons();
  
  console.log('初始化完成');
}

// 格式化时间显示
function formatTime(seconds) {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const sign = isNegative ? '+' : '';
  return `${sign}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 更新显示
function updateDisplay() {
  timeDisplay.textContent = formatTime(timerState.remainingSeconds);
  
  // 更新进度条
  let progress;
  if (timerState.isOvertime) {
    // 超时后进度条满格并变红
    progress = 100;
  } else {
    progress = ((timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds) * 100;
  }
  progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  
  // 更新样式
  timeDisplay.classList.remove('running', 'overtime', 'paused');
  progressFill.classList.remove('overtime', 'paused');
  
  if (timerState.isOvertime) {
    timeDisplay.classList.add('overtime');
    progressFill.classList.add('overtime');
  } else if (timerState.isRunning) {
    timeDisplay.classList.add('running');
  } else {
    timeDisplay.classList.add('paused');
    progressFill.classList.add('paused');
  }
}

// 开始/继续计时
function startTimer() {
  if (timerState.interval) return;
  
  timerState.isRunning = true;
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
  
  timerState.interval = setInterval(() => {
    timerState.remainingSeconds--;
    
    // 检查是否超时
    if (timerState.remainingSeconds < 0) {
      timerState.isOvertime = true;
    }
    
    updateDisplay();
  }, 1000);
  
  updateDisplay();
}

// 暂停计时
function pauseTimer() {
  if (!timerState.interval) return;
  
  clearInterval(timerState.interval);
  timerState.interval = null;
  timerState.isRunning = false;
  startBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
  
  updateDisplay();
}

// 切换开始/暂停
function toggleTimer() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

// 重置计时器
function resetTimer() {
  pauseTimer();
  timerState.remainingSeconds = timerState.totalSeconds;
  timerState.isOvertime = false;
  updateDisplay();
}

// 设置计时时间
function setTimer(minutes) {
  pauseTimer();
  timerState.totalSeconds = minutes * 60;
  timerState.remainingSeconds = minutes * 60;
  timerState.isOvertime = false;
  updateDisplay();
}

// 绑定事件
function bindEvents() {
  // 开始按钮
  startBtn.addEventListener('click', startTimer);
  
  // 暂停按钮
  pauseBtn.addEventListener('click', pauseTimer);
  
  // 重置按钮
  resetBtn.addEventListener('click', resetTimer);
  
  // 快捷时间按钮
  presetBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const presetKey = `preset${index + 1}`;
      const minutes = presetTimes[presetKey];
      setTimer(minutes);
    });
  });
  
  // 自定义时间
  setCustomBtn.addEventListener('click', () => {
    const minutes = parseInt(customMinutes.value);
    if (minutes >= 1 && minutes <= 60) {
      setTimer(minutes);
      customMinutes.value = '';
    }
  });
  
  customMinutes.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      setCustomBtn.click();
    }
  });
  
  // 透明度滑块 - 只调整背景透明度，不影响时间显示和进度条
  opacitySlider.addEventListener('input', (e) => {
    const opacity = e.target.value / 100;
    opacityValue.textContent = e.target.value;
    // 设置CSS变量来控制背景透明度（只影响.app-container背景）
    document.documentElement.style.setProperty('--bg-opacity', opacity);
    // 保存设置
    localStorage.setItem('bgOpacity', opacity);
  });
  
  // 设置按钮点击切换控制面板
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      console.log('设置按钮被点击');
      e.stopPropagation();
      const isActive = settingsBtn.classList.toggle('active');
      console.log('按钮状态:', isActive ? '激活' : '未激活');
      
      if (isActive) {
        controlPanel.classList.add('show');
      } else {
        controlPanel.classList.remove('show');
      }
      
      adjustWindowHeight();
    });
    console.log('设置按钮事件监听器已添加');
  } else {
    console.error('settingsBtn 为 null，无法添加事件监听器');
  }
  
  // 快捷键设置折叠
  if (shortcutHeader) {
    shortcutHeader.addEventListener('click', () => {
      shortcutContent.classList.toggle('show');
      shortcutHeader.classList.toggle('expanded');
    });
  }
  
  // 快捷键录制按钮
  recordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      startRecording(btn.dataset.action, btn);
    });
  });
  
  // 保存快捷键
  if (saveShortcutsBtn) {
    saveShortcutsBtn.addEventListener('click', saveShortcutConfig);
  }
  
  // 恢复默认快捷键
  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', resetToDefaultShortcuts);
  }
  
  // 窗口大小缩放 - 真正改变窗口大小
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      const scale = e.target.value / 100;
      scaleValue.textContent = e.target.value;
      // 通知主进程改变窗口大小
      ipcRenderer.send('resize-window-scale', scale);
      
      // 同时应用CSS缩放，让内容适应窗口
      document.querySelector('.app-container').style.transform = `scale(${scale})`;
      document.querySelector('.app-container').style.transformOrigin = 'top left';
      
      localStorage.setItem('windowScale', scale);
    });
  }
  
  // 快捷时间配置折叠
  if (presetConfigHeader) {
    presetConfigHeader.addEventListener('click', () => {
      presetConfigContent.classList.toggle('show');
      presetConfigHeader.classList.toggle('expanded');
    });
  }
  
  // 保存快捷时间配置
  if (savePresetsBtn) {
    savePresetsBtn.addEventListener('click', savePresetTimes);
  }
  
  // 右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  });
  
  // 点击其他地方关闭右键菜单
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.remove('show');
    }
  });
  
  // 右键菜单项
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleMenuAction(action);
      contextMenu.classList.remove('show');
    });
  });
  
  // 窗口拖动
  setupWindowDrag();
}

// 显示右键菜单
function showContextMenu(x, y) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

// 处理菜单动作
function handleMenuAction(action) {
  switch (action) {
    case 'toggle':
      toggleTimer();
      break;
    case 'reset':
      resetTimer();
      break;
    case 'preset-3':
      setTimer(3);
      break;
    case 'preset-4':
      setTimer(4);
      break;
    case 'preset-6':
      setTimer(6);
      break;
    case 'toggle-panel':
      controlPanel.classList.toggle('show');
      break;
  }
}

// 监听全局快捷键
function listenToShortcuts() {
  ipcRenderer.on('shortcut', (event, action) => {
    switch (action) {
      case 'toggle':
        toggleTimer();
        break;
      case 'reset':
        resetTimer();
        break;
      case 'preset-3':
        setTimer(3);
        break;
      case 'preset-4':
        setTimer(4);
        break;
      case 'preset-6':
        setTimer(6);
        break;
    }
  });
}

// 设置窗口拖动
function setupWindowDrag() {
  let isDragging = false;
  let startX, startY;
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    
    startX = e.screenX;
    startY = e.screenY;
    
    // 获取当前窗口位置
    const bounds = require('electron').remote?.getCurrentWindow().getBounds() || 
                   { x: 0, y: 0 };
    const newX = bounds.x + deltaX;
    const newY = bounds.y + deltaY;
    
    // 发送窗口移动事件进行吸附检测
    ipcRenderer.send('window-moved', { x: newX, y: newY });
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// 监听窗口吸附
ipcRenderer.on('window-snapped', (event, { x, y }) => {
  // 窗口已被主进程吸附
  console.log('Window snapped to:', x, y);
});

// 防止拖动时选中文本
document.addEventListener('selectstart', (e) => {
  if (e.target.tagName !== 'INPUT') {
    e.preventDefault();
  }
});

// 快捷键配置相关函数
function loadShortcutConfig() {
  const saved = localStorage.getItem('shortcutConfig');
  if (saved) {
    try {
      shortcutConfig = JSON.parse(saved);
    } catch (e) {
      console.error('加载快捷键配置失败:', e);
    }
  }
  
  // 加载快捷时间配置
  const savedPresets = localStorage.getItem('presetTimes');
  if (savedPresets) {
    try {
      presetTimes = JSON.parse(savedPresets);
      updatePresetButtons();
    } catch (e) {
      console.error('加载快捷时间配置失败:', e);
    }
  }
  
  // 加载背景透明度
  const savedOpacity = localStorage.getItem('bgOpacity');
  if (savedOpacity) {
    const opacity = parseFloat(savedOpacity);
    // 只设置CSS变量来控制背景透明度（只影响.app-container背景）
    document.documentElement.style.setProperty('--bg-opacity', opacity);
    if (opacitySlider) {
      opacitySlider.value = opacity * 100;
      opacityValue.textContent = Math.round(opacity * 100);
    }
  }
  
  // 加载窗口缩放
  const savedScale = localStorage.getItem('windowScale');
  if (savedScale) {
    const scale = parseFloat(savedScale);
    // 通知主进程应用缩放
    ipcRenderer.send('resize-window-scale', scale);
    
    // 同时应用CSS缩放
    document.querySelector('.app-container').style.transform = `scale(${scale})`;
    document.querySelector('.app-container').style.transformOrigin = 'top left';
    
    // 更新UI显示
    if (scaleSlider) {
      scaleSlider.value = scale * 100;
      scaleValue.textContent = Math.round(scale * 100);
    }
  }
}

function displayShortcuts() {
  const toggleInput = document.getElementById('toggleShortcut');
  const resetInput = document.getElementById('resetShortcut');
  const preset3Input = document.getElementById('preset3Shortcut');
  const preset4Input = document.getElementById('preset4Shortcut');
  const preset6Input = document.getElementById('preset6Shortcut');
  
  if (toggleInput) toggleInput.value = shortcutConfig.toggle;
  if (resetInput) resetInput.value = shortcutConfig.reset;
  if (preset3Input) preset3Input.value = shortcutConfig.preset3;
  if (preset4Input) preset4Input.value = shortcutConfig.preset4;
  if (preset6Input) preset6Input.value = shortcutConfig.preset6;
}

function startRecording(action, btn) {
  if (isRecording) return;
  
  isRecording = true;
  currentRecordingAction = action;
  
  const input = document.getElementById(action + 'Shortcut');
  input.value = '按下组合键...';
  input.classList.add('recording');
  btn.textContent = '录制中';
  btn.classList.add('recording');
  
  // 监听键盘事件
  document.addEventListener('keydown', recordKeyPress);
}

function recordKeyPress(e) {
  if (!isRecording) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.altKey) keys.push('Alt');
  if (e.shiftKey) keys.push('Shift');
  if (e.metaKey) keys.push('Meta');
  
  // 获取主键
  const mainKey = e.key;
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
    if (keys.length > 0) {
      // 必须包含修饰键
      keys.push(mainKey.toUpperCase());
      const shortcut = keys.join('+');
      
      // 更新配置
      shortcutConfig[currentRecordingAction] = shortcut;
      
      // 更新显示
      const input = document.getElementById(currentRecordingAction + 'Shortcut');
      input.value = shortcut;
      input.classList.remove('recording');
      
      // 重置录制状态
      const btn = document.querySelector(`[data-action="${currentRecordingAction}"]`);
      btn.textContent = '录制';
      btn.classList.remove('recording');
      
      isRecording = false;
      currentRecordingAction = null;
      document.removeEventListener('keydown', recordKeyPress);
    } else {
      // 没有修饰键，提示用户
      const input = document.getElementById(currentRecordingAction + 'Shortcut');
      input.value = '必须使用组合键！';
      setTimeout(() => {
        input.value = shortcutConfig[currentRecordingAction];
        input.classList.remove('recording');
        const btn = document.querySelector(`[data-action="${currentRecordingAction}"]`);
        btn.textContent = '录制';
        btn.classList.remove('recording');
        isRecording = false;
        currentRecordingAction = null;
        document.removeEventListener('keydown', recordKeyPress);
      }, 1500);
    }
  }
}

function saveShortcutConfig() {
  // 保存到localStorage
  localStorage.setItem('shortcutConfig', JSON.stringify(shortcutConfig));
  
  // 通知主进程更新快捷键
  ipcRenderer.send('update-shortcuts', shortcutConfig);
  
  // 显示保存成功提示
  const btn = saveShortcutsBtn;
  const originalText = btn.textContent;
  btn.textContent = '✅ 已保存';
  btn.style.background = '#22c55e';
  btn.style.borderColor = '#22c55e';
  btn.style.color = 'white';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
  }, 2000);
}

function resetToDefaultShortcuts() {
  shortcutConfig = {
    toggle: 'Ctrl+Space',
    reset: 'Ctrl+R',
    preset3: 'Ctrl+1',
    preset4: 'Ctrl+2',
    preset6: 'Ctrl+3'
  };
  
  displayShortcuts();
  saveShortcutConfig();
}

// 更新快捷按钮显示
function updatePresetButtons() {
  if (presetBtns && presetBtns.length >= 3) {
    presetBtns[0].textContent = `${presetTimes.preset1}分`;
    presetBtns[1].textContent = `${presetTimes.preset2}分`;
    presetBtns[2].textContent = `${presetTimes.preset3}分`;
  }
  
  // 更新输入框
  if (preset1Value) preset1Value.value = presetTimes.preset1;
  if (preset2Value) preset2Value.value = presetTimes.preset2;
  if (preset3Value) preset3Value.value = presetTimes.preset3;
  
  // 更新快捷键设置区域的标签
  const preset3Label = document.getElementById('preset3Label');
  const preset4Label = document.getElementById('preset4Label');
  const preset6Label = document.getElementById('preset6Label');
  
  if (preset3Label) preset3Label.textContent = `${presetTimes.preset1}分钟`;
  if (preset4Label) preset4Label.textContent = `${presetTimes.preset2}分钟`;
  if (preset6Label) preset6Label.textContent = `${presetTimes.preset3}分钟`;
}

// 保存快捷时间配置
function savePresetTimes() {
  presetTimes = {
    preset1: parseInt(preset1Value.value) || 3,
    preset2: parseInt(preset2Value.value) || 4,
    preset3: parseInt(preset3Value.value) || 6
  };
  
  localStorage.setItem('presetTimes', JSON.stringify(presetTimes));
  updatePresetButtons();
  
  // 显示保存成功提示
  const btn = savePresetsBtn;
  const originalText = btn.textContent;
  btn.textContent = '✅ 已保存';
  btn.style.background = '#16a34a';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 2000);
}

// 调整窗口高度以适应内容
function adjustWindowHeight() {
  const isExpanded = controlPanel.classList.contains('show');
  
  let targetHeight;
  if (isExpanded) {
    // 强制浏览器重排以获取准确高度
    controlPanel.style.height = 'auto';
    const contentHeight = controlPanel.scrollHeight;
    controlPanel.style.height = '';
    
    // 110px是头部高度
    // 增加30px缓冲，防止滚动条出现
    targetHeight = 110 + contentHeight + 30;
    
    // 限制最大高度
    targetHeight = Math.min(targetHeight, 900);
  } else {
    targetHeight = 110;
  }
  
  // 获取当前缩放
  const savedScale = localStorage.getItem('windowScale') || '1';
  const scale = parseFloat(savedScale);
  const newHeight = Math.round(targetHeight * scale);
  
  // 通知主进程调整窗口大小
  ipcRenderer.send('resize-window', newHeight);
}

// 监听控制面板内的折叠事件，动态调整高度
function setupCollapseListeners() {
  // 监听所有折叠区域的过渡结束事件
  const transitionElements = [controlPanel, presetConfigContent, shortcutContent];
  
  transitionElements.forEach(el => {
    if (el) {
      el.addEventListener('transitionend', () => {
        if (controlPanel.classList.contains('show')) {
          adjustWindowHeight();
        }
      });
    }
  });
  
  // 监听折叠按钮点击，立即开始调整（平滑动画）
  if (presetConfigHeader) {
    presetConfigHeader.addEventListener('click', () => {
      // 多次触发以配合动画
      adjustWindowHeight();
      setTimeout(adjustWindowHeight, 100);
      setTimeout(adjustWindowHeight, 300);
    });
  }
  if (shortcutHeader) {
    shortcutHeader.addEventListener('click', () => {
      adjustWindowHeight();
      setTimeout(adjustWindowHeight, 100);
      setTimeout(adjustWindowHeight, 300);
    });
  }
}

// 移除悬停自动显示功能
function setupHoverListeners() {
  // 不再需要悬停监听器
  // 只通过点击设置按钮来显示控制面板
}



