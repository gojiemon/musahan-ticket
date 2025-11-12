Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Join-Path $PSScriptRoot '..')
Set-Location $root
$envFile = '.env.local'

if (-not (Test-Path $envFile)) {
  "APP_BASE_URL=http://localhost:3000" | Out-File -FilePath $envFile -Encoding UTF8
}

function Set-Or-Replace([string]$Key, [string]$Value) {
  $content = Get-Content $envFile -Raw
  if ($content -match "(?m)^$Key=") {
    $content = [regex]::Replace($content, "(?m)^$Key=.*$", "$Key=$Value")
  } else {
    if (-not $content.EndsWith("`n")) { $content += "`n" }
    $content += "$Key=$Value`n"
  }
  $content | Out-File -FilePath $envFile -Encoding UTF8
}

$port = Read-Host '使用するポート番号を入力 (例: 3000)'
if ([string]::IsNullOrWhiteSpace($port)) { $port = '3000' }
Set-Or-Replace 'APP_BASE_URL' "http://localhost:$port"

$url  = Read-Host 'NEXT_PUBLIC_SUPABASE_URL を入力'
$anon = Read-Host 'NEXT_PUBLIC_SUPABASE_ANON_KEY を入力'
$svc  = Read-Host 'SUPABASE_SERVICE_ROLE_KEY を入力 (サーバ用・外部に共有しない)'

if (-not [string]::IsNullOrWhiteSpace($url))  { Set-Or-Replace 'NEXT_PUBLIC_SUPABASE_URL' $url }
if (-not [string]::IsNullOrWhiteSpace($anon)) { Set-Or-Replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY' $anon }
if (-not [string]::IsNullOrWhiteSpace($svc))  { Set-Or-Replace 'SUPABASE_SERVICE_ROLE_KEY' $svc }

if (-not (Select-String -Path $envFile -Pattern '^NEXT_PUBLIC_HCAPTCHA_SITEKEY=' -SimpleMatch -ErrorAction SilentlyContinue)) {
  Add-Content $envFile "NEXT_PUBLIC_HCAPTCHA_SITEKEY=10000000-ffff-ffff-ffff-000000000001"
}
if (-not (Select-String -Path $envFile -Pattern '^HCAPTCHA_SECRET=' -SimpleMatch -ErrorAction SilentlyContinue)) {
  Add-Content $envFile "HCAPTCHA_SECRET=0x0000000000000000000000000000000000000000"
}

Write-Host "環境変数を $envFile に書き込みました。" -ForegroundColor Green

