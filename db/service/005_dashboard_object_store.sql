-- Dashboard persistence v2.
-- Page metadata, durable object specifications, and object revisions are stored
-- separately. Runtime result props are deliberately never persisted.

CREATE TABLE IF NOT EXISTS dashboard_pages (
  page_id         BIGSERIAL PRIMARY KEY,
  scope_key       TEXT NOT NULL REFERENCES dashboard_scopes(scope_key),
  name            TEXT NOT NULL,
  target_page_key TEXT,
  is_deployed     BOOLEAN NOT NULL DEFAULT false,
  is_template     BOOLEAN NOT NULL DEFAULT false,
  version         INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope_key, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_pages_one_deploy_per_tab
  ON dashboard_pages (scope_key, target_page_key)
  WHERE is_deployed;

CREATE INDEX IF NOT EXISTS dashboard_pages_scope_updated
  ON dashboard_pages (scope_key, updated_at DESC);

CREATE INDEX IF NOT EXISTS dashboard_pages_templates
  ON dashboard_pages (is_template, updated_at DESC)
  WHERE is_template;

CREATE TABLE IF NOT EXISTS dashboard_objects (
  object_id       TEXT PRIMARY KEY,
  page_id         BIGINT NOT NULL REFERENCES dashboard_pages(page_id) ON DELETE CASCADE,
  object_type     TEXT NOT NULL,
  renderer_type   TEXT NOT NULL,
  chart_code      TEXT NOT NULL,
  title           TEXT NOT NULL,
  query_bundle    JSONB NOT NULL DEFAULT '{}'::jsonb,
  query_spec      JSONB NOT NULL DEFAULT '{}'::jsonb,
  object_spec     JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout          JSONB NOT NULL DEFAULT '{}'::jsonb,
  refresh_policy  JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_meta     JSONB NOT NULL DEFAULT '{}'::jsonb,
  object_version  INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dashboard_objects_page_order
  ON dashboard_objects (page_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS dashboard_page_versions (
  page_id         BIGINT NOT NULL REFERENCES dashboard_pages(page_id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  object_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (page_id, version)
);

CREATE TABLE IF NOT EXISTS dashboard_object_versions (
  page_id         BIGINT NOT NULL REFERENCES dashboard_pages(page_id) ON DELETE CASCADE,
  object_id       TEXT NOT NULL,
  version         INTEGER NOT NULL,
  operation       TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  object_snapshot JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (page_id, object_id, version)
);

CREATE INDEX IF NOT EXISTS dashboard_object_versions_recent
  ON dashboard_object_versions (page_id, object_id, version DESC);

-- Current public deployment per scope/tab. Saved pages remain editable; this table
-- pins the exact saved page version that public tabs should render.
CREATE TABLE IF NOT EXISTS dashboard_deployments (
  scope_key       TEXT NOT NULL REFERENCES dashboard_scopes(scope_key) ON DELETE CASCADE,
  target_page_key TEXT NOT NULL,
  page_id         BIGINT NOT NULL REFERENCES dashboard_pages(page_id) ON DELETE CASCADE,
  page_version    INTEGER NOT NULL,
  deployed_by     TEXT,
  deployed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_key, target_page_key)
);

CREATE INDEX IF NOT EXISTS dashboard_deployments_page
  ON dashboard_deployments (page_id);

-- Append-only deployment audit trail. page_id intentionally has no FK so history
-- can still explain deleted saved pages.
CREATE TABLE IF NOT EXISTS dashboard_deployment_logs (
  id              BIGSERIAL PRIMARY KEY,
  scope_key       TEXT NOT NULL,
  target_page_key TEXT NOT NULL,
  page_id         BIGINT,
  page_version    INTEGER,
  action          TEXT NOT NULL CHECK (action IN ('deploy', 'replace', 'rollback')),
  actor_email     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dashboard_deployment_logs_target_recent
  ON dashboard_deployment_logs (scope_key, target_page_key, created_at DESC);
