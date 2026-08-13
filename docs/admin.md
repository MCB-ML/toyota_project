# Admin Center

Admin is one part of the root Toyota Dashboard stack. Run Docker from the repository root, not from `admin/`.

```powershell
cd C:\codex\toyota-dashboard-web
.\scripts\setup-local.ps1
```

## Runtime Parts

```text
admin/backend/     Python admin API
admin/frontend/    React admin UI
admin/db/          Admin-owned Postgres DDL
```

## Database Ownership

The project uses one shared Postgres database.

| Area | Schema / tables | Owner |
|---|---|---|
| Admin accounts, companies, models, prompts | `dbo.*` | `admin/db/schema_postgres_core.sql` |
| Agent chat/token logs | `agent.*` | `admin/db/schema_postgres_agent.sql` |
| Service scopes to admin companies | `dbo."ScopeCompany_map"` | `admin/db/schema_postgres_link.sql` |
| Saved dashboard pages and objects | `public.dashboard_pages`, `public.dashboard_objects` | `service/backend/db-init/*.sql` |

Admin does not own a separate `dashboard.dashboard_pages` table in the local root stack. Saved pages belong to the service public schema so the service and admin do not maintain duplicate dashboard stores.

## Admin Users

Admin login users are stored in:

```sql
dbo."User_master"
```

To create the first local admin account, set these in the root `.env`:

```env
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=AdminPassword123!
ADMIN_BOOTSTRAP_NAME=Toyota Admin
ADMIN_BOOTSTRAP_SCOPE_KEY=hq
```

Then run:

```powershell
docker compose --profile tools run --rm admin-bootstrap
```

## URLs

```text
admin UI   http://localhost:8088
admin API  http://localhost:8090
```