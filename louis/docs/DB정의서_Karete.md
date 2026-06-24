# Karete 엔드포인트 — DB 테이블 정의서

> 조회 일시: 2026-06-22  
> 접속 계정: TMKR_Account@toyotamotor.co.kr  
> 엔드포인트: `6orm62c43rguff2mpdxwqy76tu-kp6lscr4iunung5p66mov6kcka.datawarehouse.fabric.microsoft.com`  
> 인증: Azure AD (ActiveDirectoryPassword) / ODBC Driver 17

## DB 개요

| 데이터베이스 | 구분 | 테이블 수 | 비고 |
|---|---|---|---|
| LH_INTELLIGENCE_BI | 데이터 | 29 | |
| LH_INTELLIGENCE_ML | 데이터 | 15 | |
| LH_META | 데이터 | 15 | |
| LH_REFINED | 데이터 | 63 | |
| LH_STAGING | 데이터 | 143 | |

---

## DB: LH_INTELLIGENCE_BI

구분: 데이터 · 테이블 수: 29

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.DIM_ACCESS_USERS | 11 | - |
| dbo.DIM_BRAND | 3 | - |
| dbo.DIM_CALENDAR | 24 | - |
| dbo.DIM_DEALER | 7 | - |
| dbo.DIM_IMAGE_FORMAT_A3 | 6 | - |
| dbo.DIM_IMAGE_FORMAT_A4 | 6 | - |
| dbo.DIM_MODEL | 7 | - |
| dbo.DIM_MODEL_YEAR | 11 | - |
| dbo.DIM_SHOP | 10 | - |
| dbo.DIM_VARIANT | 9 | - |
| dbo.FCT_FINANCE_DEALER_ACCOUNT | 62 | - |
| dbo.FCT_PARTS_SUPPLY_OUT | 17 | - |
| dbo.FCT_PUBLIC_VEHICLE | 31 | - |
| dbo.FCT_PUBLIC_VEHICLE_SUB | 31 | - |
| dbo.FCT_SERVICE_ORGANIZATION_INFORMATION | 22 | - |
| dbo.FCT_SERVICE_REPAIR | 53 | - |
| dbo.FCT_SERVICE_TARGET | 15 | - |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |

### 컬럼 상세

#### dbo.DIM_ACCESS_USERS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_NAME | varchar(8000) | YES |
| 3 | USER_ID | varchar(8000) | YES |
| 4 | USER_KEY | varchar(8000) | YES |
| 5 | NAME | varchar(8000) | YES |
| 6 | EMAIL | varchar(8000) | YES |
| 7 | DEALER_CODE | varchar(8000) | YES |
| 8 | DEALER_NAME | varchar(8000) | YES |
| 9 | SHOP_CODE | varchar(8000) | YES |
| 10 | SHOP_NAME | varchar(8000) | YES |
| 11 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_BRAND

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_NAME | varchar(8000) | YES |
| 3 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_CALENDAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DATE | date | YES |
| 3 | YEAR | int | YES |
| 4 | YEAR_KOREAN | varchar(8000) | YES |
| 5 | MONTH | int | YES |
| 6 | MONTH_KOREAN | varchar(8000) | YES |
| 7 | DAY | int | YES |
| 8 | DAY_KOREAN | varchar(8000) | YES |
| 9 | WEEKDAY_NAME | varchar(8000) | YES |
| 10 | YYYYMM | varchar(8000) | YES |
| 11 | YYYY-MM | varchar(8000) | YES |
| 12 | YEARMONTH_KOREAN | varchar(8000) | YES |
| 13 | YYYYMMDD | varchar(8000) | YES |
| 14 | YYYY-MM-DD | varchar(8000) | YES |
| 15 | QUARTER | int | YES |
| 16 | QUARTER_NAME | varchar(8000) | YES |
| 17 | WORK_TYPE_KOREA | varchar(8000) | YES |
| 18 | WORK_TYPE_OVERSEAS | varchar(8000) | YES |
| 19 | WORK_TYPE_DEALER | varchar(8000) | YES |
| 20 | WORK_TYPE_HQ | varchar(8000) | YES |
| 21 | WORK_TYPE_CPD | varchar(8000) | YES |
| 22 | CREATE_DATETIME | datetime2 | YES |
| 23 | UPDATE_DATETIME | datetime2 | YES |
| 24 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_DEALER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 3 | DEALER_KEY | varchar(8000) | YES | 딜러 |
| 4 | DEALER_CODE | varchar(8000) | YES | 딜러 |
| 5 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 6 | DEALER_SHORT_NAME | varchar(8000) | YES | 딜러 |
| 7 | ELT_DATETIME | datetime2 | YES | 시각 |

#### dbo.DIM_IMAGE_FORMAT_A3

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND_NAME | varchar(8000) | YES |
| 2 | FILE_GROUP | varchar(8000) | YES |
| 3 | FILE_NAME | varchar(8000) | YES |
| 4 | IMAGE_CONTENT | varchar(8000) | YES |
| 5 | CREATE_DATETIME | varchar(8000) | YES |
| 6 | ELT_DATETIME | varchar(8000) | YES |

#### dbo.DIM_IMAGE_FORMAT_A4

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND_NAME | varchar(8000) | YES |
| 2 | FILE_GROUP | varchar(8000) | YES |
| 3 | FILE_NAME | varchar(8000) | YES |
| 4 | IMAGE_CONTENT | varchar(8000) | YES |
| 5 | CREATE_DATETIME | varchar(8000) | YES |
| 6 | ELT_DATETIME | varchar(8000) | YES |

#### dbo.DIM_MODEL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | MODEL_KEY | varchar(8000) | YES |
| 3 | BRAND_NAME | varchar(8000) | YES |
| 4 | MODEL_CODE | varchar(8000) | YES |
| 5 | MODEL_NAME | varchar(8000) | YES |
| 6 | IS_CURRENT_SALES | bit | YES |
| 7 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_MODEL_YEAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | MODEL_YEAR_KEY | varchar(8000) | YES |
| 3 | BRAND_NAME | varchar(8000) | YES |
| 4 | MODEL_CODE | varchar(8000) | YES |
| 5 | MODEL_NAME | varchar(8000) | YES |
| 6 | VARIANT_CODE | varchar(8000) | YES |
| 7 | VARIANT_NAME | varchar(8000) | YES |
| 8 | MODEL_YEAR_CODE | varchar(8000) | YES |
| 9 | MODEL_YEAR_NAME | varchar(8000) | YES |
| 10 | VARIANT_KEY | varchar(8000) | YES |
| 11 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_SHOP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_NAME | varchar(8000) | YES |
| 3 | DEALER_KEY | varchar(8000) | YES |
| 4 | DEALER_CODE | varchar(8000) | YES |
| 5 | DEALER_NAME | varchar(8000) | YES |
| 6 | SHOP_CODE | varchar(8000) | YES |
| 7 | SHOP_NAME | varchar(8000) | YES |
| 8 | SHOP_TYPE | varchar(8000) | YES |
| 9 | SHOP_KEY | varchar(8000) | YES |
| 10 | ELT_DATETIME | datetime2 | YES |

#### dbo.DIM_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | MODEL_KEY | varchar(8000) | YES |
| 3 | VARIANT_KEY | varchar(8000) | YES |
| 4 | BRAND_NAME | varchar(8000) | YES |
| 5 | MODEL_CODE | varchar(8000) | YES |
| 6 | MODEL_NAME | varchar(8000) | YES |
| 7 | VARIANT_CODE | varchar(8000) | YES |
| 8 | VARIANT_NAME | varchar(8000) | YES |
| 9 | ELT_DATETIME | datetime2 | YES |

#### dbo.FCT_FINANCE_DEALER_ACCOUNT

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 3 | DEALER_CODE | varchar(8000) | YES | 딜러 |
| 4 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 5 | YEARMONTH | varchar(8000) | YES |  |
| 6 | DATE_KEY | date | YES |  |
| 7 | CREATE_DATETIME | datetime2 | YES | 시각 |
| 8 | ELT_DATETIME | datetime2 | YES | 시각 |
| 9 | SALES_GS | float | YES | 판매 |
| 10 | SALES_BP | float | YES | 판매 |
| 11 | SALES_PCS | float | YES | 판매 |
| 12 | COST_PARTS | float | YES | 부품 |
| 13 | COST_OUTSIDE_ORDER | float | YES | 주문 |
| 14 | COST_TMKR_SUBSIDY | float | YES |  |
| 15 | COST_SALARIES | float | YES |  |
| 16 | COST_BONUSES | float | YES |  |
| 17 | COST_SEVERANCE | float | YES |  |
| 18 | COST_LEGAL_WELFARE | float | YES |  |
| 19 | COST_EMPLOYEE_BENEFITS | float | YES | 직원 |
| 20 | COST_SALES_EXP_TRANSFER | float | YES | 판매 |
| 21 | COST_TRAVEL | float | YES |  |
| 22 | COST_TRAINING | float | YES |  |
| 23 | COST_MAINTENANCE | float | YES |  |
| 24 | COST_RENTAL | float | YES |  |
| 25 | COST_SUPPLIES | float | YES |  |
| 26 | COST_UTILITY | float | YES |  |
| 27 | COST_COMMUNICATION | float | YES |  |
| 28 | COST_PUBLICATION | float | YES |  |
| 29 | COST_FREIGHT | float | YES |  |
| 30 | COST_COMPANY_VEHICLE | float | YES | 차량 |
| 31 | COST_ENTERTAINMENT | float | YES |  |
| 32 | COST_BUSINESS_MEAL | float | YES |  |
| 33 | COST_SERVICE_FEE | float | YES | 서비스 |
| 34 | COST_TAX_DUE | float | YES |  |
| 35 | COST_DEPRECIATION | float | YES |  |
| 36 | COST_AMORTIZATION | float | YES |  |
| 37 | COST_MISCELLANEOUS | float | YES |  |
| 38 | GADMIN_SALARIES | float | YES |  |
| 39 | GADMIN_BONUSES | float | YES |  |
| 40 | GADMIN_SEVERANCE | float | YES |  |
| 41 | GADMIN_LEGAL_WELFARE | float | YES |  |
| 42 | GADMIN_EMPLOYEE_BENEFITS | float | YES | 직원 |
| 43 | GADMIN_TRAVEL | float | YES |  |
| 44 | GADMIN_TRAINING | float | YES |  |
| 45 | GADMIN_MAINTENANCE | float | YES |  |
| 46 | GADMIN_RENTAL | float | YES |  |
| 47 | GADMIN_SUPPLIES | float | YES |  |
| 48 | GADMIN_UTILITY | float | YES |  |
| 49 | GADMIN_COMMUNICATION | float | YES |  |
| 50 | GADMIN_PUBLICATION | float | YES |  |
| 51 | GADMIN_FREIGHT | float | YES |  |
| 52 | GADMIN_COMPANY_VEHICLE | float | YES | 차량 |
| 53 | GADMIN_ENTERTAINMENT | float | YES |  |
| 54 | GADMIN_BUSINESS_MEAL | float | YES |  |
| 55 | GADMIN_SERVICE_FEE | float | YES | 서비스 |
| 56 | GADMIN_TAX_DUE | float | YES |  |
| 57 | GADMIN_DEPRECIATION | float | YES |  |
| 58 | GADMIN_AMORTIZATION | float | YES |  |
| 59 | GADMIN_MISCELLANEOUS | float | YES |  |
| 60 | VC_CPO_REVENUE | float | YES |  |
| 61 | VC_CPO_COST | float | YES |  |
| 62 | VC_INSURANCE | float | YES |  |

#### dbo.FCT_PARTS_SUPPLY_OUT

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | SERVICE_REPAIR_KEY | varchar(8000) | YES | 정비/수리 |
| 3 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 4 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 5 | DEALER_CODE | varchar(8000) | YES | 딜러 |
| 6 | SHOP_CODE | varchar(8000) | YES | 전시장 |
| 7 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 8 | SUPPLY_OUT_DATE | varchar(8000) | YES | 일자 |
| 9 | SUPPLY_OUT_DATE_KEY | date | YES |  |
| 10 | SUPPLY_OUT_NUMBER | varchar(8000) | YES |  |
| 11 | LINE_NUMBER | int | YES |  |
| 12 | SUPPLY_OUT_LINE_KEY | varchar(8000) | YES |  |
| 13 | PART_NUMBER | varchar(8000) | YES | 부품 |
| 14 | PARTS_TYPE | varchar(8000) | YES | 부품 |
| 15 | SOUT_QTY | bigint | YES | 수량 |
| 16 | CREATE_DATETIME | datetime2 | YES | 시각 |
| 17 | ELT_DATETIME | datetime2 | YES | 시각 |

#### dbo.FCT_PUBLIC_VEHICLE

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 3 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 4 | CONTRACT_STATUS | varchar(8000) | YES | 계약 |
| 5 | SALES_DEALER_CODE | varchar(8000) | YES | 딜러 |
| 6 | SALES_DEALER_NAME | varchar(8000) | YES | 딜러 |
| 7 | SALES_SHOP_CODE | varchar(8000) | YES | 전시장 |
| 8 | VEHICLE_SALES_DATE | date | YES | 차량 |
| 9 | CONTRACT_CUSTOMER_CITY | varchar(8000) | YES | 계약 |
| 10 | CONTRACT_CUSTOMER_GU | varchar(8000) | YES | 계약 |
| 11 | ENTER_CONTRACT_PMA | varchar(8000) | YES |  |
| 12 | PLATE_NUMBER | varchar(8000) | YES |  |
| 13 | VEHICLE_BRAND | varchar(8000) | YES | 브랜드 |
| 14 | VEHICLE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 15 | VEHICLE_MODEL_NAME | varchar(8000) | YES | 모델 |
| 16 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 17 | VEHICLE_VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 18 | VEHICLE_VARIANT | varchar(8000) | YES | 바리에이션 |
| 19 | VEHICLE_SUFFIX_CODE | varchar(8000) | YES | 차량 |
| 20 | VEHICLE_SUFFIX | varchar(8000) | YES | 차량 |
| 21 | VEHICLE_COLOR_COMBINATION_CODE | varchar(8000) | YES | 컬러조합 |
| 22 | VEHICLE_COLOR_COMBINATION | varchar(8000) | YES | 컬러조합 |
| 23 | VEHICLE_FUEL_GROUP | varchar(8000) | YES | 차량 |
| 24 | IS_DCM_VEHICLE | bit | YES | 차량 |
| 25 | DCM_GROUP | varchar(8000) | YES |  |
| 26 | ODOMETER | int | YES |  |
| 27 | SERVICE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 28 | GRADE | varchar(8000) | YES |  |
| 29 | IS_GRAY_VEHICLE | bit | YES | 차량 |
| 30 | UPDATE_DATETIME | datetime2 | YES | 시각 |
| 31 | ELT_DATETIME | datetime2 | YES | 시각 |

#### dbo.FCT_PUBLIC_VEHICLE_SUB

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 3 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 4 | CONTRACT_STATUS | varchar(8000) | YES | 계약 |
| 5 | SALES_DEALER_CODE | varchar(8000) | YES | 딜러 |
| 6 | SALES_DEALER_NAME | varchar(8000) | YES | 딜러 |
| 7 | SALES_SHOP_CODE | varchar(8000) | YES | 전시장 |
| 8 | VEHICLE_SALES_DATE | date | YES | 차량 |
| 9 | CONTRACT_CUSTOMER_CITY | varchar(8000) | YES | 계약 |
| 10 | CONTRACT_CUSTOMER_GU | varchar(8000) | YES | 계약 |
| 11 | ENTER_CONTRACT_PMA | varchar(8000) | YES |  |
| 12 | PLATE_NUMBER | varchar(8000) | YES |  |
| 13 | VEHICLE_BRAND | varchar(8000) | YES | 브랜드 |
| 14 | VEHICLE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 15 | VEHICLE_MODEL_NAME | varchar(8000) | YES | 모델 |
| 16 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 17 | VEHICLE_VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 18 | VEHICLE_VARIANT | varchar(8000) | YES | 바리에이션 |
| 19 | VEHICLE_SUFFIX_CODE | varchar(8000) | YES | 차량 |
| 20 | VEHICLE_SUFFIX | varchar(8000) | YES | 차량 |
| 21 | VEHICLE_COLOR_COMBINATION_CODE | varchar(8000) | YES | 컬러조합 |
| 22 | VEHICLE_COLOR_COMBINATION | varchar(8000) | YES | 컬러조합 |
| 23 | VEHICLE_FUEL_GROUP | varchar(8000) | YES | 차량 |
| 24 | IS_DCM_VEHICLE | bit | YES | 차량 |
| 25 | DCM_GROUP | varchar(8000) | YES |  |
| 26 | ODOMETER | int | YES |  |
| 27 | SERVICE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 28 | GRADE | varchar(8000) | YES |  |
| 29 | IS_GRAY_VEHICLE | bit | YES | 차량 |
| 30 | UPDATE_DATETIME | datetime2 | YES | 시각 |
| 31 | ELT_DATETIME | datetime2 | YES | 시각 |

#### dbo.FCT_SERVICE_ORGANIZATION_INFORMATION

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_NAME | varchar(8000) | YES |
| 3 | DEALER_CODE | varchar(8000) | YES |
| 4 | DEALER_NAME | varchar(8000) | YES |
| 5 | SHOP_CODE | varchar(8000) | YES |
| 6 | SHOP_NAME | varchar(8000) | YES |
| 7 | ORGANIZATION_LEVEL | varchar(8000) | YES |
| 8 | YEARMONTH | varchar(8000) | YES |
| 9 | DATE_KEY | date | YES |
| 10 | GENERAL_SERVICE_ADVISOR_TOTAL | int | YES |
| 11 | GENERAL_TECHNICIAN_TOTAL | int | YES |
| 12 | BODY_PAINT_SERVICE_ADVISOR_TOTAL | int | YES |
| 13 | BODY_PAINT_TECHNICIAN_BODY_TOTAL | int | YES |
| 14 | BODY_PAINT_TECHNICIAN_PAINT_TOTAL | int | YES |
| 15 | GENERAL_STALL | int | YES |
| 16 | BODY_PAINT_STALL | int | YES |
| 17 | GENERAL_SERVICE_ADVISOR_MASTER | int | YES |
| 18 | GENERAL_TECHNICIAN_MASTER | int | YES |
| 19 | BODY_PAINT_SERVICE_ADVISOR_MASTER | int | YES |
| 20 | BODY_TECHNICIAN_MASTER | int | YES |
| 21 | PAINT_TECHNICIAN_MASTER | int | YES |
| 22 | ELT_DATETIME | datetime2 | YES |

#### dbo.FCT_SERVICE_REPAIR

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | SERVICE_REPAIR_KEY | varchar(8000) | YES | 정비/수리 |
| 3 | BRAND_NAME | varchar(8000) | YES | 브랜드 |
| 4 | DEALER_CODE | varchar(8000) | YES | 딜러 |
| 5 | SHOP_CODE | varchar(8000) | YES | 전시장 |
| 6 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 7 | RO_DATE | date | YES | 일자 |
| 8 | RO_SEQUENCE | varchar(8000) | YES | 순번 |
| 9 | REPAIR_GROUP | varchar(8000) | YES | 정비/수리 |
| 10 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 11 | PLATE_NUMBER | varchar(8000) | YES |  |
| 12 | IS_ECRB | bit | YES |  |
| 13 | ECRB_GROUP | varchar(8000) | YES |  |
| 14 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 15 | VEHICLE_MODEL | varchar(8000) | YES | 모델 |
| 16 | VEHICLE_VARIANT | varchar(8000) | YES | 바리에이션 |
| 17 | VEHICLE_SUFFIX | varchar(8000) | YES | 차량 |
| 18 | VEHICLE_COLOR_COMBINATION | varchar(8000) | YES | 컬러조합 |
| 19 | VEHICLE_SERVICE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 20 | OWN_DEALER_GROUP | varchar(8000) | YES | 딜러 |
| 21 | RO_ODOMETER | int | YES |  |
| 22 | RO_STATUS | varchar(8000) | YES | 상태코드 |
| 23 | RO_KPI_MAIN_GROUP | varchar(8000) | YES |  |
| 24 | DAMAGE_GROUP | varchar(8000) | YES |  |
| 25 | IS_PAYBACK | bit | YES |  |
| 26 | SERVICE_CENTER_ENTER_DATETIME | datetime2 | YES | 서비스 |
| 27 | PROCESS_REAL_START_DATETIME | datetime2 | YES | 시각 |
| 28 | PROCESS_REAL_END_DATETIME | datetime2 | YES | 시각 |
| 29 | PROCESS_TOTAL_REST_MINUTES | decimal(10,0) | YES |  |
| 30 | CUSTOMER_DELIVERY_REAL_DATETIME | datetime2 | YES | 출고 |
| 31 | CUSTOMER_DELIVERY_REAL_DATE | date | YES | 출고 |
| 32 | RO_CUSTOMER_CITY | varchar(8000) | YES | 고객 |
| 33 | RO_CUSTOMER_GU | varchar(8000) | YES | 고객 |
| 34 | RO_CLOSE_DATE | date | YES | 일자 |
| 35 | BP_AMOUNT | decimal(10,0) | YES | 금액 |
| 36 | IS_BP_INCLUDE | bit | YES |  |
| 37 | FMS_AMOUNT | decimal(10,0) | YES | 금액 |
| 38 | IS_FMS_INCLUDE | bit | YES |  |
| 39 | F1K_AMOUNT | decimal(10,0) | YES | 금액 |
| 40 | IS_F1K_INCLUDE | bit | YES |  |
| 41 | PSP_AMOUNT | decimal(10,0) | YES | 금액 |
| 42 | IS_PSP_INCLUDE | bit | YES |  |
| 43 | PMO_AMOUNT | decimal(10,0) | YES | 금액 |
| 44 | IS_PMO_INCLUDE | bit | YES |  |
| 45 | GR_AMOUNT | decimal(10,0) | YES | 금액 |
| 46 | IS_GR_INCLUDE | bit | YES |  |
| 47 | WARRANTY_AMOUNT | decimal(10,0) | YES | 금액 |
| 48 | IS_WARRANTY_INCLUDE | bit | YES | 보증 |
| 49 | IT_AMOUNT | decimal(10,0) | YES | 금액 |
| 50 | IS_IT_INCLUDE | bit | YES |  |
| 51 | RESERVATION_KEY | varchar(8000) | YES |  |
| 52 | CREATE_DATETIME | datetime2 | YES | 시각 |
| 53 | ELT_DATETIME | datetime2 | YES | 시각 |

#### dbo.FCT_SERVICE_TARGET

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_NAME | varchar(8000) | YES |
| 3 | PERIOD_GROUP | varchar(8000) | YES |
| 4 | TARGET_PERIOD | varchar(8000) | YES |
| 5 | TARGET_DATE_KEY | date | YES |
| 6 | KPI_TYPE | varchar(8000) | YES |
| 7 | TARGET_LEVEL | varchar(8000) | YES |
| 8 | DEALER_CODE | varchar(8000) | YES |
| 9 | DEALER_NAME | varchar(8000) | YES |
| 10 | SHOP_CODE | varchar(8000) | YES |
| 11 | SHOP_NAME | varchar(8000) | YES |
| 12 | USER_ID | varchar(8000) | YES |
| 13 | USER_NAME | varchar(8000) | YES |
| 14 | VALUE | decimal(38,10) | YES |
| 15 | ELT_DATETIME | datetime2 | YES |

#### queryinsights.exec_requests_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | distributed_statement_id | uniqueidentifier | YES |
| 2 | database_name | varchar(200) | YES |
| 3 | submit_time | datetime2 | YES |
| 4 | start_time | datetime2 | YES |
| 5 | end_time | datetime2 | YES |
| 6 | is_distributed | int | NO |
| 7 | statement_type | varchar(128) | YES |
| 8 | total_elapsed_time_ms | bigint | YES |
| 9 | login_name | varchar(200) | YES |
| 10 | row_count | bigint | YES |
| 11 | status | varchar(200) | YES |
| 12 | session_id | int | YES |
| 13 | connection_id | uniqueidentifier | YES |
| 14 | program_name | varchar(128) | YES |
| 15 | batch_id | uniqueidentifier | YES |
| 16 | root_batch_id | uniqueidentifier | YES |
| 17 | query_hash | varchar(200) | YES |
| 18 | label | varchar(8000) | YES |
| 19 | result_cache_hit | int | YES |
| 20 | sql_pool_name | varchar(128) | YES |
| 21 | error_code | int | YES |
| 22 | error_severity | int | YES |
| 23 | error_state | int | YES |
| 24 | allocated_cpu_time_ms | bigint | YES |
| 25 | data_scanned_remote_storage_mb | decimal(18,3) | YES |
| 26 | data_scanned_memory_mb | decimal(18,3) | YES |
| 27 | data_scanned_disk_mb | decimal(18,3) | YES |
| 28 | command | varchar(max) | YES |

#### queryinsights.exec_sessions_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | session_id | int | YES |
| 2 | connection_id | uniqueidentifier | YES |
| 3 | session_start_time | datetime2 | YES |
| 4 | session_end_time | datetime2 | YES |
| 5 | program_name | varchar(256) | YES |
| 6 | login_name | varchar(256) | YES |
| 7 | status | varchar(100) | YES |
| 8 | context_info | varchar(128) | YES |
| 9 | total_query_elapsed_time_ms | bigint | YES |
| 10 | last_request_start_time | datetime2 | YES |
| 11 | last_request_end_time | datetime2 | YES |
| 12 | is_user_process | bit | YES |
| 13 | prev_error | int | YES |
| 14 | group_id | bigint | YES |
| 15 | database_id | int | YES |
| 16 | authenticating_database_id | int | YES |
| 17 | open_transaction_count | bigint | YES |
| 18 | text_size | int | YES |
| 19 | language | varchar(256) | YES |
| 20 | date_format | varchar(20) | YES |
| 21 | date_first | int | YES |
| 22 | quoted_identifier | bit | YES |
| 23 | arithabort | bit | YES |
| 24 | ansi_null_dflt_on | bit | YES |
| 25 | ansi_defaults | bit | YES |
| 26 | ansi_warnings | bit | YES |
| 27 | ansi_padding | bit | YES |
| 28 | ansi_nulls | bit | YES |
| 29 | concat_null_yields_null | bit | YES |
| 30 | transaction_isolation_level | int | YES |
| 31 | lock_timeout | bigint | YES |
| 32 | deadlock_priority | int | YES |
| 33 | original_security_id | varchar(200) | YES |
| 34 | database_name | varchar(200) | YES |

#### queryinsights.frequently_run_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | number_of_runs | int | YES |
| 3 | min_run_total_elapsed_time_ms | bigint | YES |
| 4 | max_run_total_elapsed_time_ms | bigint | YES |
| 5 | avg_total_elapsed_time_ms | bigint | YES |
| 6 | number_of_successful_runs | int | YES |
| 7 | number_of_failed_runs | int | YES |
| 8 | number_of_canceled_runs | int | YES |
| 9 | last_run_total_elapsed_time_ms | bigint | YES |
| 10 | last_run_start_time | datetime2 | YES |
| 11 | last_dist_statement_id | uniqueidentifier | YES |
| 12 | query_hash | varchar(200) | YES |
| 13 | last_run_command | varchar(max) | YES |

#### queryinsights.long_running_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | median_total_elapsed_time_ms | float | YES |
| 3 | last_run_total_elapsed_time_ms | bigint | YES |
| 4 | last_run_start_time | datetime2 | YES |
| 5 | last_dist_statement_id | uniqueidentifier | YES |
| 6 | last_run_session_id | int | YES |
| 7 | number_of_runs | int | YES |
| 8 | query_hash | varchar(200) | YES |
| 9 | last_run_command | varchar(max) | YES |

#### queryinsights.sql_pool_insights

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sql_pool_name | varchar(128) | YES |
| 2 | timestamp | datetime2 | YES |
| 3 | max_resource_percentage | int | YES |
| 4 | is_optimized_for_reads | bit | YES |
| 5 | current_workspace_capacity | varchar(16) | YES |
| 6 | is_pool_under_pressure | bit | YES |

#### sys.dm_db_external_tables_log_status

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | object_id | int | NO |
| 2 | latest_log_version | bigint | YES |
| 3 | latest_checkpoint_version | bigint | YES |
| 4 | last_update_time_utc | datetime | NO |
| 5 | is_blocked | bit | NO |

#### sys.external_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | is_blocked | bit | NO |
| 3 | block_reason | tinyint | NO |
| 4 | relative_path | nvarchar(2000) | NO |
| 5 | latest_manifest_version | bigint | YES |
| 6 | latest_checkpoint_version | bigint | YES |
| 7 | latest_checksum_version | bigint | YES |
| 8 | latest_etag | nvarchar(128) | NO |
| 9 | latest_checkpoint_file_name | nvarchar(76) | NO |
| 10 | last_update_time | datetime | NO |

#### sys.managed_delta_table_checkpoints

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delta_log_commit_sequence_id | bigint | NO |
| 2 | part | int | NO |
| 3 | file_guid | uniqueidentifier | NO |
| 4 | version | bigint | NO |
| 5 | source_table_guid | uniqueidentifier | NO |
| 6 | source_database_guid | uniqueidentifier | YES |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | checkpoint_file_name | nvarchar(256) | YES |
| 9 | manifest_root | nvarchar(256) | YES |

#### sys.managed_delta_table_forks

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | fork_guid | uniqueidentifier | NO |
| 3 | source_table_guid | uniqueidentifier | NO |
| 4 | source_database_guid | uniqueidentifier | NO |
| 5 | xdes_ts | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | folder_name | nvarchar(40) | YES |

#### sys.managed_delta_table_log_files

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | file_guid | uniqueidentifier | NO |
| 3 | xdes_ts | bigint | NO |
| 4 | append_only | bit | NO |
| 5 | rows_inserted | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | source_table_guid | uniqueidentifier | NO |
| 8 | source_database_guid | uniqueidentifier | YES |
| 9 | manifest_file_name | nvarchar(256) | YES |
| 10 | manifest_root | nvarchar(256) | YES |
| 11 | table_guid | uniqueidentifier | NO |

#### sys.managed_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | object_id | int | NO |
| 3 | table_guid | uniqueidentifier | NO |
| 4 | fork_guid | uniqueidentifier | NO |
| 5 | delta_log_feature_status | int | NO |
| 6 | manifest_root | nvarchar(256) | YES |
| 7 | system_task_consideration_bitmask | int | YES |
| 8 | drop_commit_time | datetime | YES |

#### sys.sys_dw_schemas

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | name | nvarchar(128) | NO |
| 2 | schema_id | int | NO |
| 3 | principal_id | int | YES |
| 4 | is_internal | bit | YES |

---

## DB: LH_INTELLIGENCE_ML

구분: 데이터 · 테이블 수: 15

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.SVC_REPAIR_DETAIL | 15 | - |
| dbo.SVC_REPAIR_MASTER | 29 | - |
| dbo.VEHICLE_BASE_INFO | 9 | - |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |

### 컬럼 상세

#### dbo.SVC_REPAIR_DETAIL

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(8000) | YES | 브랜드 |
| 2 | ID | varchar(8000) | YES | 식별자(ID) |
| 3 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 4 | PROPOSAL_NUMBER | varchar(8000) | YES |  |
| 5 | FRM_PART_IDENTIFIER | varchar(8000) | YES | 부품 |
| 6 | FRM_PART_SEQUENCE | int | YES | 부품 |
| 7 | FRM_PART_NAME | varchar(8000) | YES | 부품 |
| 8 | REPAIR_ORDER_TYPE | varchar(8000) | YES | 주문 |
| 9 | SETTLE_TYPE | varchar(8000) | YES | 유형코드 |
| 10 | MAN_HOUR | int | YES |  |
| 11 | QUANTITY | int | YES | 수량 |
| 12 | CONFIRM_AMOUNT | int | YES | 금액 |
| 13 | CREATE_AT | datetime2 | YES |  |
| 14 | UPDATE_AT | datetime2 | YES |  |
| 15 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.SVC_REPAIR_MASTER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(8000) | YES | 브랜드 |
| 2 | ID | varchar(8000) | YES | 식별자(ID) |
| 3 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 4 | PROPOSAL_NUMBER | varchar(8000) | YES |  |
| 5 | REPAIR_TYPE | varchar(8000) | YES | 정비/수리 |
| 6 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 7 | VEHICLE_PLATE_NUMBER | varchar(8000) | YES | 차량 |
| 8 | VEHICLE_MODEL_NAME | varchar(8000) | YES | 모델 |
| 9 | VEHICLE_VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 10 | VEHICLE_VARIANT_NAME | varchar(8000) | YES | 바리에이션 |
| 11 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 12 | VEHICLE_SUFFIX_NAME | varchar(8000) | YES | 차량 |
| 13 | VEHICLE_COLOR_NAME | varchar(8000) | YES | 색상 |
| 14 | SERVICE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 15 | ODOMETER | int | YES |  |
| 16 | SERVICE_TYPE | varchar(8000) | YES | 서비스 |
| 17 | SERVICE_TYPE_FMS | varchar(8000) | YES | 서비스 |
| 18 | PROPOSAL_STATUS | varchar(8000) | YES | 상태코드 |
| 19 | DAMAGE_TYPE | varchar(8000) | YES | 유형코드 |
| 20 | CUSTOMER_REQUEST | varchar(8000) | YES | 고객 |
| 21 | SERVICE_ADVISOR_SUGGESTION | varchar(8000) | YES | 서비스 |
| 22 | TECHMAN_SUGGESTION | varchar(8000) | YES |  |
| 23 | PART_SUGGESTION | varchar(8000) | YES | 부품 |
| 24 | ADDITIONAL_PROCESS_SUGGESTION | varchar(8000) | YES |  |
| 25 | FREE_SERVICE_SUGGESTION | varchar(8000) | YES | 서비스 |
| 26 | REPEAT_REPAIR | varchar(8000) | YES | 정비/수리 |
| 27 | CREATE_AT | datetime2 | YES |  |
| 28 | UPDATE_AT | datetime2 | YES |  |
| 29 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.VEHICLE_BASE_INFO

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(8000) | YES | 브랜드 |
| 2 | VEHICLE_MODEL_NAME | varchar(8000) | YES | 모델 |
| 3 | VEHICLE_VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 4 | VEHICLE_VARIANT_NAME | varchar(8000) | YES | 바리에이션 |
| 5 | SVC_MODEL_CD | varchar(8000) | YES | 모델 코드 |
| 6 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 7 | VEHICLE_SUFFIX_NAME | varchar(8000) | YES | 차량 |
| 8 | VEHICLE_COLOR_NAME | varchar(8000) | YES | 색상 |
| 9 | ELT_TIME | datetime2 | YES | 시각 |

#### queryinsights.exec_requests_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | distributed_statement_id | uniqueidentifier | YES |
| 2 | database_name | varchar(200) | YES |
| 3 | submit_time | datetime2 | YES |
| 4 | start_time | datetime2 | YES |
| 5 | end_time | datetime2 | YES |
| 6 | is_distributed | int | NO |
| 7 | statement_type | varchar(128) | YES |
| 8 | total_elapsed_time_ms | bigint | YES |
| 9 | login_name | varchar(200) | YES |
| 10 | row_count | bigint | YES |
| 11 | status | varchar(200) | YES |
| 12 | session_id | int | YES |
| 13 | connection_id | uniqueidentifier | YES |
| 14 | program_name | varchar(128) | YES |
| 15 | batch_id | uniqueidentifier | YES |
| 16 | root_batch_id | uniqueidentifier | YES |
| 17 | query_hash | varchar(200) | YES |
| 18 | label | varchar(8000) | YES |
| 19 | result_cache_hit | int | YES |
| 20 | sql_pool_name | varchar(128) | YES |
| 21 | error_code | int | YES |
| 22 | error_severity | int | YES |
| 23 | error_state | int | YES |
| 24 | allocated_cpu_time_ms | bigint | YES |
| 25 | data_scanned_remote_storage_mb | decimal(18,3) | YES |
| 26 | data_scanned_memory_mb | decimal(18,3) | YES |
| 27 | data_scanned_disk_mb | decimal(18,3) | YES |
| 28 | command | varchar(max) | YES |

#### queryinsights.exec_sessions_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | session_id | int | YES |
| 2 | connection_id | uniqueidentifier | YES |
| 3 | session_start_time | datetime2 | YES |
| 4 | session_end_time | datetime2 | YES |
| 5 | program_name | varchar(256) | YES |
| 6 | login_name | varchar(256) | YES |
| 7 | status | varchar(100) | YES |
| 8 | context_info | varchar(128) | YES |
| 9 | total_query_elapsed_time_ms | bigint | YES |
| 10 | last_request_start_time | datetime2 | YES |
| 11 | last_request_end_time | datetime2 | YES |
| 12 | is_user_process | bit | YES |
| 13 | prev_error | int | YES |
| 14 | group_id | bigint | YES |
| 15 | database_id | int | YES |
| 16 | authenticating_database_id | int | YES |
| 17 | open_transaction_count | bigint | YES |
| 18 | text_size | int | YES |
| 19 | language | varchar(256) | YES |
| 20 | date_format | varchar(20) | YES |
| 21 | date_first | int | YES |
| 22 | quoted_identifier | bit | YES |
| 23 | arithabort | bit | YES |
| 24 | ansi_null_dflt_on | bit | YES |
| 25 | ansi_defaults | bit | YES |
| 26 | ansi_warnings | bit | YES |
| 27 | ansi_padding | bit | YES |
| 28 | ansi_nulls | bit | YES |
| 29 | concat_null_yields_null | bit | YES |
| 30 | transaction_isolation_level | int | YES |
| 31 | lock_timeout | bigint | YES |
| 32 | deadlock_priority | int | YES |
| 33 | original_security_id | varchar(200) | YES |
| 34 | database_name | varchar(200) | YES |

#### queryinsights.frequently_run_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | number_of_runs | int | YES |
| 3 | min_run_total_elapsed_time_ms | bigint | YES |
| 4 | max_run_total_elapsed_time_ms | bigint | YES |
| 5 | avg_total_elapsed_time_ms | bigint | YES |
| 6 | number_of_successful_runs | int | YES |
| 7 | number_of_failed_runs | int | YES |
| 8 | number_of_canceled_runs | int | YES |
| 9 | last_run_total_elapsed_time_ms | bigint | YES |
| 10 | last_run_start_time | datetime2 | YES |
| 11 | last_dist_statement_id | uniqueidentifier | YES |
| 12 | query_hash | varchar(200) | YES |
| 13 | last_run_command | varchar(max) | YES |

#### queryinsights.long_running_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | median_total_elapsed_time_ms | float | YES |
| 3 | last_run_total_elapsed_time_ms | bigint | YES |
| 4 | last_run_start_time | datetime2 | YES |
| 5 | last_dist_statement_id | uniqueidentifier | YES |
| 6 | last_run_session_id | int | YES |
| 7 | number_of_runs | int | YES |
| 8 | query_hash | varchar(200) | YES |
| 9 | last_run_command | varchar(max) | YES |

#### queryinsights.sql_pool_insights

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sql_pool_name | varchar(128) | YES |
| 2 | timestamp | datetime2 | YES |
| 3 | max_resource_percentage | int | YES |
| 4 | is_optimized_for_reads | bit | YES |
| 5 | current_workspace_capacity | varchar(16) | YES |
| 6 | is_pool_under_pressure | bit | YES |

#### sys.dm_db_external_tables_log_status

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | object_id | int | NO |
| 2 | latest_log_version | bigint | YES |
| 3 | latest_checkpoint_version | bigint | YES |
| 4 | last_update_time_utc | datetime | NO |
| 5 | is_blocked | bit | NO |

#### sys.external_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | is_blocked | bit | NO |
| 3 | block_reason | tinyint | NO |
| 4 | relative_path | nvarchar(2000) | NO |
| 5 | latest_manifest_version | bigint | YES |
| 6 | latest_checkpoint_version | bigint | YES |
| 7 | latest_checksum_version | bigint | YES |
| 8 | latest_etag | nvarchar(128) | NO |
| 9 | latest_checkpoint_file_name | nvarchar(76) | NO |
| 10 | last_update_time | datetime | NO |

#### sys.managed_delta_table_checkpoints

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delta_log_commit_sequence_id | bigint | NO |
| 2 | part | int | NO |
| 3 | file_guid | uniqueidentifier | NO |
| 4 | version | bigint | NO |
| 5 | source_table_guid | uniqueidentifier | NO |
| 6 | source_database_guid | uniqueidentifier | YES |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | checkpoint_file_name | nvarchar(256) | YES |
| 9 | manifest_root | nvarchar(256) | YES |

#### sys.managed_delta_table_forks

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | fork_guid | uniqueidentifier | NO |
| 3 | source_table_guid | uniqueidentifier | NO |
| 4 | source_database_guid | uniqueidentifier | NO |
| 5 | xdes_ts | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | folder_name | nvarchar(40) | YES |

#### sys.managed_delta_table_log_files

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | file_guid | uniqueidentifier | NO |
| 3 | xdes_ts | bigint | NO |
| 4 | append_only | bit | NO |
| 5 | rows_inserted | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | source_table_guid | uniqueidentifier | NO |
| 8 | source_database_guid | uniqueidentifier | YES |
| 9 | manifest_file_name | nvarchar(256) | YES |
| 10 | manifest_root | nvarchar(256) | YES |
| 11 | table_guid | uniqueidentifier | NO |

#### sys.managed_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | object_id | int | NO |
| 3 | table_guid | uniqueidentifier | NO |
| 4 | fork_guid | uniqueidentifier | NO |
| 5 | delta_log_feature_status | int | NO |
| 6 | manifest_root | nvarchar(256) | YES |
| 7 | system_task_consideration_bitmask | int | YES |
| 8 | drop_commit_time | datetime | YES |

#### sys.sys_dw_schemas

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | name | nvarchar(128) | NO |
| 2 | schema_id | int | NO |
| 3 | principal_id | int | YES |
| 4 | is_internal | bit | YES |

---

## DB: LH_META

구분: 데이터 · 테이블 수: 15

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.md_notebook_info | 8 | - |
| dbo.source_table_column_info | 6 | - |
| dbo.source_table_info | 11 | - |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |

### 컬럼 상세

#### dbo.md_notebook_info

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | JOB_ID | bigint | YES |
| 2 | NOTEBOOK_NAME | varchar(8000) | YES |
| 3 | JOB_TYPE | varchar(8000) | YES |
| 4 | SOURCE_TABLE_NAME | varchar(8000) | YES |
| 5 | TARGET_TABLE_NAME | varchar(8000) | YES |
| 6 | TARGET_TABLE_PK | varchar(8000) | YES |
| 7 | ACTIVE_YN | varchar(8000) | YES |
| 8 | DESCRIPTION | varchar(8000) | YES |

#### dbo.source_table_column_info

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | TABLE_ID | bigint | YES |
| 2 | COLUMN_NAME | varchar(8000) | YES |
| 3 | DATA_TYPE | varchar(8000) | YES |
| 4 | PK_YN | varchar(8000) | YES |
| 5 | ACTIVE_YN | varchar(8000) | YES |
| 6 | COLUMN_ORDER | int | YES |

#### dbo.source_table_info

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | TABLE_ID | bigint | YES |
| 2 | TABLE_NAME | varchar(8000) | YES |
| 3 | TARGET_SCHEMA | varchar(8000) | YES |
| 4 | SOURCE_TABLE_NAME | varchar(8000) | YES |
| 5 | SOURCE_SCHEMA | varchar(8000) | YES |
| 6 | LOAD_TYPE | varchar(8000) | YES |
| 7 | DELTA_COLUMN | varchar(8000) | YES |
| 8 | SOURCE_TABLE_PK | varchar(8000) | YES |
| 9 | SOURCE_DB | varchar(8000) | YES |
| 10 | ACTIVE_YN | varchar(8000) | YES |
| 11 | REMARK | varchar(8000) | YES |

#### queryinsights.exec_requests_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | distributed_statement_id | uniqueidentifier | YES |
| 2 | database_name | varchar(200) | YES |
| 3 | submit_time | datetime2 | YES |
| 4 | start_time | datetime2 | YES |
| 5 | end_time | datetime2 | YES |
| 6 | is_distributed | int | NO |
| 7 | statement_type | varchar(128) | YES |
| 8 | total_elapsed_time_ms | bigint | YES |
| 9 | login_name | varchar(200) | YES |
| 10 | row_count | bigint | YES |
| 11 | status | varchar(200) | YES |
| 12 | session_id | int | YES |
| 13 | connection_id | uniqueidentifier | YES |
| 14 | program_name | varchar(128) | YES |
| 15 | batch_id | uniqueidentifier | YES |
| 16 | root_batch_id | uniqueidentifier | YES |
| 17 | query_hash | varchar(200) | YES |
| 18 | label | varchar(8000) | YES |
| 19 | result_cache_hit | int | YES |
| 20 | sql_pool_name | varchar(128) | YES |
| 21 | error_code | int | YES |
| 22 | error_severity | int | YES |
| 23 | error_state | int | YES |
| 24 | allocated_cpu_time_ms | bigint | YES |
| 25 | data_scanned_remote_storage_mb | decimal(18,3) | YES |
| 26 | data_scanned_memory_mb | decimal(18,3) | YES |
| 27 | data_scanned_disk_mb | decimal(18,3) | YES |
| 28 | command | varchar(max) | YES |

#### queryinsights.exec_sessions_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | session_id | int | YES |
| 2 | connection_id | uniqueidentifier | YES |
| 3 | session_start_time | datetime2 | YES |
| 4 | session_end_time | datetime2 | YES |
| 5 | program_name | varchar(256) | YES |
| 6 | login_name | varchar(256) | YES |
| 7 | status | varchar(100) | YES |
| 8 | context_info | varchar(128) | YES |
| 9 | total_query_elapsed_time_ms | bigint | YES |
| 10 | last_request_start_time | datetime2 | YES |
| 11 | last_request_end_time | datetime2 | YES |
| 12 | is_user_process | bit | YES |
| 13 | prev_error | int | YES |
| 14 | group_id | bigint | YES |
| 15 | database_id | int | YES |
| 16 | authenticating_database_id | int | YES |
| 17 | open_transaction_count | bigint | YES |
| 18 | text_size | int | YES |
| 19 | language | varchar(256) | YES |
| 20 | date_format | varchar(20) | YES |
| 21 | date_first | int | YES |
| 22 | quoted_identifier | bit | YES |
| 23 | arithabort | bit | YES |
| 24 | ansi_null_dflt_on | bit | YES |
| 25 | ansi_defaults | bit | YES |
| 26 | ansi_warnings | bit | YES |
| 27 | ansi_padding | bit | YES |
| 28 | ansi_nulls | bit | YES |
| 29 | concat_null_yields_null | bit | YES |
| 30 | transaction_isolation_level | int | YES |
| 31 | lock_timeout | bigint | YES |
| 32 | deadlock_priority | int | YES |
| 33 | original_security_id | varchar(200) | YES |
| 34 | database_name | varchar(200) | YES |

#### queryinsights.frequently_run_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | number_of_runs | int | YES |
| 3 | min_run_total_elapsed_time_ms | bigint | YES |
| 4 | max_run_total_elapsed_time_ms | bigint | YES |
| 5 | avg_total_elapsed_time_ms | bigint | YES |
| 6 | number_of_successful_runs | int | YES |
| 7 | number_of_failed_runs | int | YES |
| 8 | number_of_canceled_runs | int | YES |
| 9 | last_run_total_elapsed_time_ms | bigint | YES |
| 10 | last_run_start_time | datetime2 | YES |
| 11 | last_dist_statement_id | uniqueidentifier | YES |
| 12 | query_hash | varchar(200) | YES |
| 13 | last_run_command | varchar(max) | YES |

#### queryinsights.long_running_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | median_total_elapsed_time_ms | float | YES |
| 3 | last_run_total_elapsed_time_ms | bigint | YES |
| 4 | last_run_start_time | datetime2 | YES |
| 5 | last_dist_statement_id | uniqueidentifier | YES |
| 6 | last_run_session_id | int | YES |
| 7 | number_of_runs | int | YES |
| 8 | query_hash | varchar(200) | YES |
| 9 | last_run_command | varchar(max) | YES |

#### queryinsights.sql_pool_insights

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sql_pool_name | varchar(128) | YES |
| 2 | timestamp | datetime2 | YES |
| 3 | max_resource_percentage | int | YES |
| 4 | is_optimized_for_reads | bit | YES |
| 5 | current_workspace_capacity | varchar(16) | YES |
| 6 | is_pool_under_pressure | bit | YES |

#### sys.dm_db_external_tables_log_status

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | object_id | int | NO |
| 2 | latest_log_version | bigint | YES |
| 3 | latest_checkpoint_version | bigint | YES |
| 4 | last_update_time_utc | datetime | NO |
| 5 | is_blocked | bit | NO |

#### sys.external_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | is_blocked | bit | NO |
| 3 | block_reason | tinyint | NO |
| 4 | relative_path | nvarchar(2000) | NO |
| 5 | latest_manifest_version | bigint | YES |
| 6 | latest_checkpoint_version | bigint | YES |
| 7 | latest_checksum_version | bigint | YES |
| 8 | latest_etag | nvarchar(128) | NO |
| 9 | latest_checkpoint_file_name | nvarchar(76) | NO |
| 10 | last_update_time | datetime | NO |

#### sys.managed_delta_table_checkpoints

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delta_log_commit_sequence_id | bigint | NO |
| 2 | part | int | NO |
| 3 | file_guid | uniqueidentifier | NO |
| 4 | version | bigint | NO |
| 5 | source_table_guid | uniqueidentifier | NO |
| 6 | source_database_guid | uniqueidentifier | YES |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | checkpoint_file_name | nvarchar(256) | YES |
| 9 | manifest_root | nvarchar(256) | YES |

#### sys.managed_delta_table_forks

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | fork_guid | uniqueidentifier | NO |
| 3 | source_table_guid | uniqueidentifier | NO |
| 4 | source_database_guid | uniqueidentifier | NO |
| 5 | xdes_ts | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | folder_name | nvarchar(40) | YES |

#### sys.managed_delta_table_log_files

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | file_guid | uniqueidentifier | NO |
| 3 | xdes_ts | bigint | NO |
| 4 | append_only | bit | NO |
| 5 | rows_inserted | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | source_table_guid | uniqueidentifier | NO |
| 8 | source_database_guid | uniqueidentifier | YES |
| 9 | manifest_file_name | nvarchar(256) | YES |
| 10 | manifest_root | nvarchar(256) | YES |
| 11 | table_guid | uniqueidentifier | NO |

#### sys.managed_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | object_id | int | NO |
| 3 | table_guid | uniqueidentifier | NO |
| 4 | fork_guid | uniqueidentifier | NO |
| 5 | delta_log_feature_status | int | NO |
| 6 | manifest_root | nvarchar(256) | YES |
| 7 | system_task_consideration_bitmask | int | YES |
| 8 | drop_commit_time | datetime | YES |

#### sys.sys_dw_schemas

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | name | nvarchar(128) | NO |
| 2 | schema_id | int | NO |
| 3 | principal_id | int | YES |
| 4 | is_internal | bit | YES |

---

## DB: LH_REFINED

구분: 데이터 · 테이블 수: 63

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.CO_CALENDAR | 14 | - |
| dbo.CO_CODE | 19 | - |
| dbo.CO_GROUP | 96 | - |
| dbo.CO_HOLDINGS | 22 | - |
| dbo.CO_RECEIPT | 41 | - |
| dbo.CO_USERS | 17 | - |
| dbo.CO_VEHIC | 58 | - |
| dbo.CO_ZIPCODE_NEW | 11 | - |
| dbo.CU_BASE | 18 | - |
| dbo.CU_FAMILY | 18 | - |
| dbo.ECRB_EXCLUDE_VIN | 8 | - |
| dbo.IF_AR | 45 | - |
| dbo.OM_CONTRACT | 40 | - |
| dbo.OM_CONTRACT_CUST | 16 | - |
| dbo.OM_PMA | 8 | - |
| dbo.PT_PART | 9 | - |
| dbo.PT_PART_TIRE_COMPANY | 7 | - |
| dbo.PT_SOUT | 47 | - |
| dbo.PT_SOUT_DETL | 42 | - |
| dbo.SVC_BP_PROC_TIME | 19 | - |
| dbo.SVC_DLR_TWC | 46 | - |
| dbo.SVC_FRM | 17 | - |
| dbo.SVC_INSU | 21 | - |
| dbo.SVC_INSU_DTL | 29 | - |
| dbo.SVC_MONTHLY_SALES_TARGET | 12 | - |
| dbo.SVC_PROPO | 66 | - |
| dbo.SVC_PROPO_BPKPI | 13 | - |
| dbo.SVC_PROPO_LABOR | 18 | - |
| dbo.SVC_PROPO_PART | 29 | - |
| dbo.SVC_RESV | 38 | - |
| dbo.SVC_SERVICE_KPI_ELEMENT_DEALER | 17 | - |
| dbo.SVC_SETTLE | 35 | - |
| dbo.SVC_STALL | 16 | - |
| dbo.SVC_STALL_WORKTIME | 11 | - |
| dbo.SVC_TMKR_TWC | 44 | - |
| dbo.SVC_TMKR_TWC_PART | 13 | - |
| dbo.TACC_CD | 17 | - |
| dbo.TACC_DEALER_ORDER | 7 | - |
| dbo.TACC_ITEM | 12 | - |
| dbo.TACC_MBS | 14 | - |
| dbo.TACC_MIS | 26 | - |
| dbo.TACC_MTS | 15 | - |
| dbo.TACC_PERSON | 17 | - |
| dbo.TACC_VARIANT | 10 | - |
| dbo.TACC_VC_CD | 17 | - |
| dbo.TF_DCM_INFO | 19 | - |
| dbo.VS_COLOR | 23 | - |
| dbo.VS_MODEL | 12 | - |
| dbo.VS_MODEL_YEAR | 23 | - |
| dbo.VS_SFX | 44 | - |
| dbo.VS_VARIANT | 37 | - |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |

### 컬럼 상세

#### dbo.CO_CALENDAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BASE_DATE | varchar(8000) | YES |
| 3 | WEEK_NO_BY_MONTH | int | YES |
| 4 | WEEK_DAY | varchar(8000) | YES |
| 5 | WORK_KOREA | varchar(8000) | YES |
| 6 | WORK_OVERSEAS | varchar(8000) | YES |
| 7 | WORK_DEALER | varchar(8000) | YES |
| 8 | WORK_HQ | varchar(8000) | YES |
| 9 | WORK_CPD | varchar(8000) | YES |
| 10 | REG_DT | datetime2 | YES |
| 11 | REG_USER_ID | varchar(8000) | YES |
| 12 | UPD_DT | datetime2 | YES |
| 13 | UPD_USER_ID | varchar(8000) | YES |
| 14 | ELT_TIME | datetime2 | YES |

#### dbo.CO_CODE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | CODE_TYPE | varchar(8000) | YES |
| 3 | CODE | varchar(8000) | YES |
| 4 | CODE_NAME | varchar(8000) | YES |
| 5 | CODE_TYPE_NAME | varchar(8000) | YES |
| 6 | ENGLISH_CODE_NAME | varchar(8000) | YES |
| 7 | DISPLAY_ORDER | varchar(8000) | YES |
| 8 | UP_CODE_TYPE | varchar(8000) | YES |
| 9 | REMARK | varchar(8000) | YES |
| 10 | USE_YN | varchar(8000) | YES |
| 11 | INCLUDE_ALL_YN | varchar(8000) | YES |
| 12 | ATTRIBUTE1 | varchar(8000) | YES |
| 13 | ATTRIBUTE2 | varchar(8000) | YES |
| 14 | ATTRIBUTE3 | varchar(8000) | YES |
| 15 | CREATE_AT | datetime2 | YES |
| 16 | CREATE_USER_ID | varchar(8000) | YES |
| 17 | UPDATE_AT | datetime2 | YES |
| 18 | UPDATE_USER_ID | varchar(8000) | YES |
| 19 | ELT_TIME | datetime2 | YES |

#### dbo.CO_GROUP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | GROUP_ID | varchar(8000) | YES |
| 3 | GROUP_NAME | varchar(8000) | YES |
| 4 | GROUP_FULL_NAME | varchar(8000) | YES |
| 5 | GROUP_TYPE | varchar(8000) | YES |
| 6 | CHIEF_NAME | varchar(8000) | YES |
| 7 | CHIEF_ID | varchar(8000) | YES |
| 8 | BIZ_REG_NO | varchar(8000) | YES |
| 9 | ZIP | varchar(8000) | YES |
| 10 | ADDR | varchar(8000) | YES |
| 11 | ADDR_NO | varchar(8000) | YES |
| 12 | PDI_AREA | varchar(8000) | YES |
| 13 | CPD_AREA | varchar(8000) | YES |
| 14 | FOUND_DT | varchar(8000) | YES |
| 15 | SHOWROOM_NO | int | YES |
| 16 | KAIDA_GROUP_ID | varchar(8000) | YES |
| 17 | FEE_DELIVERY | int | YES |
| 18 | FEE_TRANSFER | int | YES |
| 19 | SERVICE_YN | varchar(8000) | YES |
| 20 | SERVICE_IP | varchar(8000) | YES |
| 21 | SERVICE_PORT | int | YES |
| 22 | DSPY_RANK | int | YES |
| 23 | DAILY_REPORT_SEQ | varchar(8000) | YES |
| 24 | GROUP_SHORT_NAME | varchar(8000) | YES |
| 25 | GROUP_AREA | varchar(8000) | YES |
| 26 | STOCK_VALUE_TYPE | varchar(8000) | YES |
| 27 | USAGE_TYPE | varchar(8000) | YES |
| 28 | TMKR_SERVICE_CD | varchar(8000) | YES |
| 29 | TMKR_PARTS_CD | varchar(8000) | YES |
| 30 | TMKR_SALES_CD | varchar(8000) | YES |
| 31 | TMC_SERVICE_CD | varchar(8000) | YES |
| 32 | TMC_PARTS_CD | varchar(8000) | YES |
| 33 | TMC_SALES_CD | varchar(8000) | YES |
| 34 | UP_GROUP_ID | varchar(8000) | YES |
| 35 | SYSTEM_USE_YN | varchar(8000) | YES |
| 36 | DEALER_YN | varchar(8000) | YES |
| 37 | SHOP_YN | varchar(8000) | YES |
| 38 | HIGHEST_GROUP_YN | varchar(8000) | YES |
| 39 | USE_YN | varchar(8000) | YES |
| 40 | PHOTO_FILE_DIR | varchar(8000) | YES |
| 41 | ORG_ID | int | YES |
| 42 | SET_OF_BOOKS_ID | int | YES |
| 43 | LOCATION_ID | int | YES |
| 44 | REG_USER_ID | varchar(8000) | YES |
| 45 | REG_DT | datetime2 | YES |
| 46 | UPD_USER_ID | varchar(8000) | YES |
| 47 | UPD_DT | datetime2 | YES |
| 48 | DEALER_ID | varchar(8000) | YES |
| 49 | CI_IMAGE_ID | varchar(8000) | YES |
| 50 | TEL_AREA | varchar(8000) | YES |
| 51 | TEL_NO | varchar(8000) | YES |
| 52 | FAX_AREA | varchar(8000) | YES |
| 53 | FAX_NO | varchar(8000) | YES |
| 54 | BIZ_TYPE_NM | varchar(8000) | YES |
| 55 | BIZ_COND_NM | varchar(8000) | YES |
| 56 | SMS_NAME | varchar(8000) | YES |
| 57 | SVC_SMS_NO | varchar(8000) | YES |
| 58 | NEW_TMKR_PARTS_CD | varchar(8000) | YES |
| 59 | NEW_TMC_PARTS_CD | varchar(8000) | YES |
| 60 | SVC_REG_NO | varchar(8000) | YES |
| 61 | SVC_CHRG_NM | varchar(8000) | YES |
| 62 | FD_CODE_SEA | varchar(8000) | YES |
| 63 | FD_CODE_AIR | varchar(8000) | YES |
| 64 | BRAND_CD | varchar(8000) | YES |
| 65 | SVC_TR_USER_ID | varchar(8000) | YES |
| 66 | PORT_CD | varchar(8000) | YES |
| 67 | GROUP_ENG_NAME | varchar(8000) | YES |
| 68 | CONTRACT_ALERT_YN | varchar(8000) | YES |
| 69 | CUSTOMER_ALERT_YN | varchar(8000) | YES |
| 70 | BP_SHOP_YN | varchar(8000) | YES |
| 71 | BIZ_CORP_NO | varchar(8000) | YES |
| 72 | SVC_STAMP_ID | varchar(8000) | YES |
| 73 | GEO_LOC_X | varchar(8000) | YES |
| 74 | GEO_LOC_Y | varchar(8000) | YES |
| 75 | ZOOM_LVL | varchar(8000) | YES |
| 76 | TR_ZIP | varchar(8000) | YES |
| 77 | TR_ADDR | varchar(8000) | YES |
| 78 | TR_ADDR_NO | varchar(8000) | YES |
| 79 | TR_ADDR_FLAG | varchar(8000) | YES |
| 80 | TR_ADDR_INSERT_FLAG | varchar(8000) | YES |
| 81 | TR_ADDR_BLD_NO | varchar(8000) | YES |
| 82 | TR_ADDR_RESULT | varchar(8000) | YES |
| 83 | BASE_SVC_CENTER | varchar(8000) | YES |
| 84 | CUSTOMER_SAVE_YN | varchar(8000) | YES |
| 85 | CALL_BLOCK_AREA | varchar(8000) | YES |
| 86 | CALL_BLOCK_NO | varchar(8000) | YES |
| 87 | CPO_YN | varchar(8000) | YES |
| 88 | HOLDING_ID | varchar(8000) | YES |
| 89 | DZ_BIZAREA_CD | varchar(8000) | YES |
| 90 | MOLIT_ID | varchar(8000) | YES |
| 91 | MOLIT_PASSWD | varchar(8000) | YES |
| 92 | MOLIT_KEY | varchar(8000) | YES |
| 93 | MOLIT_PGMCODE | varchar(8000) | YES |
| 94 | GROUP_SHORT_ENG_NAME | varchar(8000) | YES |
| 95 | TAX_BIZ_NO | varchar(8000) | YES |
| 96 | ELT_TIME | datetime2 | YES |

#### dbo.CO_HOLDINGS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | GROUP_ID | varchar(8000) | YES |
| 3 | GROUP_NAME | varchar(8000) | YES |
| 4 | GROUP_FULL_NAME | varchar(8000) | YES |
| 5 | GROUP_TYPE_NAME | varchar(8000) | YES |
| 6 | FOUND_DATE | varchar(8000) | YES |
| 7 | SERVICE_YN | varchar(8000) | YES |
| 8 | GROUP_SHORT_NAME | varchar(8000) | YES |
| 9 | UP_GROUP_ID | varchar(8000) | YES |
| 10 | SYSTEM_USE_YN | varchar(8000) | YES |
| 11 | DEALER_YN | varchar(8000) | YES |
| 12 | SHOP_YN | varchar(8000) | YES |
| 13 | USE_YN | varchar(8000) | YES |
| 14 | ORG_ID | int | YES |
| 15 | LOCATION_ID | int | YES |
| 16 | BRAND_CD | varchar(8000) | YES |
| 17 | GROUP_ENGLISH_NAME | varchar(8000) | YES |
| 18 | BP_SHOP_YN | varchar(8000) | YES |
| 19 | GROUP_CODE | varchar(8000) | YES |
| 20 | CREATE_AT | datetime2 | YES |
| 21 | UPDATE_AT | datetime2 | YES |
| 22 | ELT_TIME | datetime2 | YES |

#### dbo.CO_RECEIPT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | RECEIPT_PART | varchar(8000) | YES |
| 5 | RECEIPT_PART_NAME | varchar(8000) | YES |
| 6 | RECEIPT_SEQ | float | YES |
| 7 | CANCEL_SEQ | float | YES |
| 8 | DEALER_NAME | varchar(8000) | YES |
| 9 | MANAGE_NUMBER | varchar(8000) | YES |
| 10 | RECEIPT_DATE | varchar(8000) | YES |
| 11 | REAL_RECEIPT_DATE | varchar(8000) | YES |
| 12 | CANCEL_DATE | datetime2 | YES |
| 13 | RECEIPT_TYPE_NAME | varchar(8000) | YES |
| 14 | CASH_AMOUNT | float | YES |
| 15 | CARD_AMOUNT | float | YES |
| 16 | BANK_TRANSFER_AMOUNT | float | YES |
| 17 | COUPON_AMOUNT | float | YES |
| 18 | CREDIT_AMOUNT | float | YES |
| 19 | EXTRA_DISCOUNT_AMOUNT | float | YES |
| 20 | PSP_AMOUNT | float | YES |
| 21 | APP_MILEAGE_AMOUNT | float | YES |
| 22 | SERVICE_EXCHAGE_AMOUNT | float | YES |
| 23 | PARTIAL_REFUND_YN | varchar(8000) | YES |
| 24 | PARTIAL_REFUND_BALANCE | float | YES |
| 25 | PARTIAL_REFERENCE_SEQ | float | YES |
| 26 | TOTAL_RECEIPT_AMOUNT | float | YES |
| 27 | SERVICE_KEY_1 | varchar(8000) | YES |
| 28 | SERVICE_KEY_2 | float | YES |
| 29 | SERVICE_KEY_3 | float | YES |
| 30 | SERVICE_KEY_4 | varchar(8000) | YES |
| 31 | KEY_KIND_NAME | varchar(8000) | YES |
| 32 | CANCEL_YN | varchar(8000) | YES |
| 33 | VARIANT_NAME | varchar(8000) | YES |
| 34 | DELETE_FLAG | varchar(8000) | YES |
| 35 | DMS_TRANSACTION_ID | float | YES |
| 36 | ORG_ID | float | YES |
| 37 | LOCATION_ID | float | YES |
| 38 | STATUS | varchar(8000) | YES |
| 39 | CREATE_AT | datetime2 | YES |
| 40 | UPDATE_AT | datetime2 | YES |
| 41 | ELT_TIME | datetime2 | YES |

#### dbo.CO_USERS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND | varchar(8000) | YES |
| 3 | USER_ID | varchar(8000) | YES |
| 4 | USER_NAME | varchar(8000) | YES |
| 5 | DEALER_ID | varchar(8000) | YES |
| 6 | DEALER_NAME | varchar(8000) | YES |
| 7 | GROUP_ID | varchar(8000) | YES |
| 8 | GROUP_NAME | varchar(8000) | YES |
| 9 | TITLE_NAME | varchar(8000) | YES |
| 10 | EMAIL | varchar(8000) | YES |
| 11 | USER_TYPE | varchar(8000) | YES |
| 12 | USER_TYPE_NAME | varchar(8000) | YES |
| 13 | WORK_START_DATE | varchar(8000) | YES |
| 14 | ACTIVE_YN | varchar(8000) | YES |
| 15 | CREATE_AT | datetime2 | YES |
| 16 | UPDATE_AT | datetime2 | YES |
| 17 | ELT_TIME | datetime2 | YES |

#### dbo.CO_VEHIC

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 3 | FRONT_PLATE_NUMBER | varchar(8000) | YES |  |
| 4 | REAR_PLATE_NUMBER | varchar(8000) | YES |  |
| 5 | VIS | varchar(8000) | YES |  |
| 6 | CONTRACT_NUMBER | int | YES | 계약 |
| 7 | VEHICLE_MODEL_YEAR | varchar(8000) | YES | 모델 |
| 8 | VEHICLE_BRAND_CODE | varchar(8000) | YES | 브랜드 |
| 9 | VEHICLE_MAKER_CODE | varchar(8000) | YES | 차량 |
| 10 | VEHICLE_VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 11 | VEHICLE_SUFFIX_CODE | varchar(8000) | YES | 차량 |
| 12 | ODOMETER | int | YES |  |
| 13 | VEHICLE_VARIANT_NAME | varchar(8000) | YES | 바리에이션 |
| 14 | SERVICE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 15 | VEHICLE_MODEL_CODE | varchar(8000) | YES | 모델 |
| 16 | OPTION_CODE1 | varchar(8000) | YES |  |
| 17 | OPTION_CODE2 | varchar(8000) | YES |  |
| 18 | OPTION_CODE3 | varchar(8000) | YES |  |
| 19 | OPTION_CODE4 | varchar(8000) | YES |  |
| 20 | KEY_NUMBER | varchar(8000) | YES |  |
| 21 | GRADE | varchar(8000) | YES |  |
| 22 | IMPORT_YN | varchar(8000) | YES | 여부(Y/N) |
| 23 | EVENT | varchar(8000) | YES |  |
| 24 | LINEIN_DATE | varchar(8000) | YES | 일자 |
| 25 | DELIVERY_DATE | varchar(8000) | YES | 출고 |
| 26 | LINEOFF_DATE | varchar(8000) | YES | 일자 |
| 27 | VEHICLE_COLOR_COMBINATION_CODE | varchar(8000) | YES | 컬러조합 |
| 28 | EXTERIOR_CODE | varchar(8000) | YES | 코드 |
| 29 | INTERIOR_CODE | varchar(8000) | YES | 코드 |
| 30 | ENGINE_NUMBER | varchar(8000) | YES |  |
| 31 | FORCE_REGISTER_DATE | datetime2 | YES | 등록 |
| 32 | FORCE_REGISTER_YN | varchar(8000) | YES | 등록 |
| 33 | FORCE_REGISTER_DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 34 | FORCE_REGISTER_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 35 | FIRST_RECEIPT_DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 36 | FIRST_RECEIPT_DATE | datetime2 | YES | 일자 |
| 37 | SALES_DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 38 | SALES_SERVICE_CONSULTANT_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 39 | REGISTRATION_DATE | varchar(8000) | YES | 등록 |
| 40 | LAST_RECEIPT_DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 41 | LAST_RECEIPT_DATE | datetime2 | YES | 일자 |
| 42 | VEHICLE_MAGIC | int | YES | 차량 |
| 43 | ROADSIDE_ASSISTANCE_SERVICE_NUMBER | varchar(8000) | YES | 서비스 |
| 44 | EW_NUMBER | varchar(8000) | YES |  |
| 45 | SALES_TYPE | varchar(8000) | YES | 판매 |
| 46 | ROADSIDE_ASSISTANCE_SERVICE_START_DATE | varchar(8000) | YES | 서비스 |
| 47 | ROADSIDE_ASSISTANCE_SERVICE_END_DATE | varchar(8000) | YES | 서비스 |
| 48 | BASE_ODOMETER | int | YES |  |
| 49 | BASE_ODOMETER_UPDATE_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 50 | BASE_ODOMETER_UPDATE_DATE | datetime2 | YES | 일자 |
| 51 | UPDATE_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 52 | UPDATE_AT | datetime2 | YES |  |
| 53 | FIRST_OWNER_YN | varchar(8000) | YES | 여부(Y/N) |
| 54 | OWNER_CHANGED_UPDATE_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 55 | OWNER_CHANGED_UPDATE_DATE | datetime2 | YES | 일자 |
| 56 | HYBRID_VEHICLE_BADGE_YN | varchar(8000) | YES | 차량 |
| 57 | TFSKR_MANAGE_YN | varchar(8000) | YES | 여부(Y/N) |
| 58 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.CO_ZIPCODE_NEW

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | ZIP_CODE | varchar(8000) | YES |
| 3 | ZIP_SEQUENCE | varchar(8000) | YES |
| 4 | CITY | varchar(8000) | YES |
| 5 | GU | varchar(8000) | YES |
| 6 | DONG | varchar(8000) | YES |
| 7 | DETAIL_ADDRESS | varchar(8000) | YES |
| 8 | BUNJI | varchar(8000) | YES |
| 9 | CREATE_AT | varchar(8000) | YES |
| 10 | UPDATE_AT | varchar(8000) | YES |
| 11 | ELT_TIME | datetime2 | YES |

#### dbo.CU_BASE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | CUSTOMER_SEQ | bigint | YES |
| 3 | CUSTOMER_NAME | varchar(8000) | YES |
| 4 | CUST_TYPE_NAME | varchar(8000) | YES |
| 5 | DEALER_NAME | varchar(8000) | YES |
| 6 | ZIP_REGIST | varchar(8000) | YES |
| 7 | ADDR_REGIST | varchar(8000) | YES |
| 8 | ADDR_NUMBER_REGIST | varchar(8000) | YES |
| 9 | DISCUSE_YN | varchar(8000) | YES |
| 10 | DELIVERY_YN | varchar(8000) | YES |
| 11 | CITY | varchar(8000) | YES |
| 12 | GU | varchar(8000) | YES |
| 13 | DONG | varchar(8000) | YES |
| 14 | REGIST_SHOP_NAME | varchar(8000) | YES |
| 15 | LAST_CONTRACT_DATE | datetime2 | YES |
| 16 | CONSIGN_SALES_FLAG | varchar(8000) | YES |
| 17 | CREATE_AT | datetime2 | YES |
| 18 | UPDATE_AT | datetime2 | YES |

#### dbo.CU_FAMILY

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | CUSTOMER_SEQ | float | YES |
| 3 | FAMILY_SEQ | float | YES |
| 4 | FAMILY_TYPE_NAME | varchar(8000) | YES |
| 5 | FAMILY_NAME | varchar(8000) | YES |
| 6 | DEALER_NAME | varchar(8000) | YES |
| 7 | GENDER | varchar(8000) | YES |
| 8 | FAMILY_CUSTOMER_SEQ | float | YES |
| 9 | FAMILY_ZIP_REGIST | varchar(8000) | YES |
| 10 | FAMILY_ADDRESS_REGIST | varchar(8000) | YES |
| 11 | FAMILY_ADDRESS_NUMBER_REGIST | varchar(8000) | YES |
| 12 | LAST_LINK_CONTRACT_NUMBER | float | YES |
| 13 | DELETE_YN | varchar(8000) | YES |
| 14 | CITY | varchar(8000) | YES |
| 15 | GU | varchar(8000) | YES |
| 16 | CREATE_AT | datetime2 | YES |
| 17 | UPDATE_AT | datetime2 | YES |
| 18 | ELT_TIME | datetime2 | YES |

#### dbo.ECRB_EXCLUDE_VIN

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DELIVERY_MONTH | varchar(8000) | YES |
| 3 | VIN | varchar(8000) | YES |
| 4 | SERVICE_TYPE_CODE | varchar(8000) | YES |
| 5 | SERIVCE_TYPE_NAME | varchar(8000) | YES |
| 6 | DEALER_NAME | varchar(8000) | YES |
| 7 | CREATE_AT | datetime2 | YES |
| 8 | ELT_TIME | datetime2 | YES |

#### dbo.IF_AR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | INTERFACE_ID | float | YES |
| 3 | GROUP_ID | float | YES |
| 4 | COMPANY_CODE | varchar(8000) | YES |
| 5 | ORG_ID | float | YES |
| 6 | LOCATION_ID | float | YES |
| 7 | DEALER_NAME | varchar(8000) | YES |
| 8 | module | varchar(8000) | YES |
| 9 | trx_type | varchar(8000) | YES |
| 10 | TRANSACTION_FLAG | varchar(8000) | YES |
| 11 | LINE_ATTRIBUTE1 | varchar(8000) | YES |
| 12 | LINE_ATTRIBUTE2 | varchar(8000) | YES |
| 13 | LINE_ATTRIBUTE3 | varchar(8000) | YES |
| 14 | LINE_DESCRIPTION | varchar(8000) | YES |
| 15 | CLIENT_ORG_ID | float | YES |
| 16 | CLIENT_LOCATION_ID | float | YES |
| 17 | CLIENT_DEALER_ID | varchar(8000) | YES |
| 18 | CUSTOMER_SEQ | float | YES |
| 19 | COMPANY_SEQ | float | YES |
| 20 | CURRENCY_CODE | varchar(8000) | YES |
| 21 | CONVERSION_DATE | datetime2 | YES |
| 22 | CONVERSION_TYPE | varchar(8000) | YES |
| 23 | CONVERSION_RATE | float | YES |
| 24 | TRASACTION_DATE | datetime2 | YES |
| 25 | GL_DATE | datetime2 | YES |
| 26 | TERM_ID | float | YES |
| 27 | QUANTITY | float | YES |
| 28 | UNIT_SELLING_PRICE | float | YES |
| 29 | AMOUNT | float | YES |
| 30 | VAT_TAX_ID | float | YES |
| 31 | VAT_AMOUNT | float | YES |
| 32 | STATUS | varchar(8000) | YES |
| 33 | CLIENT_NAME | varchar(8000) | YES |
| 34 | INVOICE_AMOUNT | float | YES |
| 35 | GL_AMOUNT | float | YES |
| 36 | INTERFACE_DATE | datetime2 | YES |
| 37 | DELETE_FLAG | varchar(8000) | YES |
| 38 | DMS_TRANSACTION_ID | float | YES |
| 39 | BRAND | varchar(8000) | YES |
| 40 | VIN | varchar(8000) | YES |
| 41 | INTERFACE_CONFIRM_STATUS | varchar(8000) | YES |
| 42 | FAMILY_SEQ | float | YES |
| 43 | CREATE_AT | datetime2 | YES |
| 44 | UPDATE_AT | datetime2 | YES |
| 45 | ELT_TIME | datetime2 | YES |

#### dbo.OM_CONTRACT

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | CONTRACT_NUMBER | bigint | YES | 계약 |
| 3 | DEALER_CONTRACT_NUMBER | varchar(8000) | YES | 딜러 |
| 4 | CONTRACT_DATE | varchar(8000) | YES | 계약 |
| 5 | CONTRACT_STAT_NAME | varchar(8000) | YES | 계약 |
| 6 | ALLOCATION_YN | varchar(8000) | YES | 여부(Y/N) |
| 7 | STATUS_MODIFY_DATE | varchar(8000) | YES | 일자 |
| 8 | DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 9 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 10 | SHOP_CODE | varchar(8000) | YES | 전시장 |
| 11 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 12 | OWNER_TYPE_NAME | varchar(8000) | YES | 명칭 |
| 13 | CUST_SEQ | bigint | YES | 고객 |
| 14 | COMPANY_SEQ | bigint | YES | 순번 |
| 15 | REAL_CUST_SEQ | bigint | YES | 고객 |
| 16 | OWNER_SEQ | bigint | YES | 순번 |
| 17 | BRAND_CODE | varchar(8000) | YES | 브랜드 |
| 18 | MODEL_CODE | varchar(8000) | YES | 모델 |
| 19 | MODEL_NAME | varchar(8000) | YES | 모델 |
| 20 | VARIANT_CODE | varchar(8000) | YES | 바리에이션 |
| 21 | VARIANT_NAME | varchar(8000) | YES | 바리에이션 |
| 22 | MODEL_YEAR | varchar(8000) | YES | 모델 |
| 23 | SFX_CODE | varchar(8000) | YES | SFX(트림) |
| 24 | VEHICLE_COLOR_NAME | varchar(8000) | YES | 색상 |
| 25 | VIN | varchar(8000) | YES | 차대번호(VIN) |
| 26 | VEHIC_MAGIC | int | YES | 차량 |
| 27 | SALES_TYPE_NAME | varchar(8000) | YES | 판매 |
| 28 | DELIVERY_ACTUAL_DATE | varchar(8000) | YES | 출고 |
| 29 | LAST_RETAIL_SALES_DATE | varchar(8000) | YES | 판매 |
| 30 | RETAIL_SALES_CUST_ZIP | varchar(8000) | YES | 고객 |
| 31 | RETAIL_SALES_CUST_ADDRESS | varchar(8000) | YES | 고객 |
| 32 | RETAIL_SALES_CUST_ADDRESS2 | varchar(8000) | YES | 고객 |
| 33 | PMA_INOUT_YN | varchar(8000) | YES | 여부(Y/N) |
| 34 | FAMILY_SEQ | bigint | YES | 순번 |
| 35 | PMA_CITY | varchar(8000) | YES | 시 |
| 36 | PMA_GU | varchar(8000) | YES | 구 |
| 37 | LEAD_ID | bigint | YES | 식별자(ID) |
| 38 | CREATE_AT | datetime2 | YES |  |
| 39 | UPDATE_AT | datetime2 | YES |  |
| 40 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.OM_CONTRACT_CUST

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | CONTRACT_NUMBER | bigint | YES | 계약 |
| 3 | OWNER_TYPE | varchar(8000) | YES | 유형코드 |
| 4 | CUSTOMER_NAME | varchar(8000) | YES | 고객 |
| 5 | CUSTOMER_ZIPCODE | varchar(8000) | YES | 고객 |
| 6 | CUSTOMER_ADDRESS | varchar(8000) | YES | 고객 |
| 7 | CUSTOMER_DETAIL_ADDRESS | varchar(8000) | YES | 고객 |
| 8 | COMPANY_ZIPCODE | varchar(8000) | YES | 코드 |
| 9 | COMPANY_ADDRESS | varchar(8000) | YES |  |
| 10 | COMPANY_DETAIL_ADDRESS | varchar(8000) | YES |  |
| 11 | LEASE_ZIPCODE | varchar(8000) | YES | 코드 |
| 12 | LEASE_ADDRESS | varchar(8000) | YES |  |
| 13 | LEASE_DETAIL_ADDRESS | varchar(8000) | YES |  |
| 14 | PMA_CITY | varchar(8000) | YES | 시 |
| 15 | PMA_GU | varchar(8000) | YES | 구 |
| 16 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.OM_PMA

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DEALER_NAME | varchar(8000) | YES |
| 3 | CITY | varchar(8000) | YES |
| 4 | GU | varchar(8000) | YES |
| 5 | USE_YN | varchar(8000) | YES |
| 6 | CREATE_AT | datetime2 | YES |
| 7 | UPDATE_AT | datetime2 | YES |
| 8 | ELT_TIME | datetime2 | YES |

#### dbo.PT_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | PART_NUMBER | varchar(8000) | YES | 부품 |
| 3 | PART_NAME | varchar(8000) | YES | 부품 |
| 4 | PRODUCT_CODE | varchar(8000) | YES | 코드 |
| 5 | FRANCHISE_NAME | varchar(8000) | YES | 명칭 |
| 6 | SUPPLIER_CODE | varchar(8000) | YES | 코드 |
| 7 | CREATE_AT | datetime2 | YES |  |
| 8 | UPDATE_AT | datetime2 | YES |  |
| 9 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.PT_PART_TIRE_COMPANY

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | PART_NUMBER | varchar(8000) | YES | 부품 |
| 3 | TIRE_COMPANY | varchar(8000) | YES |  |
| 4 | TIRE_GUBUN | varchar(8000) | YES |  |
| 5 | CREATE_AT | datetime2 | YES |  |
| 6 | UPDATE_AT | datetime2 | YES |  |
| 7 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.PT_SOUT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | SOUT_NUMBER | varchar(8000) | YES |
| 5 | SOUT_DATE | varchar(8000) | YES |
| 6 | SOUT_TYPE_NAME | varchar(8000) | YES |
| 7 | SOUT_KIND_NAME | varchar(8000) | YES |
| 8 | STATUS_NAME | varchar(8000) | YES |
| 9 | SOUT_FINISH_YN | varchar(8000) | YES |
| 10 | SOUT_CONFIRM_DATE | varchar(8000) | YES |
| 11 | INVOICE_DATE | varchar(8000) | YES |
| 12 | SERVICE_SHOP_NAME | varchar(8000) | YES |
| 13 | SERVICE_PROPO_DATE | varchar(8000) | YES |
| 14 | SERVICE_PROPO_SEQ | bigint | YES |
| 15 | ACCOUNT_LINK_YN | varchar(8000) | YES |
| 16 | ACCOUNT_LINK_DATE | datetime2 | YES |
| 17 | ACCOUNT_LINK_KEY | varchar(8000) | YES |
| 18 | DESTINATION_SHOP_NAME | varchar(8000) | YES |
| 19 | AUTO_CREA_YN | varchar(8000) | YES |
| 20 | SOUT_SUPLY_AMOUNT | float | YES |
| 21 | DISCOUNT_RATE | float | YES |
| 22 | DISCOUNT_AMOUNT | float | YES |
| 23 | SALE_AMOUNT | float | YES |
| 24 | SOUT_VAT_AMOUNT | float | YES |
| 25 | FINAL_AMOUNT | float | YES |
| 26 | PAY_TYPE_NAME | varchar(8000) | YES |
| 27 | VIN | varchar(8000) | YES |
| 28 | FRONT_PLATE_NUMBER | varchar(8000) | YES |
| 29 | REAR_PLATE_NUMBER | varchar(8000) | YES |
| 30 | CANCEL_YN | varchar(8000) | YES |
| 31 | INTERNAL_USAGE | varchar(8000) | YES |
| 32 | RECEIPT_DATE | varchar(8000) | YES |
| 33 | RECEIPT_AMOUNT | float | YES |
| 34 | TERM_ID | bigint | YES |
| 35 | TAX_TYPE | bigint | YES |
| 36 | TAX_RATE | float | YES |
| 37 | PAYBACK_YN | varchar(8000) | YES |
| 38 | RECEIPT_KEY | float | YES |
| 39 | AR_KEY | float | YES |
| 40 | ORDER_SHOP_NAME | varchar(8000) | YES |
| 41 | DEALER_NAME | varchar(8000) | YES |
| 42 | INVOICE_PRINT_YN | varchar(8000) | YES |
| 43 | INVOICE_PRINT_DAY | varchar(8000) | YES |
| 44 | QUOTATION_NUMBER | varchar(8000) | YES |
| 45 | CREATE_AT | datetime2 | YES |
| 46 | UPDATE_AT | datetime2 | YES |
| 47 | ELT_TIME | datetime2 | YES |

#### dbo.PT_SOUT_DETL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | SOUT_NUMBER | varchar(8000) | YES |
| 5 | LINE_NUMBER | varchar(8000) | YES |
| 6 | PART_NUMBER | varchar(8000) | YES |
| 7 | SOUT_ORDER_QUANTITY | float | YES |
| 8 | SOUT_QUANTITY | float | YES |
| 9 | SOUT_CONFIEM_QUANTITY | float | YES |
| 10 | SOUT_DATE | varchar(8000) | YES |
| 11 | SOUT_CONFIRM_DATE | varchar(8000) | YES |
| 12 | SOUT_UNIT | varchar(8000) | YES |
| 13 | CONVERSION_QUANTITY | float | YES |
| 14 | SOUT_PRICE | float | YES |
| 15 | SOUT_AMOUNT | float | YES |
| 16 | DISCOUNT_RATE | float | YES |
| 17 | DISCOUNT_AMOUNT | float | YES |
| 18 | SALE_PRICE | float | YES |
| 19 | SALE_AMOUNT | float | YES |
| 20 | SOUT_VAT_AMOUNT | float | YES |
| 21 | FINAL_AMOUNT | float | YES |
| 22 | STOCK_PRICE_AT_SOUT | float | YES |
| 23 | STOCK_AMOUNT_AT_SOUT | float | YES |
| 24 | SOUT_START_DAY | varchar(8000) | YES |
| 25 | SOUT_END_DAY | varchar(8000) | YES |
| 26 | STATUS_NAME | varchar(8000) | YES |
| 27 | SOUT_FINAL_YN | varchar(8000) | YES |
| 28 | SERVICE_SOUT_KIND | varchar(8000) | YES |
| 29 | CANCEL_QUANTITY | float | YES |
| 30 | CANCEL_YN | varchar(8000) | YES |
| 31 | SERIVCE_SHOP_CD | varchar(8000) | YES |
| 32 | SERVICE_PROPO_DATE | varchar(8000) | YES |
| 33 | SERVICE_PROPO_SEQ | bigint | YES |
| 34 | SERVICE_PART_NUMBER | varchar(8000) | YES |
| 35 | SERVICE_PART_SEQ | int | YES |
| 36 | TWC_STATUS | varchar(8000) | YES |
| 37 | PAYBACK_YN | varchar(8000) | YES |
| 38 | PAYBACK_QUANTITY | float | YES |
| 39 | CANCEL_RECEIPT_DATE | varchar(8000) | YES |
| 40 | CREATE_AT | datetime2 | YES |
| 41 | UPDATE_AT | datetime2 | YES |
| 42 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_BP_PROC_TIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | PROCESS_TYPE_CODE | varchar(8000) | YES |
| 7 | PROCESS_TYPE_NAME | varchar(8000) | YES |
| 8 | WORK_SEQ | int | YES |
| 9 | PROCESS_DETAIL_NAME | varchar(8000) | YES |
| 10 | STALL_NUMBER | decimal(28,6) | YES |
| 11 | EXPECT_START_DATE | datetime2 | YES |
| 12 | EXPECT_END_DATE | datetime2 | YES |
| 13 | REAL_START_DATE | datetime2 | YES |
| 14 | REAL_END_DATE | datetime2 | YES |
| 15 | STATUS_NAME | varchar(8000) | YES |
| 16 | TOTAL_REST_MINUTES | decimal(28,6) | YES |
| 17 | CREATE_AT | datetime2 | YES |
| 18 | UPDATE_AT | datetime2 | YES |
| 19 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_DLR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | TWC_NUMBER | varchar(8000) | YES |
| 5 | PROPO_DATE | varchar(8000) | YES |
| 6 | PROPO_SEQ | float | YES |
| 7 | GROUP_NUMBER | float | YES |
| 8 | SETTLE_TYPE_NAME | varchar(8000) | YES |
| 9 | WARRANTY_TYPE_CODE | varchar(8000) | YES |
| 10 | DATA_ID | varchar(8000) | YES |
| 11 | NAVIGATION_FLAG | varchar(8000) | YES |
| 12 | BRAND_CODE | varchar(8000) | YES |
| 13 | DELIVERY_DATE | varchar(8000) | YES |
| 14 | REPAIR_START_DATE | varchar(8000) | YES |
| 15 | REPAIR_END_DATE | varchar(8000) | YES |
| 16 | ODOMETER | int | YES |
| 17 | MAIN_FRM_NUMBER | varchar(8000) | YES |
| 18 | CAUSE_PART_NUMBER | varchar(8000) | YES |
| 19 | APPLY_CHARGE_AMOUNT | float | YES |
| 20 | TOTAL_LABOR_MAN_HOUR | float | YES |
| 21 | TOTAL_LABOR_AMOUNT | float | YES |
| 22 | TOTAL_PART_AMOUNT | float | YES |
| 23 | TOTAL_SUBLET_AMOUNT | float | YES |
| 24 | CAMPAING_RECALL_NUMBER | varchar(8000) | YES |
| 25 | STATUS_NAME | varchar(8000) | YES |
| 26 | STATUS_CHANGE_DATE | datetime2 | YES |
| 27 | WRITE_DATE | datetime2 | YES |
| 28 | REQEUST_INVOICE_NUMBER | varchar(8000) | YES |
| 29 | REQUEST_DATE | datetime2 | YES |
| 30 | REQUEST_COUNT | int | YES |
| 31 | REQUEST_LEVEL | varchar(8000) | YES |
| 32 | SYSTEM_JUDGE_DATE | datetime2 | YES |
| 33 | SYSTEM_JUDGE_NAME | varchar(8000) | YES |
| 34 | TMKR_JUDGE_DATE | datetime2 | YES |
| 35 | TMKR_JUDGE_NAME | varchar(8000) | YES |
| 36 | APPROVE_LABOR_AMOUNT | float | YES |
| 37 | APPROVE_PART_AMOUNT | float | YES |
| 38 | APPROVE_SUBLET_AMOUNT | float | YES |
| 39 | APPROVE_TOTAL_AMOUNT | float | YES |
| 40 | TWC_CLOSE_YN | varchar(8000) | YES |
| 41 | TWC_CLOSE_DATE | datetime2 | YES |
| 42 | SOUT_NUMBER | varchar(8000) | YES |
| 43 | CAMPAIGN_RECALL_CASE_NUMBER | int | YES |
| 44 | CREATE_AT | datetime2 | YES |
| 45 | UPDATE_AT | datetime2 | YES |
| 46 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_FRM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | FRM_NUMBER | varchar(8000) | YES |
| 3 | FRM_KOREAN_NAME | varchar(8000) | YES |
| 4 | FRM_ENGLISH_NAME | varchar(8000) | YES |
| 5 | WORK_TYPE_NAME | varchar(8000) | YES |
| 6 | FRM_TYPE_NAME | varchar(8000) | YES |
| 7 | FRM_GROUP_TYPE_NAME | varchar(8000) | YES |
| 8 | FRM_GRP_NAME | varchar(8000) | YES |
| 9 | GROUP_NAME | varchar(8000) | YES |
| 10 | LOCAL_YN | varchar(8000) | YES |
| 11 | SERVICE_TYPE_CODE | varchar(8000) | YES |
| 12 | STATUS_NAME | varchar(8000) | YES |
| 13 | PREFIX | varchar(8000) | YES |
| 14 | SUFFIX | varchar(8000) | YES |
| 15 | CREATE_AT | datetime2 | YES |
| 16 | UPDATE_AT | datetime2 | YES |
| 17 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_INSU

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | INSURANCE_TYPE_NAME | varchar(8000) | YES |
| 7 | ACCIDENT_TYPE_NAME | varchar(8000) | YES |
| 8 | OFFENDER_FRONT_PLATE_NUMBER | varchar(8000) | YES |
| 9 | OFFENDER_REAR_PLATE_NUMBER | varchar(8000) | YES |
| 10 | INSURANCE_STATUS_NAME | varchar(8000) | YES |
| 11 | ACCIDENT_DATE | datetime2 | YES |
| 12 | INSURANCE_REQUEST_DATE | datetime2 | YES |
| 13 | TOTAL_REQUEST_AMOUNT | float | YES |
| 14 | TOTAL_APPROVE_AMOUNT | float | YES |
| 15 | INSURANCE_CLOSE_DATE | datetime2 | YES |
| 16 | INSURANCE_CLOSE_CANCEL_YN | varchar(8000) | YES |
| 17 | TAX_CUSTOMER_SEQUENCE | int | YES |
| 18 | INSURANCE_CLOSE_CANCEL_DATE | datetime2 | YES |
| 19 | CREATE_AT | datetime2 | YES |
| 20 | UPDATE_AT | datetime2 | YES |
| 21 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_INSU_DTL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | float | YES |
| 6 | COMPANY_SEQ | float | YES |
| 7 | COMPANY_NAME_KOREAN | varchar(8000) | YES |
| 8 | INSURANCE_TYPE_CODE | varchar(8000) | YES |
| 9 | INSURANCE_TYPE_NAME | varchar(8000) | YES |
| 10 | DEDUCTIBLE_AMOUNT | float | YES |
| 11 | DEDUCTIBLE_AMOUNT_STATUS_CODE | varchar(8000) | YES |
| 12 | DEDUCTIBLE_AMOUNT_AR_KEY | float | YES |
| 13 | DEDUCTIBLE_AMOUNT_STATUS_CHANGE_DATE | datetime2 | YES |
| 14 | CUSTOMER_PAY_AMOUNT | float | YES |
| 15 | CUSTOMER_PAY_STATUS_CODE | varchar(8000) | YES |
| 16 | CUSTOMER_PAY_AR_KEY | float | YES |
| 17 | CUSTOMER_PAY_STATUS_CHANGE_DATE | datetime2 | YES |
| 18 | APPEND_AMOUNT | float | YES |
| 19 | APPEND_AMOUNT_STATUS_CODE | varchar(8000) | YES |
| 20 | APPEND_AMOUNT_STATUS_CHANGE_DATE | datetime2 | YES |
| 21 | INSUANCE_REQUEST_AMOUNT | float | YES |
| 22 | INSURANCE_REQUEST_AR_KEY | float | YES |
| 23 | APPROVE_AMOUNT | float | YES |
| 24 | APPROVE_DATE | varchar(8000) | YES |
| 25 | STATUS_NAME | varchar(8000) | YES |
| 26 | STATUS_CHANGE_DATE | datetime2 | YES |
| 27 | CREATE_AT | datetime2 | YES |
| 28 | UPDATE_AT | datetime2 | YES |
| 29 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_MONTHLY_SALES_TARGET

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | DEALER_ID | varchar(8000) | YES | 딜러 ID |
| 3 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 4 | TARGET_DATE | varchar(8000) | YES | 일자 |
| 5 | TYPE3_CODE | varchar(8000) | YES | 코드 |
| 6 | PART_AMOUNT | float | YES | 금액 |
| 7 | LABOR_AMOUNT | float | YES | 금액 |
| 8 | TOTAL_AMOUNT | float | YES | 금액 |
| 9 | VEHICLE_COUNT | float | YES | 차량 |
| 10 | CREATE_AT | datetime2 | YES |  |
| 11 | UPDATE_AT | datetime2 | YES |  |
| 12 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.SVC_PROPO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | REPAIR_TYPE_NAME | varchar(8000) | YES |
| 7 | VIN | varchar(8000) | YES |
| 8 | VIS | varchar(8000) | YES |
| 9 | FRONT_PLATE_NUMBER | varchar(8000) | YES |
| 10 | REAR_PLATE_NUMBER | varchar(8000) | YES |
| 11 | VEHICLE_VARIANT_NAME | varchar(8000) | YES |
| 12 | SERVICE_MODEL_CODE | varchar(8000) | YES |
| 13 | BASE_ODOMETER | int | YES |
| 14 | ODOMETER | int | YES |
| 15 | CUSTOMER_SEQ | int | YES |
| 16 | CUSTOMER_NAME | varchar(8000) | YES |
| 17 | VIP_YN | varchar(8000) | YES |
| 18 | SERVICE_TYPE | varchar(8000) | YES |
| 19 | SERVICE_TYPE_FMS | varchar(8000) | YES |
| 20 | RESERVATION_DATE | varchar(8000) | YES |
| 21 | RESERVATION_SEQ | int | YES |
| 22 | ESTIMATE_DATE | varchar(8000) | YES |
| 23 | ESTIMATE_SEQ | int | YES |
| 24 | ESTI_TYPE | varchar(8000) | YES |
| 25 | PROPO_STAT_NAME | varchar(8000) | YES |
| 26 | STATUS_CHANGE_DATE | datetime2 | YES |
| 27 | WORK_EXPECT_START_DATE | datetime2 | YES |
| 28 | WORK_EXPECT_END_DATE | datetime2 | YES |
| 29 | CUSTOMER_DELIVERY_YN | varchar(8000) | YES |
| 30 | CUSTOMER_DELIVERY_EXPECT_DATE | datetime2 | YES |
| 31 | CUSTOMER_DELIVERY_REAL_DATE | datetime2 | YES |
| 32 | CUSTOMER_DELIVERY_ZIPCODE | varchar(8000) | YES |
| 33 | OLD_PART_YN | varchar(8000) | YES |
| 34 | DAMAGE_TYPE | varchar(8000) | YES |
| 35 | STALL_NUMBER | float | YES |
| 36 | RECEIPT_TIME | float | YES |
| 37 | PROPOSAL_ISSUE_TIME | float | YES |
| 38 | CUSTOMER_REQUEST | varchar(8000) | YES |
| 39 | SERVICE_ADVISOR_SUGGESTION | varchar(8000) | YES |
| 40 | TECHMAN_SUGGESTION | varchar(8000) | YES |
| 41 | PART_SUGGESTION | varchar(8000) | YES |
| 42 | PAYBACK_YN | varchar(8000) | YES |
| 43 | BASE_PROPOSAL_DATE | varchar(8000) | YES |
| 44 | BASE_PROPOSAL_SEQ | float | YES |
| 45 | PREVIOUS_SHOP_CODE | varchar(8000) | YES |
| 46 | PREVIOUS_PROPOSAL_DATE | varchar(8000) | YES |
| 47 | PREVIOUS_PROPOSAL_SEQ | float | YES |
| 48 | PREVIOUS_ODOMETER | int | YES |
| 49 | PREVIOUS_ACCESSORY_SHOP_CODE | varchar(8000) | YES |
| 50 | PREVIOUS_ACCESSORY_PROPOSAL_DATE | varchar(8000) | YES |
| 51 | PREVIOUS_ACCESSORY_PROPOSAL_SEQ | float | YES |
| 52 | UP_GROUP_NAME | varchar(8000) | YES |
| 53 | ADDITIONAL_PROCESS_SUGGESTION | varchar(8000) | YES |
| 54 | PDC_YN | varchar(8000) | YES |
| 55 | HBEC_YN | varchar(8000) | YES |
| 56 | HBEC_SEQ | float | YES |
| 57 | NEX_SVC | varchar(8000) | YES |
| 58 | MOLIT_TARGET_YN | varchar(8000) | YES |
| 59 | EM_YN | varchar(8000) | YES |
| 60 | END_GB | varchar(8000) | YES |
| 61 | RECALL_BEFORE_SALE_YN | varchar(8000) | YES |
| 62 | FREE_SERVICE_SUGGESTION | varchar(8000) | YES |
| 63 | REPEAT_REPAIR | varchar(8000) | YES |
| 64 | CREATE_AT | datetime2 | YES |
| 65 | UPDATE_AT | datetime2 | YES |
| 66 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_PROPO_BPKPI

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | SHOP_IN_DATE | datetime2 | YES |
| 7 | REPAIR_START_DATE | datetime2 | YES |
| 8 | REPAIR_FINISH_DATE | datetime2 | YES |
| 9 | DELIVERY_EXPECT_DATE | datetime2 | YES |
| 10 | DELIVERY_REAL_DATE | datetime2 | YES |
| 11 | CREATE_AT | datetime2 | YES |
| 12 | UPDATE_AT | datetime2 | YES |
| 13 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_PROPO_LABOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | FRM_NUMBER | varchar(8000) | YES |
| 7 | FRM_NAME | varchar(8000) | YES |
| 8 | SEQUENCE | int | YES |
| 9 | PROPO_TYPE_NAME | varchar(8000) | YES |
| 10 | SETTLE_TYPE_NAME | varchar(8000) | YES |
| 11 | PROPO_STAT_NAME | varchar(8000) | YES |
| 12 | QUANTITY | int | YES |
| 13 | MAN_HOUR | float | YES |
| 14 | SALE_AMOUNT | float | YES |
| 15 | CONFIRM_AMOUNT | float | YES |
| 16 | CREATE_AT | datetime2 | YES |
| 17 | UPDATE_AT | datetime2 | YES |
| 18 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_PROPO_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | SHOP_CODE | varchar(8000) | YES | 전시장 |
| 3 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 4 | PROPO_DATE | varchar(8000) | YES | 일자 |
| 5 | PROPO_SEQ | bigint | YES | 순번 |
| 6 | PART_NUMBER | varchar(8000) | YES | 부품 |
| 7 | PART_NAME | varchar(8000) | YES | 부품 |
| 8 | SEQUENCE | int | YES | 순번 |
| 9 | PROPO_TYPE_NAME | varchar(8000) | YES | 명칭 |
| 10 | SETTLE_TYPE_NAME | varchar(8000) | YES | 명칭 |
| 11 | PROPO_STAT_NAME | varchar(8000) | YES | 명칭 |
| 12 | REAL_ISSUE_QUANTITY | float | YES | 수량 |
| 13 | CONFIRM_AMOUNT | float | YES | 금액 |
| 14 | CAMPAIGN_RECALL_NUMBER | varchar(8000) | YES |  |
| 15 | FMS_ITEM_CODE | varchar(8000) | YES | 코드 |
| 16 | SERVICE_CAMPAIGN_NUMBER | varchar(8000) | YES | 서비스 |
| 17 | TWC_NUMBER | varchar(8000) | YES |  |
| 18 | SOUT_NUMBER | varchar(8000) | YES |  |
| 19 | SOUT_LINE_NUMBER | varchar(8000) | YES |  |
| 20 | CANCEL_YN | varchar(8000) | YES | 취소 |
| 21 | CAMPAIGN_RECALL_CASE_NUMBER | varchar(8000) | YES |  |
| 22 | PSP_UNIT_PRICE | float | YES | 가격 |
| 23 | PSP_AMOUNT | float | YES | 금액 |
| 24 | PSP_CODE | varchar(8000) | YES | 코드 |
| 25 | PM_CODE | varchar(8000) | YES | 코드 |
| 26 | PM_SEQ | varchar(8000) | YES | 순번 |
| 27 | CREATE_AT | datetime2 | YES |  |
| 28 | UPDATE_AT | datetime2 | YES |  |
| 29 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.SVC_RESV

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | RESERVED_DATE | varchar(8000) | YES |
| 5 | RESERVED_SEQ | float | YES |
| 6 | REAL_RESERVATION_DATE | varchar(8000) | YES |
| 7 | REAL_RESERVATION_START_TIME | varchar(8000) | YES |
| 8 | REAL_RESERVATION_END_TIME | varchar(8000) | YES |
| 9 | IN_EXPECT_DATE | datetime2 | YES |
| 10 | OUT_EXPECT_DATE | datetime2 | YES |
| 11 | CUST_SEQ | float | YES |
| 12 | CUST_NM | varchar(8000) | YES |
| 13 | FRONT_PLATE_NUMBER | varchar(8000) | YES |
| 14 | REAR_PLATE_NUMBER | varchar(8000) | YES |
| 15 | VIN | varchar(8000) | YES |
| 16 | VARIANT_NAME | varchar(8000) | YES |
| 17 | SERVICE_MODEL_CODE | varchar(8000) | YES |
| 18 | MODEL_YEAR | varchar(8000) | YES |
| 19 | SERVICE_TYPE_NAME | varchar(8000) | YES |
| 20 | SERVICE_TYPE_FMS_NAME | varchar(8000) | YES |
| 21 | RESERVE_WAY_NAME | varchar(8000) | YES |
| 22 | RESERVE_STALL_NUMBER | float | YES |
| 23 | CUSTOMER_REQUEST | varchar(8000) | YES |
| 24 | SERVICE_ADVISOR_SUGGESTION | varchar(8000) | YES |
| 25 | STATUS_NAME | varchar(8000) | YES |
| 26 | PRE_RECEVIED_AMOUNT | float | YES |
| 27 | PRE_RECEIVED_AMOUNT_STAT_CODE | varchar(8000) | YES |
| 28 | PRE_RECEIVED_AMOUNT_RECEIPT_KEY | float | YES |
| 29 | CONFIRM_YN | varchar(8000) | YES |
| 30 | PROPO_DATE | varchar(8000) | YES |
| 31 | PROPO_SEQ | float | YES |
| 32 | VARIANT_CODE | varchar(8000) | YES |
| 33 | REPEAT_REPAIR | varchar(8000) | YES |
| 34 | CUSTOMER_REPAIR_REQUEST | varchar(8000) | YES |
| 35 | CUSTOMER_REPAIR_REQUEST_TEXT | varchar(8000) | YES |
| 36 | CREATE_AT | datetime2 | YES |
| 37 | UPDATE_AT | datetime2 | YES |
| 38 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_SERVICE_KPI_ELEMENT_DEALER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | UP_GROUP_ID | varchar(8000) | YES | 식별자(ID) |
| 3 | GROUP_NAME | varchar(8000) | YES | 명칭 |
| 4 | YYYYMM | varchar(8000) | YES |  |
| 5 | GENERAL_SERVICE_ADVISOR_TOTAL | float | YES | 서비스 |
| 6 | GENERAL_TECHNICIAN_TOTAL | float | YES |  |
| 7 | BODY_PAINT_SERVICE_ADVISOR_TOTAL | float | YES | 서비스 |
| 8 | BODY_PAINT_TECHNICIAN_BODY_TOTAL | float | YES |  |
| 9 | BODY_PAINT_TECHNICIAN_PAINT_TOTAL | float | YES |  |
| 10 | GENERAL_STALL | float | YES |  |
| 11 | BODY_PAINT_STALL | float | YES |  |
| 12 | GENERAL_SERVICE_ADVISOR_MASTER | float | YES | 서비스 |
| 13 | GENERAL_TECHNICIAN_MASTER | float | YES |  |
| 14 | BODY_PAINT_SERVICE_ADVISOR_MASTER | float | YES | 서비스 |
| 15 | BODY_TECHNICIAN_MASTER | float | YES |  |
| 16 | PAINT_TECHNICIAN_MASTER | float | YES |  |
| 17 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.SVC_SETTLE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | PROPO_DATE | varchar(8000) | YES |
| 5 | PROPO_SEQ | bigint | YES |
| 6 | PROPO_TYPE_CODE | varchar(8000) | YES |
| 7 | PROPO_TYPE_NAME | varchar(8000) | YES |
| 8 | SETTLE_DATE | datetime2 | YES |
| 9 | SALE_LABOR_AMOUNT | float | YES |
| 10 | SALE_PART_AMOUNT | float | YES |
| 11 | SALE_SUBLET_AMOUNT | float | YES |
| 12 | DISCOUNT_LABOR_AMOUNT | float | YES |
| 13 | DISCOUNT_PART_AMOUNT | float | YES |
| 14 | DISCOUNT_SUBLET_AMOUNT | float | YES |
| 15 | CONFIRM_LABOR_AMOUNT | float | YES |
| 16 | CONFIRM_PART_AMOUNT | float | YES |
| 17 | CONFIRM_SUBLET_AMOUNT | float | YES |
| 18 | CONFIRM_TOTAL_AMOUNT | float | YES |
| 19 | VAT_YN | varchar(8000) | YES |
| 20 | VAT | float | YES |
| 21 | FMS_TYPE | varchar(8000) | YES |
| 22 | DISCOUNT_SEQ | float | YES |
| 23 | PROPO_STAT_NAME | varchar(8000) | YES |
| 24 | PROPO_STAT_CHANGE_DATE | datetime2 | YES |
| 25 | AR_CANCEL_YN | varchar(8000) | YES |
| 26 | AR_CANCEL_DATE | datetime2 | YES |
| 27 | RECEIPT_DATE | varchar(8000) | YES |
| 28 | PSP_LABOR_AMOUNT | float | YES |
| 29 | PSP_PART_AMOUNT | float | YES |
| 30 | PSP_SUBLET_AMOUNT | float | YES |
| 31 | PSP_VAT | float | YES |
| 32 | PSP_TOTAL_AMOUNT | float | YES |
| 33 | CREATE_AT | datetime2 | YES |
| 34 | UPDATE_AT | datetime2 | YES |
| 35 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_STALL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | STALL_NUMBER | float | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | STALL_NAME | varchar(8000) | YES |
| 5 | REPAIR_TYPE_NAME | varchar(8000) | YES |
| 6 | STALL_TYPE_NAME | varchar(8000) | YES |
| 7 | USE_YN | varchar(8000) | YES |
| 8 | RESV_YN | varchar(8000) | YES |
| 9 | SC_RESV_YN | varchar(8000) | YES |
| 10 | KPI_YN | varchar(8000) | YES |
| 11 | VIRTUAL_YN | varchar(8000) | YES |
| 12 | APP_RESV_YN | varchar(8000) | YES |
| 13 | AI_RESV_YN | varchar(8000) | YES |
| 14 | CREATE_AT | datetime2 | YES |
| 15 | UPDATE_AT | datetime2 | YES |
| 16 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_STALL_WORKTIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | STALL_NUMBER | float | YES |
| 3 | SHOP_CODE | varchar(8000) | YES |
| 4 | SHOP_NAME | varchar(8000) | YES |
| 5 | WORK_DATE | varchar(8000) | YES |
| 6 | WORK_START_TIME | varchar(8000) | YES |
| 7 | WORK_END_TIME | varchar(8000) | YES |
| 8 | OPERATE_YN | varchar(8000) | YES |
| 9 | CREATE_AT | datetime2 | YES |
| 10 | UPDATE_AT | datetime2 | YES |
| 11 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_TMKR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | SHOP_CODE | varchar(8000) | YES |
| 3 | SHOP_NAME | varchar(8000) | YES |
| 4 | TWC_NUMBER | varchar(8000) | YES |
| 5 | REQUEST_COUNT | int | YES |
| 6 | PROPO_DATE | varchar(8000) | YES |
| 7 | PROPO_SEQ | float | YES |
| 8 | GROUP_NUMBER | float | YES |
| 9 | SETTLE_TYPE_NAME | varchar(8000) | YES |
| 10 | WARRANTY_TYPE_CODE | varchar(8000) | YES |
| 11 | DATA_ID | varchar(8000) | YES |
| 12 | BRAND_CODE | varchar(8000) | YES |
| 13 | DELIVERY_DATE | varchar(8000) | YES |
| 14 | REPAIR_START_DATE | varchar(8000) | YES |
| 15 | REPAIR_END_DATE | varchar(8000) | YES |
| 16 | ODOMETER | int | YES |
| 17 | MAIN_FRM_NUMBER | varchar(8000) | YES |
| 18 | CAUSE_PART_NUMBER | varchar(8000) | YES |
| 19 | APPLY_CHARGE_AMOUNT | float | YES |
| 20 | TOTAL_LABOR_MAN_HOUR | float | YES |
| 21 | TOTAL_LABOR_AMOUNT | float | YES |
| 22 | TOTAL_PART_AMOUNT | float | YES |
| 23 | TOTAL_SUBLET_AMOUNT | float | YES |
| 24 | CAMPAING_RECALL_NUMBER | varchar(8000) | YES |
| 25 | STATUS_NAME | varchar(8000) | YES |
| 26 | STATUS_CHAGE_DATE | datetime2 | YES |
| 27 | WRITE_DATE | datetime2 | YES |
| 28 | REQUEST_INVOICE_NUMBER | varchar(8000) | YES |
| 29 | REQUEST_DATE | datetime2 | YES |
| 30 | REQUEST_LEVEL | varchar(8000) | YES |
| 31 | SYSTEM_JUDGE_DATE | datetime2 | YES |
| 32 | SYSTEM_JUDGE_NAME | varchar(8000) | YES |
| 33 | TMKR_JUDGE_DATE | datetime2 | YES |
| 34 | TMKR_JUDGE_NAME | varchar(8000) | YES |
| 35 | APPROVE_LABOR_AMOUNT | float | YES |
| 36 | APPROVE_PART_AMOUNT | float | YES |
| 37 | APPROVE_SUBLET_AMOUNT | float | YES |
| 38 | APPROVE_TOTAL_AMOUNT | float | YES |
| 39 | SOUT_NUMBER | varchar(8000) | YES |
| 40 | CAMPAIGN_RECALL_CASE_NUMBER | int | YES |
| 41 | BATTERY_CLAIM_COUNT | float | YES |
| 42 | CREATE_AT | datetime2 | YES |
| 43 | UPDATE_AT | datetime2 | YES |
| 44 | ELT_TIME | datetime2 | YES |

#### dbo.SVC_TMKR_TWC_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | SHOP_CODE | varchar(8000) | YES | 전시장 |
| 3 | SHOP_NAME | varchar(8000) | YES | 전시장 |
| 4 | TWC_NUMBER | varchar(8000) | YES |  |
| 5 | REQUEST_COUNT | int | YES |  |
| 6 | PART_NUMBER | varchar(8000) | YES | 부품 |
| 7 | SEQUENCE | int | YES | 순번 |
| 8 | QUANTITY | int | YES | 수량 |
| 9 | UNIT_PRICE | float | YES | 가격 |
| 10 | AMOUNT | float | YES | 금액 |
| 11 | CREATE_AT | datetime2 | YES |  |
| 12 | UPDATE_AT | datetime2 | YES |  |
| 13 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.TACC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | ACCCD | varchar(8000) | YES |
| 3 | START_DATE | datetime2 | YES |
| 4 | END_DATE | datetime2 | YES |
| 5 | KOREAN_NAME | varchar(8000) | YES |
| 6 | ENGLISH_NAME | varchar(8000) | YES |
| 7 | CHINESE_NAME | varchar(8000) | YES |
| 8 | ACC_DIVISION_CODE | varchar(8000) | YES |
| 9 | ACC_PART_CODE | varchar(8000) | YES |
| 10 | ACCCD_ONE_LEVEL | varchar(8000) | YES |
| 11 | ACCCD_TWO_LEVEL | varchar(8000) | YES |
| 12 | ACCCD_THREE_LEVEL | varchar(8000) | YES |
| 13 | ACCCD_FOUR_LEVEL | varchar(8000) | YES |
| 14 | SLIP_OCCUR_YN | varchar(8000) | YES |
| 15 | CAL_TYPE | varchar(8000) | YES |
| 16 | ORDER_PATTERN | int | YES |
| 17 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_DEALER_ORDER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |  |
| 2 | REPORT_TYPE | varchar(8000) | YES | 유형코드 |
| 3 | DEALER | varchar(8000) | YES | 딜러 |
| 4 | DEALER_NAME | varchar(8000) | YES | 딜러 |
| 5 | REPORT_YN | varchar(8000) | YES | 여부(Y/N) |
| 6 | ORDER_REPORT | int | YES | 주문 |
| 7 | ELT_TIME | datetime2 | YES | 시각 |

#### dbo.TACC_ITEM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | ACCOUNT_CODE | varchar(8000) | YES |
| 3 | ITEM_CODE | varchar(8000) | YES |
| 4 | ITEM_NAME | varchar(8000) | YES |
| 5 | SUM_TYPE | varchar(8000) | YES |
| 6 | ORGANIZATION_TYPE | varchar(8000) | YES |
| 7 | SIGN_CODE | varchar(8000) | YES |
| 8 | USE_YN | varchar(8000) | YES |
| 9 | DISABLE_YN | varchar(8000) | YES |
| 10 | CREATE_AT | datetime2 | YES |
| 11 | UPDATE_AT | datetime2 | YES |
| 12 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_MBS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DEALER_ID | varchar(8000) | YES |
| 3 | DEALER_NAME | varchar(8000) | YES |
| 4 | YEAR | varchar(8000) | YES |
| 5 | MONTH | varchar(8000) | YES |
| 6 | ACCCD | varchar(8000) | YES |
| 7 | ACCCD_KOREAN_NAME | varchar(8000) | YES |
| 8 | ACCCD_ENGLISH_NAME | varchar(8000) | YES |
| 9 | DEBIT_AMOUNT | bigint | YES |
| 10 | CREDIT_AMOUNT | bigint | YES |
| 11 | CLOSE_YN | varchar(8000) | YES |
| 12 | CREATE_AT | datetime2 | YES |
| 13 | UPDATE_AT | datetime2 | YES |
| 14 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_MIS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DEALER | varchar(8000) | YES |
| 3 | DEALER_NAME | varchar(8000) | YES |
| 4 | YEAR | varchar(8000) | YES |
| 5 | MONTH | varchar(8000) | YES |
| 6 | VARIANT_CODE | varchar(8000) | YES |
| 7 | SALE_QUANTITY | int | YES |
| 8 | SALE_AMOUNT | bigint | YES |
| 9 | OPERATION_EXPENSE_AMOUNT | bigint | YES |
| 10 | INVENTORY_QUANTITY | int | YES |
| 11 | INVENTORY_AMOUNT | bigint | YES |
| 12 | AVERAGE_SALE_AMOUNT | bigint | YES |
| 13 | AVERAGE_OPERATION_EXPENSE_AMOUNT | bigint | YES |
| 14 | INCOME_AMOUNT | bigint | YES |
| 15 | AVERAGE_INCOME_AMOUNT | bigint | YES |
| 16 | PERCENTAGE_INCOME | float | YES |
| 17 | YYYYMM | varchar(8000) | YES |
| 18 | BRAND_CODE | varchar(8000) | YES |
| 19 | MODEL | varchar(8000) | YES |
| 20 | MY_CODE | varchar(8000) | YES |
| 21 | SFX_CODE | varchar(8000) | YES |
| 22 | SEQUENCE | float | YES |
| 23 | CLOSE_YN | varchar(8000) | YES |
| 24 | CREATE_AT | datetime2 | YES |
| 25 | UPDATE_AT | datetime2 | YES |
| 26 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_MTS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DEALER_ID | varchar(8000) | YES |
| 3 | DEALER_NAME | varchar(8000) | YES |
| 4 | YEAR | varchar(8000) | YES |
| 5 | MONTH | varchar(8000) | YES |
| 6 | ACCCD | varchar(8000) | YES |
| 7 | ACCCD_KOREAN_NAME | varchar(8000) | YES |
| 8 | ACCCD_ENGLISH_NAME | varchar(8000) | YES |
| 9 | ITEM_CODE | varchar(8000) | YES |
| 10 | ITEM_NAME | varchar(8000) | YES |
| 11 | ITEM_AMOUNT | bigint | YES |
| 12 | CLOSE_YN | varchar(8000) | YES |
| 13 | CREATE_AT | datetime2 | YES |
| 14 | UPDATE_AT | datetime2 | YES |
| 15 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_PERSON

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DEALER | varchar(8000) | YES |
| 3 | DEALER_NAME | varchar(8000) | YES |
| 4 | YEAR | varchar(8000) | YES |
| 5 | MONTH | varchar(8000) | YES |
| 6 | SALES | int | YES |
| 7 | SERVICE | int | YES |
| 8 | ADMINISTRATION | int | YES |
| 9 | OTHER | int | YES |
| 10 | TOTAL | int | YES |
| 11 | YYYYMM | varchar(8000) | YES |
| 12 | SALES_CONSULTANT | int | YES |
| 13 | TOP_MANAGE | int | YES |
| 14 | CLOSE_YN | varchar(8000) | YES |
| 15 | CREATE_AT | datetime2 | YES |
| 16 | UPDATE_AT | datetime2 | YES |
| 17 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | BRAND_CODE | varchar(8000) | YES |
| 3 | VARIANT_CODE | varchar(8000) | YES |
| 4 | SEQUENCE | float | YES |
| 5 | IMPORTANT_FLAG | varchar(8000) | YES |
| 6 | MODEL_CODE | varchar(8000) | YES |
| 7 | ENABLED_FLAG | varchar(8000) | YES |
| 8 | CREATE_AT | datetime2 | YES |
| 9 | UPDATE_AT | datetime2 | YES |
| 10 | ELT_TIME | datetime2 | YES |

#### dbo.TACC_VC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | ACCCD | varchar(8000) | YES |
| 3 | START_DATE | datetime2 | YES |
| 4 | END_DATE | datetime2 | YES |
| 5 | KOREAN_NAME | varchar(8000) | YES |
| 6 | ENGLISH_NAME | varchar(8000) | YES |
| 7 | CHINESE_NAME | varchar(8000) | YES |
| 8 | ACC_DIVISION_CODE | varchar(8000) | YES |
| 9 | ACC_PART_CODE | varchar(8000) | YES |
| 10 | ACCCD_ONE_LEVEL | varchar(8000) | YES |
| 11 | ACCCD_TWO_LEVEL | varchar(8000) | YES |
| 12 | ACCCD_THREE_LEVEL | varchar(8000) | YES |
| 13 | ACCCD_FOUR_LEVEL | varchar(8000) | YES |
| 14 | SLIP_OCCUR_YN | varchar(8000) | YES |
| 15 | CAL_TYPE | varchar(8000) | YES |
| 16 | ORDER_PATTERN | int | YES |
| 17 | ELT_TIME | datetime2 | YES |

#### dbo.TF_DCM_INFO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | DCM_INFORMATION_ID | bigint | YES |
| 3 | DCM_TYPE | varchar(8000) | YES |
| 4 | DCM_TYPE_NAME | varchar(8000) | YES |
| 5 | VIN | varchar(8000) | YES |
| 6 | URN | varchar(8000) | YES |
| 7 | ED_NUMBER | varchar(8000) | YES |
| 8 | MODEL_NAME | varchar(8000) | YES |
| 9 | VESSEL_CODE | varchar(8000) | YES |
| 10 | INVOICE_NUMBER | varchar(8000) | YES |
| 11 | IMEI | varchar(8000) | YES |
| 12 | ICCID | varchar(8000) | YES |
| 13 | EUICCID | varchar(8000) | YES |
| 14 | DCM_REGIST_DATE | varchar(8000) | YES |
| 15 | STATUS_NAME | varchar(8000) | YES |
| 16 | TRANSFER_YN | varchar(8000) | YES |
| 17 | CREATE_AT | datetime2 | YES |
| 18 | UPDATE_AT | datetime2 | YES |
| 19 | ELT_TIME | datetime2 | YES |

#### dbo.VS_COLOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | VEHICLE_BRAND_CODE | varchar(8000) | YES |
| 3 | VEHICLE_BRAND | varchar(8000) | YES |
| 4 | VEHICLE_MODEL_CODE | varchar(8000) | YES |
| 5 | VEHICLE_MODEL_NAME | varchar(8000) | YES |
| 6 | VEHICLE_VARIANT_CODE | varchar(8000) | YES |
| 7 | VEHICLE_VARIANT_NAME | varchar(8000) | YES |
| 8 | VEHICLE_MODEL_YEAR_CODE | varchar(8000) | YES |
| 9 | VEHICLE_MODEL_YEAR_NAME | varchar(8000) | YES |
| 10 | VEHICLE_SUFFIX_CODE | varchar(8000) | YES |
| 11 | VEHICLE_SUFFIX_NAME | varchar(8000) | YES |
| 12 | VEHICLE_COLOR_COMBINATION_CODE | varchar(8000) | YES |
| 13 | VEHICLE_COLOR_COMBINATION_NAME | varchar(8000) | YES |
| 14 | CURRENT_SALES_YN | varchar(8000) | YES |
| 15 | IMPORTANT_YN | varchar(8000) | YES |
| 16 | DISPLAY_ORDER | varchar(8000) | YES |
| 17 | CREATE_AT | datetime2 | YES |
| 18 | CREATE_USER_ID | varchar(8000) | YES |
| 19 | UPDATE_AT | datetime2 | YES |
| 20 | UPDATE_USER_ID | varchar(8000) | YES |
| 21 | SPECIAL_ORDER_FLAG | varchar(8000) | YES |
| 22 | TAKE_CONTRACT_AMOUNT | int | YES |
| 23 | ELT_TIME | datetime2 | YES |

#### dbo.VS_MODEL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | VEHICLE_BRAND_CODE | varchar(8000) | YES |
| 3 | VEHICLE_BRAND | varchar(8000) | YES |
| 4 | VEHICLE_MODEL_CODE | varchar(8000) | YES |
| 5 | VEHICLE_MODEL_NAME | varchar(8000) | YES |
| 6 | CURRENT_SALES_YN | varchar(8000) | YES |
| 7 | DISPLAY_ORDER | varchar(8000) | YES |
| 8 | CREATE_AT | datetime2 | YES |
| 9 | CREATE_USER_ID | varchar(8000) | YES |
| 10 | UPDATE_AT | datetime2 | YES |
| 11 | UPDATE_USER_ID | varchar(8000) | YES |
| 12 | ELT_TIME | datetime2 | YES |

#### dbo.VS_MODEL_YEAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | VEHICLE_BRAND_CODE | varchar(8000) | YES |
| 3 | VEHICLE_BRAND | varchar(8000) | YES |
| 4 | VEHICLE_MODEL_CODE | varchar(8000) | YES |
| 5 | VEHICLE_MODEL_NAME | varchar(8000) | YES |
| 6 | VEHICLE_VARIANT_CODE | varchar(8000) | YES |
| 7 | VEHICLE_VARIANT_NAME | varchar(8000) | YES |
| 8 | VEHICLE_MODEL_YEAR_CODE | varchar(8000) | YES |
| 9 | VEHICLE_MODEL_YEAR | varchar(8000) | YES |
| 10 | START_YEAR_MONTH | varchar(8000) | YES |
| 11 | END_YEAR_MONTH | varchar(8000) | YES |
| 12 | VEHICLE_TYPE | varchar(8000) | YES |
| 13 | CREATE_AT | datetime2 | YES |
| 14 | CREATE_USER_ID | varchar(8000) | YES |
| 15 | UPDATE_AT | datetime2 | YES |
| 16 | UPDATE_USER_ID | varchar(8000) | YES |
| 17 | PREVIOUS_RESERVATION_YN | varchar(8000) | YES |
| 18 | PREVIOUS_RESERVATION_START_DATE | varchar(8000) | YES |
| 19 | PREVIOUS_CONTRACT_START_DATE | varchar(8000) | YES |
| 20 | PREVIOUS_DEPOSIT_END_DATE | varchar(8000) | YES |
| 21 | CONTRACT_START_DATE | varchar(8000) | YES |
| 22 | PREVIOUS_CONTRACT_END_DATE | varchar(8000) | YES |
| 23 | ELT_TIME | datetime2 | YES |

#### dbo.VS_SFX

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | VEHICLE_BRAND_CODE | varchar(8000) | YES |
| 3 | VEHICLE_BRAND | varchar(8000) | YES |
| 4 | VEHICLE_MODEL_CODE | varchar(8000) | YES |
| 5 | VEHICLE_MODEL_NAME | varchar(8000) | YES |
| 6 | VEHICLE_VARIANT_CODE | varchar(8000) | YES |
| 7 | VEHICLE_VARIANT_NAME | varchar(8000) | YES |
| 8 | VEHICLE_MODEL_YEAR_CODE | varchar(8000) | YES |
| 9 | VEHICLE_MODEL_YEAR_NAME | varchar(8000) | YES |
| 10 | VEHICLE_SUFFIX_CODE | varchar(8000) | YES |
| 11 | VEHICLE_SUFFIX_NAME | varchar(8000) | YES |
| 12 | CURRENT_SALES_YN | varchar(8000) | YES |
| 13 | DISPLAY_ORDER | varchar(8000) | YES |
| 14 | LAUNCH_DATE | varchar(8000) | YES |
| 15 | FORM_APPLY | varchar(8000) | YES |
| 16 | MOTIVE_TYPE | varchar(8000) | YES |
| 17 | TAKING_FIX | varchar(8000) | YES |
| 18 | DISPLACEMENT | varchar(8000) | YES |
| 19 | HORSE_POWER | varchar(8000) | YES |
| 20 | GROSS_WEIGHT | varchar(8000) | YES |
| 21 | CYLINDER_COUNT | int | YES |
| 22 | MAX_LOAD | varchar(8000) | YES |
| 23 | MAX_OUTPUT | int | YES |
| 24 | LENGTH | int | YES |
| 25 | WIDTH | int | YES |
| 26 | HEIGHT | int | YES |
| 27 | ORDER_YN | varchar(8000) | YES |
| 28 | CREATE_AT | datetime2 | YES |
| 29 | CREATE_USER_ID | varchar(8000) | YES |
| 30 | UPDATE_AT | datetime2 | YES |
| 31 | UPDATE_USER_ID | varchar(8000) | YES |
| 32 | CONFIRM_NUMBER | varchar(8000) | YES |
| 33 | HYBRID_YN | varchar(8000) | YES |
| 34 | NAVIGATION_YN | varchar(8000) | YES |
| 35 | ECO_FRIENDLY_VEHICLE_KIND | varchar(8000) | YES |
| 36 | GRADE | varchar(8000) | YES |
| 37 | CONNECTED_CAR_YN | varchar(8000) | YES |
| 38 | SPEC_VARIANT_NAME | varchar(8000) | YES |
| 39 | HI_PASS_YN | varchar(8000) | YES |
| 40 | BLACK_BOX_YN | varchar(8000) | YES |
| 41 | CONSIGN_SALES_FLAG | varchar(8000) | YES |
| 42 | EW_YN | varchar(8000) | YES |
| 43 | DCM_TYPE | varchar(8000) | YES |
| 44 | ELT_TIME | datetime2 | YES |

#### dbo.VS_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SOURCE_SYSTEM | varchar(8000) | YES |
| 2 | VEHICLE_BRAND_CODE | varchar(8000) | YES |
| 3 | VEHICLE_BRAND | varchar(8000) | YES |
| 4 | VEHICLE_MODEL_CODE | varchar(8000) | YES |
| 5 | VEHICLE_MODEL_NAME | varchar(8000) | YES |
| 6 | VEHICLE_VARIANT_CODE | varchar(8000) | YES |
| 7 | VARIANT_KEY_FOR_JAPAN_LINK | varchar(8000) | YES |
| 8 | MOCT_CAR_TYPE | varchar(8000) | YES |
| 9 | VEHICLE_VARIANT_NAME | varchar(8000) | YES |
| 10 | SALES_YN | varchar(8000) | YES |
| 11 | ORDER_YN | varchar(8000) | YES |
| 12 | MONTH_MODEL_CODE | varchar(8000) | YES |
| 13 | SERVICE_MODEL_CODE | varchar(8000) | YES |
| 14 | SERVICE_MODEL_DESCRIPTION | varchar(8000) | YES |
| 15 | IF_VARIANT_NAME | varchar(8000) | YES |
| 16 | WARRANTY_MONTH | int | YES |
| 17 | DISPLAY_ORDER | varchar(8000) | YES |
| 18 | CREATE_AT | datetime2 | YES |
| 19 | CREATE_USER_ID | varchar(8000) | YES |
| 20 | UPDATE_AT | datetime2 | YES |
| 21 | UPDATE_USER_ID | varchar(8000) | YES |
| 22 | DAILY_REPORT_VARIANT_CODE | varchar(8000) | YES |
| 23 | DAILY_REPORT_YN | varchar(8000) | YES |
| 24 | PRODUCTION_LOCATION | varchar(8000) | YES |
| 25 | REPORT_VARIANT_NAME | varchar(8000) | YES |
| 26 | REPORT_DISPLAY_ORDER | varchar(8000) | YES |
| 27 | PREVIOUS_VARIANT_NAME | varchar(8000) | YES |
| 28 | ECRB_VARIANT_NAME | varchar(8000) | YES |
| 29 | HYBRID_YN | varchar(8000) | YES |
| 30 | SPEC_VARIANT_NAME | varchar(8000) | YES |
| 31 | VARIANT_CODE_JAPAN | varchar(8000) | YES |
| 32 | GRADE | varchar(8000) | YES |
| 33 | CONCERN_MDL_YN | varchar(8000) | YES |
| 34 | FUEL_TYPE_CODE | varchar(8000) | YES |
| 35 | FUEL_TYPE_NAME | varchar(8000) | YES |
| 36 | WIREFRAME_CODE | varchar(8000) | YES |
| 37 | ELT_TIME | datetime2 | YES |

#### queryinsights.exec_requests_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | distributed_statement_id | uniqueidentifier | YES |
| 2 | database_name | varchar(200) | YES |
| 3 | submit_time | datetime2 | YES |
| 4 | start_time | datetime2 | YES |
| 5 | end_time | datetime2 | YES |
| 6 | is_distributed | int | NO |
| 7 | statement_type | varchar(128) | YES |
| 8 | total_elapsed_time_ms | bigint | YES |
| 9 | login_name | varchar(200) | YES |
| 10 | row_count | bigint | YES |
| 11 | status | varchar(200) | YES |
| 12 | session_id | int | YES |
| 13 | connection_id | uniqueidentifier | YES |
| 14 | program_name | varchar(128) | YES |
| 15 | batch_id | uniqueidentifier | YES |
| 16 | root_batch_id | uniqueidentifier | YES |
| 17 | query_hash | varchar(200) | YES |
| 18 | label | varchar(8000) | YES |
| 19 | result_cache_hit | int | YES |
| 20 | sql_pool_name | varchar(128) | YES |
| 21 | error_code | int | YES |
| 22 | error_severity | int | YES |
| 23 | error_state | int | YES |
| 24 | allocated_cpu_time_ms | bigint | YES |
| 25 | data_scanned_remote_storage_mb | decimal(18,3) | YES |
| 26 | data_scanned_memory_mb | decimal(18,3) | YES |
| 27 | data_scanned_disk_mb | decimal(18,3) | YES |
| 28 | command | varchar(max) | YES |

#### queryinsights.exec_sessions_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | session_id | int | YES |
| 2 | connection_id | uniqueidentifier | YES |
| 3 | session_start_time | datetime2 | YES |
| 4 | session_end_time | datetime2 | YES |
| 5 | program_name | varchar(256) | YES |
| 6 | login_name | varchar(256) | YES |
| 7 | status | varchar(100) | YES |
| 8 | context_info | varchar(128) | YES |
| 9 | total_query_elapsed_time_ms | bigint | YES |
| 10 | last_request_start_time | datetime2 | YES |
| 11 | last_request_end_time | datetime2 | YES |
| 12 | is_user_process | bit | YES |
| 13 | prev_error | int | YES |
| 14 | group_id | bigint | YES |
| 15 | database_id | int | YES |
| 16 | authenticating_database_id | int | YES |
| 17 | open_transaction_count | bigint | YES |
| 18 | text_size | int | YES |
| 19 | language | varchar(256) | YES |
| 20 | date_format | varchar(20) | YES |
| 21 | date_first | int | YES |
| 22 | quoted_identifier | bit | YES |
| 23 | arithabort | bit | YES |
| 24 | ansi_null_dflt_on | bit | YES |
| 25 | ansi_defaults | bit | YES |
| 26 | ansi_warnings | bit | YES |
| 27 | ansi_padding | bit | YES |
| 28 | ansi_nulls | bit | YES |
| 29 | concat_null_yields_null | bit | YES |
| 30 | transaction_isolation_level | int | YES |
| 31 | lock_timeout | bigint | YES |
| 32 | deadlock_priority | int | YES |
| 33 | original_security_id | varchar(200) | YES |
| 34 | database_name | varchar(200) | YES |

#### queryinsights.frequently_run_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | number_of_runs | int | YES |
| 3 | min_run_total_elapsed_time_ms | bigint | YES |
| 4 | max_run_total_elapsed_time_ms | bigint | YES |
| 5 | avg_total_elapsed_time_ms | bigint | YES |
| 6 | number_of_successful_runs | int | YES |
| 7 | number_of_failed_runs | int | YES |
| 8 | number_of_canceled_runs | int | YES |
| 9 | last_run_total_elapsed_time_ms | bigint | YES |
| 10 | last_run_start_time | datetime2 | YES |
| 11 | last_dist_statement_id | uniqueidentifier | YES |
| 12 | query_hash | varchar(200) | YES |
| 13 | last_run_command | varchar(max) | YES |

#### queryinsights.long_running_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | median_total_elapsed_time_ms | float | YES |
| 3 | last_run_total_elapsed_time_ms | bigint | YES |
| 4 | last_run_start_time | datetime2 | YES |
| 5 | last_dist_statement_id | uniqueidentifier | YES |
| 6 | last_run_session_id | int | YES |
| 7 | number_of_runs | int | YES |
| 8 | query_hash | varchar(200) | YES |
| 9 | last_run_command | varchar(max) | YES |

#### queryinsights.sql_pool_insights

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sql_pool_name | varchar(128) | YES |
| 2 | timestamp | datetime2 | YES |
| 3 | max_resource_percentage | int | YES |
| 4 | is_optimized_for_reads | bit | YES |
| 5 | current_workspace_capacity | varchar(16) | YES |
| 6 | is_pool_under_pressure | bit | YES |

#### sys.dm_db_external_tables_log_status

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | object_id | int | NO |
| 2 | latest_log_version | bigint | YES |
| 3 | latest_checkpoint_version | bigint | YES |
| 4 | last_update_time_utc | datetime | NO |
| 5 | is_blocked | bit | NO |

#### sys.external_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | is_blocked | bit | NO |
| 3 | block_reason | tinyint | NO |
| 4 | relative_path | nvarchar(2000) | NO |
| 5 | latest_manifest_version | bigint | YES |
| 6 | latest_checkpoint_version | bigint | YES |
| 7 | latest_checksum_version | bigint | YES |
| 8 | latest_etag | nvarchar(128) | NO |
| 9 | latest_checkpoint_file_name | nvarchar(76) | NO |
| 10 | last_update_time | datetime | NO |

#### sys.managed_delta_table_checkpoints

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delta_log_commit_sequence_id | bigint | NO |
| 2 | part | int | NO |
| 3 | file_guid | uniqueidentifier | NO |
| 4 | version | bigint | NO |
| 5 | source_table_guid | uniqueidentifier | NO |
| 6 | source_database_guid | uniqueidentifier | YES |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | checkpoint_file_name | nvarchar(256) | YES |
| 9 | manifest_root | nvarchar(256) | YES |

#### sys.managed_delta_table_forks

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | fork_guid | uniqueidentifier | NO |
| 3 | source_table_guid | uniqueidentifier | NO |
| 4 | source_database_guid | uniqueidentifier | NO |
| 5 | xdes_ts | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | folder_name | nvarchar(40) | YES |

#### sys.managed_delta_table_log_files

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | file_guid | uniqueidentifier | NO |
| 3 | xdes_ts | bigint | NO |
| 4 | append_only | bit | NO |
| 5 | rows_inserted | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | source_table_guid | uniqueidentifier | NO |
| 8 | source_database_guid | uniqueidentifier | YES |
| 9 | manifest_file_name | nvarchar(256) | YES |
| 10 | manifest_root | nvarchar(256) | YES |
| 11 | table_guid | uniqueidentifier | NO |

#### sys.managed_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | object_id | int | NO |
| 3 | table_guid | uniqueidentifier | NO |
| 4 | fork_guid | uniqueidentifier | NO |
| 5 | delta_log_feature_status | int | NO |
| 6 | manifest_root | nvarchar(256) | YES |
| 7 | system_task_consideration_bitmask | int | YES |
| 8 | drop_commit_time | datetime | YES |

#### sys.sys_dw_schemas

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | name | nvarchar(128) | NO |
| 2 | schema_id | int | NO |
| 3 | principal_id | int | YES |
| 4 | is_internal | bit | YES |

---

## DB: LH_STAGING

구분: 데이터 · 테이블 수: 143

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.dim_test3 | 1 | - |
| ldms.CO_CALENDAR | 14 | - |
| ldms.CO_CODE | 19 | - |
| ldms.CO_COMPANY | 82 | - |
| ldms.CO_GROUP | 96 | - |
| ldms.CO_HOLDINGS | 95 | - |
| ldms.CO_RECEIPT | 82 | - |
| ldms.CO_USERS | 90 | - |
| ldms.CO_VEHIC | 58 | - |
| ldms.CO_ZIPCODE | 10 | - |
| ldms.CO_ZIPCODE_NEW | 13 | - |
| ldms.CU_BASE | 115 | - |
| ldms.CU_FAMILY | 45 | - |
| ldms.ECRB_EXCLUDE_VIN | 9 | - |
| ldms.IF_AR | 87 | - |
| ldms.OM_CONTRACT | 137 | - |
| ldms.OM_CONTRACT_CUST | 28 | - |
| ldms.OM_PMA | 10 | - |
| ldms.PT_PART | 72 | - |
| ldms.PT_SOUT | 70 | - |
| ldms.PT_SOUT_DETL | 52 | - |
| ldms.SVC_BP_PROC_TIME | 23 | - |
| ldms.SVC_DLR_TWC | 103 | - |
| ldms.SVC_FRM | 21 | - |
| ldms.SVC_FRM_GRP | 12 | - |
| ldms.SVC_INSU | 32 | - |
| ldms.SVC_INSU_DTL | 59 | - |
| ldms.SVC_MONTHLY_SALES_TARGET | 13 | - |
| ldms.SVC_PROPO | 118 | - |
| ldms.SVC_PROPO_BPKPI | 55 | - |
| ldms.SVC_PROPO_LABOR | 41 | - |
| ldms.SVC_PROPO_PART | 56 | - |
| ldms.SVC_RESV | 76 | - |
| ldms.SVC_SERVICE_KPI_ELEMENT_DEALER | 55 | - |
| ldms.SVC_SETTLE | 42 | - |
| ldms.SVC_STALL | 22 | - |
| ldms.SVC_STALL_WORKTIME | 13 | - |
| ldms.SVC_TMKR_TWC | 97 | - |
| ldms.SVC_TMKR_TWC_PART | 16 | - |
| ldms.TACC_CD | 18 | - |
| ldms.TACC_DEALER_ORDER | 7 | - |
| ldms.TACC_ITEM | 14 | - |
| ldms.TACC_MBS | 15 | - |
| ldms.TACC_MIS | 27 | - |
| ldms.TACC_MTS | 14 | - |
| ldms.TACC_PERSON | 18 | - |
| ldms.TACC_REF | 65 | - |
| ldms.TACC_REF2 | 8 | - |
| ldms.TACC_SUM_MBS | 19 | - |
| ldms.TACC_VARIANT | 12 | - |
| ldms.TACC_VC_CD | 18 | - |
| ldms.TF_DCM_INFO | 22 | - |
| ldms.VS_COLOR | 22 | - |
| ldms.VS_MODEL | 11 | - |
| ldms.VS_MODEL_YEAR | 20 | - |
| ldms.VS_SFX | 44 | - |
| ldms.VS_VARIANT | 34 | - |
| parts.PT_PART_TIRE_COMPANY | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_0a67d4fc_74ea_4701_bfb8_2110a0677d50 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_11721e9f_0a69_4681_bec4_2dddd7a04b8b | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_28395a94_0b1a_4123_a1a7_0b3a9fe503eb | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_31313e87_b213_471a_b2a6_7172ef52674b | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_31dbf67b_5e37_432f_97ac_9db3a23fe781 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_33f7db1c_edfc_48ee_b170_f969bac8f7c9 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_3532e6e5_7e9a_4329_ba7e_f1bb984dbd9b | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_3b20725d_faae_4556_a587_516dd1f9921b | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_4f26787b_6a52_4a8f_81a1_becd6bade480 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_5876ac12_f64b_4e5e_8e7d_ca623a5f7b05 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_5aaa9115_5ee0_4cb9_af98_e0ec3d7d7b5b | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_5dbeb1b5_1b2d_4e37_b0ad_0ebda6bd0f89 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_813700d5_b535_4093_9914_469e77cea77d | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_8310ba11_5b63_4fd1_9168_ac99116a9dfb | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_a089e78f_3496_413f_8d7a_835ec05a7b61 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_a696ae6a_dd07_47e2_9f5f_4e93b8b926a9 | 9 | - |
| parts.PT_PART_TIRE_COMPANY_backup_b15a9117_cd8a_433e_8a8c_d3b01b205726 | 9 | - |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |
| tdms.CO_CALENDAR | 14 | - |
| tdms.CO_CODE | 19 | - |
| tdms.CO_COMPANY | 82 | - |
| tdms.CO_GROUP | 96 | - |
| tdms.CO_HOLDINGS | 95 | - |
| tdms.CO_RECEIPT | 82 | - |
| tdms.CO_USERS | 91 | - |
| tdms.CO_VEHIC | 58 | - |
| tdms.CO_ZIPCODE | 10 | - |
| tdms.CO_ZIPCODE_NEW | 13 | - |
| tdms.CU_BASE | 115 | - |
| tdms.CU_FAMILY | 45 | - |
| tdms.ECRB_EXCLUDE_VIN | 9 | - |
| tdms.IF_AR | 85 | - |
| tdms.OM_CONTRACT | 137 | - |
| tdms.OM_CONTRACT_CUST | 28 | - |
| tdms.OM_PMA | 10 | - |
| tdms.PT_PART | 72 | - |
| tdms.PT_SOUT | 70 | - |
| tdms.PT_SOUT_DETL | 52 | - |
| tdms.SVC_BP_PROC_TIME | 23 | - |
| tdms.SVC_DLR_TWC | 103 | - |
| tdms.SVC_FRM | 21 | - |
| tdms.SVC_FRM_GRP | 12 | - |
| tdms.SVC_INSU | 32 | - |
| tdms.SVC_INSU_DTL | 59 | - |
| tdms.SVC_MONTHLY_SALES_TARGET | 13 | - |
| tdms.SVC_PROPO | 118 | - |
| tdms.SVC_PROPO_BPKPI | 55 | - |
| tdms.SVC_PROPO_LABOR | 41 | - |
| tdms.SVC_PROPO_PART | 56 | - |
| tdms.SVC_RESV | 75 | - |
| tdms.SVC_SERVICE_KPI_ELEMENT_DEALER | 55 | - |
| tdms.SVC_SETTLE | 42 | - |
| tdms.SVC_STALL | 22 | - |
| tdms.SVC_STALL_WORKTIME | 13 | - |
| tdms.SVC_TMKR_TWC | 97 | - |
| tdms.SVC_TMKR_TWC_PART | 16 | - |
| tdms.TACC_CD | 18 | - |
| tdms.TACC_DEALER_ORDER | 7 | - |
| tdms.TACC_ITEM | 14 | - |
| tdms.TACC_MBS | 15 | - |
| tdms.TACC_MIS | 27 | - |
| tdms.TACC_MTS | 14 | - |
| tdms.TACC_PERSON | 18 | - |
| tdms.TACC_REF | 65 | - |
| tdms.TACC_REF2 | 8 | - |
| tdms.TACC_SUM_MBS | 19 | - |
| tdms.TACC_VARIANT | 12 | - |
| tdms.TACC_VC_CD | 18 | - |
| tdms.TF_DCM_INFO | 22 | - |
| tdms.VS_COLOR | 22 | - |
| tdms.VS_MODEL | 11 | - |
| tdms.VS_MODEL_YEAR | 20 | - |
| tdms.VS_SFX | 44 | - |
| tdms.VS_VARIANT | 34 | - |

### 컬럼 상세

#### dbo.dim_test3

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | 100 | int | YES |

#### ldms.CO_CALENDAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | base_dt | varchar(8000) | YES |
| 2 | week_no_by_month | decimal(28,10) | YES |
| 3 | week_day | varchar(8000) | YES |
| 4 | work_korea | varchar(8000) | YES |
| 5 | work_overseas | varchar(8000) | YES |
| 6 | work_dealer | varchar(8000) | YES |
| 7 | work_hq | varchar(8000) | YES |
| 8 | work_cpd | varchar(8000) | YES |
| 9 | reg_dt | datetime2 | YES |
| 10 | reg_user_id | varchar(8000) | YES |
| 11 | upd_dt | datetime2 | YES |
| 12 | upd_user_id | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### ldms.CO_CODE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(8000) | YES |
| 2 | code | varchar(8000) | YES |
| 3 | code_type_nm | varchar(8000) | YES |
| 4 | code_nm | varchar(8000) | YES |
| 5 | eng_code_nm | varchar(8000) | YES |
| 6 | display_order | varchar(8000) | YES |
| 7 | up_code_type | varchar(8000) | YES |
| 8 | remark | varchar(8000) | YES |
| 9 | use_yn | varchar(8000) | YES |
| 10 | reg_dt | datetime2 | YES |
| 11 | reg_user_id | varchar(8000) | YES |
| 12 | upd_dt | datetime2 | YES |
| 13 | upd_user_id | varchar(8000) | YES |
| 14 | attr1 | varchar(8000) | YES |
| 15 | code_type_gb | varchar(8000) | YES |
| 16 | attr2 | varchar(8000) | YES |
| 17 | attr3 | varchar(8000) | YES |
| 18 | source_system | varchar(8000) | YES |
| 19 | elt_time | varchar(8000) | YES |

#### ldms.CO_COMPANY

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | comp_seq | decimal(28,10) | YES |
| 2 | dealer_id | varchar(8000) | YES |
| 3 | cust_seq | bigint | YES |
| 4 | biz_reg_no | varchar(8000) | YES |
| 5 | comp_nm_kor | varchar(8000) | YES |
| 6 | comp_nm_engl | varchar(8000) | YES |
| 7 | biz_cond_nm | varchar(8000) | YES |
| 8 | chief_id | varchar(8000) | YES |
| 9 | chief_name_kor | varchar(8000) | YES |
| 10 | chief_name_engl | varchar(8000) | YES |
| 11 | comp_email | varchar(8000) | YES |
| 12 | zip | varchar(8000) | YES |
| 13 | addr | varchar(8000) | YES |
| 14 | addr_no | varchar(8000) | YES |
| 15 | tel_area | varchar(8000) | YES |
| 16 | tel_no | varchar(8000) | YES |
| 17 | fax_area | varchar(8000) | YES |
| 18 | fax_no | varchar(8000) | YES |
| 19 | use_yn | varchar(8000) | YES |
| 20 | parts_company_type | varchar(8000) | YES |
| 21 | parts_flag | varchar(8000) | YES |
| 22 | comp_identi | varchar(8000) | YES |
| 23 | cust_flag | varchar(8000) | YES |
| 24 | splr_flag | varchar(8000) | YES |
| 25 | splr_group | varchar(8000) | YES |
| 26 | order_cycle | decimal(7,2) | YES |
| 27 | safe_stock_lead_time | decimal(7,2) | YES |
| 28 | lead_time | decimal(7,2) | YES |
| 29 | short_stock_warn_base | decimal(7,2) | YES |
| 30 | over_due_days_sea | int | YES |
| 31 | over_due_days_air | int | YES |
| 32 | over_due_days_fo | int | YES |
| 33 | impr_cd | varchar(8000) | YES |
| 34 | exch_rate_recv | decimal(9,3) | YES |
| 35 | exch_rate_price_chng | decimal(9,3) | YES |
| 36 | lc_fact_resv | decimal(7,2) | YES |
| 37 | lc_fact_air | decimal(7,2) | YES |
| 38 | lc_fact_price_chng | decimal(7,2) | YES |
| 39 | term_order_to_etd | int | YES |
| 40 | term_order_to_eta | int | YES |
| 41 | so_entr_alow_day | bigint | YES |
| 42 | part_dc_rate_dms | int | YES |
| 43 | bo_fk | varchar(8000) | YES |
| 44 | base_price_type | varchar(8000) | YES |
| 45 | cust_region_cd | varchar(8000) | YES |
| 46 | cust_tran_cd | varchar(8000) | YES |
| 47 | delivery_zip | varchar(8000) | YES |
| 48 | delivery_adr | varchar(8000) | YES |
| 49 | delivery_adr_no | varchar(8000) | YES |
| 50 | country | varchar(8000) | YES |
| 51 | ar_biz_type_nm | varchar(8000) | YES |
| 52 | service_company_type | varchar(8000) | YES |
| 53 | service_flag | varchar(8000) | YES |
| 54 | ap_vat_cd | varchar(8000) | YES |
| 55 | ap_payment_method | varchar(8000) | YES |
| 56 | ar_vat_cd | varchar(8000) | YES |
| 57 | reg_dt | datetime2 | YES |
| 58 | reg_user_id | varchar(8000) | YES |
| 59 | upd_dt | datetime2 | YES |
| 60 | upd_user_id | varchar(8000) | YES |
| 61 | bp_shop_yn | varchar(8000) | YES |
| 62 | dc_rate | decimal(7,4) | YES |
| 63 | oil_purc_yn | varchar(8000) | YES |
| 64 | hp_area | varchar(8000) | YES |
| 65 | hp_no | varchar(8000) | YES |
| 66 | tr_zip | varchar(8000) | YES |
| 67 | tr_addr | varchar(8000) | YES |
| 68 | tr_addr_no | varchar(8000) | YES |
| 69 | tr_addr_flag | varchar(8000) | YES |
| 70 | tr_addr_insert_flag | varchar(8000) | YES |
| 71 | tr_addr_bld_no | varchar(8000) | YES |
| 72 | tr_addr_result | varchar(8000) | YES |
| 73 | tr_zip_delivery | varchar(8000) | YES |
| 74 | tr_addr_delivery | varchar(8000) | YES |
| 75 | tr_addr_no_delivery | varchar(8000) | YES |
| 76 | tr_addr_delivery_flag | varchar(8000) | YES |
| 77 | tr_addr_delivery_insert_flag | varchar(8000) | YES |
| 78 | tr_addr_delivery_bld_no | varchar(8000) | YES |
| 79 | tr_addr_delivery_result | varchar(8000) | YES |
| 80 | chief_id_dec | varchar(8000) | YES |
| 81 | source_system | varchar(8000) | YES |
| 82 | elt_time | varchar(8000) | YES |

#### ldms.CO_GROUP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | group_name | varchar(8000) | YES |
| 3 | group_full_name | varchar(8000) | YES |
| 4 | group_type | varchar(8000) | YES |
| 5 | chief_name | varchar(8000) | YES |
| 6 | chief_id | varchar(8000) | YES |
| 7 | biz_reg_no | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | pdi_area | varchar(8000) | YES |
| 12 | cpd_area | varchar(8000) | YES |
| 13 | found_dt | varchar(8000) | YES |
| 14 | showroom_no | decimal(28,10) | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | decimal(28,10) | YES |
| 17 | fee_transfer | decimal(28,10) | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(8000) | YES |
| 23 | group_short_name | varchar(8000) | YES |
| 24 | group_area | varchar(8000) | YES |
| 25 | stock_value_type | varchar(8000) | YES |
| 26 | usage_type | varchar(8000) | YES |
| 27 | tmkr_service_cd | varchar(8000) | YES |
| 28 | tmkr_parts_cd | varchar(8000) | YES |
| 29 | tmkr_sales_cd | varchar(8000) | YES |
| 30 | tmc_service_cd | varchar(8000) | YES |
| 31 | tmc_parts_cd | varchar(8000) | YES |
| 32 | tmc_sales_cd | varchar(8000) | YES |
| 33 | up_group_id | varchar(8000) | YES |
| 34 | system_use_yn | varchar(8000) | YES |
| 35 | dealer_yn | varchar(8000) | YES |
| 36 | shop_yn | varchar(8000) | YES |
| 37 | highest_group_yn | varchar(8000) | YES |
| 38 | use_yn | varchar(8000) | YES |
| 39 | photo_file_dir | varchar(8000) | YES |
| 40 | org_id | decimal(28,10) | YES |
| 41 | set_of_books_id | decimal(28,10) | YES |
| 42 | location_id | decimal(28,10) | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | dealer_id | varchar(8000) | YES |
| 48 | ci_image_id | varchar(8000) | YES |
| 49 | tel_area | varchar(8000) | YES |
| 50 | tel_no | varchar(8000) | YES |
| 51 | fax_area | varchar(8000) | YES |
| 52 | fax_no | varchar(8000) | YES |
| 53 | biz_type_nm | varchar(8000) | YES |
| 54 | biz_cond_nm | varchar(8000) | YES |
| 55 | sms_name | varchar(8000) | YES |
| 56 | svc_sms_no | varchar(8000) | YES |
| 57 | new_tmkr_parts_cd | varchar(8000) | YES |
| 58 | new_tmc_parts_cd | varchar(8000) | YES |
| 59 | svc_reg_no | varchar(8000) | YES |
| 60 | svc_chrg_nm | varchar(8000) | YES |
| 61 | fd_code_sea | varchar(8000) | YES |
| 62 | fd_code_air | varchar(8000) | YES |
| 63 | brand_cd | varchar(8000) | YES |
| 64 | svc_tr_user_id | varchar(8000) | YES |
| 65 | port_cd | varchar(8000) | YES |
| 66 | group_eng_name | varchar(8000) | YES |
| 67 | contract_alert_yn | varchar(8000) | YES |
| 68 | customer_alert_yn | varchar(8000) | YES |
| 69 | bp_shop_yn | varchar(8000) | YES |
| 70 | biz_corp_no | varchar(8000) | YES |
| 71 | svc_stamp_id | varchar(8000) | YES |
| 72 | geo_loc_x | varchar(8000) | YES |
| 73 | geo_loc_y | varchar(8000) | YES |
| 74 | zoom_lvl | varchar(8000) | YES |
| 75 | tr_zip | varchar(8000) | YES |
| 76 | tr_addr | varchar(8000) | YES |
| 77 | tr_addr_no | varchar(8000) | YES |
| 78 | tr_addr_flag | varchar(8000) | YES |
| 79 | tr_addr_insert_flag | varchar(8000) | YES |
| 80 | tr_addr_bld_no | varchar(8000) | YES |
| 81 | tr_addr_result | varchar(8000) | YES |
| 82 | base_svc_center | varchar(8000) | YES |
| 83 | customer_save_yn | varchar(8000) | YES |
| 84 | call_block_area | varchar(8000) | YES |
| 85 | call_block_no | varchar(8000) | YES |
| 86 | cpo_yn | varchar(8000) | YES |
| 87 | holding_id | varchar(8000) | YES |
| 88 | dz_bizarea_cd | varchar(8000) | YES |
| 89 | molit_id | varchar(8000) | YES |
| 90 | molit_passwd | varchar(8000) | YES |
| 91 | molit_key | varchar(8000) | YES |
| 92 | molit_pgmcode | varchar(8000) | YES |
| 93 | group_short_eng_name | varchar(8000) | YES |
| 94 | tax_biz_no | varchar(8000) | YES |
| 95 | source_system | varchar(8000) | YES |
| 96 | elt_time | varchar(8000) | YES |

#### ldms.CO_HOLDINGS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | group_name | varchar(8000) | YES |
| 3 | group_full_name | varchar(8000) | YES |
| 4 | group_type | varchar(8000) | YES |
| 5 | chief_name | varchar(8000) | YES |
| 6 | chief_id | varchar(8000) | YES |
| 7 | biz_reg_no | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | pdi_area | varchar(8000) | YES |
| 12 | cpd_area | varchar(8000) | YES |
| 13 | found_dt | varchar(8000) | YES |
| 14 | showroom_no | decimal(28,10) | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | decimal(28,10) | YES |
| 17 | fee_transfer | decimal(28,10) | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(8000) | YES |
| 23 | group_short_name | varchar(8000) | YES |
| 24 | group_area | varchar(8000) | YES |
| 25 | stock_value_type | varchar(8000) | YES |
| 26 | usage_type | varchar(8000) | YES |
| 27 | tmkr_service_cd | varchar(8000) | YES |
| 28 | tmkr_parts_cd | varchar(8000) | YES |
| 29 | tmkr_sales_cd | varchar(8000) | YES |
| 30 | tmc_service_cd | varchar(8000) | YES |
| 31 | tmc_parts_cd | varchar(8000) | YES |
| 32 | tmc_sales_cd | varchar(8000) | YES |
| 33 | up_group_id | varchar(8000) | YES |
| 34 | system_use_yn | varchar(8000) | YES |
| 35 | dealer_yn | varchar(8000) | YES |
| 36 | shop_yn | varchar(8000) | YES |
| 37 | highest_group_yn | varchar(8000) | YES |
| 38 | use_yn | varchar(8000) | YES |
| 39 | photo_file_dir | varchar(8000) | YES |
| 40 | org_id | decimal(28,10) | YES |
| 41 | set_of_books_id | decimal(28,10) | YES |
| 42 | location_id | decimal(28,10) | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | dealer_id | varchar(8000) | YES |
| 48 | ci_image_id | varchar(8000) | YES |
| 49 | tel_area | varchar(8000) | YES |
| 50 | tel_no | varchar(8000) | YES |
| 51 | fax_area | varchar(8000) | YES |
| 52 | fax_no | varchar(8000) | YES |
| 53 | biz_type_nm | varchar(8000) | YES |
| 54 | biz_cond_nm | varchar(8000) | YES |
| 55 | sms_name | varchar(8000) | YES |
| 56 | svc_sms_no | varchar(8000) | YES |
| 57 | new_tmkr_parts_cd | varchar(8000) | YES |
| 58 | new_tmc_parts_cd | varchar(8000) | YES |
| 59 | svc_reg_no | varchar(8000) | YES |
| 60 | svc_chrg_nm | varchar(8000) | YES |
| 61 | fd_code_sea | varchar(8000) | YES |
| 62 | fd_code_air | varchar(8000) | YES |
| 63 | brand_cd | varchar(8000) | YES |
| 64 | svc_tr_user_id | varchar(8000) | YES |
| 65 | port_cd | varchar(8000) | YES |
| 66 | group_eng_name | varchar(8000) | YES |
| 67 | contract_alert_yn | varchar(8000) | YES |
| 68 | customer_alert_yn | varchar(8000) | YES |
| 69 | bp_shop_yn | varchar(8000) | YES |
| 70 | biz_corp_no | varchar(8000) | YES |
| 71 | svc_stamp_id | varchar(8000) | YES |
| 72 | geo_loc_x | varchar(8000) | YES |
| 73 | geo_loc_y | varchar(8000) | YES |
| 74 | zoom_lvl | varchar(8000) | YES |
| 75 | tr_zip | varchar(8000) | YES |
| 76 | tr_addr | varchar(8000) | YES |
| 77 | tr_addr_no | varchar(8000) | YES |
| 78 | tr_addr_flag | varchar(8000) | YES |
| 79 | tr_addr_insert_flag | varchar(8000) | YES |
| 80 | tr_addr_bld_no | varchar(8000) | YES |
| 81 | tr_addr_result | varchar(8000) | YES |
| 82 | base_svc_center | varchar(8000) | YES |
| 83 | customer_save_yn | varchar(8000) | YES |
| 84 | call_block_area | varchar(8000) | YES |
| 85 | call_block_no | varchar(8000) | YES |
| 86 | cpo_yn | varchar(8000) | YES |
| 87 | group_cd | varchar(8000) | YES |
| 88 | erp_use_yn | varchar(8000) | YES |
| 89 | ws_type | varchar(8000) | YES |
| 90 | rs_type | varchar(8000) | YES |
| 91 | dz_comp_cd | varchar(8000) | YES |
| 92 | dz_bizarea_cd | varchar(8000) | YES |
| 93 | oid_group_num | decimal(28,10) | YES |
| 94 | source_system | varchar(8000) | YES |
| 95 | elt_time | varchar(8000) | YES |

#### ldms.CO_RECEIPT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | receipt_part | varchar(8000) | YES |
| 3 | receipt_seq | decimal(28,10) | YES |
| 4 | cancel_seq | decimal(28,10) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | manage_no | varchar(8000) | YES |
| 7 | receipt_dt | varchar(8000) | YES |
| 8 | real_receipt_dt | varchar(8000) | YES |
| 9 | cancel_dt | datetime2 | YES |
| 10 | receipt_no | varchar(8000) | YES |
| 11 | cust_seq | decimal(28,10) | YES |
| 12 | cust_nm | varchar(8000) | YES |
| 13 | receipt_cust_nm | varchar(8000) | YES |
| 14 | cust_type | varchar(8000) | YES |
| 15 | taxpay_no | varchar(8000) | YES |
| 16 | receipt_type | varchar(8000) | YES |
| 17 | cash_amt | decimal(28,10) | YES |
| 18 | card_amt | decimal(28,10) | YES |
| 19 | cms_amt | decimal(28,10) | YES |
| 20 | coupon_amt | decimal(28,10) | YES |
| 21 | credit_amt | decimal(28,10) | YES |
| 22 | extra_dc_amt | decimal(28,10) | YES |
| 23 | receipt_amt | decimal(28,10) | YES |
| 24 | svc_key1 | varchar(8000) | YES |
| 25 | svc_key2 | decimal(28,10) | YES |
| 26 | svc_key3 | decimal(28,10) | YES |
| 27 | svc_key4 | varchar(8000) | YES |
| 28 | key_kind | varchar(8000) | YES |
| 29 | remark | varchar(8000) | YES |
| 30 | cancel_yn | varchar(8000) | YES |
| 31 | cancel_cd | varchar(8000) | YES |
| 32 | bank_account_cash | varchar(8000) | YES |
| 33 | bank_account_card | varchar(8000) | YES |
| 34 | bank_account_cms | varchar(8000) | YES |
| 35 | deal_date | varchar(8000) | YES |
| 36 | deal_seq | decimal(28,10) | YES |
| 37 | comp_seq | decimal(28,10) | YES |
| 38 | bank_account_id | varchar(8000) | YES |
| 39 | variant_nm | varchar(8000) | YES |
| 40 | salesrep_num | varchar(8000) | YES |
| 41 | cash_receipt_amt | decimal(28,10) | YES |
| 42 | tax_cust_seq | decimal(28,10) | YES |
| 43 | tax_cust_nm | varchar(8000) | YES |
| 44 | tax_taxpay_no | varchar(8000) | YES |
| 45 | del_flag | varchar(8000) | YES |
| 46 | del_user_id | varchar(8000) | YES |
| 47 | dms_trx_id | decimal(28,10) | YES |
| 48 | tax_type | varchar(8000) | YES |
| 49 | interface_yn | varchar(8000) | YES |
| 50 | interface_user_id | varchar(8000) | YES |
| 51 | interface_dt | datetime2 | YES |
| 52 | memo | varchar(8000) | YES |
| 53 | reg_dt | datetime2 | YES |
| 54 | reg_user_id | varchar(8000) | YES |
| 55 | upd_dt | datetime2 | YES |
| 56 | upd_user_id | varchar(8000) | YES |
| 57 | org_id | decimal(28,10) | YES |
| 58 | location_id | decimal(28,10) | YES |
| 59 | status | varchar(8000) | YES |
| 60 | process_id | decimal(28,10) | YES |
| 61 | psp_amt | decimal(28,10) | YES |
| 62 | error_code | varchar(8000) | YES |
| 63 | dz_docu_no | varchar(8000) | YES |
| 64 | dz_pc_cd | varchar(8000) | YES |
| 65 | dz_comp_cd | varchar(8000) | YES |
| 66 | dz_bizarea_cd | varchar(8000) | YES |
| 67 | dz_cc_cd | varchar(8000) | YES |
| 68 | sales_sc_id | varchar(8000) | YES |
| 69 | if_confirm_status | varchar(8000) | YES |
| 70 | svc_exchange_amt | decimal(28,10) | YES |
| 71 | receipt_time | varchar(8000) | YES |
| 72 | pg_seq | decimal(28,6) | YES |
| 73 | recent_yn | varchar(8000) | YES |
| 74 | partial_refund_yn | varchar(8000) | YES |
| 75 | partial_refund_balance | decimal(28,6) | YES |
| 76 | partial_ref_seq | decimal(28,6) | YES |
| 77 | app_mileage_amt | decimal(28,6) | YES |
| 78 | bank_account_card_dec | varchar(8000) | YES |
| 79 | bank_account_cash_dec | varchar(8000) | YES |
| 80 | taxpay_no_dec | varchar(8000) | YES |
| 81 | source_system | varchar(8000) | YES |
| 82 | elt_time | varchar(8000) | YES |

#### ldms.CO_USERS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(8000) | YES |
| 2 | group_id | varchar(8000) | YES |
| 3 | dept_cd | varchar(8000) | YES |
| 4 | showroom_id | varchar(8000) | YES |
| 5 | name | varchar(8000) | YES |
| 6 | title | varchar(8000) | YES |
| 7 | biz_charge | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | email | varchar(8000) | YES |
| 12 | authority | varchar(8000) | YES |
| 13 | user_group | varchar(8000) | YES |
| 14 | user_type | varchar(8000) | YES |
| 15 | passwd | varbinary | YES |
| 16 | display_order | varchar(8000) | YES |
| 17 | photo_file_dir | varchar(8000) | YES |
| 18 | skill_degree | varchar(8000) | YES |
| 19 | assign_stall | varchar(8000) | YES |
| 20 | name_eng | varchar(8000) | YES |
| 21 | designate_eng | varchar(8000) | YES |
| 22 | dept_eng | varchar(8000) | YES |
| 23 | addr_eng | varchar(8000) | YES |
| 24 | pref_lang | varchar(8000) | YES |
| 25 | work_start_dt | varchar(8000) | YES |
| 26 | resigned_dt | varchar(8000) | YES |
| 27 | active_yn | varchar(8000) | YES |
| 28 | charge_service | varchar(8000) | YES |
| 29 | charge_sales | varchar(8000) | YES |
| 30 | charge_parts | varchar(8000) | YES |
| 31 | query_type_sales | varchar(8000) | YES |
| 32 | query_type_service | varchar(8000) | YES |
| 33 | query_type_parts | varchar(8000) | YES |
| 34 | reg_user_id | varchar(8000) | YES |
| 35 | reg_dt | datetime2 | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | upd_dt | datetime2 | YES |
| 38 | empl_no | varchar(8000) | YES |
| 39 | regi_no | varchar(8000) | YES |
| 40 | bef_sale_id | varchar(8000) | YES |
| 41 | bef_service_id | varchar(8000) | YES |
| 42 | bef_crm_id | varchar(8000) | YES |
| 43 | fax_no | varchar(8000) | YES |
| 44 | tel_area | varchar(8000) | YES |
| 45 | tel_no | varchar(8000) | YES |
| 46 | fax_area | varchar(8000) | YES |
| 47 | hp_area | varchar(8000) | YES |
| 48 | hp_no | varchar(8000) | YES |
| 49 | facade_sc_yn | varchar(8000) | YES |
| 50 | frm_kind | varchar(8000) | YES |
| 51 | tax_use_type | varchar(8000) | YES |
| 52 | intro_menu | varchar(8000) | YES |
| 53 | dlr_voc_mng | varchar(8000) | YES |
| 54 | last_login_date | datetime2 | YES |
| 55 | passwd_upd_dt | datetime2 | YES |
| 56 | svc_head_yn | varchar(8000) | YES |
| 57 | password_lock | varchar(8000) | YES |
| 58 | mac_address | varchar(8000) | YES |
| 59 | pop_part_yn | varchar(8000) | YES |
| 60 | tr_zip | varchar(8000) | YES |
| 61 | tr_addr | varchar(8000) | YES |
| 62 | tr_addr_no | varchar(8000) | YES |
| 63 | tr_addr_flag | varchar(8000) | YES |
| 64 | tr_addr_insert_flag | varchar(8000) | YES |
| 65 | tr_addr_bld_no | varchar(8000) | YES |
| 66 | tr_addr_result | varchar(8000) | YES |
| 67 | vpn_yn | varchar(8000) | YES |
| 68 | auth_apvl_user_id | varchar(8000) | YES |
| 69 | intro_quick_menu | varchar(8000) | YES |
| 70 | e_learning_pwd | varchar(8000) | YES |
| 71 | out_act_cust_seq | decimal(28,10) | YES |
| 72 | master_user_id | varchar(8000) | YES |
| 73 | gm_type | varchar(8000) | YES |
| 74 | passwd_sha256 | varchar(8000) | YES |
| 75 | edu_yn | varchar(8000) | YES |
| 76 | edu_cate | varchar(8000) | YES |
| 77 | vpn_cnfm_dt | varchar(8000) | YES |
| 78 | first_name_eng | varchar(8000) | YES |
| 79 | sms_default_no | varchar(8000) | YES |
| 80 | layoff_dt | varchar(8000) | YES |
| 81 | resume_dt | varchar(8000) | YES |
| 82 | reactive_yn | varchar(8000) | YES |
| 83 | bi_code | varchar(8000) | YES |
| 84 | edu_primary_yn | varchar(8000) | YES |
| 85 | device_yn | varchar(8000) | YES |
| 86 | regi_no_dec | varchar(8000) | YES |
| 87 | birth_dt | varchar(8000) | YES |
| 88 | profile_url | varchar(8000) | YES |
| 89 | source_system | varchar(8000) | YES |
| 90 | elt_time | varchar(8000) | YES |

#### ldms.CO_VEHIC

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(8000) | YES | 차량 |
| 3 | vehic_no2 | varchar(8000) | YES | 차량 |
| 4 | vis | varchar(8000) | YES |  |
| 5 | contract_no | decimal(28,10) | YES | 계약번호 |
| 6 | model_year | varchar(8000) | YES | 모델 |
| 7 | brand_cd | varchar(8000) | YES | 브랜드 |
| 8 | maker_cd | varchar(8000) | YES | 코드 |
| 9 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 10 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 11 | odometer | int | YES |  |
| 12 | variant_nm | varchar(8000) | YES | 바리에이션 |
| 13 | svc_model_cd | varchar(8000) | YES | 모델 코드 |
| 14 | model_cd | varchar(8000) | YES | 모델 코드 |
| 15 | option_cd1 | varchar(8000) | YES |  |
| 16 | option_cd2 | varchar(8000) | YES |  |
| 17 | option_cd3 | varchar(8000) | YES |  |
| 18 | option_cd4 | varchar(8000) | YES |  |
| 19 | key_no | varchar(8000) | YES | 번호 |
| 20 | grade | varchar(8000) | YES |  |
| 21 | import_yn | varchar(8000) | YES | 여부(Y/N) |
| 22 | event | varchar(8000) | YES |  |
| 23 | linein_dt | varchar(8000) | YES | 일자 |
| 24 | delivery_dt | varchar(8000) | YES | 출고일 |
| 25 | lineoff_dt | varchar(8000) | YES | 일자 |
| 26 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 27 | exterior_cd | varchar(8000) | YES | 코드 |
| 28 | interior_cd | varchar(8000) | YES | 코드 |
| 29 | engine_no | varchar(8000) | YES | 번호 |
| 30 | force_reg_dt | datetime2 | YES | 등록일 |
| 31 | force_reg_yn | varchar(8000) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(8000) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 35 | first_rcpt_dt | datetime2 | YES | 일자 |
| 36 | sales_dealer_id | varchar(8000) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(8000) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 40 | last_rcpt_dt | datetime2 | YES | 일자 |
| 41 | vehic_magic | decimal(28,10) | YES | 차량 |
| 42 | ras_no | varchar(8000) | YES | 번호 |
| 43 | ew_no | varchar(8000) | YES | 번호 |
| 44 | sales_type | varchar(8000) | YES | 판매 |
| 45 | ras_start_dt | varchar(8000) | YES | 시작일 |
| 46 | ras_end_dt | varchar(8000) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | datetime2 | YES | 수정일 |
| 50 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 51 | upd_dt | datetime2 | YES | 수정일 |
| 52 | first_owner_yn | varchar(8000) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | datetime2 | YES | 수정일 |
| 55 | hv_badge_yn | varchar(8000) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(8000) | YES | 여부(Y/N) |
| 57 | source_system | varchar(8000) | YES |  |
| 58 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.CO_ZIPCODE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | zip_seq | decimal(28,10) | YES |
| 2 | zip_cd | varchar(8000) | YES |
| 3 | city | varchar(8000) | YES |
| 4 | gu | varchar(8000) | YES |
| 5 | dong | varchar(8000) | YES |
| 6 | rest | varchar(8000) | YES |
| 7 | dong1 | varchar(8000) | YES |
| 8 | dong2 | varchar(8000) | YES |
| 9 | source_system | varchar(8000) | YES |
| 10 | elt_time | varchar(8000) | YES |

#### ldms.CO_ZIPCODE_NEW

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | zip_cd | varchar(8000) | YES |
| 2 | zip_seq | varchar(8000) | YES |
| 3 | sido | varchar(8000) | YES |
| 4 | gugun | varchar(8000) | YES |
| 5 | dong | varchar(8000) | YES |
| 6 | detail_addr | varchar(8000) | YES |
| 7 | bunji | varchar(8000) | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | reg_dt | varchar(8000) | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | upd_dt | varchar(8000) | YES |
| 12 | source_system | varchar(8000) | YES |
| 13 | elt_time | varchar(8000) | YES |

#### ldms.CU_BASE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(28,10) | YES |
| 2 | cust_nm | varchar(8000) | YES |
| 3 | taxpay_no | varchar(8000) | YES |
| 4 | cust_type | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | mng_sc_id | varchar(8000) | YES |
| 7 | sale_sc_id | varchar(8000) | YES |
| 8 | mng_tech_id | varchar(8000) | YES |
| 9 | zip_reg | varchar(8000) | YES |
| 10 | addr_reg | varchar(8000) | YES |
| 11 | addr_no_reg | varchar(8000) | YES |
| 12 | zip_fact | varchar(8000) | YES |
| 13 | addr_fact | varchar(8000) | YES |
| 14 | addr_no_fact | varchar(8000) | YES |
| 15 | tel_area | varchar(8000) | YES |
| 16 | tel_no | varchar(8000) | YES |
| 17 | fax_area | varchar(8000) | YES |
| 18 | fax_no | varchar(8000) | YES |
| 19 | email | varchar(8000) | YES |
| 20 | email_domain | varchar(8000) | YES |
| 21 | hp_area | varchar(8000) | YES |
| 22 | hp_no | varchar(8000) | YES |
| 23 | job_cd | varchar(8000) | YES |
| 24 | job_detail | varchar(8000) | YES |
| 25 | office_nm | varchar(8000) | YES |
| 26 | dept_nm | varchar(8000) | YES |
| 27 | posi_nm | varchar(8000) | YES |
| 28 | zip_office | varchar(8000) | YES |
| 29 | addr_office | varchar(8000) | YES |
| 30 | rel_type | varchar(8000) | YES |
| 31 | addr_no_office | varchar(8000) | YES |
| 32 | office_tel_area | varchar(8000) | YES |
| 33 | office_tel_no | varchar(8000) | YES |
| 34 | rel_cust_seq | decimal(28,10) | YES |
| 35 | biz_cond_nm | varchar(8000) | YES |
| 36 | biz_type_nm | varchar(8000) | YES |
| 37 | chief_id | varchar(8000) | YES |
| 38 | chief_nm | varchar(8000) | YES |
| 39 | company_type | varchar(8000) | YES |
| 40 | dm_place_cd | varchar(8000) | YES |
| 41 | dm_name | varchar(8000) | YES |
| 42 | sms_receive_yn | varchar(8000) | YES |
| 43 | dm_receive_yn | varchar(8000) | YES |
| 44 | dm_return_yn | varchar(8000) | YES |
| 45 | email_return_yn | varchar(8000) | YES |
| 46 | email_receive_yn | varchar(8000) | YES |
| 47 | disuse_yn | varchar(8000) | YES |
| 48 | disuse_cd | varchar(8000) | YES |
| 49 | reg_dt | datetime2 | YES |
| 50 | deli_yn | varchar(8000) | YES |
| 51 | reg_user_id | varchar(8000) | YES |
| 52 | bef_crm_seq | decimal(28,10) | YES |
| 53 | upd_dt | datetime2 | YES |
| 54 | sc_grp_seq | decimal(28,10) | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_knd | varchar(8000) | YES |
| 57 | dealer_grp_seq | decimal(28,10) | YES |
| 58 | city | varchar(8000) | YES |
| 59 | gu | varchar(8000) | YES |
| 60 | dong | varchar(8000) | YES |
| 61 | dam_nm | varchar(8000) | YES |
| 62 | dm_receive_cust | varchar(8000) | YES |
| 63 | reg_shop_cd | varchar(8000) | YES |
| 64 | last_contact_date | datetime2 | YES |
| 65 | tr_zip_reg | varchar(8000) | YES |
| 66 | tr_addr_reg | varchar(8000) | YES |
| 67 | tr_addr_no_reg | varchar(8000) | YES |
| 68 | tr_addr_reg_flag | varchar(8000) | YES |
| 69 | tr_addr_reg_insert_flag | varchar(8000) | YES |
| 70 | tr_addr_reg_bld_no | varchar(8000) | YES |
| 71 | tr_addr_reg_result | varchar(8000) | YES |
| 72 | tr_zip_fact | varchar(8000) | YES |
| 73 | tr_addr_fact | varchar(8000) | YES |
| 74 | tr_addr_no_fact | varchar(8000) | YES |
| 75 | tr_addr_fact_flag | varchar(8000) | YES |
| 76 | tr_addr_fact_insert_flag | varchar(8000) | YES |
| 77 | tr_addr_fact_bld_no | varchar(8000) | YES |
| 78 | tr_addr_fact_result | varchar(8000) | YES |
| 79 | tr_zip_office | varchar(8000) | YES |
| 80 | tr_addr_office | varchar(8000) | YES |
| 81 | tr_addr_no_office | varchar(8000) | YES |
| 82 | tr_addr_office_flag | varchar(8000) | YES |
| 83 | tr_addr_office_insert_flag | varchar(8000) | YES |
| 84 | tr_addr_office_bld_no | varchar(8000) | YES |
| 85 | tr_addr_office_result | varchar(8000) | YES |
| 86 | reg_addr_loc_x | varchar(8000) | YES |
| 87 | reg_addr_loc_y | varchar(8000) | YES |
| 88 | result | varchar(8000) | YES |
| 89 | corp_no | varchar(8000) | YES |
| 90 | office_fax_area | varchar(8000) | YES |
| 91 | office_fax_no | varchar(8000) | YES |
| 92 | u_car_cust_type | varchar(8000) | YES |
| 93 | ecrb_act_yn | varchar(8000) | YES |
| 94 | dz_vendor_site_id | varchar(8000) | YES |
| 95 | app_flag | varchar(8000) | YES |
| 96 | ci_seq | decimal(28,10) | YES |
| 97 | consign_sales_flag | varchar(8000) | YES |
| 98 | del_dt | datetime2 | YES |
| 99 | del_user_id | varchar(8000) | YES |
| 100 | del_type | varchar(8000) | YES |
| 101 | cust_ci | varchar(8000) | YES |
| 102 | ci_reg_dt | datetime2 | YES |
| 103 | ci_upd_dt | datetime2 | YES |
| 104 | ci_remark | varchar(8000) | YES |
| 105 | realnm_seq | decimal(28,10) | YES |
| 106 | oneid_key | decimal(28,10) | YES |
| 107 | concern_degree | varchar(8000) | YES |
| 108 | taxpay_no_ymd | decimal(28,10) | YES |
| 109 | taxpay_no_g | decimal(28,10) | YES |
| 110 | chief_id_dec | varchar(8000) | YES |
| 111 | corp_no_dec | varchar(8000) | YES |
| 112 | taxpay_no_dec | varchar(8000) | YES |
| 113 | by_lead_yn | varchar(8000) | YES |
| 114 | source_system | varchar(8000) | YES |
| 115 | elt_time | varchar(8000) | YES |

#### ldms.CU_FAMILY

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(28,10) | YES |
| 2 | family_seq | decimal(28,10) | YES |
| 3 | family_cd | varchar(8000) | YES |
| 4 | family_name | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | sex_cd | varchar(8000) | YES |
| 7 | mng_sc_id | varchar(8000) | YES |
| 8 | birth_dt | varchar(8000) | YES |
| 9 | tel_area | varchar(8000) | YES |
| 10 | tel_no | varchar(8000) | YES |
| 11 | email | varchar(8000) | YES |
| 12 | email_domain | varchar(8000) | YES |
| 13 | hp_area | varchar(8000) | YES |
| 14 | hp_no | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | memo | varchar(8000) | YES |
| 20 | fam_cust_seq | decimal(28,10) | YES |
| 21 | info_yn | varchar(8000) | YES |
| 22 | family_taxpay_no | varchar(8000) | YES |
| 23 | family_zip_reg | varchar(8000) | YES |
| 24 | family_addr_reg | varchar(8000) | YES |
| 25 | family_addr_no_reg | varchar(8000) | YES |
| 26 | tr_zip_reg | varchar(8000) | YES |
| 27 | tr_addr_reg | varchar(8000) | YES |
| 28 | tr_addr_no_reg | varchar(8000) | YES |
| 29 | tr_addr_reg_flag | varchar(8000) | YES |
| 30 | tr_addr_reg_insert_flag | varchar(8000) | YES |
| 31 | tr_addr_reg_bld_no | varchar(8000) | YES |
| 32 | tr_addr_reg_result | varchar(8000) | YES |
| 33 | drving_yn | varchar(8000) | YES |
| 34 | luso_type | varchar(8000) | YES |
| 35 | last_link_contract_no | decimal(28,10) | YES |
| 36 | lpm_user_no | decimal(28,10) | YES |
| 37 | cust_contact_yn | varchar(8000) | YES |
| 38 | family_taxpay_no_dec | varchar(8000) | YES |
| 39 | del_yn | varchar(8000) | YES |
| 40 | ci | varchar(8000) | YES |
| 41 | ci_upd_dt | datetime2 | YES |
| 42 | city | varchar(8000) | YES |
| 43 | gu | varchar(8000) | YES |
| 44 | source_system | varchar(8000) | YES |
| 45 | elt_time | varchar(8000) | YES |

#### ldms.ECRB_EXCLUDE_VIN

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delivery_month | varchar(8000) | YES |
| 2 | vin | varchar(8000) | YES |
| 3 | service_type_cd | varchar(8000) | YES |
| 4 | dealer_id | varchar(8000) | YES |
| 5 | reg_dt | datetime2 | YES |
| 6 | reg_user_id | varchar(8000) | YES |
| 7 | reason | varchar(8000) | YES |
| 8 | source_system | varchar(8000) | YES |
| 9 | elt_time | varchar(8000) | YES |

#### ldms.IF_AR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | interface_id | decimal(28,0) | YES |
| 2 | group_id | decimal(28,0) | YES |
| 3 | company_code | varchar(8000) | YES |
| 4 | org_id | decimal(28,0) | YES |
| 5 | location_id | decimal(28,0) | YES |
| 6 | dealer_id | varchar(8000) | YES |
| 7 | module | varchar(8000) | YES |
| 8 | trx_type | varchar(8000) | YES |
| 9 | trx_flag | varchar(8000) | YES |
| 10 | line_attribute1 | varchar(8000) | YES |
| 11 | line_attribute2 | varchar(8000) | YES |
| 12 | line_attribute3 | varchar(8000) | YES |
| 13 | line_desc | varchar(8000) | YES |
| 14 | org_person_flag | varchar(8000) | YES |
| 15 | client_org_id | decimal(28,0) | YES |
| 16 | client_location_id | decimal(28,0) | YES |
| 17 | client_dealer_id | varchar(8000) | YES |
| 18 | cust_seq | decimal(28,0) | YES |
| 19 | comp_seq | decimal(28,0) | YES |
| 20 | registration_num | varchar(8000) | YES |
| 21 | currency_code | varchar(8000) | YES |
| 22 | conversion_date | datetime2 | YES |
| 23 | conversion_type | varchar(8000) | YES |
| 24 | conversion_rate | decimal(28,0) | YES |
| 25 | trx_date | datetime2 | YES |
| 26 | gl_date | datetime2 | YES |
| 27 | term_id | decimal(28,0) | YES |
| 28 | quantity | decimal(28,0) | YES |
| 29 | unit_selling_price | decimal(28,0) | YES |
| 30 | amount | decimal(28,0) | YES |
| 31 | vat_tax_id | decimal(28,0) | YES |
| 32 | vat_amount | decimal(28,0) | YES |
| 33 | vat_tax_count | varchar(8000) | YES |
| 34 | salesrep_num | varchar(8000) | YES |
| 35 | segment5 | varchar(8000) | YES |
| 36 | status | varchar(8000) | YES |
| 37 | error_code | varchar(8000) | YES |
| 38 | reg_dt | datetime2 | YES |
| 39 | reg_user_id | varchar(8000) | YES |
| 40 | upd_dt | datetime2 | YES |
| 41 | upd_user_id | varchar(8000) | YES |
| 42 | client_name | varchar(8000) | YES |
| 43 | invoice_amount | decimal(28,0) | YES |
| 44 | surtax_itemname1 | varchar(8000) | YES |
| 45 | transaction_type_code | varchar(8000) | YES |
| 46 | transaction_type_data | varchar(8000) | YES |
| 47 | transaction_sub_type_code | varchar(8000) | YES |
| 48 | transaction_sub_type_data | varchar(8000) | YES |
| 49 | sob_id | decimal(15,0) | YES |
| 50 | amount_gl | decimal(28,0) | YES |
| 51 | lookup_nm | varchar(8000) | YES |
| 52 | trans_yn | varchar(8000) | YES |
| 53 | status_comp | varchar(8000) | YES |
| 54 | interface_dt | datetime2 | YES |
| 55 | trx_group | varchar(8000) | YES |
| 56 | del_flag | varchar(8000) | YES |
| 57 | dms_trx_id | decimal(28,0) | YES |
| 58 | org_shop_cd | varchar(8000) | YES |
| 59 | memo | varchar(8000) | YES |
| 60 | interface_id_acnt | decimal(28,6) | YES |
| 61 | brand | varchar(8000) | YES |
| 62 | sfx_cd | varchar(8000) | YES |
| 63 | biz_reg_no | varchar(8000) | YES |
| 64 | process_id | decimal(28,0) | YES |
| 65 | tyt_interface_h_id | decimal(28,0) | YES |
| 66 | legacy_confirm_status | varchar(8000) | YES |
| 67 | dz_pc_cd | varchar(8000) | YES |
| 68 | dz_comp_cd | varchar(8000) | YES |
| 69 | dz_bizarea_cd | varchar(8000) | YES |
| 70 | dz_wdept_cd | varchar(8000) | YES |
| 71 | dz_write_id | varchar(8000) | YES |
| 72 | prod_loc | varchar(8000) | YES |
| 73 | dz_docu_no | varchar(8000) | YES |
| 74 | vin | varchar(8000) | YES |
| 75 | dz_tax_status | varchar(8000) | YES |
| 76 | dz_tax_sum_no | varchar(8000) | YES |
| 77 | dz_tax_docu_no | varchar(8000) | YES |
| 78 | dz_tax_sum_dt | datetime2 | YES |
| 79 | dz_tax_docu_dt | datetime2 | YES |
| 80 | dz_cc_cd | varchar(8000) | YES |
| 81 | pre_rcpt_yn | varchar(8000) | YES |
| 82 | if_confirm_status | varchar(8000) | YES |
| 83 | cust_nm | varchar(8000) | YES |
| 84 | family_seq | decimal(28,6) | YES |
| 85 | dz_tax_biz_no | varchar(8000) | YES |
| 86 | source_system | varchar(8000) | YES |
| 87 | elt_time | varchar(8000) | YES |

#### ldms.OM_CONTRACT

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(28,10) | YES | 계약번호 |
| 2 | dlr_contract_no | varchar(8000) | YES | 번호 |
| 3 | contract_dt | varchar(8000) | YES | 계약일 |
| 4 | contract_stat_cd | varchar(8000) | YES | 계약 |
| 5 | sold_yn | varchar(8000) | YES | 여부(Y/N) |
| 6 | urgent_yn | varchar(8000) | YES | 여부(Y/N) |
| 7 | allocation_yn | varchar(8000) | YES | 여부(Y/N) |
| 8 | status_mod_dt | varchar(8000) | YES | 수정일 |
| 9 | cond_mod_yn | varchar(8000) | YES | 여부(Y/N) |
| 10 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 11 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 12 | user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 13 | owner_type | varchar(8000) | YES | 유형코드 |
| 14 | cust_seq | decimal(28,10) | YES | 고객 |
| 15 | comp_seq | decimal(28,10) | YES | 순번 |
| 16 | real_cust_seq | decimal(28,10) | YES | 고객 |
| 17 | owner_seq | decimal(28,10) | YES | 순번 |
| 18 | customs_seq | decimal(28,10) | YES | 고객 |
| 19 | brand_cd | varchar(8000) | YES | 브랜드 |
| 20 | model_cd | varchar(8000) | YES | 모델 코드 |
| 21 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 22 | my_cd | varchar(8000) | YES | 코드 |
| 23 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 24 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 25 | option_cd | varchar(8000) | YES | 코드 |
| 26 | option_cd2 | varchar(8000) | YES |  |
| 27 | option_cd3 | varchar(8000) | YES |  |
| 28 | option_cd4 | varchar(8000) | YES |  |
| 29 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 30 | vehic_magic | decimal(28,10) | YES | 차량 |
| 31 | vehic_price | decimal(28,10) | YES | 차량가격 |
| 32 | vehic_vat | decimal(28,10) | YES | 차량 |
| 33 | vehic_option_price | decimal(28,10) | YES | 차량가격 |
| 34 | vehic_color_price | decimal(28,10) | YES | 색상 |
| 35 | vehic_discount_amt | decimal(28,10) | YES | 차량 |
| 36 | vehic_total_amt | decimal(28,10) | YES | 차량 |
| 37 | deposit_amt | decimal(28,10) | YES | 계약금 |
| 38 | sales_type | varchar(8000) | YES | 판매 |
| 39 | pay_type | varchar(8000) | YES | 유형코드 |
| 40 | tax_type | decimal(28,10) | YES | 유형코드 |
| 41 | lease_comp_seq | decimal(28,10) | YES | 순번 |
| 42 | reg_free_yn | varchar(8000) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(8000) | YES | 재고 |
| 44 | reg_stock_rate | decimal(28,10) | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(8000) | YES | 재고 |
| 46 | reg_agency_yn | varchar(8000) | YES | 등록 |
| 47 | reg_tax | decimal(28,10) | YES | 등록 |
| 48 | reg_stock_price | decimal(28,10) | YES | 가격 |
| 49 | reg_stamp_price | decimal(28,10) | YES | 가격 |
| 50 | reg_plate_price | decimal(28,10) | YES | 가격 |
| 51 | reg_fee | decimal(28,10) | YES | 등록 |
| 52 | reg_aquisition_tax | decimal(28,10) | YES | 등록 |
| 53 | reg_special_tax | decimal(28,10) | YES | 등록 |
| 54 | reg_education_tax | decimal(28,10) | YES | 등록 |
| 55 | reg_total_amt | decimal(28,10) | YES | 총 금액 |
| 56 | take_contract_amt | decimal(28,10) | YES | 금액 |
| 57 | take_delivery_amt | decimal(28,10) | YES | 금액 |
| 58 | lease_month_amt | decimal(28,10) | YES | 금액 |
| 59 | lease_term_dt | varchar(8000) | YES | 일자 |
| 60 | lease_rate | decimal(5,2) | YES |  |
| 61 | take_depositer_nm | varchar(8000) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(8000) | YES | 계약금 |
| 63 | side_stamp_price | decimal(28,10) | YES | 가격 |
| 64 | side_setup_amt | decimal(28,10) | YES | 금액 |
| 65 | side_fee | decimal(28,10) | YES |  |
| 66 | side_total_amt | decimal(28,10) | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(8000) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(8000) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(8000) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(8000) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(8000) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(8000) | YES | 출고 |
| 73 | request_by | varchar(8000) | YES |  |
| 74 | request_dt | datetime2 | YES | 일자 |
| 75 | approval_by | varchar(8000) | YES |  |
| 76 | approval_dt | datetime2 | YES | 일자 |
| 77 | cancel_by | varchar(8000) | YES | 취소 |
| 78 | cancel_dt | datetime2 | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(8000) | YES | 판매 |
| 80 | last_issued_dt | varchar(8000) | YES | 일자 |
| 81 | last_mod_dt | varchar(8000) | YES | 수정일 |
| 82 | delivery_request_by | varchar(8000) | YES | 출고 |
| 83 | delivery_request_dt | datetime2 | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(8000) | YES | 출고 |
| 85 | delivery_cancel_dt | datetime2 | YES | 출고일 |
| 86 | delivery_plan_by | varchar(8000) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(8000) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(8000) | YES | 출고 |
| 89 | delivery_approval_dt | datetime2 | YES | 출고일 |
| 90 | reg_plan_dt | varchar(8000) | YES | 등록일 |
| 91 | contract_msg | varchar(8000) | YES | 계약 |
| 92 | vehic_reg_no | varchar(8000) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(8000) | YES | 차량 |
| 94 | dept_cd | varchar(8000) | YES | 코드 |
| 95 | boc_except_dt | varchar(8000) | YES | 일자 |
| 96 | reg_dt | datetime2 | YES | 등록일 |
| 97 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 98 | upd_dt | datetime2 | YES | 수정일 |
| 99 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(8000) | YES | 여부(Y/N) |
| 101 | allocation_dt | datetime2 | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(8000) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(8000) | YES | 고객 |
| 104 | rs_cust_addr | varchar(8000) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(8000) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(8000) | YES |  |
| 107 | rs_geo_loc_y | varchar(8000) | YES |  |
| 108 | potential_division | varchar(8000) | YES |  |
| 109 | org_followup_id | decimal(28,10) | YES | 식별자(ID) |
| 110 | plate_size | varchar(8000) | YES |  |
| 111 | receiver_apply_yn | varchar(8000) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(8000) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(8000) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(8000) | YES | 번호 |
| 115 | receiver_ssn | varchar(8000) | YES |  |
| 116 | pma_yn | varchar(8000) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(8000) | YES | 고객번호 |
| 118 | family_seq | decimal(28,10) | YES | 순번 |
| 119 | lemon_yn | varchar(8000) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(8000) | YES |  |
| 121 | app_flag | varchar(8000) | YES |  |
| 122 | consign_sales_flag | varchar(8000) | YES | 판매 |
| 123 | contract_msg_kr | varchar(8000) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(8000) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(8000) | YES | 고객 |
| 126 | realnm_seq | decimal(28,10) | YES | 순번 |
| 127 | tax_biz_no | varchar(8000) | YES | 번호 |
| 128 | pma_city | varchar(8000) | YES | 시 |
| 129 | pma_gu | varchar(8000) | YES | 구 |
| 130 | taxpay_no_ymd | decimal(28,10) | YES |  |
| 131 | taxpay_no_g | decimal(28,10) | YES |  |
| 132 | flood_yn | varchar(8000) | YES | 여부(Y/N) |
| 133 | lead_id | decimal(28,0) | YES | 식별자(ID) |
| 134 | smart_upd_cnt | decimal(28,0) | YES |  |
| 135 | dms_upd_cnt | decimal(28,0) | YES |  |
| 136 | source_system | varchar(8000) | YES |  |
| 137 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.OM_CONTRACT_CUST

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(28,10) | YES | 계약번호 |
| 2 | owner_type | varchar(8000) | YES | 유형코드 |
| 3 | cust_nm | varchar(8000) | YES | 고객 |
| 4 | cust_ssn_id | varchar(8000) | YES | 고객 |
| 5 | cust_email | varchar(8000) | YES | 고객 |
| 6 | cust_tel_full | varchar(8000) | YES | 고객 |
| 7 | cust_mobile_tel_full | varchar(8000) | YES | 고객 |
| 8 | cust_zip | varchar(8000) | YES | 고객 |
| 9 | cust_adr | varchar(8000) | YES | 고객 |
| 10 | cust_detail_adr | varchar(8000) | YES | 고객 |
| 11 | comp_nm | varchar(8000) | YES | 명칭 |
| 12 | comp_biz_reg_no | varchar(8000) | YES | 등록 |
| 13 | comp_email | varchar(8000) | YES |  |
| 14 | comp_tel_full | varchar(8000) | YES |  |
| 15 | comp_zip | varchar(8000) | YES |  |
| 16 | comp_adr | varchar(8000) | YES |  |
| 17 | comp_detail_adr | varchar(8000) | YES |  |
| 18 | lease_nm | varchar(8000) | YES | 명칭 |
| 19 | lease_biz_reg_no | varchar(8000) | YES | 등록 |
| 20 | lease_email | varchar(8000) | YES |  |
| 21 | lease_tel_full | varchar(8000) | YES |  |
| 22 | lease_zip | varchar(8000) | YES |  |
| 23 | lease_adr | varchar(8000) | YES |  |
| 24 | lease_detail_adr | varchar(8000) | YES |  |
| 25 | pma_city | varchar(8000) | YES | 시 |
| 26 | pma_gu | varchar(8000) | YES | 구 |
| 27 | source_system | varchar(8000) | YES |  |
| 28 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.OM_PMA

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer_id | varchar(8000) | YES |
| 2 | city | varchar(8000) | YES |
| 3 | gu | varchar(8000) | YES |
| 4 | reg_user_id | varchar(8000) | YES |
| 5 | reg_dt | datetime2 | YES |
| 6 | upd_user_id | varchar(8000) | YES |
| 7 | upd_dt | datetime2 | YES |
| 8 | use_yn | varchar(8000) | YES |
| 9 | source_system | varchar(8000) | YES |
| 10 | elt_time | varchar(8000) | YES |

#### ldms.PT_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | part_nm | varchar(8000) | YES | 부품 |
| 3 | splr_cd | varchar(8000) | YES | 코드 |
| 4 | franchise_cd | varchar(8000) | YES | 코드 |
| 5 | impt_cd | varchar(8000) | YES | 코드 |
| 6 | prod_cd | varchar(8000) | YES | 코드 |
| 7 | subs_cd_old | varchar(8000) | YES |  |
| 8 | subs_part_no_old | varchar(8000) | YES | 부품번호 |
| 9 | subs_cd_new | varchar(8000) | YES |  |
| 10 | subs_part_no_new | varchar(8000) | YES | 부품번호 |
| 11 | lk | varchar(8000) | YES |  |
| 12 | stop_sale_cd | varchar(8000) | YES | 판매 |
| 13 | non_re_order_cd | varchar(8000) | YES | 주문 |
| 14 | pnc | varchar(8000) | YES |  |
| 15 | epc_fig_no | varchar(8000) | YES | 번호 |
| 16 | tariff_cd | varchar(8000) | YES | 코드 |
| 17 | all_time_buy_cd | varchar(8000) | YES | 코드 |
| 18 | stock_type | varchar(8000) | YES | 재고 |
| 19 | prod_start_dt | varchar(8000) | YES | 시작일 |
| 20 | prod_end_dt | varchar(8000) | YES | 종료일 |
| 21 | rp_drct | bigint | YES |  |
| 22 | price_group_cd | varchar(8000) | YES | 가격 |
| 23 | price_fmla_cd | varchar(8000) | YES | 가격 |
| 24 | net_weit | decimal(13,2) | YES |  |
| 25 | prod_lot | varchar(8000) | YES |  |
| 26 | case_lot | varchar(8000) | YES |  |
| 27 | rack_type | varchar(8000) | YES | 유형코드 |
| 28 | ideal_qty_per_box | bigint | YES | 수량 |
| 29 | no_of_used_box | bigint | YES |  |
| 30 | part_no_edit_cd | varchar(8000) | YES | 부품번호 |
| 31 | tmc_non_stock_cd | varchar(8000) | YES | 재고 |
| 32 | local_yn | varchar(8000) | YES | 여부(Y/N) |
| 33 | cons_part_yn | varchar(8000) | YES | 부품 |
| 34 | ssq_auto_yn | varchar(8000) | YES | 여부(Y/N) |
| 35 | purc_unit | varchar(8000) | YES |  |
| 36 | sale_unit | varchar(8000) | YES | 판매 |
| 37 | conv_qty | bigint | YES | 수량 |
| 38 | order_unit_qty | bigint | YES | 수량 |
| 39 | pick_slip_unit_qty | bigint | YES | 수량 |
| 40 | bin_slip_unit_qty | bigint | YES | 수량 |
| 41 | barc_no | varchar(8000) | YES | 번호 |
| 42 | wide | bigint | YES |  |
| 43 | leng | bigint | YES |  |
| 44 | heit | bigint | YES |  |
| 45 | size_type | varchar(8000) | YES | 유형코드 |
| 46 | part_reg_dt | varchar(8000) | YES | 부품 |
| 47 | group_cd | varchar(8000) | YES | 코드 |
| 48 | use_yn | varchar(8000) | YES | 여부(Y/N) |
| 49 | key_part_yn | varchar(8000) | YES | 부품 |
| 50 | key_kind | varchar(8000) | YES |  |
| 51 | fax_part_yn | varchar(8000) | YES | 부품 |
| 52 | order_unit_auto_set_yn | varchar(8000) | YES | 주문 |
| 53 | oil_purc_yn | varchar(8000) | YES | 여부(Y/N) |
| 54 | unit_pack_qty | bigint | YES | 수량 |
| 55 | usage_type | varchar(8000) | YES | 유형코드 |
| 56 | note | varchar(8000) | YES |  |
| 57 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 58 | reg_dt | datetime2 | YES | 등록일 |
| 59 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 60 | upd_dt | datetime2 | YES | 수정일 |
| 61 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 62 | lexus_price_app_flag | varchar(8000) | YES | 가격 |
| 63 | pre_order_yn | varchar(8000) | YES | 주문 |
| 64 | brandship | varchar(8000) | YES | 브랜드 |
| 65 | hs_code | varchar(8000) | YES | 코드 |
| 66 | coo | varchar(8000) | YES |  |
| 67 | first_prod_user | varchar(8000) | YES |  |
| 68 | part_nm_kor | varchar(8000) | YES | 부품 |
| 69 | racode | varchar(8000) | YES | 코드 |
| 70 | jsp | varchar(8000) | YES |  |
| 71 | source_system | varchar(8000) | YES |  |
| 72 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.PT_SOUT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | sout_no | varchar(8000) | YES |
| 3 | sout_dt | varchar(8000) | YES |
| 4 | sout_type | varchar(8000) | YES |
| 5 | sout_kind | varchar(8000) | YES |
| 6 | stat | varchar(8000) | YES |
| 7 | sout_fini_yn | varchar(8000) | YES |
| 8 | sout_cnfm_dt | varchar(8000) | YES |
| 9 | invo_dt | varchar(8000) | YES |
| 10 | svc_shop_cd | varchar(8000) | YES |
| 11 | svc_propo_dt | varchar(8000) | YES |
| 12 | svc_propo_seq | decimal(28,10) | YES |
| 13 | acnt_link_yn | varchar(8000) | YES |
| 14 | acnt_link_dt | varchar(8000) | YES |
| 15 | acnt_link_file | varchar(8000) | YES |
| 16 | acnt_link_key | bigint | YES |
| 17 | dest | varchar(8000) | YES |
| 18 | auto_crea_yn | varchar(8000) | YES |
| 19 | sout_sply_amt | bigint | YES |
| 20 | dc_rate | decimal(5,2) | YES |
| 21 | dc_amt | bigint | YES |
| 22 | sale_amt | bigint | YES |
| 23 | sout_vat_amt | bigint | YES |
| 24 | fina_amt | bigint | YES |
| 25 | pay_type | varchar(8000) | YES |
| 26 | svc_sale_type | varchar(8000) | YES |
| 27 | cust_no | varchar(8000) | YES |
| 28 | cust_nm | varchar(8000) | YES |
| 29 | cust_seq | bigint | YES |
| 30 | comp_seq | bigint | YES |
| 31 | cust_kind | varchar(8000) | YES |
| 32 | vin | varchar(8000) | YES |
| 33 | vehic_no1 | varchar(8000) | YES |
| 34 | vehic_no2 | varchar(8000) | YES |
| 35 | addr1 | varchar(8000) | YES |
| 36 | addr2 | varchar(8000) | YES |
| 37 | addr3 | varchar(8000) | YES |
| 38 | tel_area1 | varchar(8000) | YES |
| 39 | tel_no1 | varchar(8000) | YES |
| 40 | tel_area2 | varchar(8000) | YES |
| 41 | tel_no2 | varchar(8000) | YES |
| 42 | upd_yn | varchar(8000) | YES |
| 43 | cncl_yn | varchar(8000) | YES |
| 44 | internal_usage | varchar(8000) | YES |
| 45 | remark | varchar(8000) | YES |
| 46 | rcit_dt | varchar(8000) | YES |
| 47 | rcit_amt | bigint | YES |
| 48 | term_id | bigint | YES |
| 49 | tax_type | bigint | YES |
| 50 | tax_rate | decimal(5,2) | YES |
| 51 | biz_reg_no | varchar(8000) | YES |
| 52 | twc_stat | varchar(8000) | YES |
| 53 | tax_cust_seq | bigint | YES |
| 54 | payback_yn | varchar(8000) | YES |
| 55 | receipt_key | decimal(28,10) | YES |
| 56 | ar_key | decimal(28,10) | YES |
| 57 | base_sale_dt | varchar(8000) | YES |
| 58 | biz_shop_cd | varchar(8000) | YES |
| 59 | biz_no | varchar(8000) | YES |
| 60 | dealer_id | varchar(8000) | YES |
| 61 | reg_dt | datetime2 | YES |
| 62 | reg_user_id | varchar(8000) | YES |
| 63 | upd_dt | datetime2 | YES |
| 64 | upd_user_id | varchar(8000) | YES |
| 65 | invo_print_yn | varchar(8000) | YES |
| 66 | invo_print_day | varchar(8000) | YES |
| 67 | quot_no | varchar(8000) | YES |
| 68 | biz_reg_no_dec | varchar(8000) | YES |
| 69 | source_system | varchar(8000) | YES |
| 70 | elt_time | varchar(8000) | YES |

#### ldms.PT_SOUT_DETL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | sout_no | varchar(8000) | YES |
| 3 | line_no | int | YES |
| 4 | part_no | varchar(8000) | YES |
| 5 | sout_order_qty | bigint | YES |
| 6 | pick_qty | bigint | YES |
| 7 | sout_qty | bigint | YES |
| 8 | sout_cnfm_qty | bigint | YES |
| 9 | sout_dt | varchar(8000) | YES |
| 10 | sout_cnfm_dt | varchar(8000) | YES |
| 11 | sout_unit | varchar(8000) | YES |
| 12 | conv_qty | bigint | YES |
| 13 | sout_price | bigint | YES |
| 14 | sout_amt | bigint | YES |
| 15 | dc_rate | decimal(5,2) | YES |
| 16 | dc_amt | bigint | YES |
| 17 | sale_price | bigint | YES |
| 18 | sale_amt | bigint | YES |
| 19 | sout_vat_amt | bigint | YES |
| 20 | fina_amt | bigint | YES |
| 21 | stock_price_at_sout | bigint | YES |
| 22 | stock_amt_at_sout | bigint | YES |
| 23 | sout_start_day | varchar(8000) | YES |
| 24 | sout_end_day | varchar(8000) | YES |
| 25 | stat | varchar(8000) | YES |
| 26 | sout_man | varchar(8000) | YES |
| 27 | sout_fini_yn | varchar(8000) | YES |
| 28 | rcit_man | varchar(8000) | YES |
| 29 | svc_sout_kind | varchar(8000) | YES |
| 30 | cncl_qty | bigint | YES |
| 31 | cncl_yn | varchar(8000) | YES |
| 32 | cons_stock_use_yn | varchar(8000) | YES |
| 33 | cons_splr_cd | varchar(8000) | YES |
| 34 | remark | varchar(8000) | YES |
| 35 | svc_shop_cd | varchar(8000) | YES |
| 36 | svc_propo_dt | varchar(8000) | YES |
| 37 | svc_propo_seq | decimal(28,10) | YES |
| 38 | svc_part_no | varchar(8000) | YES |
| 39 | svc_part_seq | decimal(28,10) | YES |
| 40 | twc_stat | varchar(8000) | YES |
| 41 | payback_yn | varchar(8000) | YES |
| 42 | payback_qty | bigint | YES |
| 43 | biz_shop_cd | varchar(8000) | YES |
| 44 | biz_no | varchar(8000) | YES |
| 45 | biz_detl_line_no | int | YES |
| 46 | reg_dt | datetime2 | YES |
| 47 | reg_user_id | varchar(8000) | YES |
| 48 | upd_dt | datetime2 | YES |
| 49 | upd_user_id | varchar(8000) | YES |
| 50 | cancel_receipt_dt | varchar(8000) | YES |
| 51 | source_system | varchar(8000) | YES |
| 52 | elt_time | varchar(8000) | YES |

#### ldms.SVC_BP_PROC_TIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,6) | YES |
| 4 | proc_type_cd | varchar(8000) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(8000) | YES |
| 7 | stall_no | decimal(28,6) | YES |
| 8 | expt_st_dt | datetime2 | YES |
| 9 | expt_end_dt | datetime2 | YES |
| 10 | real_st_dt | datetime2 | YES |
| 11 | real_end_dt | datetime2 | YES |
| 12 | stat_cd | varchar(8000) | YES |
| 13 | cancel_reason_cd | varchar(8000) | YES |
| 14 | tot_rest_minutes | decimal(28,6) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | re_repair_yn | varchar(8000) | YES |
| 20 | qc_close_yn | varchar(8000) | YES |
| 21 | work_seq_next | int | YES |
| 22 | source_system | varchar(8000) | YES |
| 23 | elt_time | varchar(8000) | YES |

#### ldms.SVC_DLR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | twc_no | varchar(8000) | YES |
| 3 | propo_dt | varchar(8000) | YES |
| 4 | propo_seq | decimal(28,6) | YES |
| 5 | grp_no | decimal(28,6) | YES |
| 6 | settle_type_cd | varchar(8000) | YES |
| 7 | warranty_type_cd | varchar(8000) | YES |
| 8 | operation_type_cd | varchar(8000) | YES |
| 9 | data_id | varchar(8000) | YES |
| 10 | nv_flag | varchar(8000) | YES |
| 11 | f_vehic_flag | varchar(8000) | YES |
| 12 | fr_cd | varchar(8000) | YES |
| 13 | wmi | varchar(8000) | YES |
| 14 | vds | varchar(8000) | YES |
| 15 | vcd | varchar(8000) | YES |
| 16 | vis | varchar(8000) | YES |
| 17 | delivery_date | varchar(8000) | YES |
| 18 | repair_date | varchar(8000) | YES |
| 19 | repair_end_date | varchar(8000) | YES |
| 20 | odometer | int | YES |
| 21 | main_frm_no | varchar(8000) | YES |
| 22 | local_cause_part_flag | varchar(8000) | YES |
| 23 | cause_part_no | varchar(8000) | YES |
| 24 | apply_charge_amt | decimal(28,6) | YES |
| 25 | pwr | decimal(5,2) | YES |
| 26 | lwr | decimal(5,2) | YES |
| 27 | tot_labor_mh | decimal(4,1) | YES |
| 28 | tot_labor_amt | decimal(28,6) | YES |
| 29 | tot_part_amt | decimal(28,6) | YES |
| 30 | tot_sublet_amt | decimal(28,6) | YES |
| 31 | t1_cd | varchar(8000) | YES |
| 32 | t2_type_cd | varchar(8000) | YES |
| 33 | t2_cd | varchar(8000) | YES |
| 34 | t3_cd_1 | varchar(8000) | YES |
| 35 | t3_cd_2 | varchar(8000) | YES |
| 36 | t3_cd_3 | varchar(8000) | YES |
| 37 | t3_cd_4 | varchar(8000) | YES |
| 38 | t3_cd_5 | varchar(8000) | YES |
| 39 | t3_cd_6 | varchar(8000) | YES |
| 40 | t3_cd_7 | varchar(8000) | YES |
| 41 | sublet_expl | varchar(8000) | YES |
| 42 | sublet_expl_2 | varchar(8000) | YES |
| 43 | condition | varchar(8000) | YES |
| 44 | cause | varchar(8000) | YES |
| 45 | remedy | varchar(8000) | YES |
| 46 | tsb_no | varchar(8000) | YES |
| 47 | prev_shop_cd | varchar(8000) | YES |
| 48 | prev_propo_dt | varchar(8000) | YES |
| 49 | prev_propo_seq | decimal(28,6) | YES |
| 50 | prev_odometer | int | YES |
| 51 | prev_repair_date | varchar(8000) | YES |
| 52 | cr_no | varchar(8000) | YES |
| 53 | stat_cd | varchar(8000) | YES |
| 54 | stat_chng_user_id | varchar(8000) | YES |
| 55 | stat_chng_dt | datetime2 | YES |
| 56 | write_dt | datetime2 | YES |
| 57 | rqst_invoice_no | varchar(8000) | YES |
| 58 | rqst_dt | datetime2 | YES |
| 59 | rqst_cnt | int | YES |
| 60 | rqst_lvl | varchar(8000) | YES |
| 61 | sys_judge_dt | datetime2 | YES |
| 62 | sys_judge_cd | varchar(8000) | YES |
| 63 | tmkr_judge_dt | datetime2 | YES |
| 64 | tmkr_judge_cd | varchar(8000) | YES |
| 65 | aprov_labor_amt | decimal(28,6) | YES |
| 66 | aprov_part_amt | decimal(28,6) | YES |
| 67 | aprov_sublet_amt | decimal(28,6) | YES |
| 68 | aprov_tot_amt | decimal(28,6) | YES |
| 69 | twc_remark | varchar(8000) | YES |
| 70 | twc_close_yn | varchar(8000) | YES |
| 71 | twc_close_dt | datetime2 | YES |
| 72 | twc_review_yn | varchar(8000) | YES |
| 73 | file_path_1 | varchar(8000) | YES |
| 74 | file_nm_1 | varchar(8000) | YES |
| 75 | file_path_2 | varchar(8000) | YES |
| 76 | file_nm_2 | varchar(8000) | YES |
| 77 | file_path_3 | varchar(8000) | YES |
| 78 | file_nm_3 | varchar(8000) | YES |
| 79 | sout_no | varchar(8000) | YES |
| 80 | prev_inv | varchar(8000) | YES |
| 81 | prev_sale_dt | varchar(8000) | YES |
| 82 | curr_inv | varchar(8000) | YES |
| 83 | curr_sale_dt | varchar(8000) | YES |
| 84 | prev_sout_no | varchar(8000) | YES |
| 85 | cr_case_no | int | YES |
| 86 | bat_test_cd_1 | varchar(8000) | YES |
| 87 | bat_test_cd_2 | varchar(8000) | YES |
| 88 | bat_test_cd_3 | varchar(8000) | YES |
| 89 | bat_test_cd_4 | varchar(8000) | YES |
| 90 | diag_cd_1 | varchar(8000) | YES |
| 91 | diag_cd_2 | varchar(8000) | YES |
| 92 | diag_cd_3 | varchar(8000) | YES |
| 93 | diag_cd_4 | varchar(8000) | YES |
| 94 | diag_cd_5 | varchar(8000) | YES |
| 95 | serial_cd_1 | varchar(8000) | YES |
| 96 | serial_cd_2 | varchar(8000) | YES |
| 97 | serial_cd_3 | varchar(8000) | YES |
| 98 | reg_dt | datetime2 | YES |
| 99 | reg_user_id | varchar(8000) | YES |
| 100 | upd_dt | datetime2 | YES |
| 101 | upd_user_id | varchar(8000) | YES |
| 102 | source_system | varchar(8000) | YES |
| 103 | elt_time | varchar(8000) | YES |

#### ldms.SVC_FRM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | frm_no | varchar(8000) | YES |
| 2 | frm_kor_nm | varchar(8000) | YES |
| 3 | frm_eng_nm | varchar(8000) | YES |
| 4 | work_type_cd | varchar(8000) | YES |
| 5 | frm_type_cd | varchar(8000) | YES |
| 6 | frm_grp_type_cd | varchar(8000) | YES |
| 7 | frm_grp_cd | varchar(8000) | YES |
| 8 | group_id | varchar(8000) | YES |
| 9 | local_yn | varchar(8000) | YES |
| 10 | use_stat_cd | varchar(8000) | YES |
| 11 | prefix | varchar(8000) | YES |
| 12 | suffix | varchar(8000) | YES |
| 13 | reg_dt | datetime2 | YES |
| 14 | reg_user_id | varchar(8000) | YES |
| 15 | upd_dt | datetime2 | YES |
| 16 | upd_user_id | varchar(8000) | YES |
| 17 | service_type_cd | varchar(8000) | YES |
| 18 | approve_yn | varchar(8000) | YES |
| 19 | wa_cd | varchar(8000) | YES |
| 20 | source_system | varchar(8000) | YES |
| 21 | elt_time | varchar(8000) | YES |

#### ldms.SVC_FRM_GRP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | frm_type_cd | varchar(8000) | YES |
| 2 | frm_grp_type_cd | varchar(8000) | YES |
| 3 | frm_grp_cd | varchar(8000) | YES |
| 4 | frm_grp_kor_nm | varchar(8000) | YES |
| 5 | frm_grp_eng_nm | varchar(8000) | YES |
| 6 | use_yn | varchar(8000) | YES |
| 7 | reg_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_dt | datetime2 | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | source_system | varchar(8000) | YES |
| 12 | elt_time | varchar(8000) | YES |

#### ldms.SVC_INSU

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | insu_type_cd | varchar(8000) | YES |
| 5 | accident_type_cd | varchar(8000) | YES |
| 6 | harm_vehic_no1 | varchar(8000) | YES |
| 7 | harm_vehic_no2 | varchar(8000) | YES |
| 8 | stat_cd | varchar(8000) | YES |
| 9 | accident_dt | datetime2 | YES |
| 10 | rqst_dt | datetime2 | YES |
| 11 | tot_rqst_amt | decimal(28,0) | YES |
| 12 | tot_rqst_ar_amt | decimal(28,0) | YES |
| 13 | tot_aprov_amt | decimal(28,0) | YES |
| 14 | close_dt | datetime2 | YES |
| 15 | close_user_id | varchar(8000) | YES |
| 16 | close_cancel_yn | varchar(8000) | YES |
| 17 | remark | varchar(8000) | YES |
| 18 | file_path_1 | varchar(8000) | YES |
| 19 | file_nm_1 | varchar(8000) | YES |
| 20 | file_path_2 | varchar(8000) | YES |
| 21 | file_nm_2 | varchar(8000) | YES |
| 22 | file_path_3 | varchar(8000) | YES |
| 23 | file_nm_3 | varchar(8000) | YES |
| 24 | tax_cust_seq | decimal(28,6) | YES |
| 25 | tax_cust_idfy_no | varchar(8000) | YES |
| 26 | reg_dt | datetime2 | YES |
| 27 | reg_user_id | varchar(8000) | YES |
| 28 | upd_dt | datetime2 | YES |
| 29 | upd_user_id | varchar(8000) | YES |
| 30 | close_cancel_dt | datetime2 | YES |
| 31 | source_system | varchar(8000) | YES |
| 32 | elt_time | varchar(8000) | YES |

#### ldms.SVC_INSU_DTL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | comp_seq | decimal(28,0) | YES |
| 5 | insu_type_cd | varchar(8000) | YES |
| 6 | accident_rqst_no | varchar(8000) | YES |
| 7 | compensation_rate | decimal(5,2) | YES |
| 8 | prev_vat_yn | varchar(8000) | YES |
| 9 | prev_vat_amt | decimal(28,0) | YES |
| 10 | prev_vat_stat_cd | varchar(8000) | YES |
| 11 | prev_vat_stat_chng_dt | datetime2 | YES |
| 12 | prev_vat_stat_chng_user_id | varchar(8000) | YES |
| 13 | prev_vat_receipt_key | decimal(28,0) | YES |
| 14 | imt_amt | decimal(28,0) | YES |
| 15 | imt_amt_stat_cd | varchar(8000) | YES |
| 16 | imt_amt_stat_chng_dt | datetime2 | YES |
| 17 | imt_amt_stat_chng_user_id | varchar(8000) | YES |
| 18 | imt_amt_vat_yn | varchar(8000) | YES |
| 19 | imt_amt_receipt_key | decimal(28,0) | YES |
| 20 | imt_amt_ar_key | decimal(28,0) | YES |
| 21 | cust_pay_amt | decimal(28,0) | YES |
| 22 | cust_pay_stat_cd | varchar(8000) | YES |
| 23 | cust_pay_stat_chng_dt | datetime2 | YES |
| 24 | cust_pay_stat_chng_user_id | varchar(8000) | YES |
| 25 | cust_pay_vat_yn | varchar(8000) | YES |
| 26 | cust_pay_receipt_key | decimal(28,0) | YES |
| 27 | cust_pay_ar_key | decimal(28,0) | YES |
| 28 | append_amt | decimal(28,0) | YES |
| 29 | append_amt_stat_cd | varchar(8000) | YES |
| 30 | append_amt_stat_chng_dt | datetime2 | YES |
| 31 | append_amt_stat_chng_user_id | varchar(8000) | YES |
| 32 | append_amt_vat_yn | varchar(8000) | YES |
| 33 | append_amt_ar_key | decimal(28,0) | YES |
| 34 | rqst_amt | decimal(28,0) | YES |
| 35 | rqst_ar_amt | decimal(28,0) | YES |
| 36 | rqst_ar_key | decimal(28,0) | YES |
| 37 | aprov_amt | decimal(28,0) | YES |
| 38 | aprov_date | varchar(8000) | YES |
| 39 | bank_account_cms | varchar(8000) | YES |
| 40 | aprov_amt_ar_key | decimal(28,0) | YES |
| 41 | stat_cd | varchar(8000) | YES |
| 42 | stat_chng_user_id | varchar(8000) | YES |
| 43 | stat_chng_dt | datetime2 | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | reg_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | upd_user_id | varchar(8000) | YES |
| 48 | tax_cust_seq | decimal(28,0) | YES |
| 49 | tax_cust_idfy_no | varchar(8000) | YES |
| 50 | aprov_amt_dms_trx_id | decimal(28,0) | YES |
| 51 | prev_vat_vat_yn | varchar(8000) | YES |
| 52 | append_amt_receipt_key | decimal(28,6) | YES |
| 53 | charge_nm | varchar(8000) | YES |
| 54 | tel_area | varchar(8000) | YES |
| 55 | tel_no | varchar(8000) | YES |
| 56 | hp_area | varchar(8000) | YES |
| 57 | hp_no | varchar(8000) | YES |
| 58 | source_system | varchar(8000) | YES |
| 59 | elt_time | varchar(8000) | YES |

#### ldms.SVC_MONTHLY_SALES_TARGET

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 2 | target_dt | varchar(8000) | YES | 일자 |
| 3 | type3_cd | varchar(8000) | YES | 유형코드 |
| 4 | part_amt | decimal(28,10) | YES | 금액 |
| 5 | labor_amt | decimal(28,10) | YES | 금액 |
| 6 | total_amt | decimal(28,10) | YES | 총 금액 |
| 7 | vehic_cnt | decimal(10,1) | YES | 차량 |
| 8 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 9 | reg_dt | datetime2 | YES | 등록일 |
| 10 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 11 | upd_dt | datetime2 | YES | 수정일 |
| 12 | source_system | varchar(8000) | YES |  |
| 13 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.SVC_PROPO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | repair_type_cd | varchar(8000) | YES |
| 5 | propo_type_cd | varchar(8000) | YES |
| 6 | vin | varchar(8000) | YES |
| 7 | vis | varchar(8000) | YES |
| 8 | vehic_no1 | varchar(8000) | YES |
| 9 | vehic_no2 | varchar(8000) | YES |
| 10 | variant_nm | varchar(8000) | YES |
| 11 | svc_model_cd | varchar(8000) | YES |
| 12 | vehic_base_odometer | int | YES |
| 13 | odometer | int | YES |
| 14 | cust_seq | decimal(28,10) | YES |
| 15 | cust_nm | varchar(8000) | YES |
| 16 | cust_idfy_no | varchar(8000) | YES |
| 17 | cust_rcpt_rel_cd | varchar(8000) | YES |
| 18 | rcpt_cust_nm | varchar(8000) | YES |
| 19 | rcpt_hp_area | varchar(8000) | YES |
| 20 | rcpt_hp_no | varchar(8000) | YES |
| 21 | rcpt_tel_area | varchar(8000) | YES |
| 22 | rcpt_tel_no | varchar(8000) | YES |
| 23 | vip_yn | varchar(8000) | YES |
| 24 | svc_type_cd | varchar(8000) | YES |
| 25 | svc_type_fms_cd | varchar(8000) | YES |
| 26 | resv_dt | varchar(8000) | YES |
| 27 | resv_seq | decimal(28,0) | YES |
| 28 | esti_dt | varchar(8000) | YES |
| 29 | esti_seq | decimal(28,6) | YES |
| 30 | work_close_yn | varchar(8000) | YES |
| 31 | stat_cd | varchar(8000) | YES |
| 32 | stat_chng_dt | datetime2 | YES |
| 33 | stat_chng_user_id | varchar(8000) | YES |
| 34 | work_expt_st_dt | datetime2 | YES |
| 35 | work_expt_end_dt | datetime2 | YES |
| 36 | cust_delivery_yn | varchar(8000) | YES |
| 37 | cust_delivery_expt_dt | datetime2 | YES |
| 38 | cust_delivery_real_dt | datetime2 | YES |
| 39 | old_part_yn | varchar(8000) | YES |
| 40 | cust_loc_cd | varchar(8000) | YES |
| 41 | vehic_loc_cd | varchar(8000) | YES |
| 42 | damage_type_cd | varchar(8000) | YES |
| 43 | stall_no | decimal(28,0) | YES |
| 44 | sms_yn | varchar(8000) | YES |
| 45 | wash_stat_cd | varchar(8000) | YES |
| 46 | cust_rqst | varchar(8000) | YES |
| 47 | sa_sugst | varchar(8000) | YES |
| 48 | techman_sugst | varchar(8000) | YES |
| 49 | part_sugst | varchar(8000) | YES |
| 50 | rcpt_sa_id | varchar(8000) | YES |
| 51 | rcpt_time | decimal(28,6) | YES |
| 52 | propo_issu_time | decimal(28,0) | YES |
| 53 | mng_sa_id | varchar(8000) | YES |
| 54 | mng_foreman_id | varchar(8000) | YES |
| 55 | happycall_target_yn | varchar(8000) | YES |
| 56 | happycall_reject_cd | varchar(8000) | YES |
| 57 | cancel_reason_cd | varchar(8000) | YES |
| 58 | cancel_reason | varchar(8000) | YES |
| 59 | payback_yn | varchar(8000) | YES |
| 60 | base_propo_dt | varchar(8000) | YES |
| 61 | base_propo_seq | decimal(28,6) | YES |
| 62 | prev_shop_cd | varchar(8000) | YES |
| 63 | prev_propo_dt | varchar(8000) | YES |
| 64 | prev_propo_seq | decimal(28,6) | YES |
| 65 | prev_odometer | int | YES |
| 66 | prev_acc_shop_cd | varchar(8000) | YES |
| 67 | prev_acc_propo_dt | varchar(8000) | YES |
| 68 | prev_acc_propo_seq | decimal(28,6) | YES |
| 69 | up_group_id | varchar(8000) | YES |
| 70 | reg_dt | datetime2 | YES |
| 71 | reg_user_id | varchar(8000) | YES |
| 72 | upd_dt | datetime2 | YES |
| 73 | upd_user_id | varchar(8000) | YES |
| 74 | add_proc_sugst | varchar(8000) | YES |
| 75 | add_proc_reg_id | varchar(8000) | YES |
| 76 | add_proc_reg_dt | datetime2 | YES |
| 77 | cust_delivery_zip | varchar(8000) | YES |
| 78 | cust_delivery_addr | varchar(8000) | YES |
| 79 | cust_delivery_addr2 | varchar(8000) | YES |
| 80 | cust_delivery_loc_x | varchar(8000) | YES |
| 81 | cust_delivery_loc_y | varchar(8000) | YES |
| 82 | pdc_yn | varchar(8000) | YES |
| 83 | hbec_yn | varchar(8000) | YES |
| 84 | hbec_seq | decimal(28,6) | YES |
| 85 | nex_svc | varchar(8000) | YES |
| 86 | sc_forward_feedback | varchar(8000) | YES |
| 87 | repeat_repair | varchar(8000) | YES |
| 88 | reflaw_type | varchar(8000) | YES |
| 89 | molit_target_yn | varchar(8000) | YES |
| 90 | em_yn | varchar(8000) | YES |
| 91 | app_rcpt_flag | varchar(8000) | YES |
| 92 | repaet_alarm | varchar(8000) | YES |
| 93 | fin_upload_seq | decimal(28,6) | YES |
| 94 | esti_type | varchar(8000) | YES |
| 95 | end_gb | varchar(8000) | YES |
| 96 | svc_in_sc_id | varchar(8000) | YES |
| 97 | recall_before_sale_yn | varchar(8000) | YES |
| 98 | bp_deli_site | varchar(8000) | YES |
| 99 | bp_insu_comp | bigint | YES |
| 100 | free_service_sugst | varchar(8000) | YES |
| 101 | cust_repair_req | varchar(8000) | YES |
| 102 | app_save_flag | varchar(8000) | YES |
| 103 | valuable_yn | varchar(8000) | YES |
| 104 | dms_first_save_flag | varchar(8000) | YES |
| 105 | propo_talk_send_time | varchar(8000) | YES |
| 106 | propo_talk_send_user_id | varchar(8000) | YES |
| 107 | propo_talk_mseq | bigint | YES |
| 108 | calc_talk_send_time | varchar(8000) | YES |
| 109 | calc_talk_send_user_id | varchar(8000) | YES |
| 110 | calc_talk_mseq | bigint | YES |
| 111 | sign_yn | varchar(8000) | YES |
| 112 | agora_use_dt | datetime2 | YES |
| 113 | proc_start_sms_yn | varchar(8000) | YES |
| 114 | proc_start_sms_dt | datetime2 | YES |
| 115 | sa_qc_sms_yn | varchar(8000) | YES |
| 116 | sa_qc_sms_dt | datetime2 | YES |
| 117 | source_system | varchar(8000) | YES |
| 118 | elt_time | varchar(8000) | YES |

#### ldms.SVC_PROPO_BPKPI

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,10) | YES |
| 4 | shop_in_dt | datetime2 | YES |
| 5 | repair_start_dt | datetime2 | YES |
| 6 | repair_finsh_dt | datetime2 | YES |
| 7 | delivery_expt_dt | datetime2 | YES |
| 8 | delivery_real_dt | datetime2 | YES |
| 9 | ru10 | varchar(8000) | YES |
| 10 | ru11 | varchar(8000) | YES |
| 11 | ru12 | varchar(8000) | YES |
| 12 | ru13 | varchar(8000) | YES |
| 13 | ru14 | varchar(8000) | YES |
| 14 | ru15 | varchar(8000) | YES |
| 15 | ru16 | varchar(8000) | YES |
| 16 | ru17 | varchar(8000) | YES |
| 17 | ru18 | varchar(8000) | YES |
| 18 | ru19 | varchar(8000) | YES |
| 19 | ru20 | varchar(8000) | YES |
| 20 | ru21 | varchar(8000) | YES |
| 21 | ru22 | varchar(8000) | YES |
| 22 | ru23 | varchar(8000) | YES |
| 23 | ru24 | varchar(8000) | YES |
| 24 | ru25 | varchar(8000) | YES |
| 25 | ru26 | varchar(8000) | YES |
| 26 | ru27 | varchar(8000) | YES |
| 27 | ru28 | varchar(8000) | YES |
| 28 | ru29 | varchar(8000) | YES |
| 29 | ru30 | varchar(8000) | YES |
| 30 | ru31 | varchar(8000) | YES |
| 31 | ru32 | varchar(8000) | YES |
| 32 | ru33 | varchar(8000) | YES |
| 33 | ru34 | varchar(8000) | YES |
| 34 | ru35 | varchar(8000) | YES |
| 35 | ru36 | varchar(8000) | YES |
| 36 | oj10 | varchar(8000) | YES |
| 37 | oj11 | varchar(8000) | YES |
| 38 | oj12 | varchar(8000) | YES |
| 39 | qc10 | int | YES |
| 40 | qc11 | int | YES |
| 41 | qc12 | int | YES |
| 42 | qc13 | int | YES |
| 43 | qc14 | int | YES |
| 44 | qc15 | int | YES |
| 45 | qc16 | int | YES |
| 46 | qc17 | int | YES |
| 47 | reg_dt | datetime2 | YES |
| 48 | reg_user_id | varchar(8000) | YES |
| 49 | upd_dt | datetime2 | YES |
| 50 | upd_user_id | varchar(8000) | YES |
| 51 | proc_line | varchar(8000) | YES |
| 52 | bi_code | varchar(8000) | YES |
| 53 | bp_line_cd | decimal(28,10) | YES |
| 54 | source_system | varchar(8000) | YES |
| 55 | elt_time | varchar(8000) | YES |

#### ldms.SVC_PROPO_LABOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | frm_no | varchar(8000) | YES |
| 5 | seq | decimal(28,0) | YES |
| 6 | ro_type_cd | varchar(8000) | YES |
| 7 | settle_type_cd | varchar(8000) | YES |
| 8 | propo_stat_cd | varchar(8000) | YES |
| 9 | qty | int | YES |
| 10 | mh | decimal(15,7) | YES |
| 11 | frm_nm | varchar(8000) | YES |
| 12 | sale_unit_price | decimal(28,0) | YES |
| 13 | sale_amt | decimal(28,0) | YES |
| 14 | dc_amt | decimal(28,0) | YES |
| 15 | grp_no | decimal(28,0) | YES |
| 16 | disp_rank | decimal(28,0) | YES |
| 17 | cnfm_unit_price | decimal(28,0) | YES |
| 18 | cnfm_amt | decimal(28,0) | YES |
| 19 | sublet_yn | varchar(8000) | YES |
| 20 | sublet_comp_seq | decimal(28,0) | YES |
| 21 | sublet_purc_amt | decimal(28,0) | YES |
| 22 | cr_no | varchar(8000) | YES |
| 23 | fms_item_cd | varchar(8000) | YES |
| 24 | twc_no | varchar(8000) | YES |
| 25 | svc_campg_no | decimal(28,6) | YES |
| 26 | svc_hist_disp_yn | varchar(8000) | YES |
| 27 | reg_dt | datetime2 | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | datetime2 | YES |
| 30 | upd_user_id | varchar(8000) | YES |
| 31 | cr_case_no | int | YES |
| 32 | add_yn | varchar(8000) | YES |
| 33 | pkg_yn | varchar(8000) | YES |
| 34 | psp_amt | decimal(28,6) | YES |
| 35 | psp_code | varchar(8000) | YES |
| 36 | psp_unit_price | decimal(28,6) | YES |
| 37 | pm_code | varchar(8000) | YES |
| 38 | pm_seq | decimal(28,6) | YES |
| 39 | auda_yn | varchar(8000) | YES |
| 40 | source_system | varchar(8000) | YES |
| 41 | elt_time | varchar(8000) | YES |

#### ldms.SVC_PROPO_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(8000) | YES | 일자 |
| 3 | propo_seq | decimal(28,0) | YES | 순번 |
| 4 | part_no | varchar(8000) | YES | 부품번호 |
| 5 | seq | decimal(28,0) | YES | 순번 |
| 6 | ro_type_cd | varchar(8000) | YES | 유형코드 |
| 7 | settle_type_cd | varchar(8000) | YES | 유형코드 |
| 8 | propo_stat_cd | varchar(8000) | YES | 상태코드 |
| 9 | stat_cd | varchar(8000) | YES | 상태코드 |
| 10 | stat_chng_dt | datetime2 | YES | 일자 |
| 11 | rqst_issu_qty | int | YES | 수량 |
| 12 | real_issu_qty | int | YES | 수량 |
| 13 | sale_unit_price | decimal(28,0) | YES | 가격 |
| 14 | sale_amt | decimal(28,0) | YES | 금액 |
| 15 | dc_amt | decimal(28,0) | YES | 금액 |
| 16 | cnfm_unit_price | decimal(28,0) | YES | 가격 |
| 17 | cnfm_amt | decimal(28,0) | YES | 금액 |
| 18 | grp_no | decimal(28,0) | YES | 번호 |
| 19 | disp_rank | decimal(28,0) | YES |  |
| 20 | cr_no | varchar(8000) | YES | 번호 |
| 21 | fms_item_cd | varchar(8000) | YES | 코드 |
| 22 | svc_campg_no | decimal(28,6) | YES | 번호 |
| 23 | twc_no | varchar(8000) | YES | 번호 |
| 24 | order_no | varchar(8000) | YES | 주문번호 |
| 25 | order_line_no | decimal(28,6) | YES | 주문번호 |
| 26 | sout_no | varchar(8000) | YES | 번호 |
| 27 | sout_line_no | decimal(28,0) | YES | 번호 |
| 28 | cancel_yn | varchar(8000) | YES | 취소 |
| 29 | income_qty | int | YES | 수량 |
| 30 | order_qty | int | YES | 수량 |
| 31 | income_resv_qty | int | YES | 수량 |
| 32 | resv_clear_qty | int | YES | 수량 |
| 33 | resv_real_qty | int | YES | 수량 |
| 34 | rqst_remove_qty | int | YES | 수량 |
| 35 | resv_dt | varchar(8000) | YES | 일자 |
| 36 | resv_seq | decimal(28,0) | YES | 순번 |
| 37 | remove_yn | varchar(8000) | YES | 여부(Y/N) |
| 38 | reject_cd | varchar(8000) | YES | 코드 |
| 39 | svc_hist_disp_yn | varchar(8000) | YES | 여부(Y/N) |
| 40 | reg_dt | datetime2 | YES | 등록일 |
| 41 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 42 | upd_dt | datetime2 | YES | 수정일 |
| 43 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | rcit_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 45 | cr_case_no | int | YES | 번호 |
| 46 | add_yn | varchar(8000) | YES | 여부(Y/N) |
| 47 | pkg_yn | varchar(8000) | YES | 여부(Y/N) |
| 48 | psp_amt | decimal(28,6) | YES | 금액 |
| 49 | psp_code | varchar(8000) | YES | 코드 |
| 50 | psp_unit_price | decimal(28,6) | YES | 가격 |
| 51 | pm_code | varchar(8000) | YES | 코드 |
| 52 | pm_seq | decimal(28,6) | YES | 순번 |
| 53 | auda_yn | varchar(8000) | YES | 여부(Y/N) |
| 54 | battidennum | varchar(8000) | YES |  |
| 55 | source_system | varchar(8000) | YES |  |
| 56 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.SVC_RESV

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | resv_dt | varchar(8000) | YES |
| 3 | resv_seq | decimal(28,0) | YES |
| 4 | real_resv_date | varchar(8000) | YES |
| 5 | real_resv_st_hm | varchar(8000) | YES |
| 6 | real_resv_end_hm | varchar(8000) | YES |
| 7 | in_expt_dt | datetime2 | YES |
| 8 | out_expt_dt | datetime2 | YES |
| 9 | cust_seq | decimal(28,0) | YES |
| 10 | cust_nm | varchar(8000) | YES |
| 11 | cust_resv_rel_cd | varchar(8000) | YES |
| 12 | resv_cust_nm | varchar(8000) | YES |
| 13 | resv_hp_area | varchar(8000) | YES |
| 14 | resv_hp_no | varchar(8000) | YES |
| 15 | resv_tel_area | varchar(8000) | YES |
| 16 | resv_tel_no | varchar(8000) | YES |
| 17 | resv_cust_sms_yn | varchar(8000) | YES |
| 18 | vehic_exist_yn | varchar(8000) | YES |
| 19 | vehic_no1 | varchar(8000) | YES |
| 20 | vehic_no2 | varchar(8000) | YES |
| 21 | vin | varchar(8000) | YES |
| 22 | variant_nm | varchar(8000) | YES |
| 23 | svc_model_cd | varchar(8000) | YES |
| 24 | model_year | varchar(8000) | YES |
| 25 | svc_type_cd | varchar(8000) | YES |
| 26 | svc_type_fms_cd | varchar(8000) | YES |
| 27 | resv_way_cd | varchar(8000) | YES |
| 28 | resv_way_dtl | varchar(8000) | YES |
| 29 | resv_stall_no | decimal(28,0) | YES |
| 30 | cust_rqst | varchar(8000) | YES |
| 31 | sa_sugst | varchar(8000) | YES |
| 32 | stat_cd | varchar(8000) | YES |
| 33 | stat_chng_user_id | varchar(8000) | YES |
| 34 | stat_chng_dt | datetime2 | YES |
| 35 | cancel_reason_cd | varchar(8000) | YES |
| 36 | cancel_reason | varchar(8000) | YES |
| 37 | prev_amt | decimal(28,0) | YES |
| 38 | prev_amt_recv_cust_nm | varchar(8000) | YES |
| 39 | prev_amt_recv_way_cd | varchar(8000) | YES |
| 40 | prev_amt_stat_cd | varchar(8000) | YES |
| 41 | prev_amt_stat_chng_dt | datetime2 | YES |
| 42 | prev_amt_receipt_key | decimal(28,6) | YES |
| 43 | vip_yn | varchar(8000) | YES |
| 44 | cnfm_yn | varchar(8000) | YES |
| 45 | wash_yn | varchar(8000) | YES |
| 46 | remind_exec_cnt | decimal(28,0) | YES |
| 47 | mng_sa_id | varchar(8000) | YES |
| 48 | mng_foreman_id | varchar(8000) | YES |
| 49 | mng_sc_id_name | varchar(8000) | YES |
| 50 | propo_dt | varchar(8000) | YES |
| 51 | propo_seq | decimal(28,6) | YES |
| 52 | reg_dt | datetime2 | YES |
| 53 | reg_user_id | varchar(8000) | YES |
| 54 | upd_dt | datetime2 | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_loc_cd | varchar(8000) | YES |
| 57 | variant_cd | varchar(8000) | YES |
| 58 | order_dt | varchar(8000) | YES |
| 59 | order_no | varchar(8000) | YES |
| 60 | paid_prev_amt | decimal(28,0) | YES |
| 61 | used_prev_amt | decimal(28,0) | YES |
| 62 | prev_amt_remarks | varchar(8000) | YES |
| 63 | prev_amt_close_dt | varchar(8000) | YES |
| 64 | prev_amt_close_user_id | varchar(8000) | YES |
| 65 | em_yn | varchar(8000) | YES |
| 66 | resv_ildp_seq | decimal(28,6) | YES |
| 67 | esti_type | varchar(8000) | YES |
| 68 | repeat_repair | varchar(8000) | YES |
| 69 | repaet_alarm | varchar(8000) | YES |
| 70 | cust_repair_req | varchar(8000) | YES |
| 71 | entry_talk_send_time | varchar(8000) | YES |
| 72 | entry_talk_mseq | bigint | YES |
| 73 | cust_repair_req_text | varchar(8000) | YES |
| 74 | remind_call_yn | varchar(8000) | YES |
| 75 | source_system | varchar(8000) | YES |
| 76 | elt_time | varchar(8000) | YES |

#### ldms.SVC_SERVICE_KPI_ELEMENT_DEALER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | up_group_id | varchar(8000) | YES | 식별자(ID) |
| 2 | yyyy_mm | varchar(8000) | YES |  |
| 3 | gr_sa_lv1 | decimal(28,10) | YES |  |
| 4 | gr_sa_lv2 | decimal(28,10) | YES |  |
| 5 | gr_sa_non_certi | decimal(28,10) | YES |  |
| 6 | gr_tech_toyota | decimal(28,10) | YES |  |
| 7 | gr_tech_pro | decimal(28,10) | YES |  |
| 8 | gr_tech_dia | decimal(28,10) | YES |  |
| 9 | gr_tech_dia_master | decimal(28,10) | YES |  |
| 10 | gr_tech_non_certi | decimal(28,10) | YES |  |
| 11 | bp_sa | decimal(28,10) | YES |  |
| 12 | bp_tech_body | decimal(28,10) | YES |  |
| 13 | bp_tech_paint | decimal(28,10) | YES |  |
| 14 | as_other | decimal(28,10) | YES |  |
| 15 | cbp_num_cp | decimal(28,10) | YES |  |
| 16 | cbp_num_wt | decimal(28,10) | YES |  |
| 17 | cbp_num_in | decimal(28,10) | YES |  |
| 18 | cbp_amt_cp | decimal(28,10) | YES |  |
| 19 | cbp_amt_wt | decimal(28,10) | YES |  |
| 20 | cbp_amt_in | decimal(28,10) | YES |  |
| 21 | other_amt_parts_sale | decimal(28,10) | YES | 판매 |
| 22 | other_num_rr | decimal(28,10) | YES |  |
| 23 | other_hour_gr_tech | decimal(28,10) | YES |  |
| 24 | other_hour_bp_tech | decimal(28,10) | YES |  |
| 25 | other_salary_gr_tech | decimal(28,10) | YES |  |
| 26 | other_salary_bp_tech | decimal(28,10) | YES |  |
| 27 | other_num_target_call | decimal(28,10) | YES |  |
| 28 | other_num_tried_call | decimal(28,10) | YES |  |
| 29 | other_num_contac_call | decimal(28,10) | YES |  |
| 30 | other_appoint_rate | decimal(28,10) | YES |  |
| 31 | other_no_show_rate | decimal(28,10) | YES |  |
| 32 | body_toyota_technician | decimal(28,10) | YES |  |
| 33 | body_pro_technician | decimal(28,10) | YES |  |
| 34 | body_master_technician | decimal(28,10) | YES |  |
| 35 | body_non_certified | decimal(28,10) | YES |  |
| 36 | paint_toyota_technician | decimal(28,10) | YES |  |
| 37 | paint_pro_technician | decimal(28,10) | YES |  |
| 38 | paint_master_technician | decimal(28,10) | YES |  |
| 39 | paint_non_certified | decimal(28,10) | YES |  |
| 40 | gr_sa_total | decimal(28,10) | YES |  |
| 41 | gr_sa_toyota | decimal(28,10) | YES |  |
| 42 | gr_sa_pro | decimal(28,10) | YES |  |
| 43 | gr_sa_master | decimal(28,10) | YES |  |
| 44 | gr_tech_total | decimal(28,10) | YES |  |
| 45 | bp_sa_total | decimal(28,10) | YES |  |
| 46 | bp_sa_toyota | decimal(28,10) | YES |  |
| 47 | bp_sa_pro | decimal(28,10) | YES |  |
| 48 | bp_sa_master | decimal(28,10) | YES |  |
| 49 | bp_sa_non_certi | decimal(28,10) | YES |  |
| 50 | stall_gs | decimal(28,10) | YES |  |
| 51 | stall_bp | decimal(28,10) | YES |  |
| 52 | stall_gs_tot | decimal(28,0) | YES |  |
| 53 | stall_bp_tot | decimal(28,0) | YES |  |
| 54 | source_system | varchar(8000) | YES |  |
| 55 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.SVC_SETTLE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | ro_type_cd | varchar(8000) | YES |
| 5 | settle_dt | datetime2 | YES |
| 6 | settle_user_id | varchar(8000) | YES |
| 7 | sale_labor_amt | decimal(28,0) | YES |
| 8 | sale_part_amt | decimal(28,0) | YES |
| 9 | sale_sublet_amt | decimal(28,0) | YES |
| 10 | dc_labor_amt | decimal(28,0) | YES |
| 11 | dc_part_amt | decimal(28,0) | YES |
| 12 | dc_sublet_amt | decimal(28,0) | YES |
| 13 | cnfm_labor_amt | decimal(28,0) | YES |
| 14 | cnfm_part_amt | decimal(28,0) | YES |
| 15 | cnfm_sublet_amt | decimal(28,0) | YES |
| 16 | vat_yn | varchar(8000) | YES |
| 17 | vat | decimal(28,0) | YES |
| 18 | cnfm_tot_amt | decimal(28,0) | YES |
| 19 | fms_type | varchar(8000) | YES |
| 20 | dc_seq | decimal(28,0) | YES |
| 21 | stat_cd | varchar(8000) | YES |
| 22 | stat_chng_dt | datetime2 | YES |
| 23 | stat_chng_user_id | varchar(8000) | YES |
| 24 | receipt_date | varchar(8000) | YES |
| 25 | receipt_user_id | varchar(8000) | YES |
| 26 | ar_cancel_yn | varchar(8000) | YES |
| 27 | ar_cancel_dt | datetime2 | YES |
| 28 | receipt_key | decimal(28,6) | YES |
| 29 | ar_key | decimal(28,6) | YES |
| 30 | reg_dt | datetime2 | YES |
| 31 | reg_user_id | varchar(8000) | YES |
| 32 | upd_dt | datetime2 | YES |
| 33 | upd_user_id | varchar(8000) | YES |
| 34 | dc_reason | varchar(8000) | YES |
| 35 | addservice_yn | varchar(8000) | YES |
| 36 | psp_labor_amt | decimal(28,0) | YES |
| 37 | psp_part_amt | decimal(28,0) | YES |
| 38 | psp_sublet_amt | decimal(28,0) | YES |
| 39 | psp_vat | decimal(28,0) | YES |
| 40 | psp_tot_amt | decimal(28,0) | YES |
| 41 | source_system | varchar(8000) | YES |
| 42 | elt_time | varchar(8000) | YES |

#### ldms.SVC_STALL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | stall_no | decimal(28,10) | YES |
| 2 | shop_cd | varchar(8000) | YES |
| 3 | stall_nm | varchar(8000) | YES |
| 4 | repair_type_cd | varchar(8000) | YES |
| 5 | stall_type_cd | varchar(8000) | YES |
| 6 | sa_id | varchar(8000) | YES |
| 7 | foreman_id | varchar(8000) | YES |
| 8 | use_yn | varchar(8000) | YES |
| 9 | resv_yn | varchar(8000) | YES |
| 10 | disp_rank | decimal(28,10) | YES |
| 11 | remark | varchar(8000) | YES |
| 12 | reg_dt | datetime2 | YES |
| 13 | reg_user_id | varchar(8000) | YES |
| 14 | upd_dt | datetime2 | YES |
| 15 | upd_user_id | varchar(8000) | YES |
| 16 | sc_resv_yn | varchar(8000) | YES |
| 17 | kpi_yn | varchar(8000) | YES |
| 18 | virtual_yn | varchar(8000) | YES |
| 19 | lpm_resv_yn | varchar(8000) | YES |
| 20 | aicc_resv_yn | varchar(8000) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### ldms.SVC_STALL_WORKTIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | stall_no | decimal(28,6) | YES |
| 2 | shop_cd | varchar(8000) | YES |
| 3 | work_date | varchar(8000) | YES |
| 4 | work_st_hm | varchar(8000) | YES |
| 5 | work_end_hm | varchar(8000) | YES |
| 6 | oper_yn | varchar(8000) | YES |
| 7 | remark | varchar(8000) | YES |
| 8 | reg_dt | datetime2 | YES |
| 9 | reg_user_id | varchar(8000) | YES |
| 10 | upd_dt | datetime2 | YES |
| 11 | upd_user_id | varchar(8000) | YES |
| 12 | source_system | varchar(8000) | YES |
| 13 | elt_time | varchar(8000) | YES |

#### ldms.SVC_TMKR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | twc_no | varchar(8000) | YES |
| 3 | rqst_cnt | int | YES |
| 4 | propo_dt | varchar(8000) | YES |
| 5 | propo_seq | decimal(28,6) | YES |
| 6 | grp_no | decimal(28,6) | YES |
| 7 | settle_type_cd | varchar(8000) | YES |
| 8 | warranty_type_cd | varchar(8000) | YES |
| 9 | operation_type_cd | varchar(8000) | YES |
| 10 | data_id | varchar(8000) | YES |
| 11 | f_vehic_flag | varchar(8000) | YES |
| 12 | fr_cd | varchar(8000) | YES |
| 13 | wmi | varchar(8000) | YES |
| 14 | vds | varchar(8000) | YES |
| 15 | vcd | varchar(8000) | YES |
| 16 | vis | varchar(8000) | YES |
| 17 | delivery_date | varchar(8000) | YES |
| 18 | repair_date | varchar(8000) | YES |
| 19 | repair_end_date | varchar(8000) | YES |
| 20 | odometer | int | YES |
| 21 | main_frm_no | varchar(8000) | YES |
| 22 | local_cause_part_flag | varchar(8000) | YES |
| 23 | cause_part_no | varchar(8000) | YES |
| 24 | apply_charge_amt | decimal(28,6) | YES |
| 25 | pwr | decimal(5,2) | YES |
| 26 | lwr | decimal(5,2) | YES |
| 27 | tot_labor_mh | decimal(4,1) | YES |
| 28 | tot_labor_amt | decimal(28,6) | YES |
| 29 | tot_part_amt | decimal(28,6) | YES |
| 30 | tot_sublet_amt | decimal(28,6) | YES |
| 31 | t1_cd | varchar(8000) | YES |
| 32 | t2_type_cd | varchar(8000) | YES |
| 33 | t2_cd | varchar(8000) | YES |
| 34 | t3_cd_1 | varchar(8000) | YES |
| 35 | t3_cd_2 | varchar(8000) | YES |
| 36 | t3_cd_3 | varchar(8000) | YES |
| 37 | t3_cd_4 | varchar(8000) | YES |
| 38 | t3_cd_5 | varchar(8000) | YES |
| 39 | t3_cd_6 | varchar(8000) | YES |
| 40 | t3_cd_7 | varchar(8000) | YES |
| 41 | sublet_expl | varchar(8000) | YES |
| 42 | sublet_expl_2 | varchar(8000) | YES |
| 43 | condition | varchar(8000) | YES |
| 44 | cause | varchar(8000) | YES |
| 45 | remedy | varchar(8000) | YES |
| 46 | tsb_no | varchar(8000) | YES |
| 47 | prev_shop_cd | varchar(8000) | YES |
| 48 | prev_propo_dt | varchar(8000) | YES |
| 49 | prev_propo_seq | decimal(28,6) | YES |
| 50 | prev_odometer | int | YES |
| 51 | prev_repair_date | varchar(8000) | YES |
| 52 | cr_no | varchar(8000) | YES |
| 53 | stat_cd | varchar(8000) | YES |
| 54 | stat_chng_user_id | varchar(8000) | YES |
| 55 | stat_chng_dt | datetime2 | YES |
| 56 | write_dt | datetime2 | YES |
| 57 | rqst_invoice_no | varchar(8000) | YES |
| 58 | rqst_dt | datetime2 | YES |
| 59 | rqst_lvl | varchar(8000) | YES |
| 60 | sys_judge_dt | datetime2 | YES |
| 61 | sys_judge_cd | varchar(8000) | YES |
| 62 | tmkr_judge_dt | datetime2 | YES |
| 63 | tmkr_judge_cd | varchar(8000) | YES |
| 64 | aprov_labor_amt | decimal(28,6) | YES |
| 65 | aprov_part_amt | decimal(28,6) | YES |
| 66 | aprov_sublet_amt | decimal(28,6) | YES |
| 67 | aprov_tot_amt | decimal(28,6) | YES |
| 68 | twc_remark | varchar(8000) | YES |
| 69 | tmkr_remark | varchar(8000) | YES |
| 70 | twc_review_yn | varchar(8000) | YES |
| 71 | sout_no | varchar(8000) | YES |
| 72 | prev_inv | varchar(8000) | YES |
| 73 | prev_sale_dt | varchar(8000) | YES |
| 74 | curr_inv | varchar(8000) | YES |
| 75 | curr_sale_dt | varchar(8000) | YES |
| 76 | prev_sout_no | varchar(8000) | YES |
| 77 | cr_case_no | int | YES |
| 78 | battery_claim_cnt | decimal(28,6) | YES |
| 79 | evidence_flag | varchar(8000) | YES |
| 80 | bat_test_cd_1 | varchar(8000) | YES |
| 81 | bat_test_cd_2 | varchar(8000) | YES |
| 82 | bat_test_cd_3 | varchar(8000) | YES |
| 83 | bat_test_cd_4 | varchar(8000) | YES |
| 84 | diag_cd_1 | varchar(8000) | YES |
| 85 | diag_cd_2 | varchar(8000) | YES |
| 86 | diag_cd_3 | varchar(8000) | YES |
| 87 | diag_cd_4 | varchar(8000) | YES |
| 88 | diag_cd_5 | varchar(8000) | YES |
| 89 | serial_cd_1 | varchar(8000) | YES |
| 90 | serial_cd_2 | varchar(8000) | YES |
| 91 | serial_cd_3 | varchar(8000) | YES |
| 92 | reg_dt | datetime2 | YES |
| 93 | reg_user_id | varchar(8000) | YES |
| 94 | upd_dt | datetime2 | YES |
| 95 | upd_user_id | varchar(8000) | YES |
| 96 | source_system | varchar(8000) | YES |
| 97 | elt_time | varchar(8000) | YES |

#### ldms.SVC_TMKR_TWC_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 2 | twc_no | varchar(8000) | YES | 번호 |
| 3 | rqst_cnt | int | YES |  |
| 4 | part_no | varchar(8000) | YES | 부품번호 |
| 5 | seq | int | YES | 순번 |
| 6 | local_part_flag | varchar(8000) | YES | 부품 |
| 7 | qty | int | YES | 수량 |
| 8 | unit_price | decimal(28,10) | YES | 가격 |
| 9 | amt | decimal(28,10) | YES | 금액 |
| 10 | reg_dt | datetime2 | YES | 등록일 |
| 11 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 12 | upd_dt | datetime2 | YES | 수정일 |
| 13 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 14 | old_part_no | varchar(8000) | YES | 부품번호 |
| 15 | source_system | varchar(8000) | YES |  |
| 16 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.TACC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | startdt | datetime2 | YES |
| 3 | enddt | datetime2 | YES |
| 4 | korname | varchar(8000) | YES |
| 5 | engname | varchar(8000) | YES |
| 6 | chname | varchar(8000) | YES |
| 7 | accdivcd | varchar(8000) | YES |
| 8 | accpartcd | varchar(8000) | YES |
| 9 | acccdonelvl | varchar(8000) | YES |
| 10 | acccdtwolvl | varchar(8000) | YES |
| 11 | acccdthreelvl | varchar(8000) | YES |
| 12 | acccdfourlvl | varchar(8000) | YES |
| 13 | slipoccuryn | varchar(8000) | YES |
| 14 | cal | varchar(8000) | YES |
| 15 | orderptn | int | YES |
| 16 | comments | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### ldms.TACC_DEALER_ORDER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | reporttype | varchar(8000) | YES |  |
| 2 | dealer | varchar(8000) | YES | 딜러 |
| 3 | reportyn | varchar(8000) | YES |  |
| 4 | orderreport | int | YES | 주문 |
| 5 | comments | varchar(8000) | YES |  |
| 6 | source_system | varchar(8000) | YES |  |
| 7 | elt_time | varchar(8000) | YES | 시각 |

#### ldms.TACC_ITEM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | itemcd | varchar(8000) | YES |
| 3 | itemname | varchar(8000) | YES |
| 4 | sum_type | varchar(8000) | YES |
| 5 | org_type | varchar(8000) | YES |
| 6 | sign_cd | varchar(8000) | YES |
| 7 | use_yn | varchar(8000) | YES |
| 8 | reg_dt | datetime2 | YES |
| 9 | reg_user_id | varchar(8000) | YES |
| 10 | upd_dt | datetime2 | YES |
| 11 | upd_user_id | varchar(8000) | YES |
| 12 | disable_yn | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### ldms.TACC_MBS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | chaamt | bigint | YES |
| 6 | daeamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | created_by | varchar(8000) | YES |
| 9 | created_dt | datetime2 | YES |
| 10 | edited_by | varchar(8000) | YES |
| 11 | edited_dt | datetime2 | YES |
| 12 | close_yn | varchar(8000) | YES |
| 13 | remark | varchar(8000) | YES |
| 14 | source_system | varchar(8000) | YES |
| 15 | elt_time | varchar(8000) | YES |

#### ldms.TACC_MIS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | variantcd | varchar(8000) | YES |
| 5 | saleqty | int | YES |
| 6 | saleamt | bigint | YES |
| 7 | operexpamt | bigint | YES |
| 8 | invenqty | int | YES |
| 9 | invenamt | bigint | YES |
| 10 | avgsaleamt | bigint | YES |
| 11 | avgoperexpamt | bigint | YES |
| 12 | incomeamt | bigint | YES |
| 13 | avgincomeamt | bigint | YES |
| 14 | perincome | decimal(5,2) | YES |
| 15 | yymm | varchar(8000) | YES |
| 16 | brandcd | varchar(8000) | YES |
| 17 | model | varchar(8000) | YES |
| 18 | my_cd | varchar(8000) | YES |
| 19 | sfx_cd | varchar(8000) | YES |
| 20 | seq | decimal(28,10) | YES |
| 21 | created_by | varchar(8000) | YES |
| 22 | created_dt | datetime2 | YES |
| 23 | edited_by | varchar(8000) | YES |
| 24 | edited_dt | datetime2 | YES |
| 25 | close_yn | varchar(8000) | YES |
| 26 | source_system | varchar(8000) | YES |
| 27 | elt_time | varchar(8000) | YES |

#### ldms.TACC_MTS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | itemcd | varchar(8000) | YES |
| 6 | itemamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | created_by | varchar(8000) | YES |
| 9 | created_dt | datetime2 | YES |
| 10 | edited_by | varchar(8000) | YES |
| 11 | edited_dt | datetime2 | YES |
| 12 | close_yn | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### ldms.TACC_PERSON

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | sales | int | YES |
| 5 | service | int | YES |
| 6 | admin | int | YES |
| 7 | other | int | YES |
| 8 | total | int | YES |
| 9 | yymm | varchar(8000) | YES |
| 10 | salescons | int | YES |
| 11 | topmanage | int | YES |
| 12 | created_by | varchar(8000) | YES |
| 13 | created_dt | datetime2 | YES |
| 14 | edited_by | varchar(8000) | YES |
| 15 | edited_dt | datetime2 | YES |
| 16 | close_yn | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### ldms.TACC_REF

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | assacccd | varchar(8000) | YES |
| 2 | currassacccd | varchar(8000) | YES |
| 3 | quiassacccd | varchar(8000) | YES |
| 4 | invenassacccd | varchar(8000) | YES |
| 5 | ncurrassacccd | varchar(8000) | YES |
| 6 | invesassacccd | varchar(8000) | YES |
| 7 | tangassacccd | varchar(8000) | YES |
| 8 | intangassacccd | varchar(8000) | YES |
| 9 | liaacccd | varchar(8000) | YES |
| 10 | curliaacccd | varchar(8000) | YES |
| 11 | longliaacccd | varchar(8000) | YES |
| 12 | stockacccd | varchar(8000) | YES |
| 13 | saleunitacccd | varchar(8000) | YES |
| 14 | salesacccd | varchar(8000) | YES |
| 15 | feeacccd | varchar(8000) | YES |
| 16 | noperacccd | varchar(8000) | YES |
| 17 | expacccd | varchar(8000) | YES |
| 18 | cosacccd | varchar(8000) | YES |
| 19 | saleexpacccd | varchar(8000) | YES |
| 20 | admacccd | varchar(8000) | YES |
| 21 | noperexpacccd | varchar(8000) | YES |
| 22 | extrgainacccd | varchar(8000) | YES |
| 23 | extrlossacccd | varchar(8000) | YES |
| 24 | noperotherincome | varchar(8000) | YES |
| 25 | noperotherincome1 | varchar(8000) | YES |
| 26 | noperothercost | varchar(8000) | YES |
| 27 | newvecacccd | varchar(8000) | YES |
| 28 | costnewvecacccd | varchar(8000) | YES |
| 29 | newvecinvenacccd | varchar(8000) | YES |
| 30 | svcsaleacccd | varchar(8000) | YES |
| 31 | svcexpacccd | varchar(8000) | YES |
| 32 | usedvecacccd | varchar(8000) | YES |
| 33 | costusedvecacccd | varchar(8000) | YES |
| 34 | cashacccd | varchar(8000) | YES |
| 35 | cashequacccd | varchar(8000) | YES |
| 36 | shorttermfinacccd | varchar(8000) | YES |
| 37 | allowdouacccd | varchar(8000) | YES |
| 38 | tradepayacccd | varchar(8000) | YES |
| 39 | traderecacccd | varchar(8000) | YES |
| 40 | longtermboracccd | varchar(8000) | YES |
| 41 | shorttermboracccd | varchar(8000) | YES |
| 42 | capitalstockacccd | varchar(8000) | YES |
| 43 | invennewassacccd | varchar(8000) | YES |
| 44 | interestexpacccd | varchar(8000) | YES |
| 45 | depreexpacccd | varchar(8000) | YES |
| 46 | amortexpacccd | varchar(8000) | YES |
| 47 | sellingexpacccd | varchar(8000) | YES |
| 48 | salepromexpacccd | varchar(8000) | YES |
| 49 | advertisingexpacccd | varchar(8000) | YES |
| 50 | capitalsurpacccd | varchar(8000) | YES |
| 51 | retainedearacccd | varchar(8000) | YES |
| 52 | capitaladjustacccd | varchar(8000) | YES |
| 53 | partsacceacccd | varchar(8000) | YES |
| 54 | otherinvenacccd | varchar(8000) | YES |
| 55 | salaryacccd | varchar(8000) | YES |
| 56 | bonusacccd | varchar(8000) | YES |
| 57 | servbenacccd | varchar(8000) | YES |
| 58 | legalbenacccd | varchar(8000) | YES |
| 59 | employeebenacccd | varchar(8000) | YES |
| 60 | rentalexpacccd | varchar(8000) | YES |
| 61 | supplexpacccd | varchar(8000) | YES |
| 62 | servicefeeacccd | varchar(8000) | YES |
| 63 | acc_income_tax | varchar(8000) | YES |
| 64 | source_system | varchar(8000) | YES |
| 65 | elt_time | varchar(8000) | YES |

#### ldms.TACC_REF2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | svcsaleacccd | varchar(8000) | YES |
| 2 | svcexpacccd | varchar(8000) | YES |
| 3 | saleexpacccd | varchar(8000) | YES |
| 4 | admexpacccd | varchar(8000) | YES |
| 5 | usecarsaleacccd | varchar(8000) | YES |
| 6 | usecarexpacccd | varchar(8000) | YES |
| 7 | source_system | varchar(8000) | YES |
| 8 | elt_time | varchar(8000) | YES |

#### ldms.TACC_SUM_MBS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | chaamt | bigint | YES |
| 6 | daeamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | orderptn | int | YES |
| 9 | korname | varchar(8000) | YES |
| 10 | engname | varchar(8000) | YES |
| 11 | chname | varchar(8000) | YES |
| 12 | accpartcd | varchar(8000) | YES |
| 13 | created_by | varchar(8000) | YES |
| 14 | created_dt | datetime2 | YES |
| 15 | edited_by | varchar(8000) | YES |
| 16 | edited_dt | datetime2 | YES |
| 17 | slip_knd | varchar(8000) | YES |
| 18 | source_system | varchar(8000) | YES |
| 19 | elt_time | varchar(8000) | YES |

#### ldms.TACC_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brandcd | varchar(8000) | YES |
| 2 | variantcd | varchar(8000) | YES |
| 3 | seq | decimal(28,10) | YES |
| 4 | other | varchar(8000) | YES |
| 5 | model_cd | varchar(8000) | YES |
| 6 | enabled_flag | varchar(8000) | YES |
| 7 | reg_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_dt | datetime2 | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | source_system | varchar(8000) | YES |
| 12 | elt_time | varchar(8000) | YES |

#### ldms.TACC_VC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | startdt | datetime2 | YES |
| 3 | enddt | datetime2 | YES |
| 4 | korname | varchar(8000) | YES |
| 5 | engname | varchar(8000) | YES |
| 6 | chname | varchar(8000) | YES |
| 7 | accdivcd | varchar(8000) | YES |
| 8 | accpartcd | varchar(8000) | YES |
| 9 | acccdonelvl | varchar(8000) | YES |
| 10 | acccdtwolvl | varchar(8000) | YES |
| 11 | acccdthreelvl | varchar(8000) | YES |
| 12 | acccdfourlvl | varchar(8000) | YES |
| 13 | slipoccuryn | varchar(8000) | YES |
| 14 | cal | varchar(8000) | YES |
| 15 | orderptn | int | YES |
| 16 | commnets | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### ldms.TF_DCM_INFO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dcm_info_id | decimal(28,0) | YES |
| 2 | dcm_type | varchar(8000) | YES |
| 3 | vin | varchar(8000) | YES |
| 4 | urn | varchar(8000) | YES |
| 5 | ed_no | varchar(8000) | YES |
| 6 | model_name | varchar(8000) | YES |
| 7 | vessel_cd | varchar(8000) | YES |
| 8 | invoice_no | varchar(8000) | YES |
| 9 | imei | varchar(8000) | YES |
| 10 | iccid | varchar(8000) | YES |
| 11 | euiccid | varchar(8000) | YES |
| 12 | dcm_reg_dt | varchar(8000) | YES |
| 13 | status | varchar(8000) | YES |
| 14 | transfer_yn | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | ccss_if_dt | varchar(8000) | YES |
| 20 | ccss_if_flag | varchar(8000) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### ldms.VS_COLOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | sfx_cd | varchar(8000) | YES |
| 6 | col_combi_cd | varchar(8000) | YES |
| 7 | brand_nm | varchar(8000) | YES |
| 8 | model_nm | varchar(8000) | YES |
| 9 | variant_nm | varchar(8000) | YES |
| 10 | sfx_nm | varchar(8000) | YES |
| 11 | col_combi_nm | varchar(8000) | YES |
| 12 | curr_sales_yn | varchar(8000) | YES |
| 13 | important_yn | varchar(8000) | YES |
| 14 | display_order | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | special_ordr_flag | varchar(8000) | YES |
| 20 | take_contract_amt | decimal(28,6) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### ldms.VS_MODEL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | model_nm | varchar(8000) | YES |
| 4 | curr_sales_yn | varchar(8000) | YES |
| 5 | display_order | varchar(8000) | YES |
| 6 | reg_dt | datetime2 | YES |
| 7 | upd_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_user_id | varchar(8000) | YES |
| 10 | source_system | varchar(8000) | YES |
| 11 | elt_time | varchar(8000) | YES |

#### ldms.VS_MODEL_YEAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | model_year | varchar(8000) | YES |
| 6 | start_ym | varchar(8000) | YES |
| 7 | end_ym | varchar(8000) | YES |
| 8 | vehic_type | varchar(8000) | YES |
| 9 | reg_dt | datetime2 | YES |
| 10 | reg_user_id | varchar(8000) | YES |
| 11 | upd_dt | datetime2 | YES |
| 12 | upd_user_id | varchar(8000) | YES |
| 13 | pre_resv_yn | varchar(8000) | YES |
| 14 | pre_resv_start_dt | varchar(8000) | YES |
| 15 | pre_cont_start_dt | varchar(8000) | YES |
| 16 | pre_deps_end_dt | varchar(8000) | YES |
| 17 | cont_start_dt | varchar(8000) | YES |
| 18 | pre_cont_end_dt | varchar(8000) | YES |
| 19 | source_system | varchar(8000) | YES |
| 20 | elt_time | varchar(8000) | YES |

#### ldms.VS_SFX

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | sfx_cd | varchar(8000) | YES |
| 6 | brand_nm | varchar(8000) | YES |
| 7 | model_nm | varchar(8000) | YES |
| 8 | variant_nm | varchar(8000) | YES |
| 9 | model_year | varchar(8000) | YES |
| 10 | sfx_nm | varchar(8000) | YES |
| 11 | curr_sales_yn | varchar(8000) | YES |
| 12 | display_order | varchar(8000) | YES |
| 13 | launch_dt | varchar(8000) | YES |
| 14 | form_apply | varchar(8000) | YES |
| 15 | motive_type | varchar(8000) | YES |
| 16 | taking_fix | varchar(8000) | YES |
| 17 | displacement | varchar(8000) | YES |
| 18 | hp | varchar(8000) | YES |
| 19 | gross_weight | varchar(8000) | YES |
| 20 | cylinder_cnt | int | YES |
| 21 | max_load | varchar(8000) | YES |
| 22 | max_output | decimal(28,10) | YES |
| 23 | length | decimal(28,10) | YES |
| 24 | width | decimal(28,10) | YES |
| 25 | height | decimal(28,10) | YES |
| 26 | order_yn | varchar(8000) | YES |
| 27 | reg_dt | datetime2 | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | datetime2 | YES |
| 30 | upd_user_id | varchar(8000) | YES |
| 31 | confirm_no | varchar(8000) | YES |
| 32 | hybrid_yn | varchar(8000) | YES |
| 33 | navi_yn | varchar(8000) | YES |
| 34 | ecfrnd_vhcle_knd | varchar(8000) | YES |
| 35 | grade | varchar(8000) | YES |
| 36 | connected_car_yn | varchar(8000) | YES |
| 37 | spec_variant_nm | varchar(8000) | YES |
| 38 | hi_pass_yn | varchar(8000) | YES |
| 39 | black_box_yn | varchar(8000) | YES |
| 40 | consign_sales_flag | varchar(8000) | YES |
| 41 | ew_yn | varchar(8000) | YES |
| 42 | dcm_type | varchar(8000) | YES |
| 43 | source_system | varchar(8000) | YES |
| 44 | elt_time | varchar(8000) | YES |

#### ldms.VS_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | variant_key | varchar(8000) | YES |
| 5 | moct_car_type | varchar(8000) | YES |
| 6 | variant_nm | varchar(8000) | YES |
| 7 | sales_yn | varchar(8000) | YES |
| 8 | order_yn | varchar(8000) | YES |
| 9 | mon_target_cd | varchar(8000) | YES |
| 10 | svc_model_cd | varchar(8000) | YES |
| 11 | svc_model_desc | varchar(8000) | YES |
| 12 | if_variant_nm | varchar(8000) | YES |
| 13 | warranty_month | decimal(28,10) | YES |
| 14 | display_order | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | daily_report_variant_cd | varchar(8000) | YES |
| 20 | daily_report_yn | varchar(8000) | YES |
| 21 | prod_loc | varchar(8000) | YES |
| 22 | report_variant_nm | varchar(8000) | YES |
| 23 | report_display_order | varchar(8000) | YES |
| 24 | pre_variant_nm | varchar(8000) | YES |
| 25 | ecrb_variant_nm | varchar(8000) | YES |
| 26 | hybrid_yn | varchar(8000) | YES |
| 27 | spec_variant_nm | varchar(8000) | YES |
| 28 | variant_cd_jpn | varchar(8000) | YES |
| 29 | grade | varchar(8000) | YES |
| 30 | concern_mdl_yn | varchar(8000) | YES |
| 31 | fuel_type_cd | varchar(8000) | YES |
| 32 | wireframe_cd | varchar(8000) | YES |
| 33 | source_system | varchar(8000) | YES |
| 34 | elt_time | varchar(8000) | YES |

#### parts.PT_PART_TIRE_COMPANY

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_0a67d4fc_74ea_4701_bfb8_2110a0677d50

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_11721e9f_0a69_4681_bec4_2dddd7a04b8b

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_28395a94_0b1a_4123_a1a7_0b3a9fe503eb

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_31313e87_b213_471a_b2a6_7172ef52674b

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_31dbf67b_5e37_432f_97ac_9db3a23fe781

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_brand | varchar(8000) | YES | 브랜드 |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_33f7db1c_edfc_48ee_b170_f969bac8f7c9

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_3532e6e5_7e9a_4329_ba7e_f1bb984dbd9b

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_3b20725d_faae_4556_a587_516dd1f9921b

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_4f26787b_6a52_4a8f_81a1_becd6bade480

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_5876ac12_f64b_4e5e_8e7d_ca623a5f7b05

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_5aaa9115_5ee0_4cb9_af98_e0ec3d7d7b5b

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_5dbeb1b5_1b2d_4e37_b0ad_0ebda6bd0f89

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_813700d5_b535_4093_9914_469e77cea77d

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_8310ba11_5b63_4fd1_9168_ac99116a9dfb

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_a089e78f_3496_413f_8d7a_835ec05a7b61

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_a696ae6a_dd07_47e2_9f5f_4e93b8b926a9

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | source_system | varchar(8000) | YES |  |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### parts.PT_PART_TIRE_COMPANY_backup_b15a9117_cd8a_433e_8a8c_d3b01b205726

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | tire_company | varchar(8000) | YES |  |
| 3 | reg_dt | datetime2 | YES | 등록일 |
| 4 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 5 | upd_dt | datetime2 | YES | 수정일 |
| 6 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 7 | tire_gbn | varchar(8000) | YES |  |
| 8 | brand | varchar(8000) | YES | 브랜드 |
| 9 | elt_time | varchar(8000) | YES | 시각 |

#### queryinsights.exec_requests_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | distributed_statement_id | uniqueidentifier | YES |
| 2 | database_name | varchar(200) | YES |
| 3 | submit_time | datetime2 | YES |
| 4 | start_time | datetime2 | YES |
| 5 | end_time | datetime2 | YES |
| 6 | is_distributed | int | NO |
| 7 | statement_type | varchar(128) | YES |
| 8 | total_elapsed_time_ms | bigint | YES |
| 9 | login_name | varchar(200) | YES |
| 10 | row_count | bigint | YES |
| 11 | status | varchar(200) | YES |
| 12 | session_id | int | YES |
| 13 | connection_id | uniqueidentifier | YES |
| 14 | program_name | varchar(128) | YES |
| 15 | batch_id | uniqueidentifier | YES |
| 16 | root_batch_id | uniqueidentifier | YES |
| 17 | query_hash | varchar(200) | YES |
| 18 | label | varchar(8000) | YES |
| 19 | result_cache_hit | int | YES |
| 20 | sql_pool_name | varchar(128) | YES |
| 21 | error_code | int | YES |
| 22 | error_severity | int | YES |
| 23 | error_state | int | YES |
| 24 | allocated_cpu_time_ms | bigint | YES |
| 25 | data_scanned_remote_storage_mb | decimal(18,3) | YES |
| 26 | data_scanned_memory_mb | decimal(18,3) | YES |
| 27 | data_scanned_disk_mb | decimal(18,3) | YES |
| 28 | command | varchar(max) | YES |

#### queryinsights.exec_sessions_history

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | session_id | int | YES |
| 2 | connection_id | uniqueidentifier | YES |
| 3 | session_start_time | datetime2 | YES |
| 4 | session_end_time | datetime2 | YES |
| 5 | program_name | varchar(256) | YES |
| 6 | login_name | varchar(256) | YES |
| 7 | status | varchar(100) | YES |
| 8 | context_info | varchar(128) | YES |
| 9 | total_query_elapsed_time_ms | bigint | YES |
| 10 | last_request_start_time | datetime2 | YES |
| 11 | last_request_end_time | datetime2 | YES |
| 12 | is_user_process | bit | YES |
| 13 | prev_error | int | YES |
| 14 | group_id | bigint | YES |
| 15 | database_id | int | YES |
| 16 | authenticating_database_id | int | YES |
| 17 | open_transaction_count | bigint | YES |
| 18 | text_size | int | YES |
| 19 | language | varchar(256) | YES |
| 20 | date_format | varchar(20) | YES |
| 21 | date_first | int | YES |
| 22 | quoted_identifier | bit | YES |
| 23 | arithabort | bit | YES |
| 24 | ansi_null_dflt_on | bit | YES |
| 25 | ansi_defaults | bit | YES |
| 26 | ansi_warnings | bit | YES |
| 27 | ansi_padding | bit | YES |
| 28 | ansi_nulls | bit | YES |
| 29 | concat_null_yields_null | bit | YES |
| 30 | transaction_isolation_level | int | YES |
| 31 | lock_timeout | bigint | YES |
| 32 | deadlock_priority | int | YES |
| 33 | original_security_id | varchar(200) | YES |
| 34 | database_name | varchar(200) | YES |

#### queryinsights.frequently_run_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | number_of_runs | int | YES |
| 3 | min_run_total_elapsed_time_ms | bigint | YES |
| 4 | max_run_total_elapsed_time_ms | bigint | YES |
| 5 | avg_total_elapsed_time_ms | bigint | YES |
| 6 | number_of_successful_runs | int | YES |
| 7 | number_of_failed_runs | int | YES |
| 8 | number_of_canceled_runs | int | YES |
| 9 | last_run_total_elapsed_time_ms | bigint | YES |
| 10 | last_run_start_time | datetime2 | YES |
| 11 | last_dist_statement_id | uniqueidentifier | YES |
| 12 | query_hash | varchar(200) | YES |
| 13 | last_run_command | varchar(max) | YES |

#### queryinsights.long_running_queries

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | database_name | varchar(200) | YES |
| 2 | median_total_elapsed_time_ms | float | YES |
| 3 | last_run_total_elapsed_time_ms | bigint | YES |
| 4 | last_run_start_time | datetime2 | YES |
| 5 | last_dist_statement_id | uniqueidentifier | YES |
| 6 | last_run_session_id | int | YES |
| 7 | number_of_runs | int | YES |
| 8 | query_hash | varchar(200) | YES |
| 9 | last_run_command | varchar(max) | YES |

#### queryinsights.sql_pool_insights

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sql_pool_name | varchar(128) | YES |
| 2 | timestamp | datetime2 | YES |
| 3 | max_resource_percentage | int | YES |
| 4 | is_optimized_for_reads | bit | YES |
| 5 | current_workspace_capacity | varchar(16) | YES |
| 6 | is_pool_under_pressure | bit | YES |

#### sys.dm_db_external_tables_log_status

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | object_id | int | NO |
| 2 | latest_log_version | bigint | YES |
| 3 | latest_checkpoint_version | bigint | YES |
| 4 | last_update_time_utc | datetime | NO |
| 5 | is_blocked | bit | NO |

#### sys.external_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | is_blocked | bit | NO |
| 3 | block_reason | tinyint | NO |
| 4 | relative_path | nvarchar(2000) | NO |
| 5 | latest_manifest_version | bigint | YES |
| 6 | latest_checkpoint_version | bigint | YES |
| 7 | latest_checksum_version | bigint | YES |
| 8 | latest_etag | nvarchar(128) | NO |
| 9 | latest_checkpoint_file_name | nvarchar(76) | NO |
| 10 | last_update_time | datetime | NO |

#### sys.managed_delta_table_checkpoints

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delta_log_commit_sequence_id | bigint | NO |
| 2 | part | int | NO |
| 3 | file_guid | uniqueidentifier | NO |
| 4 | version | bigint | NO |
| 5 | source_table_guid | uniqueidentifier | NO |
| 6 | source_database_guid | uniqueidentifier | YES |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | checkpoint_file_name | nvarchar(256) | YES |
| 9 | manifest_root | nvarchar(256) | YES |

#### sys.managed_delta_table_forks

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | fork_guid | uniqueidentifier | NO |
| 3 | source_table_guid | uniqueidentifier | NO |
| 4 | source_database_guid | uniqueidentifier | NO |
| 5 | xdes_ts | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | table_guid | uniqueidentifier | NO |
| 8 | folder_name | nvarchar(40) | YES |

#### sys.managed_delta_table_log_files

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | commit_sequence_id | bigint | NO |
| 2 | file_guid | uniqueidentifier | NO |
| 3 | xdes_ts | bigint | NO |
| 4 | append_only | bit | NO |
| 5 | rows_inserted | bigint | NO |
| 6 | commit_time | datetime | NO |
| 7 | source_table_guid | uniqueidentifier | NO |
| 8 | source_database_guid | uniqueidentifier | YES |
| 9 | manifest_file_name | nvarchar(256) | YES |
| 10 | manifest_root | nvarchar(256) | YES |
| 11 | table_guid | uniqueidentifier | NO |

#### sys.managed_delta_tables

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_id | bigint | NO |
| 2 | object_id | int | NO |
| 3 | table_guid | uniqueidentifier | NO |
| 4 | fork_guid | uniqueidentifier | NO |
| 5 | delta_log_feature_status | int | NO |
| 6 | manifest_root | nvarchar(256) | YES |
| 7 | system_task_consideration_bitmask | int | YES |
| 8 | drop_commit_time | datetime | YES |

#### sys.sys_dw_schemas

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | name | nvarchar(128) | NO |
| 2 | schema_id | int | NO |
| 3 | principal_id | int | YES |
| 4 | is_internal | bit | YES |

#### tdms.CO_CALENDAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | base_dt | varchar(8000) | YES |
| 2 | week_no_by_month | decimal(28,10) | YES |
| 3 | week_day | varchar(8000) | YES |
| 4 | work_korea | varchar(8000) | YES |
| 5 | work_overseas | varchar(8000) | YES |
| 6 | work_dealer | varchar(8000) | YES |
| 7 | work_hq | varchar(8000) | YES |
| 8 | work_cpd | varchar(8000) | YES |
| 9 | reg_dt | datetime2 | YES |
| 10 | reg_user_id | varchar(8000) | YES |
| 11 | upd_dt | datetime2 | YES |
| 12 | upd_user_id | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### tdms.CO_CODE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(8000) | YES |
| 2 | code | varchar(8000) | YES |
| 3 | code_type_nm | varchar(8000) | YES |
| 4 | code_nm | varchar(8000) | YES |
| 5 | eng_code_nm | varchar(8000) | YES |
| 6 | display_order | varchar(8000) | YES |
| 7 | up_code_type | varchar(8000) | YES |
| 8 | remark | varchar(8000) | YES |
| 9 | use_yn | varchar(8000) | YES |
| 10 | reg_dt | datetime2 | YES |
| 11 | reg_user_id | varchar(8000) | YES |
| 12 | upd_dt | datetime2 | YES |
| 13 | upd_user_id | varchar(8000) | YES |
| 14 | attr1 | varchar(8000) | YES |
| 15 | code_type_gb | varchar(8000) | YES |
| 16 | attr2 | varchar(8000) | YES |
| 17 | attr3 | varchar(8000) | YES |
| 18 | source_system | varchar(8000) | YES |
| 19 | elt_time | varchar(8000) | YES |

#### tdms.CO_COMPANY

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | comp_seq | decimal(28,10) | YES |
| 2 | dealer_id | varchar(8000) | YES |
| 3 | cust_seq | bigint | YES |
| 4 | biz_reg_no | varchar(8000) | YES |
| 5 | comp_nm_kor | varchar(8000) | YES |
| 6 | comp_nm_engl | varchar(8000) | YES |
| 7 | biz_cond_nm | varchar(8000) | YES |
| 8 | chief_id | varchar(8000) | YES |
| 9 | chief_name_kor | varchar(8000) | YES |
| 10 | chief_name_engl | varchar(8000) | YES |
| 11 | comp_email | varchar(8000) | YES |
| 12 | zip | varchar(8000) | YES |
| 13 | addr | varchar(8000) | YES |
| 14 | addr_no | varchar(8000) | YES |
| 15 | tel_area | varchar(8000) | YES |
| 16 | tel_no | varchar(8000) | YES |
| 17 | fax_area | varchar(8000) | YES |
| 18 | fax_no | varchar(8000) | YES |
| 19 | use_yn | varchar(8000) | YES |
| 20 | parts_company_type | varchar(8000) | YES |
| 21 | parts_flag | varchar(8000) | YES |
| 22 | comp_identi | varchar(8000) | YES |
| 23 | cust_flag | varchar(8000) | YES |
| 24 | splr_flag | varchar(8000) | YES |
| 25 | splr_group | varchar(8000) | YES |
| 26 | order_cycle | decimal(7,2) | YES |
| 27 | safe_stock_lead_time | decimal(7,2) | YES |
| 28 | lead_time | decimal(7,2) | YES |
| 29 | short_stock_warn_base | decimal(7,2) | YES |
| 30 | over_due_days_sea | int | YES |
| 31 | over_due_days_air | int | YES |
| 32 | over_due_days_fo | int | YES |
| 33 | impr_cd | varchar(8000) | YES |
| 34 | exch_rate_recv | decimal(9,3) | YES |
| 35 | exch_rate_price_chng | decimal(9,3) | YES |
| 36 | lc_fact_resv | decimal(7,2) | YES |
| 37 | lc_fact_air | decimal(7,2) | YES |
| 38 | lc_fact_price_chng | decimal(7,2) | YES |
| 39 | term_order_to_etd | int | YES |
| 40 | term_order_to_eta | int | YES |
| 41 | so_entr_alow_day | bigint | YES |
| 42 | part_dc_rate_dms | int | YES |
| 43 | bo_fk | varchar(8000) | YES |
| 44 | base_price_type | varchar(8000) | YES |
| 45 | cust_region_cd | varchar(8000) | YES |
| 46 | cust_tran_cd | varchar(8000) | YES |
| 47 | delivery_zip | varchar(8000) | YES |
| 48 | delivery_adr | varchar(8000) | YES |
| 49 | delivery_adr_no | varchar(8000) | YES |
| 50 | country | varchar(8000) | YES |
| 51 | ar_biz_type_nm | varchar(8000) | YES |
| 52 | service_company_type | varchar(8000) | YES |
| 53 | service_flag | varchar(8000) | YES |
| 54 | ap_vat_cd | varchar(8000) | YES |
| 55 | ap_payment_method | varchar(8000) | YES |
| 56 | ar_vat_cd | varchar(8000) | YES |
| 57 | reg_dt | datetime2 | YES |
| 58 | reg_user_id | varchar(8000) | YES |
| 59 | upd_dt | datetime2 | YES |
| 60 | upd_user_id | varchar(8000) | YES |
| 61 | bp_shop_yn | varchar(8000) | YES |
| 62 | dc_rate | decimal(7,4) | YES |
| 63 | oil_purc_yn | varchar(8000) | YES |
| 64 | hp_area | varchar(8000) | YES |
| 65 | hp_no | varchar(8000) | YES |
| 66 | tr_zip | varchar(8000) | YES |
| 67 | tr_addr | varchar(8000) | YES |
| 68 | tr_addr_no | varchar(8000) | YES |
| 69 | tr_addr_flag | varchar(8000) | YES |
| 70 | tr_addr_insert_flag | varchar(8000) | YES |
| 71 | tr_addr_bld_no | varchar(8000) | YES |
| 72 | tr_addr_result | varchar(8000) | YES |
| 73 | tr_zip_delivery | varchar(8000) | YES |
| 74 | tr_addr_delivery | varchar(8000) | YES |
| 75 | tr_addr_no_delivery | varchar(8000) | YES |
| 76 | tr_addr_delivery_flag | varchar(8000) | YES |
| 77 | tr_addr_delivery_insert_flag | varchar(8000) | YES |
| 78 | tr_addr_delivery_bld_no | varchar(8000) | YES |
| 79 | tr_addr_delivery_result | varchar(8000) | YES |
| 80 | chief_id_dec | varchar(8000) | YES |
| 81 | source_system | varchar(8000) | YES |
| 82 | elt_time | varchar(8000) | YES |

#### tdms.CO_GROUP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | group_name | varchar(8000) | YES |
| 3 | group_full_name | varchar(8000) | YES |
| 4 | group_type | varchar(8000) | YES |
| 5 | chief_name | varchar(8000) | YES |
| 6 | chief_id | varchar(8000) | YES |
| 7 | biz_reg_no | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | pdi_area | varchar(8000) | YES |
| 12 | cpd_area | varchar(8000) | YES |
| 13 | found_dt | varchar(8000) | YES |
| 14 | showroom_no | decimal(28,10) | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | decimal(28,10) | YES |
| 17 | fee_transfer | decimal(28,10) | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(8000) | YES |
| 23 | group_short_name | varchar(8000) | YES |
| 24 | group_area | varchar(8000) | YES |
| 25 | stock_value_type | varchar(8000) | YES |
| 26 | usage_type | varchar(8000) | YES |
| 27 | tmkr_service_cd | varchar(8000) | YES |
| 28 | tmkr_parts_cd | varchar(8000) | YES |
| 29 | tmkr_sales_cd | varchar(8000) | YES |
| 30 | tmc_service_cd | varchar(8000) | YES |
| 31 | tmc_parts_cd | varchar(8000) | YES |
| 32 | tmc_sales_cd | varchar(8000) | YES |
| 33 | up_group_id | varchar(8000) | YES |
| 34 | system_use_yn | varchar(8000) | YES |
| 35 | dealer_yn | varchar(8000) | YES |
| 36 | shop_yn | varchar(8000) | YES |
| 37 | highest_group_yn | varchar(8000) | YES |
| 38 | use_yn | varchar(8000) | YES |
| 39 | photo_file_dir | varchar(8000) | YES |
| 40 | org_id | decimal(28,10) | YES |
| 41 | set_of_books_id | decimal(28,10) | YES |
| 42 | location_id | decimal(28,10) | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | dealer_id | varchar(8000) | YES |
| 48 | ci_image_id | varchar(8000) | YES |
| 49 | tel_area | varchar(8000) | YES |
| 50 | tel_no | varchar(8000) | YES |
| 51 | fax_area | varchar(8000) | YES |
| 52 | fax_no | varchar(8000) | YES |
| 53 | biz_type_nm | varchar(8000) | YES |
| 54 | biz_cond_nm | varchar(8000) | YES |
| 55 | sms_name | varchar(8000) | YES |
| 56 | svc_sms_no | varchar(8000) | YES |
| 57 | new_tmkr_parts_cd | varchar(8000) | YES |
| 58 | new_tmc_parts_cd | varchar(8000) | YES |
| 59 | svc_reg_no | varchar(8000) | YES |
| 60 | svc_chrg_nm | varchar(8000) | YES |
| 61 | fd_code_sea | varchar(8000) | YES |
| 62 | fd_code_air | varchar(8000) | YES |
| 63 | brand_cd | varchar(8000) | YES |
| 64 | svc_tr_user_id | varchar(8000) | YES |
| 65 | port_cd | varchar(8000) | YES |
| 66 | group_eng_name | varchar(8000) | YES |
| 67 | contract_alert_yn | varchar(8000) | YES |
| 68 | customer_alert_yn | varchar(8000) | YES |
| 69 | bp_shop_yn | varchar(8000) | YES |
| 70 | biz_corp_no | varchar(8000) | YES |
| 71 | svc_stamp_id | varchar(8000) | YES |
| 72 | geo_loc_x | varchar(8000) | YES |
| 73 | geo_loc_y | varchar(8000) | YES |
| 74 | zoom_lvl | varchar(8000) | YES |
| 75 | tr_zip | varchar(8000) | YES |
| 76 | tr_addr | varchar(8000) | YES |
| 77 | tr_addr_no | varchar(8000) | YES |
| 78 | tr_addr_flag | varchar(8000) | YES |
| 79 | tr_addr_insert_flag | varchar(8000) | YES |
| 80 | tr_addr_bld_no | varchar(8000) | YES |
| 81 | tr_addr_result | varchar(8000) | YES |
| 82 | base_svc_center | varchar(8000) | YES |
| 83 | customer_save_yn | varchar(8000) | YES |
| 84 | call_block_area | varchar(8000) | YES |
| 85 | call_block_no | varchar(8000) | YES |
| 86 | cpo_yn | varchar(8000) | YES |
| 87 | holding_id | varchar(8000) | YES |
| 88 | dz_bizarea_cd | varchar(8000) | YES |
| 89 | molit_id | varchar(8000) | YES |
| 90 | molit_passwd | varchar(8000) | YES |
| 91 | molit_key | varchar(8000) | YES |
| 92 | molit_pgmcode | varchar(8000) | YES |
| 93 | group_short_eng_name | varchar(8000) | YES |
| 94 | tax_biz_no | varchar(8000) | YES |
| 95 | source_system | varchar(8000) | YES |
| 96 | elt_time | varchar(8000) | YES |

#### tdms.CO_HOLDINGS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | group_name | varchar(8000) | YES |
| 3 | group_full_name | varchar(8000) | YES |
| 4 | group_type | varchar(8000) | YES |
| 5 | chief_name | varchar(8000) | YES |
| 6 | chief_id | varchar(8000) | YES |
| 7 | biz_reg_no | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | pdi_area | varchar(8000) | YES |
| 12 | cpd_area | varchar(8000) | YES |
| 13 | found_dt | varchar(8000) | YES |
| 14 | showroom_no | decimal(28,10) | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | decimal(28,10) | YES |
| 17 | fee_transfer | decimal(28,10) | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(8000) | YES |
| 23 | group_short_name | varchar(8000) | YES |
| 24 | group_area | varchar(8000) | YES |
| 25 | stock_value_type | varchar(8000) | YES |
| 26 | usage_type | varchar(8000) | YES |
| 27 | tmkr_service_cd | varchar(8000) | YES |
| 28 | tmkr_parts_cd | varchar(8000) | YES |
| 29 | tmkr_sales_cd | varchar(8000) | YES |
| 30 | tmc_service_cd | varchar(8000) | YES |
| 31 | tmc_parts_cd | varchar(8000) | YES |
| 32 | tmc_sales_cd | varchar(8000) | YES |
| 33 | up_group_id | varchar(8000) | YES |
| 34 | system_use_yn | varchar(8000) | YES |
| 35 | dealer_yn | varchar(8000) | YES |
| 36 | shop_yn | varchar(8000) | YES |
| 37 | highest_group_yn | varchar(8000) | YES |
| 38 | use_yn | varchar(8000) | YES |
| 39 | photo_file_dir | varchar(8000) | YES |
| 40 | org_id | decimal(28,10) | YES |
| 41 | set_of_books_id | decimal(28,10) | YES |
| 42 | location_id | decimal(28,10) | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | dealer_id | varchar(8000) | YES |
| 48 | ci_image_id | varchar(8000) | YES |
| 49 | tel_area | varchar(8000) | YES |
| 50 | tel_no | varchar(8000) | YES |
| 51 | fax_area | varchar(8000) | YES |
| 52 | fax_no | varchar(8000) | YES |
| 53 | biz_type_nm | varchar(8000) | YES |
| 54 | biz_cond_nm | varchar(8000) | YES |
| 55 | sms_name | varchar(8000) | YES |
| 56 | svc_sms_no | varchar(8000) | YES |
| 57 | new_tmkr_parts_cd | varchar(8000) | YES |
| 58 | new_tmc_parts_cd | varchar(8000) | YES |
| 59 | svc_reg_no | varchar(8000) | YES |
| 60 | svc_chrg_nm | varchar(8000) | YES |
| 61 | fd_code_sea | varchar(8000) | YES |
| 62 | fd_code_air | varchar(8000) | YES |
| 63 | brand_cd | varchar(8000) | YES |
| 64 | svc_tr_user_id | varchar(8000) | YES |
| 65 | port_cd | varchar(8000) | YES |
| 66 | group_eng_name | varchar(8000) | YES |
| 67 | contract_alert_yn | varchar(8000) | YES |
| 68 | customer_alert_yn | varchar(8000) | YES |
| 69 | bp_shop_yn | varchar(8000) | YES |
| 70 | biz_corp_no | varchar(8000) | YES |
| 71 | svc_stamp_id | varchar(8000) | YES |
| 72 | geo_loc_x | varchar(8000) | YES |
| 73 | geo_loc_y | varchar(8000) | YES |
| 74 | zoom_lvl | varchar(8000) | YES |
| 75 | tr_zip | varchar(8000) | YES |
| 76 | tr_addr | varchar(8000) | YES |
| 77 | tr_addr_no | varchar(8000) | YES |
| 78 | tr_addr_flag | varchar(8000) | YES |
| 79 | tr_addr_insert_flag | varchar(8000) | YES |
| 80 | tr_addr_bld_no | varchar(8000) | YES |
| 81 | tr_addr_result | varchar(8000) | YES |
| 82 | base_svc_center | varchar(8000) | YES |
| 83 | customer_save_yn | varchar(8000) | YES |
| 84 | call_block_area | varchar(8000) | YES |
| 85 | call_block_no | varchar(8000) | YES |
| 86 | cpo_yn | varchar(8000) | YES |
| 87 | group_cd | varchar(8000) | YES |
| 88 | erp_use_yn | varchar(8000) | YES |
| 89 | ws_type | varchar(8000) | YES |
| 90 | rs_type | varchar(8000) | YES |
| 91 | dz_comp_cd | varchar(8000) | YES |
| 92 | dz_bizarea_cd | varchar(8000) | YES |
| 93 | oid_group_num | decimal(28,10) | YES |
| 94 | source_system | varchar(8000) | YES |
| 95 | elt_time | varchar(8000) | YES |

#### tdms.CO_RECEIPT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | receipt_part | varchar(8000) | YES |
| 3 | receipt_seq | decimal(28,10) | YES |
| 4 | cancel_seq | decimal(28,10) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | manage_no | varchar(8000) | YES |
| 7 | receipt_dt | varchar(8000) | YES |
| 8 | real_receipt_dt | varchar(8000) | YES |
| 9 | cancel_dt | datetime2 | YES |
| 10 | receipt_no | varchar(8000) | YES |
| 11 | cust_seq | decimal(28,10) | YES |
| 12 | cust_nm | varchar(8000) | YES |
| 13 | receipt_cust_nm | varchar(8000) | YES |
| 14 | cust_type | varchar(8000) | YES |
| 15 | taxpay_no | varchar(8000) | YES |
| 16 | receipt_type | varchar(8000) | YES |
| 17 | cash_amt | decimal(28,10) | YES |
| 18 | card_amt | decimal(28,10) | YES |
| 19 | cms_amt | decimal(28,10) | YES |
| 20 | coupon_amt | decimal(28,10) | YES |
| 21 | credit_amt | decimal(28,10) | YES |
| 22 | extra_dc_amt | decimal(28,10) | YES |
| 23 | receipt_amt | decimal(28,10) | YES |
| 24 | svc_key1 | varchar(8000) | YES |
| 25 | svc_key2 | decimal(28,10) | YES |
| 26 | svc_key3 | decimal(28,10) | YES |
| 27 | svc_key4 | varchar(8000) | YES |
| 28 | key_kind | varchar(8000) | YES |
| 29 | remark | varchar(8000) | YES |
| 30 | cancel_yn | varchar(8000) | YES |
| 31 | cancel_cd | varchar(8000) | YES |
| 32 | bank_account_cash | varchar(8000) | YES |
| 33 | bank_account_card | varchar(8000) | YES |
| 34 | bank_account_cms | varchar(8000) | YES |
| 35 | deal_date | varchar(8000) | YES |
| 36 | deal_seq | decimal(28,10) | YES |
| 37 | comp_seq | decimal(28,10) | YES |
| 38 | bank_account_id | varchar(8000) | YES |
| 39 | variant_nm | varchar(8000) | YES |
| 40 | salesrep_num | varchar(8000) | YES |
| 41 | cash_receipt_amt | decimal(28,10) | YES |
| 42 | tax_cust_seq | decimal(28,10) | YES |
| 43 | tax_cust_nm | varchar(8000) | YES |
| 44 | tax_taxpay_no | varchar(8000) | YES |
| 45 | del_flag | varchar(8000) | YES |
| 46 | del_user_id | varchar(8000) | YES |
| 47 | dms_trx_id | decimal(28,10) | YES |
| 48 | tax_type | varchar(8000) | YES |
| 49 | interface_yn | varchar(8000) | YES |
| 50 | interface_user_id | varchar(8000) | YES |
| 51 | interface_dt | datetime2 | YES |
| 52 | memo | varchar(8000) | YES |
| 53 | reg_dt | datetime2 | YES |
| 54 | reg_user_id | varchar(8000) | YES |
| 55 | upd_dt | datetime2 | YES |
| 56 | upd_user_id | varchar(8000) | YES |
| 57 | org_id | decimal(28,10) | YES |
| 58 | location_id | decimal(28,10) | YES |
| 59 | psp_amt | decimal(28,10) | YES |
| 60 | status | varchar(8000) | YES |
| 61 | process_id | decimal(28,6) | YES |
| 62 | error_code | varchar(8000) | YES |
| 63 | dz_docu_no | varchar(8000) | YES |
| 64 | dz_pc_cd | varchar(8000) | YES |
| 65 | dz_comp_cd | varchar(8000) | YES |
| 66 | dz_bizarea_cd | varchar(8000) | YES |
| 67 | dz_cc_cd | varchar(8000) | YES |
| 68 | sales_sc_id | varchar(8000) | YES |
| 69 | if_confirm_status | varchar(8000) | YES |
| 70 | svc_exchange_amt | decimal(28,10) | YES |
| 71 | receipt_time | varchar(8000) | YES |
| 72 | recent_yn | varchar(8000) | YES |
| 73 | pg_seq | decimal(28,10) | YES |
| 74 | partial_refund_yn | varchar(8000) | YES |
| 75 | partial_refund_balance | decimal(28,10) | YES |
| 76 | partial_ref_seq | decimal(28,10) | YES |
| 77 | app_mileage_amt | decimal(28,10) | YES |
| 78 | bank_account_card_dec | varchar(8000) | YES |
| 79 | bank_account_cash_dec | varchar(8000) | YES |
| 80 | taxpay_no_dec | varchar(8000) | YES |
| 81 | source_system | varchar(8000) | YES |
| 82 | elt_time | varchar(8000) | YES |

#### tdms.CO_USERS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(8000) | YES |
| 2 | group_id | varchar(8000) | YES |
| 3 | dept_cd | varchar(8000) | YES |
| 4 | showroom_id | varchar(8000) | YES |
| 5 | name | varchar(8000) | YES |
| 6 | title | varchar(8000) | YES |
| 7 | biz_charge | varchar(8000) | YES |
| 8 | zip | varchar(8000) | YES |
| 9 | addr | varchar(8000) | YES |
| 10 | addr_no | varchar(8000) | YES |
| 11 | email | varchar(8000) | YES |
| 12 | authority | varchar(8000) | YES |
| 13 | user_group | varchar(8000) | YES |
| 14 | user_type | varchar(8000) | YES |
| 15 | passwd | varbinary | YES |
| 16 | display_order | varchar(8000) | YES |
| 17 | photo_file_dir | varchar(8000) | YES |
| 18 | skill_degree | varchar(8000) | YES |
| 19 | assign_stall | varchar(8000) | YES |
| 20 | name_eng | varchar(8000) | YES |
| 21 | designate_eng | varchar(8000) | YES |
| 22 | dept_eng | varchar(8000) | YES |
| 23 | addr_eng | varchar(8000) | YES |
| 24 | pref_lang | varchar(8000) | YES |
| 25 | work_start_dt | varchar(8000) | YES |
| 26 | resigned_dt | varchar(8000) | YES |
| 27 | active_yn | varchar(8000) | YES |
| 28 | charge_service | varchar(8000) | YES |
| 29 | charge_sales | varchar(8000) | YES |
| 30 | charge_parts | varchar(8000) | YES |
| 31 | query_type_sales | varchar(8000) | YES |
| 32 | query_type_service | varchar(8000) | YES |
| 33 | query_type_parts | varchar(8000) | YES |
| 34 | reg_user_id | varchar(8000) | YES |
| 35 | reg_dt | datetime2 | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | upd_dt | datetime2 | YES |
| 38 | empl_no | varchar(8000) | YES |
| 39 | regi_no | varchar(8000) | YES |
| 40 | bef_sale_id | varchar(8000) | YES |
| 41 | bef_service_id | varchar(8000) | YES |
| 42 | bef_crm_id | varchar(8000) | YES |
| 43 | fax_no | varchar(8000) | YES |
| 44 | tel_area | varchar(8000) | YES |
| 45 | tel_no | varchar(8000) | YES |
| 46 | fax_area | varchar(8000) | YES |
| 47 | hp_area | varchar(8000) | YES |
| 48 | hp_no | varchar(8000) | YES |
| 49 | facade_sc_yn | varchar(8000) | YES |
| 50 | frm_kind | varchar(8000) | YES |
| 51 | tax_use_type | varchar(8000) | YES |
| 52 | intro_menu | varchar(8000) | YES |
| 53 | dlr_voc_mng | varchar(8000) | YES |
| 54 | last_login_date | datetime2 | YES |
| 55 | passwd_upd_dt | datetime2 | YES |
| 56 | svc_head_yn | varchar(8000) | YES |
| 57 | password_lock | varchar(8000) | YES |
| 58 | mac_address | varchar(8000) | YES |
| 59 | pop_part_yn | varchar(8000) | YES |
| 60 | mac_address_i | varchar(8000) | YES |
| 61 | tr_zip | varchar(8000) | YES |
| 62 | tr_addr | varchar(8000) | YES |
| 63 | tr_addr_no | varchar(8000) | YES |
| 64 | tr_addr_flag | varchar(8000) | YES |
| 65 | tr_addr_insert_flag | varchar(8000) | YES |
| 66 | tr_addr_bld_no | varchar(8000) | YES |
| 67 | tr_addr_result | varchar(8000) | YES |
| 68 | vpn_yn | varchar(8000) | YES |
| 69 | auth_apvl_user_id | varchar(8000) | YES |
| 70 | intro_quick_menu | varchar(8000) | YES |
| 71 | e_learning_pwd | varchar(8000) | YES |
| 72 | out_act_cust_seq | decimal(28,10) | YES |
| 73 | master_user_id | varchar(8000) | YES |
| 74 | gm_type | varchar(8000) | YES |
| 75 | passwd_sha256 | varchar(8000) | YES |
| 76 | edu_yn | varchar(8000) | YES |
| 77 | edu_cate | varchar(8000) | YES |
| 78 | vpn_cnfm_dt | varchar(8000) | YES |
| 79 | first_name_eng | varchar(8000) | YES |
| 80 | sms_default_no | varchar(8000) | YES |
| 81 | layoff_dt | varchar(8000) | YES |
| 82 | resume_dt | varchar(8000) | YES |
| 83 | reactive_yn | varchar(8000) | YES |
| 84 | bi_code | varchar(8000) | YES |
| 85 | edu_primary_yn | varchar(8000) | YES |
| 86 | device_yn | varchar(8000) | YES |
| 87 | regi_no_dec | varchar(8000) | YES |
| 88 | birth_dt | varchar(8000) | YES |
| 89 | profile_url | varchar(8000) | YES |
| 90 | source_system | varchar(8000) | YES |
| 91 | elt_time | varchar(8000) | YES |

#### tdms.CO_VEHIC

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(8000) | YES | 차량 |
| 3 | vehic_no2 | varchar(8000) | YES | 차량 |
| 4 | vis | varchar(8000) | YES |  |
| 5 | contract_no | decimal(28,10) | YES | 계약번호 |
| 6 | model_year | varchar(8000) | YES | 모델 |
| 7 | brand_cd | varchar(8000) | YES | 브랜드 |
| 8 | maker_cd | varchar(8000) | YES | 코드 |
| 9 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 10 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 11 | odometer | int | YES |  |
| 12 | variant_nm | varchar(8000) | YES | 바리에이션 |
| 13 | svc_model_cd | varchar(8000) | YES | 모델 코드 |
| 14 | model_cd | varchar(8000) | YES | 모델 코드 |
| 15 | option_cd1 | varchar(8000) | YES |  |
| 16 | option_cd2 | varchar(8000) | YES |  |
| 17 | option_cd3 | varchar(8000) | YES |  |
| 18 | option_cd4 | varchar(8000) | YES |  |
| 19 | key_no | varchar(8000) | YES | 번호 |
| 20 | grade | varchar(8000) | YES |  |
| 21 | import_yn | varchar(8000) | YES | 여부(Y/N) |
| 22 | event | varchar(8000) | YES |  |
| 23 | linein_dt | varchar(8000) | YES | 일자 |
| 24 | delivery_dt | varchar(8000) | YES | 출고일 |
| 25 | lineoff_dt | varchar(8000) | YES | 일자 |
| 26 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 27 | exterior_cd | varchar(8000) | YES | 코드 |
| 28 | interior_cd | varchar(8000) | YES | 코드 |
| 29 | engine_no | varchar(8000) | YES | 번호 |
| 30 | force_reg_dt | datetime2 | YES | 등록일 |
| 31 | force_reg_yn | varchar(8000) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(8000) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 35 | first_rcpt_dt | datetime2 | YES | 일자 |
| 36 | sales_dealer_id | varchar(8000) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(8000) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 40 | last_rcpt_dt | datetime2 | YES | 일자 |
| 41 | vehic_magic | decimal(28,10) | YES | 차량 |
| 42 | ras_no | varchar(8000) | YES | 번호 |
| 43 | ew_no | varchar(8000) | YES | 번호 |
| 44 | sales_type | varchar(8000) | YES | 판매 |
| 45 | ras_start_dt | varchar(8000) | YES | 시작일 |
| 46 | ras_end_dt | varchar(8000) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | datetime2 | YES | 수정일 |
| 50 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 51 | upd_dt | datetime2 | YES | 수정일 |
| 52 | first_owner_yn | varchar(8000) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | datetime2 | YES | 수정일 |
| 55 | hv_badge_yn | varchar(8000) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(8000) | YES | 여부(Y/N) |
| 57 | source_system | varchar(8000) | YES |  |
| 58 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.CO_ZIPCODE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | zip_seq | decimal(28,10) | YES |
| 2 | zip_cd | varchar(8000) | YES |
| 3 | city | varchar(8000) | YES |
| 4 | gu | varchar(8000) | YES |
| 5 | dong | varchar(8000) | YES |
| 6 | rest | varchar(8000) | YES |
| 7 | dong1 | varchar(8000) | YES |
| 8 | dong2 | varchar(8000) | YES |
| 9 | source_system | varchar(8000) | YES |
| 10 | elt_time | varchar(8000) | YES |

#### tdms.CO_ZIPCODE_NEW

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | zip_cd | varchar(8000) | YES |
| 2 | zip_seq | varchar(8000) | YES |
| 3 | sido | varchar(8000) | YES |
| 4 | gugun | varchar(8000) | YES |
| 5 | dong | varchar(8000) | YES |
| 6 | detail_addr | varchar(8000) | YES |
| 7 | bunji | varchar(8000) | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | reg_dt | varchar(8000) | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | upd_dt | varchar(8000) | YES |
| 12 | source_system | varchar(8000) | YES |
| 13 | elt_time | varchar(8000) | YES |

#### tdms.CU_BASE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(28,10) | YES |
| 2 | cust_nm | varchar(8000) | YES |
| 3 | taxpay_no | varchar(8000) | YES |
| 4 | cust_type | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | mng_sc_id | varchar(8000) | YES |
| 7 | sale_sc_id | varchar(8000) | YES |
| 8 | mng_tech_id | varchar(8000) | YES |
| 9 | zip_reg | varchar(8000) | YES |
| 10 | addr_reg | varchar(8000) | YES |
| 11 | addr_no_reg | varchar(8000) | YES |
| 12 | zip_fact | varchar(8000) | YES |
| 13 | addr_fact | varchar(8000) | YES |
| 14 | addr_no_fact | varchar(8000) | YES |
| 15 | tel_area | varchar(8000) | YES |
| 16 | tel_no | varchar(8000) | YES |
| 17 | fax_area | varchar(8000) | YES |
| 18 | fax_no | varchar(8000) | YES |
| 19 | email | varchar(8000) | YES |
| 20 | email_domain | varchar(8000) | YES |
| 21 | hp_area | varchar(8000) | YES |
| 22 | hp_no | varchar(8000) | YES |
| 23 | job_cd | varchar(8000) | YES |
| 24 | job_detail | varchar(8000) | YES |
| 25 | office_nm | varchar(8000) | YES |
| 26 | dept_nm | varchar(8000) | YES |
| 27 | posi_nm | varchar(8000) | YES |
| 28 | zip_office | varchar(8000) | YES |
| 29 | addr_office | varchar(8000) | YES |
| 30 | rel_type | varchar(8000) | YES |
| 31 | addr_no_office | varchar(8000) | YES |
| 32 | office_tel_area | varchar(8000) | YES |
| 33 | office_tel_no | varchar(8000) | YES |
| 34 | rel_cust_seq | decimal(28,10) | YES |
| 35 | biz_cond_nm | varchar(8000) | YES |
| 36 | biz_type_nm | varchar(8000) | YES |
| 37 | chief_id | varchar(8000) | YES |
| 38 | chief_nm | varchar(8000) | YES |
| 39 | company_type | varchar(8000) | YES |
| 40 | dm_place_cd | varchar(8000) | YES |
| 41 | dm_name | varchar(8000) | YES |
| 42 | sms_receive_yn | varchar(8000) | YES |
| 43 | dm_receive_yn | varchar(8000) | YES |
| 44 | dm_return_yn | varchar(8000) | YES |
| 45 | email_return_yn | varchar(8000) | YES |
| 46 | email_receive_yn | varchar(8000) | YES |
| 47 | disuse_yn | varchar(8000) | YES |
| 48 | disuse_cd | varchar(8000) | YES |
| 49 | reg_dt | datetime2 | YES |
| 50 | deli_yn | varchar(8000) | YES |
| 51 | reg_user_id | varchar(8000) | YES |
| 52 | bef_crm_seq | decimal(28,6) | YES |
| 53 | upd_dt | datetime2 | YES |
| 54 | sc_grp_seq | decimal(28,10) | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_knd | varchar(8000) | YES |
| 57 | dealer_grp_seq | decimal(28,10) | YES |
| 58 | city | varchar(8000) | YES |
| 59 | gu | varchar(8000) | YES |
| 60 | dong | varchar(8000) | YES |
| 61 | dam_nm | varchar(8000) | YES |
| 62 | dm_receive_cust | varchar(8000) | YES |
| 63 | reg_shop_cd | varchar(8000) | YES |
| 64 | last_contact_date | datetime2 | YES |
| 65 | tr_zip_reg | varchar(8000) | YES |
| 66 | tr_addr_reg | varchar(8000) | YES |
| 67 | tr_addr_no_reg | varchar(8000) | YES |
| 68 | tr_addr_reg_flag | varchar(8000) | YES |
| 69 | tr_addr_reg_insert_flag | varchar(8000) | YES |
| 70 | tr_addr_reg_bld_no | varchar(8000) | YES |
| 71 | tr_addr_reg_result | varchar(8000) | YES |
| 72 | tr_zip_fact | varchar(8000) | YES |
| 73 | tr_addr_fact | varchar(8000) | YES |
| 74 | tr_addr_no_fact | varchar(8000) | YES |
| 75 | tr_addr_fact_flag | varchar(8000) | YES |
| 76 | tr_addr_fact_insert_flag | varchar(8000) | YES |
| 77 | tr_addr_fact_bld_no | varchar(8000) | YES |
| 78 | tr_addr_fact_result | varchar(8000) | YES |
| 79 | tr_zip_office | varchar(8000) | YES |
| 80 | tr_addr_office | varchar(8000) | YES |
| 81 | tr_addr_no_office | varchar(8000) | YES |
| 82 | tr_addr_office_flag | varchar(8000) | YES |
| 83 | tr_addr_office_insert_flag | varchar(8000) | YES |
| 84 | tr_addr_office_bld_no | varchar(8000) | YES |
| 85 | tr_addr_office_result | varchar(8000) | YES |
| 86 | reg_addr_loc_x | varchar(8000) | YES |
| 87 | reg_addr_loc_y | varchar(8000) | YES |
| 88 | result | varchar(8000) | YES |
| 89 | corp_no | varchar(8000) | YES |
| 90 | office_fax_area | varchar(8000) | YES |
| 91 | office_fax_no | varchar(8000) | YES |
| 92 | u_car_cust_type | varchar(8000) | YES |
| 93 | ecrb_act_yn | varchar(8000) | YES |
| 94 | dz_vendor_site_id | varchar(8000) | YES |
| 95 | app_flag | varchar(8000) | YES |
| 96 | ci_seq | decimal(28,10) | YES |
| 97 | consign_sales_flag | varchar(8000) | YES |
| 98 | del_dt | datetime2 | YES |
| 99 | del_user_id | varchar(8000) | YES |
| 100 | del_type | varchar(8000) | YES |
| 101 | cust_ci | varchar(8000) | YES |
| 102 | ci_reg_dt | datetime2 | YES |
| 103 | ci_upd_dt | datetime2 | YES |
| 104 | ci_remark | varchar(8000) | YES |
| 105 | realnm_seq | decimal(28,10) | YES |
| 106 | oneid_key | decimal(28,10) | YES |
| 107 | concern_degree | varchar(8000) | YES |
| 108 | taxpay_no_ymd | decimal(28,10) | YES |
| 109 | taxpay_no_g | decimal(28,10) | YES |
| 110 | chief_id_dec | varchar(8000) | YES |
| 111 | corp_no_dec | varchar(8000) | YES |
| 112 | taxpay_no_dec | varchar(8000) | YES |
| 113 | by_lead_yn | varchar(8000) | YES |
| 114 | source_system | varchar(8000) | YES |
| 115 | elt_time | varchar(8000) | YES |

#### tdms.CU_FAMILY

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(28,10) | YES |
| 2 | family_seq | decimal(28,10) | YES |
| 3 | family_cd | varchar(8000) | YES |
| 4 | family_name | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | sex_cd | varchar(8000) | YES |
| 7 | mng_sc_id | varchar(8000) | YES |
| 8 | birth_dt | varchar(8000) | YES |
| 9 | tel_area | varchar(8000) | YES |
| 10 | tel_no | varchar(8000) | YES |
| 11 | email | varchar(8000) | YES |
| 12 | email_domain | varchar(8000) | YES |
| 13 | hp_area | varchar(8000) | YES |
| 14 | hp_no | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | memo | varchar(8000) | YES |
| 20 | fam_cust_seq | decimal(28,10) | YES |
| 21 | info_yn | varchar(8000) | YES |
| 22 | family_taxpay_no | varchar(8000) | YES |
| 23 | family_zip_reg | varchar(8000) | YES |
| 24 | family_addr_reg | varchar(8000) | YES |
| 25 | family_addr_no_reg | varchar(8000) | YES |
| 26 | tr_zip_reg | varchar(8000) | YES |
| 27 | tr_addr_reg | varchar(8000) | YES |
| 28 | tr_addr_no_reg | varchar(8000) | YES |
| 29 | tr_addr_reg_flag | varchar(8000) | YES |
| 30 | tr_addr_reg_insert_flag | varchar(8000) | YES |
| 31 | tr_addr_reg_bld_no | varchar(8000) | YES |
| 32 | tr_addr_reg_result | varchar(8000) | YES |
| 33 | drving_yn | varchar(8000) | YES |
| 34 | luso_type | varchar(8000) | YES |
| 35 | last_link_contract_no | decimal(28,10) | YES |
| 36 | lpm_user_no | decimal(28,6) | YES |
| 37 | cust_contact_yn | varchar(8000) | YES |
| 38 | family_taxpay_no_dec | varchar(8000) | YES |
| 39 | del_yn | varchar(8000) | YES |
| 40 | ci | varchar(8000) | YES |
| 41 | ci_upd_dt | datetime2 | YES |
| 42 | city | varchar(8000) | YES |
| 43 | gu | varchar(8000) | YES |
| 44 | source_system | varchar(8000) | YES |
| 45 | elt_time | varchar(8000) | YES |

#### tdms.ECRB_EXCLUDE_VIN

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | delivery_month | varchar(8000) | YES |
| 2 | vin | varchar(8000) | YES |
| 3 | service_type_cd | varchar(8000) | YES |
| 4 | dealer_id | varchar(8000) | YES |
| 5 | reg_dt | datetime2 | YES |
| 6 | reg_user_id | varchar(8000) | YES |
| 7 | reason | varchar(8000) | YES |
| 8 | source_system | varchar(8000) | YES |
| 9 | elt_time | varchar(8000) | YES |

#### tdms.IF_AR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | interface_id | decimal(28,10) | YES |
| 2 | group_id | decimal(28,10) | YES |
| 3 | company_code | varchar(8000) | YES |
| 4 | org_id | decimal(28,10) | YES |
| 5 | location_id | decimal(28,10) | YES |
| 6 | dealer_id | varchar(8000) | YES |
| 7 | module | varchar(8000) | YES |
| 8 | trx_type | varchar(8000) | YES |
| 9 | trx_flag | varchar(8000) | YES |
| 10 | line_attribute1 | varchar(8000) | YES |
| 11 | line_attribute2 | varchar(8000) | YES |
| 12 | line_attribute3 | varchar(8000) | YES |
| 13 | line_desc | varchar(8000) | YES |
| 14 | org_person_flag | varchar(8000) | YES |
| 15 | client_org_id | decimal(28,10) | YES |
| 16 | client_location_id | decimal(28,10) | YES |
| 17 | client_dealer_id | varchar(8000) | YES |
| 18 | cust_seq | decimal(28,10) | YES |
| 19 | comp_seq | decimal(28,6) | YES |
| 20 | registration_num | varchar(8000) | YES |
| 21 | currency_code | varchar(8000) | YES |
| 22 | conversion_date | datetime2 | YES |
| 23 | conversion_type | varchar(8000) | YES |
| 24 | conversion_rate | decimal(28,10) | YES |
| 25 | trx_date | datetime2 | YES |
| 26 | gl_date | datetime2 | YES |
| 27 | term_id | decimal(28,10) | YES |
| 28 | quantity | decimal(28,10) | YES |
| 29 | unit_selling_price | decimal(28,10) | YES |
| 30 | amount | decimal(28,10) | YES |
| 31 | vat_tax_id | decimal(28,10) | YES |
| 32 | vat_amount | decimal(28,10) | YES |
| 33 | vat_tax_count | varchar(8000) | YES |
| 34 | salesrep_num | varchar(8000) | YES |
| 35 | segment5 | varchar(8000) | YES |
| 36 | status | varchar(8000) | YES |
| 37 | error_code | varchar(8000) | YES |
| 38 | reg_dt | datetime2 | YES |
| 39 | reg_user_id | varchar(8000) | YES |
| 40 | upd_dt | datetime2 | YES |
| 41 | upd_user_id | varchar(8000) | YES |
| 42 | client_name | varchar(8000) | YES |
| 43 | invoice_amount | decimal(28,10) | YES |
| 44 | surtax_itemname1 | varchar(8000) | YES |
| 45 | transaction_type_code | varchar(8000) | YES |
| 46 | transaction_type_data | varchar(8000) | YES |
| 47 | transaction_sub_type_code | varchar(8000) | YES |
| 48 | transaction_sub_type_data | varchar(8000) | YES |
| 49 | sob_id | bigint | YES |
| 50 | amount_gl | decimal(28,10) | YES |
| 51 | lookup_nm | varchar(8000) | YES |
| 52 | trans_yn | varchar(8000) | YES |
| 53 | status_comp | varchar(8000) | YES |
| 54 | interface_dt | datetime2 | YES |
| 55 | trx_group | varchar(8000) | YES |
| 56 | del_flag | varchar(8000) | YES |
| 57 | dms_trx_id | decimal(28,10) | YES |
| 58 | org_shop_cd | varchar(8000) | YES |
| 59 | memo | varchar(8000) | YES |
| 60 | interface_id_acnt | decimal(28,10) | YES |
| 61 | brand | varchar(8000) | YES |
| 62 | sfx_cd | varchar(8000) | YES |
| 63 | biz_reg_no | varchar(8000) | YES |
| 64 | process_id | decimal(28,6) | YES |
| 65 | tyt_interface_h_id | decimal(28,6) | YES |
| 66 | legacy_confirm_status | varchar(8000) | YES |
| 67 | dz_pc_cd | varchar(8000) | YES |
| 68 | dz_comp_cd | varchar(8000) | YES |
| 69 | dz_bizarea_cd | varchar(8000) | YES |
| 70 | dz_wdept_cd | varchar(8000) | YES |
| 71 | dz_write_id | varchar(8000) | YES |
| 72 | prod_loc | varchar(8000) | YES |
| 73 | dz_docu_no | varchar(8000) | YES |
| 74 | vin | varchar(8000) | YES |
| 75 | dz_tax_status | varchar(8000) | YES |
| 76 | dz_tax_sum_no | varchar(8000) | YES |
| 77 | dz_tax_docu_no | varchar(8000) | YES |
| 78 | dz_tax_sum_dt | datetime2 | YES |
| 79 | dz_tax_docu_dt | datetime2 | YES |
| 80 | dz_cc_cd | varchar(8000) | YES |
| 81 | pre_rcpt_yn | varchar(8000) | YES |
| 82 | if_confirm_status | varchar(8000) | YES |
| 83 | family_seq | decimal(28,6) | YES |
| 84 | source_system | varchar(8000) | YES |
| 85 | elt_time | varchar(8000) | YES |

#### tdms.OM_CONTRACT

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(28,10) | YES | 계약번호 |
| 2 | dlr_contract_no | varchar(8000) | YES | 번호 |
| 3 | contract_dt | varchar(8000) | YES | 계약일 |
| 4 | contract_stat_cd | varchar(8000) | YES | 계약 |
| 5 | sold_yn | varchar(8000) | YES | 여부(Y/N) |
| 6 | urgent_yn | varchar(8000) | YES | 여부(Y/N) |
| 7 | allocation_yn | varchar(8000) | YES | 여부(Y/N) |
| 8 | status_mod_dt | varchar(8000) | YES | 수정일 |
| 9 | cond_mod_yn | varchar(8000) | YES | 여부(Y/N) |
| 10 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 11 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 12 | user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 13 | owner_type | varchar(8000) | YES | 유형코드 |
| 14 | cust_seq | decimal(28,10) | YES | 고객 |
| 15 | comp_seq | decimal(28,10) | YES | 순번 |
| 16 | real_cust_seq | decimal(28,10) | YES | 고객 |
| 17 | owner_seq | decimal(28,10) | YES | 순번 |
| 18 | customs_seq | decimal(28,10) | YES | 고객 |
| 19 | brand_cd | varchar(8000) | YES | 브랜드 |
| 20 | model_cd | varchar(8000) | YES | 모델 코드 |
| 21 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 22 | my_cd | varchar(8000) | YES | 코드 |
| 23 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 24 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 25 | option_cd | varchar(8000) | YES | 코드 |
| 26 | option_cd2 | varchar(8000) | YES |  |
| 27 | option_cd3 | varchar(8000) | YES |  |
| 28 | option_cd4 | varchar(8000) | YES |  |
| 29 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 30 | vehic_magic | decimal(28,10) | YES | 차량 |
| 31 | vehic_price | decimal(28,10) | YES | 차량가격 |
| 32 | vehic_vat | decimal(28,10) | YES | 차량 |
| 33 | vehic_option_price | decimal(28,10) | YES | 차량가격 |
| 34 | vehic_color_price | decimal(28,10) | YES | 색상 |
| 35 | vehic_discount_amt | decimal(28,10) | YES | 차량 |
| 36 | vehic_total_amt | decimal(28,10) | YES | 차량 |
| 37 | deposit_amt | decimal(28,10) | YES | 계약금 |
| 38 | sales_type | varchar(8000) | YES | 판매 |
| 39 | pay_type | varchar(8000) | YES | 유형코드 |
| 40 | tax_type | decimal(28,10) | YES | 유형코드 |
| 41 | lease_comp_seq | decimal(28,10) | YES | 순번 |
| 42 | reg_free_yn | varchar(8000) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(8000) | YES | 재고 |
| 44 | reg_stock_rate | decimal(28,10) | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(8000) | YES | 재고 |
| 46 | reg_agency_yn | varchar(8000) | YES | 등록 |
| 47 | reg_tax | decimal(28,10) | YES | 등록 |
| 48 | reg_stock_price | decimal(28,10) | YES | 가격 |
| 49 | reg_stamp_price | decimal(28,10) | YES | 가격 |
| 50 | reg_plate_price | decimal(28,10) | YES | 가격 |
| 51 | reg_fee | decimal(28,10) | YES | 등록 |
| 52 | reg_aquisition_tax | decimal(28,10) | YES | 등록 |
| 53 | reg_special_tax | decimal(28,10) | YES | 등록 |
| 54 | reg_education_tax | decimal(28,10) | YES | 등록 |
| 55 | reg_total_amt | decimal(28,10) | YES | 총 금액 |
| 56 | take_contract_amt | decimal(28,10) | YES | 금액 |
| 57 | take_delivery_amt | decimal(28,10) | YES | 금액 |
| 58 | lease_month_amt | decimal(28,10) | YES | 금액 |
| 59 | lease_term_dt | varchar(8000) | YES | 일자 |
| 60 | lease_rate | decimal(5,2) | YES |  |
| 61 | take_depositer_nm | varchar(8000) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(8000) | YES | 계약금 |
| 63 | side_stamp_price | decimal(28,10) | YES | 가격 |
| 64 | side_setup_amt | decimal(28,10) | YES | 금액 |
| 65 | side_fee | decimal(28,10) | YES |  |
| 66 | side_total_amt | decimal(28,10) | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(8000) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(8000) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(8000) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(8000) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(8000) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(8000) | YES | 출고 |
| 73 | request_by | varchar(8000) | YES |  |
| 74 | request_dt | datetime2 | YES | 일자 |
| 75 | approval_by | varchar(8000) | YES |  |
| 76 | approval_dt | datetime2 | YES | 일자 |
| 77 | cancel_by | varchar(8000) | YES | 취소 |
| 78 | cancel_dt | datetime2 | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(8000) | YES | 판매 |
| 80 | last_issued_dt | varchar(8000) | YES | 일자 |
| 81 | last_mod_dt | varchar(8000) | YES | 수정일 |
| 82 | delivery_request_by | varchar(8000) | YES | 출고 |
| 83 | delivery_request_dt | datetime2 | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(8000) | YES | 출고 |
| 85 | delivery_cancel_dt | datetime2 | YES | 출고일 |
| 86 | delivery_plan_by | varchar(8000) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(8000) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(8000) | YES | 출고 |
| 89 | delivery_approval_dt | datetime2 | YES | 출고일 |
| 90 | reg_plan_dt | varchar(8000) | YES | 등록일 |
| 91 | contract_msg | varchar(8000) | YES | 계약 |
| 92 | vehic_reg_no | varchar(8000) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(8000) | YES | 차량 |
| 94 | dept_cd | varchar(8000) | YES | 코드 |
| 95 | boc_except_dt | varchar(8000) | YES | 일자 |
| 96 | reg_dt | datetime2 | YES | 등록일 |
| 97 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 98 | upd_dt | datetime2 | YES | 수정일 |
| 99 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(8000) | YES | 여부(Y/N) |
| 101 | allocation_dt | datetime2 | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(8000) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(8000) | YES | 고객 |
| 104 | rs_cust_addr | varchar(8000) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(8000) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(8000) | YES |  |
| 107 | rs_geo_loc_y | varchar(8000) | YES |  |
| 108 | potential_division | varchar(8000) | YES |  |
| 109 | org_followup_id | decimal(28,6) | YES | 식별자(ID) |
| 110 | plate_size | varchar(8000) | YES |  |
| 111 | receiver_apply_yn | varchar(8000) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(8000) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(8000) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(8000) | YES | 번호 |
| 115 | receiver_ssn | varchar(8000) | YES |  |
| 116 | pma_yn | varchar(8000) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(8000) | YES | 고객번호 |
| 118 | family_seq | decimal(28,10) | YES | 순번 |
| 119 | lemon_yn | varchar(8000) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(8000) | YES |  |
| 121 | app_flag | varchar(8000) | YES |  |
| 122 | consign_sales_flag | varchar(8000) | YES | 판매 |
| 123 | contract_msg_kr | varchar(8000) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(8000) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(8000) | YES | 고객 |
| 126 | realnm_seq | decimal(28,10) | YES | 순번 |
| 127 | tax_biz_no | varchar(8000) | YES | 번호 |
| 128 | pma_city | varchar(8000) | YES | 시 |
| 129 | pma_gu | varchar(8000) | YES | 구 |
| 130 | taxpay_no_ymd | decimal(28,10) | YES |  |
| 131 | taxpay_no_g | decimal(28,10) | YES |  |
| 132 | flood_yn | varchar(8000) | YES | 여부(Y/N) |
| 133 | lead_id | decimal(28,0) | YES | 식별자(ID) |
| 134 | smart_upd_cnt | decimal(28,0) | YES |  |
| 135 | dms_upd_cnt | decimal(28,0) | YES |  |
| 136 | source_system | varchar(8000) | YES |  |
| 137 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.OM_CONTRACT_CUST

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(28,10) | YES | 계약번호 |
| 2 | owner_type | varchar(8000) | YES | 유형코드 |
| 3 | cust_nm | varchar(8000) | YES | 고객 |
| 4 | cust_ssn_id | varchar(8000) | YES | 고객 |
| 5 | cust_email | varchar(8000) | YES | 고객 |
| 6 | cust_tel_full | varchar(8000) | YES | 고객 |
| 7 | cust_mobile_tel_full | varchar(8000) | YES | 고객 |
| 8 | cust_zip | varchar(8000) | YES | 고객 |
| 9 | cust_adr | varchar(8000) | YES | 고객 |
| 10 | cust_detail_adr | varchar(8000) | YES | 고객 |
| 11 | comp_nm | varchar(8000) | YES | 명칭 |
| 12 | comp_biz_reg_no | varchar(8000) | YES | 등록 |
| 13 | comp_email | varchar(8000) | YES |  |
| 14 | comp_tel_full | varchar(8000) | YES |  |
| 15 | comp_zip | varchar(8000) | YES |  |
| 16 | comp_adr | varchar(8000) | YES |  |
| 17 | comp_detail_adr | varchar(8000) | YES |  |
| 18 | lease_nm | varchar(8000) | YES | 명칭 |
| 19 | lease_biz_reg_no | varchar(8000) | YES | 등록 |
| 20 | lease_email | varchar(8000) | YES |  |
| 21 | lease_tel_full | varchar(8000) | YES |  |
| 22 | lease_zip | varchar(8000) | YES |  |
| 23 | lease_adr | varchar(8000) | YES |  |
| 24 | lease_detail_adr | varchar(8000) | YES |  |
| 25 | pma_city | varchar(8000) | YES | 시 |
| 26 | pma_gu | varchar(8000) | YES | 구 |
| 27 | source_system | varchar(8000) | YES |  |
| 28 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.OM_PMA

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer_id | varchar(8000) | YES |
| 2 | city | varchar(8000) | YES |
| 3 | gu | varchar(8000) | YES |
| 4 | reg_user_id | varchar(8000) | YES |
| 5 | reg_dt | datetime2 | YES |
| 6 | upd_user_id | varchar(8000) | YES |
| 7 | upd_dt | datetime2 | YES |
| 8 | use_yn | varchar(8000) | YES |
| 9 | source_system | varchar(8000) | YES |
| 10 | elt_time | varchar(8000) | YES |

#### tdms.PT_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(8000) | YES | 부품번호 |
| 2 | part_nm | varchar(8000) | YES | 부품 |
| 3 | splr_cd | varchar(8000) | YES | 코드 |
| 4 | franchise_cd | varchar(8000) | YES | 코드 |
| 5 | impt_cd | varchar(8000) | YES | 코드 |
| 6 | prod_cd | varchar(8000) | YES | 코드 |
| 7 | subs_cd_old | varchar(8000) | YES |  |
| 8 | subs_part_no_old | varchar(8000) | YES | 부품번호 |
| 9 | subs_cd_new | varchar(8000) | YES |  |
| 10 | subs_part_no_new | varchar(8000) | YES | 부품번호 |
| 11 | lk | varchar(8000) | YES |  |
| 12 | stop_sale_cd | varchar(8000) | YES | 판매 |
| 13 | non_re_order_cd | varchar(8000) | YES | 주문 |
| 14 | pnc | varchar(8000) | YES |  |
| 15 | epc_fig_no | varchar(8000) | YES | 번호 |
| 16 | tariff_cd | varchar(8000) | YES | 코드 |
| 17 | all_time_buy_cd | varchar(8000) | YES | 코드 |
| 18 | stock_type | varchar(8000) | YES | 재고 |
| 19 | prod_start_dt | varchar(8000) | YES | 시작일 |
| 20 | prod_end_dt | varchar(8000) | YES | 종료일 |
| 21 | rp_drct | bigint | YES |  |
| 22 | price_group_cd | varchar(8000) | YES | 가격 |
| 23 | price_fmla_cd | varchar(8000) | YES | 가격 |
| 24 | net_weit | decimal(13,2) | YES |  |
| 25 | prod_lot | varchar(8000) | YES |  |
| 26 | case_lot | varchar(8000) | YES |  |
| 27 | rack_type | varchar(8000) | YES | 유형코드 |
| 28 | ideal_qty_per_box | bigint | YES | 수량 |
| 29 | no_of_used_box | bigint | YES |  |
| 30 | part_no_edit_cd | varchar(8000) | YES | 부품번호 |
| 31 | tmc_non_stock_cd | varchar(8000) | YES | 재고 |
| 32 | local_yn | varchar(8000) | YES | 여부(Y/N) |
| 33 | cons_part_yn | varchar(8000) | YES | 부품 |
| 34 | ssq_auto_yn | varchar(8000) | YES | 여부(Y/N) |
| 35 | purc_unit | varchar(8000) | YES |  |
| 36 | sale_unit | varchar(8000) | YES | 판매 |
| 37 | conv_qty | bigint | YES | 수량 |
| 38 | order_unit_qty | bigint | YES | 수량 |
| 39 | pick_slip_unit_qty | bigint | YES | 수량 |
| 40 | bin_slip_unit_qty | bigint | YES | 수량 |
| 41 | barc_no | varchar(8000) | YES | 번호 |
| 42 | wide | bigint | YES |  |
| 43 | leng | bigint | YES |  |
| 44 | heit | bigint | YES |  |
| 45 | size_type | varchar(8000) | YES | 유형코드 |
| 46 | part_reg_dt | varchar(8000) | YES | 부품 |
| 47 | group_cd | varchar(8000) | YES | 코드 |
| 48 | use_yn | varchar(8000) | YES | 여부(Y/N) |
| 49 | key_part_yn | varchar(8000) | YES | 부품 |
| 50 | key_kind | varchar(8000) | YES |  |
| 51 | fax_part_yn | varchar(8000) | YES | 부품 |
| 52 | order_unit_auto_set_yn | varchar(8000) | YES | 주문 |
| 53 | oil_purc_yn | varchar(8000) | YES | 여부(Y/N) |
| 54 | unit_pack_qty | bigint | YES | 수량 |
| 55 | usage_type | varchar(8000) | YES | 유형코드 |
| 56 | note | varchar(8000) | YES |  |
| 57 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 58 | reg_dt | datetime2 | YES | 등록일 |
| 59 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 60 | upd_dt | datetime2 | YES | 수정일 |
| 61 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 62 | lexus_price_app_flag | varchar(8000) | YES | 가격 |
| 63 | pre_order_yn | varchar(8000) | YES | 주문 |
| 64 | brandship | varchar(8000) | YES | 브랜드 |
| 65 | hs_code | varchar(8000) | YES | 코드 |
| 66 | coo | varchar(8000) | YES |  |
| 67 | first_prod_user | varchar(8000) | YES |  |
| 68 | part_nm_kor | varchar(8000) | YES | 부품 |
| 69 | racode | varchar(8000) | YES | 코드 |
| 70 | jsp | varchar(8000) | YES |  |
| 71 | source_system | varchar(8000) | YES |  |
| 72 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.PT_SOUT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | sout_no | varchar(8000) | YES |
| 3 | sout_dt | varchar(8000) | YES |
| 4 | sout_type | varchar(8000) | YES |
| 5 | sout_kind | varchar(8000) | YES |
| 6 | stat | varchar(8000) | YES |
| 7 | sout_fini_yn | varchar(8000) | YES |
| 8 | sout_cnfm_dt | varchar(8000) | YES |
| 9 | invo_dt | varchar(8000) | YES |
| 10 | svc_shop_cd | varchar(8000) | YES |
| 11 | svc_propo_dt | varchar(8000) | YES |
| 12 | svc_propo_seq | decimal(28,10) | YES |
| 13 | acnt_link_yn | varchar(8000) | YES |
| 14 | acnt_link_dt | varchar(8000) | YES |
| 15 | acnt_link_file | varchar(8000) | YES |
| 16 | acnt_link_key | bigint | YES |
| 17 | dest | varchar(8000) | YES |
| 18 | auto_crea_yn | varchar(8000) | YES |
| 19 | sout_sply_amt | bigint | YES |
| 20 | dc_rate | decimal(5,2) | YES |
| 21 | dc_amt | bigint | YES |
| 22 | sale_amt | bigint | YES |
| 23 | sout_vat_amt | bigint | YES |
| 24 | fina_amt | bigint | YES |
| 25 | pay_type | varchar(8000) | YES |
| 26 | svc_sale_type | varchar(8000) | YES |
| 27 | cust_no | varchar(8000) | YES |
| 28 | cust_nm | varchar(8000) | YES |
| 29 | cust_seq | bigint | YES |
| 30 | comp_seq | bigint | YES |
| 31 | cust_kind | varchar(8000) | YES |
| 32 | vin | varchar(8000) | YES |
| 33 | vehic_no1 | varchar(8000) | YES |
| 34 | vehic_no2 | varchar(8000) | YES |
| 35 | addr1 | varchar(8000) | YES |
| 36 | addr2 | varchar(8000) | YES |
| 37 | addr3 | varchar(8000) | YES |
| 38 | tel_area1 | varchar(8000) | YES |
| 39 | tel_no1 | varchar(8000) | YES |
| 40 | tel_area2 | varchar(8000) | YES |
| 41 | tel_no2 | varchar(8000) | YES |
| 42 | upd_yn | varchar(8000) | YES |
| 43 | cncl_yn | varchar(8000) | YES |
| 44 | internal_usage | varchar(8000) | YES |
| 45 | remark | varchar(8000) | YES |
| 46 | rcit_dt | varchar(8000) | YES |
| 47 | rcit_amt | bigint | YES |
| 48 | term_id | bigint | YES |
| 49 | tax_type | bigint | YES |
| 50 | tax_rate | decimal(5,2) | YES |
| 51 | biz_reg_no | varchar(8000) | YES |
| 52 | twc_stat | varchar(8000) | YES |
| 53 | tax_cust_seq | bigint | YES |
| 54 | payback_yn | varchar(8000) | YES |
| 55 | receipt_key | decimal(28,10) | YES |
| 56 | ar_key | decimal(28,10) | YES |
| 57 | base_sale_dt | varchar(8000) | YES |
| 58 | biz_shop_cd | varchar(8000) | YES |
| 59 | biz_no | varchar(8000) | YES |
| 60 | dealer_id | varchar(8000) | YES |
| 61 | reg_dt | datetime2 | YES |
| 62 | reg_user_id | varchar(8000) | YES |
| 63 | upd_dt | datetime2 | YES |
| 64 | upd_user_id | varchar(8000) | YES |
| 65 | invo_print_yn | varchar(8000) | YES |
| 66 | invo_print_day | varchar(8000) | YES |
| 67 | quot_no | varchar(8000) | YES |
| 68 | biz_reg_no_dec | varchar(8000) | YES |
| 69 | source_system | varchar(8000) | YES |
| 70 | elt_time | varchar(8000) | YES |

#### tdms.PT_SOUT_DETL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | sout_no | varchar(8000) | YES |
| 3 | line_no | int | YES |
| 4 | part_no | varchar(8000) | YES |
| 5 | sout_order_qty | bigint | YES |
| 6 | pick_qty | bigint | YES |
| 7 | sout_qty | bigint | YES |
| 8 | sout_cnfm_qty | bigint | YES |
| 9 | sout_dt | varchar(8000) | YES |
| 10 | sout_cnfm_dt | varchar(8000) | YES |
| 11 | sout_unit | varchar(8000) | YES |
| 12 | conv_qty | bigint | YES |
| 13 | sout_price | bigint | YES |
| 14 | sout_amt | bigint | YES |
| 15 | dc_rate | decimal(5,2) | YES |
| 16 | dc_amt | bigint | YES |
| 17 | sale_price | bigint | YES |
| 18 | sale_amt | bigint | YES |
| 19 | sout_vat_amt | bigint | YES |
| 20 | fina_amt | bigint | YES |
| 21 | stock_price_at_sout | bigint | YES |
| 22 | stock_amt_at_sout | bigint | YES |
| 23 | sout_start_day | varchar(8000) | YES |
| 24 | sout_end_day | varchar(8000) | YES |
| 25 | stat | varchar(8000) | YES |
| 26 | sout_man | varchar(8000) | YES |
| 27 | sout_fini_yn | varchar(8000) | YES |
| 28 | rcit_man | varchar(8000) | YES |
| 29 | svc_sout_kind | varchar(8000) | YES |
| 30 | cncl_qty | bigint | YES |
| 31 | cncl_yn | varchar(8000) | YES |
| 32 | cons_stock_use_yn | varchar(8000) | YES |
| 33 | cons_splr_cd | varchar(8000) | YES |
| 34 | remark | varchar(8000) | YES |
| 35 | svc_shop_cd | varchar(8000) | YES |
| 36 | svc_propo_dt | varchar(8000) | YES |
| 37 | svc_propo_seq | decimal(28,10) | YES |
| 38 | svc_part_no | varchar(8000) | YES |
| 39 | svc_part_seq | decimal(28,10) | YES |
| 40 | twc_stat | varchar(8000) | YES |
| 41 | payback_yn | varchar(8000) | YES |
| 42 | payback_qty | bigint | YES |
| 43 | biz_shop_cd | varchar(8000) | YES |
| 44 | biz_no | varchar(8000) | YES |
| 45 | biz_detl_line_no | int | YES |
| 46 | reg_dt | datetime2 | YES |
| 47 | reg_user_id | varchar(8000) | YES |
| 48 | upd_dt | datetime2 | YES |
| 49 | upd_user_id | varchar(8000) | YES |
| 50 | cancel_receipt_dt | varchar(8000) | YES |
| 51 | source_system | varchar(8000) | YES |
| 52 | elt_time | varchar(8000) | YES |

#### tdms.SVC_BP_PROC_TIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,6) | YES |
| 4 | proc_type_cd | varchar(8000) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(8000) | YES |
| 7 | stall_no | decimal(28,6) | YES |
| 8 | expt_st_dt | datetime2 | YES |
| 9 | expt_end_dt | datetime2 | YES |
| 10 | real_st_dt | datetime2 | YES |
| 11 | real_end_dt | datetime2 | YES |
| 12 | stat_cd | varchar(8000) | YES |
| 13 | cancel_reason_cd | varchar(8000) | YES |
| 14 | tot_rest_minutes | decimal(28,6) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | re_repair_yn | varchar(8000) | YES |
| 20 | qc_close_yn | varchar(8000) | YES |
| 21 | work_seq_next | int | YES |
| 22 | source_system | varchar(8000) | YES |
| 23 | elt_time | varchar(8000) | YES |

#### tdms.SVC_DLR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | twc_no | varchar(8000) | YES |
| 3 | propo_dt | varchar(8000) | YES |
| 4 | propo_seq | decimal(28,0) | YES |
| 5 | grp_no | decimal(28,0) | YES |
| 6 | settle_type_cd | varchar(8000) | YES |
| 7 | warranty_type_cd | varchar(8000) | YES |
| 8 | operation_type_cd | varchar(8000) | YES |
| 9 | data_id | varchar(8000) | YES |
| 10 | nv_flag | varchar(8000) | YES |
| 11 | f_vehic_flag | varchar(8000) | YES |
| 12 | fr_cd | varchar(8000) | YES |
| 13 | wmi | varchar(8000) | YES |
| 14 | vds | varchar(8000) | YES |
| 15 | vcd | varchar(8000) | YES |
| 16 | vis | varchar(8000) | YES |
| 17 | delivery_date | varchar(8000) | YES |
| 18 | repair_date | varchar(8000) | YES |
| 19 | repair_end_date | varchar(8000) | YES |
| 20 | odometer | int | YES |
| 21 | main_frm_no | varchar(8000) | YES |
| 22 | local_cause_part_flag | varchar(8000) | YES |
| 23 | cause_part_no | varchar(8000) | YES |
| 24 | apply_charge_amt | decimal(28,0) | YES |
| 25 | pwr | decimal(5,2) | YES |
| 26 | lwr | decimal(5,2) | YES |
| 27 | tot_labor_mh | decimal(4,1) | YES |
| 28 | tot_labor_amt | decimal(28,1) | YES |
| 29 | tot_part_amt | decimal(28,6) | YES |
| 30 | tot_sublet_amt | decimal(28,6) | YES |
| 31 | t1_cd | varchar(8000) | YES |
| 32 | t2_type_cd | varchar(8000) | YES |
| 33 | t2_cd | varchar(8000) | YES |
| 34 | t3_cd_1 | varchar(8000) | YES |
| 35 | t3_cd_2 | varchar(8000) | YES |
| 36 | t3_cd_3 | varchar(8000) | YES |
| 37 | t3_cd_4 | varchar(8000) | YES |
| 38 | t3_cd_5 | varchar(8000) | YES |
| 39 | t3_cd_6 | varchar(8000) | YES |
| 40 | t3_cd_7 | varchar(8000) | YES |
| 41 | sublet_expl | varchar(8000) | YES |
| 42 | sublet_expl_2 | varchar(8000) | YES |
| 43 | condition | varchar(8000) | YES |
| 44 | cause | varchar(8000) | YES |
| 45 | remedy | varchar(8000) | YES |
| 46 | tsb_no | varchar(8000) | YES |
| 47 | prev_shop_cd | varchar(8000) | YES |
| 48 | prev_propo_dt | varchar(8000) | YES |
| 49 | prev_propo_seq | decimal(28,6) | YES |
| 50 | prev_odometer | int | YES |
| 51 | prev_repair_date | varchar(8000) | YES |
| 52 | cr_no | varchar(8000) | YES |
| 53 | stat_cd | varchar(8000) | YES |
| 54 | stat_chng_user_id | varchar(8000) | YES |
| 55 | stat_chng_dt | datetime2 | YES |
| 56 | write_dt | datetime2 | YES |
| 57 | rqst_invoice_no | varchar(8000) | YES |
| 58 | rqst_dt | datetime2 | YES |
| 59 | rqst_cnt | int | YES |
| 60 | rqst_lvl | varchar(8000) | YES |
| 61 | sys_judge_dt | datetime2 | YES |
| 62 | sys_judge_cd | varchar(8000) | YES |
| 63 | tmkr_judge_dt | datetime2 | YES |
| 64 | tmkr_judge_cd | varchar(8000) | YES |
| 65 | aprov_labor_amt | decimal(28,0) | YES |
| 66 | aprov_part_amt | decimal(28,0) | YES |
| 67 | aprov_sublet_amt | decimal(28,0) | YES |
| 68 | aprov_tot_amt | decimal(28,0) | YES |
| 69 | twc_remark | varchar(8000) | YES |
| 70 | twc_close_yn | varchar(8000) | YES |
| 71 | twc_close_dt | datetime2 | YES |
| 72 | twc_review_yn | varchar(8000) | YES |
| 73 | file_path_1 | varchar(8000) | YES |
| 74 | file_nm_1 | varchar(8000) | YES |
| 75 | file_path_2 | varchar(8000) | YES |
| 76 | file_nm_2 | varchar(8000) | YES |
| 77 | file_path_3 | varchar(8000) | YES |
| 78 | file_nm_3 | varchar(8000) | YES |
| 79 | sout_no | varchar(8000) | YES |
| 80 | prev_inv | varchar(8000) | YES |
| 81 | prev_sale_dt | varchar(8000) | YES |
| 82 | curr_inv | varchar(8000) | YES |
| 83 | curr_sale_dt | varchar(8000) | YES |
| 84 | prev_sout_no | varchar(8000) | YES |
| 85 | cr_case_no | int | YES |
| 86 | bat_test_cd_1 | varchar(8000) | YES |
| 87 | bat_test_cd_2 | varchar(8000) | YES |
| 88 | bat_test_cd_3 | varchar(8000) | YES |
| 89 | bat_test_cd_4 | varchar(8000) | YES |
| 90 | diag_cd_1 | varchar(8000) | YES |
| 91 | diag_cd_2 | varchar(8000) | YES |
| 92 | diag_cd_3 | varchar(8000) | YES |
| 93 | diag_cd_4 | varchar(8000) | YES |
| 94 | diag_cd_5 | varchar(8000) | YES |
| 95 | serial_cd_1 | varchar(8000) | YES |
| 96 | serial_cd_2 | varchar(8000) | YES |
| 97 | serial_cd_3 | varchar(8000) | YES |
| 98 | reg_dt | datetime2 | YES |
| 99 | reg_user_id | varchar(8000) | YES |
| 100 | upd_dt | datetime2 | YES |
| 101 | upd_user_id | varchar(8000) | YES |
| 102 | source_system | varchar(8000) | YES |
| 103 | elt_time | varchar(8000) | YES |

#### tdms.SVC_FRM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | frm_no | varchar(8000) | YES |
| 2 | frm_kor_nm | varchar(8000) | YES |
| 3 | frm_eng_nm | varchar(8000) | YES |
| 4 | work_type_cd | varchar(8000) | YES |
| 5 | frm_type_cd | varchar(8000) | YES |
| 6 | frm_grp_type_cd | varchar(8000) | YES |
| 7 | frm_grp_cd | varchar(8000) | YES |
| 8 | group_id | varchar(8000) | YES |
| 9 | local_yn | varchar(8000) | YES |
| 10 | use_stat_cd | varchar(8000) | YES |
| 11 | prefix | varchar(8000) | YES |
| 12 | suffix | varchar(8000) | YES |
| 13 | reg_dt | datetime2 | YES |
| 14 | reg_user_id | varchar(8000) | YES |
| 15 | upd_dt | datetime2 | YES |
| 16 | upd_user_id | varchar(8000) | YES |
| 17 | service_type_cd | varchar(8000) | YES |
| 18 | approve_yn | varchar(8000) | YES |
| 19 | wa_cd | varchar(8000) | YES |
| 20 | source_system | varchar(8000) | YES |
| 21 | elt_time | varchar(8000) | YES |

#### tdms.SVC_FRM_GRP

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | frm_type_cd | varchar(8000) | YES |
| 2 | frm_grp_type_cd | varchar(8000) | YES |
| 3 | frm_grp_cd | varchar(8000) | YES |
| 4 | frm_grp_kor_nm | varchar(8000) | YES |
| 5 | frm_grp_eng_nm | varchar(8000) | YES |
| 6 | use_yn | varchar(8000) | YES |
| 7 | reg_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_dt | datetime2 | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | source_system | varchar(8000) | YES |
| 12 | elt_time | varchar(8000) | YES |

#### tdms.SVC_INSU

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,6) | YES |
| 4 | insu_type_cd | varchar(8000) | YES |
| 5 | accident_type_cd | varchar(8000) | YES |
| 6 | harm_vehic_no1 | varchar(8000) | YES |
| 7 | harm_vehic_no2 | varchar(8000) | YES |
| 8 | stat_cd | varchar(8000) | YES |
| 9 | accident_dt | datetime2 | YES |
| 10 | rqst_dt | datetime2 | YES |
| 11 | tot_rqst_amt | decimal(28,6) | YES |
| 12 | tot_rqst_ar_amt | decimal(28,6) | YES |
| 13 | tot_aprov_amt | decimal(28,6) | YES |
| 14 | close_dt | datetime2 | YES |
| 15 | close_user_id | varchar(8000) | YES |
| 16 | close_cancel_yn | varchar(8000) | YES |
| 17 | remark | varchar(8000) | YES |
| 18 | file_path_1 | varchar(8000) | YES |
| 19 | file_nm_1 | varchar(8000) | YES |
| 20 | file_path_2 | varchar(8000) | YES |
| 21 | file_nm_2 | varchar(8000) | YES |
| 22 | file_path_3 | varchar(8000) | YES |
| 23 | file_nm_3 | varchar(8000) | YES |
| 24 | tax_cust_seq | decimal(28,6) | YES |
| 25 | tax_cust_idfy_no | varchar(8000) | YES |
| 26 | reg_dt | datetime2 | YES |
| 27 | reg_user_id | varchar(8000) | YES |
| 28 | upd_dt | datetime2 | YES |
| 29 | upd_user_id | varchar(8000) | YES |
| 30 | close_cancel_dt | datetime2 | YES |
| 31 | source_system | varchar(8000) | YES |
| 32 | elt_time | varchar(8000) | YES |

#### tdms.SVC_INSU_DTL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,6) | YES |
| 4 | comp_seq | decimal(28,6) | YES |
| 5 | insu_type_cd | varchar(8000) | YES |
| 6 | accident_rqst_no | varchar(8000) | YES |
| 7 | compensation_rate | decimal(5,2) | YES |
| 8 | prev_vat_yn | varchar(8000) | YES |
| 9 | prev_vat_amt | decimal(28,6) | YES |
| 10 | prev_vat_stat_cd | varchar(8000) | YES |
| 11 | prev_vat_stat_chng_dt | datetime2 | YES |
| 12 | prev_vat_stat_chng_user_id | varchar(8000) | YES |
| 13 | prev_vat_receipt_key | decimal(28,6) | YES |
| 14 | imt_amt | decimal(28,6) | YES |
| 15 | imt_amt_stat_cd | varchar(8000) | YES |
| 16 | imt_amt_stat_chng_dt | datetime2 | YES |
| 17 | imt_amt_stat_chng_user_id | varchar(8000) | YES |
| 18 | imt_amt_vat_yn | varchar(8000) | YES |
| 19 | imt_amt_receipt_key | decimal(28,6) | YES |
| 20 | imt_amt_ar_key | decimal(28,6) | YES |
| 21 | cust_pay_amt | decimal(28,6) | YES |
| 22 | cust_pay_stat_cd | varchar(8000) | YES |
| 23 | cust_pay_stat_chng_dt | datetime2 | YES |
| 24 | cust_pay_stat_chng_user_id | varchar(8000) | YES |
| 25 | cust_pay_vat_yn | varchar(8000) | YES |
| 26 | cust_pay_receipt_key | decimal(28,6) | YES |
| 27 | cust_pay_ar_key | decimal(28,6) | YES |
| 28 | append_amt | decimal(28,6) | YES |
| 29 | append_amt_stat_cd | varchar(8000) | YES |
| 30 | append_amt_stat_chng_dt | datetime2 | YES |
| 31 | append_amt_stat_chng_user_id | varchar(8000) | YES |
| 32 | append_amt_vat_yn | varchar(8000) | YES |
| 33 | append_amt_ar_key | decimal(28,6) | YES |
| 34 | rqst_amt | decimal(28,6) | YES |
| 35 | rqst_ar_amt | decimal(28,6) | YES |
| 36 | rqst_ar_key | decimal(28,6) | YES |
| 37 | aprov_amt | decimal(28,6) | YES |
| 38 | aprov_date | varchar(8000) | YES |
| 39 | bank_account_cms | varchar(8000) | YES |
| 40 | aprov_amt_ar_key | decimal(28,6) | YES |
| 41 | stat_cd | varchar(8000) | YES |
| 42 | stat_chng_user_id | varchar(8000) | YES |
| 43 | stat_chng_dt | datetime2 | YES |
| 44 | reg_dt | datetime2 | YES |
| 45 | reg_user_id | varchar(8000) | YES |
| 46 | upd_dt | datetime2 | YES |
| 47 | upd_user_id | varchar(8000) | YES |
| 48 | tax_cust_seq | decimal(28,6) | YES |
| 49 | tax_cust_idfy_no | varchar(8000) | YES |
| 50 | aprov_amt_dms_trx_id | decimal(28,6) | YES |
| 51 | prev_vat_vat_yn | varchar(8000) | YES |
| 52 | append_amt_receipt_key | decimal(28,6) | YES |
| 53 | charge_nm | varchar(8000) | YES |
| 54 | tel_area | varchar(8000) | YES |
| 55 | tel_no | varchar(8000) | YES |
| 56 | hp_area | varchar(8000) | YES |
| 57 | hp_no | varchar(8000) | YES |
| 58 | source_system | varchar(8000) | YES |
| 59 | elt_time | varchar(8000) | YES |

#### tdms.SVC_MONTHLY_SALES_TARGET

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 2 | target_dt | varchar(8000) | YES | 일자 |
| 3 | type3_cd | varchar(8000) | YES | 유형코드 |
| 4 | part_amt | decimal(28,10) | YES | 금액 |
| 5 | labor_amt | decimal(28,10) | YES | 금액 |
| 6 | total_amt | decimal(28,10) | YES | 총 금액 |
| 7 | vehic_cnt | decimal(10,1) | YES | 차량 |
| 8 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 9 | reg_dt | datetime2 | YES | 등록일 |
| 10 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 11 | upd_dt | datetime2 | YES | 수정일 |
| 12 | source_system | varchar(8000) | YES |  |
| 13 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.SVC_PROPO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,10) | YES |
| 4 | repair_type_cd | varchar(8000) | YES |
| 5 | propo_type_cd | varchar(8000) | YES |
| 6 | vin | varchar(8000) | YES |
| 7 | vis | varchar(8000) | YES |
| 8 | vehic_no1 | varchar(8000) | YES |
| 9 | vehic_no2 | varchar(8000) | YES |
| 10 | variant_nm | varchar(8000) | YES |
| 11 | svc_model_cd | varchar(8000) | YES |
| 12 | vehic_base_odometer | int | YES |
| 13 | odometer | int | YES |
| 14 | cust_seq | decimal(28,10) | YES |
| 15 | cust_nm | varchar(8000) | YES |
| 16 | cust_idfy_no | varchar(8000) | YES |
| 17 | cust_rcpt_rel_cd | varchar(8000) | YES |
| 18 | rcpt_cust_nm | varchar(8000) | YES |
| 19 | rcpt_hp_area | varchar(8000) | YES |
| 20 | rcpt_hp_no | varchar(8000) | YES |
| 21 | rcpt_tel_area | varchar(8000) | YES |
| 22 | rcpt_tel_no | varchar(8000) | YES |
| 23 | vip_yn | varchar(8000) | YES |
| 24 | svc_type_cd | varchar(8000) | YES |
| 25 | svc_type_fms_cd | varchar(8000) | YES |
| 26 | resv_dt | varchar(8000) | YES |
| 27 | resv_seq | decimal(28,10) | YES |
| 28 | esti_dt | varchar(8000) | YES |
| 29 | esti_seq | decimal(28,6) | YES |
| 30 | work_close_yn | varchar(8000) | YES |
| 31 | stat_cd | varchar(8000) | YES |
| 32 | stat_chng_dt | datetime2 | YES |
| 33 | stat_chng_user_id | varchar(8000) | YES |
| 34 | work_expt_st_dt | datetime2 | YES |
| 35 | work_expt_end_dt | datetime2 | YES |
| 36 | cust_delivery_yn | varchar(8000) | YES |
| 37 | cust_delivery_expt_dt | datetime2 | YES |
| 38 | cust_delivery_real_dt | datetime2 | YES |
| 39 | old_part_yn | varchar(8000) | YES |
| 40 | cust_loc_cd | varchar(8000) | YES |
| 41 | vehic_loc_cd | varchar(8000) | YES |
| 42 | damage_type_cd | varchar(8000) | YES |
| 43 | stall_no | decimal(28,10) | YES |
| 44 | sms_yn | varchar(8000) | YES |
| 45 | wash_stat_cd | varchar(8000) | YES |
| 46 | cust_rqst | varchar(8000) | YES |
| 47 | sa_sugst | varchar(8000) | YES |
| 48 | techman_sugst | varchar(8000) | YES |
| 49 | part_sugst | varchar(8000) | YES |
| 50 | rcpt_sa_id | varchar(8000) | YES |
| 51 | rcpt_time | decimal(28,6) | YES |
| 52 | propo_issu_time | decimal(28,10) | YES |
| 53 | mng_sa_id | varchar(8000) | YES |
| 54 | mng_foreman_id | varchar(8000) | YES |
| 55 | happycall_target_yn | varchar(8000) | YES |
| 56 | happycall_reject_cd | varchar(8000) | YES |
| 57 | cancel_reason_cd | varchar(8000) | YES |
| 58 | cancel_reason | varchar(8000) | YES |
| 59 | payback_yn | varchar(8000) | YES |
| 60 | base_propo_dt | varchar(8000) | YES |
| 61 | base_propo_seq | decimal(28,6) | YES |
| 62 | prev_shop_cd | varchar(8000) | YES |
| 63 | prev_propo_dt | varchar(8000) | YES |
| 64 | prev_propo_seq | decimal(28,6) | YES |
| 65 | prev_odometer | int | YES |
| 66 | prev_acc_shop_cd | varchar(8000) | YES |
| 67 | prev_acc_propo_dt | varchar(8000) | YES |
| 68 | prev_acc_propo_seq | decimal(28,6) | YES |
| 69 | up_group_id | varchar(8000) | YES |
| 70 | reg_dt | datetime2 | YES |
| 71 | reg_user_id | varchar(8000) | YES |
| 72 | upd_dt | datetime2 | YES |
| 73 | upd_user_id | varchar(8000) | YES |
| 74 | add_proc_sugst | varchar(8000) | YES |
| 75 | add_proc_reg_id | varchar(8000) | YES |
| 76 | add_proc_reg_dt | datetime2 | YES |
| 77 | cust_delivery_zip | varchar(8000) | YES |
| 78 | cust_delivery_addr | varchar(8000) | YES |
| 79 | cust_delivery_addr2 | varchar(8000) | YES |
| 80 | cust_delivery_loc_x | varchar(8000) | YES |
| 81 | cust_delivery_loc_y | varchar(8000) | YES |
| 82 | pdc_yn | varchar(8000) | YES |
| 83 | hbec_yn | varchar(8000) | YES |
| 84 | hbec_seq | decimal(28,6) | YES |
| 85 | nex_svc | varchar(8000) | YES |
| 86 | sc_forward_feedback | varchar(8000) | YES |
| 87 | repeat_repair | varchar(8000) | YES |
| 88 | reflaw_type | varchar(8000) | YES |
| 89 | molit_target_yn | varchar(8000) | YES |
| 90 | em_yn | varchar(8000) | YES |
| 91 | app_rcpt_flag | varchar(8000) | YES |
| 92 | repaet_alarm | varchar(8000) | YES |
| 93 | fin_upload_seq | decimal(28,0) | YES |
| 94 | esti_type | varchar(8000) | YES |
| 95 | end_gb | varchar(8000) | YES |
| 96 | svc_in_sc_id | varchar(8000) | YES |
| 97 | recall_before_sale_yn | varchar(8000) | YES |
| 98 | bp_deli_site | varchar(8000) | YES |
| 99 | bp_insu_comp | bigint | YES |
| 100 | free_service_sugst | varchar(8000) | YES |
| 101 | cust_repair_req | varchar(8000) | YES |
| 102 | app_save_flag | varchar(8000) | YES |
| 103 | valuable_yn | varchar(8000) | YES |
| 104 | dms_first_save_flag | varchar(8000) | YES |
| 105 | propo_talk_send_time | varchar(8000) | YES |
| 106 | propo_talk_send_user_id | varchar(8000) | YES |
| 107 | propo_talk_mseq | bigint | YES |
| 108 | calc_talk_send_time | varchar(8000) | YES |
| 109 | calc_talk_send_user_id | varchar(8000) | YES |
| 110 | calc_talk_mseq | bigint | YES |
| 111 | sign_yn | varchar(8000) | YES |
| 112 | agora_use_dt | datetime2 | YES |
| 113 | proc_start_sms_yn | varchar(8000) | YES |
| 114 | proc_start_sms_dt | datetime2 | YES |
| 115 | sa_qc_sms_yn | varchar(8000) | YES |
| 116 | sa_qc_sms_dt | datetime2 | YES |
| 117 | source_system | varchar(8000) | YES |
| 118 | elt_time | varchar(8000) | YES |

#### tdms.SVC_PROPO_BPKPI

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,10) | YES |
| 4 | shop_in_dt | datetime2 | YES |
| 5 | repair_start_dt | datetime2 | YES |
| 6 | repair_finsh_dt | datetime2 | YES |
| 7 | delivery_expt_dt | datetime2 | YES |
| 8 | delivery_real_dt | datetime2 | YES |
| 9 | ru10 | varchar(8000) | YES |
| 10 | ru11 | varchar(8000) | YES |
| 11 | ru12 | varchar(8000) | YES |
| 12 | ru13 | varchar(8000) | YES |
| 13 | ru14 | varchar(8000) | YES |
| 14 | ru15 | varchar(8000) | YES |
| 15 | ru16 | varchar(8000) | YES |
| 16 | ru17 | varchar(8000) | YES |
| 17 | ru18 | varchar(8000) | YES |
| 18 | ru19 | varchar(8000) | YES |
| 19 | ru20 | varchar(8000) | YES |
| 20 | ru21 | varchar(8000) | YES |
| 21 | ru22 | varchar(8000) | YES |
| 22 | ru23 | varchar(8000) | YES |
| 23 | ru24 | varchar(8000) | YES |
| 24 | ru25 | varchar(8000) | YES |
| 25 | ru26 | varchar(8000) | YES |
| 26 | ru27 | varchar(8000) | YES |
| 27 | ru28 | varchar(8000) | YES |
| 28 | ru29 | varchar(8000) | YES |
| 29 | ru30 | varchar(8000) | YES |
| 30 | ru31 | varchar(8000) | YES |
| 31 | ru32 | varchar(8000) | YES |
| 32 | ru33 | varchar(8000) | YES |
| 33 | ru34 | varchar(8000) | YES |
| 34 | ru35 | varchar(8000) | YES |
| 35 | ru36 | varchar(8000) | YES |
| 36 | oj10 | varchar(8000) | YES |
| 37 | oj11 | varchar(8000) | YES |
| 38 | oj12 | varchar(8000) | YES |
| 39 | qc10 | int | YES |
| 40 | qc11 | int | YES |
| 41 | qc12 | int | YES |
| 42 | qc13 | int | YES |
| 43 | qc14 | int | YES |
| 44 | qc15 | int | YES |
| 45 | qc16 | int | YES |
| 46 | qc17 | int | YES |
| 47 | reg_dt | datetime2 | YES |
| 48 | reg_user_id | varchar(8000) | YES |
| 49 | upd_dt | datetime2 | YES |
| 50 | upd_user_id | varchar(8000) | YES |
| 51 | proc_line | varchar(8000) | YES |
| 52 | bi_code | varchar(8000) | YES |
| 53 | bp_line_cd | decimal(28,6) | YES |
| 54 | source_system | varchar(8000) | YES |
| 55 | elt_time | varchar(8000) | YES |

#### tdms.SVC_PROPO_LABOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,10) | YES |
| 4 | frm_no | varchar(8000) | YES |
| 5 | seq | decimal(28,10) | YES |
| 6 | ro_type_cd | varchar(8000) | YES |
| 7 | settle_type_cd | varchar(8000) | YES |
| 8 | propo_stat_cd | varchar(8000) | YES |
| 9 | qty | int | YES |
| 10 | mh | decimal(15,7) | YES |
| 11 | frm_nm | varchar(8000) | YES |
| 12 | sale_unit_price | decimal(28,10) | YES |
| 13 | sale_amt | decimal(28,11) | YES |
| 14 | dc_amt | decimal(28,10) | YES |
| 15 | grp_no | decimal(28,10) | YES |
| 16 | disp_rank | decimal(28,10) | YES |
| 17 | cnfm_unit_price | decimal(28,10) | YES |
| 18 | cnfm_amt | decimal(28,11) | YES |
| 19 | sublet_yn | varchar(8000) | YES |
| 20 | sublet_comp_seq | decimal(28,10) | YES |
| 21 | sublet_purc_amt | decimal(28,0) | YES |
| 22 | cr_no | varchar(8000) | YES |
| 23 | fms_item_cd | varchar(8000) | YES |
| 24 | twc_no | varchar(8000) | YES |
| 25 | svc_campg_no | decimal(28,6) | YES |
| 26 | svc_hist_disp_yn | varchar(8000) | YES |
| 27 | reg_dt | datetime2 | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | datetime2 | YES |
| 30 | upd_user_id | varchar(8000) | YES |
| 31 | cr_case_no | int | YES |
| 32 | add_yn | varchar(8000) | YES |
| 33 | pkg_yn | varchar(8000) | YES |
| 34 | psp_amt | decimal(28,6) | YES |
| 35 | psp_code | varchar(8000) | YES |
| 36 | psp_unit_price | decimal(28,6) | YES |
| 37 | pm_code | varchar(8000) | YES |
| 38 | pm_seq | decimal(28,6) | YES |
| 39 | auda_yn | varchar(8000) | YES |
| 40 | source_system | varchar(8000) | YES |
| 41 | elt_time | varchar(8000) | YES |

#### tdms.SVC_PROPO_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(8000) | YES | 일자 |
| 3 | propo_seq | decimal(28,0) | YES | 순번 |
| 4 | part_no | varchar(8000) | YES | 부품번호 |
| 5 | seq | decimal(28,0) | YES | 순번 |
| 6 | ro_type_cd | varchar(8000) | YES | 유형코드 |
| 7 | settle_type_cd | varchar(8000) | YES | 유형코드 |
| 8 | propo_stat_cd | varchar(8000) | YES | 상태코드 |
| 9 | stat_cd | varchar(8000) | YES | 상태코드 |
| 10 | stat_chng_dt | datetime2 | YES | 일자 |
| 11 | rqst_issu_qty | int | YES | 수량 |
| 12 | real_issu_qty | int | YES | 수량 |
| 13 | sale_unit_price | decimal(28,0) | YES | 가격 |
| 14 | sale_amt | decimal(28,0) | YES | 금액 |
| 15 | dc_amt | decimal(28,0) | YES | 금액 |
| 16 | cnfm_unit_price | decimal(28,0) | YES | 가격 |
| 17 | cnfm_amt | decimal(28,0) | YES | 금액 |
| 18 | grp_no | decimal(28,0) | YES | 번호 |
| 19 | disp_rank | decimal(28,0) | YES |  |
| 20 | cr_no | varchar(8000) | YES | 번호 |
| 21 | fms_item_cd | varchar(8000) | YES | 코드 |
| 22 | svc_campg_no | decimal(28,6) | YES | 번호 |
| 23 | twc_no | varchar(8000) | YES | 번호 |
| 24 | order_no | varchar(8000) | YES | 주문번호 |
| 25 | order_line_no | decimal(28,0) | YES | 주문번호 |
| 26 | sout_no | varchar(8000) | YES | 번호 |
| 27 | sout_line_no | decimal(28,0) | YES | 번호 |
| 28 | cancel_yn | varchar(8000) | YES | 취소 |
| 29 | income_qty | int | YES | 수량 |
| 30 | order_qty | int | YES | 수량 |
| 31 | income_resv_qty | int | YES | 수량 |
| 32 | resv_clear_qty | int | YES | 수량 |
| 33 | resv_real_qty | int | YES | 수량 |
| 34 | rqst_remove_qty | int | YES | 수량 |
| 35 | resv_dt | varchar(8000) | YES | 일자 |
| 36 | resv_seq | decimal(28,0) | YES | 순번 |
| 37 | remove_yn | varchar(8000) | YES | 여부(Y/N) |
| 38 | reject_cd | varchar(8000) | YES | 코드 |
| 39 | svc_hist_disp_yn | varchar(8000) | YES | 여부(Y/N) |
| 40 | reg_dt | datetime2 | YES | 등록일 |
| 41 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 42 | upd_dt | datetime2 | YES | 수정일 |
| 43 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | rcit_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 45 | cr_case_no | int | YES | 번호 |
| 46 | add_yn | varchar(8000) | YES | 여부(Y/N) |
| 47 | pkg_yn | varchar(8000) | YES | 여부(Y/N) |
| 48 | psp_amt | decimal(28,0) | YES | 금액 |
| 49 | psp_code | varchar(8000) | YES | 코드 |
| 50 | psp_unit_price | decimal(28,1) | YES | 가격 |
| 51 | pm_code | varchar(8000) | YES | 코드 |
| 52 | pm_seq | decimal(28,6) | YES | 순번 |
| 53 | auda_yn | varchar(8000) | YES | 여부(Y/N) |
| 54 | battidennum | varchar(8000) | YES |  |
| 55 | source_system | varchar(8000) | YES |  |
| 56 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.SVC_RESV

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | resv_dt | varchar(8000) | YES |
| 3 | resv_seq | decimal(28,0) | YES |
| 4 | real_resv_date | varchar(8000) | YES |
| 5 | real_resv_st_hm | varchar(8000) | YES |
| 6 | real_resv_end_hm | varchar(8000) | YES |
| 7 | in_expt_dt | datetime2 | YES |
| 8 | out_expt_dt | datetime2 | YES |
| 9 | cust_seq | decimal(28,0) | YES |
| 10 | cust_nm | varchar(8000) | YES |
| 11 | cust_resv_rel_cd | varchar(8000) | YES |
| 12 | resv_cust_nm | varchar(8000) | YES |
| 13 | resv_hp_area | varchar(8000) | YES |
| 14 | resv_hp_no | varchar(8000) | YES |
| 15 | resv_tel_area | varchar(8000) | YES |
| 16 | resv_tel_no | varchar(8000) | YES |
| 17 | resv_cust_sms_yn | varchar(8000) | YES |
| 18 | vehic_exist_yn | varchar(8000) | YES |
| 19 | vehic_no1 | varchar(8000) | YES |
| 20 | vehic_no2 | varchar(8000) | YES |
| 21 | vin | varchar(8000) | YES |
| 22 | variant_nm | varchar(8000) | YES |
| 23 | svc_model_cd | varchar(8000) | YES |
| 24 | model_year | varchar(8000) | YES |
| 25 | svc_type_cd | varchar(8000) | YES |
| 26 | svc_type_fms_cd | varchar(8000) | YES |
| 27 | resv_way_cd | varchar(8000) | YES |
| 28 | resv_way_dtl | varchar(8000) | YES |
| 29 | resv_stall_no | decimal(28,0) | YES |
| 30 | cust_rqst | varchar(8000) | YES |
| 31 | sa_sugst | varchar(8000) | YES |
| 32 | stat_cd | varchar(8000) | YES |
| 33 | stat_chng_user_id | varchar(8000) | YES |
| 34 | stat_chng_dt | datetime2 | YES |
| 35 | cancel_reason_cd | varchar(8000) | YES |
| 36 | cancel_reason | varchar(8000) | YES |
| 37 | prev_amt | decimal(28,0) | YES |
| 38 | prev_amt_recv_cust_nm | varchar(8000) | YES |
| 39 | prev_amt_recv_way_cd | varchar(8000) | YES |
| 40 | prev_amt_stat_cd | varchar(8000) | YES |
| 41 | prev_amt_stat_chng_dt | datetime2 | YES |
| 42 | prev_amt_receipt_key | decimal(28,6) | YES |
| 43 | vip_yn | varchar(8000) | YES |
| 44 | cnfm_yn | varchar(8000) | YES |
| 45 | wash_yn | varchar(8000) | YES |
| 46 | remind_exec_cnt | decimal(28,0) | YES |
| 47 | mng_sa_id | varchar(8000) | YES |
| 48 | mng_foreman_id | varchar(8000) | YES |
| 49 | mng_sc_id_name | varchar(8000) | YES |
| 50 | propo_dt | varchar(8000) | YES |
| 51 | propo_seq | decimal(28,0) | YES |
| 52 | reg_dt | datetime2 | YES |
| 53 | reg_user_id | varchar(8000) | YES |
| 54 | upd_dt | datetime2 | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_loc_cd | varchar(8000) | YES |
| 57 | variant_cd | varchar(8000) | YES |
| 58 | order_dt | varchar(8000) | YES |
| 59 | order_no | varchar(8000) | YES |
| 60 | paid_prev_amt | decimal(28,0) | YES |
| 61 | used_prev_amt | decimal(28,0) | YES |
| 62 | prev_amt_remarks | varchar(8000) | YES |
| 63 | prev_amt_close_dt | varchar(8000) | YES |
| 64 | prev_amt_close_user_id | varchar(8000) | YES |
| 65 | em_yn | varchar(8000) | YES |
| 66 | resv_ildp_seq | decimal(28,6) | YES |
| 67 | esti_type | varchar(8000) | YES |
| 68 | repeat_repair | varchar(8000) | YES |
| 69 | repaet_alarm | varchar(8000) | YES |
| 70 | cust_repair_req | varchar(8000) | YES |
| 71 | entry_talk_send_time | varchar(8000) | YES |
| 72 | entry_talk_mseq | bigint | YES |
| 73 | remind_call_yn | varchar(8000) | YES |
| 74 | source_system | varchar(8000) | YES |
| 75 | elt_time | varchar(8000) | YES |

#### tdms.SVC_SERVICE_KPI_ELEMENT_DEALER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | up_group_id | varchar(8000) | YES | 식별자(ID) |
| 2 | yyyy_mm | varchar(8000) | YES |  |
| 3 | gr_sa_lv1 | decimal(28,10) | YES |  |
| 4 | gr_sa_lv2 | decimal(28,10) | YES |  |
| 5 | gr_sa_non_certi | decimal(28,10) | YES |  |
| 6 | gr_tech_toyota | decimal(28,10) | YES |  |
| 7 | gr_tech_pro | decimal(28,10) | YES |  |
| 8 | gr_tech_dia | decimal(28,10) | YES |  |
| 9 | gr_tech_dia_master | decimal(28,10) | YES |  |
| 10 | gr_tech_non_certi | decimal(28,10) | YES |  |
| 11 | bp_sa | decimal(28,10) | YES |  |
| 12 | bp_tech_body | decimal(28,10) | YES |  |
| 13 | bp_tech_paint | decimal(28,10) | YES |  |
| 14 | as_other | decimal(28,10) | YES |  |
| 15 | cbp_num_cp | decimal(28,10) | YES |  |
| 16 | cbp_num_wt | decimal(28,10) | YES |  |
| 17 | cbp_num_in | decimal(28,10) | YES |  |
| 18 | cbp_amt_cp | decimal(28,10) | YES |  |
| 19 | cbp_amt_wt | decimal(28,10) | YES |  |
| 20 | cbp_amt_in | decimal(28,10) | YES |  |
| 21 | other_amt_parts_sale | decimal(28,10) | YES | 판매 |
| 22 | other_num_rr | decimal(28,10) | YES |  |
| 23 | other_hour_gr_tech | decimal(28,10) | YES |  |
| 24 | other_hour_bp_tech | decimal(28,10) | YES |  |
| 25 | other_salary_gr_tech | decimal(28,10) | YES |  |
| 26 | other_salary_bp_tech | decimal(28,10) | YES |  |
| 27 | other_num_target_call | decimal(28,10) | YES |  |
| 28 | other_num_tried_call | decimal(28,10) | YES |  |
| 29 | other_num_contac_call | decimal(28,10) | YES |  |
| 30 | other_appoint_rate | decimal(28,10) | YES |  |
| 31 | other_no_show_rate | decimal(28,10) | YES |  |
| 32 | body_toyota_technician | decimal(28,10) | YES |  |
| 33 | body_pro_technician | decimal(28,10) | YES |  |
| 34 | body_master_technician | decimal(28,10) | YES |  |
| 35 | body_non_certified | decimal(28,10) | YES |  |
| 36 | paint_toyota_technician | decimal(28,10) | YES |  |
| 37 | paint_pro_technician | decimal(28,10) | YES |  |
| 38 | paint_master_technician | decimal(28,10) | YES |  |
| 39 | paint_non_certified | decimal(28,10) | YES |  |
| 40 | gr_sa_total | decimal(28,10) | YES |  |
| 41 | gr_sa_toyota | decimal(28,10) | YES |  |
| 42 | gr_sa_pro | decimal(28,10) | YES |  |
| 43 | gr_sa_master | decimal(28,10) | YES |  |
| 44 | gr_tech_total | decimal(28,10) | YES |  |
| 45 | bp_sa_total | decimal(28,10) | YES |  |
| 46 | bp_sa_toyota | decimal(28,10) | YES |  |
| 47 | bp_sa_pro | decimal(28,10) | YES |  |
| 48 | bp_sa_master | decimal(28,10) | YES |  |
| 49 | bp_sa_non_certi | decimal(28,10) | YES |  |
| 50 | stall_gs | decimal(28,10) | YES |  |
| 51 | stall_bp | decimal(28,10) | YES |  |
| 52 | stall_gs_tot | decimal(28,0) | YES |  |
| 53 | stall_bp_tot | decimal(28,0) | YES |  |
| 54 | source_system | varchar(8000) | YES |  |
| 55 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.SVC_SETTLE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | propo_dt | varchar(8000) | YES |
| 3 | propo_seq | decimal(28,0) | YES |
| 4 | ro_type_cd | varchar(8000) | YES |
| 5 | settle_dt | datetime2 | YES |
| 6 | settle_user_id | varchar(8000) | YES |
| 7 | sale_labor_amt | decimal(28,0) | YES |
| 8 | sale_part_amt | decimal(28,0) | YES |
| 9 | sale_sublet_amt | decimal(28,0) | YES |
| 10 | dc_labor_amt | decimal(28,0) | YES |
| 11 | dc_part_amt | decimal(28,0) | YES |
| 12 | dc_sublet_amt | decimal(28,0) | YES |
| 13 | cnfm_labor_amt | decimal(28,0) | YES |
| 14 | cnfm_part_amt | decimal(28,0) | YES |
| 15 | cnfm_sublet_amt | decimal(28,0) | YES |
| 16 | vat_yn | varchar(8000) | YES |
| 17 | vat | decimal(28,0) | YES |
| 18 | cnfm_tot_amt | decimal(28,0) | YES |
| 19 | fms_type | varchar(8000) | YES |
| 20 | dc_seq | decimal(28,0) | YES |
| 21 | stat_cd | varchar(8000) | YES |
| 22 | stat_chng_dt | datetime2 | YES |
| 23 | stat_chng_user_id | varchar(8000) | YES |
| 24 | receipt_date | varchar(8000) | YES |
| 25 | receipt_user_id | varchar(8000) | YES |
| 26 | ar_cancel_yn | varchar(8000) | YES |
| 27 | ar_cancel_dt | datetime2 | YES |
| 28 | receipt_key | decimal(28,0) | YES |
| 29 | ar_key | decimal(28,0) | YES |
| 30 | reg_dt | datetime2 | YES |
| 31 | reg_user_id | varchar(8000) | YES |
| 32 | upd_dt | datetime2 | YES |
| 33 | upd_user_id | varchar(8000) | YES |
| 34 | dc_reason | varchar(8000) | YES |
| 35 | addservice_yn | varchar(8000) | YES |
| 36 | psp_labor_amt | decimal(28,0) | YES |
| 37 | psp_part_amt | decimal(28,0) | YES |
| 38 | psp_sublet_amt | decimal(28,0) | YES |
| 39 | psp_tot_amt | decimal(28,0) | YES |
| 40 | psp_vat | decimal(28,0) | YES |
| 41 | source_system | varchar(8000) | YES |
| 42 | elt_time | varchar(8000) | YES |

#### tdms.SVC_STALL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | stall_no | decimal(28,10) | YES |
| 2 | shop_cd | varchar(8000) | YES |
| 3 | stall_nm | varchar(8000) | YES |
| 4 | repair_type_cd | varchar(8000) | YES |
| 5 | stall_type_cd | varchar(8000) | YES |
| 6 | sa_id | varchar(8000) | YES |
| 7 | foreman_id | varchar(8000) | YES |
| 8 | use_yn | varchar(8000) | YES |
| 9 | resv_yn | varchar(8000) | YES |
| 10 | disp_rank | decimal(28,10) | YES |
| 11 | remark | varchar(8000) | YES |
| 12 | reg_dt | datetime2 | YES |
| 13 | reg_user_id | varchar(8000) | YES |
| 14 | upd_dt | datetime2 | YES |
| 15 | upd_user_id | varchar(8000) | YES |
| 16 | sc_resv_yn | varchar(8000) | YES |
| 17 | kpi_yn | varchar(8000) | YES |
| 18 | virtual_yn | varchar(8000) | YES |
| 19 | lpm_resv_yn | varchar(8000) | YES |
| 20 | aicc_resv_yn | varchar(8000) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### tdms.SVC_STALL_WORKTIME

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | stall_no | decimal(28,10) | YES |
| 2 | shop_cd | varchar(8000) | YES |
| 3 | work_date | varchar(8000) | YES |
| 4 | work_st_hm | varchar(8000) | YES |
| 5 | work_end_hm | varchar(8000) | YES |
| 6 | oper_yn | varchar(8000) | YES |
| 7 | remark | varchar(8000) | YES |
| 8 | reg_dt | datetime2 | YES |
| 9 | reg_user_id | varchar(8000) | YES |
| 10 | upd_dt | datetime2 | YES |
| 11 | upd_user_id | varchar(8000) | YES |
| 12 | source_system | varchar(8000) | YES |
| 13 | elt_time | varchar(8000) | YES |

#### tdms.SVC_TMKR_TWC

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES |
| 2 | twc_no | varchar(8000) | YES |
| 3 | rqst_cnt | int | YES |
| 4 | propo_dt | varchar(8000) | YES |
| 5 | propo_seq | decimal(28,6) | YES |
| 6 | grp_no | decimal(28,6) | YES |
| 7 | settle_type_cd | varchar(8000) | YES |
| 8 | warranty_type_cd | varchar(8000) | YES |
| 9 | operation_type_cd | varchar(8000) | YES |
| 10 | data_id | varchar(8000) | YES |
| 11 | f_vehic_flag | varchar(8000) | YES |
| 12 | fr_cd | varchar(8000) | YES |
| 13 | wmi | varchar(8000) | YES |
| 14 | vds | varchar(8000) | YES |
| 15 | vcd | varchar(8000) | YES |
| 16 | vis | varchar(8000) | YES |
| 17 | delivery_date | varchar(8000) | YES |
| 18 | repair_date | varchar(8000) | YES |
| 19 | repair_end_date | varchar(8000) | YES |
| 20 | odometer | int | YES |
| 21 | main_frm_no | varchar(8000) | YES |
| 22 | local_cause_part_flag | varchar(8000) | YES |
| 23 | cause_part_no | varchar(8000) | YES |
| 24 | apply_charge_amt | decimal(28,6) | YES |
| 25 | pwr | decimal(5,2) | YES |
| 26 | lwr | decimal(5,2) | YES |
| 27 | tot_labor_mh | decimal(4,1) | YES |
| 28 | tot_labor_amt | decimal(28,6) | YES |
| 29 | tot_part_amt | decimal(28,6) | YES |
| 30 | tot_sublet_amt | decimal(28,6) | YES |
| 31 | t1_cd | varchar(8000) | YES |
| 32 | t2_type_cd | varchar(8000) | YES |
| 33 | t2_cd | varchar(8000) | YES |
| 34 | t3_cd_1 | varchar(8000) | YES |
| 35 | t3_cd_2 | varchar(8000) | YES |
| 36 | t3_cd_3 | varchar(8000) | YES |
| 37 | t3_cd_4 | varchar(8000) | YES |
| 38 | t3_cd_5 | varchar(8000) | YES |
| 39 | t3_cd_6 | varchar(8000) | YES |
| 40 | t3_cd_7 | varchar(8000) | YES |
| 41 | sublet_expl | varchar(8000) | YES |
| 42 | sublet_expl_2 | varchar(8000) | YES |
| 43 | condition | varchar(8000) | YES |
| 44 | cause | varchar(8000) | YES |
| 45 | remedy | varchar(8000) | YES |
| 46 | tsb_no | varchar(8000) | YES |
| 47 | prev_shop_cd | varchar(8000) | YES |
| 48 | prev_propo_dt | varchar(8000) | YES |
| 49 | prev_propo_seq | decimal(28,6) | YES |
| 50 | prev_odometer | int | YES |
| 51 | prev_repair_date | varchar(8000) | YES |
| 52 | cr_no | varchar(8000) | YES |
| 53 | stat_cd | varchar(8000) | YES |
| 54 | stat_chng_user_id | varchar(8000) | YES |
| 55 | stat_chng_dt | datetime2 | YES |
| 56 | write_dt | datetime2 | YES |
| 57 | rqst_invoice_no | varchar(8000) | YES |
| 58 | rqst_dt | datetime2 | YES |
| 59 | rqst_lvl | varchar(8000) | YES |
| 60 | sys_judge_dt | datetime2 | YES |
| 61 | sys_judge_cd | varchar(8000) | YES |
| 62 | tmkr_judge_dt | datetime2 | YES |
| 63 | tmkr_judge_cd | varchar(8000) | YES |
| 64 | aprov_labor_amt | decimal(28,6) | YES |
| 65 | aprov_part_amt | decimal(28,6) | YES |
| 66 | aprov_sublet_amt | decimal(28,6) | YES |
| 67 | aprov_tot_amt | decimal(28,6) | YES |
| 68 | twc_remark | varchar(8000) | YES |
| 69 | tmkr_remark | varchar(8000) | YES |
| 70 | twc_review_yn | varchar(8000) | YES |
| 71 | sout_no | varchar(8000) | YES |
| 72 | prev_inv | varchar(8000) | YES |
| 73 | prev_sale_dt | varchar(8000) | YES |
| 74 | curr_inv | varchar(8000) | YES |
| 75 | curr_sale_dt | varchar(8000) | YES |
| 76 | prev_sout_no | varchar(8000) | YES |
| 77 | cr_case_no | int | YES |
| 78 | battery_claim_cnt | decimal(28,6) | YES |
| 79 | evidence_flag | varchar(8000) | YES |
| 80 | bat_test_cd_1 | varchar(8000) | YES |
| 81 | bat_test_cd_2 | varchar(8000) | YES |
| 82 | bat_test_cd_3 | varchar(8000) | YES |
| 83 | bat_test_cd_4 | varchar(8000) | YES |
| 84 | diag_cd_1 | varchar(8000) | YES |
| 85 | diag_cd_2 | varchar(8000) | YES |
| 86 | diag_cd_3 | varchar(8000) | YES |
| 87 | diag_cd_4 | varchar(8000) | YES |
| 88 | diag_cd_5 | varchar(8000) | YES |
| 89 | serial_cd_1 | varchar(8000) | YES |
| 90 | serial_cd_2 | varchar(8000) | YES |
| 91 | serial_cd_3 | varchar(8000) | YES |
| 92 | reg_dt | datetime2 | YES |
| 93 | reg_user_id | varchar(8000) | YES |
| 94 | upd_dt | datetime2 | YES |
| 95 | upd_user_id | varchar(8000) | YES |
| 96 | source_system | varchar(8000) | YES |
| 97 | elt_time | varchar(8000) | YES |

#### tdms.SVC_TMKR_TWC_PART

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(8000) | YES | 전시장 코드 |
| 2 | twc_no | varchar(8000) | YES | 번호 |
| 3 | rqst_cnt | int | YES |  |
| 4 | part_no | varchar(8000) | YES | 부품번호 |
| 5 | seq | int | YES | 순번 |
| 6 | local_part_flag | varchar(8000) | YES | 부품 |
| 7 | qty | int | YES | 수량 |
| 8 | unit_price | decimal(28,10) | YES | 가격 |
| 9 | amt | decimal(28,10) | YES | 금액 |
| 10 | reg_dt | datetime2 | YES | 등록일 |
| 11 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 12 | upd_dt | datetime2 | YES | 수정일 |
| 13 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 14 | old_part_no | varchar(8000) | YES | 부품번호 |
| 15 | source_system | varchar(8000) | YES |  |
| 16 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.TACC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | startdt | datetime2 | YES |
| 3 | enddt | datetime2 | YES |
| 4 | korname | varchar(8000) | YES |
| 5 | engname | varchar(8000) | YES |
| 6 | chname | varchar(8000) | YES |
| 7 | accdivcd | varchar(8000) | YES |
| 8 | accpartcd | varchar(8000) | YES |
| 9 | acccdonelvl | varchar(8000) | YES |
| 10 | acccdtwolvl | varchar(8000) | YES |
| 11 | acccdthreelvl | varchar(8000) | YES |
| 12 | acccdfourlvl | varchar(8000) | YES |
| 13 | slipoccuryn | varchar(8000) | YES |
| 14 | cal | varchar(8000) | YES |
| 15 | orderptn | int | YES |
| 16 | comments | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### tdms.TACC_DEALER_ORDER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | reporttype | varchar(8000) | YES |  |
| 2 | dealer | varchar(8000) | YES | 딜러 |
| 3 | reportyn | varchar(8000) | YES |  |
| 4 | orderreport | int | YES | 주문 |
| 5 | comments | varchar(8000) | YES |  |
| 6 | source_system | varchar(8000) | YES |  |
| 7 | elt_time | varchar(8000) | YES | 시각 |

#### tdms.TACC_ITEM

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | itemcd | varchar(8000) | YES |
| 3 | itemname | varchar(8000) | YES |
| 4 | sum_type | varchar(8000) | YES |
| 5 | org_type | varchar(8000) | YES |
| 6 | sign_cd | varchar(8000) | YES |
| 7 | use_yn | varchar(8000) | YES |
| 8 | reg_dt | datetime2 | YES |
| 9 | reg_user_id | varchar(8000) | YES |
| 10 | upd_dt | datetime2 | YES |
| 11 | upd_user_id | varchar(8000) | YES |
| 12 | disable_yn | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### tdms.TACC_MBS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | chaamt | bigint | YES |
| 6 | daeamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | created_by | varchar(8000) | YES |
| 9 | created_dt | datetime2 | YES |
| 10 | edited_by | varchar(8000) | YES |
| 11 | edited_dt | datetime2 | YES |
| 12 | close_yn | varchar(8000) | YES |
| 13 | remark | varchar(8000) | YES |
| 14 | source_system | varchar(8000) | YES |
| 15 | elt_time | varchar(8000) | YES |

#### tdms.TACC_MIS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | variantcd | varchar(8000) | YES |
| 5 | saleqty | int | YES |
| 6 | saleamt | bigint | YES |
| 7 | operexpamt | bigint | YES |
| 8 | invenqty | int | YES |
| 9 | invenamt | bigint | YES |
| 10 | avgsaleamt | bigint | YES |
| 11 | avgoperexpamt | bigint | YES |
| 12 | incomeamt | bigint | YES |
| 13 | avgincomeamt | bigint | YES |
| 14 | perincome | decimal(5,2) | YES |
| 15 | yymm | varchar(8000) | YES |
| 16 | brandcd | varchar(8000) | YES |
| 17 | model | varchar(8000) | YES |
| 18 | my_cd | varchar(8000) | YES |
| 19 | sfx_cd | varchar(8000) | YES |
| 20 | seq | decimal(28,10) | YES |
| 21 | created_by | varchar(8000) | YES |
| 22 | created_dt | datetime2 | YES |
| 23 | edited_by | varchar(8000) | YES |
| 24 | edited_dt | datetime2 | YES |
| 25 | close_yn | varchar(8000) | YES |
| 26 | source_system | varchar(8000) | YES |
| 27 | elt_time | varchar(8000) | YES |

#### tdms.TACC_MTS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | itemcd | varchar(8000) | YES |
| 6 | itemamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | created_by | varchar(8000) | YES |
| 9 | created_dt | datetime2 | YES |
| 10 | edited_by | varchar(8000) | YES |
| 11 | edited_dt | datetime2 | YES |
| 12 | close_yn | varchar(8000) | YES |
| 13 | source_system | varchar(8000) | YES |
| 14 | elt_time | varchar(8000) | YES |

#### tdms.TACC_PERSON

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | sales | int | YES |
| 5 | service | int | YES |
| 6 | admin | int | YES |
| 7 | other | int | YES |
| 8 | total | int | YES |
| 9 | yymm | varchar(8000) | YES |
| 10 | salescons | int | YES |
| 11 | topmanage | int | YES |
| 12 | created_by | varchar(8000) | YES |
| 13 | created_dt | datetime2 | YES |
| 14 | edited_by | varchar(8000) | YES |
| 15 | edited_dt | datetime2 | YES |
| 16 | close_yn | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### tdms.TACC_REF

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | assacccd | varchar(8000) | YES |
| 2 | currassacccd | varchar(8000) | YES |
| 3 | quiassacccd | varchar(8000) | YES |
| 4 | invenassacccd | varchar(8000) | YES |
| 5 | ncurrassacccd | varchar(8000) | YES |
| 6 | invesassacccd | varchar(8000) | YES |
| 7 | tangassacccd | varchar(8000) | YES |
| 8 | intangassacccd | varchar(8000) | YES |
| 9 | liaacccd | varchar(8000) | YES |
| 10 | curliaacccd | varchar(8000) | YES |
| 11 | longliaacccd | varchar(8000) | YES |
| 12 | stockacccd | varchar(8000) | YES |
| 13 | saleunitacccd | varchar(8000) | YES |
| 14 | salesacccd | varchar(8000) | YES |
| 15 | feeacccd | varchar(8000) | YES |
| 16 | noperacccd | varchar(8000) | YES |
| 17 | expacccd | varchar(8000) | YES |
| 18 | cosacccd | varchar(8000) | YES |
| 19 | saleexpacccd | varchar(8000) | YES |
| 20 | admacccd | varchar(8000) | YES |
| 21 | noperexpacccd | varchar(8000) | YES |
| 22 | extrgainacccd | varchar(8000) | YES |
| 23 | extrlossacccd | varchar(8000) | YES |
| 24 | noperotherincome | varchar(8000) | YES |
| 25 | noperotherincome1 | varchar(8000) | YES |
| 26 | noperothercost | varchar(8000) | YES |
| 27 | newvecacccd | varchar(8000) | YES |
| 28 | costnewvecacccd | varchar(8000) | YES |
| 29 | newvecinvenacccd | varchar(8000) | YES |
| 30 | svcsaleacccd | varchar(8000) | YES |
| 31 | svcexpacccd | varchar(8000) | YES |
| 32 | usedvecacccd | varchar(8000) | YES |
| 33 | costusedvecacccd | varchar(8000) | YES |
| 34 | cashacccd | varchar(8000) | YES |
| 35 | cashequacccd | varchar(8000) | YES |
| 36 | shorttermfinacccd | varchar(8000) | YES |
| 37 | allowdouacccd | varchar(8000) | YES |
| 38 | tradepayacccd | varchar(8000) | YES |
| 39 | traderecacccd | varchar(8000) | YES |
| 40 | longtermboracccd | varchar(8000) | YES |
| 41 | shorttermboracccd | varchar(8000) | YES |
| 42 | capitalstockacccd | varchar(8000) | YES |
| 43 | invennewassacccd | varchar(8000) | YES |
| 44 | interestexpacccd | varchar(8000) | YES |
| 45 | depreexpacccd | varchar(8000) | YES |
| 46 | amortexpacccd | varchar(8000) | YES |
| 47 | sellingexpacccd | varchar(8000) | YES |
| 48 | salepromexpacccd | varchar(8000) | YES |
| 49 | advertisingexpacccd | varchar(8000) | YES |
| 50 | capitalsurpacccd | varchar(8000) | YES |
| 51 | retainedearacccd | varchar(8000) | YES |
| 52 | capitaladjustacccd | varchar(8000) | YES |
| 53 | partsacceacccd | varchar(8000) | YES |
| 54 | otherinvenacccd | varchar(8000) | YES |
| 55 | salaryacccd | varchar(8000) | YES |
| 56 | bonusacccd | varchar(8000) | YES |
| 57 | servbenacccd | varchar(8000) | YES |
| 58 | legalbenacccd | varchar(8000) | YES |
| 59 | employeebenacccd | varchar(8000) | YES |
| 60 | rentalexpacccd | varchar(8000) | YES |
| 61 | supplexpacccd | varchar(8000) | YES |
| 62 | servicefeeacccd | varchar(8000) | YES |
| 63 | acc_income_tax | varchar(8000) | YES |
| 64 | source_system | varchar(8000) | YES |
| 65 | elt_time | varchar(8000) | YES |

#### tdms.TACC_REF2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | svcsaleacccd | varchar(8000) | YES |
| 2 | svcexpacccd | varchar(8000) | YES |
| 3 | saleexpacccd | varchar(8000) | YES |
| 4 | admexpacccd | varchar(8000) | YES |
| 5 | usecarsaleacccd | varchar(8000) | YES |
| 6 | usecarexpacccd | varchar(8000) | YES |
| 7 | source_system | varchar(8000) | YES |
| 8 | elt_time | varchar(8000) | YES |

#### tdms.TACC_SUM_MBS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dealer | varchar(8000) | YES |
| 2 | year | varchar(8000) | YES |
| 3 | month | varchar(8000) | YES |
| 4 | acccd | varchar(8000) | YES |
| 5 | chaamt | bigint | YES |
| 6 | daeamt | bigint | YES |
| 7 | yymm | varchar(8000) | YES |
| 8 | orderptn | int | YES |
| 9 | korname | varchar(8000) | YES |
| 10 | engname | varchar(8000) | YES |
| 11 | chname | varchar(8000) | YES |
| 12 | accpartcd | varchar(8000) | YES |
| 13 | created_by | varchar(8000) | YES |
| 14 | created_dt | datetime2 | YES |
| 15 | edited_by | varchar(8000) | YES |
| 16 | edited_dt | datetime2 | YES |
| 17 | slip_knd | varchar(8000) | YES |
| 18 | source_system | varchar(8000) | YES |
| 19 | elt_time | varchar(8000) | YES |

#### tdms.TACC_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brandcd | varchar(8000) | YES |
| 2 | variantcd | varchar(8000) | YES |
| 3 | seq | decimal(28,10) | YES |
| 4 | other | varchar(8000) | YES |
| 5 | model_cd | varchar(8000) | YES |
| 6 | enabled_flag | varchar(8000) | YES |
| 7 | reg_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_dt | datetime2 | YES |
| 10 | upd_user_id | varchar(8000) | YES |
| 11 | source_system | varchar(8000) | YES |
| 12 | elt_time | varchar(8000) | YES |

#### tdms.TACC_VC_CD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | acccd | varchar(8000) | YES |
| 2 | startdt | datetime2 | YES |
| 3 | enddt | datetime2 | YES |
| 4 | korname | varchar(8000) | YES |
| 5 | engname | varchar(8000) | YES |
| 6 | chname | varchar(8000) | YES |
| 7 | accdivcd | varchar(8000) | YES |
| 8 | accpartcd | varchar(8000) | YES |
| 9 | acccdonelvl | varchar(8000) | YES |
| 10 | acccdtwolvl | varchar(8000) | YES |
| 11 | acccdthreelvl | varchar(8000) | YES |
| 12 | acccdfourlvl | varchar(8000) | YES |
| 13 | slipoccuryn | varchar(8000) | YES |
| 14 | cal | varchar(8000) | YES |
| 15 | orderptn | int | YES |
| 16 | commnets | varchar(8000) | YES |
| 17 | source_system | varchar(8000) | YES |
| 18 | elt_time | varchar(8000) | YES |

#### tdms.TF_DCM_INFO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dcm_info_id | decimal(28,0) | YES |
| 2 | dcm_type | varchar(8000) | YES |
| 3 | vin | varchar(8000) | YES |
| 4 | urn | varchar(8000) | YES |
| 5 | ed_no | varchar(8000) | YES |
| 6 | model_name | varchar(8000) | YES |
| 7 | vessel_cd | varchar(8000) | YES |
| 8 | invoice_no | varchar(8000) | YES |
| 9 | imei | varchar(8000) | YES |
| 10 | iccid | varchar(8000) | YES |
| 11 | euiccid | varchar(8000) | YES |
| 12 | dcm_reg_dt | varchar(8000) | YES |
| 13 | status | varchar(8000) | YES |
| 14 | transfer_yn | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | ccss_if_dt | varchar(8000) | YES |
| 20 | ccss_if_flag | varchar(8000) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### tdms.VS_COLOR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | sfx_cd | varchar(8000) | YES |
| 6 | col_combi_cd | varchar(8000) | YES |
| 7 | brand_nm | varchar(8000) | YES |
| 8 | model_nm | varchar(8000) | YES |
| 9 | variant_nm | varchar(8000) | YES |
| 10 | sfx_nm | varchar(8000) | YES |
| 11 | col_combi_nm | varchar(8000) | YES |
| 12 | curr_sales_yn | varchar(8000) | YES |
| 13 | important_yn | varchar(8000) | YES |
| 14 | display_order | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | special_ordr_flag | varchar(8000) | YES |
| 20 | take_contract_amt | decimal(28,10) | YES |
| 21 | source_system | varchar(8000) | YES |
| 22 | elt_time | varchar(8000) | YES |

#### tdms.VS_MODEL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | model_nm | varchar(8000) | YES |
| 4 | curr_sales_yn | varchar(8000) | YES |
| 5 | display_order | varchar(8000) | YES |
| 6 | reg_dt | datetime2 | YES |
| 7 | upd_dt | datetime2 | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_user_id | varchar(8000) | YES |
| 10 | source_system | varchar(8000) | YES |
| 11 | elt_time | varchar(8000) | YES |

#### tdms.VS_MODEL_YEAR

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | model_year | varchar(8000) | YES |
| 6 | start_ym | varchar(8000) | YES |
| 7 | end_ym | varchar(8000) | YES |
| 8 | vehic_type | varchar(8000) | YES |
| 9 | reg_dt | datetime2 | YES |
| 10 | reg_user_id | varchar(8000) | YES |
| 11 | upd_dt | datetime2 | YES |
| 12 | upd_user_id | varchar(8000) | YES |
| 13 | pre_resv_yn | varchar(8000) | YES |
| 14 | pre_resv_start_dt | varchar(8000) | YES |
| 15 | pre_cont_start_dt | varchar(8000) | YES |
| 16 | pre_deps_end_dt | varchar(8000) | YES |
| 17 | cont_start_dt | varchar(8000) | YES |
| 18 | pre_cont_end_dt | varchar(8000) | YES |
| 19 | source_system | varchar(8000) | YES |
| 20 | elt_time | varchar(8000) | YES |

#### tdms.VS_SFX

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | my_cd | varchar(8000) | YES |
| 5 | sfx_cd | varchar(8000) | YES |
| 6 | brand_nm | varchar(8000) | YES |
| 7 | model_nm | varchar(8000) | YES |
| 8 | variant_nm | varchar(8000) | YES |
| 9 | model_year | varchar(8000) | YES |
| 10 | sfx_nm | varchar(8000) | YES |
| 11 | curr_sales_yn | varchar(8000) | YES |
| 12 | display_order | varchar(8000) | YES |
| 13 | launch_dt | varchar(8000) | YES |
| 14 | form_apply | varchar(8000) | YES |
| 15 | motive_type | varchar(8000) | YES |
| 16 | taking_fix | varchar(8000) | YES |
| 17 | displacement | varchar(8000) | YES |
| 18 | hp | varchar(8000) | YES |
| 19 | gross_weight | varchar(8000) | YES |
| 20 | cylinder_cnt | int | YES |
| 21 | max_load | varchar(8000) | YES |
| 22 | max_output | decimal(28,10) | YES |
| 23 | length | decimal(28,10) | YES |
| 24 | width | decimal(28,10) | YES |
| 25 | height | decimal(28,10) | YES |
| 26 | order_yn | varchar(8000) | YES |
| 27 | reg_dt | datetime2 | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | datetime2 | YES |
| 30 | upd_user_id | varchar(8000) | YES |
| 31 | confirm_no | varchar(8000) | YES |
| 32 | hybrid_yn | varchar(8000) | YES |
| 33 | navi_yn | varchar(8000) | YES |
| 34 | ecfrnd_vhcle_knd | varchar(8000) | YES |
| 35 | grade | varchar(8000) | YES |
| 36 | connected_car_yn | varchar(8000) | YES |
| 37 | spec_variant_nm | varchar(8000) | YES |
| 38 | hi_pass_yn | varchar(8000) | YES |
| 39 | black_box_yn | varchar(8000) | YES |
| 40 | consign_sales_flag | varchar(8000) | YES |
| 41 | ew_yn | varchar(8000) | YES |
| 42 | dcm_type | varchar(8000) | YES |
| 43 | source_system | varchar(8000) | YES |
| 44 | elt_time | varchar(8000) | YES |

#### tdms.VS_VARIANT

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | variant_cd | varchar(8000) | YES |
| 4 | variant_key | varchar(8000) | YES |
| 5 | moct_car_type | varchar(8000) | YES |
| 6 | variant_nm | varchar(8000) | YES |
| 7 | sales_yn | varchar(8000) | YES |
| 8 | order_yn | varchar(8000) | YES |
| 9 | mon_target_cd | varchar(8000) | YES |
| 10 | svc_model_cd | varchar(8000) | YES |
| 11 | svc_model_desc | varchar(8000) | YES |
| 12 | if_variant_nm | varchar(8000) | YES |
| 13 | warranty_month | decimal(28,10) | YES |
| 14 | display_order | varchar(8000) | YES |
| 15 | reg_dt | datetime2 | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | datetime2 | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | daily_report_variant_cd | varchar(8000) | YES |
| 20 | daily_report_yn | varchar(8000) | YES |
| 21 | prod_loc | varchar(8000) | YES |
| 22 | report_variant_nm | varchar(8000) | YES |
| 23 | report_display_order | varchar(8000) | YES |
| 24 | pre_variant_nm | varchar(8000) | YES |
| 25 | ecrb_variant_nm | varchar(8000) | YES |
| 26 | hybrid_yn | varchar(8000) | YES |
| 27 | spec_variant_nm | varchar(8000) | YES |
| 28 | variant_cd_jpn | varchar(8000) | YES |
| 29 | grade | varchar(8000) | YES |
| 30 | concern_mdl_yn | varchar(8000) | YES |
| 31 | fuel_type_cd | varchar(8000) | YES |
| 32 | wireframe_cd | varchar(8000) | YES |
| 33 | source_system | varchar(8000) | YES |
| 34 | elt_time | varchar(8000) | YES |

---
