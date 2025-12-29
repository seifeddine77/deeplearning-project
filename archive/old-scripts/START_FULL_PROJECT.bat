@echo off
echo.
echo ========================================
echo 🚀 Deep Learning Full Project Starter
echo ========================================
echo.
echo Ce script va démarrer:
echo 1. Serveur Express (port 3000)
echo 2. Angular Dev Server (port 4200)
echo.
echo Appuyez sur une touche pour continuer...
pause

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo ❌ node_modules non trouvé. Installation des dépendances...
    call npm install
)

echo.
echo ========================================
echo 📍 Démarrage du serveur Express...
echo ========================================
echo Backend: http://localhost:3000
echo API MNIST: http://localhost:3000/api/mnist/random
echo Health Check: http://localhost:3000/api/health
echo.

REM Démarrer le serveur Express dans une nouvelle fenêtre
start "Express Server" cmd /k "node server/index.js"

REM Attendre un peu que le serveur démarre
timeout /t 3 /nobreak

echo.
echo ========================================
echo 📍 Démarrage du serveur Angular...
echo ========================================
echo Frontend: http://localhost:4200
echo.

REM Démarrer Angular dans une nouvelle fenêtre
start "Angular Dev Server" cmd /k "npm run ng:serve"

echo.
echo ========================================
echo ✅ Les deux serveurs sont en cours de démarrage!
echo ========================================
echo.
echo Accédez à l'application: http://localhost:4200
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause
