# Postgres Ownership

The local stack uses one shared Postgres container. The database is shared, but schema ownership is intentionally split by runtime responsibility.

## Canonical Owners

All schema files live under this `db/` directory, split by owning runtime.

| Owner | Files | Schema / tables | Purpose |
|---|---|---|---|
| service | `db/service/*.sql` | `public.dashboard_scopes`, `public.dashboard_pages`, `public.dashboard_objects`, RAG tables | Dashboard runtime, saved pages, RAG metadata |
| admin | `db/admin/010_admin_schema.sql` | `dbo.*`, `agent.*` | Companies, users, models, prompts, agent chat/token logs |
| link | `db/admin/050_admin_link.sql` | rows in `dbo."ScopeCompany_map"` | Connects service `scope_key` to admin `company_info_id` |
| dev | `db/admin/060_dev_accounts.sql` | rows in `dbo."User_master"` | Local-only login accounts (see root README) |

The service image copies `db/service/` to `/app/db/service/` so `npm run db:seed` and
`npm run rag:seed` read the same SQL inside the container as they do in the repository
(`service/backend/dbSchemaDir.js` resolves whichever path exists).

## Important Rule

Do not create a `dashboard` Postgres schema for local runtime tables.

The default local DB user is currently `dashboard`. Postgres resolves unqualified table names through `search_path="$user", public`. If a schema named `dashboard` exists and contains tables like `dashboard_pages`, service queries can hit the wrong table before `public.dashboard_pages`.

The service connection therefore sets:

```env
PG_SEARCH_PATH=public
```

This keeps service reads/writes on the public service-owned tables even when older local volumes still contain a legacy `dashboard` schema.

## Fresh DB Init Order

Root `docker-compose.yml` initializes Postgres in this order:

```text
001_service_app_schema.sql              service tables + dashboard_scopes rows
002_service_rag_poc.sql                 RAG tables
005_service_dashboard_object_store.sql
006_service_table_column_visibility.sql
007_service_dashboard_page_owner.sql    per-user ownership of saved dashboards
010_admin_schema.sql                    dbo + agent schemas
050_admin_link.sql                      needs 001 and 010 to exist first
060_dev_accounts.sql                    needs 050 (accounts point at a company)
```

Order matters: `050` reads `dashboard_scopes` (from `001`) to fill
`dbo."CompanyInfo_master"`, and `060` joins `dbo."ScopeCompany_map"` (from `050`)
to resolve each account's company.

`010_admin_schema.sql` was regenerated with `pg_dump` from a working local database.
The previous three files (`schema_postgres_core/_agent/_link.sql`) had been corrupted by
an encoding round-trip that swallowed newlines and closing quotes, so `initdb` failed
outright on a fresh volume. Regenerate the same way if it ever drifts:

```bash
docker compose exec -T postgres pg_dump -U dashboard -d toyota_dashboard \
  --schema-only --no-owner --no-privileges --schema=dbo --schema=agent
```

Strip the `\restrict` / `\unrestrict` psql meta-commands from the output — `initdb`
runs the file through `psql` in a mode where they abort the script.

## Existing Local Volumes

`initdb` only runs on an empty volume. For a volume you already have, the setup/update
scripts reapply the idempotent parts after containers start: `db-seed` (service schema)
and `dev-accounts` (development logins). Neither deletes data.

Use `-ResetVolumes` / `--reset-volumes` only when you intentionally want to delete local
Postgres and Chroma data.