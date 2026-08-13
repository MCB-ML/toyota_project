# Shared helpers for setup-local.sh / update-local.sh.
# Sourced, not executed.

random_hex() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    head -c "$bytes" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

get_dotenv_value() {
  local repo_root="$1" key="$2"
  local env_path="$repo_root/.env"
  [ -f "$env_path" ] || return 0
  sed -n "s/^[[:space:]]*${key}[[:space:]]*=//p" "$env_path" \
    | head -n 1 \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

set_dotenv_value() {
  local repo_root="$1" key="$2" value="$3"
  local env_path="$repo_root/.env"
  touch "$env_path"
  if grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$env_path"; then
    local tmp="${env_path}.tmp"
    sed "s|^[[:space:]]*${key}[[:space:]]*=.*$|${key}=${value}|" "$env_path" > "$tmp"
    mv "$tmp" "$env_path"
  else
    [ -s "$env_path" ] && [ "$(tail -c 1 "$env_path")" != "" ] && printf '\n' >> "$env_path"
    printf '%s=%s\n' "$key" "$value" >> "$env_path"
  fi
}

ensure_root_env() {
  local repo_root="$1"
  if [ ! -f "$repo_root/.env" ]; then
    cp "$repo_root/.env.example" "$repo_root/.env"
    echo 'Created .env from .env.example'
  fi

  local secret
  secret="$(get_dotenv_value "$repo_root" 'ADMIN_SECRET_KEY')"
  if [ -z "$secret" ]; then
    set_dotenv_value "$repo_root" 'ADMIN_SECRET_KEY' "$(random_hex 32)"
    echo 'Created ADMIN_SECRET_KEY in .env'
  fi
}
