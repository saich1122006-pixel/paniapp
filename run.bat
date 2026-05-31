@echo off
title PaniApp Launcher
cls

:menu
cls
echo ====================================================
echo                 PaniApp Launcher
echo ====================================================
echo.
echo Select an option to manage and run your application:
echo.
echo  [1] Start Expo Development Server (Standard)
echo  [2] Start Expo Server with Web support (Browser)
echo  [3] Start Expo Server for Android (Emulator/Device)
echo  [4] Install Dependencies (npm install)
echo  [5] Run Expo Linting
echo  [6] Exit
echo.
echo ====================================================
set /p opt="Enter choice (1-6): "

if "%opt%"=="1" goto start_server
if "%opt%"=="2" goto start_web
if "%opt%"=="3" goto start_android
if "%opt%"=="4" goto install_deps
if "%opt%"=="5" goto run_lint
if "%opt%"=="6" goto end

:start_server
cls
echo Starting Expo Development Server...
echo Use the Expo Go app on your phone to scan the QR code,
echo or press 'w' to open in browser, 'a' for Android, 'i' for iOS.
echo.
call npm start
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Expo development server exited with error code %ERRORLEVEL%.
    echo Please make sure dependencies are fully installed (Option 4).
    pause
)
goto menu

:start_web
cls
echo Starting Expo Server in Web Mode...
call npm run web
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Web mode failed to launch. Exit code %ERRORLEVEL%.
    pause
)
goto menu

:start_android
cls
echo Starting Expo Server in Android Mode...
call npm run android
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Android mode failed to launch. Exit code %ERRORLEVEL%.
    pause
)
goto menu

:install_deps
cls
echo Installing NPM dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Dependency installation failed. Exit code %ERRORLEVEL%.
    pause
) else (
    echo.
    echo Done! Press any key to return to the menu.
    pause > nul
)
goto menu

:run_lint
cls
echo Running project linter...
call npm run lint
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Linter found issues or failed. Exit code %ERRORLEVEL%.
    pause
)
goto menu

:end
echo Exiting PaniApp Launcher. Have a great coding session!
timeout /t 2 > nul
exit
