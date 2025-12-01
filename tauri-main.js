// Tauri 适配版本 - 从 renderer.js 转换
// 主要改动：将 Electron API 替换为 Tauri API

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

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
  
  // 获取DOM元素（与原版相同）
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
  
  // 监听全局快捷键（Tauri 版本）
  listenToShortcuts();
  
  // 设置折叠监听器，实现动态高度
  setupCollapseListeners();
  
  // 显示快捷键配置
  displayShortcuts();
  
  // 更新快捷按钮显示
  updatePresetButtons();
  
  console.log('初始化完成');
}

// 格式化时间显示（与原版相同）
function formatTime(seconds) {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const sign = isNegative ? '+' : '';
  return `${sign}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 更新显示（与原版相同）
function updateDisplay() {
  timeDisplay.textContent = formatTime(timerState.remainingSeconds);
  
  // 更新进度条
  let progress;
  if (timerState.isOvertime) {
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

// 开始/继续计时（与原版相同）
function startTimer() {
  if (timerState.interval) return;
  
  timerState.isRunning = true;
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
  
  timerState.interval = setInterval(() => {
    timerState.remainingSeconds--;
    
    if (timerState.remainingSeconds < 0) {
      timerState.isOvertime = true;
    }
    
    updateDisplay();
  }, 1000);
  
  updateDisplay();
}

// 暂停计时（与原版相同）
function pauseTimer() {
  if (!timerState.interval) return;
  
  clearInterval(timerState.interval);
  timerState.interval = null;
  timerState.isRunning = false;
  startBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
  
  updateDisplay();
}

// 切换开始/暂停（与原版相同）
function toggleTimer() {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

// 重置计时器（与原版相同）
function resetTimer() {
  pauseTimer();
  timerState.remainingSeconds = timerState.totalSeconds;
  timerState.isOvertime = false;
  updateDisplay();
}

// 设置计时时间（与原版相同）
function setTimer(minutes) {
  pauseTimer();
  timerState.totalSeconds = minutes * 60;
  timerState.remainingSeconds = minutes * 60;
  timerState.isOvertime = false;
  updateDisplay();
}

// 绑定事件（大部分与原版相同，窗口操作部分需要适配）
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
  
  // 透明度滑块
  opacitySlider.addEventListener('input', (e) => {
    const opacity = e.target.value / 100;
    opacityValue.textContent = e.target.value;
    document.documentElement.style.setProperty('--bg-opacity', opacity);
    localStorage.setItem('bgOpacity', opacity);
  });
  
  // 设置按钮点击切换控制面板
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = settingsBtn.classList.toggle('active');
      
      if (isActive) {
        controlPanel.classList.add('show');
      } else {
        controlPanel.classList.remove('show');
      }
      
      adjustWindowHeight();
    });
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
  
  // 窗口大小缩放 - 使用 Tauri API
  if (scaleSlider) {
    scaleSlider.addEventListener('input', async (e) => {
      const scale = e.target.value / 100;
      scaleValue.textContent = e.target.value;
      
      // 使用 Tauri invoke 调用 Rust 后端
      try {
        await invoke('resize_window_scale', { scale });
        
        // 同时应用CSS缩放
        document.querySelector('.app-container').style.transform = `scale(${scale})`;
        document.querySelector('.app-container').style.transformOrigin = 'top left';
        
        localStorage.setItem('windowScale', scale);
      } catch (error) {
        console.error('调整窗口大小失败:', error);
      }
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
  
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.remove('show');
    }
  });
  
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleMenuAction(action);
      contextMenu.classList.remove('show');
    });
  });
  
  // 窗口拖动 - 使用 Tauri API
  setupWindowDrag();
}

// 显示右键菜单（与原版相同）
function showContextMenu(x, y) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

// 处理菜单动作（与原版相同）
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

// 监听全局快捷键 - Tauri 版本
async function listenToShortcuts() {
  // Tauri 的全局快捷键由 Rust 后端处理
  // 前端通过事件监听接收快捷键触发
  try {
    await listen('shortcut', (event) => {
      const action = event.payload;
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
  } catch (error) {
    console.error('监听快捷键失败:', error);
  }
}

// 设置窗口拖动 - Tauri 版本
function setupWindowDrag() {
  let isDragging = false;
  let startX, startY;
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
  });
  
  document.addEventListener('mousemove', async (e) => {
    if (!isDragging) return;
    
    const deltaX = e.screenX - startX;
    const deltaY = e.screenY - startY;
    
    startX = e.screenX;
    startY = e.screenY;
    
    // 获取当前窗口位置
    try {
      const position = await appWindow.outerPosition();
      const newX = position.x + deltaX;
      const newY = position.y + deltaY;
      
      // 发送窗口移动事件进行吸附检测
      await invoke('window_moved', { x: newX, y: newY });
    } catch (error) {
      console.error('窗口拖动失败:', error);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// 防止拖动时选中文本（与原版相同）
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
  
  const savedPresets = localStorage.getItem('presetTimes');
  if (savedPresets) {
    try {
      presetTimes = JSON.parse(savedPresets);
      updatePresetButtons();
    } catch (e) {
      console.error('加载快捷时间配置失败:', e);
    }
  }
  
  const savedOpacity = localStorage.getItem('bgOpacity');
  if (savedOpacity) {
    const opacity = parseFloat(savedOpacity);
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
    // 通知 Rust 后端应用缩放
    invoke('resize_window_scale', { scale }).catch(console.error);
    
    // 同时应用CSS缩放
    document.querySelector('.app-container').style.transform = `scale(${scale})`;
    document.querySelector('.app-container').style.transformOrigin = 'top left';
    
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
  
  const mainKey = e.key;
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
    if (keys.length > 0) {
      keys.push(mainKey.toUpperCase());
      const shortcut = keys.join('+');
      
      shortcutConfig[currentRecordingAction] = shortcut;
      
      const input = document.getElementById(currentRecordingAction + 'Shortcut');
      input.value = shortcut;
      input.classList.remove('recording');
      
      const btn = document.querySelector(`[data-action="${currentRecordingAction}"]`);
      btn.textContent = '录制';
      btn.classList.remove('recording');
      
      isRecording = false;
      currentRecordingAction = null;
      document.removeEventListener('keydown', recordKeyPress);
    } else {
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

// 保存快捷键配置 - Tauri 版本
async function saveShortcutConfig() {
  localStorage.setItem('shortcutConfig', JSON.stringify(shortcutConfig));
  
  // 通知 Rust 后端更新快捷键
  try {
    await invoke('update_shortcuts', { config: shortcutConfig });
  } catch (error) {
    console.error('更新快捷键失败:', error);
  }
  
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

// 更新快捷按钮显示（与原版相同）
function updatePresetButtons() {
  if (presetBtns && presetBtns.length >= 3) {
    presetBtns[0].textContent = `${presetTimes.preset1}分`;
    presetBtns[1].textContent = `${presetTimes.preset2}分`;
    presetBtns[2].textContent = `${presetTimes.preset3}分`;
  }
  
  if (preset1Value) preset1Value.value = presetTimes.preset1;
  if (preset2Value) preset2Value.value = presetTimes.preset2;
  if (preset3Value) preset3Value.value = presetTimes.preset3;
  
  const preset3Label = document.getElementById('preset3Label');
  const preset4Label = document.getElementById('preset4Label');
  const preset6Label = document.getElementById('preset6Label');
  
  if (preset3Label) preset3Label.textContent = `${presetTimes.preset1}分钟`;
  if (preset4Label) preset4Label.textContent = `${presetTimes.preset2}分钟`;
  if (preset6Label) preset6Label.textContent = `${presetTimes.preset3}分钟`;
}

// 保存快捷时间配置（与原版相同）
function savePresetTimes() {
  presetTimes = {
    preset1: parseInt(preset1Value.value) || 3,
    preset2: parseInt(preset2Value.value) || 4,
    preset3: parseInt(preset3Value.value) || 6
  };
  
  localStorage.setItem('presetTimes', JSON.stringify(presetTimes));
  updatePresetButtons();
  
  const btn = savePresetsBtn;
  const originalText = btn.textContent;
  btn.textContent = '✅ 已保存';
  btn.style.background = '#16a34a';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 2000);
}

// 调整窗口高度 - Tauri 版本
async function adjustWindowHeight() {
  const isExpanded = controlPanel.classList.contains('show');
  
  let targetHeight;
  if (isExpanded) {
    controlPanel.style.height = 'auto';
    const contentHeight = controlPanel.scrollHeight;
    controlPanel.style.height = '';
    
    targetHeight = 110 + contentHeight + 30;
    targetHeight = Math.min(targetHeight, 900);
  } else {
    targetHeight = 110;
  }
  
  const savedScale = localStorage.getItem('windowScale') || '1';
  const scale = parseFloat(savedScale);
  const newHeight = Math.round(targetHeight * scale);
  
  // 使用 Tauri invoke 调用 Rust 后端
  try {
    await invoke('resize_window', { height: newHeight });
  } catch (error) {
    console.error('调整窗口高度失败:', error);
  }
}

// 监听控制面板内的折叠事件（与原版相同）
function setupCollapseListeners() {
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
  
  if (presetConfigHeader) {
    presetConfigHeader.addEventListener('click', () => {
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

function setupHoverListeners() {
  // 不再需要悬停监听器
}


