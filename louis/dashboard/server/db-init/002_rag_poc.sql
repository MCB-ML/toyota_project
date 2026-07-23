-- Pattern/Fragment/Rule/Source 지식베이스 — rag-poc/의 10-stage Text2SQL 파이프라인용.
-- 신규 볼륨엔 docker-entrypoint-initdb.d로 자동 실행되고, 이미 떠있는 컨테이너엔
-- rag-poc/seedKnowledgeBase.js가 이 파일을 그대로 읽어 재실행한다(멱등, IF NOT EXISTS뿐이라 안전).

-- 원본 GOLD SQL 전체 — 감사(audit)/추적 목적으로만 보관, 임베딩하지 않고 LLM에도 전달하지 않는다.
CREATE TABLE IF NOT EXISTS sql_sources (
  source_sql_id     TEXT PRIMARY KEY,
  original_sql      TEXT NOT NULL,
  dialect           TEXT NOT NULL DEFAULT 'tsql',
  source_document   TEXT,                          -- 예: 'ktws_측정값_쿼리화.xlsx 1-1시트 계약건수'
  version           INTEGER NOT NULL DEFAULT 1,
  verified          BOOLEAN NOT NULL DEFAULT true,  -- GOLD 검증된 원본이므로 기본 true
  execution_status  TEXT NOT NULL DEFAULT 'unknown',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 순수 업무 규칙 정의 — 여러 Fragment가 같은 규칙을 서로 다른 SQL로 구현할 수 있다.
CREATE TABLE IF NOT EXISTS business_rules (
  rule_id               TEXT PRIMARY KEY,
  term                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  condition_expression  TEXT,                       -- 예: "D.active_yn = '재직'"
  related_tables        TEXT[] NOT NULL DEFAULT '{}', -- 'DB::TABLE' 소프트 참조
  related_columns       TEXT[] NOT NULL DEFAULT '{}',
  priority              INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CTE/최종 SELECT 단위 SQL 조각. sql_template은 절대 임베딩하지 않고 Stage7 프롬프트에만 노출.
CREATE TABLE IF NOT EXISTS sql_fragments (
  fragment_id       TEXT PRIMARY KEY,
  fragment_name     TEXT NOT NULL,
  fragment_type     TEXT NOT NULL DEFAULT 'cte',    -- 'cte' | 'filter' | 'scalar_agg' | 'final_select'
  description       TEXT NOT NULL,
  sql_template      TEXT NOT NULL,
  input_tables      TEXT[] NOT NULL DEFAULT '{}',
  input_columns     JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_columns    TEXT[] NOT NULL DEFAULT '{}',
  dependencies      TEXT[] NOT NULL DEFAULT '{}',   -- 순서 있음, 상위 CTE fragment_id 소프트 참조
  business_rule_ids TEXT[] NOT NULL DEFAULT '{}',
  dialect           TEXT NOT NULL DEFAULT 'tsql',
  verified          BOOLEAN NOT NULL DEFAULT false,
  -- true면 sql_template 자체가 이미 완결된 다중 CTE(;WITH ...) 쿼리 — Stage7이 "WITH 쓰지 말고
  -- SELECT 하나만" 규칙을 적용하면 안 되고, 템플릿 전체를 그대로(리터럴만 교체) 보존해야 한다.
  -- (frag_sc_delivery_matrix_select 등 "거의 원본 그대로 반영"한 예외적 fragment용, 2026-07-22 추가)
  self_contained    BOOLEAN NOT NULL DEFAULT false,
  -- {{GROUP_DIM}} 자리표시자 이름(예: 'GROUP_DIM') — 설정되면 파이프라인이 결정론적으로
  -- (LLM 없이, Stage 0.5와 같은 성격) sql_template 안의 이 자리를 supported_dimensions
  -- 중 사용자가 요청한 하나의 SQL 표현식으로 치환한다. measure 하나를 dimension마다
  -- fragment로 복제하지 않기 위한 장치(rag-poc/design-scaling-improvements.md §2,
  -- 2026-07-22 추가). NULL이면 이 fragment는 dimension 파라미터화 대상이 아니다.
  group_by_placeholder    TEXT,
  supported_dimensions    TEXT[] NOT NULL DEFAULT '{}',  -- knowledgeBase/dimensions.js의 id들
  -- dimensions.js 카탈로그는 'u.BRAND'처럼 DIM_MNG_USER 별칭 u를 가정한다 — 이 fragment가
  -- 다른 테이블/별칭을 조인해서 같은 dimension을 다른 컬럼으로 표현해야 하면(예:
  -- DIM_MNG_DEALER를 d로 조인한 경우 dealer는 'd.dealer_nm', FCT_SALES_TARGET_DAILY
  -- 자체 BRAND 컬럼을 쓰려면 brand는 'f.BRAND') 여기 { dimension_id: 'SQL 표현식' }으로
  -- 카탈로그 기본값을 덮어쓴다. 없는 키는 카탈로그 기본값을 그대로 쓴다.
  dimension_expressions   JSONB NOT NULL DEFAULT '{}'::jsonb,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sql_fragments ADD COLUMN IF NOT EXISTS self_contained BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE sql_fragments ADD COLUMN IF NOT EXISTS group_by_placeholder TEXT;
ALTER TABLE sql_fragments ADD COLUMN IF NOT EXISTS supported_dimensions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE sql_fragments ADD COLUMN IF NOT EXISTS dimension_expressions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 검색 대상. description+intent+metrics+operations만 임베딩(SQL 전문은 절대 넣지 않음).
CREATE TABLE IF NOT EXISTS query_patterns (
  pattern_id        TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  intent            TEXT[] NOT NULL DEFAULT '{}',
  metrics           TEXT[] NOT NULL DEFAULT '{}',
  dimensions        TEXT[] NOT NULL DEFAULT '{}',
  required_tables   TEXT[] NOT NULL DEFAULT '{}',
  operations        TEXT[] NOT NULL DEFAULT '{}',
  fragment_ids      TEXT[] NOT NULL DEFAULT '{}',   -- 순서 있음, sql_fragments 소프트 참조
  source_sql_id     TEXT REFERENCES sql_sources(source_sql_id),
  verified          BOOLEAN NOT NULL DEFAULT false,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_patterns_required_tables ON query_patterns USING GIN (required_tables);
CREATE INDEX IF NOT EXISTS idx_sql_fragments_input_tables ON sql_fragments USING GIN (input_tables);
