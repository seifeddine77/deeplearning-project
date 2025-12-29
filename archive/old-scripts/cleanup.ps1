# Script de nettoyage du projet
$keep = @(
    'README.md',
    'SETUP.md',
    'API_EXAMPLES.md',
    'TESTING_GUIDE.md',
    'DEVELOPMENT.md',
    'ARCHITECTURE_DIAGRAM.md',
    'ANALYSE_COMPLETE_DEC_15.md',
    'DIAGNOSTIC_DETAILLE_DEC_15.md',
    'RAPPORT_ANALYSE_COMPLET_DEC_15.md',
    'PLAN_NETTOYAGE_DETAILLE.md',
    'ANALYSE_FINALE_RECOMMANDATIONS.md',
    'SYNTHESE_ANALYSE_COMPLETE.md'
)

Write-Host "=== NETTOYAGE DU PROJET ===" -ForegroundColor Green
Write-Host ""

# Supprimer les fichiers .md obsolètes
Write-Host "1. Suppression des fichiers .md obsolètes..." -ForegroundColor Cyan
$mdFiles = Get-ChildItem -Filter '*.md' -File | Where-Object {$_.Name -notin $keep}
$mdCount = ($mdFiles | Measure-Object).Count
$mdFiles | Remove-Item -Force
Write-Host ("   OK deleted md files: " + $mdCount) -ForegroundColor Green

# Supprimer les fichiers test obsolètes
Write-Host "2. Suppression des fichiers test obsolètes..." -ForegroundColor Cyan
$keepTests = @('test-complete-workflow.js', 'test-final-verification.js')
$testFiles = Get-ChildItem -Filter 'test-*.js' -File | Where-Object {$_.Name -notin $keepTests}
$testCount = ($testFiles | Measure-Object).Count
$testFiles | Remove-Item -Force
Write-Host ("   OK deleted test files: " + $testCount) -ForegroundColor Green

# Supprimer les routes dupliquées
Write-Host "3. Suppression des routes dupliquées..." -ForegroundColor Cyan
$routesToDelete = @(
    'server/routes/auth.js',
    'server/routes/model.js',
    'server/routes/data.js',
    'server/routes/training.js',
    'server/routes/deployment-routes.js',
    'server/routes/monitoring-routes.js',
    'server/routes/simulator-3d-routes.js',
    'server/routes/validation-routes.js'
)
$routeCount = 0
foreach ($route in $routesToDelete) {
    if (Test-Path $route) {
        Remove-Item $route -Force
        $routeCount++
    }
}
Write-Host ("   OK deleted route files: " + $routeCount) -ForegroundColor Green

Write-Host ""
Write-Host '=== RESUME DU NETTOYAGE ===' -ForegroundColor Green
Write-Host ('MD supprimes: ' + $mdCount)
Write-Host ('Tests supprimes: ' + $testCount)
Write-Host ('Routes supprimees: ' + $routeCount)
Write-Host ('Total supprime: ' + ($mdCount + $testCount + $routeCount))
Write-Host ''
Write-Host 'Prochaine etape: package.json / npm install' -ForegroundColor Yellow
