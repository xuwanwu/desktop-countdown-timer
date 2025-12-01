@echo off
chcp 65001 >nul
echo ========================================
echo   桌面倒计时小组件 - 打包应用
echo ========================================
echo.

:MENU
echo 请选择打包方式：
echo.
echo [1] 安装版 (推荐) - 生成安装程序
echo [2] 便携版 - 无需安装，解压即用
echo [3] 全部打包 - 同时生成两个版本
echo [0] 退出
echo.
set /p choice=请输入选项 [1-3]: 

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto BUILD_INSTALLER
if "%choice%"=="2" goto BUILD_PORTABLE
if "%choice%"=="3" goto BUILD_ALL
echo 无效选项，请重新选择
echo.
goto MENU

:BUILD_INSTALLER
echo.
echo 正在打包安装版...
echo 这可能需要几分钟，请耐心等待...
echo.
call npm run build
goto CHECK_RESULT

:BUILD_PORTABLE
echo.
echo 正在打包便携版...
echo 这可能需要几分钟，请耐心等待...
echo.
call npm run build:portable
goto CHECK_RESULT

:BUILD_ALL
echo.
echo 正在打包所有版本...
echo 这可能需要较长时间，请耐心等待...
echo.
call npm run build:all
goto CHECK_RESULT

:CHECK_RESULT
if errorlevel 1 (
    echo.
    echo ========================================
    echo   打包失败！
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 未安装依赖 - 请先运行 install.bat
    echo 2. 缺少图标文件 - 检查 assets/icon.png
    echo 3. 磁盘空间不足
    echo.
    echo 详细信息请查看上方错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 安装程序位置：dist 文件夹
echo.
echo 文件说明：
echo - 倒计时小组件-1.0.0-Setup.exe  (安装版)
echo - 倒计时小组件-1.0.0-Portable.exe (便携版)
echo.
echo 现在打开 dist 文件夹...
echo.
pause

explorer dist

