-- 2026-08-04 leo: 기존 표 객체는 hidden=true가 "숨김"을 뜻했지만 설정 화면은
-- "컬럼 표시"를 제공해야 한다. 현재 객체와 이력의 저장 계약을 visible=true/false로
-- 일괄 전환해 새 렌더러가 반대 의미의 두 속성을 해석하지 않게 한다.

-- 현재 저장된 객체
UPDATE dashboard_objects AS object
SET object_spec = jsonb_set(
  object.object_spec,
  '{tableSpec,columns}',
  (
    SELECT jsonb_agg(
      (item.value - 'hidden') || jsonb_build_object(
        'visible',
        CASE
          WHEN jsonb_typeof(item.value -> 'visible') = 'boolean' THEN item.value -> 'visible'
          WHEN jsonb_typeof(item.value -> 'hidden') = 'boolean' THEN to_jsonb(NOT (item.value ->> 'hidden')::boolean)
          ELSE 'true'::jsonb
        END
      )
      ORDER BY item.ordinality
    )
    FROM jsonb_array_elements(object.object_spec #> '{tableSpec,columns}') WITH ORDINALITY AS item(value, ordinality)
  ),
  false
)
WHERE jsonb_typeof(object.object_spec #> '{tableSpec,columns}') = 'array';

-- 객체별 이력 스냅샷
UPDATE dashboard_object_versions AS version
SET object_snapshot = jsonb_set(
  version.object_snapshot,
  '{objectSpec,tableSpec,columns}',
  (
    SELECT jsonb_agg(
      (item.value - 'hidden') || jsonb_build_object(
        'visible',
        CASE
          WHEN jsonb_typeof(item.value -> 'visible') = 'boolean' THEN item.value -> 'visible'
          WHEN jsonb_typeof(item.value -> 'hidden') = 'boolean' THEN to_jsonb(NOT (item.value ->> 'hidden')::boolean)
          ELSE 'true'::jsonb
        END
      )
      ORDER BY item.ordinality
    )
    FROM jsonb_array_elements(version.object_snapshot #> '{objectSpec,tableSpec,columns}') WITH ORDINALITY AS item(value, ordinality)
  ),
  false
)
WHERE jsonb_typeof(version.object_snapshot #> '{objectSpec,tableSpec,columns}') = 'array';

-- 페이지 이력 매니페스트
UPDATE dashboard_page_versions AS page_version
SET object_manifest = COALESCE((
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(item.object #> '{objectSpec,tableSpec,columns}') = 'array' THEN jsonb_set(
        item.object,
        '{objectSpec,tableSpec,columns}',
        (
          SELECT jsonb_agg(
            (column_item.value - 'hidden') || jsonb_build_object(
              'visible',
              CASE
                WHEN jsonb_typeof(column_item.value -> 'visible') = 'boolean' THEN column_item.value -> 'visible'
                WHEN jsonb_typeof(column_item.value -> 'hidden') = 'boolean' THEN to_jsonb(NOT (column_item.value ->> 'hidden')::boolean)
                ELSE 'true'::jsonb
              END
            )
            ORDER BY column_item.ordinality
          )
          FROM jsonb_array_elements(item.object #> '{objectSpec,tableSpec,columns}') WITH ORDINALITY AS column_item(value, ordinality)
        ),
        false
      )
      ELSE item.object
    END
    ORDER BY item.ordinality
  )
  FROM jsonb_array_elements(page_version.object_manifest) WITH ORDINALITY AS item(object, ordinality)
), '[]'::jsonb)
WHERE jsonb_typeof(page_version.object_manifest) = 'array';
