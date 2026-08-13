[CmdletBinding()]
param(
  [switch]$ResetVolumes,
  [switch]$NoBootstrap
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot
. (Join-Path $PSScriptRoot 'local-env.ps1')

Ensure-RootEnv $repoRoot

if ($ResetVolumes) {
  docker compose down -v --remove-orphans
}

# Build backend image first because it contains the Python cryptography package used to generate local certs.
docker compose build admin-backend

$certDir = Join-Path $repoRoot 'admin\backend\certs'
New-Item -ItemType Directory -Force -Path $certDir | Out-Null
docker run --rm -v "${repoRoot}:/workspace" -w /workspace toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs

docker compose up -d --build --remove-orphans
docker compose --profile tools run --rm db-seed

# Development accounts (password 121212). Idempotent; see db/admin/060_dev_accounts.sql.
docker compose --profile tools run --rm dev-accounts

# RAG knowledge base (Pattern/Fragment/Rule/Source rows). Postgres-only, safe to rerun.
docker compose --profile tools run --rm rag-seed

# Embeddings need an Azure OpenAI embedding deployment, so only run them when configured.
$embeddingKey = Get-DotEnvValue $repoRoot 'AZURE_OPENAI_KEY'
$embeddingDeployment = Get-DotEnvValue $repoRoot 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT'
if ($embeddingKey -and $embeddingDeployment) {
  docker compose --profile tools run --rm rag-embeddings
} else {
  Write-Host 'Skipped RAG embeddings. Set AZURE_OPENAI_KEY and AZURE_OPENAI_EMBEDDING_DEPLOYMENT in .env, then run:'
  Write-Host '  docker compose --profile tools run --rm rag-embeddings'
}

$email = Get-DotEnvValue $repoRoot 'ADMIN_BOOTSTRAP_EMAIL'
$password = Get-DotEnvValue $repoRoot 'ADMIN_BOOTSTRAP_PASSWORD'
if (-not $NoBootstrap -and $email -and $password) {
  docker compose --profile tools run --rm admin-bootstrap
} else {
  Write-Host 'Admin account was not bootstrapped because ADMIN_BOOTSTRAP_EMAIL/PASSWORD are empty in .env.'
}

Write-Host ''
Write-Host 'Local stack is ready:'
Write-Host '  service       http://localhost:3000'
Write-Host '  admin         http://localhost:8088'
Write-Host '  admin API     http://localhost:8090'
Write-Host '  postgres      localhost:5433'
Write-Host ''
Write-Host 'To create an admin account later, set ADMIN_BOOTSTRAP_EMAIL/PASSWORD in .env and run:'
Write-Host '  docker compose --profile tools run --rm admin-bootstrap'