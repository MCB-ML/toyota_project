CREATE TABLE IF NOT EXISTS dashboard_scopes (
  scope_key   TEXT PRIMARY KEY,
  role        TEXT NOT NULL,
  dealer_id   TEXT,
  dealer_name TEXT,
  group_name  TEXT,
  brand       TEXT,
  region      TEXT
);

INSERT INTO dashboard_scopes (scope_key, role, dealer_id, dealer_name, group_name, brand, region) VALUES
  ('hq', 'hq', NULL, '본사', NULL, NULL, NULL),
  ('dealer:토요타 강남', 'dealer', '토요타 강남', '토요타 강남', NULL, 'Toyota', '서울'),
  ('dealer:토요타 서초', 'dealer', '토요타 서초', '토요타 서초', NULL, 'Toyota', '서울'),
  ('dealer:토요타 용산', 'dealer', '토요타 용산', '토요타 용산', NULL, 'Toyota', '서울'),
  ('dealer:토요타 분당', 'dealer', '토요타 분당', '토요타 분당', NULL, 'Toyota', '경기'),
  ('dealer:토요타 대전', 'dealer', '토요타 대전', '토요타 대전', NULL, 'Toyota', '대전'),
  ('dealer:토요타 대구', 'dealer', '토요타 대구', '토요타 대구', NULL, 'Toyota', '대구'),
  ('dealer:토요타 광주', 'dealer', '토요타 광주', '토요타 광주', NULL, 'Toyota', '광주'),
  ('dealer:토요타 부산', 'dealer', '토요타 부산', '토요타 부산', NULL, 'Toyota', '부산'),
  ('dealer:렉서스 강남', 'dealer', '렉서스 강남', '렉서스 강남', NULL, 'Lexus', '서울'),
  ('dealer:렉서스 용산', 'dealer', '렉서스 용산', '렉서스 용산', NULL, 'Lexus', '서울'),
  ('dealer:렉서스 분당', 'dealer', '렉서스 분당', '렉서스 분당', NULL, 'Lexus', '경기'),
  ('dealer:렉서스 인천', 'dealer', '렉서스 인천', '렉서스 인천', NULL, 'Lexus', '인천'),
  ('dealer:렉서스 대전', 'dealer', '렉서스 대전', '렉서스 대전', NULL, 'Lexus', '대전'),
  ('dealer:렉서스 대구', 'dealer', '렉서스 대구', '렉서스 대구', NULL, 'Lexus', '대구'),
  ('dealer:렉서스 광주', 'dealer', '렉서스 광주', '렉서스 광주', NULL, 'Lexus', '광주'),
  ('dealer:렉서스 부산', 'dealer', '렉서스 부산', '렉서스 부산', NULL, 'Lexus', '부산')
ON CONFLICT (scope_key) DO UPDATE SET
  role = EXCLUDED.role,
  dealer_id = EXCLUDED.dealer_id,
  dealer_name = EXCLUDED.dealer_name,
  group_name = EXCLUDED.group_name,
  brand = EXCLUDED.brand,
  region = EXCLUDED.region;
