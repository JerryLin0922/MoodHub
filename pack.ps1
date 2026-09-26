# MoodHub packaging script (Windows PowerShell).
$ErrorActionPreference = 'Stop'

Write-Host '==> [1/4] Install root dependencies'
npm install

Write-Host '==> [2/4] Type check + build web'
npm run build

Write-Host '==> [3/4] Install Electron builder deps'
Push-Location electron
npm install
Pop-Location

Write-Host '==> [4/4] Package desktop app'
Push-Location electron
npx electron-builder --win nsis portable
Pop-Location

Write-Host '==> Done. Artifacts in release/'
