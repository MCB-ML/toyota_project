# 문서 색인

프로젝트 문서는 전부 이 폴더에 모여 있다. 루트 [README.md](../README.md)는 설치·실행,
[db/README.md](../db/README.md)는 Postgres 스키마 소유권을 다룬다.

## 전체 구조·이력

| 문서 | 내용 |
|---|---|
| [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) | 프로젝트 인수인계 노트 (작성 시점 기준이라 일부 경로는 옛 구조를 가리킨다) |

## 서비스 (대시보드)

| 문서 | 내용 |
|---|---|
| [service.md](service.md) | 서비스 구현 노트 — 챗봇 파이프라인, 대시보드 커스터마이징, Fabric 연결 |
| [dashboard-cache-policy.ko.md](dashboard-cache-policy.ko.md) | 대시보드 결과 캐시 정책 |
| [schema-prompt.md](schema-prompt.md) | 시맨틱 스키마 작성 가이드 |

## 관리자 (admin)

| 문서 | 내용 |
|---|---|
| [admin.md](admin.md) | admin 스택 개요 |
| [admin-backend.md](admin-backend.md) | admin API |
| [admin-frontend.md](admin-frontend.md) | admin UI |

## RAG (Text2SQL)

| 문서 | 내용 |
|---|---|
| [rag-poc/design-scaling-improvements.md](rag-poc/design-scaling-improvements.md) | 스케일링 설계 개선안 |
| [rag-poc/onboarding-gap-analysis.md](rag-poc/onboarding-gap-analysis.md) | 온보딩 갭 분석 |
| [rag-poc/test-report.md](rag-poc/test-report.md) | 테스트 리포트 |
| [rag-poc/pilot-브랜드별_출고평균대수.md](rag-poc/pilot-브랜드별_출고평균대수.md) | 파일럿 검증 |
| [rag-poc/pilot-판매목표_일별.md](rag-poc/pilot-판매목표_일별.md) | 파일럿 검증 |

## Agentic BI

| 문서 | 내용 |
|---|---|
| [agentic-bi/알려진-이슈.md](agentic-bi/알려진-이슈.md) | 알려진 이슈 |
| [agentic-bi/테스트-프롬프트.md](agentic-bi/테스트-프롬프트.md) | 테스트 프롬프트 모음 |

## 코드 옆에 남겨둔 문서

아래는 코드 사용법이거나 런타임이 직접 읽는 파일이라 문서 폴더로 옮기지 않았다.

- `service/backend/rag-poc/README.md` — RAG 스크립트 사용법
- `service/backend/reports/sources/README.md` — 인증 리포트 원본 SQL 설명
- `service/backend/schema/routing/*.md` — **런타임 데이터**. `schemaLoader.js`가 주제별로 읽어
  프롬프트에 넣는다. 옮기면 라우팅이 깨진다.
