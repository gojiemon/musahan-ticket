param(
  [int]$Port = 3000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Starting Next.js dev server on 127.0.0.1:$Port ..." -ForegroundColor Cyan

# Move to repo root (script located at scripts/)
Set-Location (Join-Path $PSScriptRoot '..')

# Ensure APP_BASE_URL matches the chosen port (in-process env var)
$env:APP_BASE_URL = "http://localhost:$Port"

# Clean previous build (optional)
if (Test-Path '.next') { Remove-Item '.next' -Recurse -Force -ErrorAction SilentlyContinue }

# Start server
npm run dev -- -p $Port -H 127.0.0.1

