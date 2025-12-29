@echo off
echo.
echo ========================================
echo 🧪 Test API MNIST
echo ========================================
echo.
echo Assurez-vous que le serveur Express est en cours d'exécution!
echo Démarrez-le avec: START_PROJECT.bat
echo.
echo Tests disponibles:
echo 1. Health Check
echo 2. Image MNIST aléatoire
echo 3. Image MNIST par index
echo 4. Statistiques MNIST
echo 5. Quitter
echo.

:menu
set /p choice="Choisissez un test (1-5): "

if "%choice%"=="1" goto health
if "%choice%"=="2" goto random
if "%choice%"=="3" goto index
if "%choice%"=="4" goto stats
if "%choice%"=="5" goto end

echo ❌ Choix invalide. Réessayez.
goto menu

:health
echo.
echo 📍 Test: Health Check
echo URL: http://localhost:3000/api/health
echo.
curl http://localhost:3000/api/health
echo.
pause
goto menu

:random
echo.
echo 📍 Test: Image MNIST aléatoire
echo URL: http://localhost:3000/api/mnist/random
echo.
curl http://localhost:3000/api/mnist/random
echo.
pause
goto menu

:index
echo.
echo 📍 Test: Image MNIST par index
set /p idx="Entrez l'index (0-9999): "
echo URL: http://localhost:3000/api/mnist/image/%idx%
echo.
curl http://localhost:3000/api/mnist/image/%idx%
echo.
pause
goto menu

:stats
echo.
echo 📍 Test: Statistiques MNIST
echo URL: http://localhost:3000/api/mnist/stats
echo.
curl http://localhost:3000/api/mnist/stats
echo.
pause
goto menu

:end
echo.
echo ✅ Tests terminés!
echo.
pause
