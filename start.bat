@echo off
chcp 65001 >nul
echo ========================================
echo   桌面倒计时小组件
echo ========================================
echo.
echo 正在启动应用...
echo.

npm start

if errorlevel 1 (
    echo.
    echo ========================================
    echo   启动失败！
    echo ========================================
    echo.
    echo 可能原因：
    echo 1. 未安装依赖，请先运行 install.bat
    echo 2. Node.js 未安装
    echo.
    pause
)



