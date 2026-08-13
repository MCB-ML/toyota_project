-- ─────────────────────────────────────────────────────────────────────────────
-- 개발 전용 계정 (060)
--
-- 비어 있는 DB 로는 로그인 화면에서 더 나아갈 수 없어서, 권한을 하나씩 넣어 둔다.
-- 비밀번호는 넷 다 `121212` 이고, 아래 값은 그 문자열의 bcrypt(cost 12) 해시다.
-- bcrypt 는 salt 를 해시 안에 담으므로 이 고정 문자열 그대로 검증이 된다
-- (admin/backend .../auth/handler.py 의 bcrypt.checkpw).
--
-- ※ 로컬 개발 전용이다. 운영 DB 에는 적용하지 않는다.
--   `docker compose --profile tools run --rm dev-accounts` 로만 따로 실행되고,
--   새 볼륨으로 시작할 때는 initdb 단계에서 자동 적용된다.
--
-- 앞서 세 가지가 먼저 있어야 한다:
--   1) dashboard_scopes           ← db/service/001_app_schema.sql
--   2) dbo."CompanyInfo_master"   ← db/admin/schema_postgres_core.sql
--   3) dbo."ScopeCompany_map"     ← db/admin/schema_postgres_link.sql
--
-- 소속은 scope_key 로 잡는다. 딜러사 계정은 그 딜러 데이터만 보게 되고,
-- hq(TMKR) 계정은 전사를 본다.
-- ─────────────────────────────────────────────────────────────────────────────

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
SELECT
    v.user_name,
    v.user_email,
    v.user_password,
    v.user_role,
    v.user_access,
    v.scope_key,
    m.company_info_id,
    'kr',
    true
FROM (
    VALUES
        ('Max Kim',  'max.kim@mcloudbridge.com',   '$2b$12$Dir/Qha2PNe3Fcl2ahGTee1lm7MsyHg/kLYCgqO5UHO.0SRYPSeo.', 'admin', 'full access', 'hq'),
        ('Louis',    'louis@mcloudbridge.com',     '$2b$12$B/wwgO4PcvA15ejfigjHIugOSXJId/3d6AJqnMYdqXehvR1O60lJy', 'user',  'read only',   'hq'),
        ('Lumi Han', 'lumi.han@mcloudbridge.com',  '$2b$12$wGWH4Uk1nkvi0dzJP5pVVeGcghdIX2n1MXAqAvw7/iYaJEjDoFC..', 'user',  'read only',   'dealer:토요타 용산'),
        ('Leo Park', 'leo.park@mcloudbridge.com',  '$2b$12$DqjkQXTPI2K2msUYQ54FY.7/2oNY9t2MP7L8Y12FSbbBdO7zLlEeq', 'user',  'read only',   'dealer:렉서스 분당')
) AS v(user_name, user_email, user_password, user_role, user_access, scope_key)
JOIN dbo."ScopeCompany_map" m ON m.scope_key = v.scope_key
ON CONFLICT (user_email) DO UPDATE SET
    user_name        = EXCLUDED.user_name,
    user_password    = EXCLUDED.user_password,
    user_role        = EXCLUDED.user_role,
    user_access      = EXCLUDED.user_access,
    user_department  = EXCLUDED.user_department,
    default_company  = EXCLUDED.default_company,
    default_language = EXCLUDED.default_language,
    is_active        = true,
    updated_at       = now();
