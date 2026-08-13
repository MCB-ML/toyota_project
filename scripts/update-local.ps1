[CmdletBinding()]
param(
  [switch]$ResetVolumes
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot
. (Join-Path $PSScriptRoot 'local-env.ps1')

Ensure-RootEnv $repoRoot

if ($ResetVolumes) {
  docker compose down -v --remove-orphans
}

if (-not (Test-Path -LiteralPath 'admin\backend\certs\private.pem') -or -not (Test-Path -LiteralPath 'admin\backend\certs\public.pem')) {
  docker compose build admin-backend
  docker run --rm -v "${repoRoot}:/workspace" -w /workspace toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs
}

docker compose up -d --build --remove-orphans
docker compose --profile tools run --rm db-seed
docker compose --profile tools run --rm dev-accounts
docker compose --profile tools run --rm rag-seed
docker compose ps