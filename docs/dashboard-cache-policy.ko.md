# 대시보드 캐싱 정책

## 목적

대시보드 객체는 PostgreSQL에 SQL 실행 계획, 시각화 설정, 레이아웃만 저장한다. 실제 결과 행은
저장하지 않고 페이지 진입 또는 사용자의 새로고침 시 서버가 다시 구성한다. Redis는 여러 `app`
워커가 공유하는 결과 캐시, 분산 락, Fabric 동시성 permit 저장소다.

## 캐시 계층

| 계층 | 기본 주기 | 대상 | 역할 |
| --- | --- | --- | --- |
| Watermark 캐시 | 3,600초(1시간) | Gold 테이블의 `MAX(ETL_TIMESTAMP)` | 원본 데이터 변경 여부 판단 |
| 결과 TTL | 3,600초(1시간) | 객체 최종 결과 행 | 자동 재조회 없이 그대로 사용하는 범위 |
| stale grace | 300초(5분) | 만료 직후의 객체 결과 행 | 한 요청만 갱신하는 동안 이전 값을 제공하는 범위 |

`DATA_SOURCE_WATERMARK_TTL_SECONDS=3600`은 **ETL watermark 재확인 주기**이고,
`DASHBOARD_RESULT_CACHE_TTL_SECONDS=3600`은 **객체 결과 재조회 주기**다. 일반 조회는 한 시간
동안 Redis의 결과를 사용한다. 한 시간이 지난 뒤 처음 들어온 일반 조회만 갱신을 시작하며, 수동
새로고침은 이 주기를 건너뛰고 즉시 새 결과를 조회해 같은 캐시 키를 덮어쓴다.

## 페이지 진입 흐름

1. 브라우저는 저장된 객체 정의만 받는다.
2. `POST /api/dashboard-pages/data`가 객체를 한 배치로 서버에 전달한다.
3. 서버는 레이아웃 상단 객체부터 `DASHBOARD_PAGE_MAX_CONCURRENCY`만큼 처리한다.
4. 각 객체는 선언된 `sourceDependencies`의 watermark fingerprint를 확인한다.
5. `queryBundle` 또는 인증 리포트의 실행 계획, 바인딩 파라미터, fingerprint, 접근 범위로 결과
   캐시 키를 만든다.
6. 결과 TTL 안이면 Redis 결과를 반환한다. 이 경로에서는 Fabric 결과 SQL을 실행하지 않는다.
7. 결과 TTL이 만료되면 동일 키 중 한 요청만 Fabric 결과 SQL을 실행한다. 자동 갱신은 최대 5분간
   이전 값을 먼저 돌려줄 수 있고, 수동 새로고침은 Fabric 실행이 끝난 새 값을 기다린다.

동일 캐시 키의 동시 요청은 Redis lock으로 합쳐진다. Fabric 호출은 모든 app 워커가 공유하는
`DASHBOARD_GLOBAL_MAX_CONCURRENCY` permit을 통과해야 한다.

## 데이터 최신성

source dependency는 SQL 문자열을 파싱하지 않고 Semantic Metric YAML 또는 인증 리포트 계약에
명시한다. 유효한 식별자 목록으로만 다음 쿼리를 조립한다.

```sql
SELECT MAX([ETL_TIMESTAMP]) AS [watermark]
FROM [ktws].[FCT_ACTIVITY_v2]
```

watermark 값이 바뀌면 `sourceFingerprint`가 달라져 같은 객체라도 다른 결과 캐시 키를 사용한다.
따라서 한 시간 뒤 원본이 바뀐 경우에는 이전 결과를 재사용하지 않는다. ETL 파이프라인을 이
프로젝트에서 제어하지 않아도 다음 watermark 확인 시 자동으로 새 데이터가 반영된다.
`ETL_TIMESTAMP`를 지원하지 않는 source는 실패시키지 않고 결과 TTL만 적용한다.

## 강제 새로고침

편집 화면의 페이지 새로고침 또는 객체 새로고침은 `forceRefresh=true`를 보낸다.

- 결과 캐시를 읽지 않는다.
- watermark 캐시도 읽지 않는다.
- Fabric에서 최신 `MAX(ETL_TIMESTAMP)`와 객체 결과를 다시 조회한다.
- 저장된 객체 정의, 차트 설정, 레이아웃, 객체 필터는 바꾸지 않는다.

## 편집 화면의 상태 표시

캐시 상태와 조회 시각은 **편집 모드에서만** 보인다. 보기 모드에서는 차트 위에 표시하지 않는다.

| 표시 | 의미 |
| --- | --- |
| 새 조회 | 결과 캐시가 없어서 Fabric을 방금 실행함 |
| 강제 새로고침 | 사용자가 캐시를 우회해 Fabric을 실행함 |
| 캐시 | 결과 TTL 1시간 안의 Redis 값 |
| 이전 캐시 | stale 값을 먼저 표시했고 서버 갱신이 예약됨 |

따라서 `새 조회` 또는 `강제 새로고침`의 시간이 현재 시각이면 최초 조회, 한 시간 만료 후 자동
갱신, 또는 사용자의 수동 갱신 중 하나다. 60초 주기의 자동 결과 조회는 하지 않는다.

## 운영 환경 변수

```dotenv
REDIS_URL=redis://redis:6379
DATA_SOURCE_WATERMARK_TTL_SECONDS=3600
DASHBOARD_RESULT_CACHE_TTL_SECONDS=3600
DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS=300
DASHBOARD_PAGE_MAX_CONCURRENCY=3
DASHBOARD_GLOBAL_MAX_CONCURRENCY=8
```

자동 결과 갱신 주기를 바꾸려면 `DASHBOARD_RESULT_CACHE_TTL_SECONDS`만 조정한다.
`DASHBOARD_RESULT_CACHE_STALE_GRACE_SECONDS`는 갱신 중 이전 값을 제공할 최대 시간이며,
결과 TTL보다 짧게 유지하는 것을 권장한다.

## 권한과 데이터 범위 확장

현재 기본값은 기존 동작을 보존하는 `accessScopeKey=public`이다. 이후 사용자·조직·역할 테이블을
연결할 때는 다음 인터페이스만 실제 조회로 교체한다.

- `resolveDataAccessContext(request)`
- `buildAccessScopeKey(context)`
- `applyMandatoryAccessFilters(queryPlan, context)`
- `authorizeDashboardObject(object, context)`

강제 필터는 SQL 문자열 뒤에 붙이지 않고 검증 가능한 Semantic Query IR filter 구조로만 추가한다.
접근 범위 해시는 결과 캐시 키에 포함되므로 서로 다른 권한 범위가 결과를 공유하지 않는다.

## 장애 시 동작

Redis 연결 실패는 경고 로그를 남기고 제한된 프로세스 내 메모리 fallback으로 처리한다. 개발 화면은
막지 않지만, 여러 app 워커 사이 캐시·락·permit은 공유되지 않으므로 운영 환경에서는 Redis를
필수 의존성으로 둔다.
