@echo off
chcp 65001 >nul
echo ========================================
echo    EasyStay 项目上传到服务器
echo ========================================
echo.

set SERVER_IP=81.71.15.150
set SERVER_USER=root
set PROJECT_DIR=%~dp0
set REMOTE_DIR=/opt/EasyStay_Project

echo 服务器: %SERVER_USER%@%SERVER_IP%
echo 远程目录: %REMOTE_DIR%
echo.
echo 请确保:
echo 1. 已安装 SSH/SCP 工具
echo 2. 服务器上已创建 /opt 目录
echo.

pause

echo.
echo [1/3] 正在上传项目文件...
echo.

REM 使用 SCP 上传（需要先在服务器上创建目录）
REM 如果有 SSH 密钥，建议配置免密登录

echo 请先在服务器上执行以下命令:
echo   mkdir -p %REMOTE_DIR%
echo.
echo 然后使用以下命令上传:
echo   scp -r "%PROJECT_DIR%*" %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%
echo.
echo 或者使用 Git（推荐）:
echo   cd %REMOTE_DIR%
echo   git clone ^<你的仓库地址^> .
echo.

pause

echo.
echo 上传完成后，请登录服务器执行:
echo   cd %REMOTE_DIR%
echo   bash deploy.sh
echo.

pause
