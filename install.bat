@echo off
echo ========================================
echo   Installation des dependances du bot
echo ========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe!
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detecte
node --version
echo.

REM Vérifier si npm est installé
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] npm n'est pas installe!
    pause
    exit /b 1
)

echo [OK] npm detecte
npm --version
echo.

echo [INFO] Installation des dependances npm...
echo.

REM Installer les dépendances npm
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de l'installation des dependances npm
    pause
    exit /b 1
)

echo.
echo [OK] Dependances npm installees avec succes!
echo.

REM Vérifier si Canvas est installé
echo [INFO] Verification de Canvas...
node -e "require('@napi-rs/canvas')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENTION] @napi-rs/canvas n'est pas installe correctement
    echo.
    echo Pour Windows, @napi-rs/canvas devrait s'installer automatiquement.
    echo Si vous rencontrez des erreurs, essayez:
    echo   npm install @napi-rs/canvas
    echo.
) else (
    echo [OK] @napi-rs/canvas est installe correctement
)

echo.
echo ========================================
echo   Installation terminee!
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Configurez config.json avec vos informations
echo 2. Lancez le bot avec: node index.js
echo.
pause

