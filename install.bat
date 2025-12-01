@echo off
chcp 65001 >nul
echo ========================================
echo   桌面倒计时小组件 - 安装依赖
echo ========================================
echo.
echo 正在检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js！
    echo.
    echo 请先安装 Node.js：
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [成功] Node.js 已安装
node --version
echo.
echo 正在安装依赖包...
echo 这可能需要几分钟，请耐心等待...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ========================================
    echo   安装失败！
    echo ========================================
    echo.
    echo 尝试使用国内镜像重新安装...
    npm config set registry https://registry.npmmirror.com
    npm install
)

if errorlevel 1 (
    echo.
    echo 安装仍然失败，请检查网络连接。
    pause
    exit /b 1
)

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 现在可以运行 start.bat 启动应用
echo.
pause



