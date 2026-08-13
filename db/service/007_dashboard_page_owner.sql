-- 커스텀 대시보드를 개인 것으로 바꾼다.
--
-- 그전에는 (scope_key, name)으로만 갈려서, 같은 딜러사 사람이면 서로의 작업본이
-- 그대로 보이고 이름이 겹치면 남의 것을 덮어썼다. 딜러사 전체가 함께 보는 것은
-- 배포본(dashboard_deployments)과 본사 템플릿뿐이어야 한다.
--
-- 어드민 저장소의 db/migrations/001_dashboard_page_owner.sql 과 같은 취지지만,
-- 그쪽은 created_by 가 있어 기존 행의 주인을 알 수 있었다. 여기 dashboard_pages 에는
-- 그런 컬럼이 없어서, 배포된 적 있는 페이지는 마지막 배포자를 주인으로 삼고
-- (배포는 자기 작업본만 할 수 있으므로 배포자가 곧 주인이다), 배포 기록조차 없는
-- 행은 주인을 정할 방법이 없어 NULL 로 남긴다.
--
-- NULL 로 남은 행은 핸들러의 소유자 조건(owner_email = 사용자)에 걸려 누구의
-- 작업본 목록에도 나오지 않는다 — "누구 것인지 모르면 아무에게도 안 보인다"가
-- "딜러사 전체에 보인다"보다 안전하다. 배포돼 있던 것은 배포본 경로(page_id 조인)로
-- 계속 보이므로 화면이 비지는 않는다.
--
-- 멱등하다. initdb 와 db:seed 양쪽에서 몇 번 돌아도 안전해야 한다.

ALTER TABLE dashboard_pages
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

COMMENT ON COLUMN dashboard_pages.owner_email
  IS '접근 기준. 조회·저장·삭제·배포가 이 값으로 걸린다. NULL 은 주인을 못 찾은 레거시 행(아무에게도 목록에 안 보인다)';

-- 주인 백필: 마지막으로 이 페이지를 배포한 사람. 이미 주인이 있으면 건드리지 않는다.
UPDATE dashboard_pages p
   SET owner_email = l.actor_email
  FROM (
    SELECT DISTINCT ON (page_id) page_id, actor_email
      FROM dashboard_deployment_logs
     WHERE actor_email IS NOT NULL
     ORDER BY page_id, created_at DESC, id DESC
  ) l
 WHERE l.page_id = p.page_id
   AND p.owner_email IS NULL;

-- 이름은 사람 안에서만 유일하다. 같은 딜러사의 두 사람이 각자 '내 대시보드'를
-- 가질 수 있어야 한다.
--
-- COALESCE 로 감싸는 이유: Postgres 의 UNIQUE 는 NULL 을 서로 다른 값으로 본다.
-- owner_email 을 그대로 쓰면 레거시 행(NULL)과 같은 이름이 얼마든지 더 생겨서
-- 조회가 어느 행을 집을지 알 수 없게 된다.
DROP INDEX IF EXISTS dashboard_pages_scope_owner_name;
ALTER TABLE dashboard_pages DROP CONSTRAINT IF EXISTS dashboard_pages_scope_key_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_pages_scope_owner_name
  ON dashboard_pages (scope_key, COALESCE(owner_email, ''), name);

-- 목록 조회는 언제나 딜러사 + 소유자로 들어온다.
CREATE INDEX IF NOT EXISTS dashboard_pages_scope_owner_updated
  ON dashboard_pages (scope_key, owner_email, updated_at DESC);
