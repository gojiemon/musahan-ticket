param([string]$Message="snapshot", [string]$Remote=$null)
$ErrorActionPreference='Stop'
if (!(Get-Command git -ErrorAction SilentlyContinue)) { Write-Host 'Git が必要です。winget install -e --id Git.Git' -ForegroundColor Yellow; throw 'git not found' }
if (!(Test-Path .git)) { git init | Out-Null }
if (-not (git config --get user.name)) { git config user.name "Your Name" }
if (-not (git config --get user.email)) { git config user.email "you@example.com" }
git add -A
try { git commit -m $Message } catch {}
$tag = "snapshot-" + (Get-Date -Format "yyyyMMdd-HHmm")
git tag -a $tag -m $tag
git branch -M main
if ($Remote) {
if (git remote | Select-String origin) { git remote set-url origin $Remote } else { git remote add origin $Remote }
}
if (git remote | Select-String origin) { git push -u origin main; git push origin --tags } else { Write-Host "origin 未設定のため push はスキップしました。" -ForegroundColor Yellow }
Write-Host ("Done. Restore: git reset --hard {0}" -f $tag) -ForegroundColor Green
