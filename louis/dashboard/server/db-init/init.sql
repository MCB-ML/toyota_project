-- 딜러사/본사 소속 키 디렉터리. 원래는 유저 이메일 → 소속 매핑이 있어야 하지만
-- 아직 없어서(UserContext.jsx의 TODO 참고) 지금은 SelectAccount.jsx가 쓰는
-- dealerMaster(src/data/dummy.js)를 그대로 시드 데이터로 옮겨왔다.
CREATE TABLE IF NOT EXISTS dashboard_scopes (
  scope_key   TEXT PRIMARY KEY,   -- 'hq' 또는 'dealer:<dealerId>'
  role        TEXT NOT NULL,      -- 'hq' | 'dealer'
  dealer_id   TEXT,
  dealer_name TEXT,
  group_name  TEXT,
  brand       TEXT,
  region      TEXT
);

INSERT INTO dashboard_scopes (scope_key, role, dealer_id, dealer_name, group_name, brand, region) VALUES
  ('hq',          'hq',     NULL,   '본사',    NULL,          NULL,     NULL),
  ('dealer:GN01', 'dealer', 'GN01', '강남점',  '센트럴모터스', 'Lexus',  '서울'),
  ('dealer:SM01', 'dealer', 'SM01', '상무점',  '센트럴모터스', 'Lexus',  '광주'),
  ('dealer:BD01', 'dealer', 'BD01', '분당점',  '경기모터스',   'Toyota', '경기'),
  ('dealer:IS01', 'dealer', 'IS01', '일산점',  '경기모터스',   'Toyota', '경기'),
  ('dealer:SS01', 'dealer', 'SS01', '수성점',  '영남모터스',   'Toyota', '대구'),
  ('dealer:US01', 'dealer', 'US01', '울산점',  '영남모터스',   'Lexus',  '울산'),
  ('dealer:YS01', 'dealer', 'YS01', '연수점',  '코스트모터스', 'Toyota', '인천'),
  ('dealer:HD01', 'dealer', 'HD01', '해운대점', '코스트모터스', 'Lexus',  '부산')
ON CONFLICT (scope_key) DO NOTHING;

-- 소속(scope)이 저장해 둔 커스텀 대시보드. 한 scope당 최대 5개(MAX_SAVED_PAGES,
-- server/dashboardPagesHandler.js)까지만 저장 가능 — 카운트 검사는 애플리케이션 단에서 처리.
-- target_page_key/is_deployed는 "배포"(좌측 탭의 기본 화면을 이 저장본으로 교체) 상태를 나타낸다.
CREATE TABLE IF NOT EXISTS dashboard_saved_pages (
  scope_key       TEXT NOT NULL REFERENCES dashboard_scopes(scope_key),
  name            TEXT NOT NULL,             -- 사용자가 정한 저장 이름
  target_page_key TEXT,                      -- 배포 대상 탭(예: 'sales-contract'). 미배포 시 NULL 가능
  is_deployed     BOOLEAN NOT NULL DEFAULT false,
  version         INTEGER NOT NULL DEFAULT 0,
  widgets         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_key, name)
);

-- 같은 scope 안에서 한 탭(target_page_key)에는 배포본이 동시에 하나만 존재하도록 강제.
-- (배포 시 기존 배포를 먼저 is_deployed=false로 내린 뒤 새로 올리므로 충돌 없음.)
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_saved_pages_one_deploy_per_tab
  ON dashboard_saved_pages (scope_key, target_page_key)
  WHERE is_deployed;
