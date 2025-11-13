param(
  [string]$Message = $null,
  [string]$Remote = $null
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-Git {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'Git が見つかりません。winget で Git をインストールしてください: winget install -e --id Git.Git' -ForegroundColor Yellow
    throw 'git not found'
  }
}

function Ensure-Repo {
  if (-not (Test-Path '.git')) {
    git init | Out-Null
  }
}

function Ensure-Identity {
  $name = git config --get user.name 2>$null
  $email = git config --get user.email 2>$null
  if (-not $name) {
    $name = Read-Host 'Git user.name を入力 (例: Your Name)'
    if ($name) { git config user.name $name | Out-Null }
  }
  if (-not $email) {
    $email = Read-Host 'Git user.email を入力 (例: you@example.com)'
    if ($email) { git config user.email $email | Out-Null }
  }
}

function Ensure-MainBranch {
  git branch -M main | Out-Null
}

function Ensure-RemoteOrigin {
  param([string]$RemoteUrl)
  $existing = git remote get-url origin 2>$null
  if (-not $existing) {
    if (-not $RemoteUrl) {
      $RemoteUrl = Read-Host 'GitHub リポジトリの URL を入力 (例: https://github.com/あなた/musahan-ticket.git)'
    }
    if ($RemoteUrl) {
      git remote add origin $RemoteUrl | Out-Null
    } else {
      Write-Host 'origin は未設定のままです。push をスキップします。' -ForegroundColor Yellow
    }
  }
}

function Snapshot {
  param([string]$Msg)
  if (-not $Msg) {
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
    $Msg = "snapshot: working state $stamp"
  }
  git add -A | Out-Null
  # 変更が無い場合はコミットをスキップ
  $status = git status --porcelain
  if (-not $status) {
    Write-Host '変更はありません。直近のコミットにタグのみ付与します。' -ForegroundColor Yellow
  } else {
    git commit -m $Msg | Out-Null
  }
  $tag = 'snapshot-' + (Get-Date -Format 'yyyyMMdd-HHmm')
  git tag -a $tag -m $tag | Out-Null
  return $tag
}

function Push-All {
  $origin = git remote get-url origin 2>$null
  if ($origin) {
    git push -u origin main
    git push origin --tags
  } else {
    Write-Host 'origin が未設定のため push をスキップしました。' -ForegroundColor Yellow
  }
}

try {
  Require-Git
  Ensure-Repo
  Ensure-Identity
  Ensure-MainBranch
  Ensure-RemoteOrigin -RemoteUrl $Remote
  $createdTag = Snapshot -Msg $Message
  Write-Host ("スナップショット作成: {0}" -f $createdTag) -ForegroundColor Green
  Push-All
  Write-Host "完了。復元は: git reset --hard $createdTag" -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}

