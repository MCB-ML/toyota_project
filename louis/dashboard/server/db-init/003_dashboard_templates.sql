-- 본사(scope_key='hq')가 저장한 대시보드를 "템플릿"으로 승격해 모든 딜러사가 커스텀
-- 대시보드를 새로 만들 때 시작 레이아웃으로 불러올 수 있게 한다. 별도 테이블 없이
-- dashboard_saved_pages를 그대로 재사용 — 템플릿 = scope_key='hq' AND is_template=true.
-- 신규 볼륨엔 docker-entrypoint-initdb.d로 자동 실행되고, 이미 떠있는 컨테이너엔 이 파일을
-- 그대로 psql로 재실행하면 된다(멱등, IF NOT EXISTS/ADD COLUMN IF NOT EXISTS뿐이라 안전).

ALTER TABLE dashboard_saved_pages ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS dashboard_saved_pages_templates
  ON dashboard_saved_pages (is_template)
  WHERE is_template;
