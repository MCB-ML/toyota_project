"""Create or repair the first admin account for local Docker deployments.

This script intentionally has no default email or password. Run it through the
`admin-bootstrap` compose profile with ADMIN_BOOTSTRAP_EMAIL and
ADMIN_BOOTSTRAP_PASSWORD set in the shell.
"""

import asyncio
import os
import re
import sys

import asyncpg
import bcrypt

VALID_ROLES = {"admin", "user", "viewer"}


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"{name} is required")
    return value


def _bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _port() -> int:
    raw = os.getenv("DATABASE_PG_PORT", "5432")
    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError("DATABASE_PG_PORT must be an integer") from exc


def _ssl_mode():
    mode = os.getenv("DATABASE_PG_SSLMODE", "disable").strip().lower()
    return None if mode in {"", "disable", "allow", "prefer"} else True


def _validate(email: str, password: str, role: str) -> None:
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise ValueError("ADMIN_BOOTSTRAP_EMAIL must be a valid email address")
    if len(password) < 8:
        raise ValueError("ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters")
    if role not in VALID_ROLES:
        raise ValueError(f"ADMIN_BOOTSTRAP_ROLE must be one of {sorted(VALID_ROLES)}")


async def main() -> int:
    email = _required("ADMIN_BOOTSTRAP_EMAIL").lower()
    password = _required("ADMIN_BOOTSTRAP_PASSWORD")
    name = os.getenv("ADMIN_BOOTSTRAP_NAME", "Toyota Admin").strip() or "Toyota Admin"
    scope_key = os.getenv("ADMIN_BOOTSTRAP_SCOPE_KEY", "hq").strip() or "hq"
    role = os.getenv("ADMIN_BOOTSTRAP_ROLE", "admin").strip() or "admin"
    user_access = os.getenv("ADMIN_BOOTSTRAP_ACCESS", "full access").strip() or "full access"
    language = os.getenv("ADMIN_BOOTSTRAP_LANGUAGE", "kr").strip() or "kr"
    update_existing = _bool("ADMIN_BOOTSTRAP_UPDATE_EXISTING", False)

    _validate(email, password, role)

    conn = await asyncpg.connect(
        host=os.getenv("DATABASE_PG_HOST", "localhost"),
        port=_port(),
        database=os.getenv("DATABASE_PG_NAME", "toyota_dashboard"),
        user=os.getenv("DATABASE_PG_USER", "dashboard"),
        password=os.getenv("DATABASE_PG_PASSWORD", "dashboard"),
        ssl=_ssl_mode(),
    )

    try:
        company = await conn.fetchrow(
            """
            SELECT c.company_info_id, c.company_info_name
            FROM dbo."ScopeCompany_map" m
            JOIN dbo."CompanyInfo_master" c ON c.company_info_id = m.company_info_id
            WHERE m.scope_key = $1
            """,
            scope_key,
        )
        if not company:
            raise ValueError(f"No admin company mapping found for scope key: {scope_key}")

        existing = await conn.fetchrow(
            'SELECT user_id, user_role FROM dbo."User_master" WHERE lower(user_email) = $1',
            email,
        )
        if existing and not update_existing:
            print(
                "Admin account already exists; set ADMIN_BOOTSTRAP_UPDATE_EXISTING=true "
                "to update its password or role.",
                flush=True,
            )
            return 0

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        row = await conn.fetchrow(
            """
            INSERT INTO dbo."User_master" (
                user_name,
                user_email,
                user_password,
                user_role,
                user_access,
                user_department,
                default_company,
                default_language,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            ON CONFLICT (user_email) DO UPDATE SET
                user_name = EXCLUDED.user_name,
                user_password = EXCLUDED.user_password,
                user_role = EXCLUDED.user_role,
                user_access = EXCLUDED.user_access,
                user_department = EXCLUDED.user_department,
                default_company = EXCLUDED.default_company,
                default_language = EXCLUDED.default_language,
                is_active = true,
                updated_at = now()
            RETURNING user_id, user_email, user_role
            """,
            name,
            email,
            hashed_password,
            role,
            user_access,
            scope_key,
            company["company_info_id"],
            language,
        )
        print(
            f"Bootstrapped {row['user_role']} account {row['user_email']} "
            f"for scope {scope_key} ({company['company_info_name']}).",
            flush=True,
        )
        return 0
    finally:
        await conn.close()


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:
        print(f"bootstrap_admin failed: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(2)
