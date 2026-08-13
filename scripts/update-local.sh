#!/usr/bin/env bash
# Pull-then-refresh for an existing local stack. Counterpart of update-local.ps1.
#   ./scripts/update-local.sh [--reset-volumes]
set -euo pipefail

reset_volumes=0
for arg in "$@"; do
  case "$arg" in
    --reset-volumes) reset_volumes=1 ;;
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

if [ ! -f admin/backend/certs/private.pem ] || [ ! -f admin/backend/certs/public.pem ]; then
  docker compose build admin-backend
  docker run --rm -v "$repo_root:/workspace" -w /workspace \
    toyota-dashboard-admin-backend:local python scripts/generate_jwt_certs.py admin/backend/certs
fi

docker compose up -d --build --remove-orphans
docker compose --profile tools run --rm db-seed
docker compose --profile tools run --rm dev-accounts
docker compose --profile tools run --rm rag-seed
docker compose ps
