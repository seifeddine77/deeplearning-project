@echo off
echo.
echo ========================================
echo ✅ Vérification de la Configuration
echo ========================================
echo.

REM Vérifier Node.js
echo 📍 Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé!
    echo Téléchargez-le depuis: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js trouvé:
    node --version
)

echo.

REM Vérifier npm
echo 📍 Vérification de npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé!
    pause
    exit /b 1
) else (
    echo ✅ npm trouvé:
    npm --version
)

echo.

REM Vérifier node_modules
echo 📍 Vérification des dépendances...
if not exist "node_modules" (
    echo ⚠️  node_modules n'existe pas. Installation...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dépendances trouvées
)

echo.

REM Vérifier les fichiers clés
echo 📍 Vérification des fichiers clés...

if exist "server\index.js" (
    echo ✅ server\index.js trouvé
) else (
    echo ❌ server\index.js manquant!
)

if exist "server\routes\mnist-routes.js" (
    echo ✅ server\routes\mnist-routes.js trouvé
) else (
    echo ❌ server\routes\mnist-routes.js manquant!
)

if exist "src\app\services\mnist.service.ts" (
    echo ✅ src\app\services\mnist.service.ts trouvé
) else (
    echo ❌ src\app\services\mnist.service.ts manquant!
)

if exist "angular.json" (
    echo ✅ angular.json trouvé
) else (
    echo ❌ angular.json manquant!
)

echo.
echo ========================================
echo ✅ Configuration vérifiée avec succès!
echo ========================================
echo.
echo Prochaines étapes:
echo 1. Double-cliquez sur START_FULL_PROJECT.bat
echo 2. Ouvrez http://localhost:4200 dans votre navigateur
echo 3. Allez à la page Training et cliquez sur "Start Training"
echo.
echo Appuyez sur une touche pour fermer...
pause
