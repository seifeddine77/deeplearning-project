# ============================================
# PROJECT CLEANUP SCRIPT
# ============================================
# This script organizes the project by archiving old test/doc files

Write-Host "🧹 Starting project cleanup..." -ForegroundColor Cyan

# Create archive directories
Write-Host "`n📁 Creating archive directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "archive\tests" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\docs" | Out-Null
New-Item -ItemType Directory -Force -Path "archive\old-index" | Out-Null

# Move test files
Write-Host "`n📦 Moving test files..." -ForegroundColor Yellow
$testFiles = @(
    "TEST_*.js",
    "DEBUG_*.js",
    "test-*.js"
)

foreach ($pattern in $testFiles) {
    Get-ChildItem -Path . -Filter $pattern -File | ForEach-Object {
        Write-Host "  Moving: $($_.Name)" -ForegroundColor Gray
        Move-Item -Path $_.FullName -Destination "archive\tests\" -Force
    }
}

# Move redundant documentation files
Write-Host "`n📄 Moving redundant documentation..." -ForegroundColor Yellow
$docFiles = @(
    "ANALYSE_*.md",
    "RAPPORT_*.md",
    "SYNTHESE_*.md",
    "DIAGNOSTIC_*.md",
    "PLAN_*.md"
)

foreach ($pattern in $docFiles) {
    Get-ChildItem -Path . -Filter $pattern -File | ForEach-Object {
        Write-Host "  Moving: $($_.Name)" -ForegroundColor Gray
        Move-Item -Path $_.FullName -Destination "archive\docs\" -Force
    }
}

# Move old index files
Write-Host "`n🗂️  Moving old index files..." -ForegroundColor Yellow
$oldIndexFiles = @(
    "server\index-simple.js",
    "server\index-minimal.js"
)

foreach ($file in $oldIndexFiles) {
    if (Test-Path $file) {
        Write-Host "  Moving: $file" -ForegroundColor Gray
        Move-Item -Path $file -Destination "archive\old-index\" -Force
    }
}

# Remove empty backups directory
Write-Host "`n🗑️  Removing empty directories..." -ForegroundColor Yellow
if (Test-Path "backups") {
    $backupsCount = (Get-ChildItem -Path "backups" -Recurse).Count
    if ($backupsCount -eq 0) {
        Write-Host "  Removing: backups\" -ForegroundColor Gray
        Remove-Item -Path "backups" -Recurse -Force
    }
}

# Summary
Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Test files archived: archive\tests\" -ForegroundColor White
Write-Host "  - Docs archived: archive\docs\" -ForegroundColor White
Write-Host "  - Old index files: archive\old-index\" -ForegroundColor White

Write-Host "`n📝 Kept important files:" -ForegroundColor Cyan
Write-Host "  - README.md" -ForegroundColor White
Write-Host "  - QUICK_START.txt" -ForegroundColor White
Write-Host "  - SETUP.md" -ForegroundColor White
Write-Host "  - API_EXAMPLES.md" -ForegroundColor White
Write-Host "  - TESTING_GUIDE.md" -ForegroundColor White
Write-Host "  - AUDIT_COMPLET_PROJET.md (NEW)" -ForegroundColor Green
Write-Host "  - QUICK_WINS_IMPLEMENTATION.md (NEW)" -ForegroundColor Green
Write-Host "  - EXECUTIVE_SUMMARY.md (NEW)" -ForegroundColor Green

Write-Host "`n🎯 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review EXECUTIVE_SUMMARY.md" -ForegroundColor White
Write-Host "  2. Follow QUICK_WINS_IMPLEMENTATION.md" -ForegroundColor White
Write-Host "  3. Revoke exposed API keys (URGENT!)" -ForegroundColor Red
Write-Host "  4. Test the application" -ForegroundColor White

Write-Host ""
