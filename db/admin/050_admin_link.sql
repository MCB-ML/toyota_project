-- =====================================================================
-- 에이전트와 어드민을 잇는 다리 (데이터)
--
-- 에이전트는 딜러사를 scope_key('hq' | 'dealer:렉서스 강남')로 다루고,
-- 어드민은 company_info_id(uuid)로 다룬다. 이 둘을 이어 주는 값을 채운다.
-- 테이블 정의(dbo."ScopeCompany_map") 자체는 010_admin_schema.sql 에 있다.
--
-- 실행 순서가 중요하다. 앞서 두 가지가 있어야 한다:
--   1) dashboard_scopes          ← db/service/001_app_schema.sql
--   2) dbo."CompanyInfo_master"  ← db/admin/010_admin_schema.sql
--
-- UUID 는 scope_key 에서 결정적으로 만든다(md5). 개발 DB 를 지웠다 다시
-- 세워도 같은 값이 나오므로, 먼저 저장해 둔 대시보드나 사용자 배정이 끊기지 않는다.
-- =====================================================================

INSERT INTO dbo."CompanyInfo_master" (company_info_id, company_info_name, description)
SELECT md5(s.scope_key)::uuid,
       -- 본사는 화면에서 TMKR 로 부른다. dashboard_scopes 에는 '본사'로 들어 있다.
       CASE WHEN s.role = 'hq' THEN 'TMKR' ELSE s.dealer_name END,
       'dashboard_scopes(' || s.scope_key || ') 에서 자동 생성'
  FROM dashboard_scopes s
ON CONFLICT (company_info_id) DO NOTHING;

INSERT INTO dbo."ScopeCompany_map" (scope_key, company_info_id)
SELECT s.scope_key, md5(s.scope_key)::uuid
  FROM dashboard_scopes s
ON CONFLICT (scope_key) DO NOTHING;
