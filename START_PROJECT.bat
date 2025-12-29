@echo off
echo.
echo ========================================
echo 🚀 Deep Learning Project Starter
echo ========================================
echo.
echo Démarrage du serveur Express...
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo ❌ node_modules non trouvé. Installation des dépendances...
    call npm install
)

REM Démarrer le serveur
echo.
echo ✅ Serveur Express en cours de démarrage...
echo 📍 Backend: http://localhost:3000
echo 📍 API MNIST: http://localhost:3000/api/mnist/random
echo 📍 Health Check: http://localhost:3000/api/health
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

node server/index.js

pause
