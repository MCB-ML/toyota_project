#!/usr/bin/env bash
# First-time local setup. macOS/Linux counterpart of setup-local.ps1.
#   ./scripts/setup-local.sh [--reset-volumes] [--no-bootstrap]
set -euo pipefail

reset_volumes=0
no_bootstrap=0
for arg in "$@"; do
  case "$arg" in
    --reset-volumes) reset_volumes=1 ;;
    --no-bootstrap) no_bootstrap=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"
# shellcheck source=local-env.sh
. "$script_dir/local-env.sh"

ensure_root_env "$repo_root"

if [ "$reset_volumes" -eq 1 ]; then
  docker compose down -v --remove-orphans
fi

# Build the backend image first: it carries the Python cryptography package used for local certs.
docker compose build admin-backend

mkdir -p admin/backend/certs
docker run --rm -v "$repo_root:/workspace" -w /workspace \
  toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs

docker compose up -d --build --remove-orphans
docker compose --profile tools run --rm db-seed

# Development accounts (password 121212). Idempotent; see db/admin/060_dev_accounts.sql.
docker compose --profile tools run --rm dev-accounts

# RAG knowledge base (Pattern/Fragment/Rule/Source rows). Postgres-only, safe to rerun.
docker compose --profile tools run --rm rag-seed

# Embeddings need an Azure OpenAI embedding deployment, so only run them when configured.
embedding_key="$(get_dotenv_value "$repo_root" 'AZURE_OPENAI_KEY')"
embedding_deployment="$(get_dotenv_value "$repo_root" 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT')"
if [ -n "$embedding_key" ] && [ -n "$embedding_deployment" ]; then
  docker compose --profile tools run --rm rag-embeddings
else
  echo 'Skipped RAG embeddings. Set AZURE_OPENAI_KEY and AZURE_OPENAI_EMBEDDING_DEPLOYMENT in .env, then run:'
  echo '  docker compose --profile tools run --rm rag-embeddings'
fi

email="$(get_dotenv_value "$repo_root" 'ADMIN_BOOTSTRAP_EMAIL')"
password="$(get_dotenv_value "$repo_root" 'ADMIN_BOOTSTRAP_PASSWORD')"
if [ "$no_bootstrap" -eq 0 ] && [ -n "$email" ] && [ -n "$password" ]; then
  docker compose --profile tools run --rm admin-bootstrap
else
  echo 'Admin account was not bootstrapped because ADMIN_BOOTSTRAP_EMAIL/PASSWORD are empty in .env.'
fi

echo ''
echo 'Local stack is ready:'
echo '  service       http://localhost:3000'
echo '  admin         http://localhost:8088'
echo '  admin API     http://localhost:8090'
echo '  postgres      localhost:5433'
echo ''
echo 'To create an admin account later, set ADMIN_BOOTSTRAP_EMAIL/PASSWORD in .env and run:'
echo '  docker compose --profile tools run --rm admin-bootstrap'
