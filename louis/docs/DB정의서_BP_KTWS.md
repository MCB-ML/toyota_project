# BP_KTWS 엔드포인트 — DB 테이블 정의서

> 조회 일시: 2026-06-22  
> 접속 계정: TMKR_Account@toyotamotor.co.kr  
> 엔드포인트: `6orm62c43rguff2mpdxwqy76tu-xhehnpiu2bautgglhximxpyqca.datawarehouse.fabric.microsoft.com`  
> 인증: Azure AD (ActiveDirectoryPassword) / ODBC Driver 17

## DB 개요

| 데이터베이스 | 구분 | 테이블 수 | 비고 |
|---|---|---|---|
| DataflowsStagingLakehouse | 스테이징/임시 | 12 | |
| DataflowsStagingWarehouse | 스테이징/임시 | 12 | |
| KPI_L | 데이터 | 57 | |
| KPI_W | 데이터 | 254 | |
| StagingLakehouseForDataflows_20250812005148 | 스테이징/임시 | 14 | |
| StagingWarehouseForDataflows_20250812005211 | 스테이징/임시 | 12 | |

---

## DB: DataflowsStagingLakehouse

구분: 스테이징/임시 · 테이블 수: 12

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
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

## DB: DataflowsStagingWarehouse

구분: 스테이징/임시 · 테이블 수: 12

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
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

## DB: KPI_L

구분: 데이터 · 테이블 수: 57

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.a_bilogo_pics | 6 | 0 |
| dbo.a_bilogo_pics_v2 | 6 | - |
| dbo.co_company | 78 | 0 |
| dbo.l_co_calendar_stg | 12 | 0 |
| dbo.l_co_code | 18 | 0 |
| dbo.l_co_group | 94 | 0 |
| dbo.l_co_group_bi_stg | 8 | 0 |
| dbo.l_co_holdings | 94 | 0 |
| dbo.l_co_organization | 31 | 0 |
| dbo.l_co_users | 87 | 0 |
| dbo.l_co_vehic | 57 | 0 |
| dbo.l_cu_base | 113 | 0 |
| dbo.l_cu_detail | 56 | 0 |
| dbo.l_om_contract | 133 | 0 |
| dbo.l_pt_part | 71 | 0 |
| dbo.l_pt_sout_detl | 51 | 0 |
| dbo.l_sfa_testcar_trial | 36 | 0 |
| dbo.l_sfa_testdrive_req | 60 | 0 |
| dbo.l_svc_propo | 114 | 0 |
| dbo.l_svc_propo_part | 54 | 0 |
| dbo.l_vs_model | 10 | 0 |
| dbo.l_vs_sfx | 43 | 0 |
| dbo.l_vs_variant | 32 | 0 |
| dbo.l_vt_vehic_supply | 129 | 0 |
| dbo.t_co_code | 18 | 0 |
| dbo.t_co_group | 94 | 0 |
| dbo.t_co_group_bi_stg | 8 | 0 |
| dbo.t_co_holdings | 94 | 0 |
| dbo.t_co_organization | 31 | 0 |
| dbo.t_co_users | 88 | 0 |
| dbo.t_co_vehic | 57 | 0 |
| dbo.t_cu_base | 113 | 0 |
| dbo.t_cu_detail | 56 | 0 |
| dbo.t_om_contract | 133 | 0 |
| dbo.t_pt_part | 71 | 0 |
| dbo.t_pt_sout_detl | 51 | 0 |
| dbo.t_sfa_testcar_trial | 36 | 0 |
| dbo.t_sfa_testdrive_req | 60 | 0 |
| dbo.t_svc_propo | 113 | 0 |
| dbo.t_svc_propo_part | 54 | 0 |
| dbo.t_vs_model | 10 | 0 |
| dbo.t_vs_sfx | 43 | 0 |
| dbo.t_vs_variant | 32 | 0 |
| dbo.t_vt_vehic_supply | 129 | 0 |
| dbo.z_target_sample | 7 | 0 |
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

#### dbo.a_bilogo_pics  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | file_val | varchar(8000) | NO |
| 2 | emp_no | varchar(8000) | NO |
| 3 | name | varchar(800) | YES |
| 4 | img_cd | varchar(8000) | YES |
| 5 | reg_dt | varchar(80) | NO |
| 6 | elt_time | varchar(80) | NO |

#### dbo.a_bilogo_pics_v2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_nm | varchar(8000) | NO |
| 2 | file_tp | varchar(8000) | YES |
| 3 | file_nm | varchar(8000) | YES |
| 4 | img_cd | varchar(8000) | YES |
| 5 | reg_dt | varchar(80) | NO |
| 6 | elt_time | varchar(80) | NO |

#### dbo.co_company  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | comp_seq | float | YES |
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
| 26 | order_cycle | real | YES |
| 27 | safe_stock_lead_time | real | YES |
| 28 | lead_time | real | YES |
| 29 | short_stock_warn_base | real | YES |
| 30 | over_due_days_sea | int | YES |
| 31 | over_due_days_air | int | YES |
| 32 | over_due_days_fo | int | YES |
| 33 | impr_cd | varchar(8000) | YES |
| 34 | exch_rate_recv | float | YES |
| 35 | exch_rate_price_chng | float | YES |
| 36 | lc_fact_resv | real | YES |
| 37 | lc_fact_air | real | YES |
| 38 | lc_fact_price_chng | real | YES |
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
| 57 | reg_dt | varchar(8000) | YES |
| 58 | reg_user_id | varchar(8000) | YES |
| 59 | upd_dt | varchar(8000) | YES |
| 60 | upd_user_id | varchar(8000) | YES |
| 61 | bp_shop_yn | varchar(8000) | YES |
| 62 | dc_rate | real | YES |
| 63 | oil_purc_yn | varchar(8000) | YES |
| 64 | tr_zip | varchar(8000) | YES |
| 65 | tr_addr | varchar(8000) | YES |
| 66 | tr_addr_no | varchar(8000) | YES |
| 67 | tr_addr_flag | varchar(8000) | YES |
| 68 | tr_addr_insert_flag | varchar(8000) | YES |
| 69 | tr_addr_bld_no | varchar(8000) | YES |
| 70 | tr_addr_result | varchar(8000) | YES |
| 71 | tr_zip_delivery | varchar(8000) | YES |
| 72 | tr_addr_delivery | varchar(8000) | YES |
| 73 | tr_addr_no_delivery | varchar(8000) | YES |
| 74 | tr_addr_delivery_flag | varchar(8000) | YES |
| 75 | tr_addr_delivery_insert_flag | varchar(8000) | YES |
| 76 | tr_addr_delivery_bld_no | varchar(8000) | YES |
| 77 | tr_addr_delivery_result | varchar(8000) | YES |
| 78 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_calendar_stg  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | base_dt | varchar(8000) | YES |
| 2 | week_no_by_month | float | YES |
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

#### dbo.l_co_code  (행 0)

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
| 10 | reg_dt | varchar(8000) | YES |
| 11 | reg_user_id | varchar(8000) | YES |
| 12 | upd_dt | varchar(8000) | YES |
| 13 | upd_user_id | varchar(8000) | YES |
| 14 | attr1 | varchar(8000) | YES |
| 15 | code_type_gb | varchar(8000) | YES |
| 16 | attr2 | varchar(8000) | YES |
| 17 | attr3 | varchar(8000) | YES |
| 18 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_group  (행 0)

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
| 14 | showroom_no | float | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | float | YES |
| 17 | fee_transfer | float | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | smallint | YES |
| 22 | daily_report_seq | float | YES |
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
| 40 | org_id | float | YES |
| 41 | set_of_books_id | float | YES |
| 42 | location_id | float | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | varchar(8000) | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | varchar(8000) | YES |
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
| 91 | molit_pgmcode | varchar(8000) | YES |
| 92 | molit_key | varchar(8000) | YES |
| 93 | group_short_eng_name | varchar(8000) | YES |
| 94 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_group_bi_stg  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | brand_cd | varchar(8000) | YES |
| 3 | bi_group_id | varchar(8000) | YES |
| 4 | bi_group_name | varchar(8000) | YES |
| 5 | reg_user_id | varchar(8000) | YES |
| 6 | reg_dt | datetime2 | YES |
| 7 | upd_user_id | varchar(8000) | YES |
| 8 | upd_dt | datetime2 | YES |

#### dbo.l_co_holdings  (행 0)

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
| 14 | showroom_no | float | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | float | YES |
| 17 | fee_transfer | float | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | smallint | YES |
| 22 | daily_report_seq | float | YES |
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
| 40 | org_id | float | YES |
| 41 | set_of_books_id | float | YES |
| 42 | location_id | float | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | varchar(8000) | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | varchar(8000) | YES |
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
| 93 | oid_group_num | float | YES |
| 94 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_organization  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dept_cd | varchar(8000) | YES |
| 2 | up_dept_cd | varchar(8000) | YES |
| 3 | dept_nm | varchar(8000) | YES |
| 4 | rank | smallint | YES |
| 5 | zip | varchar(8000) | YES |
| 6 | adr | varchar(8000) | YES |
| 7 | adr_no | varchar(8000) | YES |
| 8 | tel_no | varchar(8000) | YES |
| 9 | fax_no | varchar(8000) | YES |
| 10 | sales_yn | varchar(8000) | YES |
| 11 | shop_yn | varchar(8000) | YES |
| 12 | use_yn | varchar(8000) | YES |
| 13 | close_dt | varchar(8000) | YES |
| 14 | reg_use_id | varchar(8000) | YES |
| 15 | reg_dt | varchar(8000) | YES |
| 16 | upd_use_id | varchar(8000) | YES |
| 17 | upd_dt | varchar(8000) | YES |
| 18 | tel_area | varchar(8000) | YES |
| 19 | fax_area | varchar(8000) | YES |
| 20 | group_id | varchar(8000) | YES |
| 21 | dealer_id | varchar(8000) | YES |
| 22 | bol_yn | varchar(8000) | YES |
| 23 | tr_zip | varchar(8000) | YES |
| 24 | tr_addr | varchar(8000) | YES |
| 25 | tr_addr_no | varchar(8000) | YES |
| 26 | tr_addr_flag | varchar(8000) | YES |
| 27 | tr_addr_insert_flag | varchar(8000) | YES |
| 28 | tr_addr_bld_no | varchar(8000) | YES |
| 29 | tr_addr_result | varchar(8000) | YES |
| 30 | u_car_yn | varchar(8000) | YES |
| 31 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_users  (행 0)

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
| 35 | reg_dt | varchar(8000) | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | upd_dt | varchar(8000) | YES |
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
| 54 | last_login_date | varchar(8000) | YES |
| 55 | passwd_upd_dt | varchar(8000) | YES |
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
| 71 | out_act_cust_seq | float | YES |
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
| 87 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_co_vehic  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(8000) | YES | 차량 |
| 3 | vehic_no2 | varchar(8000) | YES | 차량 |
| 4 | vis | varchar(8000) | YES |  |
| 5 | contract_no | float | YES | 계약번호 |
| 6 | model_year | varchar(8000) | YES | 모델 |
| 7 | brand_cd | varchar(8000) | YES | 브랜드 |
| 8 | maker_cd | varchar(8000) | YES | 코드 |
| 9 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 10 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 11 | odometer | bigint | YES |  |
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
| 30 | force_reg_dt | varchar(8000) | YES | 등록일 |
| 31 | force_reg_yn | varchar(8000) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(8000) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 35 | first_rcpt_dt | varchar(8000) | YES | 일자 |
| 36 | sales_dealer_id | varchar(8000) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(8000) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 40 | last_rcpt_dt | varchar(8000) | YES | 일자 |
| 41 | vehic_magic | float | YES | 차량 |
| 42 | ras_no | varchar(8000) | YES | 번호 |
| 43 | ew_no | varchar(8000) | YES | 번호 |
| 44 | sales_type | varchar(8000) | YES | 판매 |
| 45 | ras_start_dt | varchar(8000) | YES | 시작일 |
| 46 | ras_end_dt | varchar(8000) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | varchar(8000) | YES | 수정일 |
| 50 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 51 | upd_dt | varchar(8000) | YES | 수정일 |
| 52 | first_owner_yn | varchar(8000) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | varchar(8000) | YES | 수정일 |
| 55 | hv_badge_yn | varchar(8000) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(8000) | YES | 여부(Y/N) |
| 57 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.l_cu_base  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | float | YES |
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
| 34 | rel_cust_seq | float | YES |
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
| 49 | reg_dt | varchar(8000) | YES |
| 50 | deli_yn | varchar(8000) | YES |
| 51 | reg_user_id | varchar(8000) | YES |
| 52 | bef_crm_seq | decimal(38,18) | YES |
| 53 | upd_dt | varchar(8000) | YES |
| 54 | sc_grp_seq | float | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_knd | varchar(8000) | YES |
| 57 | dealer_grp_seq | float | YES |
| 58 | city | varchar(8000) | YES |
| 59 | gu | varchar(8000) | YES |
| 60 | dong | varchar(8000) | YES |
| 61 | dam_nm | varchar(8000) | YES |
| 62 | dm_receive_cust | varchar(8000) | YES |
| 63 | reg_shop_cd | varchar(8000) | YES |
| 64 | last_contact_date | varchar(8000) | YES |
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
| 96 | ci_seq | float | YES |
| 97 | consign_sales_flag | varchar(8000) | YES |
| 98 | del_dt | varchar(8000) | YES |
| 99 | del_user_id | varchar(8000) | YES |
| 100 | del_type | varchar(8000) | YES |
| 101 | cust_ci | varchar(8000) | YES |
| 102 | ci_reg_dt | varchar(8000) | YES |
| 103 | ci_upd_dt | varchar(8000) | YES |
| 104 | ci_remark | varchar(8000) | YES |
| 105 | realnm_seq | float | YES |
| 106 | oneid_key | float | YES |
| 107 | concern_degree | varchar(8000) | YES |
| 108 | taxpay_no_ymd | float | YES |
| 109 | taxpay_no_g | float | YES |
| 110 | chief_id_dec | varchar(8000) | YES |
| 111 | corp_no_dec | varchar(8000) | YES |
| 112 | taxpay_no_dec | varchar(8000) | YES |
| 113 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_cu_detail  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | float | YES |
| 2 | dealer_id | varchar(8000) | YES |
| 3 | birth_dt | varchar(8000) | YES |
| 4 | mng_sc_id | varchar(8000) | YES |
| 5 | marry_yn | varchar(8000) | YES |
| 6 | luso_type | varchar(8000) | YES |
| 7 | sex_cd | varchar(8000) | YES |
| 8 | cr_yn | varchar(8000) | YES |
| 9 | cr_change_dt | varchar(8000) | YES |
| 10 | marry_dt | varchar(8000) | YES |
| 11 | mng_change_dt | varchar(8000) | YES |
| 12 | cr_type | varchar(8000) | YES |
| 13 | hold_dt | varchar(8000) | YES |
| 14 | intro_cust_seq | float | YES |
| 15 | hobby_cd1 | varchar(8000) | YES |
| 16 | intro_type | varchar(8000) | YES |
| 17 | rememb_dt | varchar(8000) | YES |
| 18 | rememb_dt_desc | varchar(8000) | YES |
| 19 | hobby_cd2 | varchar(8000) | YES |
| 20 | remark | varchar(8000) | YES |
| 21 | concern_mdl1 | varchar(8000) | YES |
| 22 | hobby_etc | varchar(8000) | YES |
| 23 | concern_mdl2 | varchar(8000) | YES |
| 24 | hold_type | varchar(8000) | YES |
| 25 | mng_type | varchar(8000) | YES |
| 26 | ows_cb_yn | varchar(8000) | YES |
| 27 | ows_dt | varchar(8000) | YES |
| 28 | group_cd1 | varchar(8000) | YES |
| 29 | group_cd2 | varchar(8000) | YES |
| 30 | group_etc | varchar(8000) | YES |
| 31 | concern_mdl3 | varchar(8000) | YES |
| 32 | bef_mng_sc_id | varchar(8000) | YES |
| 33 | reg_dt | varchar(8000) | YES |
| 34 | reg_user_id | varchar(8000) | YES |
| 35 | upd_dt | varchar(8000) | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | cr_sub_type | varchar(8000) | YES |
| 38 | reg_shop_cd | varchar(8000) | YES |
| 39 | cr_3rd_type | varchar(8000) | YES |
| 40 | cust_pic_path | varchar(8000) | YES |
| 41 | cust_pic_nm | varchar(8000) | YES |
| 42 | cust_act_type1 | varchar(8000) | YES |
| 43 | cust_act_type2 | varchar(8000) | YES |
| 44 | favor_drink1 | varchar(8000) | YES |
| 45 | favor_drink2 | varchar(8000) | YES |
| 46 | hobby_cd_partner | varchar(8000) | YES |
| 47 | home_town | varchar(8000) | YES |
| 48 | cust_holiday | varchar(8000) | YES |
| 49 | favor_tel_area | varchar(8000) | YES |
| 50 | favor_tel_no | varchar(8000) | YES |
| 51 | prev_hold_type | varchar(8000) | YES |
| 52 | age_cd | varchar(8000) | YES |
| 53 | child_cnt | varchar(8000) | YES |
| 54 | prev_brand | varchar(8000) | YES |
| 55 | prev_mdl | varchar(8000) | YES |
| 56 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_om_contract  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | float | YES | 계약번호 |
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
| 14 | cust_seq | float | YES | 고객 |
| 15 | comp_seq | float | YES | 순번 |
| 16 | real_cust_seq | float | YES | 고객 |
| 17 | owner_seq | float | YES | 순번 |
| 18 | customs_seq | float | YES | 고객 |
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
| 30 | vehic_magic | float | YES | 차량 |
| 31 | vehic_price | float | YES | 차량가격 |
| 32 | vehic_vat | float | YES | 차량 |
| 33 | vehic_option_price | float | YES | 차량가격 |
| 34 | vehic_color_price | float | YES | 색상 |
| 35 | vehic_discount_amt | float | YES | 차량 |
| 36 | vehic_total_amt | float | YES | 차량 |
| 37 | deposit_amt | float | YES | 계약금 |
| 38 | sales_type | varchar(8000) | YES | 판매 |
| 39 | pay_type | varchar(8000) | YES | 유형코드 |
| 40 | tax_type | float | YES | 유형코드 |
| 41 | lease_comp_seq | float | YES | 순번 |
| 42 | reg_free_yn | varchar(8000) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(8000) | YES | 재고 |
| 44 | reg_stock_rate | float | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(8000) | YES | 재고 |
| 46 | reg_agency_yn | varchar(8000) | YES | 등록 |
| 47 | reg_tax | float | YES | 등록 |
| 48 | reg_stock_price | float | YES | 가격 |
| 49 | reg_stamp_price | float | YES | 가격 |
| 50 | reg_plate_price | float | YES | 가격 |
| 51 | reg_fee | float | YES | 등록 |
| 52 | reg_aquisition_tax | float | YES | 등록 |
| 53 | reg_special_tax | float | YES | 등록 |
| 54 | reg_education_tax | float | YES | 등록 |
| 55 | reg_total_amt | float | YES | 총 금액 |
| 56 | take_contract_amt | float | YES | 금액 |
| 57 | take_delivery_amt | float | YES | 금액 |
| 58 | lease_month_amt | float | YES | 금액 |
| 59 | lease_term_dt | varchar(8000) | YES | 일자 |
| 60 | lease_rate | real | YES |  |
| 61 | take_depositer_nm | varchar(8000) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(8000) | YES | 계약금 |
| 63 | side_stamp_price | float | YES | 가격 |
| 64 | side_setup_amt | float | YES | 금액 |
| 65 | side_fee | float | YES |  |
| 66 | side_total_amt | float | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(8000) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(8000) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(8000) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(8000) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(8000) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(8000) | YES | 출고 |
| 73 | request_by | varchar(8000) | YES |  |
| 74 | request_dt | varchar(8000) | YES | 일자 |
| 75 | approval_by | varchar(8000) | YES |  |
| 76 | approval_dt | varchar(8000) | YES | 일자 |
| 77 | cancel_by | varchar(8000) | YES | 취소 |
| 78 | cancel_dt | varchar(8000) | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(8000) | YES | 판매 |
| 80 | last_issued_dt | varchar(8000) | YES | 일자 |
| 81 | last_mod_dt | varchar(8000) | YES | 수정일 |
| 82 | delivery_request_by | varchar(8000) | YES | 출고 |
| 83 | delivery_request_dt | varchar(8000) | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(8000) | YES | 출고 |
| 85 | delivery_cancel_dt | varchar(8000) | YES | 출고일 |
| 86 | delivery_plan_by | varchar(8000) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(8000) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(8000) | YES | 출고 |
| 89 | delivery_approval_dt | varchar(8000) | YES | 출고일 |
| 90 | reg_plan_dt | varchar(8000) | YES | 등록일 |
| 91 | contract_msg | varchar(8000) | YES | 계약 |
| 92 | vehic_reg_no | varchar(8000) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(8000) | YES | 차량 |
| 94 | dept_cd | varchar(8000) | YES | 코드 |
| 95 | boc_except_dt | varchar(8000) | YES | 일자 |
| 96 | reg_dt | varchar(8000) | YES | 등록일 |
| 97 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 98 | upd_dt | varchar(8000) | YES | 수정일 |
| 99 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(8000) | YES | 여부(Y/N) |
| 101 | allocation_dt | varchar(8000) | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(8000) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(8000) | YES | 고객 |
| 104 | rs_cust_addr | varchar(8000) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(8000) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(8000) | YES |  |
| 107 | rs_geo_loc_y | varchar(8000) | YES |  |
| 108 | potential_division | varchar(8000) | YES |  |
| 109 | org_followup_id | float | YES | 식별자(ID) |
| 110 | plate_size | varchar(8000) | YES |  |
| 111 | receiver_apply_yn | varchar(8000) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(8000) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(8000) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(8000) | YES | 번호 |
| 115 | receiver_ssn | varchar(8000) | YES |  |
| 116 | pma_yn | varchar(8000) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(8000) | YES | 고객번호 |
| 118 | family_seq | float | YES | 순번 |
| 119 | lemon_yn | varchar(8000) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(8000) | YES |  |
| 121 | app_flag | varchar(8000) | YES |  |
| 122 | consign_sales_flag | varchar(8000) | YES | 판매 |
| 123 | contract_msg_kr | varchar(8000) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(8000) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(8000) | YES | 고객 |
| 126 | realnm_seq | float | YES | 순번 |
| 127 | tax_biz_no | varchar(8000) | YES | 번호 |
| 128 | pma_city | varchar(8000) | YES | 시 |
| 129 | pma_gu | varchar(8000) | YES | 구 |
| 130 | taxpay_no_ymd | bigint | YES |  |
| 131 | taxpay_no_g | bigint | YES |  |
| 132 | flood_yn | varchar(8000) | YES | 여부(Y/N) |
| 133 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.l_pt_part  (행 0)

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
| 24 | net_weit | float | YES |  |
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
| 58 | reg_dt | varchar(8000) | YES | 등록일 |
| 59 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 60 | upd_dt | varchar(8000) | YES | 수정일 |
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
| 71 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.l_pt_sout_detl  (행 0)

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
| 15 | dc_rate | real | YES |
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
| 37 | svc_propo_seq | float | YES |
| 38 | svc_part_no | varchar(8000) | YES |
| 39 | svc_part_seq | float | YES |
| 40 | twc_stat | varchar(8000) | YES |
| 41 | payback_yn | varchar(8000) | YES |
| 42 | payback_qty | bigint | YES |
| 43 | biz_shop_cd | varchar(8000) | YES |
| 44 | biz_no | varchar(8000) | YES |
| 45 | biz_detl_line_no | int | YES |
| 46 | reg_dt | varchar(8000) | YES |
| 47 | reg_user_id | varchar(8000) | YES |
| 48 | upd_dt | varchar(8000) | YES |
| 49 | upd_user_id | varchar(8000) | YES |
| 50 | cancel_receipt_dt | varchar(8000) | YES |
| 51 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_sfa_testcar_trial  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reserved_dt | varchar(8000) | YES |
| 2 | from_time | varchar(8000) | YES |
| 3 | testcar_no | varchar(8000) | YES |
| 4 | trial_no | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | shop_cd | varchar(8000) | YES |
| 7 | to_time | varchar(8000) | YES |
| 8 | reserve_term | float | YES |
| 9 | prev_km | float | YES |
| 10 | test_type | varchar(8000) | YES |
| 11 | use_type | varchar(8000) | YES |
| 12 | vin | varchar(8000) | YES |
| 13 | model_cd | varchar(8000) | YES |
| 14 | variant_cd | varchar(8000) | YES |
| 15 | my_cd | varchar(8000) | YES |
| 16 | cust_seq | float | YES |
| 17 | cust_nm | varchar(8000) | YES |
| 18 | res_group_id | varchar(8000) | YES |
| 19 | res_user_id | varchar(8000) | YES |
| 20 | res_memo | varchar(8000) | YES |
| 21 | destination | varchar(8000) | YES |
| 22 | end_km | float | YES |
| 23 | interest_degree | varchar(8000) | YES |
| 24 | purchase_degree | varchar(8000) | YES |
| 25 | result_memo | varchar(8000) | YES |
| 26 | test_yn | varchar(8000) | YES |
| 27 | view_word | varchar(8000) | YES |
| 28 | reg_dt | varchar(8000) | YES |
| 29 | reg_user_id | varchar(8000) | YES |
| 30 | upd_dt | varchar(8000) | YES |
| 31 | upd_user_id | varchar(8000) | YES |
| 32 | test_type2 | varchar(8000) | YES |
| 33 | res_shop_cd | varchar(8000) | YES |
| 34 | res_dept_cd | varchar(8000) | YES |
| 35 | app_flag | varchar(8000) | YES |
| 36 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_sfa_testdrive_req  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | req_seq | float | YES |
| 2 | req_reg_dt | varchar(8000) | YES |
| 3 | req_system_id | varchar(8000) | YES |
| 4 | shop_cd | varchar(8000) | YES |
| 5 | brand | varchar(8000) | YES |
| 6 | model | varchar(8000) | YES |
| 7 | variant | varchar(8000) | YES |
| 8 | req_ymd | varchar(8000) | YES |
| 9 | req_fr_time | varchar(8000) | YES |
| 10 | req_to_time | varchar(8000) | YES |
| 11 | inbound_path | varchar(8000) | YES |
| 12 | req_path | varchar(8000) | YES |
| 13 | req_memo | varchar(8000) | YES |
| 14 | cust_nm | varchar(8000) | YES |
| 15 | cust_contact_no | varchar(8000) | YES |
| 16 | cust_email | varchar(8000) | YES |
| 17 | cust_area | varchar(8000) | YES |
| 18 | cust_age_group | varchar(8000) | YES |
| 19 | cust_gender | varchar(8000) | YES |
| 20 | status | varchar(8000) | YES |
| 21 | alloc_tp | varchar(8000) | YES |
| 22 | alloc_dt | varchar(8000) | YES |
| 23 | alloc_user_id | varchar(8000) | YES |
| 24 | mng_sc_id | varchar(8000) | YES |
| 25 | alloc_delay_alarm_status | varchar(8000) | YES |
| 26 | alloc_delay_alarm_dt | varchar(8000) | YES |
| 27 | cons_dt | varchar(8000) | YES |
| 28 | cons_user_id | varchar(8000) | YES |
| 29 | cons_delay_alarm_status | varchar(8000) | YES |
| 30 | cons_delay_alarm_dt | varchar(8000) | YES |
| 31 | fail_reason_cd | varchar(8000) | YES |
| 32 | fail_reason_memo | varchar(8000) | YES |
| 33 | ref_cons_seq | float | YES |
| 34 | ref_cust_seq | float | YES |
| 35 | ref_td_reserved_dt | varchar(8000) | YES |
| 36 | ref_td_from_time | varchar(8000) | YES |
| 37 | ref_td_testcar_no | varchar(8000) | YES |
| 38 | ref_contract_no | float | YES |
| 39 | own_cust_yn | varchar(8000) | YES |
| 40 | reg_user_id | varchar(8000) | YES |
| 41 | reg_dt | varchar(8000) | YES |
| 42 | upd_user_id | varchar(8000) | YES |
| 43 | upd_dt | varchar(8000) | YES |
| 44 | ref_td_trial_no | varchar(8000) | YES |
| 45 | td_center_yn | varchar(8000) | YES |
| 46 | close_dt | varchar(8000) | YES |
| 47 | close_user_id | varchar(8000) | YES |
| 48 | org_shop_cd | varchar(8000) | YES |
| 49 | app_alloc_push_status | varchar(8000) | YES |
| 50 | app_alloc_push_dt | varchar(8000) | YES |
| 51 | thmp_td_client_id | varchar(8000) | YES |
| 52 | thmp_td_url | varchar(8000) | YES |
| 53 | request_path | varchar(8000) | YES |
| 54 | event_type | varchar(8000) | YES |
| 55 | interest_brand | varchar(8000) | YES |
| 56 | interest_variant | varchar(8000) | YES |
| 57 | custinfo_exp_dt | varchar(8000) | YES |
| 58 | marketing_agree_yn | varchar(8000) | YES |
| 59 | untact_yn | varchar(8000) | YES |
| 60 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_svc_propo  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SHOP_CD | varchar(8000) | YES |
| 2 | PROPO_DT | varchar(8000) | YES |
| 3 | PROPO_SEQ | bigint | YES |
| 4 | REPAIR_TYPE_CD | varchar(8000) | YES |
| 5 | PROPO_TYPE_CD | varchar(8000) | YES |
| 6 | VIN | varchar(8000) | YES |
| 7 | VIS | varchar(8000) | YES |
| 8 | VEHIC_NO1 | varchar(8000) | YES |
| 9 | VEHIC_NO2 | varchar(8000) | YES |
| 10 | VARIANT_NM | varchar(8000) | YES |
| 11 | SVC_MODEL_CD | varchar(8000) | YES |
| 12 | VEHIC_BASE_ODOMETER | int | YES |
| 13 | ODOMETER | int | YES |
| 14 | CUST_SEQ | int | YES |
| 15 | CUST_NM | varchar(8000) | YES |
| 16 | CUST_IDFY_NO | varchar(8000) | YES |
| 17 | CUST_RCPT_REL_CD | varchar(8000) | YES |
| 18 | RCPT_CUST_NM | varchar(8000) | YES |
| 19 | RCPT_HP_AREA | varchar(8000) | YES |
| 20 | RCPT_HP_NO | varchar(8000) | YES |
| 21 | RCPT_TEL_AREA | varchar(8000) | YES |
| 22 | RCPT_TEL_NO | varchar(8000) | YES |
| 23 | VIP_YN | varchar(8000) | YES |
| 24 | SVC_TYPE_CD | varchar(8000) | YES |
| 25 | SVC_TYPE_FMS_CD | varchar(8000) | YES |
| 26 | RESV_DT | varchar(8000) | YES |
| 27 | RESV_SEQ | int | YES |
| 28 | ESTI_DT | varchar(8000) | YES |
| 29 | ESTI_SEQ | int | YES |
| 30 | WORK_CLOSE_YN | varchar(8000) | YES |
| 31 | STAT_CD | varchar(8000) | YES |
| 32 | STAT_CHNG_DT | varchar(8000) | YES |
| 33 | STAT_CHNG_USER_ID | varchar(8000) | YES |
| 34 | WORK_EXPT_ST_DT | varchar(8000) | YES |
| 35 | WORK_EXPT_END_DT | varchar(8000) | YES |
| 36 | CUST_DELIVERY_YN | varchar(8000) | YES |
| 37 | CUST_DELIVERY_EXPT_DT | varchar(8000) | YES |
| 38 | CUST_DELIVERY_REAL_DT | varchar(8000) | YES |
| 39 | OLD_PART_YN | varchar(8000) | YES |
| 40 | CUST_LOC_CD | varchar(8000) | YES |
| 41 | VEHIC_LOC_CD | varchar(8000) | YES |
| 42 | DAMAGE_TYPE_CD | varchar(8000) | YES |
| 43 | STALL_NO | float | YES |
| 44 | SMS_YN | varchar(8000) | YES |
| 45 | WASH_STAT_CD | varchar(8000) | YES |
| 46 | CUST_RQST | varchar(8000) | YES |
| 47 | SA_SUGST | varchar(8000) | YES |
| 48 | TECHMAN_SUGST | varchar(8000) | YES |
| 49 | PART_SUGST | varchar(8000) | YES |
| 50 | RCPT_SA_ID | varchar(8000) | YES |
| 51 | RCPT_TIME | float | YES |
| 52 | PROPO_ISSU_TIME | float | YES |
| 53 | MNG_SA_ID | varchar(8000) | YES |
| 54 | MNG_FOREMAN_ID | varchar(8000) | YES |
| 55 | HAPPYCALL_TARGET_YN | varchar(8000) | YES |
| 56 | HAPPYCALL_REJECT_CD | varchar(8000) | YES |
| 57 | CANCEL_REASON_CD | varchar(8000) | YES |
| 58 | CANCEL_REASON | varchar(8000) | YES |
| 59 | PAYBACK_YN | varchar(8000) | YES |
| 60 | BASE_PROPO_DT | varchar(8000) | YES |
| 61 | BASE_PROPO_SEQ | int | YES |
| 62 | PREV_SHOP_CD | varchar(8000) | YES |
| 63 | PREV_PROPO_DT | varchar(8000) | YES |
| 64 | PREV_PROPO_SEQ | bigint | YES |
| 65 | PREV_ODOMETER | int | YES |
| 66 | PREV_ACC_SHOP_CD | varchar(8000) | YES |
| 67 | PREV_ACC_PROPO_DT | varchar(8000) | YES |
| 68 | PREV_ACC_PROPO_SEQ | int | YES |
| 69 | UP_GROUP_ID | varchar(8000) | YES |
| 70 | REG_DT | varchar(8000) | YES |
| 71 | REG_USER_ID | varchar(8000) | YES |
| 72 | UPD_DT | varchar(8000) | YES |
| 73 | UPD_USER_ID | varchar(8000) | YES |
| 74 | CUST_DELIVERY_ZIP | varchar(8000) | YES |
| 75 | CUST_DELIVERY_ADDR | varchar(8000) | YES |
| 76 | CUST_DELIVERY_ADDR2 | varchar(8000) | YES |
| 77 | CUST_DELIVERY_LOC_X | varchar(8000) | YES |
| 78 | CUST_DELIVERY_LOC_Y | varchar(8000) | YES |
| 79 | ADD_PROC_REG_DT | varchar(8000) | YES |
| 80 | ADD_PROC_REG_ID | varchar(8000) | YES |
| 81 | ADD_PROC_SUGST | varchar(8000) | YES |
| 82 | PDC_YN | varchar(8000) | YES |
| 83 | HBEC_YN | varchar(8000) | YES |
| 84 | HBEC_SEQ | int | YES |
| 85 | NEX_SVC | varchar(8000) | YES |
| 86 | SC_FORWARD_FEEDBACK | varchar(8000) | YES |
| 87 | REPEAT_REPAIR | varchar(8000) | YES |
| 88 | REFLAW_TYPE | varchar(8000) | YES |
| 89 | MOLIT_TARGET_YN | varchar(8000) | YES |
| 90 | EM_YN | varchar(8000) | YES |
| 91 | APP_RCPT_FLAG | varchar(8000) | YES |
| 92 | REPAET_ALARM | varchar(8000) | YES |
| 93 | FIN_UPLOAD_SEQ | int | YES |
| 94 | ESTI_TYPE | varchar(8000) | YES |
| 95 | END_GB | varchar(8000) | YES |
| 96 | SVC_IN_SC_ID | varchar(8000) | YES |
| 97 | RECALL_BEFORE_SALE_YN | varchar(8000) | YES |
| 98 | BP_DELI_SITE | varchar(8000) | YES |
| 99 | BP_INSU_COMP | bigint | YES |
| 100 | FREE_SERVICE_SUGST | varchar(8000) | YES |
| 101 | CUST_REPAIR_REQ | varchar(8000) | YES |
| 102 | APP_SAVE_FLAG | varchar(8000) | YES |
| 103 | VALUABLE_YN | varchar(8000) | YES |
| 104 | DMS_FIRST_SAVE_FLAG | varchar(8000) | YES |
| 105 | PROPO_TALK_SEND_TIME | varchar(8000) | YES |
| 106 | PROPO_TALK_SEND_USER_ID | varchar(8000) | YES |
| 107 | PROPO_TALK_MSEQ | bigint | YES |
| 108 | CALC_TALK_SEND_TIME | varchar(8000) | YES |
| 109 | CALC_TALK_SEND_USER_ID | varchar(8000) | YES |
| 110 | CALC_TALK_MSEQ | bigint | YES |
| 111 | CUST_REPAIR_REQ_TEXT | varchar(8000) | YES |
| 112 | SIGN_YN | varchar(8000) | YES |
| 113 | AGORA_USE_DT | varchar(8000) | YES |
| 114 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_svc_propo_part  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SHOP_CD | varchar(8000) | YES | 전시장 코드 |
| 2 | PROPO_DT | varchar(8000) | YES | 일자 |
| 3 | PROPO_SEQ | bigint | YES | 순번 |
| 4 | PART_NO | varchar(8000) | YES | 부품번호 |
| 5 | SEQ | int | YES | 순번 |
| 6 | RO_TYPE_CD | varchar(8000) | YES | 유형코드 |
| 7 | SETTLE_TYPE_CD | varchar(8000) | YES | 유형코드 |
| 8 | PROPO_STAT_CD | varchar(8000) | YES | 상태코드 |
| 9 | STAT_CD | varchar(8000) | YES | 상태코드 |
| 10 | STAT_CHNG_DT | varchar(8000) | YES | 일자 |
| 11 | RQST_ISSU_QTY | int | YES | 수량 |
| 12 | REAL_ISSU_QTY | int | YES | 수량 |
| 13 | SALE_UNIT_PRICE | float | YES | 가격 |
| 14 | SALE_AMT | float | YES | 금액 |
| 15 | DC_AMT | float | YES | 금액 |
| 16 | CNFM_UNIT_PRICE | float | YES | 가격 |
| 17 | CNFM_AMT | float | YES | 금액 |
| 18 | GRP_NO | float | YES | 번호 |
| 19 | DISP_RANK | decimal(38,18) | YES |  |
| 20 | CR_NO | varchar(8000) | YES | 번호 |
| 21 | FMS_ITEM_CD | varchar(8000) | YES | 코드 |
| 22 | SVC_CAMPG_NO | float | YES | 번호 |
| 23 | TWC_NO | varchar(8000) | YES | 번호 |
| 24 | ORDER_NO | varchar(8000) | YES | 주문번호 |
| 25 | ORDER_LINE_NO | float | YES | 주문번호 |
| 26 | SOUT_NO | varchar(8000) | YES | 번호 |
| 27 | SOUT_LINE_NO | float | YES | 번호 |
| 28 | CANCEL_YN | varchar(8000) | YES | 취소 |
| 29 | INCOME_QTY | int | YES | 수량 |
| 30 | ORDER_QTY | int | YES | 수량 |
| 31 | INCOME_RESV_QTY | int | YES | 수량 |
| 32 | RESV_CLEAR_QTY | int | YES | 수량 |
| 33 | RESV_REAL_QTY | int | YES | 수량 |
| 34 | RQST_REMOVE_QTY | int | YES | 수량 |
| 35 | RESV_DT | varchar(8000) | YES | 일자 |
| 36 | RESV_SEQ | int | YES | 순번 |
| 37 | REMOVE_YN | varchar(8000) | YES | 여부(Y/N) |
| 38 | REJECT_CD | varchar(8000) | YES | 코드 |
| 39 | SVC_HIST_DISP_YN | varchar(8000) | YES | 여부(Y/N) |
| 40 | REG_DT | varchar(8000) | YES | 등록일 |
| 41 | REG_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 42 | UPD_DT | varchar(8000) | YES | 수정일 |
| 43 | UPD_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | RCIT_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 45 | CR_CASE_NO | smallint | YES | 번호 |
| 46 | PKG_YN | varchar(8000) | YES | 여부(Y/N) |
| 47 | PSP_UNIT_PRICE | float | YES | 가격 |
| 48 | PSP_AMT | float | YES | 금액 |
| 49 | ADD_YN | varchar(8000) | YES | 여부(Y/N) |
| 50 | PSP_CODE | varchar(8000) | YES | 코드 |
| 51 | PM_CODE | varchar(8000) | YES | 코드 |
| 52 | PM_SEQ | int | YES | 순번 |
| 53 | AUDA_YN | varchar(8000) | YES | 여부(Y/N) |
| 54 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.l_vs_model  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | model_nm | varchar(8000) | YES |
| 4 | curr_sales_yn | varchar(8000) | YES |
| 5 | display_order | float | YES |
| 6 | reg_dt | varchar(8000) | YES |
| 7 | upd_dt | varchar(8000) | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_user_id | varchar(8000) | YES |
| 10 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_vs_sfx  (행 0)

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
| 12 | display_order | float | YES |
| 13 | launch_dt | varchar(8000) | YES |
| 14 | form_apply | varchar(8000) | YES |
| 15 | motive_type | varchar(8000) | YES |
| 16 | taking_fix | varchar(8000) | YES |
| 17 | displacement | varchar(8000) | YES |
| 18 | hp | varchar(8000) | YES |
| 19 | gross_weight | varchar(8000) | YES |
| 20 | cylinder_cnt | smallint | YES |
| 21 | max_load | varchar(8000) | YES |
| 22 | max_output | float | YES |
| 23 | length | float | YES |
| 24 | width | float | YES |
| 25 | height | float | YES |
| 26 | order_yn | varchar(8000) | YES |
| 27 | reg_dt | varchar(8000) | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | varchar(8000) | YES |
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
| 43 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_vs_variant  (행 0)

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
| 13 | warranty_month | float | YES |
| 14 | display_order | float | YES |
| 15 | reg_dt | varchar(8000) | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | varchar(8000) | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | daily_report_variant_cd | varchar(8000) | YES |
| 20 | daily_report_yn | varchar(8000) | YES |
| 21 | prod_loc | varchar(8000) | YES |
| 22 | report_variant_nm | varchar(8000) | YES |
| 23 | report_display_order | float | YES |
| 24 | pre_variant_nm | varchar(8000) | YES |
| 25 | ecrb_variant_nm | varchar(8000) | YES |
| 26 | hybrid_yn | varchar(8000) | YES |
| 27 | spec_variant_nm | varchar(8000) | YES |
| 28 | variant_cd_jpn | varchar(8000) | YES |
| 29 | grade | varchar(8000) | YES |
| 30 | concern_mdl_yn | varchar(8000) | YES |
| 31 | fuel_type_cd | varchar(8000) | YES |
| 32 | ELT_TIME | varchar(8000) | YES |

#### dbo.l_vt_vehic_supply  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vehic_magic | float | YES | 차량 |
| 2 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 3 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 4 | brand_cd | varchar(8000) | YES | 브랜드 |
| 5 | model_cd | varchar(8000) | YES | 모델 코드 |
| 6 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 7 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 8 | my_cd | varchar(8000) | YES | 코드 |
| 9 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 10 | progress | varchar(8000) | YES |  |
| 11 | preprogress | varchar(8000) | YES |  |
| 12 | stock_status | varchar(8000) | YES | 재고 |
| 13 | import_license_yn | varchar(8000) | YES | 여부(Y/N) |
| 14 | assembly_pdt | varchar(8000) | YES |  |
| 15 | lo_pdt | varchar(8000) | YES |  |
| 16 | jpn_port_out_pdt | varchar(8000) | YES |  |
| 17 | port_in_pdt | varchar(8000) | YES |  |
| 18 | mp_in_pdt | varchar(8000) | YES |  |
| 19 | pdi_in_pdt | varchar(8000) | YES |  |
| 20 | pdi_out_pdt | varchar(8000) | YES |  |
| 21 | mp_out_pdt | varchar(8000) | YES |  |
| 22 | dlr_arrival_pdt | varchar(8000) | YES |  |
| 23 | dealer_use | varchar(8000) | YES | 딜러 |
| 24 | assembly_adt | varchar(8000) | YES |  |
| 25 | lo_adt | varchar(8000) | YES |  |
| 26 | prod_start_adt | varchar(8000) | YES | 시작일 |
| 27 | jpn_yard_in_adt | varchar(8000) | YES |  |
| 28 | jpn_yard_out_adt | varchar(8000) | YES |  |
| 29 | permit_dt | varchar(8000) | YES | 일자 |
| 30 | jpn_port_in_adt | varchar(8000) | YES |  |
| 31 | jpn_port_out_adt | varchar(8000) | YES |  |
| 32 | port_in_adt | varchar(8000) | YES |  |
| 33 | shipback_dt | varchar(8000) | YES | 일자 |
| 34 | port_out_adt | varchar(8000) | YES |  |
| 35 | port_in_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 36 | mp_loc | varchar(8000) | YES |  |
| 37 | mp_in_type | varchar(8000) | YES | 유형코드 |
| 38 | mp_normal_in_adt | varchar(8000) | YES |  |
| 39 | mp_in_adt | varchar(8000) | YES |  |
| 40 | org_mp_in_adt | varchar(8000) | YES |  |
| 41 | old_pdi_pdt | varchar(8000) | YES |  |
| 42 | pdi_in_adt | varchar(8000) | YES |  |
| 43 | pdi_in_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | pdi_out_adt | varchar(8000) | YES |  |
| 45 | pdi_id_no | varchar(8000) | YES | 번호 |
| 46 | pdi_out_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 47 | handover_cl_status | varchar(8000) | YES | 상태코드 |
| 48 | handover_cl_reason | varchar(8000) | YES |  |
| 49 | handover_dt | varchar(8000) | YES | 일자 |
| 50 | mp_out_type | varchar(8000) | YES | 유형코드 |
| 51 | mp_out_adt | varchar(8000) | YES |  |
| 52 | mp_normal_out_adt | varchar(8000) | YES |  |
| 53 | request_dt | varchar(8000) | YES | 일자 |
| 54 | dlr_arrival_adt | varchar(8000) | YES |  |
| 55 | dlr_arrival_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 56 | non_handover_reason | varchar(8000) | YES |  |
| 57 | dlr_trouble_reason | varchar(8000) | YES |  |
| 58 | dlr_trouble_shooting | varchar(8000) | YES |  |
| 59 | dlr_option_request_dt | varchar(8000) | YES | 일자 |
| 60 | dlr_option_pdt | varchar(8000) | YES |  |
| 61 | dlr_option_adt | varchar(8000) | YES |  |
| 62 | dlr_option_end_dt | varchar(8000) | YES | 종료일 |
| 63 | option1 | varchar(8000) | YES |  |
| 64 | option2 | varchar(8000) | YES |  |
| 65 | option3 | varchar(8000) | YES |  |
| 66 | option4 | varchar(8000) | YES |  |
| 67 | engine_no | varchar(8000) | YES | 번호 |
| 68 | key_no | varchar(8000) | YES | 번호 |
| 69 | vin2 | varchar(8000) | YES |  |
| 70 | registration_adt | varchar(8000) | YES | 등록일 |
| 71 | reg_no | varchar(8000) | YES | 등록 |
| 72 | wa_expired_dt | varchar(8000) | YES | 일자 |
| 73 | wa_mileage | float | YES |  |
| 74 | st_prev_dealer_id | varchar(8000) | YES | 딜러 ID |
| 75 | stdwstotal_price | float | YES | 가격 |
| 76 | stdwscost_price | float | YES | 가격 |
| 77 | stdwsvat_price | float | YES | 가격 |
| 78 | last_move_seq | float | YES | 순번 |
| 79 | plant_cd | varchar(8000) | YES | 코드 |
| 80 | yard_loc | varchar(8000) | YES |  |
| 81 | vessel_cd | varchar(8000) | YES | 코드 |
| 82 | port_cd | varchar(8000) | YES | 코드 |
| 83 | pdi_loc | varchar(8000) | YES |  |
| 84 | current_loc | varchar(8000) | YES |  |
| 85 | option_mount_tp | varchar(8000) | YES |  |
| 86 | al_status | varchar(8000) | YES | 상태코드 |
| 87 | clearance_yn | varchar(8000) | YES | 여부(Y/N) |
| 88 | clearance_dt | varchar(8000) | YES | 일자 |
| 89 | wholesalestype | varchar(8000) | YES | 판매 |
| 90 | wholesales_adt | varchar(8000) | YES | 판매 |
| 91 | ws_cancel_dt | varchar(8000) | YES | 취소일 |
| 92 | wholesales_cl_status | varchar(8000) | YES | 판매 |
| 93 | wholesales_cl_reason | varchar(8000) | YES | 판매 |
| 94 | retailsalestype | varchar(8000) | YES | 판매 |
| 95 | retailsales_adt | varchar(8000) | YES | 판매 |
| 96 | realwstotal_price | float | YES | 가격 |
| 97 | realwscost_price | float | YES | 가격 |
| 98 | realwsvat_price | float | YES | 가격 |
| 99 | description | varchar(8000) | YES |  |
| 100 | remark | varchar(8000) | YES |  |
| 101 | serial_no | varchar(8000) | YES | 번호 |
| 102 | reg_dt | varchar(8000) | YES | 등록일 |
| 103 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 104 | upd_dt | varchar(8000) | YES | 수정일 |
| 105 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 106 | gate_out_adt | varchar(8000) | YES |  |
| 107 | final_inspection_adt | varchar(8000) | YES |  |
| 108 | ds_no | varchar(8000) | YES | 번호 |
| 109 | ed_no | varchar(8000) | YES | 번호 |
| 110 | prod_order_no | varchar(8000) | YES | 주문번호 |
| 111 | dlr_order_no | varchar(8000) | YES | 주문번호 |
| 112 | prod_ym | varchar(8000) | YES |  |
| 113 | current_loc2 | varchar(8000) | YES |  |
| 114 | customs_dt | varchar(8000) | YES | 고객 |
| 115 | customs_user_id | varchar(8000) | YES | 고객 |
| 116 | kor_yard_in_adt | varchar(8000) | YES |  |
| 117 | kor_yard_out_adt | varchar(8000) | YES |  |
| 118 | urn_no | varchar(8000) | YES | 번호 |
| 119 | carry_loc | varchar(8000) | YES |  |
| 120 | yard_loc_kor | varchar(8000) | YES |  |
| 121 | damage_yn | varchar(8000) | YES | 여부(Y/N) |
| 122 | damage_memo | varchar(8000) | YES |  |
| 123 | damage_loc | varchar(8000) | YES |  |
| 124 | damage_size | varchar(8000) | YES |  |
| 125 | damage_payback | varchar(8000) | YES |  |
| 126 | description_kr | varchar(8000) | YES |  |
| 127 | stevedore_cd | varchar(8000) | YES | 코드 |
| 128 | tcm_stk_yn | varchar(8000) | YES | 여부(Y/N) |
| 129 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.t_co_code  (행 0)

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
| 10 | reg_dt | varchar(8000) | YES |
| 11 | reg_user_id | varchar(8000) | YES |
| 12 | upd_dt | varchar(8000) | YES |
| 13 | upd_user_id | varchar(8000) | YES |
| 14 | attr1 | varchar(8000) | YES |
| 15 | code_type_gb | varchar(8000) | YES |
| 16 | attr2 | varchar(8000) | YES |
| 17 | attr3 | varchar(8000) | YES |
| 18 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_co_group  (행 0)

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
| 14 | showroom_no | float | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | float | YES |
| 17 | fee_transfer | float | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | smallint | YES |
| 22 | daily_report_seq | float | YES |
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
| 40 | org_id | float | YES |
| 41 | set_of_books_id | float | YES |
| 42 | location_id | float | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | varchar(8000) | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | varchar(8000) | YES |
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
| 94 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_co_group_bi_stg  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(8000) | YES |
| 2 | brand_cd | varchar(8000) | YES |
| 3 | bi_group_id | varchar(8000) | YES |
| 4 | bi_group_name | varchar(8000) | YES |
| 5 | reg_user_id | varchar(8000) | YES |
| 6 | reg_dt | datetime2 | YES |
| 7 | upd_user_id | varchar(8000) | YES |
| 8 | upd_dt | datetime2 | YES |

#### dbo.t_co_holdings  (행 0)

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
| 14 | showroom_no | float | YES |
| 15 | kaida_group_id | varchar(8000) | YES |
| 16 | fee_delivery | float | YES |
| 17 | fee_transfer | float | YES |
| 18 | service_yn | varchar(8000) | YES |
| 19 | service_ip | varchar(8000) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | smallint | YES |
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
| 40 | org_id | float | YES |
| 41 | set_of_books_id | float | YES |
| 42 | location_id | float | YES |
| 43 | reg_user_id | varchar(8000) | YES |
| 44 | reg_dt | varchar(8000) | YES |
| 45 | upd_user_id | varchar(8000) | YES |
| 46 | upd_dt | varchar(8000) | YES |
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
| 93 | oid_group_num | float | YES |
| 94 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_co_organization  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dept_cd | varchar(8000) | YES |
| 2 | up_dept_cd | varchar(8000) | YES |
| 3 | dept_nm | varchar(8000) | YES |
| 4 | rank | smallint | YES |
| 5 | zip | varchar(8000) | YES |
| 6 | adr | varchar(8000) | YES |
| 7 | adr_no | varchar(8000) | YES |
| 8 | tel_no | varchar(8000) | YES |
| 9 | fax_no | varchar(8000) | YES |
| 10 | sales_yn | varchar(8000) | YES |
| 11 | shop_yn | varchar(8000) | YES |
| 12 | use_yn | varchar(8000) | YES |
| 13 | close_dt | varchar(8000) | YES |
| 14 | reg_use_id | varchar(8000) | YES |
| 15 | reg_dt | varchar(8000) | YES |
| 16 | upd_use_id | varchar(8000) | YES |
| 17 | upd_dt | varchar(8000) | YES |
| 18 | tel_area | varchar(8000) | YES |
| 19 | fax_area | varchar(8000) | YES |
| 20 | group_id | varchar(8000) | YES |
| 21 | dealer_id | varchar(8000) | YES |
| 22 | bol_yn | varchar(8000) | YES |
| 23 | tr_zip | varchar(8000) | YES |
| 24 | tr_addr | varchar(8000) | YES |
| 25 | tr_addr_no | varchar(8000) | YES |
| 26 | tr_addr_flag | varchar(8000) | YES |
| 27 | tr_addr_insert_flag | varchar(8000) | YES |
| 28 | tr_addr_bld_no | varchar(8000) | YES |
| 29 | tr_addr_result | varchar(8000) | YES |
| 30 | u_car_yn | varchar(8000) | YES |
| 31 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_co_users  (행 0)

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
| 35 | reg_dt | varchar(8000) | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | upd_dt | varchar(8000) | YES |
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
| 54 | last_login_date | varchar(8000) | YES |
| 55 | passwd_upd_dt | varchar(8000) | YES |
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
| 72 | out_act_cust_seq | float | YES |
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
| 88 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_co_vehic  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(8000) | YES | 차량 |
| 3 | vehic_no2 | varchar(8000) | YES | 차량 |
| 4 | vis | varchar(8000) | YES |  |
| 5 | contract_no | float | YES | 계약번호 |
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
| 30 | force_reg_dt | varchar(8000) | YES | 등록일 |
| 31 | force_reg_yn | varchar(8000) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(8000) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 35 | first_rcpt_dt | varchar(8000) | YES | 일자 |
| 36 | sales_dealer_id | varchar(8000) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(8000) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(8000) | YES | 딜러 ID |
| 40 | last_rcpt_dt | varchar(8000) | YES | 일자 |
| 41 | vehic_magic | float | YES | 차량 |
| 42 | ras_no | varchar(8000) | YES | 번호 |
| 43 | ew_no | varchar(8000) | YES | 번호 |
| 44 | sales_type | varchar(8000) | YES | 판매 |
| 45 | ras_start_dt | varchar(8000) | YES | 시작일 |
| 46 | ras_end_dt | varchar(8000) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | varchar(8000) | YES | 수정일 |
| 50 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 51 | upd_dt | varchar(8000) | YES | 수정일 |
| 52 | first_owner_yn | varchar(8000) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | varchar(8000) | YES | 수정일 |
| 55 | hv_badge_yn | varchar(8000) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(8000) | YES | 여부(Y/N) |
| 57 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.t_cu_base  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | float | YES |
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
| 34 | rel_cust_seq | float | YES |
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
| 49 | reg_dt | varchar(8000) | YES |
| 50 | deli_yn | varchar(8000) | YES |
| 51 | reg_user_id | varchar(8000) | YES |
| 52 | bef_crm_seq | float | YES |
| 53 | upd_dt | varchar(8000) | YES |
| 54 | sc_grp_seq | float | YES |
| 55 | upd_user_id | varchar(8000) | YES |
| 56 | cust_knd | varchar(8000) | YES |
| 57 | dealer_grp_seq | float | YES |
| 58 | city | varchar(8000) | YES |
| 59 | gu | varchar(8000) | YES |
| 60 | dong | varchar(8000) | YES |
| 61 | dam_nm | varchar(8000) | YES |
| 62 | dm_receive_cust | varchar(8000) | YES |
| 63 | reg_shop_cd | varchar(8000) | YES |
| 64 | last_contact_date | varchar(8000) | YES |
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
| 96 | ci_seq | float | YES |
| 97 | consign_sales_flag | varchar(8000) | YES |
| 98 | del_dt | varchar(8000) | YES |
| 99 | del_user_id | varchar(8000) | YES |
| 100 | del_type | varchar(8000) | YES |
| 101 | cust_ci | varchar(8000) | YES |
| 102 | ci_reg_dt | varchar(8000) | YES |
| 103 | ci_upd_dt | varchar(8000) | YES |
| 104 | ci_remark | varchar(8000) | YES |
| 105 | realnm_seq | float | YES |
| 106 | oneid_key | float | YES |
| 107 | concern_degree | varchar(8000) | YES |
| 108 | taxpay_no_ymd | float | YES |
| 109 | taxpay_no_g | float | YES |
| 110 | chief_id_dec | varchar(8000) | YES |
| 111 | corp_no_dec | varchar(8000) | YES |
| 112 | taxpay_no_dec | varchar(8000) | YES |
| 113 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_cu_detail  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | float | YES |
| 2 | dealer_id | varchar(8000) | YES |
| 3 | birth_dt | varchar(8000) | YES |
| 4 | mng_sc_id | varchar(8000) | YES |
| 5 | marry_yn | varchar(8000) | YES |
| 6 | luso_type | varchar(8000) | YES |
| 7 | sex_cd | varchar(8000) | YES |
| 8 | cr_yn | varchar(8000) | YES |
| 9 | cr_change_dt | varchar(8000) | YES |
| 10 | marry_dt | varchar(8000) | YES |
| 11 | mng_change_dt | varchar(8000) | YES |
| 12 | cr_type | varchar(8000) | YES |
| 13 | hold_dt | varchar(8000) | YES |
| 14 | intro_cust_seq | float | YES |
| 15 | hobby_cd1 | varchar(8000) | YES |
| 16 | intro_type | varchar(8000) | YES |
| 17 | rememb_dt | varchar(8000) | YES |
| 18 | rememb_dt_desc | varchar(8000) | YES |
| 19 | hobby_cd2 | varchar(8000) | YES |
| 20 | remark | varchar(8000) | YES |
| 21 | concern_mdl1 | varchar(8000) | YES |
| 22 | hobby_etc | varchar(8000) | YES |
| 23 | concern_mdl2 | varchar(8000) | YES |
| 24 | hold_type | varchar(8000) | YES |
| 25 | mng_type | varchar(8000) | YES |
| 26 | ows_cb_yn | varchar(8000) | YES |
| 27 | ows_dt | varchar(8000) | YES |
| 28 | group_cd1 | varchar(8000) | YES |
| 29 | group_cd2 | varchar(8000) | YES |
| 30 | group_etc | varchar(8000) | YES |
| 31 | concern_mdl3 | varchar(8000) | YES |
| 32 | bef_mng_sc_id | varchar(8000) | YES |
| 33 | reg_dt | varchar(8000) | YES |
| 34 | reg_user_id | varchar(8000) | YES |
| 35 | upd_dt | varchar(8000) | YES |
| 36 | upd_user_id | varchar(8000) | YES |
| 37 | cr_sub_type | varchar(8000) | YES |
| 38 | reg_shop_cd | varchar(8000) | YES |
| 39 | cr_3rd_type | varchar(8000) | YES |
| 40 | cust_pic_path | varchar(8000) | YES |
| 41 | cust_pic_nm | varchar(8000) | YES |
| 42 | cust_act_type1 | varchar(8000) | YES |
| 43 | cust_act_type2 | varchar(8000) | YES |
| 44 | favor_drink1 | varchar(8000) | YES |
| 45 | favor_drink2 | varchar(8000) | YES |
| 46 | hobby_cd_partner | varchar(8000) | YES |
| 47 | home_town | varchar(8000) | YES |
| 48 | cust_holiday | varchar(8000) | YES |
| 49 | favor_tel_area | varchar(8000) | YES |
| 50 | favor_tel_no | varchar(8000) | YES |
| 51 | prev_hold_type | varchar(8000) | YES |
| 52 | age_cd | varchar(8000) | YES |
| 53 | child_cnt | varchar(8000) | YES |
| 54 | prev_brand | varchar(8000) | YES |
| 55 | prev_mdl | varchar(8000) | YES |
| 56 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_om_contract  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | float | YES | 계약번호 |
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
| 14 | cust_seq | float | YES | 고객 |
| 15 | comp_seq | float | YES | 순번 |
| 16 | real_cust_seq | float | YES | 고객 |
| 17 | owner_seq | float | YES | 순번 |
| 18 | customs_seq | float | YES | 고객 |
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
| 30 | vehic_magic | float | YES | 차량 |
| 31 | vehic_price | float | YES | 차량가격 |
| 32 | vehic_vat | float | YES | 차량 |
| 33 | vehic_option_price | float | YES | 차량가격 |
| 34 | vehic_color_price | float | YES | 색상 |
| 35 | vehic_discount_amt | float | YES | 차량 |
| 36 | vehic_total_amt | float | YES | 차량 |
| 37 | deposit_amt | float | YES | 계약금 |
| 38 | sales_type | varchar(8000) | YES | 판매 |
| 39 | pay_type | varchar(8000) | YES | 유형코드 |
| 40 | tax_type | float | YES | 유형코드 |
| 41 | lease_comp_seq | float | YES | 순번 |
| 42 | reg_free_yn | varchar(8000) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(8000) | YES | 재고 |
| 44 | reg_stock_rate | float | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(8000) | YES | 재고 |
| 46 | reg_agency_yn | varchar(8000) | YES | 등록 |
| 47 | reg_tax | float | YES | 등록 |
| 48 | reg_stock_price | float | YES | 가격 |
| 49 | reg_stamp_price | float | YES | 가격 |
| 50 | reg_plate_price | float | YES | 가격 |
| 51 | reg_fee | float | YES | 등록 |
| 52 | reg_aquisition_tax | float | YES | 등록 |
| 53 | reg_special_tax | float | YES | 등록 |
| 54 | reg_education_tax | float | YES | 등록 |
| 55 | reg_total_amt | float | YES | 총 금액 |
| 56 | take_contract_amt | float | YES | 금액 |
| 57 | take_delivery_amt | float | YES | 금액 |
| 58 | lease_month_amt | float | YES | 금액 |
| 59 | lease_term_dt | varchar(8000) | YES | 일자 |
| 60 | lease_rate | real | YES |  |
| 61 | take_depositer_nm | varchar(8000) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(8000) | YES | 계약금 |
| 63 | side_stamp_price | float | YES | 가격 |
| 64 | side_setup_amt | float | YES | 금액 |
| 65 | side_fee | float | YES |  |
| 66 | side_total_amt | float | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(8000) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(8000) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(8000) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(8000) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(8000) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(8000) | YES | 출고 |
| 73 | request_by | varchar(8000) | YES |  |
| 74 | request_dt | varchar(8000) | YES | 일자 |
| 75 | approval_by | varchar(8000) | YES |  |
| 76 | approval_dt | varchar(8000) | YES | 일자 |
| 77 | cancel_by | varchar(8000) | YES | 취소 |
| 78 | cancel_dt | varchar(8000) | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(8000) | YES | 판매 |
| 80 | last_issued_dt | varchar(8000) | YES | 일자 |
| 81 | last_mod_dt | varchar(8000) | YES | 수정일 |
| 82 | delivery_request_by | varchar(8000) | YES | 출고 |
| 83 | delivery_request_dt | varchar(8000) | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(8000) | YES | 출고 |
| 85 | delivery_cancel_dt | varchar(8000) | YES | 출고일 |
| 86 | delivery_plan_by | varchar(8000) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(8000) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(8000) | YES | 출고 |
| 89 | delivery_approval_dt | varchar(8000) | YES | 출고일 |
| 90 | reg_plan_dt | varchar(8000) | YES | 등록일 |
| 91 | contract_msg | varchar(8000) | YES | 계약 |
| 92 | vehic_reg_no | varchar(8000) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(8000) | YES | 차량 |
| 94 | dept_cd | varchar(8000) | YES | 코드 |
| 95 | boc_except_dt | varchar(8000) | YES | 일자 |
| 96 | reg_dt | varchar(8000) | YES | 등록일 |
| 97 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 98 | upd_dt | varchar(8000) | YES | 수정일 |
| 99 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(8000) | YES | 여부(Y/N) |
| 101 | allocation_dt | varchar(8000) | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(8000) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(8000) | YES | 고객 |
| 104 | rs_cust_addr | varchar(8000) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(8000) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(8000) | YES |  |
| 107 | rs_geo_loc_y | varchar(8000) | YES |  |
| 108 | potential_division | varchar(8000) | YES |  |
| 109 | org_followup_id | float | YES | 식별자(ID) |
| 110 | plate_size | varchar(8000) | YES |  |
| 111 | receiver_apply_yn | varchar(8000) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(8000) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(8000) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(8000) | YES | 번호 |
| 115 | receiver_ssn | varchar(8000) | YES |  |
| 116 | pma_yn | varchar(8000) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(8000) | YES | 고객번호 |
| 118 | family_seq | float | YES | 순번 |
| 119 | lemon_yn | varchar(8000) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(8000) | YES |  |
| 121 | app_flag | varchar(8000) | YES |  |
| 122 | consign_sales_flag | varchar(8000) | YES | 판매 |
| 123 | contract_msg_kr | varchar(8000) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(8000) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(8000) | YES | 고객 |
| 126 | realnm_seq | varchar(8000) | YES | 순번 |
| 127 | tax_biz_no | varchar(8000) | YES | 번호 |
| 128 | pma_city | varchar(8000) | YES | 시 |
| 129 | pma_gu | varchar(8000) | YES | 구 |
| 130 | taxpay_no_ymd | bigint | YES |  |
| 131 | taxpay_no_g | bigint | YES |  |
| 132 | flood_yn | varchar(8000) | YES | 여부(Y/N) |
| 133 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.t_pt_part  (행 0)

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
| 24 | net_weit | float | YES |  |
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
| 58 | reg_dt | varchar(8000) | YES | 등록일 |
| 59 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 60 | upd_dt | varchar(8000) | YES | 수정일 |
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
| 71 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.t_pt_sout_detl  (행 0)

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
| 15 | dc_rate | real | YES |
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
| 37 | svc_propo_seq | float | YES |
| 38 | svc_part_no | varchar(8000) | YES |
| 39 | svc_part_seq | float | YES |
| 40 | twc_stat | varchar(8000) | YES |
| 41 | payback_yn | varchar(8000) | YES |
| 42 | payback_qty | bigint | YES |
| 43 | biz_shop_cd | varchar(8000) | YES |
| 44 | biz_no | varchar(8000) | YES |
| 45 | biz_detl_line_no | int | YES |
| 46 | reg_dt | varchar(8000) | YES |
| 47 | reg_user_id | varchar(8000) | YES |
| 48 | upd_dt | varchar(8000) | YES |
| 49 | upd_user_id | varchar(8000) | YES |
| 50 | cancel_receipt_dt | varchar(8000) | YES |
| 51 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_sfa_testcar_trial  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reserved_dt | varchar(8000) | YES |
| 2 | from_time | varchar(8000) | YES |
| 3 | testcar_no | varchar(8000) | YES |
| 4 | trial_no | varchar(8000) | YES |
| 5 | dealer_id | varchar(8000) | YES |
| 6 | shop_cd | varchar(8000) | YES |
| 7 | to_time | varchar(8000) | YES |
| 8 | reserve_term | float | YES |
| 9 | prev_km | float | YES |
| 10 | test_type | varchar(8000) | YES |
| 11 | use_type | varchar(8000) | YES |
| 12 | vin | varchar(8000) | YES |
| 13 | model_cd | varchar(8000) | YES |
| 14 | variant_cd | varchar(8000) | YES |
| 15 | my_cd | varchar(8000) | YES |
| 16 | cust_seq | float | YES |
| 17 | cust_nm | varchar(8000) | YES |
| 18 | res_group_id | varchar(8000) | YES |
| 19 | res_user_id | varchar(8000) | YES |
| 20 | res_memo | varchar(8000) | YES |
| 21 | destination | varchar(8000) | YES |
| 22 | end_km | float | YES |
| 23 | interest_degree | varchar(8000) | YES |
| 24 | purchase_degree | varchar(8000) | YES |
| 25 | result_memo | varchar(8000) | YES |
| 26 | test_yn | varchar(8000) | YES |
| 27 | view_word | varchar(8000) | YES |
| 28 | reg_dt | varchar(8000) | YES |
| 29 | reg_user_id | varchar(8000) | YES |
| 30 | upd_dt | varchar(8000) | YES |
| 31 | upd_user_id | varchar(8000) | YES |
| 32 | test_type2 | varchar(8000) | YES |
| 33 | res_shop_cd | varchar(8000) | YES |
| 34 | res_dept_cd | varchar(8000) | YES |
| 35 | app_flag | varchar(8000) | YES |
| 36 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_sfa_testdrive_req  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | req_seq | float | YES |
| 2 | req_reg_dt | varchar(8000) | YES |
| 3 | req_system_id | varchar(8000) | YES |
| 4 | shop_cd | varchar(8000) | YES |
| 5 | brand | varchar(8000) | YES |
| 6 | model | varchar(8000) | YES |
| 7 | variant | varchar(8000) | YES |
| 8 | req_ymd | varchar(8000) | YES |
| 9 | req_fr_time | varchar(8000) | YES |
| 10 | req_to_time | varchar(8000) | YES |
| 11 | inbound_path | varchar(8000) | YES |
| 12 | req_path | varchar(8000) | YES |
| 13 | req_memo | varchar(8000) | YES |
| 14 | cust_nm | varchar(8000) | YES |
| 15 | cust_contact_no | varchar(8000) | YES |
| 16 | cust_email | varchar(8000) | YES |
| 17 | cust_area | varchar(8000) | YES |
| 18 | cust_age_group | varchar(8000) | YES |
| 19 | cust_gender | varchar(8000) | YES |
| 20 | status | varchar(8000) | YES |
| 21 | alloc_tp | varchar(8000) | YES |
| 22 | alloc_dt | varchar(8000) | YES |
| 23 | alloc_user_id | varchar(8000) | YES |
| 24 | mng_sc_id | varchar(8000) | YES |
| 25 | alloc_delay_alarm_status | varchar(8000) | YES |
| 26 | alloc_delay_alarm_dt | varchar(8000) | YES |
| 27 | cons_dt | varchar(8000) | YES |
| 28 | cons_user_id | varchar(8000) | YES |
| 29 | cons_delay_alarm_status | varchar(8000) | YES |
| 30 | cons_delay_alarm_dt | varchar(8000) | YES |
| 31 | fail_reason_cd | varchar(8000) | YES |
| 32 | fail_reason_memo | varchar(8000) | YES |
| 33 | ref_cons_seq | float | YES |
| 34 | ref_cust_seq | float | YES |
| 35 | ref_td_reserved_dt | varchar(8000) | YES |
| 36 | ref_td_from_time | varchar(8000) | YES |
| 37 | ref_td_testcar_no | varchar(8000) | YES |
| 38 | ref_contract_no | float | YES |
| 39 | own_cust_yn | varchar(8000) | YES |
| 40 | reg_user_id | varchar(8000) | YES |
| 41 | reg_dt | varchar(8000) | YES |
| 42 | upd_user_id | varchar(8000) | YES |
| 43 | upd_dt | varchar(8000) | YES |
| 44 | ref_td_trial_no | varchar(8000) | YES |
| 45 | td_center_yn | varchar(8000) | YES |
| 46 | close_dt | varchar(8000) | YES |
| 47 | close_user_id | varchar(8000) | YES |
| 48 | org_shop_cd | varchar(8000) | YES |
| 49 | app_alloc_push_status | varchar(8000) | YES |
| 50 | app_alloc_push_dt | varchar(8000) | YES |
| 51 | thmp_td_client_id | varchar(8000) | YES |
| 52 | thmp_td_url | varchar(8000) | YES |
| 53 | request_path | varchar(8000) | YES |
| 54 | event_type | varchar(8000) | YES |
| 55 | interest_brand | varchar(8000) | YES |
| 56 | interest_variant | varchar(8000) | YES |
| 57 | custinfo_exp_dt | varchar(8000) | YES |
| 58 | marketing_agree_yn | varchar(8000) | YES |
| 59 | untact_yn | varchar(8000) | YES |
| 60 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_svc_propo  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | SHOP_CD | varchar(8000) | YES |
| 2 | PROPO_DT | varchar(8000) | YES |
| 3 | PROPO_SEQ | bigint | YES |
| 4 | REPAIR_TYPE_CD | varchar(8000) | YES |
| 5 | PROPO_TYPE_CD | varchar(8000) | YES |
| 6 | VIN | varchar(8000) | YES |
| 7 | VIS | varchar(8000) | YES |
| 8 | VEHIC_NO1 | varchar(8000) | YES |
| 9 | VEHIC_NO2 | varchar(8000) | YES |
| 10 | VARIANT_NM | varchar(8000) | YES |
| 11 | SVC_MODEL_CD | varchar(8000) | YES |
| 12 | VEHIC_BASE_ODOMETER | int | YES |
| 13 | ODOMETER | int | YES |
| 14 | CUST_SEQ | decimal(38,18) | YES |
| 15 | CUST_NM | varchar(8000) | YES |
| 16 | CUST_IDFY_NO | varchar(8000) | YES |
| 17 | CUST_RCPT_REL_CD | varchar(8000) | YES |
| 18 | RCPT_CUST_NM | varchar(8000) | YES |
| 19 | RCPT_HP_AREA | varchar(8000) | YES |
| 20 | RCPT_HP_NO | varchar(8000) | YES |
| 21 | RCPT_TEL_AREA | varchar(8000) | YES |
| 22 | RCPT_TEL_NO | varchar(8000) | YES |
| 23 | VIP_YN | varchar(8000) | YES |
| 24 | SVC_TYPE_CD | varchar(8000) | YES |
| 25 | SVC_TYPE_FMS_CD | varchar(8000) | YES |
| 26 | RESV_DT | varchar(8000) | YES |
| 27 | RESV_SEQ | decimal(38,18) | YES |
| 28 | ESTI_DT | varchar(8000) | YES |
| 29 | ESTI_SEQ | decimal(38,18) | YES |
| 30 | WORK_CLOSE_YN | varchar(8000) | YES |
| 31 | STAT_CD | varchar(8000) | YES |
| 32 | STAT_CHNG_DT | datetime2 | YES |
| 33 | STAT_CHNG_USER_ID | varchar(8000) | YES |
| 34 | WORK_EXPT_ST_DT | datetime2 | YES |
| 35 | WORK_EXPT_END_DT | datetime2 | YES |
| 36 | CUST_DELIVERY_YN | varchar(8000) | YES |
| 37 | CUST_DELIVERY_EXPT_DT | datetime2 | YES |
| 38 | CUST_DELIVERY_REAL_DT | datetime2 | YES |
| 39 | OLD_PART_YN | varchar(8000) | YES |
| 40 | CUST_LOC_CD | varchar(8000) | YES |
| 41 | VEHIC_LOC_CD | varchar(8000) | YES |
| 42 | DAMAGE_TYPE_CD | varchar(8000) | YES |
| 43 | STALL_NO | decimal(38,18) | YES |
| 44 | SMS_YN | varchar(8000) | YES |
| 45 | WASH_STAT_CD | varchar(8000) | YES |
| 46 | CUST_RQST | varchar(8000) | YES |
| 47 | SA_SUGST | varchar(8000) | YES |
| 48 | TECHMAN_SUGST | varchar(8000) | YES |
| 49 | PART_SUGST | varchar(8000) | YES |
| 50 | RCPT_SA_ID | varchar(8000) | YES |
| 51 | RCPT_TIME | decimal(38,18) | YES |
| 52 | PROPO_ISSU_TIME | decimal(38,18) | YES |
| 53 | MNG_SA_ID | varchar(8000) | YES |
| 54 | MNG_FOREMAN_ID | varchar(8000) | YES |
| 55 | HAPPYCALL_TARGET_YN | varchar(8000) | YES |
| 56 | HAPPYCALL_REJECT_CD | varchar(8000) | YES |
| 57 | CANCEL_REASON_CD | varchar(8000) | YES |
| 58 | CANCEL_REASON | varchar(8000) | YES |
| 59 | PAYBACK_YN | varchar(8000) | YES |
| 60 | BASE_PROPO_DT | varchar(8000) | YES |
| 61 | BASE_PROPO_SEQ | decimal(38,18) | YES |
| 62 | PREV_SHOP_CD | varchar(8000) | YES |
| 63 | PREV_PROPO_DT | varchar(8000) | YES |
| 64 | PREV_PROPO_SEQ | decimal(38,18) | YES |
| 65 | PREV_ODOMETER | int | YES |
| 66 | PREV_ACC_SHOP_CD | varchar(8000) | YES |
| 67 | PREV_ACC_PROPO_DT | varchar(8000) | YES |
| 68 | PREV_ACC_PROPO_SEQ | decimal(38,18) | YES |
| 69 | UP_GROUP_ID | varchar(8000) | YES |
| 70 | REG_DT | datetime2 | YES |
| 71 | REG_USER_ID | varchar(8000) | YES |
| 72 | UPD_DT | datetime2 | YES |
| 73 | UPD_USER_ID | varchar(8000) | YES |
| 74 | ADD_PROC_SUGST | varchar(8000) | YES |
| 75 | ADD_PROC_REG_ID | varchar(8000) | YES |
| 76 | ADD_PROC_REG_DT | datetime2 | YES |
| 77 | CUST_DELIVERY_ZIP | varchar(8000) | YES |
| 78 | CUST_DELIVERY_ADDR | varchar(8000) | YES |
| 79 | CUST_DELIVERY_ADDR2 | varchar(8000) | YES |
| 80 | CUST_DELIVERY_LOC_X | varchar(8000) | YES |
| 81 | CUST_DELIVERY_LOC_Y | varchar(8000) | YES |
| 82 | PDC_YN | varchar(8000) | YES |
| 83 | HBEC_YN | varchar(8000) | YES |
| 84 | HBEC_SEQ | decimal(38,18) | YES |
| 85 | NEX_SVC | varchar(8000) | YES |
| 86 | SC_FORWARD_FEEDBACK | varchar(8000) | YES |
| 87 | REPEAT_REPAIR | varchar(8000) | YES |
| 88 | REFLAW_TYPE | varchar(8000) | YES |
| 89 | MOLIT_TARGET_YN | varchar(8000) | YES |
| 90 | EM_YN | varchar(8000) | YES |
| 91 | APP_RCPT_FLAG | varchar(8000) | YES |
| 92 | REPAET_ALARM | varchar(8000) | YES |
| 93 | FIN_UPLOAD_SEQ | decimal(38,18) | YES |
| 94 | ESTI_TYPE | varchar(8000) | YES |
| 95 | END_GB | varchar(8000) | YES |
| 96 | SVC_IN_SC_ID | varchar(8000) | YES |
| 97 | RECALL_BEFORE_SALE_YN | varchar(8000) | YES |
| 98 | BP_DELI_SITE | varchar(8000) | YES |
| 99 | BP_INSU_COMP | bigint | YES |
| 100 | FREE_SERVICE_SUGST | varchar(8000) | YES |
| 101 | CUST_REPAIR_REQ | varchar(8000) | YES |
| 102 | APP_SAVE_FLAG | varchar(8000) | YES |
| 103 | VALUABLE_YN | varchar(8000) | YES |
| 104 | DMS_FIRST_SAVE_FLAG | varchar(8000) | YES |
| 105 | PROPO_TALK_SEND_TIME | varchar(8000) | YES |
| 106 | PROPO_TALK_SEND_USER_ID | varchar(8000) | YES |
| 107 | PROPO_TALK_MSEQ | bigint | YES |
| 108 | CALC_TALK_SEND_TIME | varchar(8000) | YES |
| 109 | CALC_TALK_SEND_USER_ID | varchar(8000) | YES |
| 110 | CALC_TALK_MSEQ | bigint | YES |
| 111 | SIGN_YN | varchar(8000) | YES |
| 112 | AGORA_USE_DT | datetime2 | YES |
| 113 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_svc_propo_part  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SHOP_CD | varchar(8000) | YES | 전시장 코드 |
| 2 | PROPO_DT | varchar(8000) | YES | 일자 |
| 3 | PROPO_SEQ | bigint | YES | 순번 |
| 4 | PART_NO | varchar(8000) | YES | 부품번호 |
| 5 | SEQ | int | YES | 순번 |
| 6 | RO_TYPE_CD | varchar(8000) | YES | 유형코드 |
| 7 | SETTLE_TYPE_CD | varchar(8000) | YES | 유형코드 |
| 8 | PROPO_STAT_CD | varchar(8000) | YES | 상태코드 |
| 9 | STAT_CD | varchar(8000) | YES | 상태코드 |
| 10 | STAT_CHNG_DT | varchar(8000) | YES | 일자 |
| 11 | RQST_ISSU_QTY | int | YES | 수량 |
| 12 | REAL_ISSU_QTY | int | YES | 수량 |
| 13 | SALE_UNIT_PRICE | float | YES | 가격 |
| 14 | SALE_AMT | float | YES | 금액 |
| 15 | DC_AMT | float | YES | 금액 |
| 16 | CNFM_UNIT_PRICE | float | YES | 가격 |
| 17 | CNFM_AMT | float | YES | 금액 |
| 18 | GRP_NO | float | YES | 번호 |
| 19 | DISP_RANK | decimal(38,18) | YES |  |
| 20 | CR_NO | varchar(8000) | YES | 번호 |
| 21 | FMS_ITEM_CD | varchar(8000) | YES | 코드 |
| 22 | SVC_CAMPG_NO | float | YES | 번호 |
| 23 | TWC_NO | varchar(8000) | YES | 번호 |
| 24 | ORDER_NO | varchar(8000) | YES | 주문번호 |
| 25 | ORDER_LINE_NO | float | YES | 주문번호 |
| 26 | SOUT_NO | varchar(8000) | YES | 번호 |
| 27 | SOUT_LINE_NO | float | YES | 번호 |
| 28 | CANCEL_YN | varchar(8000) | YES | 취소 |
| 29 | INCOME_QTY | int | YES | 수량 |
| 30 | ORDER_QTY | int | YES | 수량 |
| 31 | INCOME_RESV_QTY | int | YES | 수량 |
| 32 | RESV_CLEAR_QTY | int | YES | 수량 |
| 33 | RESV_REAL_QTY | int | YES | 수량 |
| 34 | RQST_REMOVE_QTY | int | YES | 수량 |
| 35 | RESV_DT | varchar(8000) | YES | 일자 |
| 36 | RESV_SEQ | int | YES | 순번 |
| 37 | REMOVE_YN | varchar(8000) | YES | 여부(Y/N) |
| 38 | REJECT_CD | varchar(8000) | YES | 코드 |
| 39 | SVC_HIST_DISP_YN | varchar(8000) | YES | 여부(Y/N) |
| 40 | REG_DT | varchar(8000) | YES | 등록일 |
| 41 | REG_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 42 | UPD_DT | varchar(8000) | YES | 수정일 |
| 43 | UPD_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | RCIT_USER_ID | varchar(8000) | YES | 사용자 ID(SC) |
| 45 | CR_CASE_NO | smallint | YES | 번호 |
| 46 | PKG_YN | varchar(8000) | YES | 여부(Y/N) |
| 47 | PSP_UNIT_PRICE | float | YES | 가격 |
| 48 | PSP_AMT | float | YES | 금액 |
| 49 | ADD_YN | varchar(8000) | YES | 여부(Y/N) |
| 50 | PSP_CODE | varchar(8000) | YES | 코드 |
| 51 | PM_CODE | varchar(8000) | YES | 코드 |
| 52 | PM_SEQ | int | YES | 순번 |
| 53 | AUDA_YN | varchar(8000) | YES | 여부(Y/N) |
| 54 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.t_vs_model  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(8000) | YES |
| 2 | model_cd | varchar(8000) | YES |
| 3 | model_nm | varchar(8000) | YES |
| 4 | curr_sales_yn | varchar(8000) | YES |
| 5 | display_order | float | YES |
| 6 | reg_dt | varchar(8000) | YES |
| 7 | upd_dt | varchar(8000) | YES |
| 8 | reg_user_id | varchar(8000) | YES |
| 9 | upd_user_id | varchar(8000) | YES |
| 10 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_vs_sfx  (행 0)

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
| 12 | display_order | float | YES |
| 13 | launch_dt | varchar(8000) | YES |
| 14 | form_apply | varchar(8000) | YES |
| 15 | motive_type | varchar(8000) | YES |
| 16 | taking_fix | varchar(8000) | YES |
| 17 | displacement | varchar(8000) | YES |
| 18 | hp | varchar(8000) | YES |
| 19 | gross_weight | varchar(8000) | YES |
| 20 | cylinder_cnt | smallint | YES |
| 21 | max_load | varchar(8000) | YES |
| 22 | max_output | float | YES |
| 23 | length | float | YES |
| 24 | width | float | YES |
| 25 | height | float | YES |
| 26 | order_yn | varchar(8000) | YES |
| 27 | reg_dt | varchar(8000) | YES |
| 28 | reg_user_id | varchar(8000) | YES |
| 29 | upd_dt | varchar(8000) | YES |
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
| 43 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_vs_variant  (행 0)

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
| 13 | warranty_month | float | YES |
| 14 | display_order | float | YES |
| 15 | reg_dt | varchar(8000) | YES |
| 16 | reg_user_id | varchar(8000) | YES |
| 17 | upd_dt | varchar(8000) | YES |
| 18 | upd_user_id | varchar(8000) | YES |
| 19 | daily_report_variant_cd | varchar(8000) | YES |
| 20 | daily_report_yn | varchar(8000) | YES |
| 21 | prod_loc | varchar(8000) | YES |
| 22 | report_variant_nm | varchar(8000) | YES |
| 23 | report_display_order | float | YES |
| 24 | pre_variant_nm | varchar(8000) | YES |
| 25 | ecrb_variant_nm | varchar(8000) | YES |
| 26 | hybrid_yn | varchar(8000) | YES |
| 27 | spec_variant_nm | varchar(8000) | YES |
| 28 | variant_cd_jpn | varchar(8000) | YES |
| 29 | grade | varchar(8000) | YES |
| 30 | concern_mdl_yn | varchar(8000) | YES |
| 31 | fuel_type_cd | varchar(8000) | YES |
| 32 | ELT_TIME | varchar(8000) | YES |

#### dbo.t_vt_vehic_supply  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vehic_magic | float | YES | 차량 |
| 2 | vin | varchar(8000) | YES | 차대번호(VIN) |
| 3 | dealer_id | varchar(8000) | YES | 딜러 ID |
| 4 | brand_cd | varchar(8000) | YES | 브랜드 |
| 5 | model_cd | varchar(8000) | YES | 모델 코드 |
| 6 | variant_cd | varchar(8000) | YES | 바리에이션 |
| 7 | sfx_cd | varchar(8000) | YES | SFX(트림) |
| 8 | my_cd | varchar(8000) | YES | 코드 |
| 9 | col_combi_cd | varchar(8000) | YES | 컬러조합 |
| 10 | progress | varchar(8000) | YES |  |
| 11 | preprogress | varchar(8000) | YES |  |
| 12 | stock_status | varchar(8000) | YES | 재고 |
| 13 | import_license_yn | varchar(8000) | YES | 여부(Y/N) |
| 14 | assembly_pdt | varchar(8000) | YES |  |
| 15 | lo_pdt | varchar(8000) | YES |  |
| 16 | jpn_port_out_pdt | varchar(8000) | YES |  |
| 17 | port_in_pdt | varchar(8000) | YES |  |
| 18 | mp_in_pdt | varchar(8000) | YES |  |
| 19 | pdi_in_pdt | varchar(8000) | YES |  |
| 20 | pdi_out_pdt | varchar(8000) | YES |  |
| 21 | mp_out_pdt | varchar(8000) | YES |  |
| 22 | dlr_arrival_pdt | varchar(8000) | YES |  |
| 23 | dealer_use | varchar(8000) | YES | 딜러 |
| 24 | assembly_adt | varchar(8000) | YES |  |
| 25 | lo_adt | varchar(8000) | YES |  |
| 26 | prod_start_adt | varchar(8000) | YES | 시작일 |
| 27 | jpn_yard_in_adt | varchar(8000) | YES |  |
| 28 | jpn_yard_out_adt | varchar(8000) | YES |  |
| 29 | permit_dt | varchar(8000) | YES | 일자 |
| 30 | jpn_port_in_adt | varchar(8000) | YES |  |
| 31 | jpn_port_out_adt | varchar(8000) | YES |  |
| 32 | port_in_adt | varchar(8000) | YES |  |
| 33 | shipback_dt | varchar(8000) | YES | 일자 |
| 34 | port_out_adt | varchar(8000) | YES |  |
| 35 | port_in_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 36 | mp_loc | varchar(8000) | YES |  |
| 37 | mp_in_type | varchar(8000) | YES | 유형코드 |
| 38 | mp_normal_in_adt | varchar(8000) | YES |  |
| 39 | mp_in_adt | varchar(8000) | YES |  |
| 40 | org_mp_in_adt | varchar(8000) | YES |  |
| 41 | old_pdi_pdt | varchar(8000) | YES |  |
| 42 | pdi_in_adt | varchar(8000) | YES |  |
| 43 | pdi_in_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 44 | pdi_out_adt | varchar(8000) | YES |  |
| 45 | pdi_id_no | varchar(8000) | YES | 번호 |
| 46 | pdi_out_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 47 | handover_cl_status | varchar(8000) | YES | 상태코드 |
| 48 | handover_cl_reason | varchar(8000) | YES |  |
| 49 | handover_dt | varchar(8000) | YES | 일자 |
| 50 | mp_out_type | varchar(8000) | YES | 유형코드 |
| 51 | mp_out_adt | varchar(8000) | YES |  |
| 52 | mp_normal_out_adt | varchar(8000) | YES |  |
| 53 | request_dt | varchar(8000) | YES | 일자 |
| 54 | dlr_arrival_adt | varchar(8000) | YES |  |
| 55 | dlr_arrival_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 56 | non_handover_reason | varchar(8000) | YES |  |
| 57 | dlr_trouble_reason | varchar(8000) | YES |  |
| 58 | dlr_trouble_shooting | varchar(8000) | YES |  |
| 59 | dlr_option_request_dt | varchar(8000) | YES | 일자 |
| 60 | dlr_option_pdt | varchar(8000) | YES |  |
| 61 | dlr_option_adt | varchar(8000) | YES |  |
| 62 | dlr_option_end_dt | varchar(8000) | YES | 종료일 |
| 63 | option1 | varchar(8000) | YES |  |
| 64 | option2 | varchar(8000) | YES |  |
| 65 | option3 | varchar(8000) | YES |  |
| 66 | option4 | varchar(8000) | YES |  |
| 67 | engine_no | varchar(8000) | YES | 번호 |
| 68 | key_no | varchar(8000) | YES | 번호 |
| 69 | vin2 | varchar(8000) | YES |  |
| 70 | registration_adt | varchar(8000) | YES | 등록일 |
| 71 | reg_no | varchar(8000) | YES | 등록 |
| 72 | wa_expired_dt | varchar(8000) | YES | 일자 |
| 73 | wa_mileage | float | YES |  |
| 74 | st_prev_dealer_id | varchar(8000) | YES | 딜러 ID |
| 75 | stdwstotal_price | float | YES | 가격 |
| 76 | stdwscost_price | float | YES | 가격 |
| 77 | stdwsvat_price | float | YES | 가격 |
| 78 | last_move_seq | float | YES | 순번 |
| 79 | plant_cd | varchar(8000) | YES | 코드 |
| 80 | yard_loc | varchar(8000) | YES |  |
| 81 | vessel_cd | varchar(8000) | YES | 코드 |
| 82 | port_cd | varchar(8000) | YES | 코드 |
| 83 | pdi_loc | varchar(8000) | YES |  |
| 84 | current_loc | varchar(8000) | YES |  |
| 85 | option_mount_tp | varchar(8000) | YES |  |
| 86 | al_status | varchar(8000) | YES | 상태코드 |
| 87 | clearance_yn | varchar(8000) | YES | 여부(Y/N) |
| 88 | clearance_dt | varchar(8000) | YES | 일자 |
| 89 | wholesalestype | varchar(8000) | YES | 판매 |
| 90 | wholesales_adt | varchar(8000) | YES | 판매 |
| 91 | ws_cancel_dt | varchar(8000) | YES | 취소일 |
| 92 | wholesales_cl_status | varchar(8000) | YES | 판매 |
| 93 | wholesales_cl_reason | varchar(8000) | YES | 판매 |
| 94 | retailsalestype | varchar(8000) | YES | 판매 |
| 95 | retailsales_adt | varchar(8000) | YES | 판매 |
| 96 | realwstotal_price | float | YES | 가격 |
| 97 | realwscost_price | float | YES | 가격 |
| 98 | realwsvat_price | float | YES | 가격 |
| 99 | description | varchar(8000) | YES |  |
| 100 | remark | varchar(8000) | YES |  |
| 101 | serial_no | varchar(8000) | YES | 번호 |
| 102 | reg_dt | varchar(8000) | YES | 등록일 |
| 103 | reg_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 104 | upd_dt | varchar(8000) | YES | 수정일 |
| 105 | upd_user_id | varchar(8000) | YES | 사용자 ID(SC) |
| 106 | gate_out_adt | varchar(8000) | YES |  |
| 107 | final_inspection_adt | varchar(8000) | YES |  |
| 108 | ds_no | varchar(8000) | YES | 번호 |
| 109 | ed_no | varchar(8000) | YES | 번호 |
| 110 | prod_order_no | varchar(8000) | YES | 주문번호 |
| 111 | dlr_order_no | varchar(8000) | YES | 주문번호 |
| 112 | prod_ym | varchar(8000) | YES |  |
| 113 | current_loc2 | varchar(8000) | YES |  |
| 114 | customs_dt | varchar(8000) | YES | 고객 |
| 115 | customs_user_id | varchar(8000) | YES | 고객 |
| 116 | kor_yard_in_adt | varchar(8000) | YES |  |
| 117 | kor_yard_out_adt | varchar(8000) | YES |  |
| 118 | urn_no | varchar(8000) | YES | 번호 |
| 119 | carry_loc | varchar(8000) | YES |  |
| 120 | yard_loc_kor | varchar(8000) | YES |  |
| 121 | damage_yn | varchar(8000) | YES | 여부(Y/N) |
| 122 | damage_memo | varchar(8000) | YES |  |
| 123 | damage_loc | varchar(8000) | YES |  |
| 124 | damage_size | varchar(8000) | YES |  |
| 125 | damage_payback | varchar(8000) | YES |  |
| 126 | description_kr | varchar(8000) | YES |  |
| 127 | stevedore_cd | varchar(8000) | YES | 코드 |
| 128 | tcm_stk_yn | varchar(8000) | YES | 여부(Y/N) |
| 129 | ELT_TIME | varchar(8000) | YES | 시각 |

#### dbo.z_target_sample  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(8000) | YES |
| 2 | TDATE | varchar(8000) | YES |
| 3 | SHOP_CD | date | YES |
| 4 | BPUS | int | YES |
| 5 | BPS | float | YES |
| 6 | BPUS_Target | int | YES |
| 7 | BPS_Target | int | YES |

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

## DB: KPI_W

구분: 데이터 · 테이블 수: 254

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| bpk.BI_FI_BRAND | 5 | 0 |
| bpk.BI_FI_DEALER | 6 | 0 |
| bpk.BP_ANNUAL_TARGET | 9 | 0 |
| bpk.BP_SVC_BACKORDER | 54 | 0 |
| bpk.BP_SVC_CAPACITY | 15 | 0 |
| bpk.BP_SVC_ELEMENT_DEALER | 22 | 0 |
| bpk.BP_SVC_ELEMENT_DEALER_UNPV | 6 | 0 |
| bpk.BP_SVC_GENBAKPI | 12 | 0 |
| bpk.BP_SVC_PARTS | 13 | 0 |
| bpk.BP_SVC_PROPO | 42 | 0 |
| bpk.BP_SVC_PROPO_AOV | 19 | 0 |
| bpk.BP_SVC_PROPO_AOV_SUB | 10 | - |
| bpk.BP_SVC_PROPO_AOV_SUB2 | 19 | - |
| bpk.BP_SVC_PROPO_SUB | 42 | 0 |
| bpk.BP_SVC_PROPO_WORK | 40 | 0 |
| bpk.BP_SVC_PROPO_WORK_DAY | 11 | 0 |
| bpk.BP_SVC_PROPO_WORK_DAY_TEST | 11 | - |
| bpk.BP_SVC_PROPO_WORK_DAY_TEST_2 | 11 | - |
| bpk.BP_SVC_PROPO_WORK_TEST | 40 | - |
| bpk.BP_SVC_PROPO_WORK_TEST_2 | 40 | - |
| bpk.BP_SVC_REPEAT | 9 | 0 |
| bpk.BP_SVC_WORKOVER | 12 | 0 |
| bpk.BP_TECH_HIST | 13 | - |
| bpk.BP_TECH_INFO | 19 | 0 |
| bpk.BP_TECH_INFO_VISUAL | 19 | - |
| bpk.BP_WORKINGDAY | 6 | 0 |
| bpk.CO_BPSHOP | 6 | 0 |
| bpk.CO_DEALER | 7 | 0 |
| bpk.CO_GROUP_BI | 7 | 0 |
| bpk.DIM_CALENDAR | 10 | 0 |
| bpk.DIM_CALENDAR_MAIN | 29 | 0 |
| bpk.DIM_CALENDAR_SUB | 29 | 0 |
| bpk.DIM_CO_BI_LOGO | 5 | 0 |
| bpk.DIM_CO_BRAND | 4 | 0 |
| bpk.DIM_CO_DAMAGE | 4 | 0 |
| bpk.DIM_CO_DELISITE | 5 | 0 |
| bpk.DIM_CO_TECH | 3 | 0 |
| bpk.DIM_CO_WORKFLOW | 6 | 0 |
| bpk.DIM_CO_WORKFLOW_20260611 | 6 | - |
| bpk.DIM_CO_WORKFLOW_20260618 | 6 | - |
| bpk.Z_RLS_ACC_TEST | 3 | 0 |
| bpk.Z_RLS_ACC_TEST_sub | 3 | 0 |
| bpk.Z_RLS_TEST | 3 | 0 |
| bpk._Measure | 1 | 0 |
| dbo.CO_BI_LOGO | 6 | 0 |
| dbo.CO_CALENDAR | 14 | 0 |
| dbo.CO_CODE | 15 | 0 |
| dbo.CO_CODE_DEV | 15 | 0 |
| dbo.CO_COMPANY | 79 | 0 |
| dbo.CO_GROUP | 68 | 0 |
| dbo.CO_GROUP_BI | 10 | 0 |
| dbo.CO_HOLDINGS | 69 | 0 |
| dbo.CO_NPS_RESULT | 14 | 0 |
| dbo.CO_ORGANIZATION | 14 | 0 |
| dbo.CO_OTHER_BRAND | 13 | 0 |
| dbo.CO_USERS | 87 | 0 |
| dbo.CO_USERS_HIST | 17 | - |
| dbo.CO_USERS_KTWS | 67 | 0 |
| dbo.CO_VEHIC | 58 | 0 |
| dbo.CRM_ACT | 46 | 0 |
| dbo.CRM_LEAD | 39 | 0 |
| dbo.CRM_LEAD_HIST | 32 | 0 |
| dbo.CRM_LEAD_OWNER | 19 | 0 |
| dbo.CRM_TARGET | 15 | - |
| dbo.CRM_TARGET_D | 13 | 0 |
| dbo.CRM_TARGET_M | 12 | 0 |
| dbo.CU_BASE | 111 | 0 |
| dbo.CU_DETAIL | 57 | 0 |
| dbo.IF_AR | 84 | 0 |
| dbo.OM_CONTRACT | 134 | 0 |
| dbo.OM_CONTRACT_KTWS | 135 | 0 |
| dbo.PT_BARC_SORT | 15 | 0 |
| dbo.PT_ORDER | 53 | 0 |
| dbo.PT_ORDER_BO | 20 | 0 |
| dbo.PT_ORDER_BO_DETL | 35 | 0 |
| dbo.PT_ORDER_DETL | 47 | 0 |
| dbo.PT_PART | 72 | 0 |
| dbo.PT_POSS | 17 | 0 |
| dbo.PT_POSS_DETL | 18 | 0 |
| dbo.PT_PURC | 43 | 0 |
| dbo.PT_PURC_DETL | 31 | 0 |
| dbo.PT_RESV | 53 | 0 |
| dbo.PT_SI | 45 | 0 |
| dbo.PT_SIN | 34 | 0 |
| dbo.PT_SIN_DETL | 31 | 0 |
| dbo.PT_SI_DETL | 45 | 0 |
| dbo.PT_SOUT_DETL_IMS | 57 | 0 |
| dbo.PT_SOUT_IMS | 67 | 0 |
| dbo.PT_STOCK | 70 | 0 |
| dbo.SFA_CONSULT_LOG | 35 | 0 |
| dbo.SFA_SHOWROOM_DESC | 31 | 0 |
| dbo.SFA_TESTCAR_TRIAL | 36 | 0 |
| dbo.SFA_TESTCAR_TRIAL_KTWS | 39 | 0 |
| dbo.SFA_TESTDRIVE_REQ | 46 | 0 |
| dbo.SPM_HBOARD_MEETING | 14 | 0 |
| dbo.SPM_HBOARD_MEETING_CHIP | 22 | 0 |
| dbo.SVC_BP_PROC_TECH | 15 | 0 |
| dbo.SVC_BP_PROC_TECH_PLAN | 13 | 0 |
| dbo.SVC_BP_PROC_TIME | 23 | 0 |
| dbo.SVC_BP_PROC_TIME_GROUP | 10 | 0 |
| dbo.SVC_BP_PROC_TIME_PLAN | 17 | 0 |
| dbo.SVC_BP_PROC_TIME_REST | 16 | 0 |
| dbo.SVC_BP_REPEAT_KPI | 12 | 0 |
| dbo.SVC_BP_SALES_TARGET | 11 | 0 |
| dbo.SVC_BP_WORKDATE | 11 | 0 |
| dbo.SVC_CHARGE_RATE | 11 | 0 |
| dbo.SVC_CUST_GUIDE_MEMO | 12 | 0 |
| dbo.SVC_DAILY_SALES_REPORT | 14 | 0 |
| dbo.SVC_DAILY_UNIT_REPORT | 15 | 0 |
| dbo.SVC_DLR_CODE_DTL | 15 | 0 |
| dbo.SVC_INSU | 32 | 0 |
| dbo.SVC_INSU_DTL | 59 | 0 |
| dbo.SVC_PROPO | 118 | 0 |
| dbo.SVC_PROPO_BPKPI | 55 | 0 |
| dbo.SVC_PROPO_LABOR | 41 | 0 |
| dbo.SVC_PROPO_PART | 55 | 0 |
| dbo.SVC_RESV | 74 | 0 |
| dbo.SVC_SERVICE_KPI_ELEMENT_DEALER | 53 | 0 |
| dbo.SVC_SETTLE | 42 | 0 |
| dbo.SVC_TECH_WORKTIME | 16 | 0 |
| dbo.VS_MODEL | 11 | 0 |
| dbo.VS_SFX | 41 | 0 |
| dbo.VS_VARIANT | 33 | 0 |
| dbo.VT_DAILY_SALES_TREND | 74 | 0 |
| dbo.VT_MONTHLY_NENKEI | 3 | 0 |
| dbo.VT_MONTHLY_TARGET_EXCEL | 6 | 0 |
| dbo.VT_VEHIC_SUPPLY | 17 | 0 |
| dbo._Measure | 1 | 0 |
| ktws.DIM_ACTIVITY_TYPE | 6 | 0 |
| ktws.DIM_BRAND | 2 | 0 |
| ktws.DIM_CALENDAR | 16 | 0 |
| ktws.DIM_CALENDAR_KTWS | 18 | - |
| ktws.DIM_CO_BI_LOGO | 5 | - |
| ktws.DIM_CRM_ACT_TYPE | 14 | - |
| ktws.DIM_CRM_ACT_TYPE_ORDER | 6 | - |
| ktws.DIM_DEALER | 7 | 0 |
| ktws.DIM_MNG_ACCESS_USER | 10 | 0 |
| ktws.DIM_MNG_DEALER | 6 | 0 |
| ktws.DIM_MNG_USER | 21 | 0 |
| ktws.DIM_MODEL | 9 | 0 |
| ktws.DIM_MODEL_T | 5 | 0 |
| ktws.DIM_PMA_ORDER | 3 | - |
| ktws.DIM_REPURC_SALES_TYPE | 7 | 0 |
| ktws.DIM_VEHIC_SPEC | 17 | - |
| ktws.DIM_VEHIC_SPEC_MDL | 5 | - |
| ktws.DIM_VEHIC_SPEC_VAR | 8 | - |
| ktws.EXTRACTION_TIME | 2 | 0 |
| ktws.FCT_ACTIVITY | 23 | 0 |
| ktws.FCT_ACTIVITY_TARGET | 9 | 0 |
| ktws.FCT_ACTIVITY_v2 | 32 | - |
| ktws.FCT_AVAIL_STOCK | 10 | 0 |
| ktws.FCT_CONTRACT_KTWS | 25 | - |
| ktws.FCT_CRM_TARGET_D | 8 | - |
| ktws.FCT_CRM_TARGET_M | 9 | - |
| ktws.FCT_CRM_TARGET_STS | 8 | - |
| ktws.FCT_FORCAST | 11 | 0 |
| ktws.FCT_FUNNEL_AGGR | 11 | 0 |
| ktws.FCT_FUNNEL_SALES | 15 | 0 |
| ktws.FCT_HBOARD_MEETING | 36 | - |
| ktws.FCT_LEAD | 29 | - |
| ktws.FCT_LEAD_HIST | 9 | 0 |
| ktws.FCT_MNG_CUST_LIST | 5 | 0 |
| ktws.FCT_MONTHLY_TOTAL_CNTRCT | 9 | 0 |
| ktws.FCT_NPS | 9 | - |
| ktws.FCT_SALES_TARGET_DAILY | 11 | 0 |
| ktws.FCT_SC_GROUP_RULE | 12 | - |
| ktws.FCT_TESTDRIVE | 52 | 0 |
| log.PipelineFailureLog | 13 | 0 |
| log.dboTableMaxDateLog | 7 | 0 |
| meta.META_TABLE | 15 | 0 |
| meta.META_TABLE_COL | 9 | 0 |
| queryinsights.exec_requests_history | 28 | - |
| queryinsights.exec_sessions_history | 34 | - |
| queryinsights.frequently_run_queries | 13 | - |
| queryinsights.long_running_queries | 9 | - |
| queryinsights.sql_pool_insights | 6 | - |
| stg.co_calendar | 14 | 0 |
| stg.co_code | 15 | 0 |
| stg.co_code_dev | 15 | 0 |
| stg.co_group | 68 | 0 |
| stg.co_group_bi | 10 | 0 |
| stg.co_holdings | 69 | 0 |
| stg.co_nps_result | 14 | 0 |
| stg.co_other_brand | 13 | 0 |
| stg.co_users | 87 | 0 |
| stg.co_users_hist | 17 | - |
| stg.co_users_ktws | 67 | 0 |
| stg.co_vehic | 58 | 0 |
| stg.crm_act | 46 | 0 |
| stg.crm_lead | 39 | 0 |
| stg.crm_lead_hist | 32 | 0 |
| stg.crm_lead_owner | 19 | 0 |
| stg.crm_target | 15 | - |
| stg.crm_target_d | 13 | 0 |
| stg.crm_target_m | 12 | 0 |
| stg.cu_detail | 57 | 0 |
| stg.if_ar | 84 | 0 |
| stg.om_contract_ktws | 135 | 0 |
| stg.pt_barc_sort | 15 | 0 |
| stg.pt_order | 53 | 0 |
| stg.pt_order_bo | 20 | 0 |
| stg.pt_order_bo_detl | 35 | 0 |
| stg.pt_order_detl | 47 | 0 |
| stg.pt_part | 72 | 0 |
| stg.pt_poss | 17 | 0 |
| stg.pt_poss_detl | 18 | 0 |
| stg.pt_purc | 43 | 0 |
| stg.pt_purc_detl | 31 | 0 |
| stg.pt_resv | 53 | 0 |
| stg.pt_si | 45 | 0 |
| stg.pt_si_detl | 45 | 0 |
| stg.pt_sin | 34 | 0 |
| stg.pt_sin_detl | 31 | 0 |
| stg.pt_sout_detl_ims | 57 | 0 |
| stg.pt_sout_ims | 67 | 0 |
| stg.pt_stock | 70 | 0 |
| stg.sfa_consult_log | 35 | 0 |
| stg.sfa_showroom_desc | 31 | 0 |
| stg.sfa_testcar_trial_ktws | 39 | 0 |
| stg.spm_hboard_meeting | 14 | 0 |
| stg.spm_hboard_meeting_chip | 22 | 0 |
| stg.svc_bp_proc_tech | 15 | 0 |
| stg.svc_bp_proc_tech_plan | 13 | 0 |
| stg.svc_bp_proc_time | 23 | 0 |
| stg.svc_bp_proc_time_group | 10 | 0 |
| stg.svc_bp_proc_time_plan | 17 | 0 |
| stg.svc_bp_proc_time_rest | 16 | 0 |
| stg.svc_bp_repeat_kpi | 12 | 0 |
| stg.svc_bp_sales_target | 11 | 0 |
| stg.svc_bp_workdate | 11 | 0 |
| stg.svc_charge_rate | 11 | 0 |
| stg.svc_cust_guide_memo | 12 | 0 |
| stg.svc_daily_sales_report | 14 | 0 |
| stg.svc_daily_unit_report | 15 | 0 |
| stg.svc_dlr_code_dtl | 15 | 0 |
| stg.svc_insu | 32 | 0 |
| stg.svc_insu_dtl | 59 | 0 |
| stg.svc_propo | 118 | 0 |
| stg.svc_propo_bpkpi | 55 | 0 |
| stg.svc_propo_labor | 41 | 0 |
| stg.svc_propo_part | 55 | 0 |
| stg.svc_resv | 74 | 0 |
| stg.svc_service_kpi_element_dealer | 53 | 0 |
| stg.svc_settle | 42 | 0 |
| stg.svc_tech_worktime | 16 | 0 |
| stg.vt_daily_sales_trend | 74 | 0 |
| stg.vt_monthly_target | 11 | 0 |
| sys.dm_db_external_tables_log_status | 5 | - |
| sys.external_delta_tables | 10 | - |
| sys.managed_delta_table_checkpoints | 9 | - |
| sys.managed_delta_table_forks | 8 | - |
| sys.managed_delta_table_log_files | 11 | - |
| sys.managed_delta_tables | 8 | - |
| sys.sys_dw_schemas | 4 | - |

### 컬럼 상세

#### bpk.BI_FI_BRAND  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | GROUP_ID | varchar(max) | YES |
| 3 | GROUP_NAME | varchar(max) | YES |
| 4 | BI_GROUP_ID | varchar(max) | YES |
| 5 | BI_GROUP_NAME | varchar(max) | YES |

#### bpk.BI_FI_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | DEALER | varchar(100) | YES | 딜러 |
| 2 | USER_NAME | varchar(100) | YES | 명칭 |
| 3 | USER_ACCOUNT | varchar(300) | YES |  |
| 4 | BRAND | varchar(300) | YES | 브랜드 |
| 5 | SHOP_CD | varchar(300) | YES | 전시장 코드 |
| 6 | ELT_TIMESTAMP | varchar(30) | YES | ETL 적재시각 |

#### bpk.BP_ANNUAL_TARGET  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | SHOP_CD | varchar(max) | YES |
| 3 | TDATE | datetime2 | YES |
| 4 | YEAR | varchar(max) | YES |
| 5 | MONTH | varchar(max) | YES |
| 6 | BPUS | float | YES |
| 7 | BPS | float | YES |
| 8 | UPD_DT | datetime2 | YES |
| 9 | ETL_DATE | datetime2 | YES |

#### bpk.BP_SVC_BACKORDER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(max) | YES | 브랜드 |
| 2 | TDATE | date | YES | 일자 |
| 3 | SHOP_CD | varchar(max) | YES | 전시장 코드 |
| 4 | PROPO_DT | varchar(max) | YES | 일자 |
| 5 | PROPO_SEQ | varchar(max) | YES | 순번 |
| 6 | PROPO_NO | varchar(max) | YES | 번호 |
| 7 | DELIVERY_DT | datetime2 | YES | 출고일 |
| 8 | DELIVERY_REAL_DT | date | YES | 출고일 |
| 9 | DAMAGE | varchar(max) | YES |  |
| 10 | ORDER_DT | date | YES | 주문 |
| 11 | ORDER_NO | varchar(max) | YES | 주문번호 |
| 12 | ORDER_STAT | varchar(max) | YES | 주문 |
| 13 | ORDER_USE | varchar(max) | YES | 주문 |
| 14 | ORDER_CODE | varchar(max) | YES | 주문 |
| 15 | PART_NO | varchar(max) | YES | 부품번호 |
| 16 | PART_NM | varchar(max) | YES | 부품 |
| 17 | FRANCHISE_CD | varchar(max) | YES | 코드 |
| 18 | CUST_NM | varchar(max) | YES | 고객 |
| 19 | VEHIC_NO | varchar(max) | YES | 차량 |
| 20 | MODEL_CD | varchar(max) | YES | 모델 코드 |
| 21 | VIN | varchar(max) | YES | 차대번호(VIN) |
| 22 | VARIANT_NM | varchar(max) | YES | 바리에이션 |
| 23 | AVAIL_STOCK | float | YES | 재고 |
| 24 | ORDER_QTY | float | YES | 수량 |
| 25 | ORDER_AMT | float | YES | 금액 |
| 26 | BO_QTY | float | YES | 수량 |
| 27 | SIN_WAIT_QTY | float | YES | 수량 |
| 28 | ORDER_UNIT | varchar(max) | YES | 주문 |
| 29 | ORDER_PRICE | float | YES | 가격 |
| 30 | CONV_QTY | float | YES | 수량 |
| 31 | TRAN_TYPE | varchar(max) | YES | 유형코드 |
| 32 | TRAN_NAME | varchar(max) | YES | 명칭 |
| 33 | AIR_ONLY_NY | varchar(max) | YES |  |
| 34 | BASE_PRICE | float | YES | 가격 |
| 35 | MODI_PRICE | float | YES | 가격 |
| 36 | RETAIL_PRICE | float | YES | 가격 |
| 37 | PURC_STAT | varchar(max) | YES |  |
| 38 | PURC_QTY | float | YES | 수량 |
| 39 | SHIP_QTY | float | YES | 수량 |
| 40 | SIN_TOT_QTY_PURC | float | YES | 수량 |
| 41 | POSS_END_CNT | float | YES |  |
| 42 | POSS_CLO_CNT | float | YES |  |
| 43 | BO_STAT | varchar(max) | YES |  |
| 44 | BO_STAT_NM | varchar(max) | YES | 명칭 |
| 45 | DLR_SIN_YN | varchar(max) | YES | 여부(Y/N) |
| 46 | FIX_DTD | datetime2 | YES |  |
| 47 | ETD_DT | datetime2 | YES | 일자 |
| 48 | ETA | datetime2 | YES |  |
| 49 | ETA_DT | datetime2 | YES | 일자 |
| 50 | UNLOAD_DT | datetime2 | YES | 일자 |
| 51 | SIN_DT | datetime2 | YES | 일자 |
| 52 | ILT | float | YES |  |
| 53 | UPD_DT | datetime2 | YES | 수정일 |
| 54 | ETL_TIME | datetime2 | YES | 시각 |

#### bpk.BP_SVC_CAPACITY  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | DATE6 | varchar(max) | YES |
| 5 | BPUS | float | YES |
| 6 | BP_TECH_BODY | float | YES |
| 7 | BP_TECH_PAINT | float | YES |
| 8 | BP_SA | float | YES |
| 9 | BP_STALL | float | YES |
| 10 | WORKING_DAY | float | YES |
| 11 | CAL_WORKING_DAY | float | YES |
| 12 | CAPA_TECH | float | YES |
| 13 | CAPA_SA | float | YES |
| 14 | CAPA_STALL | float | YES |
| 15 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_ELEMENT_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(10) | YES | 브랜드 |
| 2 | TDATE | date | YES | 일자 |
| 3 | SHOP_CD | varchar(max) | YES | 전시장 코드 |
| 4 | YYYY_MM | varchar(max) | YES |  |
| 5 | BP_BODY | float | YES |  |
| 6 | BP_PAINT | float | YES |  |
| 7 | BP_SA | float | YES |  |
| 8 | BP_STALL | float | YES |  |
| 9 | BP_BODY_CERTI | float | YES |  |
| 10 | BP_BODY_PRO | float | YES |  |
| 11 | BP_BODY_MASTER | float | YES |  |
| 12 | BP_BODY_NONCERTI | float | YES |  |
| 13 | BP_PAINT_CERTI | float | YES |  |
| 14 | BP_PAINT_PRO | float | YES |  |
| 15 | BP_PAINT_MASTER | float | YES |  |
| 16 | BP_PAINT_NONCERTI | float | YES |  |
| 17 | BP_SA_TOTAL | float | YES |  |
| 18 | BP_SA_CERTI | float | YES |  |
| 19 | BP_SA_PRO | float | YES |  |
| 20 | BP_SA_MASTER | float | YES |  |
| 21 | BP_SA_NONCERTI | float | YES |  |
| 22 | ETL_TIME | datetime2 | YES | 시각 |

#### bpk.BP_SVC_ELEMENT_DEALER_UNPV  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(10) | YES | 브랜드 |
| 2 | TDATE | date | YES | 일자 |
| 3 | SHOP_CD | varchar(max) | YES | 전시장 코드 |
| 4 | CATEGORY1 | varchar(max) | YES |  |
| 5 | CATEGORY2 | varchar(max) | YES |  |
| 6 | COUNT | float | YES |  |

#### bpk.BP_SVC_GENBAKPI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | DATE7 | varchar(max) | YES |
| 5 | REPAIR_HOUR | float | YES |
| 6 | LABOR_HOUR | float | YES |
| 7 | AVAIL_HOUR | float | YES |
| 8 | LABOR_KPI | float | YES |
| 9 | TECH_KPI | float | YES |
| 10 | OVERALL_KPI | float | YES |
| 11 | OTD | float | YES |
| 12 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PARTS  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(10) | YES | 브랜드 |
| 2 | TDATE | date | YES | 일자 |
| 3 | SHOP_CD | varchar(max) | YES | 전시장 코드 |
| 4 | PROPO_DT | varchar(max) | YES | 일자 |
| 5 | PROPO_SEQ | varchar(max) | YES | 순번 |
| 6 | PROPO_NO | varchar(max) | YES | 번호 |
| 7 | DELIVERY_REAL_DT | datetime2 | YES | 출고일 |
| 8 | PARTS | varchar(max) | YES | 부품 |
| 9 | CATEGORY1 | varchar(max) | YES |  |
| 10 | CATEGORY2 | varchar(max) | YES |  |
| 11 | REPAIR_YN | float | YES | 정비/수리 |
| 12 | UPD_DT | datetime2 | YES | 수정일 |
| 13 | ETL_TIME | datetime2 | YES | 시각 |

#### bpk.BP_SVC_PROPO  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | DAMAGE | varchar(max) | YES |
| 8 | LABOR_MH | float | YES |
| 9 | VIN | varchar(max) | YES |
| 10 | VEHIC_NO | varchar(max) | YES |
| 11 | MODEL_NM | varchar(max) | YES |
| 12 | PART_AMT | float | YES |
| 13 | LABOR_AMT | float | YES |
| 14 | VAT_AMT | float | YES |
| 15 | TOT_AMT | float | YES |
| 16 | SHOP_IN_DT | datetime2 | YES |
| 17 | RO_ISSUE | varchar(max) | YES |
| 18 | REPAIR_ST_DT | datetime2 | YES |
| 19 | REPAIR_EXP_DT | datetime2 | YES |
| 20 | REPAIR_END_DT | datetime2 | YES |
| 21 | REPAIR_OVER_HOUR | float | YES |
| 22 | DELIVERY_EXPT_DT | datetime2 | YES |
| 23 | DELIVERY_REAL_DT | datetime2 | YES |
| 24 | LT_TYPE | varchar(max) | YES |
| 25 | OTD | varchar(max) | YES |
| 26 | WLT | float | YES |
| 27 | RLT | float | YES |
| 28 | DLT | float | YES |
| 29 | WLT_H | float | YES |
| 30 | RLT_H | float | YES |
| 31 | DLT_H | float | YES |
| 32 | REPEAT_REPAIR | varchar(max) | YES |
| 33 | BP_DELI_SITE | varchar(max) | YES |
| 34 | BP_DELI_SITE_NM | varchar(max) | YES |
| 35 | SA_ID | varchar(max) | YES |
| 36 | SA_NM | varchar(max) | YES |
| 37 | DELIVERY_MEMO | varchar(max) | YES |
| 38 | FOREMAN_ID | varchar(max) | YES |
| 39 | FOREMAN_NM | varchar(max) | YES |
| 40 | UPD_DT | datetime2 | YES |
| 41 | ETL_TIME | datetime2 | YES |
| 42 | RLT_NEW | float | YES |

#### bpk.BP_SVC_PROPO_AOV  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | DAMAGE | varchar(max) | YES |
| 8 | TYPE3_CD | varchar(max) | YES |
| 9 | DELIVERY_REAL_DT | datetime2 | YES |
| 10 | PART_AMT | float | YES |
| 11 | PART_COST | float | YES |
| 12 | LABOR_AMT | float | YES |
| 13 | SUBLET_AMT | float | YES |
| 14 | DC_AMT | float | YES |
| 15 | SETTLE_AMT | float | YES |
| 16 | EXTRA_AMT | float | YES |
| 17 | SALES_AMT | float | YES |
| 18 | UPD_DT | datetime2 | YES |
| 19 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_AOV_SUB

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | SHOP_CD | varchar(max) | YES |
| 3 | PROPO_DT | varchar(max) | YES |
| 4 | PROPO_SEQ | varchar(max) | YES |
| 5 | VIN | varchar(max) | YES |
| 6 | DAMAGE | varchar(max) | YES |
| 7 | PART_AMT | float | YES |
| 8 | LABOR_AMT | float | YES |
| 9 | SALES_AMT | float | YES |
| 10 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_AOV_SUB2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | DAMAGE | varchar(max) | YES |
| 8 | TYPE3_CD | varchar(max) | YES |
| 9 | DELIVERY_REAL_DT | datetime2 | YES |
| 10 | PART_AMT | float | YES |
| 11 | PART_COST | float | YES |
| 12 | LABOR_AMT | float | YES |
| 13 | SUBLET_AMT | float | YES |
| 14 | DC_AMT | float | YES |
| 15 | SETTLE_AMT | float | YES |
| 16 | EXTRA_AMT | float | YES |
| 17 | SALES_AMT | float | YES |
| 18 | UPD_DT | datetime2 | YES |
| 19 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_SUB  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | DAMAGE | varchar(max) | YES |
| 8 | LABOR_MH | float | YES |
| 9 | VIN | varchar(max) | YES |
| 10 | VEHIC_NO | varchar(max) | YES |
| 11 | MODEL_NM | varchar(max) | YES |
| 12 | PART_AMT | float | YES |
| 13 | LABOR_AMT | float | YES |
| 14 | VAT_AMT | float | YES |
| 15 | TOT_AMT | float | YES |
| 16 | SHOP_IN_DT | datetime2 | YES |
| 17 | RO_ISSUE | varchar(max) | YES |
| 18 | REPAIR_ST_DT | datetime2 | YES |
| 19 | REPAIR_EXP_DT | datetime2 | YES |
| 20 | REPAIR_END_DT | datetime2 | YES |
| 21 | REPAIR_OVER_HOUR | float | YES |
| 22 | DELIVERY_EXPT_DT | datetime2 | YES |
| 23 | DELIVERY_REAL_DT | datetime2 | YES |
| 24 | LT_TYPE | varchar(max) | YES |
| 25 | OTD | varchar(max) | YES |
| 26 | WLT | float | YES |
| 27 | RLT | float | YES |
| 28 | DLT | float | YES |
| 29 | WLT_H | float | YES |
| 30 | RLT_H | float | YES |
| 31 | DLT_H | float | YES |
| 32 | REPEAT_REPAIR | varchar(max) | YES |
| 33 | BP_DELI_SITE | varchar(max) | YES |
| 34 | BP_DELI_SITE_NM | varchar(max) | YES |
| 35 | SA_ID | varchar(max) | YES |
| 36 | SA_NM | varchar(max) | YES |
| 37 | DELIVERY_MEMO | varchar(max) | YES |
| 38 | FOREMAN_ID | varchar(max) | YES |
| 39 | FOREMAN_NM | varchar(max) | YES |
| 40 | UPD_DT | datetime2 | YES |
| 41 | ETL_TIME | datetime2 | YES |
| 42 | RLT_NEW | float | YES |

#### bpk.BP_SVC_PROPO_WORK  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | STAT_CD | varchar(max) | YES |
| 8 | STAT_NM | varchar(max) | YES |
| 9 | DAMAGE | varchar(max) | YES |
| 10 | PROC_TYPE_CD | varchar(max) | YES |
| 11 | WORK_SEQ | varchar(max) | YES |
| 12 | TECHMAN_ID | varchar(max) | YES |
| 13 | TECHMAN_NM | varchar(max) | YES |
| 14 | TEHCMAN_TECH | varchar(max) | YES |
| 15 | PROC_DTL_CD | varchar(max) | YES |
| 16 | PROC_DTL_NM | varchar(max) | YES |
| 17 | PROC_DTL_EN | varchar(max) | YES |
| 18 | PROC_DTL_NO | varchar(max) | YES |
| 19 | PROC_PREV_DTL_EN | varchar(max) | YES |
| 20 | PROC_PREV_DTL_NO | varchar(max) | YES |
| 21 | PROC_DTL_TURE | varchar(max) | YES |
| 22 | EXPT_ST_DT | datetime2 | YES |
| 23 | EXPT_END_DT | datetime2 | YES |
| 24 | REAL_ST_DT | datetime2 | YES |
| 25 | REAL_END_DT | datetime2 | YES |
| 26 | PREV_REAL_END_DT | datetime2 | YES |
| 27 | PROC_PREV_REAL_END_DT | datetime2 | YES |
| 28 | TOT_REST_MINUTES | float | YES |
| 29 | SUM_REST_MINUTES | float | YES |
| 30 | PLN_RLT | float | YES |
| 31 | PLN_RLT_H | float | YES |
| 32 | RLT | float | YES |
| 33 | MH | float | YES |
| 34 | ACT_RLT | float | YES |
| 35 | ACT_RLT_H | float | YES |
| 36 | WO_RLT | float | YES |
| 37 | DELIVERY_DT | datetime2 | YES |
| 38 | DELIVERY_REAL_DT | datetime2 | YES |
| 39 | UPD_DT | datetime2 | YES |
| 40 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_WORK_DAY  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | WORK_SEQ | varchar(max) | YES |
| 8 | DAMAGE | varchar(max) | YES |
| 9 | REAL_ST_DT | datetime2 | YES |
| 10 | REAL_END_DT | datetime2 | YES |
| 11 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_WORK_DAY_TEST

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | WORK_SEQ | varchar(max) | YES |
| 8 | DAMAGE | varchar(max) | YES |
| 9 | REAL_ST_DT | datetime2 | YES |
| 10 | REAL_END_DT | datetime2 | YES |
| 11 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_WORK_DAY_TEST_2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | WORK_SEQ | varchar(max) | YES |
| 8 | DAMAGE | varchar(max) | YES |
| 9 | REAL_ST_DT | datetime2 | YES |
| 10 | REAL_END_DT | datetime2 | YES |
| 11 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_WORK_TEST

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | STAT_CD | varchar(max) | YES |
| 8 | STAT_NM | varchar(max) | YES |
| 9 | DAMAGE | varchar(max) | YES |
| 10 | PROC_TYPE_CD | varchar(max) | YES |
| 11 | WORK_SEQ | varchar(max) | YES |
| 12 | TECHMAN_ID | varchar(max) | YES |
| 13 | TECHMAN_NM | varchar(max) | YES |
| 14 | TEHCMAN_TECH | varchar(max) | YES |
| 15 | PROC_DTL_CD | varchar(max) | YES |
| 16 | PROC_DTL_NM | varchar(max) | YES |
| 17 | PROC_DTL_EN | varchar(max) | YES |
| 18 | PROC_DTL_NO | varchar(max) | YES |
| 19 | PROC_PREV_DTL_EN | varchar(max) | YES |
| 20 | PROC_PREV_DTL_NO | varchar(max) | YES |
| 21 | PROC_DTL_TURE | varchar(max) | YES |
| 22 | EXPT_ST_DT | datetime2 | YES |
| 23 | EXPT_END_DT | datetime2 | YES |
| 24 | REAL_ST_DT | datetime2 | YES |
| 25 | REAL_END_DT | datetime2 | YES |
| 26 | PREV_REAL_END_DT | datetime2 | YES |
| 27 | PROC_PREV_REAL_END_DT | datetime2 | YES |
| 28 | TOT_REST_MINUTES | float | YES |
| 29 | SUM_REST_MINUTES | float | YES |
| 30 | PLN_RLT | float | YES |
| 31 | PLN_RLT_H | float | YES |
| 32 | RLT | float | YES |
| 33 | MH | float | YES |
| 34 | ACT_RLT | float | YES |
| 35 | ACT_RLT_H | float | YES |
| 36 | WO_RLT | float | YES |
| 37 | DELIVERY_DT | datetime2 | YES |
| 38 | DELIVERY_REAL_DT | datetime2 | YES |
| 39 | UPD_DT | datetime2 | YES |
| 40 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_PROPO_WORK_TEST_2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | PROPO_DT | varchar(max) | YES |
| 5 | PROPO_SEQ | varchar(max) | YES |
| 6 | PROPO_NO | varchar(max) | YES |
| 7 | STAT_CD | varchar(max) | YES |
| 8 | STAT_NM | varchar(max) | YES |
| 9 | DAMAGE | varchar(max) | YES |
| 10 | PROC_TYPE_CD | varchar(max) | YES |
| 11 | WORK_SEQ | varchar(max) | YES |
| 12 | TECHMAN_ID | varchar(max) | YES |
| 13 | TECHMAN_NM | varchar(max) | YES |
| 14 | TEHCMAN_TECH | varchar(max) | YES |
| 15 | PROC_DTL_CD | varchar(max) | YES |
| 16 | PROC_DTL_NM | varchar(max) | YES |
| 17 | PROC_DTL_EN | varchar(max) | YES |
| 18 | PROC_DTL_NO | varchar(max) | YES |
| 19 | PROC_PREV_DTL_EN | varchar(max) | YES |
| 20 | PROC_PREV_DTL_NO | varchar(max) | YES |
| 21 | PROC_DTL_TURE | varchar(max) | YES |
| 22 | EXPT_ST_DT | datetime2 | YES |
| 23 | EXPT_END_DT | datetime2 | YES |
| 24 | REAL_ST_DT | datetime2 | YES |
| 25 | REAL_END_DT | datetime2 | YES |
| 26 | PREV_REAL_END_DT | datetime2 | YES |
| 27 | PROC_PREV_REAL_END_DT | datetime2 | YES |
| 28 | TOT_REST_MINUTES | float | YES |
| 29 | SUM_REST_MINUTES | float | YES |
| 30 | PLN_RLT | float | YES |
| 31 | PLN_RLT_H | float | YES |
| 32 | RLT | float | YES |
| 33 | MH | float | YES |
| 34 | ACT_RLT | float | YES |
| 35 | ACT_RLT_H | float | YES |
| 36 | WO_RLT | float | YES |
| 37 | DELIVERY_DT | datetime2 | YES |
| 38 | DELIVERY_REAL_DT | datetime2 | YES |
| 39 | UPD_DT | datetime2 | YES |
| 40 | ETL_TIME | datetime2 | YES |

#### bpk.BP_SVC_REPEAT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | SHOP_CD | varchar(max) | YES |
| 3 | TDATE | date | YES |
| 4 | CATEGORY_CODE | varchar(max) | YES |
| 5 | CATEGORY | varchar(max) | YES |
| 6 | PROC | varchar(max) | YES |
| 7 | CNT | float | YES |
| 8 | UPD_DT | datetime2 | YES |
| 9 | ETL_DATE | datetime2 | YES |

#### bpk.BP_SVC_WORKOVER  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | TDATE | date | YES |
| 3 | SHOP_CD | varchar(max) | YES |
| 4 | WORK_DATE | varchar(max) | YES |
| 5 | TECHMAN_ID | varchar(max) | YES |
| 6 | TECHMAN_NM | varchar(max) | YES |
| 7 | TECHMAN_TECH | varchar(max) | YES |
| 8 | WORK_HOUR | float | YES |
| 9 | OVER_HOUR | float | YES |
| 10 | OFF_WORK_TYPE | varchar(max) | YES |
| 11 | UPD_DT | datetime2 | YES |
| 12 | ETL_TIME | datetime2 | YES |

#### bpk.BP_TECH_HIST

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | USER_ID | varchar(max) | YES |
| 3 | DEALER_ID | varchar(max) | YES |
| 4 | BPSHOP_ID | varchar(max) | YES |
| 5 | START_YYYYMMDD | varchar(max) | YES |
| 6 | START_YYYYMM | varchar(max) | YES |
| 7 | START_YYYY | varchar(max) | YES |
| 8 | START_MM | varchar(max) | YES |
| 9 | END_YYYYMMDD | varchar(max) | YES |
| 10 | END_YYYYMM | varchar(max) | YES |
| 11 | END_YYYY | varchar(max) | YES |
| 12 | END_MM | varchar(max) | YES |
| 13 | ETL_TIME | datetime2 | YES |

#### bpk.BP_TECH_INFO  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | USER_ID | varchar(max) | YES |
| 3 | USER_NAME | varchar(max) | YES |
| 4 | TITLE_CD | varchar(max) | YES |
| 5 | TITLE_NM | varchar(max) | YES |
| 6 | GROUP_ID | varchar(max) | YES |
| 7 | GROUP_NM | varchar(max) | YES |
| 8 | DEPT_CD | varchar(max) | YES |
| 9 | TYPE_CD | varchar(max) | YES |
| 10 | TYPE_NM | varchar(max) | YES |
| 11 | SKILL_CD | varchar(max) | YES |
| 12 | SKILL_NM | varchar(max) | YES |
| 13 | WORK_ST_DT | varchar(max) | YES |
| 14 | WORK_END_DT | varchar(max) | YES |
| 15 | ACTIVE_YN | varchar(max) | YES |
| 16 | XTH_YEAR | float | YES |
| 17 | XTH_CATEGORY | varchar(max) | YES |
| 18 | UPD_DT | datetime2 | YES |
| 19 | ETL_TIME | datetime2 | YES |

#### bpk.BP_TECH_INFO_VISUAL

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | USER_ID | varchar(max) | YES |
| 3 | USER_NAME | varchar(max) | YES |
| 4 | TITLE_CD | varchar(max) | YES |
| 5 | TITLE_NM | varchar(max) | YES |
| 6 | GROUP_ID | varchar(max) | YES |
| 7 | GROUP_NM | varchar(max) | YES |
| 8 | DEPT_CD | varchar(max) | YES |
| 9 | TYPE_CD | varchar(max) | YES |
| 10 | TYPE_NM | varchar(max) | YES |
| 11 | SKILL_CD | varchar(max) | YES |
| 12 | SKILL_NM | varchar(max) | YES |
| 13 | WORK_ST_DT | varchar(max) | YES |
| 14 | WORK_END_DT | varchar(max) | YES |
| 15 | ACTIVE_YN | varchar(max) | YES |
| 16 | XTH_YEAR | float | YES |
| 17 | XTH_CATEGORY | varchar(max) | YES |
| 18 | UPD_DT | datetime2 | YES |
| 19 | ETL_TIME | datetime2 | YES |

#### bpk.BP_WORKINGDAY  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(10) | YES |
| 2 | SHOP_CD | varchar(10) | YES |
| 3 | GROUP_NAME | varchar(50) | YES |
| 4 | TDATE | date | YES |
| 5 | WORKING_DAY | float | YES |
| 6 | ELT_TIME | datetime2 | YES |

#### bpk.CO_BPSHOP  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | GROUP_ID | varchar(max) | YES |
| 3 | GROUP_NAME | varchar(max) | YES |
| 4 | GROUP_TYPE | varchar(max) | YES |
| 5 | UP_GROUP_ID | varchar(max) | YES |
| 6 | HOLDING_ID | varchar(max) | YES |

#### bpk.CO_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(max) | YES | 브랜드 |
| 2 | GROUP_NAME | varchar(max) | YES | 명칭 |
| 3 | GROUP_ID | varchar(max) | YES | 식별자(ID) |
| 4 | GROUP_TYPE | varchar(max) | YES | 유형코드 |
| 5 | LOCATION_ID | varchar(max) | YES | 식별자(ID) |
| 6 | DELEAR_ID | varchar(max) | YES | 식별자(ID) |
| 7 | ORG_ID | varchar(max) | YES | 식별자(ID) |

#### bpk.CO_GROUP_BI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | GROUP_ID | varchar(max) | YES |
| 3 | BRAND_CD | varchar(max) | YES |
| 4 | BI_GROUP_ID | varchar(max) | YES |
| 5 | BI_GROUP_NAME | varchar(max) | YES |
| 6 | REG_USER_ID | varchar(max) | YES |
| 7 | UPD_USER_ID | varchar(max) | YES |

#### bpk.DIM_CALENDAR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | TDATE | date | YES |
| 2 | DAY | varchar(10) | YES |
| 3 | YEAR | varchar(10) | YES |
| 4 | MONTH | varchar(10) | YES |
| 5 | MONTH_EN | varchar(20) | YES |
| 6 | MONTH_EN3 | varchar(10) | YES |
| 7 | QUARTER | varchar(10) | YES |
| 8 | YYYYMM | varchar(10) | YES |
| 9 | YY-MMM | varchar(10) | YES |
| 10 | YYYY-MMM | varchar(10) | YES |

#### bpk.DIM_CALENDAR_MAIN  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DATEKEY | date | YES |
| 2 | YYYYMMDD | int | YES |
| 3 | YYYYMMDD_KOR | varchar(30) | YES |
| 4 | YYYYMMDD_DOT | varchar(20) | YES |
| 5 | LATESTDAY_CURRENT | varchar(20) | YES |
| 6 | WEEKDAY | varchar(40) | YES |
| 7 | WEEKDAY_SHORT | varchar(20) | YES |
| 8 | WEEK_NO | int | YES |
| 9 | WEEK_EN | varchar(10) | YES |
| 10 | MONTH | int | YES |
| 11 | MONTH_KOR | varchar(10) | YES |
| 12 | MONTH_EN | varchar(10) | YES |
| 13 | MMDD_DOT | varchar(20) | YES |
| 14 | ISO_WEEK | int | YES |
| 15 | MONTH_WEEKNO | varchar(20) | YES |
| 16 | YYYY | varchar(20) | YES |
| 17 | YYYY_KOR | varchar(10) | YES |
| 18 | YYYY_EN | varchar(10) | YES |
| 19 | YYYYMM | varchar(20) | YES |
| 20 | YYMM | varchar(20) | YES |
| 21 | YYYYMM_KOR | varchar(20) | YES |
| 22 | YYYYMM_DOT | varchar(20) | YES |
| 23 | YYYYQQ | varchar(20) | YES |
| 24 | YYYYQQ_KOR | varchar(20) | YES |
| 25 | QQ_KOR | varchar(20) | YES |
| 26 | YYYYHH | varchar(20) | YES |
| 27 | YYYYHH_KOR | varchar(20) | YES |
| 28 | HH_KOR | varchar(20) | YES |
| 29 | ETL_DT | datetime2 | YES |

#### bpk.DIM_CALENDAR_SUB  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DATEKEY | date | YES |
| 2 | YYYYMMDD | int | YES |
| 3 | YYYYMMDD_KOR | varchar(30) | YES |
| 4 | YYYYMMDD_DOT | varchar(20) | YES |
| 5 | LATESTDAY_CURRENT | varchar(20) | YES |
| 6 | WEEKDAY | varchar(40) | YES |
| 7 | WEEKDAY_SHORT | varchar(20) | YES |
| 8 | WEEK_NO | int | YES |
| 9 | WEEK_EN | varchar(10) | YES |
| 10 | MONTH | int | YES |
| 11 | MONTH_KOR | varchar(10) | YES |
| 12 | MONTH_EN | varchar(10) | YES |
| 13 | MMDD_DOT | varchar(20) | YES |
| 14 | ISO_WEEK | int | YES |
| 15 | MONTH_WEEKNO | varchar(20) | YES |
| 16 | YYYY | varchar(20) | YES |
| 17 | YYYY_KOR | varchar(10) | YES |
| 18 | YYYY_EN | varchar(10) | YES |
| 19 | YYYYMM | varchar(20) | YES |
| 20 | YYMM | varchar(20) | YES |
| 21 | YYYYMM_KOR | varchar(20) | YES |
| 22 | YYYYMM_DOT | varchar(20) | YES |
| 23 | YYYYQQ | varchar(20) | YES |
| 24 | YYYYQQ_KOR | varchar(20) | YES |
| 25 | QQ_KOR | varchar(20) | YES |
| 26 | YYYYHH | varchar(20) | YES |
| 27 | YYYYHH_KOR | varchar(20) | YES |
| 28 | HH_KOR | varchar(20) | YES |
| 29 | ETL_DT | datetime2 | YES |

#### bpk.DIM_CO_BI_LOGO  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | FILE_NM | varchar(max) | YES |
| 2 | EMP_NO | varchar(max) | YES |
| 3 | EMP_NAME | varchar(max) | YES |
| 4 | IMG_CD | varchar(max) | YES |
| 5 | REG_DT | datetime2 | YES |

#### bpk.DIM_CO_BRAND  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | BRAND | varchar(10) | YES |
| 3 | BRAND_CD | varchar(10) | YES |
| 4 | BRAND_KR | varchar(10) | YES |

#### bpk.DIM_CO_DAMAGE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | DAMAGE | varchar(10) | YES |
| 3 | DAMAGE_CD | varchar(10) | YES |
| 4 | DESC | varchar(50) | YES |

#### bpk.DIM_CO_DELISITE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(max) | YES |
| 2 | GROUP_ID | varchar(max) | YES |
| 3 | CODE_GRP | varchar(max) | YES |
| 4 | BP_DELI_SITE | varchar(max) | YES |
| 5 | BP_DELI_SITE_NM | varchar(max) | YES |

#### bpk.DIM_CO_TECH  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | TECH | varchar(10) | YES |
| 3 | DESC | varchar(50) | YES |

#### bpk.DIM_CO_WORKFLOW  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | WORK | varchar(50) | YES |
| 3 | WORK_KR | varchar(50) | YES |
| 4 | WORK_CD | varchar(10) | YES |
| 5 | WO_WORK | varchar(50) | YES |
| 6 | WO_WORK_KR | varchar(50) | YES |

#### bpk.DIM_CO_WORKFLOW_20260611

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | WORK | varchar(50) | YES |
| 3 | WORK_KR | varchar(50) | YES |
| 4 | WORK_CD | varchar(10) | YES |
| 5 | WO_WORK | varchar(50) | YES |
| 6 | WO_WORK_KR | varchar(50) | YES |

#### bpk.DIM_CO_WORKFLOW_20260618

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | NO | int | YES |
| 2 | WORK | varchar(50) | YES |
| 3 | WORK_KR | varchar(50) | YES |
| 4 | WORK_CD | varchar(10) | YES |
| 5 | WO_WORK | varchar(50) | YES |
| 6 | WO_WORK_KR | varchar(50) | YES |

#### bpk.Z_RLS_ACC_TEST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | ACCOUNT | varchar(100) | YES |
| 2 | BRAND | varchar(100) | YES |
| 3 | SHOP_CD | varchar(100) | YES |

#### bpk.Z_RLS_ACC_TEST_sub  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | ACCOUNT | varchar(100) | YES |
| 2 | BRAND | varchar(100) | YES |
| 3 | SHOP_CD | varchar(100) | YES |

#### bpk.Z_RLS_TEST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | TDATE | date | YES |
| 2 | SHOP_CD | varchar(100) | YES |
| 3 | BPUS | float | YES |

#### bpk._Measure  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | TEST | int | YES |

#### dbo.CO_BI_LOGO  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | FILE_NM | varchar(max) | YES |
| 2 | EMP_NO | varchar(max) | YES |
| 3 | EMP_NAME | varchar(max) | YES |
| 4 | IMG_CD | varchar(max) | YES |
| 5 | REG_DT | datetime2 | YES |
| 6 | ELT_TIME | datetime2 | YES |

#### dbo.CO_CALENDAR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | base_dt | varchar(max) | YES |
| 2 | week_no_by_month | decimal(18,0) | YES |
| 3 | week_day | varchar(max) | YES |
| 4 | work_korea | varchar(max) | YES |
| 5 | work_overseas | varchar(max) | YES |
| 6 | work_dealer | varchar(max) | YES |
| 7 | work_hq | varchar(max) | YES |
| 8 | work_cpd | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | ELT_TIMESTAMP | varchar(100) | YES |
| 14 | BRAND | varchar(20) | YES |

#### dbo.CO_CODE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_type_nm | varchar(max) | YES |
| 4 | code_nm | varchar(max) | YES |
| 5 | eng_code_nm | varchar(max) | YES |
| 6 | display_order | varchar(max) | YES |
| 7 | up_code_type | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.CO_CODE_DEV  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_type_nm | varchar(max) | YES |
| 4 | code_nm | varchar(max) | YES |
| 5 | eng_code_nm | varchar(max) | YES |
| 6 | display_order | varchar(max) | YES |
| 7 | up_code_type | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.CO_COMPANY  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | comp_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | cust_seq | bigint | YES |
| 4 | biz_reg_no | varchar(max) | YES |
| 5 | comp_nm_kor | varchar(max) | YES |
| 6 | comp_nm_engl | varchar(max) | YES |
| 7 | biz_cond_nm | varchar(max) | YES |
| 8 | chief_id | varchar(max) | YES |
| 9 | chief_name_kor | varchar(max) | YES |
| 10 | chief_name_engl | varchar(max) | YES |
| 11 | comp_email | varchar(max) | YES |
| 12 | zip | varchar(max) | YES |
| 13 | addr | varchar(max) | YES |
| 14 | addr_no | varchar(max) | YES |
| 15 | tel_area | varchar(max) | YES |
| 16 | tel_no | varchar(max) | YES |
| 17 | fax_area | varchar(max) | YES |
| 18 | fax_no | varchar(max) | YES |
| 19 | use_yn | varchar(max) | YES |
| 20 | parts_company_type | varchar(max) | YES |
| 21 | parts_flag | varchar(max) | YES |
| 22 | comp_identi | varchar(max) | YES |
| 23 | cust_flag | varchar(max) | YES |
| 24 | splr_flag | varchar(max) | YES |
| 25 | splr_group | varchar(max) | YES |
| 26 | order_cycle | decimal(18,0) | YES |
| 27 | safe_stock_lead_time | decimal(18,0) | YES |
| 28 | lead_time | decimal(18,0) | YES |
| 29 | short_stock_warn_base | decimal(18,0) | YES |
| 30 | over_due_days_sea | int | YES |
| 31 | over_due_days_air | int | YES |
| 32 | over_due_days_fo | int | YES |
| 33 | impr_cd | varchar(max) | YES |
| 34 | exch_rate_recv | decimal(18,0) | YES |
| 35 | exch_rate_price_chng | decimal(18,0) | YES |
| 36 | lc_fact_resv | decimal(18,0) | YES |
| 37 | lc_fact_air | decimal(18,0) | YES |
| 38 | lc_fact_price_chng | decimal(18,0) | YES |
| 39 | term_order_to_etd | int | YES |
| 40 | term_order_to_eta | int | YES |
| 41 | so_entr_alow_day | bigint | YES |
| 42 | part_dc_rate_dms | int | YES |
| 43 | bo_fk | varchar(max) | YES |
| 44 | base_price_type | varchar(max) | YES |
| 45 | cust_region_cd | varchar(max) | YES |
| 46 | cust_tran_cd | varchar(max) | YES |
| 47 | delivery_zip | varchar(max) | YES |
| 48 | delivery_adr | varchar(max) | YES |
| 49 | delivery_adr_no | varchar(max) | YES |
| 50 | country | varchar(max) | YES |
| 51 | ar_biz_type_nm | varchar(max) | YES |
| 52 | service_company_type | varchar(max) | YES |
| 53 | service_flag | varchar(max) | YES |
| 54 | ap_vat_cd | varchar(max) | YES |
| 55 | ap_payment_method | varchar(max) | YES |
| 56 | ar_vat_cd | varchar(max) | YES |
| 57 | reg_dt | varchar(max) | YES |
| 58 | reg_user_id | varchar(max) | YES |
| 59 | upd_dt | varchar(max) | YES |
| 60 | upd_user_id | varchar(max) | YES |
| 61 | bp_shop_yn | varchar(max) | YES |
| 62 | dc_rate | decimal(18,0) | YES |
| 63 | oil_purc_yn | varchar(max) | YES |
| 64 | tr_zip | varchar(max) | YES |
| 65 | tr_addr | varchar(max) | YES |
| 66 | tr_addr_no | varchar(max) | YES |
| 67 | tr_addr_flag | varchar(max) | YES |
| 68 | tr_addr_insert_flag | varchar(max) | YES |
| 69 | tr_addr_bld_no | varchar(max) | YES |
| 70 | tr_addr_result | varchar(max) | YES |
| 71 | tr_zip_delivery | varchar(max) | YES |
| 72 | tr_addr_delivery | varchar(max) | YES |
| 73 | tr_addr_no_delivery | varchar(max) | YES |
| 74 | tr_addr_delivery_flag | varchar(max) | YES |
| 75 | tr_addr_delivery_insert_flag | varchar(max) | YES |
| 76 | tr_addr_delivery_bld_no | varchar(max) | YES |
| 77 | tr_addr_delivery_result | varchar(max) | YES |
| 78 | ELT_TIMESTAMP | varchar(100) | YES |
| 79 | BRAND | varchar(20) | YES |

#### dbo.CO_GROUP  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | group_name | varchar(max) | YES |
| 3 | group_full_name | varchar(max) | YES |
| 4 | group_type | varchar(max) | YES |
| 5 | chief_name | varchar(max) | YES |
| 6 | chief_id | varchar(max) | YES |
| 7 | biz_reg_no | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | pdi_area | varchar(max) | YES |
| 12 | cpd_area | varchar(max) | YES |
| 13 | found_dt | varchar(max) | YES |
| 14 | showroom_no | decimal(18,0) | YES |
| 15 | kaida_group_id | varchar(max) | YES |
| 16 | fee_delivery | decimal(18,0) | YES |
| 17 | fee_transfer | decimal(18,0) | YES |
| 18 | service_yn | varchar(max) | YES |
| 19 | service_ip | varchar(max) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | decimal(18,0) | YES |
| 23 | group_short_name | varchar(max) | YES |
| 24 | group_area | varchar(max) | YES |
| 25 | stock_value_type | varchar(max) | YES |
| 26 | usage_type | varchar(max) | YES |
| 27 | tmkr_service_cd | varchar(max) | YES |
| 28 | tmkr_parts_cd | varchar(max) | YES |
| 29 | tmkr_sales_cd | varchar(max) | YES |
| 30 | tmc_service_cd | varchar(max) | YES |
| 31 | tmc_parts_cd | varchar(max) | YES |
| 32 | tmc_sales_cd | varchar(max) | YES |
| 33 | up_group_id | varchar(max) | YES |
| 34 | system_use_yn | varchar(max) | YES |
| 35 | dealer_yn | varchar(max) | YES |
| 36 | shop_yn | varchar(max) | YES |
| 37 | highest_group_yn | varchar(max) | YES |
| 38 | use_yn | varchar(max) | YES |
| 39 | photo_file_dir | varchar(max) | YES |
| 40 | org_id | decimal(18,0) | YES |
| 41 | set_of_books_id | decimal(18,0) | YES |
| 42 | location_id | decimal(18,0) | YES |
| 43 | reg_user_id | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | upd_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | dealer_id | varchar(max) | YES |
| 48 | ci_image_id | varchar(max) | YES |
| 49 | tel_area | varchar(max) | YES |
| 50 | tel_no | varchar(max) | YES |
| 51 | fax_area | varchar(max) | YES |
| 52 | fax_no | varchar(max) | YES |
| 53 | biz_type_nm | varchar(max) | YES |
| 54 | biz_cond_nm | varchar(max) | YES |
| 55 | sms_name | varchar(max) | YES |
| 56 | svc_sms_no | varchar(max) | YES |
| 57 | new_tmkr_parts_cd | varchar(max) | YES |
| 58 | new_tmc_parts_cd | varchar(max) | YES |
| 59 | svc_reg_no | varchar(max) | YES |
| 60 | svc_chrg_nm | varchar(max) | YES |
| 61 | fd_code_sea | varchar(max) | YES |
| 62 | fd_code_air | varchar(max) | YES |
| 63 | brand_cd | varchar(max) | YES |
| 64 | svc_tr_user_id | varchar(max) | YES |
| 65 | holding_id | varchar(max) | YES |
| 66 | dz_bizarea_cd | varchar(max) | YES |
| 67 | ELT_TIMESTAMP | varchar(100) | YES |
| 68 | BRAND | varchar(20) | YES |

#### dbo.CO_GROUP_BI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | brand_cd | varchar(max) | YES |
| 3 | bi_group_id | varchar(max) | YES |
| 4 | bi_group_name | varchar(max) | YES |
| 5 | reg_user_id | varchar(max) | YES |
| 6 | reg_dt | varchar(max) | YES |
| 7 | upd_user_id | varchar(max) | YES |
| 8 | upd_dt | varchar(max) | YES |
| 9 | ELT_TIMESTAMP | varchar(100) | YES |
| 10 | BRAND | varchar(20) | YES |

#### dbo.CO_HOLDINGS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | group_name | varchar(max) | YES |
| 3 | group_full_name | varchar(max) | YES |
| 4 | group_type | varchar(max) | YES |
| 5 | chief_name | varchar(max) | YES |
| 6 | chief_id | varchar(max) | YES |
| 7 | biz_reg_no | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | pdi_area | varchar(max) | YES |
| 12 | cpd_area | varchar(max) | YES |
| 13 | found_dt | varchar(max) | YES |
| 14 | showroom_no | decimal(18,0) | YES |
| 15 | kaida_group_id | varchar(max) | YES |
| 16 | fee_delivery | decimal(18,0) | YES |
| 17 | fee_transfer | decimal(18,0) | YES |
| 18 | service_yn | varchar(max) | YES |
| 19 | service_ip | varchar(max) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | decimal(18,0) | YES |
| 23 | group_short_name | varchar(max) | YES |
| 24 | group_area | varchar(max) | YES |
| 25 | stock_value_type | varchar(max) | YES |
| 26 | usage_type | varchar(max) | YES |
| 27 | tmkr_service_cd | varchar(max) | YES |
| 28 | tmkr_parts_cd | varchar(max) | YES |
| 29 | tmkr_sales_cd | varchar(max) | YES |
| 30 | tmc_service_cd | varchar(max) | YES |
| 31 | tmc_parts_cd | varchar(max) | YES |
| 32 | tmc_sales_cd | varchar(max) | YES |
| 33 | up_group_id | varchar(max) | YES |
| 34 | system_use_yn | varchar(max) | YES |
| 35 | dealer_yn | varchar(max) | YES |
| 36 | shop_yn | varchar(max) | YES |
| 37 | highest_group_yn | varchar(max) | YES |
| 38 | use_yn | varchar(max) | YES |
| 39 | photo_file_dir | varchar(max) | YES |
| 40 | org_id | decimal(18,0) | YES |
| 41 | set_of_books_id | decimal(18,0) | YES |
| 42 | location_id | decimal(18,0) | YES |
| 43 | reg_user_id | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | upd_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | dealer_id | varchar(max) | YES |
| 48 | ci_image_id | varchar(max) | YES |
| 49 | tel_area | varchar(max) | YES |
| 50 | tel_no | varchar(max) | YES |
| 51 | fax_area | varchar(max) | YES |
| 52 | fax_no | varchar(max) | YES |
| 53 | biz_type_nm | varchar(max) | YES |
| 54 | biz_cond_nm | varchar(max) | YES |
| 55 | sms_name | varchar(max) | YES |
| 56 | svc_sms_no | varchar(max) | YES |
| 57 | new_tmkr_parts_cd | varchar(max) | YES |
| 58 | new_tmc_parts_cd | varchar(max) | YES |
| 59 | svc_reg_no | varchar(max) | YES |
| 60 | svc_chrg_nm | varchar(max) | YES |
| 61 | fd_code_sea | varchar(max) | YES |
| 62 | fd_code_air | varchar(max) | YES |
| 63 | brand_cd | varchar(max) | YES |
| 64 | svc_tr_user_id | varchar(max) | YES |
| 65 | group_cd | varchar(max) | YES |
| 66 | dz_comp_cd | varchar(max) | YES |
| 67 | dz_bizarea_cd | varchar(max) | YES |
| 68 | ELT_TIMESTAMP | varchar(100) | YES |
| 69 | BRAND | varchar(20) | YES |

#### dbo.CO_NPS_RESULT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reg_dt | varchar(max) | YES |
| 2 | upd_dt | varchar(max) | YES |
| 3 | nps_seq | decimal(18,0) | YES |
| 4 | biz_area | varchar(max) | YES |
| 5 | ref_key | varchar(max) | YES |
| 6 | reply_date | varchar(max) | YES |
| 7 | promoter_score | decimal(18,0) | YES |
| 8 | cust_comment | varchar(max) | YES |
| 9 | response_date | varchar(max) | YES |
| 10 | response_way | varchar(max) | YES |
| 11 | one_response_content | varchar(max) | YES |
| 12 | one_response_user | varchar(max) | YES |
| 13 | ELT_TIMESTAMP | varchar(100) | YES |
| 14 | BRAND | varchar(20) | YES |

#### dbo.CO_ORGANIZATION  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | dept_cd | varchar(max) | YES |
| 2 | dept_nm | varchar(max) | YES |
| 3 | rank | decimal(18,0) | YES |
| 4 | sales_yn | varchar(max) | YES |
| 5 | shop_yn | varchar(max) | YES |
| 6 | use_yn | varchar(max) | YES |
| 7 | close_dt | varchar(max) | YES |
| 8 | reg_dt | varchar(max) | YES |
| 9 | upd_dt | varchar(max) | YES |
| 10 | group_id | varchar(max) | YES |
| 11 | dealer_id | varchar(max) | YES |
| 12 | bol_yn | varchar(max) | YES |
| 13 | ELT_TIMESTAMP | varchar(100) | YES |
| 14 | BRAND | varchar(20) | YES |

#### dbo.CO_OTHER_BRAND  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_nm | varchar(max) | YES |
| 4 | up_code | varchar(max) | YES |
| 5 | display_order | varchar(max) | YES |
| 6 | use_yn | varchar(max) | YES |
| 7 | reg_dt | varchar(max) | YES |
| 8 | upd_dt | varchar(max) | YES |
| 9 | vehic_type | varchar(max) | YES |
| 10 | code_old | varchar(max) | YES |
| 11 | nicednr_data | varchar(max) | YES |
| 12 | ELT_TIMESTAMP | varchar(100) | YES |
| 13 | BRAND | varchar(20) | YES |

#### dbo.CO_USERS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | dept_cd | varchar(max) | YES |
| 4 | showroom_id | varchar(max) | YES |
| 5 | name | varchar(max) | YES |
| 6 | title | varchar(max) | YES |
| 7 | biz_charge | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | email | varchar(max) | YES |
| 12 | authority | varchar(max) | YES |
| 13 | user_group | varchar(max) | YES |
| 14 | user_type | varchar(max) | YES |
| 15 | passwd | varchar(max) | YES |
| 16 | display_order | varchar(max) | YES |
| 17 | photo_file_dir | varchar(max) | YES |
| 18 | skill_degree | varchar(max) | YES |
| 19 | assign_stall | varchar(max) | YES |
| 20 | name_eng | varchar(max) | YES |
| 21 | designate_eng | varchar(max) | YES |
| 22 | dept_eng | varchar(max) | YES |
| 23 | addr_eng | varchar(max) | YES |
| 24 | pref_lang | varchar(max) | YES |
| 25 | work_start_dt | varchar(max) | YES |
| 26 | resigned_dt | varchar(max) | YES |
| 27 | active_yn | varchar(max) | YES |
| 28 | charge_service | varchar(max) | YES |
| 29 | charge_sales | varchar(max) | YES |
| 30 | charge_parts | varchar(max) | YES |
| 31 | query_type_sales | varchar(max) | YES |
| 32 | query_type_service | varchar(max) | YES |
| 33 | query_type_parts | varchar(max) | YES |
| 34 | reg_user_id | varchar(max) | YES |
| 35 | reg_dt | varchar(max) | YES |
| 36 | upd_user_id | varchar(max) | YES |
| 37 | upd_dt | varchar(max) | YES |
| 38 | empl_no | varchar(max) | YES |
| 39 | regi_no | varchar(max) | YES |
| 40 | bef_sale_id | varchar(max) | YES |
| 41 | bef_service_id | varchar(max) | YES |
| 42 | bef_crm_id | varchar(max) | YES |
| 43 | fax_no | varchar(max) | YES |
| 44 | tel_area | varchar(max) | YES |
| 45 | tel_no | varchar(max) | YES |
| 46 | fax_area | varchar(max) | YES |
| 47 | hp_area | varchar(max) | YES |
| 48 | hp_no | varchar(max) | YES |
| 49 | facade_sc_yn | varchar(max) | YES |
| 50 | frm_kind | varchar(max) | YES |
| 51 | tax_use_type | varchar(max) | YES |
| 52 | intro_menu | varchar(max) | YES |
| 53 | dlr_voc_mng | varchar(max) | YES |
| 54 | last_login_date | varchar(max) | YES |
| 55 | passwd_upd_dt | varchar(max) | YES |
| 56 | svc_head_yn | varchar(max) | YES |
| 57 | password_lock | varchar(max) | YES |
| 58 | mac_address | varchar(max) | YES |
| 59 | pop_part_yn | varchar(max) | YES |
| 60 | tr_zip | varchar(max) | YES |
| 61 | tr_addr | varchar(max) | YES |
| 62 | tr_addr_no | varchar(max) | YES |
| 63 | tr_addr_flag | varchar(max) | YES |
| 64 | tr_addr_insert_flag | varchar(max) | YES |
| 65 | tr_addr_bld_no | varchar(max) | YES |
| 66 | tr_addr_result | varchar(max) | YES |
| 67 | vpn_yn | varchar(max) | YES |
| 68 | auth_apvl_user_id | varchar(max) | YES |
| 69 | intro_quick_menu | varchar(max) | YES |
| 70 | e_learning_pwd | varchar(max) | YES |
| 71 | out_act_cust_seq | decimal(18,0) | YES |
| 72 | master_user_id | varchar(max) | YES |
| 73 | gm_type | varchar(max) | YES |
| 74 | passwd_sha256 | varchar(max) | YES |
| 75 | edu_yn | varchar(max) | YES |
| 76 | edu_cate | varchar(max) | YES |
| 77 | vpn_cnfm_dt | varchar(max) | YES |
| 78 | first_name_eng | varchar(max) | YES |
| 79 | sms_default_no | varchar(max) | YES |
| 80 | layoff_dt | varchar(max) | YES |
| 81 | resume_dt | varchar(max) | YES |
| 82 | reactive_yn | varchar(max) | YES |
| 83 | bi_code | varchar(max) | YES |
| 84 | edu_primary_yn | varchar(max) | YES |
| 85 | device_yn | varchar(max) | YES |
| 86 | ELT_TIMESTAMP | varchar(100) | YES |
| 87 | BRAND | varchar(20) | YES |

#### dbo.CO_USERS_HIST

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | start_dt | varchar(max) | YES |
| 3 | end_dt | varchar(max) | YES |
| 4 | group_id | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | user_type | varchar(max) | YES |
| 7 | active_yn | varchar(max) | YES |
| 8 | reg_user_id | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | upd_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | frm_kind | varchar(max) | YES |
| 13 | skill_degree | varchar(max) | YES |
| 14 | seq | decimal(38,18) | YES |
| 15 | reactive_yn | varchar(max) | YES |
| 16 | ELT_TIMESTAMP | varchar(100) | YES |
| 17 | BRAND | varchar(20) | YES |

#### dbo.CO_USERS_KTWS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | dept_cd | varchar(max) | YES |
| 4 | showroom_id | varchar(max) | YES |
| 5 | name | varchar(max) | YES |
| 6 | title | varchar(max) | YES |
| 7 | biz_charge | varchar(max) | YES |
| 8 | email | varchar(max) | YES |
| 9 | authority | varchar(max) | YES |
| 10 | user_group | varchar(max) | YES |
| 11 | user_type | varchar(max) | YES |
| 12 | display_order | varchar(max) | YES |
| 13 | photo_file_dir | varchar(max) | YES |
| 14 | skill_degree | varchar(max) | YES |
| 15 | assign_stall | varchar(max) | YES |
| 16 | name_eng | varchar(max) | YES |
| 17 | designate_eng | varchar(max) | YES |
| 18 | dept_eng | varchar(max) | YES |
| 19 | pref_lang | varchar(max) | YES |
| 20 | work_start_dt | varchar(max) | YES |
| 21 | resigned_dt | varchar(max) | YES |
| 22 | active_yn | varchar(max) | YES |
| 23 | charge_service | varchar(max) | YES |
| 24 | charge_sales | varchar(max) | YES |
| 25 | charge_parts | varchar(max) | YES |
| 26 | query_type_sales | varchar(max) | YES |
| 27 | query_type_service | varchar(max) | YES |
| 28 | query_type_parts | varchar(max) | YES |
| 29 | reg_dt | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | empl_no | varchar(max) | YES |
| 32 | regi_no | varchar(max) | YES |
| 33 | bef_sale_id | varchar(max) | YES |
| 34 | bef_service_id | varchar(max) | YES |
| 35 | bef_crm_id | varchar(max) | YES |
| 36 | fax_no | varchar(max) | YES |
| 37 | facade_sc_yn | varchar(max) | YES |
| 38 | frm_kind | varchar(max) | YES |
| 39 | tax_use_type | varchar(max) | YES |
| 40 | intro_menu | varchar(max) | YES |
| 41 | dlr_voc_mng | varchar(max) | YES |
| 42 | last_login_date | varchar(max) | YES |
| 43 | passwd_upd_dt | varchar(max) | YES |
| 44 | svc_head_yn | varchar(max) | YES |
| 45 | pop_part_yn | varchar(max) | YES |
| 46 | vpn_yn | varchar(max) | YES |
| 47 | intro_quick_menu | varchar(max) | YES |
| 48 | e_learning_pwd | varchar(max) | YES |
| 49 | out_act_cust_seq | decimal(18,0) | YES |
| 50 | master_user_id | varchar(max) | YES |
| 51 | gm_type | varchar(max) | YES |
| 52 | edu_yn | varchar(max) | YES |
| 53 | edu_cate | varchar(max) | YES |
| 54 | vpn_cnfm_dt | varchar(max) | YES |
| 55 | first_name_eng | varchar(max) | YES |
| 56 | sms_default_no | varchar(max) | YES |
| 57 | layoff_dt | varchar(max) | YES |
| 58 | resume_dt | varchar(max) | YES |
| 59 | reactive_yn | varchar(max) | YES |
| 60 | bi_code | varchar(max) | YES |
| 61 | edu_primary_yn | varchar(max) | YES |
| 62 | device_yn | varchar(max) | YES |
| 63 | regi_no_dec | varchar(max) | YES |
| 64 | birth_dt | varchar(max) | YES |
| 65 | profile_url | varchar(max) | YES |
| 66 | ELT_TIMESTAMP | varchar(100) | YES |
| 67 | BRAND | varchar(20) | YES |

#### dbo.CO_VEHIC  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(max) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(max) | YES | 차량 |
| 3 | vehic_no2 | varchar(max) | YES | 차량 |
| 4 | vis | varchar(max) | YES |  |
| 5 | contract_no | decimal(18,0) | YES | 계약번호 |
| 6 | model_year | varchar(max) | YES | 모델 |
| 7 | brand_cd | varchar(max) | YES | 브랜드 |
| 8 | maker_cd | varchar(max) | YES | 코드 |
| 9 | variant_cd | varchar(max) | YES | 바리에이션 |
| 10 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 11 | odometer | int | YES |  |
| 12 | variant_nm | varchar(max) | YES | 바리에이션 |
| 13 | svc_model_cd | varchar(max) | YES | 모델 코드 |
| 14 | model_cd | varchar(max) | YES | 모델 코드 |
| 15 | option_cd1 | varchar(max) | YES |  |
| 16 | option_cd2 | varchar(max) | YES |  |
| 17 | option_cd3 | varchar(max) | YES |  |
| 18 | option_cd4 | varchar(max) | YES |  |
| 19 | key_no | varchar(max) | YES | 번호 |
| 20 | grade | varchar(max) | YES |  |
| 21 | import_yn | varchar(max) | YES | 여부(Y/N) |
| 22 | event | varchar(max) | YES |  |
| 23 | linein_dt | varchar(max) | YES | 일자 |
| 24 | delivery_dt | varchar(max) | YES | 출고일 |
| 25 | lineoff_dt | varchar(max) | YES | 일자 |
| 26 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 27 | exterior_cd | varchar(max) | YES | 코드 |
| 28 | interior_cd | varchar(max) | YES | 코드 |
| 29 | engine_no | varchar(max) | YES | 번호 |
| 30 | force_reg_dt | varchar(max) | YES | 등록일 |
| 31 | force_reg_yn | varchar(max) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(max) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(max) | YES | 딜러 ID |
| 35 | first_rcpt_dt | varchar(max) | YES | 일자 |
| 36 | sales_dealer_id | varchar(max) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(max) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(max) | YES | 딜러 ID |
| 40 | last_rcpt_dt | varchar(max) | YES | 일자 |
| 41 | vehic_magic | decimal(18,0) | YES | 차량 |
| 42 | ras_no | varchar(max) | YES | 번호 |
| 43 | ew_no | varchar(max) | YES | 번호 |
| 44 | sales_type | varchar(max) | YES | 판매 |
| 45 | ras_start_dt | varchar(max) | YES | 시작일 |
| 46 | ras_end_dt | varchar(max) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | varchar(max) | YES | 수정일 |
| 50 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 51 | upd_dt | varchar(max) | YES | 수정일 |
| 52 | first_owner_yn | varchar(max) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | varchar(max) | YES | 수정일 |
| 55 | hv_badge_yn | varchar(max) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(max) | YES | 여부(Y/N) |
| 57 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 58 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.CRM_ACT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | act_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_cd | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | sc_id | varchar(max) | YES |
| 7 | act_tp_grp | varchar(max) | YES |
| 8 | act_tp | varchar(max) | YES |
| 9 | contact_tp | varchar(max) | YES |
| 10 | plan_dt_fr | varchar(max) | YES |
| 11 | plan_dt_to | varchar(max) | YES |
| 12 | rel_sr_seq | decimal(18,0) | YES |
| 13 | rel_testcar_req | decimal(18,0) | YES |
| 14 | rel_testcar_reserved_dt | varchar(max) | YES |
| 15 | rel_testcar_from_time | varchar(max) | YES |
| 16 | rel_testcar_no | varchar(max) | YES |
| 17 | rel_ecrb_seq | decimal(18,0) | YES |
| 18 | rel_active_seq | decimal(18,0) | YES |
| 19 | rel_esti_seq | decimal(18,0) | YES |
| 20 | rel_resv_svc_center | varchar(max) | YES |
| 21 | rel_resv_dt | varchar(max) | YES |
| 22 | rel_resv_seq | decimal(18,0) | YES |
| 23 | lead_id | decimal(18,0) | YES |
| 24 | cust_seq | decimal(18,0) | YES |
| 25 | act_result | varchar(max) | YES |
| 26 | name | varchar(max) | YES |
| 27 | memo | varchar(max) | YES |
| 28 | catalog_sent_yn | varchar(max) | YES |
| 29 | act_dt_fr | varchar(max) | YES |
| 30 | act_dt_to | varchar(max) | YES |
| 31 | del_dt | varchar(max) | YES |
| 32 | use_yn | varchar(max) | YES |
| 33 | reg_dt | varchar(max) | YES |
| 34 | upd_dt | varchar(max) | YES |
| 35 | ref_cust_seq | decimal(18,0) | YES |
| 36 | ref_lead_id | decimal(18,0) | YES |
| 37 | ref_act_seq | decimal(18,0) | YES |
| 38 | resv_next_ecrb_dt | varchar(max) | YES |
| 39 | ref_rel_tp | varchar(max) | YES |
| 40 | rel_cpo_vehic_purc_key | decimal(18,0) | YES |
| 41 | family_seq | decimal(18,0) | YES |
| 42 | mask_yn | varchar(max) | YES |
| 43 | mask_dt | varchar(max) | YES |
| 44 | ELT_TIMESTAMP | varchar(100) | YES |
| 45 | BRAND | varchar(20) | YES |
| 46 | rel_visit_seq | decimal(18,0) | YES |

#### dbo.CRM_LEAD  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | lead_id | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_cd | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | sc_id | varchar(max) | YES |
| 7 | act_tp | varchar(max) | YES |
| 8 | potential | varchar(max) | YES |
| 9 | repurc_yn | varchar(max) | YES |
| 10 | bookmark_yn | varchar(max) | YES |
| 11 | name | varchar(max) | YES |
| 12 | cust_seq | decimal(18,0) | YES |
| 13 | int_mdl1 | varchar(max) | YES |
| 14 | int_var1 | varchar(max) | YES |
| 15 | int_my1 | varchar(max) | YES |
| 16 | int_sfx1 | varchar(max) | YES |
| 17 | int_mdl2 | varchar(max) | YES |
| 18 | int_var2 | varchar(max) | YES |
| 19 | int_my2 | varchar(max) | YES |
| 20 | int_sfx2 | varchar(max) | YES |
| 21 | purc_pnt | varchar(max) | YES |
| 22 | pay_tp | varchar(max) | YES |
| 23 | own_brd | varchar(max) | YES |
| 24 | own_mdl | varchar(max) | YES |
| 25 | memo | varchar(max) | YES |
| 26 | hot_upd_dt | varchar(max) | YES |
| 27 | contract_no | decimal(18,0) | YES |
| 28 | pre_resv_no | decimal(18,0) | YES |
| 29 | close_yn | varchar(max) | YES |
| 30 | close_dt | varchar(max) | YES |
| 31 | use_yn | varchar(max) | YES |
| 32 | reg_dt | varchar(max) | YES |
| 33 | upd_dt | varchar(max) | YES |
| 34 | mask_yn | varchar(max) | YES |
| 35 | family_seq | decimal(18,0) | YES |
| 36 | ci | varchar(max) | YES |
| 37 | oneid_key | decimal(18,0) | YES |
| 38 | ELT_TIMESTAMP | varchar(100) | YES |
| 39 | BRAND | varchar(20) | YES |

#### dbo.CRM_LEAD_HIST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | hist_seq | decimal(18,0) | YES |
| 2 | lead_id | decimal(18,0) | YES |
| 3 | act_tp | varchar(max) | YES |
| 4 | potential | varchar(max) | YES |
| 5 | repurc_yn | varchar(max) | YES |
| 6 | bookmark_yn | varchar(max) | YES |
| 7 | name | varchar(max) | YES |
| 8 | cust_seq | decimal(18,0) | YES |
| 9 | int_mdl1 | varchar(max) | YES |
| 10 | int_var1 | varchar(max) | YES |
| 11 | int_my1 | varchar(max) | YES |
| 12 | int_sfx1 | varchar(max) | YES |
| 13 | int_mdl2 | varchar(max) | YES |
| 14 | int_var2 | varchar(max) | YES |
| 15 | int_my2 | varchar(max) | YES |
| 16 | int_sfx2 | varchar(max) | YES |
| 17 | purc_pnt | varchar(max) | YES |
| 18 | pay_tp | varchar(max) | YES |
| 19 | own_brd | varchar(max) | YES |
| 20 | own_mdl | varchar(max) | YES |
| 21 | memo | varchar(max) | YES |
| 22 | hot_upd_dt | varchar(max) | YES |
| 23 | contract_no | decimal(18,0) | YES |
| 24 | pre_resv_no | decimal(18,0) | YES |
| 25 | close_yn | varchar(max) | YES |
| 26 | close_dt | varchar(max) | YES |
| 27 | sys_gb | varchar(max) | YES |
| 28 | use_yn | varchar(max) | YES |
| 29 | reg_dt | varchar(max) | YES |
| 30 | hist_reg_dt | varchar(max) | YES |
| 31 | ELT_TIMESTAMP | varchar(100) | YES |
| 32 | BRAND | varchar(20) | YES |

#### dbo.CRM_LEAD_OWNER  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | lead_owner_id | decimal(18,0) | YES |
| 2 | lead_id | decimal(18,0) | YES |
| 3 | owner_tp | varchar(max) | YES |
| 4 | pers_nm | varchar(max) | YES |
| 5 | pers_hp_no | varchar(max) | YES |
| 6 | pers_cust_seq | decimal(18,0) | YES |
| 7 | pers_gender | varchar(max) | YES |
| 8 | pers_age | varchar(max) | YES |
| 9 | corp_nm | varchar(max) | YES |
| 10 | corp_hp_no | varchar(max) | YES |
| 11 | corp_cust_seq | decimal(18,0) | YES |
| 12 | corp_email | varchar(max) | YES |
| 13 | corp_gender | varchar(max) | YES |
| 14 | corp_age | varchar(max) | YES |
| 15 | use_yn | varchar(max) | YES |
| 16 | reg_dt | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | ELT_TIMESTAMP | varchar(100) | YES |
| 19 | BRAND | varchar(20) | YES |

#### dbo.CRM_TARGET

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | target_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_id | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | ym | varchar(max) | YES |
| 7 | sc_id | varchar(max) | YES |
| 8 | close_yn | varchar(max) | YES |
| 9 | close_dt | varchar(max) | YES |
| 10 | use_yn | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | save_yn | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.CRM_TARGET_D  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | day_seq | decimal(18,0) | YES |
| 2 | mon_seq | decimal(18,0) | YES |
| 3 | target_seq | decimal(18,0) | YES |
| 4 | dealer_id | varchar(max) | YES |
| 5 | sc_id | varchar(max) | YES |
| 6 | code | varchar(max) | YES |
| 7 | day | varchar(max) | YES |
| 8 | target_cnt | int | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | ELT_TIMESTAMP | varchar(100) | YES |
| 13 | BRAND | varchar(20) | YES |

#### dbo.CRM_TARGET_M  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | mon_seq | decimal(18,0) | YES |
| 2 | target_seq | decimal(18,0) | YES |
| 3 | code | varchar(max) | YES |
| 4 | target_cnt | int | YES |
| 5 | target_rate | decimal(18,0) | YES |
| 6 | pt_cust_cnt | int | YES |
| 7 | target_multi | decimal(18,0) | YES |
| 8 | use_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | upd_dt | varchar(max) | YES |
| 11 | ELT_TIMESTAMP | varchar(100) | YES |
| 12 | BRAND | varchar(20) | YES |

#### dbo.CU_BASE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(18,0) | YES |
| 2 | cust_nm | varchar(max) | YES |
| 3 | taxpay_no | varchar(max) | YES |
| 4 | cust_type | varchar(max) | YES |
| 5 | dealer_id | varchar(max) | YES |
| 6 | mng_sc_id | varchar(max) | YES |
| 7 | sale_sc_id | varchar(max) | YES |
| 8 | mng_tech_id | varchar(max) | YES |
| 9 | zip_reg | varchar(max) | YES |
| 10 | addr_reg | varchar(max) | YES |
| 11 | addr_no_reg | varchar(max) | YES |
| 12 | zip_fact | varchar(max) | YES |
| 13 | addr_fact | varchar(max) | YES |
| 14 | addr_no_fact | varchar(max) | YES |
| 15 | tel_area | varchar(max) | YES |
| 16 | tel_no | varchar(max) | YES |
| 17 | fax_area | varchar(max) | YES |
| 18 | fax_no | varchar(max) | YES |
| 19 | email | varchar(max) | YES |
| 20 | email_domain | varchar(max) | YES |
| 21 | hp_area | varchar(max) | YES |
| 22 | hp_no | varchar(max) | YES |
| 23 | job_cd | varchar(max) | YES |
| 24 | job_detail | varchar(max) | YES |
| 25 | office_nm | varchar(max) | YES |
| 26 | dept_nm | varchar(max) | YES |
| 27 | posi_nm | varchar(max) | YES |
| 28 | zip_office | varchar(max) | YES |
| 29 | addr_office | varchar(max) | YES |
| 30 | rel_type | varchar(max) | YES |
| 31 | addr_no_office | varchar(max) | YES |
| 32 | office_tel_area | varchar(max) | YES |
| 33 | office_tel_no | varchar(max) | YES |
| 34 | rel_cust_seq | decimal(18,0) | YES |
| 35 | biz_cond_nm | varchar(max) | YES |
| 36 | biz_type_nm | varchar(max) | YES |
| 37 | chief_id | varchar(max) | YES |
| 38 | chief_nm | varchar(max) | YES |
| 39 | company_type | varchar(max) | YES |
| 40 | dm_place_cd | varchar(max) | YES |
| 41 | dm_name | varchar(max) | YES |
| 42 | sms_receive_yn | varchar(max) | YES |
| 43 | dm_receive_yn | varchar(max) | YES |
| 44 | dm_return_yn | varchar(max) | YES |
| 45 | email_return_yn | varchar(max) | YES |
| 46 | email_receive_yn | varchar(max) | YES |
| 47 | disuse_yn | varchar(max) | YES |
| 48 | disuse_cd | varchar(max) | YES |
| 49 | reg_dt | varchar(max) | YES |
| 50 | deli_yn | varchar(max) | YES |
| 51 | reg_user_id | varchar(max) | YES |
| 52 | bef_crm_seq | decimal(18,0) | YES |
| 53 | upd_dt | varchar(max) | YES |
| 54 | sc_grp_seq | decimal(18,0) | YES |
| 55 | upd_user_id | varchar(max) | YES |
| 56 | cust_knd | varchar(max) | YES |
| 57 | dealer_grp_seq | decimal(18,0) | YES |
| 58 | city | varchar(max) | YES |
| 59 | gu | varchar(max) | YES |
| 60 | dong | varchar(max) | YES |
| 61 | dam_nm | varchar(max) | YES |
| 62 | dm_receive_cust | varchar(max) | YES |
| 63 | reg_shop_cd | varchar(max) | YES |
| 64 | last_contact_date | varchar(max) | YES |
| 65 | tr_zip_reg | varchar(max) | YES |
| 66 | tr_addr_reg | varchar(max) | YES |
| 67 | tr_addr_no_reg | varchar(max) | YES |
| 68 | tr_addr_reg_flag | varchar(max) | YES |
| 69 | tr_addr_reg_insert_flag | varchar(max) | YES |
| 70 | tr_addr_reg_bld_no | varchar(max) | YES |
| 71 | tr_addr_reg_result | varchar(max) | YES |
| 72 | tr_zip_fact | varchar(max) | YES |
| 73 | tr_addr_fact | varchar(max) | YES |
| 74 | tr_addr_no_fact | varchar(max) | YES |
| 75 | tr_addr_fact_flag | varchar(max) | YES |
| 76 | tr_addr_fact_insert_flag | varchar(max) | YES |
| 77 | tr_addr_fact_bld_no | varchar(max) | YES |
| 78 | tr_addr_fact_result | varchar(max) | YES |
| 79 | tr_zip_office | varchar(max) | YES |
| 80 | tr_addr_office | varchar(max) | YES |
| 81 | tr_addr_no_office | varchar(max) | YES |
| 82 | tr_addr_office_flag | varchar(max) | YES |
| 83 | tr_addr_office_insert_flag | varchar(max) | YES |
| 84 | tr_addr_office_bld_no | varchar(max) | YES |
| 85 | tr_addr_office_result | varchar(max) | YES |
| 86 | reg_addr_loc_x | varchar(max) | YES |
| 87 | reg_addr_loc_y | varchar(max) | YES |
| 88 | result | varchar(max) | YES |
| 89 | corp_no | varchar(max) | YES |
| 90 | office_fax_area | varchar(max) | YES |
| 91 | office_fax_no | varchar(max) | YES |
| 92 | u_car_cust_type | varchar(max) | YES |
| 93 | ecrb_act_yn | varchar(max) | YES |
| 94 | dz_vendor_site_id | varchar(max) | YES |
| 95 | app_flag | varchar(max) | YES |
| 96 | ci_seq | decimal(18,0) | YES |
| 97 | consign_sales_flag | varchar(max) | YES |
| 98 | del_dt | varchar(max) | YES |
| 99 | del_user_id | varchar(max) | YES |
| 100 | del_type | varchar(max) | YES |
| 101 | cust_ci | varchar(max) | YES |
| 102 | ci_reg_dt | varchar(max) | YES |
| 103 | ci_upd_dt | varchar(max) | YES |
| 104 | ci_remark | varchar(max) | YES |
| 105 | realnm_seq | decimal(18,0) | YES |
| 106 | oneid_key | decimal(18,0) | YES |
| 107 | concern_degree | varchar(max) | YES |
| 108 | taxpay_no_ymd | decimal(18,0) | YES |
| 109 | taxpay_no_g | decimal(18,0) | YES |
| 110 | ELT_TIMESTAMP | varchar(100) | YES |
| 111 | BRAND | varchar(20) | YES |

#### dbo.CU_DETAIL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | birth_dt | varchar(max) | YES |
| 4 | mng_sc_id | varchar(max) | YES |
| 5 | marry_yn | varchar(max) | YES |
| 6 | luso_type | varchar(max) | YES |
| 7 | sex_cd | varchar(max) | YES |
| 8 | cr_yn | varchar(max) | YES |
| 9 | cr_change_dt | varchar(max) | YES |
| 10 | marry_dt | varchar(max) | YES |
| 11 | mng_change_dt | varchar(max) | YES |
| 12 | cr_type | varchar(max) | YES |
| 13 | hold_dt | varchar(max) | YES |
| 14 | intro_cust_seq | decimal(18,0) | YES |
| 15 | hobby_cd1 | varchar(max) | YES |
| 16 | intro_type | varchar(max) | YES |
| 17 | rememb_dt | varchar(max) | YES |
| 18 | rememb_dt_desc | varchar(max) | YES |
| 19 | hobby_cd2 | varchar(max) | YES |
| 20 | remark | varchar(max) | YES |
| 21 | concern_mdl1 | varchar(max) | YES |
| 22 | hobby_etc | varchar(max) | YES |
| 23 | concern_mdl2 | varchar(max) | YES |
| 24 | hold_type | varchar(max) | YES |
| 25 | mng_type | varchar(max) | YES |
| 26 | ows_cb_yn | varchar(max) | YES |
| 27 | ows_dt | varchar(max) | YES |
| 28 | group_cd1 | varchar(max) | YES |
| 29 | group_cd2 | varchar(max) | YES |
| 30 | group_etc | varchar(max) | YES |
| 31 | concern_mdl3 | varchar(max) | YES |
| 32 | bef_mng_sc_id | varchar(max) | YES |
| 33 | reg_dt | varchar(max) | YES |
| 34 | reg_user_id | varchar(max) | YES |
| 35 | upd_dt | varchar(max) | YES |
| 36 | upd_user_id | varchar(max) | YES |
| 37 | cr_sub_type | varchar(max) | YES |
| 38 | reg_shop_cd | varchar(max) | YES |
| 39 | cr_3rd_type | varchar(max) | YES |
| 40 | cust_pic_path | varchar(max) | YES |
| 41 | cust_pic_nm | varchar(max) | YES |
| 42 | cust_act_type1 | varchar(max) | YES |
| 43 | cust_act_type2 | varchar(max) | YES |
| 44 | favor_drink1 | varchar(max) | YES |
| 45 | favor_drink2 | varchar(max) | YES |
| 46 | hobby_cd_partner | varchar(max) | YES |
| 47 | home_town | varchar(max) | YES |
| 48 | cust_holiday | varchar(max) | YES |
| 49 | favor_tel_area | varchar(max) | YES |
| 50 | favor_tel_no | varchar(max) | YES |
| 51 | prev_hold_type | varchar(max) | YES |
| 52 | age_cd | varchar(max) | YES |
| 53 | child_cnt | varchar(max) | YES |
| 54 | prev_brand | varchar(max) | YES |
| 55 | prev_mdl | varchar(max) | YES |
| 56 | ELT_TIMESTAMP | varchar(100) | YES |
| 57 | BRAND | varchar(20) | YES |

#### dbo.IF_AR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | interface_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | company_code | varchar(max) | YES |
| 4 | org_id | varchar(max) | YES |
| 5 | location_id | varchar(max) | YES |
| 6 | dealer_id | varchar(max) | YES |
| 7 | module | varchar(max) | YES |
| 8 | trx_type | varchar(max) | YES |
| 9 | trx_flag | varchar(max) | YES |
| 10 | line_attribute1 | varchar(max) | YES |
| 11 | line_attribute2 | varchar(max) | YES |
| 12 | line_attribute3 | varchar(max) | YES |
| 13 | line_desc | varchar(max) | YES |
| 14 | org_person_flag | varchar(max) | YES |
| 15 | client_org_id | varchar(max) | YES |
| 16 | client_location_id | varchar(max) | YES |
| 17 | client_dealer_id | varchar(max) | YES |
| 18 | cust_seq | varchar(max) | YES |
| 19 | comp_seq | varchar(max) | YES |
| 20 | registration_num | varchar(max) | YES |
| 21 | currency_code | varchar(max) | YES |
| 22 | conversion_date | varchar(max) | YES |
| 23 | conversion_type | varchar(max) | YES |
| 24 | conversion_rate | varchar(max) | YES |
| 25 | trx_date | varchar(max) | YES |
| 26 | gl_date | varchar(max) | YES |
| 27 | term_id | varchar(max) | YES |
| 28 | quantity | decimal(18,0) | YES |
| 29 | unit_selling_price | decimal(18,0) | YES |
| 30 | amount | decimal(18,0) | YES |
| 31 | vat_tax_id | varchar(max) | YES |
| 32 | vat_amount | decimal(18,0) | YES |
| 33 | vat_tax_count | varchar(max) | YES |
| 34 | salesrep_num | varchar(max) | YES |
| 35 | segment5 | varchar(max) | YES |
| 36 | status | varchar(max) | YES |
| 37 | error_code | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | client_name | varchar(max) | YES |
| 43 | invoice_amount | varchar(max) | YES |
| 44 | surtax_itemname1 | varchar(max) | YES |
| 45 | transaction_type_code | varchar(max) | YES |
| 46 | transaction_type_data | varchar(max) | YES |
| 47 | transaction_sub_type_code | varchar(max) | YES |
| 48 | transaction_sub_type_data | varchar(max) | YES |
| 49 | sob_id | varchar(max) | YES |
| 50 | amount_gl | varchar(max) | YES |
| 51 | lookup_nm | varchar(max) | YES |
| 52 | trans_yn | varchar(max) | YES |
| 53 | status_comp | varchar(max) | YES |
| 54 | interface_dt | varchar(max) | YES |
| 55 | trx_group | varchar(max) | YES |
| 56 | del_flag | varchar(max) | YES |
| 57 | dms_trx_id | varchar(max) | YES |
| 58 | org_shop_cd | varchar(max) | YES |
| 59 | memo | varchar(max) | YES |
| 60 | interface_id_acnt | varchar(max) | YES |
| 61 | sfx_cd | varchar(max) | YES |
| 62 | biz_reg_no | varchar(max) | YES |
| 63 | process_id | varchar(max) | YES |
| 64 | tyt_interface_h_id | varchar(max) | YES |
| 65 | legacy_confirm_status | varchar(max) | YES |
| 66 | dz_pc_cd | varchar(max) | YES |
| 67 | dz_comp_cd | varchar(max) | YES |
| 68 | dz_bizarea_cd | varchar(max) | YES |
| 69 | dz_wdept_cd | varchar(max) | YES |
| 70 | dz_write_id | varchar(max) | YES |
| 71 | prod_loc | varchar(max) | YES |
| 72 | dz_docu_no | varchar(max) | YES |
| 73 | vin | varchar(max) | YES |
| 74 | dz_tax_status | varchar(max) | YES |
| 75 | dz_tax_sum_no | varchar(max) | YES |
| 76 | dz_tax_docu_no | varchar(max) | YES |
| 77 | dz_tax_sum_dt | varchar(max) | YES |
| 78 | dz_tax_docu_dt | varchar(max) | YES |
| 79 | dz_cc_cd | varchar(max) | YES |
| 80 | pre_rcpt_yn | varchar(max) | YES |
| 81 | if_confirm_status | varchar(max) | YES |
| 82 | family_seq | varchar(max) | YES |
| 83 | ELT_TIMESTAMP | varchar(100) | YES |
| 84 | BRAND | varchar(20) | YES |

#### dbo.OM_CONTRACT  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(18,0) | YES | 계약번호 |
| 2 | dlr_contract_no | varchar(max) | YES | 번호 |
| 3 | contract_dt | varchar(max) | YES | 계약일 |
| 4 | contract_stat_cd | varchar(max) | YES | 계약 |
| 5 | sold_yn | varchar(max) | YES | 여부(Y/N) |
| 6 | urgent_yn | varchar(max) | YES | 여부(Y/N) |
| 7 | allocation_yn | varchar(max) | YES | 여부(Y/N) |
| 8 | status_mod_dt | varchar(max) | YES | 수정일 |
| 9 | cond_mod_yn | varchar(max) | YES | 여부(Y/N) |
| 10 | dealer_id | varchar(max) | YES | 딜러 ID |
| 11 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 12 | user_id | varchar(max) | YES | 사용자 ID(SC) |
| 13 | owner_type | varchar(max) | YES | 유형코드 |
| 14 | cust_seq | decimal(18,0) | YES | 고객 |
| 15 | comp_seq | decimal(18,0) | YES | 순번 |
| 16 | real_cust_seq | decimal(18,0) | YES | 고객 |
| 17 | owner_seq | decimal(18,0) | YES | 순번 |
| 18 | customs_seq | decimal(18,0) | YES | 고객 |
| 19 | brand_cd | varchar(max) | YES | 브랜드 |
| 20 | model_cd | varchar(max) | YES | 모델 코드 |
| 21 | variant_cd | varchar(max) | YES | 바리에이션 |
| 22 | my_cd | varchar(max) | YES | 코드 |
| 23 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 24 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 25 | option_cd | varchar(max) | YES | 코드 |
| 26 | option_cd2 | varchar(max) | YES |  |
| 27 | option_cd3 | varchar(max) | YES |  |
| 28 | option_cd4 | varchar(max) | YES |  |
| 29 | vin | varchar(max) | YES | 차대번호(VIN) |
| 30 | vehic_magic | decimal(18,0) | YES | 차량 |
| 31 | vehic_price | decimal(18,0) | YES | 차량가격 |
| 32 | vehic_vat | decimal(18,0) | YES | 차량 |
| 33 | vehic_option_price | decimal(18,0) | YES | 차량가격 |
| 34 | vehic_color_price | decimal(18,0) | YES | 색상 |
| 35 | vehic_discount_amt | decimal(18,0) | YES | 차량 |
| 36 | vehic_total_amt | decimal(18,0) | YES | 차량 |
| 37 | deposit_amt | decimal(18,0) | YES | 계약금 |
| 38 | sales_type | varchar(max) | YES | 판매 |
| 39 | pay_type | varchar(max) | YES | 유형코드 |
| 40 | tax_type | decimal(18,0) | YES | 유형코드 |
| 41 | lease_comp_seq | decimal(18,0) | YES | 순번 |
| 42 | reg_free_yn | varchar(max) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(max) | YES | 재고 |
| 44 | reg_stock_rate | decimal(18,0) | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(max) | YES | 재고 |
| 46 | reg_agency_yn | varchar(max) | YES | 등록 |
| 47 | reg_tax | decimal(18,0) | YES | 등록 |
| 48 | reg_stock_price | decimal(18,0) | YES | 가격 |
| 49 | reg_stamp_price | decimal(18,0) | YES | 가격 |
| 50 | reg_plate_price | decimal(18,0) | YES | 가격 |
| 51 | reg_fee | decimal(18,0) | YES | 등록 |
| 52 | reg_aquisition_tax | decimal(18,0) | YES | 등록 |
| 53 | reg_special_tax | decimal(18,0) | YES | 등록 |
| 54 | reg_education_tax | decimal(18,0) | YES | 등록 |
| 55 | reg_total_amt | decimal(18,0) | YES | 총 금액 |
| 56 | take_contract_amt | decimal(18,0) | YES | 금액 |
| 57 | take_delivery_amt | decimal(18,0) | YES | 금액 |
| 58 | lease_month_amt | decimal(18,0) | YES | 금액 |
| 59 | lease_term_dt | varchar(max) | YES | 일자 |
| 60 | lease_rate | decimal(18,0) | YES |  |
| 61 | take_depositer_nm | varchar(max) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(max) | YES | 계약금 |
| 63 | side_stamp_price | decimal(18,0) | YES | 가격 |
| 64 | side_setup_amt | decimal(18,0) | YES | 금액 |
| 65 | side_fee | decimal(18,0) | YES |  |
| 66 | side_total_amt | decimal(18,0) | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(max) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(max) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(max) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(max) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(max) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(max) | YES | 출고 |
| 73 | request_by | varchar(max) | YES |  |
| 74 | request_dt | varchar(max) | YES | 일자 |
| 75 | approval_by | varchar(max) | YES |  |
| 76 | approval_dt | varchar(max) | YES | 일자 |
| 77 | cancel_by | varchar(max) | YES | 취소 |
| 78 | cancel_dt | varchar(max) | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(max) | YES | 판매 |
| 80 | last_issued_dt | varchar(max) | YES | 일자 |
| 81 | last_mod_dt | varchar(max) | YES | 수정일 |
| 82 | delivery_request_by | varchar(max) | YES | 출고 |
| 83 | delivery_request_dt | varchar(max) | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(max) | YES | 출고 |
| 85 | delivery_cancel_dt | varchar(max) | YES | 출고일 |
| 86 | delivery_plan_by | varchar(max) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(max) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(max) | YES | 출고 |
| 89 | delivery_approval_dt | varchar(max) | YES | 출고일 |
| 90 | reg_plan_dt | varchar(max) | YES | 등록일 |
| 91 | contract_msg | varchar(max) | YES | 계약 |
| 92 | vehic_reg_no | varchar(max) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(max) | YES | 차량 |
| 94 | dept_cd | varchar(max) | YES | 코드 |
| 95 | boc_except_dt | varchar(max) | YES | 일자 |
| 96 | reg_dt | varchar(max) | YES | 등록일 |
| 97 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 98 | upd_dt | varchar(max) | YES | 수정일 |
| 99 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(max) | YES | 여부(Y/N) |
| 101 | allocation_dt | varchar(max) | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(max) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(max) | YES | 고객 |
| 104 | rs_cust_addr | varchar(max) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(max) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(max) | YES |  |
| 107 | rs_geo_loc_y | varchar(max) | YES |  |
| 108 | potential_division | varchar(max) | YES |  |
| 109 | org_followup_id | decimal(18,0) | YES | 식별자(ID) |
| 110 | plate_size | varchar(max) | YES |  |
| 111 | receiver_apply_yn | varchar(max) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(max) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(max) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(max) | YES | 번호 |
| 115 | receiver_ssn | varchar(max) | YES |  |
| 116 | pma_yn | varchar(max) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(max) | YES | 고객번호 |
| 118 | family_seq | decimal(18,0) | YES | 순번 |
| 119 | lemon_yn | varchar(max) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(max) | YES |  |
| 121 | app_flag | varchar(max) | YES |  |
| 122 | consign_sales_flag | varchar(max) | YES | 판매 |
| 123 | contract_msg_kr | varchar(max) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(max) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(max) | YES | 고객 |
| 126 | realnm_seq | decimal(18,0) | YES | 순번 |
| 127 | tax_biz_no | varchar(max) | YES | 번호 |
| 128 | pma_city | varchar(max) | YES | 시 |
| 129 | pma_gu | varchar(max) | YES | 구 |
| 130 | taxpay_no_ymd | decimal(18,0) | YES |  |
| 131 | taxpay_no_g | decimal(18,0) | YES |  |
| 132 | flood_yn | varchar(max) | YES | 여부(Y/N) |
| 133 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 134 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.OM_CONTRACT_KTWS  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(18,0) | YES | 계약번호 |
| 2 | dlr_contract_no | varchar(max) | YES | 번호 |
| 3 | contract_dt | varchar(max) | YES | 계약일 |
| 4 | contract_stat_cd | varchar(max) | YES | 계약 |
| 5 | sold_yn | varchar(max) | YES | 여부(Y/N) |
| 6 | urgent_yn | varchar(max) | YES | 여부(Y/N) |
| 7 | allocation_yn | varchar(max) | YES | 여부(Y/N) |
| 8 | status_mod_dt | varchar(max) | YES | 수정일 |
| 9 | cond_mod_yn | varchar(max) | YES | 여부(Y/N) |
| 10 | dealer_id | varchar(max) | YES | 딜러 ID |
| 11 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 12 | user_id | varchar(max) | YES | 사용자 ID(SC) |
| 13 | owner_type | varchar(max) | YES | 유형코드 |
| 14 | cust_seq | decimal(18,0) | YES | 고객 |
| 15 | comp_seq | decimal(18,0) | YES | 순번 |
| 16 | real_cust_seq | decimal(18,0) | YES | 고객 |
| 17 | owner_seq | decimal(18,0) | YES | 순번 |
| 18 | customs_seq | decimal(18,0) | YES | 고객 |
| 19 | brand_cd | varchar(max) | YES | 브랜드 |
| 20 | model_cd | varchar(max) | YES | 모델 코드 |
| 21 | variant_cd | varchar(max) | YES | 바리에이션 |
| 22 | my_cd | varchar(max) | YES | 코드 |
| 23 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 24 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 25 | option_cd | varchar(max) | YES | 코드 |
| 26 | option_cd2 | varchar(max) | YES |  |
| 27 | option_cd3 | varchar(max) | YES |  |
| 28 | option_cd4 | varchar(max) | YES |  |
| 29 | vin | varchar(max) | YES | 차대번호(VIN) |
| 30 | vehic_magic | decimal(18,0) | YES | 차량 |
| 31 | vehic_price | decimal(18,0) | YES | 차량가격 |
| 32 | vehic_vat | decimal(18,0) | YES | 차량 |
| 33 | vehic_option_price | decimal(18,0) | YES | 차량가격 |
| 34 | vehic_color_price | decimal(18,0) | YES | 색상 |
| 35 | vehic_discount_amt | decimal(18,0) | YES | 차량 |
| 36 | vehic_total_amt | decimal(18,0) | YES | 차량 |
| 37 | deposit_amt | decimal(18,0) | YES | 계약금 |
| 38 | sales_type | varchar(max) | YES | 판매 |
| 39 | pay_type | varchar(max) | YES | 유형코드 |
| 40 | tax_type | decimal(18,0) | YES | 유형코드 |
| 41 | lease_comp_seq | decimal(18,0) | YES | 순번 |
| 42 | reg_free_yn | varchar(max) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(max) | YES | 재고 |
| 44 | reg_stock_rate | decimal(18,0) | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(max) | YES | 재고 |
| 46 | reg_agency_yn | varchar(max) | YES | 등록 |
| 47 | reg_tax | decimal(18,0) | YES | 등록 |
| 48 | reg_stock_price | decimal(18,0) | YES | 가격 |
| 49 | reg_stamp_price | decimal(18,0) | YES | 가격 |
| 50 | reg_plate_price | decimal(18,0) | YES | 가격 |
| 51 | reg_fee | decimal(18,0) | YES | 등록 |
| 52 | reg_aquisition_tax | decimal(18,0) | YES | 등록 |
| 53 | reg_special_tax | decimal(18,0) | YES | 등록 |
| 54 | reg_education_tax | decimal(18,0) | YES | 등록 |
| 55 | reg_total_amt | decimal(18,0) | YES | 총 금액 |
| 56 | take_contract_amt | decimal(18,0) | YES | 금액 |
| 57 | take_delivery_amt | decimal(18,0) | YES | 금액 |
| 58 | lease_month_amt | decimal(18,0) | YES | 금액 |
| 59 | lease_term_dt | varchar(max) | YES | 일자 |
| 60 | lease_rate | decimal(18,0) | YES |  |
| 61 | take_depositer_nm | varchar(max) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(max) | YES | 계약금 |
| 63 | side_stamp_price | decimal(18,0) | YES | 가격 |
| 64 | side_setup_amt | decimal(18,0) | YES | 금액 |
| 65 | side_fee | decimal(18,0) | YES |  |
| 66 | side_total_amt | decimal(18,0) | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(max) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(max) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(max) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(max) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(max) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(max) | YES | 출고 |
| 73 | request_by | varchar(max) | YES |  |
| 74 | request_dt | varchar(max) | YES | 일자 |
| 75 | approval_by | varchar(max) | YES |  |
| 76 | approval_dt | varchar(max) | YES | 일자 |
| 77 | cancel_by | varchar(max) | YES | 취소 |
| 78 | cancel_dt | varchar(max) | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(max) | YES | 판매 |
| 80 | last_issued_dt | varchar(max) | YES | 일자 |
| 81 | last_mod_dt | varchar(max) | YES | 수정일 |
| 82 | delivery_request_by | varchar(max) | YES | 출고 |
| 83 | delivery_request_dt | varchar(max) | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(max) | YES | 출고 |
| 85 | delivery_cancel_dt | varchar(max) | YES | 출고일 |
| 86 | delivery_plan_by | varchar(max) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(max) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(max) | YES | 출고 |
| 89 | delivery_approval_dt | varchar(max) | YES | 출고일 |
| 90 | reg_plan_dt | varchar(max) | YES | 등록일 |
| 91 | contract_msg | varchar(max) | YES | 계약 |
| 92 | vehic_reg_no | varchar(max) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(max) | YES | 차량 |
| 94 | dept_cd | varchar(max) | YES | 코드 |
| 95 | boc_except_dt | varchar(max) | YES | 일자 |
| 96 | reg_dt | varchar(max) | YES | 등록일 |
| 97 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 98 | upd_dt | varchar(max) | YES | 수정일 |
| 99 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(max) | YES | 여부(Y/N) |
| 101 | allocation_dt | varchar(max) | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(max) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(max) | YES | 고객 |
| 104 | rs_cust_addr | varchar(max) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(max) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(max) | YES |  |
| 107 | rs_geo_loc_y | varchar(max) | YES |  |
| 108 | potential_division | varchar(max) | YES |  |
| 109 | org_followup_id | decimal(18,0) | YES | 식별자(ID) |
| 110 | plate_size | varchar(max) | YES |  |
| 111 | receiver_apply_yn | varchar(max) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(max) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(max) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(max) | YES | 번호 |
| 115 | receiver_ssn | varchar(max) | YES |  |
| 116 | pma_yn | varchar(max) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(max) | YES | 고객번호 |
| 118 | family_seq | decimal(18,0) | YES | 순번 |
| 119 | lemon_yn | varchar(max) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(max) | YES |  |
| 121 | app_flag | varchar(max) | YES |  |
| 122 | consign_sales_flag | varchar(max) | YES | 판매 |
| 123 | contract_msg_kr | varchar(max) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(max) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(max) | YES | 고객 |
| 126 | realnm_seq | decimal(18,0) | YES | 순번 |
| 127 | tax_biz_no | varchar(max) | YES | 번호 |
| 128 | pma_city | varchar(max) | YES | 시 |
| 129 | pma_gu | varchar(max) | YES | 구 |
| 130 | taxpay_no_ymd | decimal(18,0) | YES |  |
| 131 | taxpay_no_g | decimal(18,0) | YES |  |
| 132 | flood_yn | varchar(max) | YES | 여부(Y/N) |
| 133 | lead_id | decimal(18,0) | YES | 식별자(ID) |
| 134 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 135 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_BARC_SORT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | case_no | varchar(max) | YES |
| 3 | start_dt_unload | varchar(max) | YES |
| 4 | end_dt_unload | varchar(max) | YES |
| 5 | start_dt_sort | varchar(max) | YES |
| 6 | end_dt_sort | varchar(max) | YES |
| 7 | stat | varchar(max) | YES |
| 8 | token_unload | varchar(max) | YES |
| 9 | token_sort | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.PT_ORDER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | order_no | varchar(max) | YES | 주문번호 |
| 3 | order_dt | varchar(max) | YES | 주문 |
| 4 | sply_dealer_id | varchar(max) | YES | 딜러 ID |
| 5 | splr_cd | varchar(max) | YES | 코드 |
| 6 | order_type | varchar(max) | YES | 주문 |
| 7 | order_kind | varchar(max) | YES | 주문 |
| 8 | order_stat | varchar(max) | YES | 주문 |
| 9 | order_pay_type | varchar(max) | YES | 주문 |
| 10 | order_tran_type | varchar(max) | YES | 주문 |
| 11 | order_use | varchar(max) | YES | 주문 |
| 12 | local_yn | varchar(max) | YES | 여부(Y/N) |
| 13 | bo_yn | varchar(max) | YES | 여부(Y/N) |
| 14 | allo_yn | varchar(max) | YES | 여부(Y/N) |
| 15 | cncl_yn | varchar(max) | YES | 여부(Y/N) |
| 16 | ro_no | varchar(max) | YES | 번호 |
| 17 | vin | varchar(max) | YES | 차대번호(VIN) |
| 18 | cter_man | varchar(max) | YES |  |
| 19 | remark | varchar(max) | YES |  |
| 20 | order_cnfm_dt | varchar(max) | YES | 주문 |
| 21 | order_hold_dt | varchar(max) | YES | 주문 |
| 22 | order_close_dt | varchar(max) | YES | 주문 |
| 23 | order_dele_dt | varchar(max) | YES | 주문 |
| 24 | quot_no | varchar(max) | YES | 번호 |
| 25 | resv_no | varchar(max) | YES | 번호 |
| 26 | cust_no | varchar(max) | YES | 고객번호 |
| 27 | cust_seq | bigint | YES | 고객 |
| 28 | comp_seq | bigint | YES | 순번 |
| 29 | tmkr_remark | varchar(max) | YES |  |
| 30 | tmkr_modi_yn | varchar(max) | YES | 여부(Y/N) |
| 31 | staff_id | varchar(max) | YES | 직원 |
| 32 | key_no | varchar(max) | YES | 번호 |
| 33 | other_yn | varchar(max) | YES | 여부(Y/N) |
| 34 | vehic_no1 | varchar(max) | YES | 차량 |
| 35 | vehic_no2 | varchar(max) | YES | 차량 |
| 36 | vor_type | varchar(max) | YES | 유형코드 |
| 37 | dealer_id | varchar(max) | YES | 딜러 ID |
| 38 | reg_dt | varchar(max) | YES | 등록일 |
| 39 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 40 | upd_dt | varchar(max) | YES | 수정일 |
| 41 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 42 | pre_order_yn | varchar(max) | YES | 주문 |
| 43 | ord_code | decimal(18,0) | YES | 코드 |
| 44 | tran_ord_type | decimal(18,0) | YES | 유형코드 |
| 45 | tran_ord_mode | decimal(18,0) | YES |  |
| 46 | sout_rdy_yn | varchar(max) | YES | 여부(Y/N) |
| 47 | sout_sch_dt | varchar(max) | YES | 일자 |
| 48 | bch_end_yn | varchar(max) | YES | 여부(Y/N) |
| 49 | tran_ord_dt | varchar(max) | YES | 일자 |
| 50 | job_bch_dt | varchar(max) | YES | 일자 |
| 51 | ord_complete_dt | varchar(max) | YES | 일자 |
| 52 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 53 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_ORDER_BO  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | order_bo_seq | decimal(18,0) | YES | 주문 |
| 2 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 3 | order_dt | varchar(max) | YES | 주문 |
| 4 | order_no | varchar(max) | YES | 주문번호 |
| 5 | stat | varchar(max) | YES |  |
| 6 | air_frgt_yn | varchar(max) | YES | 여부(Y/N) |
| 7 | air_frgt_amt | bigint | YES | 금액 |
| 8 | vin | varchar(max) | YES | 차대번호(VIN) |
| 9 | tmkr_sold_vin_yn | varchar(max) | YES | 여부(Y/N) |
| 10 | cnfm_yn | varchar(max) | YES | 여부(Y/N) |
| 11 | cnfm_day | varchar(max) | YES |  |
| 12 | cnfm_man | varchar(max) | YES |  |
| 13 | dealer_id | varchar(max) | YES | 딜러 ID |
| 14 | reg_dt | varchar(max) | YES | 등록일 |
| 15 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 16 | upd_dt | varchar(max) | YES | 수정일 |
| 17 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 18 | pre_order_chk | varchar(max) | YES | 주문 |
| 19 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 20 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_ORDER_BO_DETL  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | order_bo_seq | decimal(18,0) | YES | 주문 |
| 2 | order_bo_detl_seq | int | YES | 주문 |
| 3 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 4 | order_no | varchar(max) | YES | 주문번호 |
| 5 | order_detl_line_no | int | YES | 주문번호 |
| 6 | part_no | varchar(max) | YES | 부품번호 |
| 7 | order_qty | bigint | YES | 수량 |
| 8 | bo_qty | bigint | YES | 수량 |
| 9 | order_unit | varchar(max) | YES | 주문 |
| 10 | conv_qty | bigint | YES | 수량 |
| 11 | stat | varchar(max) | YES |  |
| 12 | purc_base_tran_type | varchar(max) | YES | 유형코드 |
| 13 | purc_modi_tran_type | varchar(max) | YES | 유형코드 |
| 14 | air_only_yn | varchar(max) | YES | 여부(Y/N) |
| 15 | base_price | bigint | YES | 가격 |
| 16 | modi_price | bigint | YES | 가격 |
| 17 | retail_price | bigint | YES | 가격 |
| 18 | dc_rate_base | decimal(18,0) | YES |  |
| 19 | dc_rate_bo | decimal(18,0) | YES |  |
| 20 | extra_rate_bo | decimal(18,0) | YES |  |
| 21 | remark | varchar(max) | YES |  |
| 22 | eta | varchar(max) | YES |  |
| 23 | etd | varchar(max) | YES |  |
| 24 | etd_reg_dt | varchar(max) | YES | 등록일 |
| 25 | etd_reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 26 | etd_upd_dt | varchar(max) | YES | 수정일 |
| 27 | etd_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 28 | fix_etd | varchar(max) | YES |  |
| 29 | dealer_id | varchar(max) | YES | 딜러 ID |
| 30 | reg_dt | varchar(max) | YES | 등록일 |
| 31 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 32 | upd_dt | varchar(max) | YES | 수정일 |
| 33 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 34 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 35 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_ORDER_DETL  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | order_no | varchar(max) | YES | 주문번호 |
| 3 | line_no | int | YES | 번호 |
| 4 | order_part_no | varchar(max) | YES | 주문번호 |
| 5 | order_qty | bigint | YES | 수량 |
| 6 | order_cnfm_qty | bigint | YES | 수량 |
| 7 | allo_qty | bigint | YES | 수량 |
| 8 | bo_qty | bigint | YES | 수량 |
| 9 | pend_qty | bigint | YES | 수량 |
| 10 | sout_wait_qty | bigint | YES | 수량 |
| 11 | sout_cnfm_qty | bigint | YES | 수량 |
| 12 | order_price | bigint | YES | 가격 |
| 13 | order_unit | varchar(max) | YES | 주문 |
| 14 | conv_qty | bigint | YES | 수량 |
| 15 | order_unit_qty | bigint | YES | 수량 |
| 16 | dc_rate | decimal(18,0) | YES |  |
| 17 | extra_rate | decimal(18,0) | YES |  |
| 18 | order_amt | bigint | YES | 금액 |
| 19 | fk | varchar(max) | YES |  |
| 20 | key_no | varchar(max) | YES | 번호 |
| 21 | abno_yn | varchar(max) | YES | 여부(Y/N) |
| 22 | stat | varchar(max) | YES |  |
| 23 | cnfm_dt | varchar(max) | YES | 일자 |
| 24 | hold_dt | varchar(max) | YES | 일자 |
| 25 | close_dt | varchar(max) | YES | 일자 |
| 26 | dele_dt | varchar(max) | YES | 일자 |
| 27 | quot_no | varchar(max) | YES | 번호 |
| 28 | quot_detl_line_no | int | YES | 번호 |
| 29 | resv_no | varchar(max) | YES | 번호 |
| 30 | resv_detl_line_no | bigint | YES | 번호 |
| 31 | svc_shop_cd | varchar(max) | YES | 전시장 코드 |
| 32 | svc_resv_dt | varchar(max) | YES | 일자 |
| 33 | svc_resv_seq | varchar(max) | YES | 순번 |
| 34 | svc_propo_dt | varchar(max) | YES | 일자 |
| 35 | svc_propo_seq | varchar(max) | YES | 순번 |
| 36 | svc_part_no | varchar(max) | YES | 부품번호 |
| 37 | svc_part_seq | varchar(max) | YES | 부품 |
| 38 | filter_cd | varchar(max) | YES | 코드 |
| 39 | tmkr_remark | varchar(max) | YES |  |
| 40 | bo_sout_qty | bigint | YES | 수량 |
| 41 | reg_dt | varchar(max) | YES | 등록일 |
| 42 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 43 | upd_dt | varchar(max) | YES | 수정일 |
| 44 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 45 | resv_clear_qty | decimal(18,0) | YES | 수량 |
| 46 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 47 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_PART  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(max) | YES | 부품번호 |
| 2 | part_nm | varchar(max) | YES | 부품 |
| 3 | splr_cd | varchar(max) | YES | 코드 |
| 4 | franchise_cd | varchar(max) | YES | 코드 |
| 5 | impt_cd | varchar(max) | YES | 코드 |
| 6 | prod_cd | varchar(max) | YES | 코드 |
| 7 | subs_cd_old | varchar(max) | YES |  |
| 8 | subs_part_no_old | varchar(max) | YES | 부품번호 |
| 9 | subs_cd_new | varchar(max) | YES |  |
| 10 | subs_part_no_new | varchar(max) | YES | 부품번호 |
| 11 | lk | varchar(max) | YES |  |
| 12 | stop_sale_cd | varchar(max) | YES | 판매 |
| 13 | non_re_order_cd | varchar(max) | YES | 주문 |
| 14 | pnc | varchar(max) | YES |  |
| 15 | epc_fig_no | varchar(max) | YES | 번호 |
| 16 | tariff_cd | varchar(max) | YES | 코드 |
| 17 | all_time_buy_cd | varchar(max) | YES | 코드 |
| 18 | stock_type | varchar(max) | YES | 재고 |
| 19 | prod_start_dt | varchar(max) | YES | 시작일 |
| 20 | prod_end_dt | varchar(max) | YES | 종료일 |
| 21 | rp_drct | bigint | YES |  |
| 22 | price_group_cd | varchar(max) | YES | 가격 |
| 23 | price_fmla_cd | varchar(max) | YES | 가격 |
| 24 | net_weit | decimal(18,0) | YES |  |
| 25 | prod_lot | varchar(max) | YES |  |
| 26 | case_lot | varchar(max) | YES |  |
| 27 | rack_type | varchar(max) | YES | 유형코드 |
| 28 | ideal_qty_per_box | bigint | YES | 수량 |
| 29 | no_of_used_box | bigint | YES |  |
| 30 | part_no_edit_cd | varchar(max) | YES | 부품번호 |
| 31 | tmc_non_stock_cd | varchar(max) | YES | 재고 |
| 32 | local_yn | varchar(max) | YES | 여부(Y/N) |
| 33 | cons_part_yn | varchar(max) | YES | 부품 |
| 34 | ssq_auto_yn | varchar(max) | YES | 여부(Y/N) |
| 35 | purc_unit | varchar(max) | YES |  |
| 36 | sale_unit | varchar(max) | YES | 판매 |
| 37 | conv_qty | bigint | YES | 수량 |
| 38 | order_unit_qty | bigint | YES | 수량 |
| 39 | pick_slip_unit_qty | bigint | YES | 수량 |
| 40 | bin_slip_unit_qty | bigint | YES | 수량 |
| 41 | barc_no | varchar(max) | YES | 번호 |
| 42 | wide | bigint | YES |  |
| 43 | leng | bigint | YES |  |
| 44 | heit | bigint | YES |  |
| 45 | size_type | varchar(max) | YES | 유형코드 |
| 46 | part_reg_dt | varchar(max) | YES | 부품 |
| 47 | group_cd | varchar(max) | YES | 코드 |
| 48 | use_yn | varchar(max) | YES | 여부(Y/N) |
| 49 | key_part_yn | varchar(max) | YES | 부품 |
| 50 | key_kind | varchar(max) | YES |  |
| 51 | fax_part_yn | varchar(max) | YES | 부품 |
| 52 | order_unit_auto_set_yn | varchar(max) | YES | 주문 |
| 53 | oil_purc_yn | varchar(max) | YES | 여부(Y/N) |
| 54 | unit_pack_qty | bigint | YES | 수량 |
| 55 | usage_type | varchar(max) | YES | 유형코드 |
| 56 | note | varchar(max) | YES |  |
| 57 | dealer_id | varchar(max) | YES | 딜러 ID |
| 58 | reg_dt | varchar(max) | YES | 등록일 |
| 59 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 60 | upd_dt | varchar(max) | YES | 수정일 |
| 61 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 62 | lexus_price_app_flag | varchar(max) | YES | 가격 |
| 63 | pre_order_yn | varchar(max) | YES | 주문 |
| 64 | brandship | varchar(max) | YES | 브랜드 |
| 65 | hs_code | varchar(max) | YES | 코드 |
| 66 | coo | varchar(max) | YES |  |
| 67 | first_prod_user | varchar(max) | YES |  |
| 68 | part_nm_kor | varchar(max) | YES | 부품 |
| 69 | racode | varchar(max) | YES | 코드 |
| 70 | jsp | varchar(max) | YES |  |
| 71 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 72 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.PT_POSS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | poss_seq | decimal(18,0) | YES |
| 2 | purc_no | varchar(max) | YES |
| 3 | dist_fd | varchar(max) | YES |
| 4 | lk | varchar(max) | YES |
| 5 | tran_type | varchar(max) | YES |
| 6 | bo_inst | varchar(max) | YES |
| 7 | potn_cd | varchar(max) | YES |
| 8 | potn_item_cnt | varchar(max) | YES |
| 9 | potn_qty | bigint | YES |
| 10 | potn_amt | bigint | YES |
| 11 | tmc_file_crea_dt | varchar(max) | YES |
| 12 | reg_dt | varchar(max) | YES |
| 13 | reg_user_id | varchar(max) | YES |
| 14 | upd_dt | varchar(max) | YES |
| 15 | upd_user_id | varchar(max) | YES |
| 16 | ELT_TIMESTAMP | varchar(100) | YES |
| 17 | BRAND | varchar(100) | YES |

#### dbo.PT_POSS_DETL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | poss_seq | decimal(18,0) | YES |
| 2 | line_no | int | YES |
| 3 | purc_no | varchar(max) | YES |
| 4 | purc_detl_line_no | varchar(max) | YES |
| 5 | bo_cd | varchar(max) | YES |
| 6 | ra_cd | varchar(max) | YES |
| 7 | proc_part_no | varchar(max) | YES |
| 8 | purc_part_no | varchar(max) | YES |
| 9 | proc_qty | bigint | YES |
| 10 | purc_qty | bigint | YES |
| 11 | fob | bigint | YES |
| 12 | esti_proc_dt | varchar(max) | YES |
| 13 | reg_dt | varchar(max) | YES |
| 14 | reg_user_id | varchar(max) | YES |
| 15 | upd_dt | varchar(max) | YES |
| 16 | upd_user_id | varchar(max) | YES |
| 17 | ELT_TIMESTAMP | varchar(100) | YES |
| 18 | BRAND | varchar(20) | YES |

#### dbo.PT_PURC  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_no | varchar(max) | YES |
| 2 | splr_cd | varchar(max) | YES |
| 3 | purc_shop_cd | varchar(max) | YES |
| 4 | purc_dt | varchar(max) | YES |
| 5 | purc_ask_man_cd | varchar(max) | YES |
| 6 | purc_type | varchar(max) | YES |
| 7 | tmc_purc_type | varchar(max) | YES |
| 8 | purc_tran_type | varchar(max) | YES |
| 9 | lk | varchar(max) | YES |
| 10 | bo_inst | varchar(max) | YES |
| 11 | file_send_dt | varchar(max) | YES |
| 12 | send_file_nm | varchar(max) | YES |
| 13 | stat | varchar(max) | YES |
| 14 | ship_fini_yn | varchar(max) | YES |
| 15 | impt_cd | varchar(max) | YES |
| 16 | dist_fd | varchar(max) | YES |
| 17 | real_fd | varchar(max) | YES |
| 18 | sugg_purc_yn | varchar(max) | YES |
| 19 | bo_order_yn | varchar(max) | YES |
| 20 | purc_cnfm_man | varchar(max) | YES |
| 21 | purc_cnfm_dt | varchar(max) | YES |
| 22 | air_frgt_amt | bigint | YES |
| 23 | curr | varchar(max) | YES |
| 24 | ariv_req_dt | varchar(max) | YES |
| 25 | eta_local | varchar(max) | YES |
| 26 | close_dt | varchar(max) | YES |
| 27 | close_note | varchar(max) | YES |
| 28 | close_man | varchar(max) | YES |
| 29 | tmc_proc_yn | varchar(max) | YES |
| 30 | cncl_yn | varchar(max) | YES |
| 31 | purc_sugg_no | varchar(max) | YES |
| 32 | order_bo_seq | decimal(18,0) | YES |
| 33 | purc_order_group_no | varchar(max) | YES |
| 34 | order_shop_cd | varchar(max) | YES |
| 35 | order_no | varchar(max) | YES |
| 36 | key_kind | varchar(max) | YES |
| 37 | remark | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | ELT_TIMESTAMP | varchar(100) | YES |
| 43 | BRAND | varchar(20) | YES |

#### dbo.PT_PURC_DETL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_no | varchar(max) | YES |
| 2 | line_no | int | YES |
| 3 | purc_part_no | varchar(max) | YES |
| 4 | purc_qty | bigint | YES |
| 5 | proc_qty | bigint | YES |
| 6 | ship_qty | bigint | YES |
| 7 | sin_qty | bigint | YES |
| 8 | purc_unit | varchar(max) | YES |
| 9 | conv_qty | bigint | YES |
| 10 | purc_price | decimal(18,0) | YES |
| 11 | purc_amt | decimal(18,0) | YES |
| 12 | vat_amt | decimal(18,0) | YES |
| 13 | splr_cd | varchar(max) | YES |
| 14 | ship_fini_yn | varchar(max) | YES |
| 15 | bo_clea_yn | varchar(max) | YES |
| 16 | stat | varchar(max) | YES |
| 17 | poss_potn_cd | varchar(max) | YES |
| 18 | close_dt | varchar(max) | YES |
| 19 | purc_sugg_no | varchar(max) | YES |
| 20 | purc_sugg_delt_line_no | int | YES |
| 21 | order_bo_seq | decimal(18,0) | YES |
| 22 | order_bo_detl_line_no | int | YES |
| 23 | order_shop_cd | varchar(max) | YES |
| 24 | order_no | varchar(max) | YES |
| 25 | order_line_no | decimal(18,0) | YES |
| 26 | reg_dt | varchar(max) | YES |
| 27 | reg_user_id | varchar(max) | YES |
| 28 | upd_dt | varchar(max) | YES |
| 29 | upd_user_id | varchar(max) | YES |
| 30 | ELT_TIMESTAMP | varchar(100) | YES |
| 31 | BRAND | varchar(20) | YES |

#### dbo.PT_RESV  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | resv_no | varchar(max) | YES |
| 3 | resv_dt | varchar(max) | YES |
| 4 | cust_no | varchar(max) | YES |
| 5 | cust_nm | varchar(max) | YES |
| 6 | cust_key | bigint | YES |
| 7 | comp_key | bigint | YES |
| 8 | cust_type | varchar(max) | YES |
| 9 | vin | varchar(max) | YES |
| 10 | vehic_no1 | varchar(max) | YES |
| 11 | vehic_no2 | varchar(max) | YES |
| 12 | tel_area1 | varchar(max) | YES |
| 13 | tel_no1 | varchar(max) | YES |
| 14 | tel_area2 | varchar(max) | YES |
| 15 | tel_no2 | varchar(max) | YES |
| 16 | sent_requ_yn | varchar(max) | YES |
| 17 | sent_dt | varchar(max) | YES |
| 18 | sent_place | varchar(max) | YES |
| 19 | sent_type | varchar(max) | YES |
| 20 | pay_type | varchar(max) | YES |
| 21 | prep_amt | bigint | YES |
| 22 | prep_yn | varchar(max) | YES |
| 23 | prep_pay_amt | bigint | YES |
| 24 | resv_amt | bigint | YES |
| 25 | dc_rate | decimal(18,0) | YES |
| 26 | resv_vat_amt | bigint | YES |
| 27 | rcit_amt | bigint | YES |
| 28 | rcit_dt | varchar(max) | YES |
| 29 | stat | varchar(max) | YES |
| 30 | cnfm_yn | varchar(max) | YES |
| 31 | credit_yn | varchar(max) | YES |
| 32 | order_yn | varchar(max) | YES |
| 33 | remark | varchar(max) | YES |
| 34 | acnt_link_yn | varchar(max) | YES |
| 35 | acnt_link_key | bigint | YES |
| 36 | acnt_link_dt | varchar(max) | YES |
| 37 | acnt_link_file | varchar(max) | YES |
| 38 | term_id | bigint | YES |
| 39 | tax_type | bigint | YES |
| 40 | tax_rate | decimal(18,0) | YES |
| 41 | biz_reg_no | varchar(max) | YES |
| 42 | quot_no | varchar(max) | YES |
| 43 | receipt_key | decimal(18,0) | YES |
| 44 | dealer_id | varchar(max) | YES |
| 45 | reg_dt | varchar(max) | YES |
| 46 | reg_user_id | varchar(max) | YES |
| 47 | upd_dt | varchar(max) | YES |
| 48 | upd_user_id | varchar(max) | YES |
| 49 | key_yn | varchar(max) | YES |
| 50 | order_no | varchar(max) | YES |
| 51 | refund_yn | varchar(max) | YES |
| 52 | ELT_TIMESTAMP | varchar(100) | YES |
| 53 | BRAND | varchar(20) | YES |

#### dbo.PT_SI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | purc_invo_dt | varchar(max) | YES |
| 3 | dist_fd | varchar(max) | YES |
| 4 | etd | varchar(max) | YES |
| 5 | gross_weit | decimal(18,0) | YES |
| 6 | net_weit | decimal(18,0) | YES |
| 7 | msmt | decimal(18,0) | YES |
| 8 | cntn_no | varchar(max) | YES |
| 9 | vesl_name | varchar(max) | YES |
| 10 | ship_dt | varchar(max) | YES |
| 11 | eta | varchar(max) | YES |
| 12 | ship_comp_cd | varchar(max) | YES |
| 13 | bl | varchar(max) | YES |
| 14 | fob_amt | decimal(18,0) | YES |
| 15 | frgt | varchar(max) | YES |
| 16 | insu_amt | decimal(18,0) | YES |
| 17 | curr_rate | decimal(18,0) | YES |
| 18 | curr_apply_dt | varchar(max) | YES |
| 19 | ship_shop | varchar(max) | YES |
| 20 | fina_yn | varchar(max) | YES |
| 21 | lc_apply_yn | varchar(max) | YES |
| 22 | stat | varchar(max) | YES |
| 23 | sin_prep_dt | varchar(max) | YES |
| 24 | tmc_file_crea_dt | varchar(max) | YES |
| 25 | acnt_link_yn | varchar(max) | YES |
| 26 | acnt_link_dt | varchar(max) | YES |
| 27 | acnt_link_key | bigint | YES |
| 28 | acnt_link_key2 | decimal(18,0) | YES |
| 29 | term_id | bigint | YES |
| 30 | tax_type | bigint | YES |
| 31 | tax_rate | decimal(18,0) | YES |
| 32 | local_yn | varchar(max) | YES |
| 33 | biz_reg_no | varchar(max) | YES |
| 34 | curr | varchar(max) | YES |
| 35 | frgt_amt | decimal(18,0) | YES |
| 36 | cstm_reg_yn | varchar(max) | YES |
| 37 | cstm_cnfm_yn | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | etd_temp | decimal(18,0) | YES |
| 43 | eta_temp | decimal(18,0) | YES |
| 44 | ELT_TIMESTAMP | varchar(100) | YES |
| 45 | BRAND | varchar(20) | YES |

#### dbo.PT_SIN  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sin_no | varchar(max) | YES |
| 3 | sin_dt | varchar(max) | YES |
| 4 | sin_type | varchar(max) | YES |
| 5 | sin_kind | varchar(max) | YES |
| 6 | stat | varchar(max) | YES |
| 7 | sin_fini_yn | varchar(max) | YES |
| 8 | splr_cd | varchar(max) | YES |
| 9 | acnt_link_yn | varchar(max) | YES |
| 10 | acnt_link_dt | varchar(max) | YES |
| 11 | acnt_link_file | varchar(max) | YES |
| 12 | acnt_link_key | bigint | YES |
| 13 | term_id | bigint | YES |
| 14 | tax_type | bigint | YES |
| 15 | tax_rate | decimal(18,0) | YES |
| 16 | biz_reg_no | varchar(max) | YES |
| 17 | auto_crea_yn | varchar(max) | YES |
| 18 | cncl_yn | varchar(max) | YES |
| 19 | remark | varchar(max) | YES |
| 20 | sin_cnfm_dt | varchar(max) | YES |
| 21 | sin_sply_amt | bigint | YES |
| 22 | sin_vat_amt | bigint | YES |
| 23 | pay_type | varchar(max) | YES |
| 24 | modi_yn | varchar(max) | YES |
| 25 | biz_shop_cd | varchar(max) | YES |
| 26 | biz_no | varchar(max) | YES |
| 27 | dealer_id | varchar(max) | YES |
| 28 | reg_dt | varchar(max) | YES |
| 29 | reg_user_id | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | upd_user_id | varchar(max) | YES |
| 32 | purc_invo_no | varchar(max) | YES |
| 33 | ELT_TIMESTAMP | varchar(100) | YES |
| 34 | BRAND | varchar(20) | YES |

#### dbo.PT_SIN_DETL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sin_no | varchar(max) | YES |
| 3 | line_no | int | YES |
| 4 | part_no | varchar(max) | YES |
| 5 | sin_qty | bigint | YES |
| 6 | sin_price | bigint | YES |
| 7 | sin_unit | varchar(max) | YES |
| 8 | conv_qty | bigint | YES |
| 9 | sin_amt | bigint | YES |
| 10 | sin_vat_amt | bigint | YES |
| 11 | sin_dt | varchar(max) | YES |
| 12 | sin_cnfm_qty | bigint | YES |
| 13 | sin_fini_yn | varchar(max) | YES |
| 14 | stock_price_at_sin | bigint | YES |
| 15 | stock_amt_at_sin | bigint | YES |
| 16 | sin_man | varchar(max) | YES |
| 17 | stat | varchar(max) | YES |
| 18 | sin_start_day | varchar(max) | YES |
| 19 | sin_end_day | varchar(max) | YES |
| 20 | splr_cd | varchar(max) | YES |
| 21 | biz_shop_cd | varchar(max) | YES |
| 22 | biz_no | varchar(max) | YES |
| 23 | biz_detl_line_no | int | YES |
| 24 | reg_dt | varchar(max) | YES |
| 25 | reg_user_id | varchar(max) | YES |
| 26 | upd_dt | varchar(max) | YES |
| 27 | upd_user_id | varchar(max) | YES |
| 28 | purc_invo_no | varchar(max) | YES |
| 29 | purc_invo_line_no | decimal(18,0) | YES |
| 30 | ELT_TIMESTAMP | varchar(100) | YES |
| 31 | BRAND | varchar(20) | YES |

#### dbo.PT_SI_DETL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | line_no | decimal(18,0) | YES |
| 3 | purc_no | varchar(max) | YES |
| 4 | purc_detl_line_no | int | YES |
| 5 | case_no | varchar(max) | YES |
| 6 | ship_part_no | varchar(max) | YES |
| 7 | ship_qty | bigint | YES |
| 8 | sort_qty | bigint | YES |
| 9 | sort_over_qty | bigint | YES |
| 10 | sort_short_qty | bigint | YES |
| 11 | sort_dmge_qty | bigint | YES |
| 12 | sort_desc | varchar(max) | YES |
| 13 | sin_qty | bigint | YES |
| 14 | sin_over_qty | bigint | YES |
| 15 | sin_short_qty | bigint | YES |
| 16 | sin_dmge_qty | bigint | YES |
| 17 | sin_desc | varchar(max) | YES |
| 18 | fob | decimal(18,0) | YES |
| 19 | amt | decimal(18,0) | YES |
| 20 | tari_cd | varchar(max) | YES |
| 21 | real_fd | varchar(max) | YES |
| 22 | dist_col | varchar(max) | YES |
| 23 | splr_cd | varchar(max) | YES |
| 24 | lc | bigint | YES |
| 25 | cart_no | varchar(max) | YES |
| 26 | stat | varchar(max) | YES |
| 27 | cstm_amt | bigint | YES |
| 28 | etc_amt | bigint | YES |
| 29 | insu_amt | decimal(18,0) | YES |
| 30 | frgt_amt | decimal(18,0) | YES |
| 31 | fob_weit | decimal(18,0) | YES |
| 32 | release_part_yn | varchar(max) | YES |
| 33 | release_yn | varchar(max) | YES |
| 34 | resv_qty_at_sin | bigint | YES |
| 35 | resv_clear_qty | bigint | YES |
| 36 | cstm_reg_yn | varchar(max) | YES |
| 37 | cstm_cnfm_yn | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | item_no | varchar(max) | YES |
| 43 | coo | varchar(max) | YES |
| 44 | ELT_TIMESTAMP | varchar(100) | YES |
| 45 | BRAND | varchar(20) | YES |

#### dbo.PT_SOUT_DETL_IMS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sout_no | varchar(max) | YES |
| 3 | line_no | int | YES |
| 4 | sout_dt | varchar(max) | YES |
| 5 | part_no | varchar(max) | YES |
| 6 | sout_order_qty | bigint | YES |
| 7 | sout_qty | bigint | YES |
| 8 | sout_check_qty | bigint | YES |
| 9 | sout_over_qty | bigint | YES |
| 10 | sout_short_qty | bigint | YES |
| 11 | sout_dmge_qty | bigint | YES |
| 12 | sout_deni_qty | bigint | YES |
| 13 | pick_qty | bigint | YES |
| 14 | pick_over_qty | bigint | YES |
| 15 | pick_short_qty | bigint | YES |
| 16 | pick_dmge_qty | bigint | YES |
| 17 | pick_deni_qty | bigint | YES |
| 18 | sout_price | bigint | YES |
| 19 | sout_amt | bigint | YES |
| 20 | sout_unit | varchar(max) | YES |
| 21 | conv_qty | bigint | YES |
| 22 | dc_rate | decimal(18,0) | YES |
| 23 | dc_amt | bigint | YES |
| 24 | sale_price | bigint | YES |
| 25 | sale_amt | bigint | YES |
| 26 | sout_vat_amt | bigint | YES |
| 27 | fina_amt | bigint | YES |
| 28 | stock_price_at_sout | bigint | YES |
| 29 | stock_amt_at_sout | bigint | YES |
| 30 | sout_cnfm_qty | bigint | YES |
| 31 | sout_cnfm_dt | varchar(max) | YES |
| 32 | sout_fini_yn | varchar(max) | YES |
| 33 | sout_start_day | varchar(max) | YES |
| 34 | sout_end_day | varchar(max) | YES |
| 35 | cart_no | varchar(max) | YES |
| 36 | stat | varchar(max) | YES |
| 37 | pack_no | varchar(max) | YES |
| 38 | sout_man | varchar(max) | YES |
| 39 | rcit_man | varchar(max) | YES |
| 40 | claim_qty | bigint | YES |
| 41 | dmge_qty | bigint | YES |
| 42 | cncl_qty | bigint | YES |
| 43 | cncl_yn | varchar(max) | YES |
| 44 | remark | varchar(max) | YES |
| 45 | order_allo_dt | varchar(max) | YES |
| 46 | purc_invo_no | varchar(max) | YES |
| 47 | purc_invo_line_no | bigint | YES |
| 48 | biz_shop_cd | varchar(max) | YES |
| 49 | biz_no | varchar(max) | YES |
| 50 | biz_detl_line_no | int | YES |
| 51 | shop_fran_cd | varchar(max) | YES |
| 52 | reg_dt | varchar(max) | YES |
| 53 | reg_user_id | varchar(max) | YES |
| 54 | upd_dt | varchar(max) | YES |
| 55 | upd_user_id | varchar(max) | YES |
| 56 | ELT_TIMESTAMP | varchar(100) | YES |
| 57 | BRAND | varchar(20) | YES |

#### dbo.PT_SOUT_IMS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sout_no | varchar(max) | YES |
| 3 | sout_dt | varchar(max) | YES |
| 4 | sout_type | varchar(max) | YES |
| 5 | sout_kind | varchar(max) | YES |
| 6 | stat | varchar(max) | YES |
| 7 | sout_fini_yn | varchar(max) | YES |
| 8 | acnt_link_yn | varchar(max) | YES |
| 9 | acnt_link_dt | varchar(max) | YES |
| 10 | acnt_link_file | varchar(max) | YES |
| 11 | acnt_link_key | decimal(18,0) | YES |
| 12 | dest | varchar(max) | YES |
| 13 | pda_regi_yn | varchar(max) | YES |
| 14 | pda_cnfm_yn | varchar(max) | YES |
| 15 | tax_invo_issue_yn | varchar(max) | YES |
| 16 | tax_invo_no | varchar(max) | YES |
| 17 | tax_invo_issue_dt | varchar(max) | YES |
| 18 | auto_crea_yn | varchar(max) | YES |
| 19 | sout_cnfm_dt | varchar(max) | YES |
| 20 | sout_sply_amt | bigint | YES |
| 21 | dc_rate | decimal(18,0) | YES |
| 22 | dc_amt | bigint | YES |
| 23 | sale_amt | bigint | YES |
| 24 | totl_sout_vat_amt | bigint | YES |
| 25 | tran_amt | bigint | YES |
| 26 | fina_amt | bigint | YES |
| 27 | claim_kind | varchar(max) | YES |
| 28 | pay_type | varchar(max) | YES |
| 29 | cust_no | varchar(max) | YES |
| 30 | cust_nm | varchar(max) | YES |
| 31 | cust_kind | varchar(max) | YES |
| 32 | cust_seq | bigint | YES |
| 33 | comp_seq | bigint | YES |
| 34 | vin | varchar(max) | YES |
| 35 | vehic_no1 | varchar(max) | YES |
| 36 | vehic_no2 | varchar(max) | YES |
| 37 | addr1 | varchar(max) | YES |
| 38 | addr2 | varchar(max) | YES |
| 39 | addr3 | varchar(max) | YES |
| 40 | tel_no1 | varchar(max) | YES |
| 41 | tel_no2 | varchar(max) | YES |
| 42 | tel_no3 | varchar(max) | YES |
| 43 | upd_yn | varchar(max) | YES |
| 44 | invo_print_yn | varchar(max) | YES |
| 45 | cncl_yn | varchar(max) | YES |
| 46 | retn_resn | varchar(max) | YES |
| 47 | retn_cter_man | varchar(max) | YES |
| 48 | remark | varchar(max) | YES |
| 49 | term_id | bigint | YES |
| 50 | tax_rate | decimal(18,0) | YES |
| 51 | tax_type | bigint | YES |
| 52 | biz_reg_no | varchar(max) | YES |
| 53 | invo_dt | varchar(max) | YES |
| 54 | invo_print_day | varchar(max) | YES |
| 55 | purc_invo_no | varchar(max) | YES |
| 56 | bo_yn | varchar(max) | YES |
| 57 | biz_shop_cd | varchar(max) | YES |
| 58 | biz_no | varchar(max) | YES |
| 59 | dealer_id | varchar(max) | YES |
| 60 | shop_fran_cd | varchar(max) | YES |
| 61 | reg_dt | varchar(max) | YES |
| 62 | reg_user_id | varchar(max) | YES |
| 63 | upd_dt | varchar(max) | YES |
| 64 | upd_user_id | varchar(max) | YES |
| 65 | cpd_code | varchar(max) | YES |
| 66 | ELT_TIMESTAMP | varchar(100) | YES |
| 67 | BRAND | varchar(20) | YES |

#### dbo.PT_STOCK  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | part_no | varchar(max) | YES | 부품번호 |
| 3 | stock_qty | bigint | YES | 수량 |
| 4 | stock_amt | bigint | YES | 금액 |
| 5 | purc_qty_total | bigint | YES | 수량 |
| 6 | purc_qty_serv | bigint | YES | 수량 |
| 7 | purc_qty_vor | bigint | YES | 수량 |
| 8 | purc_qty_eo | bigint | YES | 수량 |
| 9 | purc_qty_so | bigint | YES | 수량 |
| 10 | purc_qty_fo | bigint | YES | 수량 |
| 11 | purc_qty_bo_air | bigint | YES | 수량 |
| 12 | purc_qty_bo_sea | bigint | YES | 수량 |
| 13 | purc_qty_oths | bigint | YES | 수량 |
| 14 | tran_qty_total | bigint | YES | 수량 |
| 15 | tran_qty_serv | bigint | YES | 수량 |
| 16 | tran_qty_vor | bigint | YES | 수량 |
| 17 | tran_qty_eo | bigint | YES | 수량 |
| 18 | tran_qty_so | bigint | YES | 수량 |
| 19 | tran_qty_fo | bigint | YES | 수량 |
| 20 | tran_qty_bo_air | bigint | YES | 수량 |
| 21 | tran_qty_bo_sea | bigint | YES | 수량 |
| 22 | tran_qty_oths | bigint | YES | 수량 |
| 23 | order_qty_total | bigint | YES | 수량 |
| 24 | order_qty_serv | bigint | YES | 수량 |
| 25 | order_qty_vor | bigint | YES | 수량 |
| 26 | order_qty_eo | bigint | YES | 수량 |
| 27 | order_qty_so | bigint | YES | 수량 |
| 28 | order_qty_fo | bigint | YES | 수량 |
| 29 | order_qty_bo_air | bigint | YES | 수량 |
| 30 | order_qty_bo_sea | bigint | YES | 수량 |
| 31 | order_qty_oths | bigint | YES | 수량 |
| 32 | resv_qty | bigint | YES | 수량 |
| 33 | sout_wait_qty | bigint | YES | 수량 |
| 34 | sout_wait_qty_calc | bigint | YES | 수량 |
| 35 | sin_wait_qty | bigint | YES | 수량 |
| 36 | sin_wait_amt | bigint | YES | 금액 |
| 37 | stock_adjt_qty_plus | bigint | YES | 수량 |
| 38 | stock_adjt_qty_minus | bigint | YES | 수량 |
| 39 | purc_claim_qty | bigint | YES | 수량 |
| 40 | stnd_stock_qty | bigint | YES | 수량 |
| 41 | stnd_stock_qty_temp | bigint | YES | 수량 |
| 42 | stnd_stock_mnge_yn | varchar(max) | YES | 재고 |
| 43 | safe_stock_qty | bigint | YES | 수량 |
| 44 | late_purc_price | bigint | YES | 가격 |
| 45 | late_sin_dt | varchar(max) | YES | 일자 |
| 46 | late_sout_dt | varchar(max) | YES | 일자 |
| 47 | bin_loca | varchar(max) | YES |  |
| 48 | resv_bin_loca | varchar(max) | YES |  |
| 49 | mad | decimal(18,0) | YES |  |
| 50 | prev_mad | decimal(18,0) | YES |  |
| 51 | stock_qty_open_yn | varchar(max) | YES | 수량 |
| 52 | soq_calc_yn | varchar(max) | YES | 여부(Y/N) |
| 53 | icc | varchar(max) | YES |  |
| 54 | scc | varchar(max) | YES |  |
| 55 | scc_manu | varchar(max) | YES |  |
| 56 | mad_fluc_warn_yn | varchar(max) | YES | 여부(Y/N) |
| 57 | abno_mad_fluc_yn | varchar(max) | YES | 여부(Y/N) |
| 58 | mad_fluc_rate | decimal(18,0) | YES |  |
| 59 | stock_surp_yn | varchar(max) | YES | 재고 |
| 60 | short_warn_qty | bigint | YES | 수량 |
| 61 | stock_prot_qty | bigint | YES | 수량 |
| 62 | prev_stock_qty | bigint | YES | 수량 |
| 63 | prev_stock_amt | bigint | YES | 금액 |
| 64 | dealer_id | varchar(max) | YES | 딜러 ID |
| 65 | reg_dt | varchar(max) | YES | 등록일 |
| 66 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 67 | upd_dt | varchar(max) | YES | 수정일 |
| 68 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 69 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 70 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SFA_CONSULT_LOG  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cons_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(500) | YES |
| 3 | shop_cd | varchar(500) | YES |
| 4 | mng_sc_id | varchar(500) | YES |
| 5 | cons_dt | varchar(500) | YES |
| 6 | hold_type | varchar(500) | YES |
| 7 | cust_res | varchar(500) | YES |
| 8 | cust_nm | varchar(500) | YES |
| 9 | cust_seq | decimal(18,0) | YES |
| 10 | sex_cd | varchar(500) | YES |
| 11 | age_cd | varchar(500) | YES |
| 12 | marry_yn | varchar(500) | YES |
| 13 | child_cnt | decimal(18,0) | YES |
| 14 | job_cd | varchar(500) | YES |
| 15 | job_detail | varchar(500) | YES |
| 16 | hobby_cd | varchar(500) | YES |
| 17 | concern_mdl1 | varchar(500) | YES |
| 18 | concern_mdl2 | varchar(500) | YES |
| 19 | target_brand | varchar(500) | YES |
| 20 | target_mdl | varchar(500) | YES |
| 21 | prev_brand | varchar(500) | YES |
| 22 | prev_mdl | varchar(500) | YES |
| 23 | buy_purpo | varchar(500) | YES |
| 24 | buy_cd | varchar(500) | YES |
| 25 | driver | varchar(500) | YES |
| 26 | drive_type_pr | varchar(500) | YES |
| 27 | drive_type_km | decimal(18,0) | YES |
| 28 | budget | decimal(18,0) | YES |
| 29 | pay_type | varchar(500) | YES |
| 30 | sales_t_dt | varchar(500) | YES |
| 31 | upd_dt | varchar(500) | YES |
| 32 | recent_yn | varchar(500) | YES |
| 33 | concern_degree | varchar(500) | YES |
| 34 | ELT_TIMESTAMP | varchar(100) | YES |
| 35 | BRAND | varchar(20) | YES |

#### dbo.SFA_SHOWROOM_DESC  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | showroom | varchar(max) | YES |
| 2 | sr_seq | decimal(18,0) | YES |
| 3 | dealer_id | varchar(max) | YES |
| 4 | recept_sc | varchar(max) | YES |
| 5 | recept_dt | varchar(max) | YES |
| 6 | recept_fr_time | varchar(max) | YES |
| 7 | recept_to_time | varchar(max) | YES |
| 8 | cust_seq | decimal(18,0) | YES |
| 9 | active_knd | varchar(max) | YES |
| 10 | concern_mdl1 | varchar(max) | YES |
| 11 | concern_mdl2 | varchar(max) | YES |
| 12 | other_comp_brand | varchar(max) | YES |
| 13 | other_comp_model | varchar(max) | YES |
| 14 | sex_cd | varchar(max) | YES |
| 15 | age | varchar(max) | YES |
| 16 | cust_response | varchar(max) | YES |
| 17 | remark | varchar(max) | YES |
| 18 | active_result | varchar(max) | YES |
| 19 | reg_dt | varchar(max) | YES |
| 20 | upd_dt | varchar(max) | YES |
| 21 | owned_car_brand | varchar(max) | YES |
| 22 | owned_car_model | varchar(max) | YES |
| 23 | revisit_yn | varchar(max) | YES |
| 24 | active_knd_dtl | varchar(max) | YES |
| 25 | ex_cnt | decimal(18,0) | YES |
| 26 | recept_time | varchar(max) | YES |
| 27 | dm_yn | varchar(max) | YES |
| 28 | tel_yn | varchar(max) | YES |
| 29 | cons_seq | decimal(18,0) | YES |
| 30 | ELT_TIMESTAMP | varchar(100) | YES |
| 31 | BRAND | varchar(20) | YES |

#### dbo.SFA_TESTCAR_TRIAL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reserved_dt | varchar(max) | YES |
| 2 | from_time | varchar(max) | YES |
| 3 | testcar_no | varchar(max) | YES |
| 4 | trial_no | varchar(max) | YES |
| 5 | dealer_id | varchar(max) | YES |
| 6 | shop_cd | varchar(max) | YES |
| 7 | to_time | varchar(max) | YES |
| 8 | reserve_term | decimal(18,0) | YES |
| 9 | prev_km | decimal(18,0) | YES |
| 10 | test_type | varchar(max) | YES |
| 11 | use_type | varchar(max) | YES |
| 12 | vin | varchar(max) | YES |
| 13 | model_cd | varchar(max) | YES |
| 14 | variant_cd | varchar(max) | YES |
| 15 | my_cd | varchar(max) | YES |
| 16 | cust_seq | decimal(18,0) | YES |
| 17 | res_group_id | varchar(max) | YES |
| 18 | res_user_id | varchar(max) | YES |
| 19 | res_memo | varchar(max) | YES |
| 20 | destination | varchar(max) | YES |
| 21 | end_km | decimal(18,0) | YES |
| 22 | interest_degree | varchar(max) | YES |
| 23 | purchase_degree | varchar(max) | YES |
| 24 | result_memo | varchar(max) | YES |
| 25 | test_yn | varchar(max) | YES |
| 26 | view_word | varchar(max) | YES |
| 27 | reg_dt | varchar(max) | YES |
| 28 | reg_user_id | varchar(max) | YES |
| 29 | upd_dt | varchar(max) | YES |
| 30 | upd_user_id | varchar(max) | YES |
| 31 | test_type2 | varchar(max) | YES |
| 32 | res_shop_cd | varchar(max) | YES |
| 33 | res_dept_cd | varchar(max) | YES |
| 34 | app_flag | varchar(max) | YES |
| 35 | ELT_TIMESTAMP | varchar(100) | YES |
| 36 | BRAND | varchar(20) | YES |

#### dbo.SFA_TESTCAR_TRIAL_KTWS  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reserved_dt | varchar(max) | YES |
| 2 | from_time | varchar(max) | YES |
| 3 | testcar_no | varchar(max) | YES |
| 4 | trial_no | varchar(max) | YES |
| 5 | dealer_id | varchar(max) | YES |
| 6 | shop_cd | varchar(max) | YES |
| 7 | to_time | varchar(max) | YES |
| 8 | reserve_term | decimal(18,0) | YES |
| 9 | prev_km | decimal(18,0) | YES |
| 10 | test_type | varchar(max) | YES |
| 11 | use_type | varchar(max) | YES |
| 12 | vin | varchar(max) | YES |
| 13 | model_cd | varchar(max) | YES |
| 14 | variant_cd | varchar(max) | YES |
| 15 | my_cd | varchar(max) | YES |
| 16 | cust_seq | decimal(18,0) | YES |
| 17 | cust_nm | varchar(max) | YES |
| 18 | res_group_id | varchar(max) | YES |
| 19 | res_user_id | varchar(max) | YES |
| 20 | res_memo | varchar(max) | YES |
| 21 | destination | varchar(max) | YES |
| 22 | end_km | decimal(18,0) | YES |
| 23 | interest_degree | varchar(max) | YES |
| 24 | purchase_degree | varchar(max) | YES |
| 25 | result_memo | varchar(max) | YES |
| 26 | test_yn | varchar(max) | YES |
| 27 | view_word | varchar(max) | YES |
| 28 | reg_dt | varchar(max) | YES |
| 29 | reg_user_id | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | upd_user_id | varchar(max) | YES |
| 32 | test_type2 | varchar(max) | YES |
| 33 | res_shop_cd | varchar(max) | YES |
| 34 | res_dept_cd | varchar(max) | YES |
| 35 | app_flag | varchar(max) | YES |
| 36 | lead_id | decimal(18,0) | YES |
| 37 | trial_grp_seq | decimal(18,0) | YES |
| 38 | ELT_TIMESTAMP | varchar(100) | YES |
| 39 | BRAND | varchar(20) | YES |

#### dbo.SFA_TESTDRIVE_REQ  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | req_seq | decimal(18,0) | YES |
| 2 | req_reg_dt | varchar(max) | YES |
| 3 | req_system_id | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | brand | varchar(max) | YES |
| 6 | model | varchar(max) | YES |
| 7 | variant | varchar(max) | YES |
| 8 | req_ymd | varchar(max) | YES |
| 9 | req_fr_time | varchar(max) | YES |
| 10 | req_to_time | varchar(max) | YES |
| 11 | inbound_path | varchar(max) | YES |
| 12 | req_path | varchar(max) | YES |
| 13 | req_memo | varchar(max) | YES |
| 14 | cust_age_group | varchar(max) | YES |
| 15 | cust_gender | varchar(max) | YES |
| 16 | status | varchar(max) | YES |
| 17 | alloc_tp | varchar(max) | YES |
| 18 | alloc_dt | varchar(max) | YES |
| 19 | alloc_user_id | varchar(max) | YES |
| 20 | mng_sc_id | varchar(max) | YES |
| 21 | cons_dt | varchar(max) | YES |
| 22 | cons_user_id | varchar(max) | YES |
| 23 | fail_reason_cd | varchar(max) | YES |
| 24 | fail_reason_memo | varchar(max) | YES |
| 25 | ref_cons_seq | decimal(18,0) | YES |
| 26 | ref_cust_seq | decimal(18,0) | YES |
| 27 | ref_td_reserved_dt | varchar(max) | YES |
| 28 | ref_td_from_time | varchar(max) | YES |
| 29 | ref_td_testcar_no | varchar(max) | YES |
| 30 | ref_contract_no | decimal(18,0) | YES |
| 31 | own_cust_yn | varchar(max) | YES |
| 32 | reg_dt | varchar(max) | YES |
| 33 | upd_dt | varchar(max) | YES |
| 34 | ref_td_trial_no | varchar(max) | YES |
| 35 | td_center_yn | varchar(max) | YES |
| 36 | close_dt | varchar(max) | YES |
| 37 | close_user_id | varchar(max) | YES |
| 38 | org_shop_cd | varchar(max) | YES |
| 39 | request_path | varchar(max) | YES |
| 40 | event_type | varchar(max) | YES |
| 41 | interest_brand | varchar(max) | YES |
| 42 | interest_variant | varchar(max) | YES |
| 43 | untact_yn | varchar(max) | YES |
| 44 | cons_fail_dt | varchar(max) | YES |
| 45 | ELT_TIMESTAMP | varchar(100) | YES |
| 46 | BRAND | varchar(20) | YES |

#### dbo.SPM_HBOARD_MEETING  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | meet_seq | decimal(18,0) | YES |
| 2 | holding_id | varchar(max) | YES |
| 3 | dealer_id | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | start_user_id | varchar(max) | YES |
| 7 | start_dt | varchar(max) | YES |
| 8 | status | varchar(max) | YES |
| 9 | close_user_id | varchar(max) | YES |
| 10 | close_dt | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | ELT_TIMESTAMP | varchar(100) | YES |
| 14 | BRAND | varchar(20) | YES |

#### dbo.SPM_HBOARD_MEETING_CHIP  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | meet_seq | decimal(18,0) | YES |
| 2 | followup_id | decimal(18,0) | YES |
| 3 | cust_seq | decimal(18,0) | YES |
| 4 | mng_sc_id | varchar(max) | YES |
| 5 | hot_reg_dt | varchar(max) | YES |
| 6 | hboard_reg_dt | varchar(max) | YES |
| 7 | chip_status | varchar(max) | YES |
| 8 | contract_ratio | decimal(18,0) | YES |
| 9 | remark | varchar(max) | YES |
| 10 | drop_reason | varchar(max) | YES |
| 11 | comp_brand_cd | varchar(max) | YES |
| 12 | comp_model_cd | varchar(max) | YES |
| 13 | own_brand_cd | varchar(max) | YES |
| 14 | own_model_cd | varchar(max) | YES |
| 15 | pay_type | varchar(max) | YES |
| 16 | reg_dt | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | own_model_pdt | varchar(max) | YES |
| 19 | mng_remark | varchar(max) | YES |
| 20 | lead_id | decimal(18,0) | YES |
| 21 | ELT_TIMESTAMP | varchar(100) | YES |
| 22 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TECH  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | real_yn | varchar(max) | YES |
| 7 | techman_id | varchar(max) | YES |
| 8 | main_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | work_date_rn | decimal(18,0) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TECH_PLAN  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | real_yn | varchar(max) | YES |
| 7 | techman_id | varchar(max) | YES |
| 8 | main_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | work_date_rn | decimal(18,0) | YES |
| 12 | ELT_TIMESTAMP | varchar(100) | YES |
| 13 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TIME  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(max) | YES |
| 7 | stall_no | decimal(18,0) | YES |
| 8 | expt_st_dt | varchar(max) | YES |
| 9 | expt_end_dt | varchar(max) | YES |
| 10 | real_st_dt | varchar(max) | YES |
| 11 | real_end_dt | varchar(max) | YES |
| 12 | stat_cd | varchar(max) | YES |
| 13 | cancel_reason_cd | varchar(max) | YES |
| 14 | tot_rest_minutes | decimal(18,0) | YES |
| 15 | reg_dt | varchar(max) | YES |
| 16 | reg_user_id | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | upd_user_id | varchar(max) | YES |
| 19 | re_repair_yn | varchar(max) | YES |
| 20 | qc_close_yn | varchar(max) | YES |
| 21 | work_seq_next | int | YES |
| 22 | ELT_TIMESTAMP | varchar(100) | YES |
| 23 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TIME_GROUP  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_seq | decimal(18,0) | YES |
| 2 | shop_cd | varchar(max) | YES |
| 3 | propo_dt | varchar(max) | YES |
| 4 | propo_seq | decimal(18,0) | YES |
| 5 | proc_type_cd | varchar(max) | YES |
| 6 | work_seq | int | YES |
| 7 | reg_dt | varchar(max) | YES |
| 8 | reg_user_id | varchar(max) | YES |
| 9 | ELT_TIMESTAMP | varchar(100) | YES |
| 10 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TIME_PLAN  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(max) | YES |
| 7 | stall_no | decimal(18,0) | YES |
| 8 | expt_st_dt | varchar(max) | YES |
| 9 | expt_end_dt | varchar(max) | YES |
| 10 | stat_cd | varchar(max) | YES |
| 11 | cancel_reason_cd | varchar(max) | YES |
| 12 | tot_rest_minutes | decimal(18,0) | YES |
| 13 | re_repair_yn | varchar(max) | YES |
| 14 | reg_dt | varchar(max) | YES |
| 15 | reg_user_id | varchar(max) | YES |
| 16 | ELT_TIMESTAMP | varchar(100) | YES |
| 17 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_PROC_TIME_REST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | seq | int | YES |
| 7 | rest_st_dt | varchar(max) | YES |
| 8 | rest_end_dt | varchar(max) | YES |
| 9 | rest_minutes | decimal(18,0) | YES |
| 10 | rest_reason_cd | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | reg_user_id | varchar(max) | YES |
| 13 | upd_dt | varchar(max) | YES |
| 14 | upd_user_id | varchar(max) | YES |
| 15 | ELT_TIMESTAMP | varchar(100) | YES |
| 16 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_REPEAT_KPI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | year | varchar(max) | YES |
| 3 | month | varchar(max) | YES |
| 4 | category | varchar(max) | YES |
| 5 | proc | varchar(max) | YES |
| 6 | cnt | varchar(max) | YES |
| 7 | reg_user_id | varchar(max) | YES |
| 8 | reg_dt | varchar(max) | YES |
| 9 | upd_user_id | varchar(max) | YES |
| 10 | upd_dt | varchar(max) | YES |
| 11 | ELT_TIMESTAMP | varchar(100) | YES |
| 12 | BRAND | varchar(20) | YES |

#### dbo.SVC_BP_SALES_TARGET  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | year | varchar(max) | YES |  |
| 3 | month | varchar(max) | YES |  |
| 4 | bpus | decimal(18,0) | YES |  |
| 5 | bps | decimal(18,0) | YES |  |
| 6 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 7 | reg_dt | varchar(max) | YES | 등록일 |
| 8 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 9 | upd_dt | varchar(max) | YES | 수정일 |
| 10 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 11 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SVC_BP_WORKDATE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | work_date | varchar(max) | YES |
| 3 | offday_yn | varchar(max) | YES |
| 4 | remark | varchar(max) | YES |
| 5 | reg_dt | varchar(max) | YES |
| 6 | reg_user_id | varchar(max) | YES |
| 7 | upd_dt | varchar(max) | YES |
| 8 | upd_user_id | varchar(max) | YES |
| 9 | em_add_job_cnt | int | YES |
| 10 | ELT_TIMESTAMP | varchar(100) | YES |
| 11 | BRAND | varchar(20) | YES |

#### dbo.SVC_CHARGE_RATE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | apply_st_date | varchar(max) | YES |
| 3 | apply_end_date | varchar(max) | YES |
| 4 | apply_amt | decimal(18,0) | YES |
| 5 | reg_dt | varchar(max) | YES |
| 6 | reg_user_id | varchar(max) | YES |
| 7 | upd_dt | varchar(max) | YES |
| 8 | upd_user_id | varchar(max) | YES |
| 9 | frm_type_cd | varchar(max) | YES |
| 10 | ELT_TIMESTAMP | varchar(100) | YES |
| 11 | BRAND | varchar(20) | YES |

#### dbo.SVC_CUST_GUIDE_MEMO  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(max) | YES | 일자 |
| 3 | propo_seq | decimal(18,0) | YES | 순번 |
| 4 | vin | varchar(max) | YES | 차대번호(VIN) |
| 5 | seq | decimal(18,0) | YES | 순번 |
| 6 | cust_guide_memo | varchar(max) | YES | 고객 |
| 7 | reg_dt | varchar(max) | YES | 등록일 |
| 8 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 9 | upd_dt | varchar(max) | YES | 수정일 |
| 10 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 11 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 12 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SVC_DAILY_SALES_REPORT  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | type3_cd | varchar(max) | YES | 유형코드 |
| 3 | std_dt | varchar(max) | YES | 일자 |
| 4 | part_amt | decimal(18,0) | YES | 금액 |
| 5 | part_cost | decimal(18,0) | YES | 부품 |
| 6 | labor_amt | decimal(18,0) | YES | 금액 |
| 7 | sublet_amt | decimal(18,0) | YES | 금액 |
| 8 | dc_amt | decimal(18,0) | YES | 금액 |
| 9 | settle_amt | decimal(18,0) | YES | 금액 |
| 10 | extra_amt | decimal(18,0) | YES | 금액 |
| 11 | sales_amt | decimal(18,0) | YES | 금액 |
| 12 | reg_dt | varchar(max) | YES | 등록일 |
| 13 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 14 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SVC_DAILY_UNIT_REPORT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | std_dt | varchar(max) | YES |
| 3 | bp | decimal(18,0) | YES |
| 4 | fp | decimal(18,0) | YES |
| 5 | po | decimal(18,0) | YES |
| 6 | gr | decimal(18,0) | YES |
| 7 | wt | decimal(18,0) | YES |
| 8 | it | decimal(18,0) | YES |
| 9 | f1k | decimal(18,0) | YES |
| 10 | bp_d_l_cnt | decimal(18,0) | YES |
| 11 | bp_d_m_cnt | decimal(18,0) | YES |
| 12 | bp_d_h_cnt | decimal(18,0) | YES |
| 13 | reg_dt | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.SVC_DLR_CODE_DTL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | code_grp | varchar(max) | YES |
| 3 | code | int | YES |
| 4 | code_kor_nm | varchar(max) | YES |
| 5 | code_eng_nm | varchar(max) | YES |
| 6 | disp_rank | decimal(18,0) | YES |
| 7 | use_yn | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | bi_code | varchar(max) | YES |
| 14 | ELT_TIMESTAMP | varchar(100) | YES |
| 15 | BRAND | varchar(20) | YES |

#### dbo.SVC_INSU  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | varchar(max) | YES |
| 4 | insu_type_cd | varchar(max) | YES |
| 5 | accident_type_cd | varchar(max) | YES |
| 6 | harm_vehic_no1 | varchar(max) | YES |
| 7 | harm_vehic_no2 | varchar(max) | YES |
| 8 | stat_cd | varchar(max) | YES |
| 9 | accident_dt | varchar(max) | YES |
| 10 | rqst_dt | varchar(max) | YES |
| 11 | tot_rqst_amt | decimal(18,0) | YES |
| 12 | tot_rqst_ar_amt | decimal(18,0) | YES |
| 13 | tot_aprov_amt | decimal(18,0) | YES |
| 14 | close_dt | varchar(max) | YES |
| 15 | close_user_id | varchar(max) | YES |
| 16 | close_cancel_yn | varchar(max) | YES |
| 17 | remark | varchar(max) | YES |
| 18 | file_path_1 | varchar(max) | YES |
| 19 | file_nm_1 | varchar(max) | YES |
| 20 | file_path_2 | varchar(max) | YES |
| 21 | file_nm_2 | varchar(max) | YES |
| 22 | file_path_3 | varchar(max) | YES |
| 23 | file_nm_3 | varchar(max) | YES |
| 24 | tax_cust_seq | varchar(max) | YES |
| 25 | tax_cust_idfy_no | varchar(max) | YES |
| 26 | reg_dt | varchar(max) | YES |
| 27 | reg_user_id | varchar(max) | YES |
| 28 | upd_dt | varchar(max) | YES |
| 29 | upd_user_id | varchar(max) | YES |
| 30 | close_cancel_dt | varchar(max) | YES |
| 31 | ELT_TIMESTAMP | varchar(100) | YES |
| 32 | BRAND | varchar(20) | YES |

#### dbo.SVC_INSU_DTL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | varchar(max) | YES |
| 4 | comp_seq | varchar(max) | YES |
| 5 | insu_type_cd | varchar(max) | YES |
| 6 | accident_rqst_no | varchar(max) | YES |
| 7 | compensation_rate | varchar(max) | YES |
| 8 | prev_vat_yn | varchar(max) | YES |
| 9 | prev_vat_amt | decimal(18,0) | YES |
| 10 | prev_vat_stat_cd | varchar(max) | YES |
| 11 | prev_vat_stat_chng_dt | varchar(max) | YES |
| 12 | prev_vat_stat_chng_user_id | varchar(max) | YES |
| 13 | prev_vat_receipt_key | varchar(max) | YES |
| 14 | imt_amt | decimal(18,0) | YES |
| 15 | imt_amt_stat_cd | varchar(max) | YES |
| 16 | imt_amt_stat_chng_dt | varchar(max) | YES |
| 17 | imt_amt_stat_chng_user_id | varchar(max) | YES |
| 18 | imt_amt_vat_yn | varchar(max) | YES |
| 19 | imt_amt_receipt_key | varchar(max) | YES |
| 20 | imt_amt_ar_key | varchar(max) | YES |
| 21 | cust_pay_amt | decimal(18,0) | YES |
| 22 | cust_pay_stat_cd | varchar(max) | YES |
| 23 | cust_pay_stat_chng_dt | varchar(max) | YES |
| 24 | cust_pay_stat_chng_user_id | varchar(max) | YES |
| 25 | cust_pay_vat_yn | varchar(max) | YES |
| 26 | cust_pay_receipt_key | varchar(max) | YES |
| 27 | cust_pay_ar_key | varchar(max) | YES |
| 28 | append_amt | decimal(18,0) | YES |
| 29 | append_amt_stat_cd | varchar(max) | YES |
| 30 | append_amt_stat_chng_dt | varchar(max) | YES |
| 31 | append_amt_stat_chng_user_id | varchar(max) | YES |
| 32 | append_amt_vat_yn | varchar(max) | YES |
| 33 | append_amt_ar_key | varchar(max) | YES |
| 34 | rqst_amt | decimal(18,0) | YES |
| 35 | rqst_ar_amt | decimal(18,0) | YES |
| 36 | rqst_ar_key | varchar(max) | YES |
| 37 | aprov_amt | decimal(18,0) | YES |
| 38 | aprov_date | varchar(max) | YES |
| 39 | bank_account_cms | varchar(max) | YES |
| 40 | aprov_amt_ar_key | varchar(max) | YES |
| 41 | stat_cd | varchar(max) | YES |
| 42 | stat_chng_user_id | varchar(max) | YES |
| 43 | stat_chng_dt | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | reg_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | upd_user_id | varchar(max) | YES |
| 48 | tax_cust_seq | varchar(max) | YES |
| 49 | tax_cust_idfy_no | varchar(max) | YES |
| 50 | aprov_amt_dms_trx_id | varchar(max) | YES |
| 51 | prev_vat_vat_yn | varchar(max) | YES |
| 52 | append_amt_receipt_key | varchar(max) | YES |
| 53 | charge_nm | varchar(max) | YES |
| 54 | tel_area | varchar(max) | YES |
| 55 | tel_no | varchar(max) | YES |
| 56 | hp_area | varchar(max) | YES |
| 57 | hp_no | varchar(max) | YES |
| 58 | ELT_TIMESTAMP | varchar(100) | YES |
| 59 | BRAND | varchar(20) | YES |

#### dbo.SVC_PROPO  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | repair_type_cd | varchar(max) | YES |
| 5 | propo_type_cd | varchar(max) | YES |
| 6 | vin | varchar(max) | YES |
| 7 | vis | varchar(max) | YES |
| 8 | vehic_no1 | varchar(max) | YES |
| 9 | vehic_no2 | varchar(max) | YES |
| 10 | variant_nm | varchar(max) | YES |
| 11 | svc_model_cd | varchar(max) | YES |
| 12 | vehic_base_odometer | int | YES |
| 13 | odometer | int | YES |
| 14 | cust_seq | decimal(18,0) | YES |
| 15 | cust_nm | varchar(max) | YES |
| 16 | cust_idfy_no | varchar(max) | YES |
| 17 | cust_rcpt_rel_cd | varchar(max) | YES |
| 18 | rcpt_cust_nm | varchar(max) | YES |
| 19 | rcpt_hp_area | varchar(max) | YES |
| 20 | rcpt_hp_no | varchar(max) | YES |
| 21 | rcpt_tel_area | varchar(max) | YES |
| 22 | rcpt_tel_no | varchar(max) | YES |
| 23 | vip_yn | varchar(max) | YES |
| 24 | svc_type_cd | varchar(max) | YES |
| 25 | svc_type_fms_cd | varchar(max) | YES |
| 26 | resv_dt | varchar(max) | YES |
| 27 | resv_seq | decimal(18,0) | YES |
| 28 | esti_dt | varchar(max) | YES |
| 29 | esti_seq | decimal(18,0) | YES |
| 30 | work_close_yn | varchar(max) | YES |
| 31 | stat_cd | varchar(max) | YES |
| 32 | stat_chng_dt | varchar(max) | YES |
| 33 | stat_chng_user_id | varchar(max) | YES |
| 34 | work_expt_st_dt | varchar(max) | YES |
| 35 | work_expt_end_dt | varchar(max) | YES |
| 36 | cust_delivery_yn | varchar(max) | YES |
| 37 | cust_delivery_expt_dt | varchar(max) | YES |
| 38 | cust_delivery_real_dt | varchar(max) | YES |
| 39 | old_part_yn | varchar(max) | YES |
| 40 | cust_loc_cd | varchar(max) | YES |
| 41 | vehic_loc_cd | varchar(max) | YES |
| 42 | damage_type_cd | varchar(max) | YES |
| 43 | stall_no | decimal(18,0) | YES |
| 44 | sms_yn | varchar(max) | YES |
| 45 | wash_stat_cd | varchar(max) | YES |
| 46 | cust_rqst | varchar(max) | YES |
| 47 | sa_sugst | varchar(max) | YES |
| 48 | techman_sugst | varchar(max) | YES |
| 49 | part_sugst | varchar(max) | YES |
| 50 | rcpt_sa_id | varchar(max) | YES |
| 51 | rcpt_time | decimal(18,0) | YES |
| 52 | propo_issu_time | decimal(18,0) | YES |
| 53 | mng_sa_id | varchar(max) | YES |
| 54 | mng_foreman_id | varchar(max) | YES |
| 55 | happycall_target_yn | varchar(max) | YES |
| 56 | happycall_reject_cd | varchar(max) | YES |
| 57 | cancel_reason_cd | varchar(max) | YES |
| 58 | cancel_reason | varchar(max) | YES |
| 59 | payback_yn | varchar(max) | YES |
| 60 | base_propo_dt | varchar(max) | YES |
| 61 | base_propo_seq | decimal(18,0) | YES |
| 62 | prev_shop_cd | varchar(max) | YES |
| 63 | prev_propo_dt | varchar(max) | YES |
| 64 | prev_propo_seq | decimal(18,0) | YES |
| 65 | prev_odometer | int | YES |
| 66 | prev_acc_shop_cd | varchar(max) | YES |
| 67 | prev_acc_propo_dt | varchar(max) | YES |
| 68 | prev_acc_propo_seq | decimal(18,0) | YES |
| 69 | up_group_id | varchar(max) | YES |
| 70 | reg_dt | varchar(max) | YES |
| 71 | reg_user_id | varchar(max) | YES |
| 72 | upd_dt | varchar(max) | YES |
| 73 | upd_user_id | varchar(max) | YES |
| 74 | cust_delivery_zip | varchar(max) | YES |
| 75 | cust_delivery_addr | varchar(max) | YES |
| 76 | cust_delivery_addr2 | varchar(max) | YES |
| 77 | cust_delivery_loc_x | varchar(max) | YES |
| 78 | cust_delivery_loc_y | varchar(max) | YES |
| 79 | add_proc_reg_dt | varchar(max) | YES |
| 80 | add_proc_reg_id | varchar(max) | YES |
| 81 | add_proc_sugst | varchar(max) | YES |
| 82 | pdc_yn | varchar(max) | YES |
| 83 | hbec_yn | varchar(max) | YES |
| 84 | hbec_seq | decimal(18,0) | YES |
| 85 | nex_svc | varchar(max) | YES |
| 86 | sc_forward_feedback | varchar(max) | YES |
| 87 | repeat_repair | varchar(max) | YES |
| 88 | reflaw_type | varchar(max) | YES |
| 89 | molit_target_yn | varchar(max) | YES |
| 90 | em_yn | varchar(max) | YES |
| 91 | app_rcpt_flag | varchar(max) | YES |
| 92 | repaet_alarm | varchar(max) | YES |
| 93 | fin_upload_seq | decimal(18,0) | YES |
| 94 | esti_type | varchar(max) | YES |
| 95 | end_gb | varchar(max) | YES |
| 96 | svc_in_sc_id | varchar(max) | YES |
| 97 | recall_before_sale_yn | varchar(max) | YES |
| 98 | bp_deli_site | varchar(max) | YES |
| 99 | bp_insu_comp | bigint | YES |
| 100 | free_service_sugst | varchar(max) | YES |
| 101 | cust_repair_req | varchar(max) | YES |
| 102 | app_save_flag | varchar(max) | YES |
| 103 | valuable_yn | varchar(max) | YES |
| 104 | dms_first_save_flag | varchar(max) | YES |
| 105 | propo_talk_send_time | varchar(max) | YES |
| 106 | propo_talk_send_user_id | varchar(max) | YES |
| 107 | propo_talk_mseq | bigint | YES |
| 108 | calc_talk_send_time | varchar(max) | YES |
| 109 | calc_talk_send_user_id | varchar(max) | YES |
| 110 | calc_talk_mseq | bigint | YES |
| 111 | sign_yn | varchar(max) | YES |
| 112 | agora_use_dt | varchar(max) | YES |
| 113 | proc_start_sms_yn | varchar(max) | YES |
| 114 | proc_start_sms_dt | varchar(max) | YES |
| 115 | sa_qc_sms_yn | varchar(max) | YES |
| 116 | sa_qc_sms_dt | varchar(max) | YES |
| 117 | ELT_TIMESTAMP | varchar(100) | YES |
| 118 | BRAND | varchar(20) | YES |

#### dbo.SVC_PROPO_BPKPI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | shop_in_dt | varchar(max) | YES |
| 5 | repair_start_dt | varchar(max) | YES |
| 6 | repair_finsh_dt | varchar(max) | YES |
| 7 | delivery_expt_dt | varchar(max) | YES |
| 8 | delivery_real_dt | varchar(max) | YES |
| 9 | ru10 | varchar(max) | YES |
| 10 | ru11 | varchar(max) | YES |
| 11 | ru12 | varchar(max) | YES |
| 12 | ru13 | varchar(max) | YES |
| 13 | ru14 | varchar(max) | YES |
| 14 | ru15 | varchar(max) | YES |
| 15 | ru16 | varchar(max) | YES |
| 16 | ru17 | varchar(max) | YES |
| 17 | ru18 | varchar(max) | YES |
| 18 | ru19 | varchar(max) | YES |
| 19 | ru20 | varchar(max) | YES |
| 20 | ru21 | varchar(max) | YES |
| 21 | ru22 | varchar(max) | YES |
| 22 | ru23 | varchar(max) | YES |
| 23 | ru24 | varchar(max) | YES |
| 24 | ru25 | varchar(max) | YES |
| 25 | ru26 | varchar(max) | YES |
| 26 | ru27 | varchar(max) | YES |
| 27 | ru28 | varchar(max) | YES |
| 28 | ru29 | varchar(max) | YES |
| 29 | ru30 | varchar(max) | YES |
| 30 | ru31 | varchar(max) | YES |
| 31 | ru32 | varchar(max) | YES |
| 32 | ru33 | varchar(max) | YES |
| 33 | ru34 | varchar(max) | YES |
| 34 | ru35 | varchar(max) | YES |
| 35 | ru36 | varchar(max) | YES |
| 36 | oj10 | varchar(max) | YES |
| 37 | oj11 | varchar(max) | YES |
| 38 | oj12 | varchar(max) | YES |
| 39 | qc10 | int | YES |
| 40 | qc11 | int | YES |
| 41 | qc12 | int | YES |
| 42 | qc13 | int | YES |
| 43 | qc14 | int | YES |
| 44 | qc15 | int | YES |
| 45 | qc16 | int | YES |
| 46 | qc17 | int | YES |
| 47 | reg_dt | varchar(max) | YES |
| 48 | reg_user_id | varchar(max) | YES |
| 49 | upd_dt | varchar(max) | YES |
| 50 | upd_user_id | varchar(max) | YES |
| 51 | proc_line | varchar(max) | YES |
| 52 | bi_code | varchar(max) | YES |
| 53 | bp_line_cd | decimal(18,0) | YES |
| 54 | ELT_TIMESTAMP | varchar(100) | YES |
| 55 | BRAND | varchar(20) | YES |

#### dbo.SVC_PROPO_LABOR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | frm_no | varchar(max) | YES |
| 5 | seq | decimal(18,0) | YES |
| 6 | ro_type_cd | varchar(max) | YES |
| 7 | settle_type_cd | varchar(max) | YES |
| 8 | propo_stat_cd | varchar(max) | YES |
| 9 | qty | int | YES |
| 10 | mh | decimal(18,0) | YES |
| 11 | frm_nm | varchar(max) | YES |
| 12 | sale_unit_price | decimal(18,0) | YES |
| 13 | sale_amt | decimal(18,0) | YES |
| 14 | dc_amt | decimal(18,0) | YES |
| 15 | grp_no | decimal(18,0) | YES |
| 16 | disp_rank | decimal(18,0) | YES |
| 17 | cnfm_unit_price | decimal(18,0) | YES |
| 18 | cnfm_amt | decimal(18,0) | YES |
| 19 | sublet_yn | varchar(max) | YES |
| 20 | sublet_comp_seq | decimal(18,0) | YES |
| 21 | sublet_purc_amt | decimal(18,0) | YES |
| 22 | cr_no | varchar(max) | YES |
| 23 | fms_item_cd | varchar(max) | YES |
| 24 | twc_no | varchar(max) | YES |
| 25 | svc_campg_no | decimal(18,0) | YES |
| 26 | svc_hist_disp_yn | varchar(max) | YES |
| 27 | reg_dt | varchar(max) | YES |
| 28 | reg_user_id | varchar(max) | YES |
| 29 | upd_dt | varchar(max) | YES |
| 30 | upd_user_id | varchar(max) | YES |
| 31 | cr_case_no | int | YES |
| 32 | pkg_yn | varchar(max) | YES |
| 33 | psp_unit_price | decimal(18,0) | YES |
| 34 | psp_amt | decimal(18,0) | YES |
| 35 | add_yn | varchar(max) | YES |
| 36 | psp_code | varchar(max) | YES |
| 37 | pm_code | varchar(max) | YES |
| 38 | pm_seq | decimal(18,0) | YES |
| 39 | auda_yn | varchar(max) | YES |
| 40 | ELT_TIMESTAMP | varchar(100) | YES |
| 41 | BRAND | varchar(20) | YES |

#### dbo.SVC_PROPO_PART  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(max) | YES | 일자 |
| 3 | propo_seq | varchar(max) | YES | 순번 |
| 4 | part_no | varchar(max) | YES | 부품번호 |
| 5 | seq | varchar(max) | YES | 순번 |
| 6 | ro_type_cd | varchar(max) | YES | 유형코드 |
| 7 | settle_type_cd | varchar(max) | YES | 유형코드 |
| 8 | propo_stat_cd | varchar(max) | YES | 상태코드 |
| 9 | stat_cd | varchar(max) | YES | 상태코드 |
| 10 | stat_chng_dt | varchar(max) | YES | 일자 |
| 11 | rqst_issu_qty | bigint | YES | 수량 |
| 12 | real_issu_qty | bigint | YES | 수량 |
| 13 | sale_unit_price | decimal(18,0) | YES | 가격 |
| 14 | sale_amt | decimal(18,0) | YES | 금액 |
| 15 | dc_amt | decimal(18,0) | YES | 금액 |
| 16 | cnfm_unit_price | decimal(18,0) | YES | 가격 |
| 17 | cnfm_amt | decimal(18,0) | YES | 금액 |
| 18 | grp_no | varchar(max) | YES | 번호 |
| 19 | disp_rank | varchar(max) | YES |  |
| 20 | cr_no | varchar(max) | YES | 번호 |
| 21 | fms_item_cd | varchar(max) | YES | 코드 |
| 22 | svc_campg_no | varchar(max) | YES | 번호 |
| 23 | twc_no | varchar(max) | YES | 번호 |
| 24 | order_no | varchar(max) | YES | 주문번호 |
| 25 | order_line_no | varchar(max) | YES | 주문번호 |
| 26 | sout_no | varchar(max) | YES | 번호 |
| 27 | sout_line_no | varchar(max) | YES | 번호 |
| 28 | cancel_yn | varchar(max) | YES | 취소 |
| 29 | income_qty | decimal(18,0) | YES | 수량 |
| 30 | order_qty | decimal(18,0) | YES | 수량 |
| 31 | income_resv_qty | decimal(18,0) | YES | 수량 |
| 32 | resv_clear_qty | decimal(18,0) | YES | 수량 |
| 33 | resv_real_qty | decimal(18,0) | YES | 수량 |
| 34 | rqst_remove_qty | decimal(18,0) | YES | 수량 |
| 35 | resv_dt | varchar(max) | YES | 일자 |
| 36 | resv_seq | varchar(max) | YES | 순번 |
| 37 | remove_yn | varchar(max) | YES | 여부(Y/N) |
| 38 | reject_cd | varchar(max) | YES | 코드 |
| 39 | svc_hist_disp_yn | varchar(max) | YES | 여부(Y/N) |
| 40 | reg_dt | varchar(max) | YES | 등록일 |
| 41 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 42 | upd_dt | varchar(max) | YES | 수정일 |
| 43 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 44 | rcit_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 45 | cr_case_no | varchar(max) | YES | 번호 |
| 46 | pkg_yn | varchar(max) | YES | 여부(Y/N) |
| 47 | psp_unit_price | decimal(18,0) | YES | 가격 |
| 48 | psp_amt | decimal(18,0) | YES | 금액 |
| 49 | add_yn | varchar(max) | YES | 여부(Y/N) |
| 50 | psp_code | varchar(max) | YES | 코드 |
| 51 | pm_code | varchar(max) | YES | 코드 |
| 52 | pm_seq | varchar(max) | YES | 순번 |
| 53 | auda_yn | varchar(max) | YES | 여부(Y/N) |
| 54 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 55 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SVC_RESV  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | resv_dt | varchar(max) | YES |
| 3 | resv_seq | decimal(18,0) | YES |
| 4 | real_resv_date | varchar(max) | YES |
| 5 | real_resv_st_hm | varchar(max) | YES |
| 6 | real_resv_end_hm | varchar(max) | YES |
| 7 | in_expt_dt | varchar(max) | YES |
| 8 | out_expt_dt | varchar(max) | YES |
| 9 | cust_seq | decimal(18,0) | YES |
| 10 | cust_nm | varchar(max) | YES |
| 11 | cust_resv_rel_cd | varchar(max) | YES |
| 12 | resv_cust_nm | varchar(max) | YES |
| 13 | resv_hp_area | varchar(max) | YES |
| 14 | resv_hp_no | varchar(max) | YES |
| 15 | resv_tel_area | varchar(max) | YES |
| 16 | resv_tel_no | varchar(max) | YES |
| 17 | resv_cust_sms_yn | varchar(max) | YES |
| 18 | vehic_exist_yn | varchar(max) | YES |
| 19 | vehic_no1 | varchar(max) | YES |
| 20 | vehic_no2 | varchar(max) | YES |
| 21 | vin | varchar(max) | YES |
| 22 | variant_nm | varchar(max) | YES |
| 23 | svc_model_cd | varchar(max) | YES |
| 24 | model_year | varchar(max) | YES |
| 25 | svc_type_cd | varchar(max) | YES |
| 26 | svc_type_fms_cd | varchar(max) | YES |
| 27 | resv_way_cd | varchar(max) | YES |
| 28 | resv_way_dtl | varchar(max) | YES |
| 29 | resv_stall_no | decimal(18,0) | YES |
| 30 | cust_rqst | varchar(max) | YES |
| 31 | sa_sugst | varchar(max) | YES |
| 32 | stat_cd | varchar(max) | YES |
| 33 | stat_chng_user_id | varchar(max) | YES |
| 34 | stat_chng_dt | varchar(max) | YES |
| 35 | cancel_reason_cd | varchar(max) | YES |
| 36 | cancel_reason | varchar(max) | YES |
| 37 | prev_amt | decimal(18,0) | YES |
| 38 | prev_amt_recv_cust_nm | varchar(max) | YES |
| 39 | prev_amt_recv_way_cd | varchar(max) | YES |
| 40 | prev_amt_stat_cd | varchar(max) | YES |
| 41 | prev_amt_stat_chng_dt | varchar(max) | YES |
| 42 | prev_amt_receipt_key | decimal(18,0) | YES |
| 43 | vip_yn | varchar(max) | YES |
| 44 | cnfm_yn | varchar(max) | YES |
| 45 | wash_yn | varchar(max) | YES |
| 46 | remind_exec_cnt | decimal(18,0) | YES |
| 47 | mng_sa_id | varchar(max) | YES |
| 48 | mng_foreman_id | varchar(max) | YES |
| 49 | mng_sc_id_name | varchar(max) | YES |
| 50 | propo_dt | varchar(max) | YES |
| 51 | propo_seq | decimal(18,0) | YES |
| 52 | reg_dt | varchar(max) | YES |
| 53 | reg_user_id | varchar(max) | YES |
| 54 | upd_dt | varchar(max) | YES |
| 55 | upd_user_id | varchar(max) | YES |
| 56 | cust_loc_cd | varchar(max) | YES |
| 57 | variant_cd | varchar(max) | YES |
| 58 | order_dt | varchar(max) | YES |
| 59 | order_no | varchar(max) | YES |
| 60 | paid_prev_amt | decimal(18,0) | YES |
| 61 | used_prev_amt | decimal(18,0) | YES |
| 62 | prev_amt_remarks | varchar(max) | YES |
| 63 | prev_amt_close_dt | varchar(max) | YES |
| 64 | prev_amt_close_user_id | varchar(max) | YES |
| 65 | em_yn | varchar(max) | YES |
| 66 | resv_ildp_seq | decimal(18,0) | YES |
| 67 | esti_type | varchar(max) | YES |
| 68 | repeat_repair | varchar(max) | YES |
| 69 | repaet_alarm | varchar(max) | YES |
| 70 | cust_repair_req | varchar(max) | YES |
| 71 | entry_talk_send_time | varchar(max) | YES |
| 72 | entry_talk_mseq | bigint | YES |
| 73 | ELT_TIMESTAMP | varchar(100) | YES |
| 74 | BRAND | varchar(20) | YES |

#### dbo.SVC_SERVICE_KPI_ELEMENT_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | up_group_id | varchar(max) | YES | 식별자(ID) |
| 2 | yyyy_mm | varchar(max) | YES |  |
| 3 | gr_sa_lv1 | decimal(18,2) | YES |  |
| 4 | gr_sa_lv2 | decimal(18,2) | YES |  |
| 5 | gr_sa_non_certi | decimal(18,2) | YES |  |
| 6 | gr_tech_toyota | decimal(18,2) | YES |  |
| 7 | gr_tech_pro | decimal(18,2) | YES |  |
| 8 | gr_tech_dia | decimal(18,2) | YES |  |
| 9 | gr_tech_dia_master | decimal(18,2) | YES |  |
| 10 | gr_tech_non_certi | decimal(18,2) | YES |  |
| 11 | bp_sa | decimal(18,2) | YES |  |
| 12 | bp_tech_body | decimal(18,2) | YES |  |
| 13 | bp_tech_paint | decimal(18,2) | YES |  |
| 14 | as_other | decimal(18,2) | YES |  |
| 15 | cbp_num_cp | decimal(18,2) | YES |  |
| 16 | cbp_num_wt | decimal(18,2) | YES |  |
| 17 | cbp_num_in | decimal(18,2) | YES |  |
| 18 | cbp_amt_cp | decimal(18,2) | YES |  |
| 19 | cbp_amt_wt | decimal(18,2) | YES |  |
| 20 | cbp_amt_in | decimal(18,2) | YES |  |
| 21 | other_amt_parts_sale | decimal(18,2) | YES | 판매 |
| 22 | other_num_rr | decimal(18,2) | YES |  |
| 23 | other_hour_gr_tech | decimal(18,2) | YES |  |
| 24 | other_hour_bp_tech | decimal(18,2) | YES |  |
| 25 | other_salary_gr_tech | decimal(18,2) | YES |  |
| 26 | other_salary_bp_tech | decimal(18,2) | YES |  |
| 27 | other_num_target_call | decimal(18,2) | YES |  |
| 28 | other_num_tried_call | decimal(18,2) | YES |  |
| 29 | other_num_contac_call | decimal(18,2) | YES |  |
| 30 | other_appoint_rate | decimal(18,2) | YES |  |
| 31 | other_no_show_rate | decimal(18,2) | YES |  |
| 32 | body_toyota_technician | decimal(18,2) | YES |  |
| 33 | body_pro_technician | decimal(18,2) | YES |  |
| 34 | body_master_technician | decimal(18,2) | YES |  |
| 35 | body_non_certified | decimal(18,2) | YES |  |
| 36 | paint_toyota_technician | decimal(18,2) | YES |  |
| 37 | paint_pro_technician | decimal(18,2) | YES |  |
| 38 | paint_master_technician | decimal(18,2) | YES |  |
| 39 | paint_non_certified | decimal(18,2) | YES |  |
| 40 | gr_sa_total | decimal(18,2) | YES |  |
| 41 | gr_sa_toyota | decimal(18,2) | YES |  |
| 42 | gr_sa_pro | decimal(18,2) | YES |  |
| 43 | gr_sa_master | decimal(18,2) | YES |  |
| 44 | gr_tech_total | decimal(18,2) | YES |  |
| 45 | bp_sa_total | decimal(18,2) | YES |  |
| 46 | bp_sa_toyota | decimal(18,2) | YES |  |
| 47 | bp_sa_pro | decimal(18,2) | YES |  |
| 48 | bp_sa_master | decimal(18,2) | YES |  |
| 49 | bp_sa_non_certi | decimal(18,2) | YES |  |
| 50 | stall_gs | decimal(18,2) | YES |  |
| 51 | stall_bp | decimal(18,2) | YES |  |
| 52 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 53 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.SVC_SETTLE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | ro_type_cd | varchar(max) | YES |
| 5 | settle_dt | varchar(max) | YES |
| 6 | settle_user_id | varchar(max) | YES |
| 7 | sale_labor_amt | decimal(18,0) | YES |
| 8 | sale_part_amt | decimal(18,0) | YES |
| 9 | sale_sublet_amt | decimal(18,0) | YES |
| 10 | dc_labor_amt | decimal(18,0) | YES |
| 11 | dc_part_amt | decimal(18,0) | YES |
| 12 | dc_sublet_amt | decimal(18,0) | YES |
| 13 | cnfm_labor_amt | decimal(18,0) | YES |
| 14 | cnfm_part_amt | decimal(18,0) | YES |
| 15 | cnfm_sublet_amt | decimal(18,0) | YES |
| 16 | vat_yn | varchar(max) | YES |
| 17 | vat | decimal(18,0) | YES |
| 18 | cnfm_tot_amt | decimal(18,0) | YES |
| 19 | fms_type | varchar(max) | YES |
| 20 | dc_seq | decimal(18,0) | YES |
| 21 | stat_cd | varchar(max) | YES |
| 22 | stat_chng_dt | varchar(max) | YES |
| 23 | stat_chng_user_id | varchar(max) | YES |
| 24 | receipt_date | varchar(max) | YES |
| 25 | receipt_user_id | varchar(max) | YES |
| 26 | ar_cancel_yn | varchar(max) | YES |
| 27 | ar_cancel_dt | varchar(max) | YES |
| 28 | receipt_key | decimal(18,0) | YES |
| 29 | ar_key | decimal(18,0) | YES |
| 30 | reg_dt | varchar(max) | YES |
| 31 | reg_user_id | varchar(max) | YES |
| 32 | upd_dt | varchar(max) | YES |
| 33 | upd_user_id | varchar(max) | YES |
| 34 | dc_reason | varchar(max) | YES |
| 35 | addservice_yn | varchar(max) | YES |
| 36 | psp_labor_amt | decimal(18,0) | YES |
| 37 | psp_part_amt | decimal(18,0) | YES |
| 38 | psp_sublet_amt | decimal(18,0) | YES |
| 39 | psp_tot_amt | decimal(18,0) | YES |
| 40 | psp_vat | decimal(18,0) | YES |
| 41 | ELT_TIMESTAMP | varchar(100) | YES |
| 42 | BRAND | varchar(20) | YES |

#### dbo.SVC_TECH_WORKTIME  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | work_date | varchar(max) | YES |
| 3 | techman_id | varchar(max) | YES |
| 4 | work_hour | decimal(18,5) | YES |
| 5 | work_type_cd | varchar(max) | YES |
| 6 | work_st_hm | varchar(max) | YES |
| 7 | work_end_mh | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | over_hour | decimal(18,5) | YES |
| 14 | off_work_type | varchar(max) | YES |
| 15 | ELT_TIMESTAMP | varchar(100) | YES |
| 16 | BRAND | varchar(20) | YES |

#### dbo.VS_MODEL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(max) | YES |
| 2 | model_cd | varchar(max) | YES |
| 3 | model_nm | varchar(max) | YES |
| 4 | curr_sales_yn | varchar(max) | YES |
| 5 | display_order | decimal(18,0) | YES |
| 6 | reg_dt | varchar(max) | YES |
| 7 | upd_dt | varchar(max) | YES |
| 8 | reg_user_id | varchar(max) | YES |
| 9 | upd_user_id | varchar(max) | YES |
| 10 | ELT_TIMESTAMP | varchar(100) | YES |
| 11 | BRAND | varchar(20) | YES |

#### dbo.VS_SFX  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(max) | YES |
| 2 | model_cd | varchar(max) | YES |
| 3 | variant_cd | varchar(max) | YES |
| 4 | my_cd | varchar(max) | YES |
| 5 | sfx_cd | varchar(max) | YES |
| 6 | brand_nm | varchar(max) | YES |
| 7 | model_nm | varchar(max) | YES |
| 8 | variant_nm | varchar(max) | YES |
| 9 | model_year | varchar(max) | YES |
| 10 | sfx_nm | varchar(max) | YES |
| 11 | curr_sales_yn | varchar(max) | YES |
| 12 | display_order | decimal(18,0) | YES |
| 13 | launch_dt | varchar(max) | YES |
| 14 | form_apply | varchar(max) | YES |
| 15 | motive_type | varchar(max) | YES |
| 16 | taking_fix | varchar(max) | YES |
| 17 | displacement | varchar(max) | YES |
| 18 | hp | varchar(max) | YES |
| 19 | gross_weight | varchar(max) | YES |
| 20 | cylinder_cnt | decimal(18,0) | YES |
| 21 | max_load | varchar(max) | YES |
| 22 | max_output | decimal(18,0) | YES |
| 23 | length | decimal(18,0) | YES |
| 24 | width | decimal(18,0) | YES |
| 25 | height | decimal(18,0) | YES |
| 26 | order_yn | varchar(max) | YES |
| 27 | reg_dt | varchar(max) | YES |
| 28 | upd_dt | varchar(max) | YES |
| 29 | hybrid_yn | varchar(max) | YES |
| 30 | navi_yn | varchar(max) | YES |
| 31 | ecfrnd_vhcle_knd | varchar(max) | YES |
| 32 | grade | varchar(max) | YES |
| 33 | connected_car_yn | varchar(max) | YES |
| 34 | spec_variant_nm | varchar(max) | YES |
| 35 | hi_pass_yn | varchar(max) | YES |
| 36 | black_box_yn | varchar(max) | YES |
| 37 | consign_sales_flag | varchar(max) | YES |
| 38 | ew_yn | varchar(max) | YES |
| 39 | dcm_type | varchar(max) | YES |
| 40 | ELT_TIMESTAMP | varchar(100) | YES |
| 41 | BRAND | varchar(20) | YES |

#### dbo.VS_VARIANT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | brand_cd | varchar(max) | YES |
| 2 | model_cd | varchar(max) | YES |
| 3 | variant_cd | varchar(max) | YES |
| 4 | variant_key | varchar(max) | YES |
| 5 | moct_car_type | varchar(max) | YES |
| 6 | variant_nm | varchar(max) | YES |
| 7 | sales_yn | varchar(max) | YES |
| 8 | order_yn | varchar(max) | YES |
| 9 | mon_target_cd | varchar(max) | YES |
| 10 | svc_model_cd | varchar(max) | YES |
| 11 | svc_model_desc | varchar(max) | YES |
| 12 | if_variant_nm | varchar(max) | YES |
| 13 | warranty_month | decimal(18,0) | YES |
| 14 | display_order | decimal(18,0) | YES |
| 15 | reg_dt | varchar(max) | YES |
| 16 | reg_user_id | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | upd_user_id | varchar(max) | YES |
| 19 | daily_report_variant_cd | varchar(max) | YES |
| 20 | daily_report_yn | varchar(max) | YES |
| 21 | prod_loc | varchar(max) | YES |
| 22 | report_variant_nm | varchar(max) | YES |
| 23 | report_display_order | decimal(18,0) | YES |
| 24 | pre_variant_nm | varchar(max) | YES |
| 25 | ecrb_variant_nm | varchar(max) | YES |
| 26 | hybrid_yn | varchar(max) | YES |
| 27 | spec_variant_nm | varchar(max) | YES |
| 28 | variant_cd_jpn | varchar(max) | YES |
| 29 | grade | varchar(max) | YES |
| 30 | concern_mdl_yn | varchar(max) | YES |
| 31 | fuel_type_cd | varchar(max) | YES |
| 32 | ELT_TIMESTAMP | varchar(100) | YES |
| 33 | BRAND | varchar(20) | YES |

#### dbo.VT_DAILY_SALES_TREND  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | eod_month | varchar(max) | YES |  |
| 2 | rs_co_type | varchar(max) | YES | 유형코드 |
| 3 | dealer_id | varchar(max) | YES | 딜러 ID |
| 4 | brand_cd | varchar(max) | YES | 브랜드 |
| 5 | model_cd | varchar(max) | YES | 모델 코드 |
| 6 | variant_cd | varchar(max) | YES | 바리에이션 |
| 7 | rs_01 | decimal(18,0) | YES |  |
| 8 | rs_02 | decimal(18,0) | YES |  |
| 9 | rs_03 | decimal(18,0) | YES |  |
| 10 | rs_04 | decimal(18,0) | YES |  |
| 11 | rs_05 | decimal(18,0) | YES |  |
| 12 | rs_06 | decimal(18,0) | YES |  |
| 13 | rs_07 | decimal(18,0) | YES |  |
| 14 | rs_08 | decimal(18,0) | YES |  |
| 15 | rs_09 | decimal(18,0) | YES |  |
| 16 | rs_10 | decimal(18,0) | YES |  |
| 17 | rs_11 | decimal(18,0) | YES |  |
| 18 | rs_12 | decimal(18,0) | YES |  |
| 19 | rs_13 | decimal(18,0) | YES |  |
| 20 | rs_14 | decimal(18,0) | YES |  |
| 21 | rs_15 | decimal(18,0) | YES |  |
| 22 | rs_16 | decimal(18,0) | YES |  |
| 23 | rs_17 | decimal(18,0) | YES |  |
| 24 | rs_18 | decimal(18,0) | YES |  |
| 25 | rs_19 | decimal(18,0) | YES |  |
| 26 | rs_20 | decimal(18,0) | YES |  |
| 27 | rs_21 | decimal(18,0) | YES |  |
| 28 | rs_22 | decimal(18,0) | YES |  |
| 29 | rs_23 | decimal(18,0) | YES |  |
| 30 | rs_24 | decimal(18,0) | YES |  |
| 31 | rs_25 | decimal(18,0) | YES |  |
| 32 | rs_26 | decimal(18,0) | YES |  |
| 33 | rs_27 | decimal(18,0) | YES |  |
| 34 | rs_28 | decimal(18,0) | YES |  |
| 35 | rs_29 | decimal(18,0) | YES |  |
| 36 | rs_30 | decimal(18,0) | YES |  |
| 37 | rs_31 | decimal(18,0) | YES |  |
| 38 | rs_last | decimal(18,0) | YES |  |
| 39 | target_01 | decimal(18,0) | YES |  |
| 40 | target_02 | decimal(18,0) | YES |  |
| 41 | target_03 | decimal(18,0) | YES |  |
| 42 | target_04 | decimal(18,0) | YES |  |
| 43 | target_05 | decimal(18,0) | YES |  |
| 44 | target_06 | decimal(18,0) | YES |  |
| 45 | target_07 | decimal(18,0) | YES |  |
| 46 | target_08 | decimal(18,0) | YES |  |
| 47 | target_09 | decimal(18,0) | YES |  |
| 48 | target_10 | decimal(18,0) | YES |  |
| 49 | target_11 | decimal(18,0) | YES |  |
| 50 | target_12 | decimal(18,0) | YES |  |
| 51 | target_13 | decimal(18,0) | YES |  |
| 52 | target_14 | decimal(18,0) | YES |  |
| 53 | target_15 | decimal(18,0) | YES |  |
| 54 | target_16 | decimal(18,0) | YES |  |
| 55 | target_17 | decimal(18,0) | YES |  |
| 56 | target_18 | decimal(18,0) | YES |  |
| 57 | target_19 | decimal(18,0) | YES |  |
| 58 | target_20 | decimal(18,0) | YES |  |
| 59 | target_21 | decimal(18,0) | YES |  |
| 60 | target_22 | decimal(18,0) | YES |  |
| 61 | target_23 | decimal(18,0) | YES |  |
| 62 | target_24 | decimal(18,0) | YES |  |
| 63 | target_25 | decimal(18,0) | YES |  |
| 64 | target_26 | decimal(18,0) | YES |  |
| 65 | target_27 | decimal(18,0) | YES |  |
| 66 | target_28 | decimal(18,0) | YES |  |
| 67 | target_29 | decimal(18,0) | YES |  |
| 68 | target_30 | decimal(18,0) | YES |  |
| 69 | target_31 | decimal(18,0) | YES |  |
| 70 | target_last | decimal(18,0) | YES |  |
| 71 | reg_dt | varchar(max) | YES | 등록일 |
| 72 | upd_dt | varchar(max) | YES | 수정일 |
| 73 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 74 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo.VT_MONTHLY_NENKEI  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | year_text | varchar(500) | YES |
| 2 | dealer | varchar(500) | YES |
| 3 | Nenkei | decimal(18,6) | YES |

#### dbo.VT_MONTHLY_TARGET_EXCEL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | model | varchar(500) | YES |
| 2 | section | varchar(500) | YES |
| 3 | BRAND | varchar(100) | YES |
| 4 | dateby | date | YES |
| 5 | target_q | decimal(18,0) | YES |
| 6 | ETL_TIMESTAMP | datetime2 | YES |

#### dbo.VT_VEHIC_SUPPLY  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vehic_magic | decimal(18,0) | YES | 차량 |
| 2 | vin | varchar(max) | YES | 차대번호(VIN) |
| 3 | dealer_id | varchar(max) | YES | 딜러 ID |
| 4 | brand_cd | varchar(max) | YES | 브랜드 |
| 5 | model_cd | varchar(max) | YES | 모델 코드 |
| 6 | variant_cd | varchar(max) | YES | 바리에이션 |
| 7 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 8 | my_cd | varchar(max) | YES | 코드 |
| 9 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 10 | progress | varchar(max) | YES |  |
| 11 | stock_status | varchar(max) | YES | 재고 |
| 12 | port_in_pdt | varchar(max) | YES |  |
| 13 | port_in_adt | varchar(max) | YES |  |
| 14 | al_status | varchar(max) | YES | 상태코드 |
| 15 | upd_dt | varchar(max) | YES | 수정일 |
| 16 | ELT_TIMESTAMP | varchar(100) | YES | ETL 적재시각 |
| 17 | BRAND | varchar(20) | YES | 브랜드 |

#### dbo._Measure  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | 측정값 | int | YES |

#### ktws.DIM_ACTIVITY_TYPE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | ACTIVITY_TYPE_CD | varchar(500) | YES |
| 2 | ACTIVITY_TYPE | varchar(500) | YES |
| 3 | ACTIVITY_TYPE_SUB | varchar(500) | YES |
| 4 | BRAND | varchar(500) | YES |
| 5 | ETL_TIMESTAMP | datetime2 | YES |
| 6 | ACT_KEY | varchar(200) | YES |

#### ktws.DIM_BRAND  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND_NM | varchar(100) | YES |
| 2 | BRAND_CD | varchar(100) | YES |

#### ktws.DIM_CALENDAR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | Date | date | YES |
| 2 | Year | int | YES |
| 3 | QuarterNumber | int | YES |
| 4 | MonthNumber | int | YES |
| 5 | Day | int | YES |
| 6 | DayName | varchar(500) | YES |
| 7 | WeekNumber | int | YES |
| 8 | WeekNumber_Monthly | varchar(100) | YES |
| 9 | WeekNumber_Monthly_txt | varchar(100) | YES |
| 10 | QuarterText | varchar(500) | YES |
| 11 | MonthName | varchar(500) | YES |
| 12 | MonthAbbr | varchar(500) | YES |
| 13 | WeekdayName | varchar(500) | YES |
| 14 | WeekdayAbbr | varchar(500) | YES |
| 15 | YearMonth | varchar(500) | YES |
| 16 | WeekdayNumber | int | YES |

#### ktws.DIM_CALENDAR_KTWS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | Date | date | YES |
| 2 | Year | int | YES |
| 3 | YearName | varchar(50) | YES |
| 4 | QuarterNumber | int | YES |
| 5 | MonthNumber | int | YES |
| 6 | Day | int | YES |
| 7 | DayName | varchar(500) | YES |
| 8 | WeekNumber | int | YES |
| 9 | WeekNumber_Monthly | varchar(100) | YES |
| 10 | WeekNumber_Monthly_txt | varchar(100) | YES |
| 11 | QuarterText | varchar(500) | YES |
| 12 | MonthName | varchar(500) | YES |
| 13 | MonthAbbr | varchar(500) | YES |
| 14 | WeekdayName | varchar(500) | YES |
| 15 | WeekdayAbbr | varchar(500) | YES |
| 16 | YearMonth | varchar(500) | YES |
| 17 | WeekdayNumber | int | YES |
| 18 | kr_holiday | varchar(10) | YES |

#### ktws.DIM_CO_BI_LOGO

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND_NM | varchar(max) | YES |
| 2 | FILE_TP | varchar(max) | YES |
| 3 | FILE_NM | varchar(max) | YES |
| 4 | IMG_CD | varchar(max) | YES |
| 5 | REG_DT | datetime2 | YES |

#### ktws.DIM_CRM_ACT_TYPE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | category | varchar(100) | YES |
| 2 | tp_cd | varchar(100) | YES |
| 3 | tp_nm | varchar(100) | YES |
| 4 | tp_order | int | YES |
| 5 | ref_tp_cd | varchar(100) | YES |
| 6 | ref_tp_nm | varchar(100) | YES |
| 7 | ref_tp_order | varchar(100) | YES |
| 8 | tp_key | varchar(100) | YES |
| 9 | tp_grp_1 | varchar(100) | YES |
| 10 | tp_grp_2 | varchar(100) | YES |
| 11 | target_grp_nm | varchar(200) | YES |
| 12 | common_tp_nm | varchar(100) | YES |
| 13 | BRAND | varchar(100) | YES |
| 14 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.DIM_CRM_ACT_TYPE_ORDER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | tp_grp_1 | varchar(100) | YES |  |
| 2 | tp_grp_1_order | int | YES | 주문 |
| 3 | tp_grp_2 | varchar(100) | YES |  |
| 4 | tp_grp_2_order | int | YES | 주문 |
| 5 | common_tp_nm | varchar(100) | YES | 명칭 |
| 6 | tp_order | int | YES | 주문 |

#### ktws.DIM_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | SUB_DEALER_ID | varchar(500) | YES | 딜러 ID |
| 2 | SUB_DEALER_NM | varchar(500) | YES | 딜러 |
| 3 | DEALER_ID | varchar(500) | YES | 딜러 ID |
| 4 | DEALER_NM | varchar(500) | YES | 딜러 |
| 5 | BRAND | varchar(500) | YES | 브랜드 |
| 6 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |
| 7 | DLR_KEY | varchar(200) | YES |  |

#### ktws.DIM_MNG_ACCESS_USER  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(100) | YES |
| 2 | sc_key | varchar(100) | YES |
| 3 | name | varchar(100) | YES |
| 4 | email | varchar(100) | YES |
| 5 | title | varchar(100) | YES |
| 6 | dealer_key | varchar(200) | YES |
| 7 | dealer_id | varchar(100) | YES |
| 8 | dealer_nm | varchar(100) | YES |
| 9 | BRAND | varchar(100) | YES |
| 10 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.DIM_MNG_DEALER  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | dealer_key | varchar(200) | YES | 딜러 |
| 2 | dealer_id | varchar(100) | YES | 딜러 ID |
| 3 | dealer_nm | varchar(100) | YES | 딜러 |
| 4 | dealer_nm_indx | varchar(100) | YES | 딜러 |
| 5 | BRAND | varchar(100) | YES | 브랜드 |
| 6 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.DIM_MNG_USER  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(100) | YES |
| 2 | sc_key | varchar(100) | YES |
| 3 | name | varchar(100) | YES |
| 4 | birth_dt | date | YES |
| 5 | age_grp | varchar(100) | YES |
| 6 | work_start_dt | date | YES |
| 7 | profile_url | varchar(5000) | YES |
| 8 | email | varchar(100) | YES |
| 9 | title | varchar(100) | YES |
| 10 | dept_cd | varchar(100) | YES |
| 11 | dept_nm | varchar(100) | YES |
| 12 | group_id | varchar(100) | YES |
| 13 | group_name | varchar(100) | YES |
| 14 | dealer_key | varchar(200) | YES |
| 15 | dealer_id | varchar(100) | YES |
| 16 | dealer_nm | varchar(100) | YES |
| 17 | dealer_nm_indx | varchar(100) | YES |
| 18 | BRAND | varchar(100) | YES |
| 19 | active_yn | varchar(10) | YES |
| 20 | ETL_TIMESTAMP | datetime2 | YES |
| 21 | facade_sc_yn | varchar(10) | YES |

#### ktws.DIM_MODEL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | VARIANT_CD | varchar(500) | YES |
| 2 | VARIANT_NM | varchar(500) | YES |
| 3 | VAR_KEY | varchar(500) | YES |
| 4 | MODEL_CD | varchar(500) | YES |
| 5 | MODEL_NM | varchar(500) | YES |
| 6 | MDL_KEY | varchar(500) | YES |
| 7 | BRAND | varchar(500) | YES |
| 8 | SALES_YN | varchar(20) | YES |
| 9 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.DIM_MODEL_T  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | MODEL_CD | varchar(500) | YES |
| 2 | MODEL_NM | varchar(500) | YES |
| 3 | MDL_KEY | varchar(500) | YES |
| 4 | BRAND | varchar(500) | YES |
| 5 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.DIM_PMA_ORDER

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | pma_type | varchar(20) | YES | 유형코드 |
| 2 | pma_cd | varchar(20) | YES | 코드 |
| 3 | pma_order | int | YES | 주문 |

#### ktws.DIM_REPURC_SALES_TYPE  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | BRAND | varchar(100) | YES | 브랜드 |
| 2 | code | varchar(500) | YES | 코드 |
| 3 | repurc_grp1 | varchar(500) | YES |  |
| 4 | repurc_grp2 | varchar(500) | YES |  |
| 5 | sales_tp | varchar(500) | YES | 판매 |
| 6 | sales_tp_key | varchar(500) | YES | 판매 |
| 7 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.DIM_VEHIC_SPEC

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | model_cd | varchar(100) | YES | 모델 코드 |
| 2 | model_nm | varchar(200) | YES | 모델 |
| 3 | variant_cd | varchar(200) | YES | 바리에이션 |
| 4 | variant_nm | varchar(200) | YES | 바리에이션 |
| 5 | my_cd | varchar(200) | YES | 코드 |
| 6 | sfx_cd | varchar(200) | YES | SFX(트림) |
| 7 | grade | varchar(200) | YES |  |
| 8 | brand_nm | varchar(200) | YES | 브랜드 |
| 9 | daily_report_yn | varchar(10) | YES | 여부(Y/N) |
| 10 | curr_sales_yn | varchar(10) | YES | 판매 |
| 11 | sales_yn | varchar(10) | YES | 판매 |
| 12 | order_yn | varchar(10) | YES | 주문 |
| 13 | concern_mdl_yn | varchar(10) | YES | 여부(Y/N) |
| 14 | var_key | varchar(200) | YES |  |
| 15 | spec_key | varchar(200) | YES |  |
| 16 | BRAND | varchar(100) | YES | 브랜드 |
| 17 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.DIM_VEHIC_SPEC_MDL

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | model_cd | varchar(100) | YES | 모델 코드 |
| 2 | model_nm | varchar(200) | YES | 모델 |
| 3 | mdl_key | varchar(200) | YES |  |
| 4 | BRAND | varchar(100) | YES | 브랜드 |
| 5 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.DIM_VEHIC_SPEC_VAR

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | model_cd | varchar(100) | YES | 모델 코드 |
| 2 | model_nm | varchar(200) | YES | 모델 |
| 3 | variant_cd | varchar(200) | YES | 바리에이션 |
| 4 | variant_nm | varchar(200) | YES | 바리에이션 |
| 5 | model_key | varchar(200) | YES | 모델 |
| 6 | var_key | varchar(200) | YES |  |
| 7 | BRAND | varchar(100) | YES | 브랜드 |
| 8 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.EXTRACTION_TIME  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | ELT_TIME | datetime2 | YES |
| 2 | ETL_TIME | datetime2 | YES |

#### ktws.FCT_ACTIVITY  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DEALER_ID | varchar(500) | YES |
| 2 | USER_ID | varchar(500) | YES |
| 3 | CUST_SEQ | varchar(500) | YES |
| 4 | CUST_REG_DT | date | YES |
| 5 | ACTIVITY_CD | varchar(500) | YES |
| 6 | CONCERN_DEGREE | varchar(500) | YES |
| 7 | CONCERN_MDL | varchar(500) | YES |
| 8 | TESTCAR_DT1 | date | YES |
| 9 | TESTCAR_DT2 | date | YES |
| 10 | TESTCAR_DT3 | date | YES |
| 11 | TESTCAR_DT4 | date | YES |
| 12 | IS_MDL_CHNG | varchar(500) | YES |
| 13 | DLR_CONTRACT_NO | varchar(500) | YES |
| 14 | CONTRACT_PK | varchar(500) | YES |
| 15 | CONTRACT_DT | date | YES |
| 16 | SALES_DT | date | YES |
| 17 | CANCEL_DT | date | YES |
| 18 | BRAND | varchar(500) | YES |
| 19 | ETL_TIMESTAMP | datetime2 | YES |
| 20 | FCTACT_KEY | varchar(200) | YES |
| 21 | DLR_KEY | varchar(200) | YES |
| 22 | ACT_KEY | varchar(200) | YES |
| 23 | VAR_KEY | varchar(200) | YES |

#### ktws.FCT_ACTIVITY_TARGET  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(500) | YES |
| 2 | TARGET_YM | date | YES |
| 3 | MDL_KEY | varchar(500) | YES |
| 4 | T_VAR_CD | varchar(500) | YES |
| 5 | DLR_KEY | varchar(500) | YES |
| 6 | CNTRCT_TARGET_Q | decimal(18,0) | YES |
| 7 | SALES_TARGET_Q | decimal(18,0) | YES |
| 8 | ETL_TIMESTAMP | datetime2 | YES |
| 9 | IS_EXCEL | varchar(500) | YES |

#### ktws.FCT_ACTIVITY_v2

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cnt | int | YES |
| 2 | act_pk | varchar(max) | YES |
| 3 | lead_key | varchar(max) | YES |
| 4 | sc_key | varchar(max) | YES |
| 5 | td_key | varchar(max) | YES |
| 6 | act_tp | varchar(max) | YES |
| 7 | prior_act_tp | varchar(max) | YES |
| 8 | cust_key | varchar(max) | YES |
| 9 | actual_cnt | int | YES |
| 10 | contact_tp | varchar(max) | YES |
| 11 | sr_var_key1 | varchar(max) | YES |
| 12 | sr_var_key2 | varchar(max) | YES |
| 13 | other_comp_brand | varchar(max) | YES |
| 14 | other_comp_model | varchar(max) | YES |
| 15 | owned_car_brand | varchar(max) | YES |
| 16 | owned_car_model | varchar(max) | YES |
| 17 | sr_active_result | varchar(max) | YES |
| 18 | cust_reponse | varchar(max) | YES |
| 19 | tel_yn | varchar(max) | YES |
| 20 | dm_yn | varchar(max) | YES |
| 21 | plan_dt_fr | date | YES |
| 22 | plan_dt_to | date | YES |
| 23 | act_dt_fr | date | YES |
| 24 | act_dt_to | date | YES |
| 25 | del_dt | date | YES |
| 26 | act_result | varchar(max) | YES |
| 27 | name | varchar(max) | YES |
| 28 | act_memo | varchar(max) | YES |
| 29 | sr_remark | varchar(max) | YES |
| 30 | ETL_TIMESTAMP | datetime2 | YES |
| 31 | tp_key | varchar(100) | YES |
| 32 | visit_type | varchar(max) | YES |

#### ktws.FCT_AVAIL_STOCK  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | cnt | int | YES |  |
| 2 | vehic_magic | varchar(200) | YES | 차량 |
| 3 | dealer_key | varchar(200) | YES | 딜러 |
| 4 | spec_key | varchar(200) | YES |  |
| 5 | progress | varchar(200) | YES |  |
| 6 | port_in_adt | date | YES |  |
| 7 | port_in_pdt | date | YES |  |
| 8 | al_status | varchar(200) | YES | 상태코드 |
| 9 | BRAND | varchar(200) | YES | 브랜드 |
| 10 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.FCT_CONTRACT_KTWS

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | cnt | int | YES |  |
| 2 | lead_key | varchar(200) | YES |  |
| 3 | mng_sc_key | varchar(200) | YES |  |
| 4 | tp_key | varchar(100) | YES |  |
| 5 | potential | varchar(200) | YES |  |
| 6 | cn_sc_key | varchar(200) | YES |  |
| 7 | dlr_contract_no | varchar(200) | YES | 번호 |
| 8 | contract_no | int | YES | 계약번호 |
| 9 | contract_dt | date | YES | 계약일 |
| 10 | cn_vehic_key | varchar(200) | YES | 차량 |
| 11 | pay_type | varchar(100) | YES | 유형코드 |
| 12 | own_pay_flag | varchar(100) | YES |  |
| 13 | sales_tp_key | varchar(100) | YES | 판매 |
| 14 | cust_nm | varchar(100) | YES | 고객 |
| 15 | pma_yn | varchar(100) | YES | 여부(Y/N) |
| 16 | prime_act_seq | varchar(100) | YES | 순번 |
| 17 | prime_act_fr_dt | date | YES | 일자 |
| 18 | lead_reg_dt | date | YES | 등록일 |
| 19 | cancel_dt | date | YES | 취소일 |
| 20 | delivery_plan_dt | date | YES | 출고일 |
| 21 | last_retail_sales_dt | date | YES | 판매 |
| 22 | sales_in_30days | varchar(1) | YES | 판매 |
| 23 | lead_time | int | YES | 시각 |
| 24 | BRAND | varchar(100) | YES | 브랜드 |
| 25 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.FCT_CRM_TARGET_D

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | mon_key | varchar(100) | YES |
| 2 | day_seq | varchar(100) | YES |
| 3 | sc_key | varchar(100) | YES |
| 4 | type_cd | varchar(100) | YES |
| 5 | daily_dt | date | YES |
| 6 | target_cnt | int | YES |
| 7 | BRAND | varchar(20) | YES |
| 8 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_CRM_TARGET_M

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | mon_key | varchar(100) | YES |
| 2 | sc_key | varchar(100) | YES |
| 3 | monthly_dt | date | YES |
| 4 | target_cnt | int | YES |
| 5 | target_rate | decimal(18,0) | YES |
| 6 | target_multi | decimal(18,0) | YES |
| 7 | tp_key | varchar(100) | YES |
| 8 | BRAND | varchar(20) | YES |
| 9 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_CRM_TARGET_STS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | target_seq | varchar(100) | YES |
| 2 | sc_key | varchar(100) | YES |
| 3 | ym | date | YES |
| 4 | close_yn | varchar(100) | YES |
| 5 | save_yn | varchar(100) | YES |
| 6 | use_yn | varchar(100) | YES |
| 7 | BRAND | varchar(100) | YES |
| 8 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_FORCAST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DATEBY | date | YES |
| 2 | BRAND | varchar(100) | YES |
| 3 | DLR_KEY | varchar(300) | YES |
| 4 | VAR_KEY | varchar(300) | YES |
| 5 | ACT_KEY | varchar(300) | YES |
| 6 | IS_MDL_CHNG | varchar(300) | YES |
| 7 | Remain_Sales | decimal(18,0) | YES |
| 8 | Remain_Activity | decimal(18,0) | YES |
| 9 | Remain_Contract | decimal(18,0) | YES |
| 10 | Remain_Testcar | decimal(18,0) | YES |
| 11 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_FUNNEL_AGGR  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DATEBY | date | YES |
| 2 | BRAND | varchar(500) | YES |
| 3 | DLR_KEY | varchar(500) | YES |
| 4 | VAR_KEY | varchar(500) | YES |
| 5 | ACT_KEY | varchar(500) | YES |
| 6 | IS_MDL_CHNG | varchar(500) | YES |
| 7 | ACTIVITY_CNT | varchar(500) | YES |
| 8 | CONTRACT_CNT | varchar(500) | YES |
| 9 | SALES_CNT | varchar(500) | YES |
| 10 | TESTCAR_CNT | varchar(500) | YES |
| 11 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_FUNNEL_SALES  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | DATEBY | date | YES |  |
| 2 | BRAND | varchar(500) | YES | 브랜드 |
| 3 | DLR_KEY | varchar(500) | YES |  |
| 4 | VAR_KEY | varchar(500) | YES |  |
| 5 | ACT_KEY | varchar(500) | YES |  |
| 6 | IS_MDL_CHNG | varchar(500) | YES |  |
| 7 | ACTIVITY_CNT | varchar(500) | YES |  |
| 8 | ACTIVITY_DT_FLAG | varchar(20) | YES |  |
| 9 | TESTCAR_CNT | varchar(500) | YES |  |
| 10 | TESTCAR_DT_FLAG | varchar(20) | YES |  |
| 11 | CONTRACT_CNT | varchar(500) | YES | 계약 |
| 12 | CONTRACT_FLAG | varchar(20) | YES | 계약 |
| 13 | SALES_CNT | varchar(500) | YES | 판매 |
| 14 | SALES_DT_FLAG | varchar(20) | YES | 판매 |
| 15 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.FCT_HBOARD_MEETING

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | meet_seq | varchar(200) | YES |
| 2 | mng_sc_key | varchar(200) | YES |
| 3 | meet_status | varchar(200) | YES |
| 4 | meet_status_nm | varchar(200) | YES |
| 5 | meet_dt | date | YES |
| 6 | meet_ym_seq | int | YES |
| 7 | lead_id | varchar(200) | YES |
| 8 | hot_reg_dt | date | YES |
| 9 | contact_nm | varchar(200) | YES |
| 10 | owner_nm | varchar(200) | YES |
| 11 | hold_type_cd | varchar(200) | YES |
| 12 | hold_type_nm | varchar(200) | YES |
| 13 | int_var_key | varchar(200) | YES |
| 14 | hboard_reg_dt | date | YES |
| 15 | chip_status_eng | varchar(200) | YES |
| 16 | chip_status_nm | varchar(200) | YES |
| 17 | next_act_seq | varchar(200) | YES |
| 18 | next_hold_tp | varchar(200) | YES |
| 19 | next_plant_dt | date | YES |
| 20 | contract_ratio | varchar(100) | YES |
| 21 | remark | varchar(2000) | YES |
| 22 | mng_remark | varchar(2000) | YES |
| 23 | comp_brand_cd | varchar(100) | YES |
| 24 | comp_brand_nm | varchar(100) | YES |
| 25 | comp_model_cd | varchar(100) | YES |
| 26 | comp_model_nm | varchar(100) | YES |
| 27 | own_brand_cd | varchar(100) | YES |
| 28 | own_brand_nm | varchar(100) | YES |
| 29 | own_model_cd | varchar(100) | YES |
| 30 | own_model_nm | varchar(100) | YES |
| 31 | own_model_pdt | varchar(100) | YES |
| 32 | pay_type_nm | varchar(100) | YES |
| 33 | close_yn | varchar(20) | YES |
| 34 | close_dt | date | YES |
| 35 | BRAND | varchar(20) | YES |
| 36 | ETL_TIMETAMP | datetime2 | YES |

#### ktws.FCT_LEAD

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cnt | int | YES |
| 2 | lead_key | varchar(200) | YES |
| 3 | lead_id | int | YES |
| 4 | cl_sc_key | varchar(200) | YES |
| 5 | cl_act_tp | varchar(200) | YES |
| 6 | ca_act_tp | varchar(200) | YES |
| 7 | tp_key | varchar(100) | YES |
| 8 | cust_nm | varchar(200) | YES |
| 9 | potential | varchar(200) | YES |
| 10 | hot_upd_dt | date | YES |
| 11 | repurc_yn | varchar(200) | YES |
| 12 | in_td_2mon | varchar(20) | YES |
| 13 | int_vehic_key1 | varchar(200) | YES |
| 14 | int_vehic_key2 | varchar(200) | YES |
| 15 | prime_act_seq | varchar(100) | YES |
| 16 | prime_act_fr_dt | date | YES |
| 17 | lead_reg_dt | date | YES |
| 18 | td_yn | varchar(20) | YES |
| 19 | closed_in_mon | varchar(20) | YES |
| 20 | close_dt | date | YES |
| 21 | close_yn | varchar(20) | YES |
| 22 | contract_dt | date | YES |
| 23 | last_retail_sales_dt | date | YES |
| 24 | is_sales_in_mon | varchar(100) | YES |
| 25 | BRAND | varchar(100) | YES |
| 26 | ETL_TIMESTAMP | datetime2 | YES |
| 27 | contract_yn | varchar(20) | YES |
| 28 | last_retail_sales_yn | varchar(20) | YES |
| 29 | int_vehic_variant_key1 | varchar(200) | YES |

#### ktws.FCT_LEAD_HIST  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | lead_key | varchar(200) | YES |
| 2 | hist_seq | decimal(18,0) | YES |
| 3 | potential | varchar(200) | YES |
| 4 | reg_dt | date | YES |
| 5 | hist_reg_dt | date | YES |
| 6 | close_dt | date | YES |
| 7 | hot_upd_dt | date | YES |
| 8 | BRAND | varchar(100) | YES |
| 9 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_MNG_CUST_LIST  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | cust_seq | varchar(100) | YES | 고객 |
| 2 | real_cust_seq | varchar(100) | YES | 고객 |
| 3 | mng_sc_key | varchar(100) | YES |  |
| 4 | BRAND | varchar(100) | YES | 브랜드 |
| 5 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.FCT_MONTHLY_TOTAL_CNTRCT  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | DATEBY | date | YES |
| 2 | BRAND | varchar(500) | YES |
| 3 | DLR_KEY | varchar(500) | YES |
| 4 | VAR_KEY | varchar(500) | YES |
| 5 | ACT_KEY | varchar(500) | YES |
| 6 | IS_MDL_CHNG | varchar(500) | YES |
| 7 | SALES_CNT | decimal(18,0) | YES |
| 8 | CNTRCT_CNT | decimal(18,0) | YES |
| 9 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_NPS

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | sc_key | varchar(100) | YES |
| 2 | nps_seq | decimal(18,0) | YES |
| 3 | biz_area | varchar(100) | YES |
| 4 | ref_key | varchar(100) | YES |
| 5 | reply_date | date | YES |
| 6 | promoter_score | decimal(18,0) | YES |
| 7 | cust_comment | varchar(5000) | YES |
| 8 | BRAND | varchar(100) | YES |
| 9 | ETL_TIMESTAMP | datetime2 | YES |

#### ktws.FCT_SALES_TARGET_DAILY  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | dealer_key | varchar(100) | YES | 딜러 |
| 2 | brand_cd | varchar(10) | YES | 브랜드 |
| 3 | model_key | varchar(100) | YES | 모델 |
| 4 | mon_target_variant | varchar(100) | YES | 바리에이션 |
| 5 | dateby | date | YES |  |
| 6 | ac_trgt | decimal(18,0) | YES |  |
| 7 | co_trgt | decimal(18,0) | YES |  |
| 8 | ac_trgt_daily | decimal(18,0) | YES |  |
| 9 | co_trgt_daily | decimal(18,0) | YES |  |
| 10 | BRAND | varchar(20) | YES | 브랜드 |
| 11 | ETL_TIMESTAMP | datetime2 | YES | ETL 적재시각 |

#### ktws.FCT_SC_GROUP_RULE

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | BRAND | varchar(50) | NO |
| 2 | DEALER_KEY | varchar(50) | NO |
| 3 | METRIC_TYPE | varchar(50) | NO |
| 4 | CALC_TYPE | varchar(20) | NO |
| 5 | OBS_PERIOD | int | NO |
| 6 | OBS_PERIOD_UNIT | varchar(10) | NO |
| 7 | GRP_CATEGORY | varchar(50) | NO |
| 8 | GRP_NAME | varchar(10) | NO |
| 9 | RANGE_FROM | decimal(10,4) | YES |
| 10 | RANGE_TO | decimal(10,4) | YES |
| 11 | NOTE | varchar(255) | YES |
| 12 | ETL_TIMESTAMP | datetime2 | NO |

#### ktws.FCT_TESTDRIVE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | td_cnt | decimal(18,0) | YES |
| 2 | reserved_dt | date | YES |
| 3 | from_time | varchar(200) | YES |
| 4 | testcar_no | varchar(200) | YES |
| 5 | td_key | varchar(200) | YES |
| 6 | td_sc_key | varchar(200) | YES |
| 7 | to_time | varchar(200) | YES |
| 8 | reserve_term | decimal(18,0) | YES |
| 9 | td_completion_dt | date | YES |
| 10 | prev_km | decimal(18,0) | YES |
| 11 | test_type | varchar(200) | YES |
| 12 | use_type | varchar(200) | YES |
| 13 | vin | varchar(200) | YES |
| 14 | td_my_key | varchar(200) | YES |
| 15 | td_var_key | varchar(200) | YES |
| 16 | cust_seq | varchar(200) | YES |
| 17 | res_memo | varchar(max) | YES |
| 18 | destination | varchar(200) | YES |
| 19 | end_km | decimal(18,0) | YES |
| 20 | interest_degree | varchar(200) | YES |
| 21 | purchase_degree | varchar(200) | YES |
| 22 | result_memo | varchar(max) | YES |
| 23 | test_yn | varchar(200) | YES |
| 24 | td_req_online | varchar(200) | YES |
| 25 | view_word | varchar(1000) | YES |
| 26 | lead_key | varchar(200) | YES |
| 27 | tr_cnt | decimal(18,0) | YES |
| 28 | tr_sc_key | varchar(200) | YES |
| 29 | req_seq | varchar(200) | YES |
| 30 | req_reg_dt | date | YES |
| 31 | variant | varchar(200) | YES |
| 32 | tr_var_key | varchar(200) | YES |
| 33 | req_dt | date | YES |
| 34 | req_fr_time | varchar(200) | YES |
| 35 | req_to_time | varchar(200) | YES |
| 36 | inbound_path | varchar(3000) | YES |
| 37 | req_path | varchar(200) | YES |
| 38 | req_memo | varchar(max) | YES |
| 39 | status | varchar(200) | YES |
| 40 | alloc_tp | varchar(200) | YES |
| 41 | ref_cons_seq | varchar(200) | YES |
| 42 | ref_cust_seq | varchar(200) | YES |
| 43 | ref_contract_no | varchar(200) | YES |
| 44 | td_center_yn | varchar(200) | YES |
| 45 | req_close_dt | date | YES |
| 46 | request_path | varchar(200) | YES |
| 47 | event_type | varchar(200) | YES |
| 48 | interest_brand | varchar(200) | YES |
| 49 | interest_variant | varchar(200) | YES |
| 50 | cons_fail_dt | date | YES |
| 51 | BRAND | varchar(100) | YES |
| 52 | ETL_TIMESTAMP | datetime2 | YES |

#### log.PipelineFailureLog  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | log_id | int | NO |
| 2 | std_time | date | YES |
| 3 | pipeline_id | varchar(100) | YES |
| 4 | pipeline_name | varchar(200) | YES |
| 5 | activity_name | varchar(200) | YES |
| 6 | source_schema | varchar(200) | YES |
| 7 | source_table | varchar(200) | YES |
| 8 | brand | varchar(200) | YES |
| 9 | started_time | datetime2 | YES |
| 10 | failed_time | datetime2 | YES |
| 11 | error_type | varchar(max) | YES |
| 12 | error_code | varchar(max) | YES |
| 13 | error_message | varchar(4000) | YES |

#### log.dboTableMaxDateLog  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | STD_DATE | varchar(max) | YES |
| 2 | SOURCE_SCHEMA | varchar(max) | YES |
| 3 | TABLE_NM | varchar(max) | YES |
| 4 | DELTA_COLUM | varchar(max) | YES |
| 5 | MAX_DT | varchar(max) | YES |
| 6 | BRAND | varchar(max) | YES |
| 7 | ELT_TIMESTAMP | varchar(max) | YES |

#### meta.META_TABLE  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_nm | varchar(100) | YES |
| 2 | source_table | varchar(100) | YES |
| 3 | target_schema | varchar(100) | YES |
| 4 | target_table | varchar(100) | YES |
| 5 | load_type | varchar(20) | YES |
| 6 | delta_column | varchar(100) | YES |
| 7 | pk_columns | varchar(500) | YES |
| 8 | load_frequency | varchar(20) | YES |
| 9 | is_active | varchar(1) | YES |
| 10 | is_active_bit | bit | YES |
| 11 | is_agora | varchar(20) | YES |
| 12 | is_agora_bit | bit | YES |
| 13 | comment | varchar(1000) | YES |
| 14 | source_schema | varchar(100) | YES |
| 15 | target_schema_stg | varchar(100) | YES |

#### meta.META_TABLE_COL  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | table_nm | varchar(100) | YES |
| 2 | column_order | varchar(100) | YES |
| 3 | column_order_no | int | YES |
| 4 | column_nm | varchar(100) | YES |
| 5 | data_type | varchar(100) | YES |
| 6 | is_pk | varchar(1) | YES |
| 7 | is_pk_bit | bit | YES |
| 8 | is_active | varchar(1) | YES |
| 9 | is_active_bit | bit | YES |

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

#### stg.co_calendar  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | base_dt | varchar(max) | YES |
| 2 | week_no_by_month | decimal(18,0) | YES |
| 3 | week_day | varchar(max) | YES |
| 4 | work_korea | varchar(max) | YES |
| 5 | work_overseas | varchar(max) | YES |
| 6 | work_dealer | varchar(max) | YES |
| 7 | work_hq | varchar(max) | YES |
| 8 | work_cpd | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | elt_timestamp | varchar(100) | YES |
| 14 | brand | varchar(20) | YES |

#### stg.co_code  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_type_nm | varchar(max) | YES |
| 4 | code_nm | varchar(max) | YES |
| 5 | eng_code_nm | varchar(max) | YES |
| 6 | display_order | varchar(max) | YES |
| 7 | up_code_type | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.co_code_dev  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_type_nm | varchar(max) | YES |
| 4 | code_nm | varchar(max) | YES |
| 5 | eng_code_nm | varchar(max) | YES |
| 6 | display_order | varchar(max) | YES |
| 7 | up_code_type | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.co_group  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | group_name | varchar(max) | YES |
| 3 | group_full_name | varchar(max) | YES |
| 4 | group_type | varchar(max) | YES |
| 5 | chief_name | varchar(max) | YES |
| 6 | chief_id | varchar(max) | YES |
| 7 | biz_reg_no | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | pdi_area | varchar(max) | YES |
| 12 | cpd_area | varchar(max) | YES |
| 13 | found_dt | varchar(max) | YES |
| 14 | showroom_no | decimal(18,0) | YES |
| 15 | kaida_group_id | varchar(max) | YES |
| 16 | fee_delivery | decimal(18,0) | YES |
| 17 | fee_transfer | decimal(18,0) | YES |
| 18 | service_yn | varchar(max) | YES |
| 19 | service_ip | varchar(max) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(max) | YES |
| 23 | group_short_name | varchar(max) | YES |
| 24 | group_area | varchar(max) | YES |
| 25 | stock_value_type | varchar(max) | YES |
| 26 | usage_type | varchar(max) | YES |
| 27 | tmkr_service_cd | varchar(max) | YES |
| 28 | tmkr_parts_cd | varchar(max) | YES |
| 29 | tmkr_sales_cd | varchar(max) | YES |
| 30 | tmc_service_cd | varchar(max) | YES |
| 31 | tmc_parts_cd | varchar(max) | YES |
| 32 | tmc_sales_cd | varchar(max) | YES |
| 33 | up_group_id | varchar(max) | YES |
| 34 | system_use_yn | varchar(max) | YES |
| 35 | dealer_yn | varchar(max) | YES |
| 36 | shop_yn | varchar(max) | YES |
| 37 | highest_group_yn | varchar(max) | YES |
| 38 | use_yn | varchar(max) | YES |
| 39 | photo_file_dir | varchar(max) | YES |
| 40 | org_id | decimal(18,0) | YES |
| 41 | set_of_books_id | decimal(18,0) | YES |
| 42 | location_id | decimal(18,0) | YES |
| 43 | reg_user_id | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | upd_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | dealer_id | varchar(max) | YES |
| 48 | ci_image_id | varchar(max) | YES |
| 49 | tel_area | varchar(max) | YES |
| 50 | tel_no | varchar(max) | YES |
| 51 | fax_area | varchar(max) | YES |
| 52 | fax_no | varchar(max) | YES |
| 53 | biz_type_nm | varchar(max) | YES |
| 54 | biz_cond_nm | varchar(max) | YES |
| 55 | sms_name | varchar(max) | YES |
| 56 | svc_sms_no | varchar(max) | YES |
| 57 | new_tmkr_parts_cd | varchar(max) | YES |
| 58 | new_tmc_parts_cd | varchar(max) | YES |
| 59 | svc_reg_no | varchar(max) | YES |
| 60 | svc_chrg_nm | varchar(max) | YES |
| 61 | fd_code_sea | varchar(max) | YES |
| 62 | fd_code_air | varchar(max) | YES |
| 63 | brand_cd | varchar(max) | YES |
| 64 | svc_tr_user_id | varchar(max) | YES |
| 65 | holding_id | varchar(max) | YES |
| 66 | dz_bizarea_cd | varchar(max) | YES |
| 67 | elt_timestamp | varchar(100) | YES |
| 68 | brand | varchar(20) | YES |

#### stg.co_group_bi  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | brand_cd | varchar(max) | YES |
| 3 | bi_group_id | varchar(max) | YES |
| 4 | bi_group_name | varchar(max) | YES |
| 5 | reg_user_id | varchar(max) | YES |
| 6 | reg_dt | varchar(max) | YES |
| 7 | upd_user_id | varchar(max) | YES |
| 8 | upd_dt | varchar(max) | YES |
| 9 | elt_timestamp | varchar(100) | YES |
| 10 | brand | varchar(20) | YES |

#### stg.co_holdings  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | group_name | varchar(max) | YES |
| 3 | group_full_name | varchar(max) | YES |
| 4 | group_type | varchar(max) | YES |
| 5 | chief_name | varchar(max) | YES |
| 6 | chief_id | varchar(max) | YES |
| 7 | biz_reg_no | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | pdi_area | varchar(max) | YES |
| 12 | cpd_area | varchar(max) | YES |
| 13 | found_dt | varchar(max) | YES |
| 14 | showroom_no | decimal(18,0) | YES |
| 15 | kaida_group_id | varchar(max) | YES |
| 16 | fee_delivery | decimal(18,0) | YES |
| 17 | fee_transfer | decimal(18,0) | YES |
| 18 | service_yn | varchar(max) | YES |
| 19 | service_ip | varchar(max) | YES |
| 20 | service_port | int | YES |
| 21 | dspy_rank | int | YES |
| 22 | daily_report_seq | varchar(max) | YES |
| 23 | group_short_name | varchar(max) | YES |
| 24 | group_area | varchar(max) | YES |
| 25 | stock_value_type | varchar(max) | YES |
| 26 | usage_type | varchar(max) | YES |
| 27 | tmkr_service_cd | varchar(max) | YES |
| 28 | tmkr_parts_cd | varchar(max) | YES |
| 29 | tmkr_sales_cd | varchar(max) | YES |
| 30 | tmc_service_cd | varchar(max) | YES |
| 31 | tmc_parts_cd | varchar(max) | YES |
| 32 | tmc_sales_cd | varchar(max) | YES |
| 33 | up_group_id | varchar(max) | YES |
| 34 | system_use_yn | varchar(max) | YES |
| 35 | dealer_yn | varchar(max) | YES |
| 36 | shop_yn | varchar(max) | YES |
| 37 | highest_group_yn | varchar(max) | YES |
| 38 | use_yn | varchar(max) | YES |
| 39 | photo_file_dir | varchar(max) | YES |
| 40 | org_id | decimal(18,0) | YES |
| 41 | set_of_books_id | decimal(18,0) | YES |
| 42 | location_id | decimal(18,0) | YES |
| 43 | reg_user_id | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | upd_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | dealer_id | varchar(max) | YES |
| 48 | ci_image_id | varchar(max) | YES |
| 49 | tel_area | varchar(max) | YES |
| 50 | tel_no | varchar(max) | YES |
| 51 | fax_area | varchar(max) | YES |
| 52 | fax_no | varchar(max) | YES |
| 53 | biz_type_nm | varchar(max) | YES |
| 54 | biz_cond_nm | varchar(max) | YES |
| 55 | sms_name | varchar(max) | YES |
| 56 | svc_sms_no | varchar(max) | YES |
| 57 | new_tmkr_parts_cd | varchar(max) | YES |
| 58 | new_tmc_parts_cd | varchar(max) | YES |
| 59 | svc_reg_no | varchar(max) | YES |
| 60 | svc_chrg_nm | varchar(max) | YES |
| 61 | fd_code_sea | varchar(max) | YES |
| 62 | fd_code_air | varchar(max) | YES |
| 63 | brand_cd | varchar(max) | YES |
| 64 | svc_tr_user_id | varchar(max) | YES |
| 65 | group_cd | varchar(max) | YES |
| 66 | dz_comp_cd | varchar(max) | YES |
| 67 | dz_bizarea_cd | varchar(max) | YES |
| 68 | elt_timestamp | varchar(100) | YES |
| 69 | brand | varchar(20) | YES |

#### stg.co_nps_result  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reg_dt | varchar(max) | YES |
| 2 | upd_dt | varchar(max) | YES |
| 3 | nps_seq | decimal(18,0) | YES |
| 4 | biz_area | varchar(max) | YES |
| 5 | ref_key | varchar(max) | YES |
| 6 | reply_date | varchar(max) | YES |
| 7 | promoter_score | decimal(18,0) | YES |
| 8 | cust_comment | varchar(max) | YES |
| 9 | response_date | varchar(max) | YES |
| 10 | response_way | varchar(max) | YES |
| 11 | one_response_content | varchar(max) | YES |
| 12 | one_response_user | varchar(max) | YES |
| 13 | elt_timestamp | varchar(100) | YES |
| 14 | brand | varchar(20) | YES |

#### stg.co_other_brand  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | code_type | varchar(max) | YES |
| 2 | code | varchar(max) | YES |
| 3 | code_nm | varchar(max) | YES |
| 4 | up_code | varchar(max) | YES |
| 5 | display_order | varchar(max) | YES |
| 6 | use_yn | varchar(max) | YES |
| 7 | reg_dt | varchar(max) | YES |
| 8 | upd_dt | varchar(max) | YES |
| 9 | vehic_type | varchar(max) | YES |
| 10 | code_old | varchar(max) | YES |
| 11 | nicednr_data | varchar(max) | YES |
| 12 | elt_timestamp | varchar(100) | YES |
| 13 | brand | varchar(20) | YES |

#### stg.co_users  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | dept_cd | varchar(max) | YES |
| 4 | showroom_id | varchar(max) | YES |
| 5 | name | varchar(max) | YES |
| 6 | title | varchar(max) | YES |
| 7 | biz_charge | varchar(max) | YES |
| 8 | zip | varchar(max) | YES |
| 9 | addr | varchar(max) | YES |
| 10 | addr_no | varchar(max) | YES |
| 11 | email | varchar(max) | YES |
| 12 | authority | varchar(max) | YES |
| 13 | user_group | varchar(max) | YES |
| 14 | user_type | varchar(max) | YES |
| 15 | passwd | varchar(max) | YES |
| 16 | display_order | varchar(max) | YES |
| 17 | photo_file_dir | varchar(max) | YES |
| 18 | skill_degree | varchar(max) | YES |
| 19 | assign_stall | varchar(max) | YES |
| 20 | name_eng | varchar(max) | YES |
| 21 | designate_eng | varchar(max) | YES |
| 22 | dept_eng | varchar(max) | YES |
| 23 | addr_eng | varchar(max) | YES |
| 24 | pref_lang | varchar(max) | YES |
| 25 | work_start_dt | varchar(max) | YES |
| 26 | resigned_dt | varchar(max) | YES |
| 27 | active_yn | varchar(max) | YES |
| 28 | charge_service | varchar(max) | YES |
| 29 | charge_sales | varchar(max) | YES |
| 30 | charge_parts | varchar(max) | YES |
| 31 | query_type_sales | varchar(max) | YES |
| 32 | query_type_service | varchar(max) | YES |
| 33 | query_type_parts | varchar(max) | YES |
| 34 | reg_user_id | varchar(max) | YES |
| 35 | reg_dt | varchar(max) | YES |
| 36 | upd_user_id | varchar(max) | YES |
| 37 | upd_dt | varchar(max) | YES |
| 38 | empl_no | varchar(max) | YES |
| 39 | regi_no | varchar(max) | YES |
| 40 | bef_sale_id | varchar(max) | YES |
| 41 | bef_service_id | varchar(max) | YES |
| 42 | bef_crm_id | varchar(max) | YES |
| 43 | fax_no | varchar(max) | YES |
| 44 | tel_area | varchar(max) | YES |
| 45 | tel_no | varchar(max) | YES |
| 46 | fax_area | varchar(max) | YES |
| 47 | hp_area | varchar(max) | YES |
| 48 | hp_no | varchar(max) | YES |
| 49 | facade_sc_yn | varchar(max) | YES |
| 50 | frm_kind | varchar(max) | YES |
| 51 | tax_use_type | varchar(max) | YES |
| 52 | intro_menu | varchar(max) | YES |
| 53 | dlr_voc_mng | varchar(max) | YES |
| 54 | last_login_date | varchar(max) | YES |
| 55 | passwd_upd_dt | varchar(max) | YES |
| 56 | svc_head_yn | varchar(max) | YES |
| 57 | password_lock | varchar(max) | YES |
| 58 | mac_address | varchar(max) | YES |
| 59 | pop_part_yn | varchar(max) | YES |
| 60 | tr_zip | varchar(max) | YES |
| 61 | tr_addr | varchar(max) | YES |
| 62 | tr_addr_no | varchar(max) | YES |
| 63 | tr_addr_flag | varchar(max) | YES |
| 64 | tr_addr_insert_flag | varchar(max) | YES |
| 65 | tr_addr_bld_no | varchar(max) | YES |
| 66 | tr_addr_result | varchar(max) | YES |
| 67 | vpn_yn | varchar(max) | YES |
| 68 | auth_apvl_user_id | varchar(max) | YES |
| 69 | intro_quick_menu | varchar(max) | YES |
| 70 | e_learning_pwd | varchar(max) | YES |
| 71 | out_act_cust_seq | decimal(18,0) | YES |
| 72 | master_user_id | varchar(max) | YES |
| 73 | gm_type | varchar(max) | YES |
| 74 | passwd_sha256 | varchar(max) | YES |
| 75 | edu_yn | varchar(max) | YES |
| 76 | edu_cate | varchar(max) | YES |
| 77 | vpn_cnfm_dt | varchar(max) | YES |
| 78 | first_name_eng | varchar(max) | YES |
| 79 | sms_default_no | varchar(max) | YES |
| 80 | layoff_dt | varchar(max) | YES |
| 81 | resume_dt | varchar(max) | YES |
| 82 | reactive_yn | varchar(max) | YES |
| 83 | bi_code | varchar(max) | YES |
| 84 | edu_primary_yn | varchar(max) | YES |
| 85 | device_yn | varchar(max) | YES |
| 86 | elt_timestamp | varchar(100) | YES |
| 87 | brand | varchar(20) | YES |

#### stg.co_users_hist

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | start_dt | varchar(max) | YES |
| 3 | end_dt | varchar(max) | YES |
| 4 | group_id | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | user_type | varchar(max) | YES |
| 7 | active_yn | varchar(max) | YES |
| 8 | reg_user_id | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | upd_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | frm_kind | varchar(max) | YES |
| 13 | skill_degree | varchar(max) | YES |
| 14 | seq | decimal(38,18) | YES |
| 15 | reactive_yn | varchar(max) | YES |
| 16 | elt_timestamp | varchar(100) | YES |
| 17 | brand | varchar(20) | YES |

#### stg.co_users_ktws  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | user_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | dept_cd | varchar(max) | YES |
| 4 | showroom_id | varchar(max) | YES |
| 5 | name | varchar(max) | YES |
| 6 | title | varchar(max) | YES |
| 7 | biz_charge | varchar(max) | YES |
| 8 | email | varchar(max) | YES |
| 9 | authority | varchar(max) | YES |
| 10 | user_group | varchar(max) | YES |
| 11 | user_type | varchar(max) | YES |
| 12 | display_order | varchar(max) | YES |
| 13 | photo_file_dir | varchar(max) | YES |
| 14 | skill_degree | varchar(max) | YES |
| 15 | assign_stall | varchar(max) | YES |
| 16 | name_eng | varchar(max) | YES |
| 17 | designate_eng | varchar(max) | YES |
| 18 | dept_eng | varchar(max) | YES |
| 19 | pref_lang | varchar(max) | YES |
| 20 | work_start_dt | varchar(max) | YES |
| 21 | resigned_dt | varchar(max) | YES |
| 22 | active_yn | varchar(max) | YES |
| 23 | charge_service | varchar(max) | YES |
| 24 | charge_sales | varchar(max) | YES |
| 25 | charge_parts | varchar(max) | YES |
| 26 | query_type_sales | varchar(max) | YES |
| 27 | query_type_service | varchar(max) | YES |
| 28 | query_type_parts | varchar(max) | YES |
| 29 | reg_dt | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | empl_no | varchar(max) | YES |
| 32 | regi_no | varchar(max) | YES |
| 33 | bef_sale_id | varchar(max) | YES |
| 34 | bef_service_id | varchar(max) | YES |
| 35 | bef_crm_id | varchar(max) | YES |
| 36 | fax_no | varchar(max) | YES |
| 37 | facade_sc_yn | varchar(max) | YES |
| 38 | frm_kind | varchar(max) | YES |
| 39 | tax_use_type | varchar(max) | YES |
| 40 | intro_menu | varchar(max) | YES |
| 41 | dlr_voc_mng | varchar(max) | YES |
| 42 | last_login_date | varchar(max) | YES |
| 43 | passwd_upd_dt | varchar(max) | YES |
| 44 | svc_head_yn | varchar(max) | YES |
| 45 | pop_part_yn | varchar(max) | YES |
| 46 | vpn_yn | varchar(max) | YES |
| 47 | intro_quick_menu | varchar(max) | YES |
| 48 | e_learning_pwd | varchar(max) | YES |
| 49 | out_act_cust_seq | decimal(18,0) | YES |
| 50 | master_user_id | varchar(max) | YES |
| 51 | gm_type | varchar(max) | YES |
| 52 | edu_yn | varchar(max) | YES |
| 53 | edu_cate | varchar(max) | YES |
| 54 | vpn_cnfm_dt | varchar(max) | YES |
| 55 | first_name_eng | varchar(max) | YES |
| 56 | sms_default_no | varchar(max) | YES |
| 57 | layoff_dt | varchar(max) | YES |
| 58 | resume_dt | varchar(max) | YES |
| 59 | reactive_yn | varchar(max) | YES |
| 60 | bi_code | varchar(max) | YES |
| 61 | edu_primary_yn | varchar(max) | YES |
| 62 | device_yn | varchar(max) | YES |
| 63 | regi_no_dec | varchar(max) | YES |
| 64 | birth_dt | varchar(max) | YES |
| 65 | profile_url | varchar(max) | YES |
| 66 | elt_timestamp | varchar(100) | YES |
| 67 | brand | varchar(20) | YES |

#### stg.co_vehic  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | vin | varchar(max) | YES | 차대번호(VIN) |
| 2 | vehic_no1 | varchar(max) | YES | 차량 |
| 3 | vehic_no2 | varchar(max) | YES | 차량 |
| 4 | vis | varchar(max) | YES |  |
| 5 | contract_no | decimal(18,0) | YES | 계약번호 |
| 6 | model_year | varchar(max) | YES | 모델 |
| 7 | brand_cd | varchar(max) | YES | 브랜드 |
| 8 | maker_cd | varchar(max) | YES | 코드 |
| 9 | variant_cd | varchar(max) | YES | 바리에이션 |
| 10 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 11 | odometer | int | YES |  |
| 12 | variant_nm | varchar(max) | YES | 바리에이션 |
| 13 | svc_model_cd | varchar(max) | YES | 모델 코드 |
| 14 | model_cd | varchar(max) | YES | 모델 코드 |
| 15 | option_cd1 | varchar(max) | YES |  |
| 16 | option_cd2 | varchar(max) | YES |  |
| 17 | option_cd3 | varchar(max) | YES |  |
| 18 | option_cd4 | varchar(max) | YES |  |
| 19 | key_no | varchar(max) | YES | 번호 |
| 20 | grade | varchar(max) | YES |  |
| 21 | import_yn | varchar(max) | YES | 여부(Y/N) |
| 22 | event | varchar(max) | YES |  |
| 23 | linein_dt | varchar(max) | YES | 일자 |
| 24 | delivery_dt | varchar(max) | YES | 출고일 |
| 25 | lineoff_dt | varchar(max) | YES | 일자 |
| 26 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 27 | exterior_cd | varchar(max) | YES | 코드 |
| 28 | interior_cd | varchar(max) | YES | 코드 |
| 29 | engine_no | varchar(max) | YES | 번호 |
| 30 | force_reg_dt | varchar(max) | YES | 등록일 |
| 31 | force_reg_yn | varchar(max) | YES | 등록 |
| 32 | force_reg_dealer_id | varchar(max) | YES | 딜러 ID |
| 33 | force_reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 34 | first_rcpt_dealer_id | varchar(max) | YES | 딜러 ID |
| 35 | first_rcpt_dt | varchar(max) | YES | 일자 |
| 36 | sales_dealer_id | varchar(max) | YES | 딜러 ID |
| 37 | sales_sc_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 38 | regist_dt | varchar(max) | YES | 등록일 |
| 39 | last_rcpt_dealer_id | varchar(max) | YES | 딜러 ID |
| 40 | last_rcpt_dt | varchar(max) | YES | 일자 |
| 41 | vehic_magic | decimal(18,0) | YES | 차량 |
| 42 | ras_no | varchar(max) | YES | 번호 |
| 43 | ew_no | varchar(max) | YES | 번호 |
| 44 | sales_type | varchar(max) | YES | 판매 |
| 45 | ras_start_dt | varchar(max) | YES | 시작일 |
| 46 | ras_end_dt | varchar(max) | YES | 종료일 |
| 47 | base_odometer | int | YES |  |
| 48 | base_odometer_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 49 | base_odometer_upd_dt | varchar(max) | YES | 수정일 |
| 50 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 51 | upd_dt | varchar(max) | YES | 수정일 |
| 52 | first_owner_yn | varchar(max) | YES | 여부(Y/N) |
| 53 | owner_changed_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 54 | owner_changed_upd_dt | varchar(max) | YES | 수정일 |
| 55 | hv_badge_yn | varchar(max) | YES | 여부(Y/N) |
| 56 | tfskr_mng_yn | varchar(max) | YES | 여부(Y/N) |
| 57 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 58 | brand | varchar(20) | YES | 브랜드 |

#### stg.crm_act  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | act_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_cd | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | sc_id | varchar(max) | YES |
| 7 | act_tp_grp | varchar(max) | YES |
| 8 | act_tp | varchar(max) | YES |
| 9 | contact_tp | varchar(max) | YES |
| 10 | plan_dt_fr | varchar(max) | YES |
| 11 | plan_dt_to | varchar(max) | YES |
| 12 | rel_sr_seq | decimal(18,0) | YES |
| 13 | rel_testcar_req | decimal(18,0) | YES |
| 14 | rel_testcar_reserved_dt | varchar(max) | YES |
| 15 | rel_testcar_from_time | varchar(max) | YES |
| 16 | rel_testcar_no | varchar(max) | YES |
| 17 | rel_ecrb_seq | decimal(18,0) | YES |
| 18 | rel_active_seq | decimal(18,0) | YES |
| 19 | rel_esti_seq | decimal(18,0) | YES |
| 20 | rel_resv_svc_center | varchar(max) | YES |
| 21 | rel_resv_dt | varchar(max) | YES |
| 22 | rel_resv_seq | decimal(18,0) | YES |
| 23 | lead_id | decimal(18,0) | YES |
| 24 | cust_seq | decimal(18,0) | YES |
| 25 | act_result | varchar(max) | YES |
| 26 | name | varchar(max) | YES |
| 27 | memo | varchar(max) | YES |
| 28 | catalog_sent_yn | varchar(max) | YES |
| 29 | act_dt_fr | varchar(max) | YES |
| 30 | act_dt_to | varchar(max) | YES |
| 31 | del_dt | varchar(max) | YES |
| 32 | use_yn | varchar(max) | YES |
| 33 | reg_dt | varchar(max) | YES |
| 34 | upd_dt | varchar(max) | YES |
| 35 | ref_cust_seq | decimal(18,0) | YES |
| 36 | ref_lead_id | decimal(18,0) | YES |
| 37 | ref_act_seq | decimal(18,0) | YES |
| 38 | resv_next_ecrb_dt | varchar(max) | YES |
| 39 | ref_rel_tp | varchar(max) | YES |
| 40 | rel_cpo_vehic_purc_key | decimal(18,0) | YES |
| 41 | family_seq | decimal(18,0) | YES |
| 42 | mask_yn | varchar(max) | YES |
| 43 | mask_dt | varchar(max) | YES |
| 44 | elt_timestamp | varchar(100) | YES |
| 45 | brand | varchar(20) | YES |
| 46 | rel_visit_seq | decimal(18,0) | YES |

#### stg.crm_lead  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | lead_id | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_cd | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | sc_id | varchar(max) | YES |
| 7 | act_tp | varchar(max) | YES |
| 8 | potential | varchar(max) | YES |
| 9 | repurc_yn | varchar(max) | YES |
| 10 | bookmark_yn | varchar(max) | YES |
| 11 | name | varchar(max) | YES |
| 12 | cust_seq | decimal(18,0) | YES |
| 13 | int_mdl1 | varchar(max) | YES |
| 14 | int_var1 | varchar(max) | YES |
| 15 | int_my1 | varchar(max) | YES |
| 16 | int_sfx1 | varchar(max) | YES |
| 17 | int_mdl2 | varchar(max) | YES |
| 18 | int_var2 | varchar(max) | YES |
| 19 | int_my2 | varchar(max) | YES |
| 20 | int_sfx2 | varchar(max) | YES |
| 21 | purc_pnt | varchar(max) | YES |
| 22 | pay_tp | varchar(max) | YES |
| 23 | own_brd | varchar(max) | YES |
| 24 | own_mdl | varchar(max) | YES |
| 25 | memo | varchar(max) | YES |
| 26 | hot_upd_dt | varchar(max) | YES |
| 27 | contract_no | decimal(18,0) | YES |
| 28 | pre_resv_no | decimal(18,0) | YES |
| 29 | close_yn | varchar(max) | YES |
| 30 | close_dt | varchar(max) | YES |
| 31 | use_yn | varchar(max) | YES |
| 32 | reg_dt | varchar(max) | YES |
| 33 | upd_dt | varchar(max) | YES |
| 34 | mask_yn | varchar(max) | YES |
| 35 | family_seq | decimal(18,0) | YES |
| 36 | ci | varchar(max) | YES |
| 37 | oneid_key | decimal(18,0) | YES |
| 38 | elt_timestamp | varchar(100) | YES |
| 39 | brand | varchar(20) | YES |

#### stg.crm_lead_hist  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | hist_seq | decimal(18,0) | YES |
| 2 | lead_id | decimal(18,0) | YES |
| 3 | act_tp | varchar(max) | YES |
| 4 | potential | varchar(max) | YES |
| 5 | repurc_yn | varchar(max) | YES |
| 6 | bookmark_yn | varchar(max) | YES |
| 7 | name | varchar(max) | YES |
| 8 | cust_seq | decimal(18,0) | YES |
| 9 | int_mdl1 | varchar(max) | YES |
| 10 | int_var1 | varchar(max) | YES |
| 11 | int_my1 | varchar(max) | YES |
| 12 | int_sfx1 | varchar(max) | YES |
| 13 | int_mdl2 | varchar(max) | YES |
| 14 | int_var2 | varchar(max) | YES |
| 15 | int_my2 | varchar(max) | YES |
| 16 | int_sfx2 | varchar(max) | YES |
| 17 | purc_pnt | varchar(max) | YES |
| 18 | pay_tp | varchar(max) | YES |
| 19 | own_brd | varchar(max) | YES |
| 20 | own_mdl | varchar(max) | YES |
| 21 | memo | varchar(max) | YES |
| 22 | hot_upd_dt | varchar(max) | YES |
| 23 | contract_no | decimal(18,0) | YES |
| 24 | pre_resv_no | decimal(18,0) | YES |
| 25 | close_yn | varchar(max) | YES |
| 26 | close_dt | varchar(max) | YES |
| 27 | sys_gb | varchar(max) | YES |
| 28 | use_yn | varchar(max) | YES |
| 29 | reg_dt | varchar(max) | YES |
| 30 | hist_reg_dt | varchar(max) | YES |
| 31 | elt_timestamp | varchar(100) | YES |
| 32 | brand | varchar(20) | YES |

#### stg.crm_lead_owner  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | lead_owner_id | decimal(18,0) | YES |
| 2 | lead_id | decimal(18,0) | YES |
| 3 | owner_tp | varchar(max) | YES |
| 4 | pers_nm | varchar(max) | YES |
| 5 | pers_hp_no | varchar(max) | YES |
| 6 | pers_cust_seq | decimal(18,0) | YES |
| 7 | pers_gender | varchar(max) | YES |
| 8 | pers_age | varchar(max) | YES |
| 9 | corp_nm | varchar(max) | YES |
| 10 | corp_hp_no | varchar(max) | YES |
| 11 | corp_cust_seq | decimal(18,0) | YES |
| 12 | corp_email | varchar(max) | YES |
| 13 | corp_gender | varchar(max) | YES |
| 14 | corp_age | varchar(max) | YES |
| 15 | use_yn | varchar(max) | YES |
| 16 | reg_dt | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | elt_timestamp | varchar(100) | YES |
| 19 | brand | varchar(20) | YES |

#### stg.crm_target

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | target_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | branch_id | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | ym | varchar(max) | YES |
| 7 | sc_id | varchar(max) | YES |
| 8 | close_yn | varchar(max) | YES |
| 9 | close_dt | varchar(max) | YES |
| 10 | use_yn | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | save_yn | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.crm_target_d  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | day_seq | decimal(18,0) | YES |
| 2 | mon_seq | decimal(18,0) | YES |
| 3 | target_seq | decimal(18,0) | YES |
| 4 | dealer_id | varchar(max) | YES |
| 5 | sc_id | varchar(max) | YES |
| 6 | code | varchar(max) | YES |
| 7 | day | varchar(max) | YES |
| 8 | target_cnt | int | YES |
| 9 | use_yn | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | elt_timestamp | varchar(100) | YES |
| 13 | brand | varchar(20) | YES |

#### stg.crm_target_m  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | mon_seq | decimal(18,0) | YES |
| 2 | target_seq | decimal(18,0) | YES |
| 3 | code | varchar(max) | YES |
| 4 | target_cnt | int | YES |
| 5 | target_rate | decimal(18,0) | YES |
| 6 | pt_cust_cnt | int | YES |
| 7 | target_multi | decimal(18,0) | YES |
| 8 | use_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | upd_dt | varchar(max) | YES |
| 11 | elt_timestamp | varchar(100) | YES |
| 12 | brand | varchar(20) | YES |

#### stg.cu_detail  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cust_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | birth_dt | varchar(max) | YES |
| 4 | mng_sc_id | varchar(max) | YES |
| 5 | marry_yn | varchar(max) | YES |
| 6 | luso_type | varchar(max) | YES |
| 7 | sex_cd | varchar(max) | YES |
| 8 | cr_yn | varchar(max) | YES |
| 9 | cr_change_dt | varchar(max) | YES |
| 10 | marry_dt | varchar(max) | YES |
| 11 | mng_change_dt | varchar(max) | YES |
| 12 | cr_type | varchar(max) | YES |
| 13 | hold_dt | varchar(max) | YES |
| 14 | intro_cust_seq | decimal(18,0) | YES |
| 15 | hobby_cd1 | varchar(max) | YES |
| 16 | intro_type | varchar(max) | YES |
| 17 | rememb_dt | varchar(max) | YES |
| 18 | rememb_dt_desc | varchar(max) | YES |
| 19 | hobby_cd2 | varchar(max) | YES |
| 20 | remark | varchar(max) | YES |
| 21 | concern_mdl1 | varchar(max) | YES |
| 22 | hobby_etc | varchar(max) | YES |
| 23 | concern_mdl2 | varchar(max) | YES |
| 24 | hold_type | varchar(max) | YES |
| 25 | mng_type | varchar(max) | YES |
| 26 | ows_cb_yn | varchar(max) | YES |
| 27 | ows_dt | varchar(max) | YES |
| 28 | group_cd1 | varchar(max) | YES |
| 29 | group_cd2 | varchar(max) | YES |
| 30 | group_etc | varchar(max) | YES |
| 31 | concern_mdl3 | varchar(max) | YES |
| 32 | bef_mng_sc_id | varchar(max) | YES |
| 33 | reg_dt | varchar(max) | YES |
| 34 | reg_user_id | varchar(max) | YES |
| 35 | upd_dt | varchar(max) | YES |
| 36 | upd_user_id | varchar(max) | YES |
| 37 | cr_sub_type | varchar(max) | YES |
| 38 | reg_shop_cd | varchar(max) | YES |
| 39 | cr_3rd_type | varchar(max) | YES |
| 40 | cust_pic_path | varchar(max) | YES |
| 41 | cust_pic_nm | varchar(max) | YES |
| 42 | cust_act_type1 | varchar(max) | YES |
| 43 | cust_act_type2 | varchar(max) | YES |
| 44 | favor_drink1 | varchar(max) | YES |
| 45 | favor_drink2 | varchar(max) | YES |
| 46 | hobby_cd_partner | varchar(max) | YES |
| 47 | home_town | varchar(max) | YES |
| 48 | cust_holiday | varchar(max) | YES |
| 49 | favor_tel_area | varchar(max) | YES |
| 50 | favor_tel_no | varchar(max) | YES |
| 51 | prev_hold_type | varchar(max) | YES |
| 52 | age_cd | varchar(max) | YES |
| 53 | child_cnt | varchar(max) | YES |
| 54 | prev_brand | varchar(max) | YES |
| 55 | prev_mdl | varchar(max) | YES |
| 56 | ELT_TIMESTAMP | varchar(100) | YES |
| 57 | BRAND | varchar(20) | YES |

#### stg.if_ar  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | interface_id | varchar(max) | YES |
| 2 | group_id | varchar(max) | YES |
| 3 | company_code | varchar(max) | YES |
| 4 | org_id | varchar(max) | YES |
| 5 | location_id | varchar(max) | YES |
| 6 | dealer_id | varchar(max) | YES |
| 7 | module | varchar(max) | YES |
| 8 | trx_type | varchar(max) | YES |
| 9 | trx_flag | varchar(max) | YES |
| 10 | line_attribute1 | varchar(max) | YES |
| 11 | line_attribute2 | varchar(max) | YES |
| 12 | line_attribute3 | varchar(max) | YES |
| 13 | line_desc | varchar(max) | YES |
| 14 | org_person_flag | varchar(max) | YES |
| 15 | client_org_id | varchar(max) | YES |
| 16 | client_location_id | varchar(max) | YES |
| 17 | client_dealer_id | varchar(max) | YES |
| 18 | cust_seq | varchar(max) | YES |
| 19 | comp_seq | varchar(max) | YES |
| 20 | registration_num | varchar(max) | YES |
| 21 | currency_code | varchar(max) | YES |
| 22 | conversion_date | varchar(max) | YES |
| 23 | conversion_type | varchar(max) | YES |
| 24 | conversion_rate | varchar(max) | YES |
| 25 | trx_date | varchar(max) | YES |
| 26 | gl_date | varchar(max) | YES |
| 27 | term_id | varchar(max) | YES |
| 28 | quantity | decimal(18,0) | YES |
| 29 | unit_selling_price | decimal(18,0) | YES |
| 30 | amount | decimal(18,0) | YES |
| 31 | vat_tax_id | varchar(max) | YES |
| 32 | vat_amount | decimal(18,0) | YES |
| 33 | vat_tax_count | varchar(max) | YES |
| 34 | salesrep_num | varchar(max) | YES |
| 35 | segment5 | varchar(max) | YES |
| 36 | status | varchar(max) | YES |
| 37 | error_code | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | client_name | varchar(max) | YES |
| 43 | invoice_amount | varchar(max) | YES |
| 44 | surtax_itemname1 | varchar(max) | YES |
| 45 | transaction_type_code | varchar(max) | YES |
| 46 | transaction_type_data | varchar(max) | YES |
| 47 | transaction_sub_type_code | varchar(max) | YES |
| 48 | transaction_sub_type_data | varchar(max) | YES |
| 49 | sob_id | varchar(max) | YES |
| 50 | amount_gl | varchar(max) | YES |
| 51 | lookup_nm | varchar(max) | YES |
| 52 | trans_yn | varchar(max) | YES |
| 53 | status_comp | varchar(max) | YES |
| 54 | interface_dt | varchar(max) | YES |
| 55 | trx_group | varchar(max) | YES |
| 56 | del_flag | varchar(max) | YES |
| 57 | dms_trx_id | varchar(max) | YES |
| 58 | org_shop_cd | varchar(max) | YES |
| 59 | memo | varchar(max) | YES |
| 60 | interface_id_acnt | varchar(max) | YES |
| 61 | sfx_cd | varchar(max) | YES |
| 62 | biz_reg_no | varchar(max) | YES |
| 63 | process_id | varchar(max) | YES |
| 64 | tyt_interface_h_id | varchar(max) | YES |
| 65 | legacy_confirm_status | varchar(max) | YES |
| 66 | dz_pc_cd | varchar(max) | YES |
| 67 | dz_comp_cd | varchar(max) | YES |
| 68 | dz_bizarea_cd | varchar(max) | YES |
| 69 | dz_wdept_cd | varchar(max) | YES |
| 70 | dz_write_id | varchar(max) | YES |
| 71 | prod_loc | varchar(max) | YES |
| 72 | dz_docu_no | varchar(max) | YES |
| 73 | vin | varchar(max) | YES |
| 74 | dz_tax_status | varchar(max) | YES |
| 75 | dz_tax_sum_no | varchar(max) | YES |
| 76 | dz_tax_docu_no | varchar(max) | YES |
| 77 | dz_tax_sum_dt | varchar(max) | YES |
| 78 | dz_tax_docu_dt | varchar(max) | YES |
| 79 | dz_cc_cd | varchar(max) | YES |
| 80 | pre_rcpt_yn | varchar(max) | YES |
| 81 | if_confirm_status | varchar(max) | YES |
| 82 | family_seq | varchar(max) | YES |
| 83 | elt_timestamp | varchar(100) | YES |
| 84 | brand | varchar(20) | YES |

#### stg.om_contract_ktws  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | contract_no | decimal(18,0) | YES | 계약번호 |
| 2 | dlr_contract_no | varchar(max) | YES | 번호 |
| 3 | contract_dt | varchar(max) | YES | 계약일 |
| 4 | contract_stat_cd | varchar(max) | YES | 계약 |
| 5 | sold_yn | varchar(max) | YES | 여부(Y/N) |
| 6 | urgent_yn | varchar(max) | YES | 여부(Y/N) |
| 7 | allocation_yn | varchar(max) | YES | 여부(Y/N) |
| 8 | status_mod_dt | varchar(max) | YES | 수정일 |
| 9 | cond_mod_yn | varchar(max) | YES | 여부(Y/N) |
| 10 | dealer_id | varchar(max) | YES | 딜러 ID |
| 11 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 12 | user_id | varchar(max) | YES | 사용자 ID(SC) |
| 13 | owner_type | varchar(max) | YES | 유형코드 |
| 14 | cust_seq | decimal(18,0) | YES | 고객 |
| 15 | comp_seq | decimal(18,0) | YES | 순번 |
| 16 | real_cust_seq | decimal(18,0) | YES | 고객 |
| 17 | owner_seq | decimal(18,0) | YES | 순번 |
| 18 | customs_seq | decimal(18,0) | YES | 고객 |
| 19 | brand_cd | varchar(max) | YES | 브랜드 |
| 20 | model_cd | varchar(max) | YES | 모델 코드 |
| 21 | variant_cd | varchar(max) | YES | 바리에이션 |
| 22 | my_cd | varchar(max) | YES | 코드 |
| 23 | sfx_cd | varchar(max) | YES | SFX(트림) |
| 24 | col_combi_cd | varchar(max) | YES | 컬러조합 |
| 25 | option_cd | varchar(max) | YES | 코드 |
| 26 | option_cd2 | varchar(max) | YES |  |
| 27 | option_cd3 | varchar(max) | YES |  |
| 28 | option_cd4 | varchar(max) | YES |  |
| 29 | vin | varchar(max) | YES | 차대번호(VIN) |
| 30 | vehic_magic | decimal(18,0) | YES | 차량 |
| 31 | vehic_price | decimal(18,0) | YES | 차량가격 |
| 32 | vehic_vat | decimal(18,0) | YES | 차량 |
| 33 | vehic_option_price | decimal(18,0) | YES | 차량가격 |
| 34 | vehic_color_price | decimal(18,0) | YES | 색상 |
| 35 | vehic_discount_amt | decimal(18,0) | YES | 차량 |
| 36 | vehic_total_amt | decimal(18,0) | YES | 차량 |
| 37 | deposit_amt | decimal(18,0) | YES | 계약금 |
| 38 | sales_type | varchar(max) | YES | 판매 |
| 39 | pay_type | varchar(max) | YES | 유형코드 |
| 40 | tax_type | decimal(18,0) | YES | 유형코드 |
| 41 | lease_comp_seq | decimal(18,0) | YES | 순번 |
| 42 | reg_free_yn | varchar(max) | YES | 등록 |
| 43 | reg_stock_free_yn | varchar(max) | YES | 재고 |
| 44 | reg_stock_rate | decimal(18,0) | YES | 재고 |
| 45 | reg_stock_buy_yn | varchar(max) | YES | 재고 |
| 46 | reg_agency_yn | varchar(max) | YES | 등록 |
| 47 | reg_tax | decimal(18,0) | YES | 등록 |
| 48 | reg_stock_price | decimal(18,0) | YES | 가격 |
| 49 | reg_stamp_price | decimal(18,0) | YES | 가격 |
| 50 | reg_plate_price | decimal(18,0) | YES | 가격 |
| 51 | reg_fee | decimal(18,0) | YES | 등록 |
| 52 | reg_aquisition_tax | decimal(18,0) | YES | 등록 |
| 53 | reg_special_tax | decimal(18,0) | YES | 등록 |
| 54 | reg_education_tax | decimal(18,0) | YES | 등록 |
| 55 | reg_total_amt | decimal(18,0) | YES | 총 금액 |
| 56 | take_contract_amt | decimal(18,0) | YES | 금액 |
| 57 | take_delivery_amt | decimal(18,0) | YES | 금액 |
| 58 | lease_month_amt | decimal(18,0) | YES | 금액 |
| 59 | lease_term_dt | varchar(max) | YES | 일자 |
| 60 | lease_rate | decimal(18,0) | YES |  |
| 61 | take_depositer_nm | varchar(max) | YES | 계약금 |
| 62 | take_deposit_cd | varchar(max) | YES | 계약금 |
| 63 | side_stamp_price | decimal(18,0) | YES | 가격 |
| 64 | side_setup_amt | decimal(18,0) | YES | 금액 |
| 65 | side_fee | decimal(18,0) | YES |  |
| 66 | side_total_amt | decimal(18,0) | YES | 총 금액 |
| 67 | delivery_place_cd | varchar(max) | YES | 출고 |
| 68 | delivery_plan2_dt | varchar(max) | YES | 출고일 |
| 69 | delivery_delay_reason | varchar(max) | YES | 출고 |
| 70 | delivery_actual_dt | varchar(max) | YES | 출고일 |
| 71 | delivery_actual_hour | varchar(max) | YES | 출고 |
| 72 | delivery_plate_cd | varchar(max) | YES | 출고 |
| 73 | request_by | varchar(max) | YES |  |
| 74 | request_dt | varchar(max) | YES | 일자 |
| 75 | approval_by | varchar(max) | YES |  |
| 76 | approval_dt | varchar(max) | YES | 일자 |
| 77 | cancel_by | varchar(max) | YES | 취소 |
| 78 | cancel_dt | varchar(max) | YES | 취소일 |
| 79 | last_retail_sales_dt | varchar(max) | YES | 판매 |
| 80 | last_issued_dt | varchar(max) | YES | 일자 |
| 81 | last_mod_dt | varchar(max) | YES | 수정일 |
| 82 | delivery_request_by | varchar(max) | YES | 출고 |
| 83 | delivery_request_dt | varchar(max) | YES | 출고일 |
| 84 | delivery_cancel_by | varchar(max) | YES | 출고 |
| 85 | delivery_cancel_dt | varchar(max) | YES | 출고일 |
| 86 | delivery_plan_by | varchar(max) | YES | 출고 |
| 87 | delivery_plan_dt | varchar(max) | YES | 출고일 |
| 88 | delivery_approval_by | varchar(max) | YES | 출고 |
| 89 | delivery_approval_dt | varchar(max) | YES | 출고일 |
| 90 | reg_plan_dt | varchar(max) | YES | 등록일 |
| 91 | contract_msg | varchar(max) | YES | 계약 |
| 92 | vehic_reg_no | varchar(max) | YES | 차량 |
| 93 | vehic_reg_dt | varchar(max) | YES | 차량 |
| 94 | dept_cd | varchar(max) | YES | 코드 |
| 95 | boc_except_dt | varchar(max) | YES | 일자 |
| 96 | reg_dt | varchar(max) | YES | 등록일 |
| 97 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 98 | upd_dt | varchar(max) | YES | 수정일 |
| 99 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 100 | public_yn | varchar(max) | YES | 여부(Y/N) |
| 101 | allocation_dt | varchar(max) | YES | 일자 |
| 102 | prev_contract_stat_cd | varchar(max) | YES | 상태코드 |
| 103 | rs_cust_zip | varchar(max) | YES | 고객 |
| 104 | rs_cust_addr | varchar(max) | YES | 고객 |
| 105 | rs_cust_addr2 | varchar(max) | YES | 고객 |
| 106 | rs_geo_loc_x | varchar(max) | YES |  |
| 107 | rs_geo_loc_y | varchar(max) | YES |  |
| 108 | potential_division | varchar(max) | YES |  |
| 109 | org_followup_id | decimal(18,0) | YES | 식별자(ID) |
| 110 | plate_size | varchar(max) | YES |  |
| 111 | receiver_apply_yn | varchar(max) | YES | 여부(Y/N) |
| 112 | fiber_use_yn | varchar(max) | YES | 여부(Y/N) |
| 113 | if_send_yn | varchar(max) | YES | 여부(Y/N) |
| 114 | recept_no | varchar(max) | YES | 번호 |
| 115 | receiver_ssn | varchar(max) | YES |  |
| 116 | pma_yn | varchar(max) | YES | 여부(Y/N) |
| 117 | cust_taxpay_no | varchar(max) | YES | 고객번호 |
| 118 | family_seq | decimal(18,0) | YES | 순번 |
| 119 | lemon_yn | varchar(max) | YES | 여부(Y/N) |
| 120 | lemon_yn_choice | varchar(max) | YES |  |
| 121 | app_flag | varchar(max) | YES |  |
| 122 | consign_sales_flag | varchar(max) | YES | 판매 |
| 123 | contract_msg_kr | varchar(max) | YES | 계약 |
| 124 | cust_ci_chk_yn | varchar(max) | YES | 고객 |
| 125 | cust_ci_chk_except_yn | varchar(max) | YES | 고객 |
| 126 | realnm_seq | decimal(18,0) | YES | 순번 |
| 127 | tax_biz_no | varchar(max) | YES | 번호 |
| 128 | pma_city | varchar(max) | YES | 시 |
| 129 | pma_gu | varchar(max) | YES | 구 |
| 130 | taxpay_no_ymd | decimal(18,0) | YES |  |
| 131 | taxpay_no_g | decimal(18,0) | YES |  |
| 132 | flood_yn | varchar(max) | YES | 여부(Y/N) |
| 133 | lead_id | decimal(18,0) | YES | 식별자(ID) |
| 134 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 135 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_barc_sort  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | case_no | varchar(max) | YES |
| 3 | start_dt_unload | varchar(max) | YES |
| 4 | end_dt_unload | varchar(max) | YES |
| 5 | start_dt_sort | varchar(max) | YES |
| 6 | end_dt_sort | varchar(max) | YES |
| 7 | stat | varchar(max) | YES |
| 8 | token_unload | varchar(max) | YES |
| 9 | token_sort | varchar(max) | YES |
| 10 | reg_dt | varchar(max) | YES |
| 11 | reg_user_id | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | upd_user_id | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.pt_order  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | order_no | varchar(max) | YES | 주문번호 |
| 3 | order_dt | varchar(max) | YES | 주문 |
| 4 | sply_dealer_id | varchar(max) | YES | 딜러 ID |
| 5 | splr_cd | varchar(max) | YES | 코드 |
| 6 | order_type | varchar(max) | YES | 주문 |
| 7 | order_kind | varchar(max) | YES | 주문 |
| 8 | order_stat | varchar(max) | YES | 주문 |
| 9 | order_pay_type | varchar(max) | YES | 주문 |
| 10 | order_tran_type | varchar(max) | YES | 주문 |
| 11 | order_use | varchar(max) | YES | 주문 |
| 12 | local_yn | varchar(max) | YES | 여부(Y/N) |
| 13 | bo_yn | varchar(max) | YES | 여부(Y/N) |
| 14 | allo_yn | varchar(max) | YES | 여부(Y/N) |
| 15 | cncl_yn | varchar(max) | YES | 여부(Y/N) |
| 16 | ro_no | varchar(max) | YES | 번호 |
| 17 | vin | varchar(max) | YES | 차대번호(VIN) |
| 18 | cter_man | varchar(max) | YES |  |
| 19 | remark | varchar(max) | YES |  |
| 20 | order_cnfm_dt | varchar(max) | YES | 주문 |
| 21 | order_hold_dt | varchar(max) | YES | 주문 |
| 22 | order_close_dt | varchar(max) | YES | 주문 |
| 23 | order_dele_dt | varchar(max) | YES | 주문 |
| 24 | quot_no | varchar(max) | YES | 번호 |
| 25 | resv_no | varchar(max) | YES | 번호 |
| 26 | cust_no | varchar(max) | YES | 고객번호 |
| 27 | cust_seq | bigint | YES | 고객 |
| 28 | comp_seq | bigint | YES | 순번 |
| 29 | tmkr_remark | varchar(max) | YES |  |
| 30 | tmkr_modi_yn | varchar(max) | YES | 여부(Y/N) |
| 31 | staff_id | varchar(max) | YES | 직원 |
| 32 | key_no | varchar(max) | YES | 번호 |
| 33 | other_yn | varchar(max) | YES | 여부(Y/N) |
| 34 | vehic_no1 | varchar(max) | YES | 차량 |
| 35 | vehic_no2 | varchar(max) | YES | 차량 |
| 36 | vor_type | varchar(max) | YES | 유형코드 |
| 37 | dealer_id | varchar(max) | YES | 딜러 ID |
| 38 | reg_dt | varchar(max) | YES | 등록일 |
| 39 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 40 | upd_dt | varchar(max) | YES | 수정일 |
| 41 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 42 | pre_order_yn | varchar(max) | YES | 주문 |
| 43 | ord_code | decimal(18,0) | YES | 코드 |
| 44 | tran_ord_type | decimal(18,0) | YES | 유형코드 |
| 45 | tran_ord_mode | decimal(18,0) | YES |  |
| 46 | sout_rdy_yn | varchar(max) | YES | 여부(Y/N) |
| 47 | sout_sch_dt | varchar(max) | YES | 일자 |
| 48 | bch_end_yn | varchar(max) | YES | 여부(Y/N) |
| 49 | tran_ord_dt | varchar(max) | YES | 일자 |
| 50 | job_bch_dt | varchar(max) | YES | 일자 |
| 51 | ord_complete_dt | varchar(max) | YES | 일자 |
| 52 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 53 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_order_bo  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | order_bo_seq | decimal(18,0) | YES | 주문 |
| 2 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 3 | order_dt | varchar(max) | YES | 주문 |
| 4 | order_no | varchar(max) | YES | 주문번호 |
| 5 | stat | varchar(max) | YES |  |
| 6 | air_frgt_yn | varchar(max) | YES | 여부(Y/N) |
| 7 | air_frgt_amt | bigint | YES | 금액 |
| 8 | vin | varchar(max) | YES | 차대번호(VIN) |
| 9 | tmkr_sold_vin_yn | varchar(max) | YES | 여부(Y/N) |
| 10 | cnfm_yn | varchar(max) | YES | 여부(Y/N) |
| 11 | cnfm_day | varchar(max) | YES |  |
| 12 | cnfm_man | varchar(max) | YES |  |
| 13 | dealer_id | varchar(max) | YES | 딜러 ID |
| 14 | reg_dt | varchar(max) | YES | 등록일 |
| 15 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 16 | upd_dt | varchar(max) | YES | 수정일 |
| 17 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 18 | pre_order_chk | varchar(max) | YES | 주문 |
| 19 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 20 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_order_bo_detl  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | order_bo_seq | decimal(18,0) | YES | 주문 |
| 2 | order_bo_detl_seq | int | YES | 주문 |
| 3 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 4 | order_no | varchar(max) | YES | 주문번호 |
| 5 | order_detl_line_no | int | YES | 주문번호 |
| 6 | part_no | varchar(max) | YES | 부품번호 |
| 7 | order_qty | bigint | YES | 수량 |
| 8 | bo_qty | bigint | YES | 수량 |
| 9 | order_unit | varchar(max) | YES | 주문 |
| 10 | conv_qty | bigint | YES | 수량 |
| 11 | stat | varchar(max) | YES |  |
| 12 | purc_base_tran_type | varchar(max) | YES | 유형코드 |
| 13 | purc_modi_tran_type | varchar(max) | YES | 유형코드 |
| 14 | air_only_yn | varchar(max) | YES | 여부(Y/N) |
| 15 | base_price | bigint | YES | 가격 |
| 16 | modi_price | bigint | YES | 가격 |
| 17 | retail_price | bigint | YES | 가격 |
| 18 | dc_rate_base | decimal(18,0) | YES |  |
| 19 | dc_rate_bo | decimal(18,0) | YES |  |
| 20 | extra_rate_bo | decimal(18,0) | YES |  |
| 21 | remark | varchar(max) | YES |  |
| 22 | eta | varchar(max) | YES |  |
| 23 | etd | varchar(max) | YES |  |
| 24 | etd_reg_dt | varchar(max) | YES | 등록일 |
| 25 | etd_reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 26 | etd_upd_dt | varchar(max) | YES | 수정일 |
| 27 | etd_upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 28 | fix_etd | varchar(max) | YES |  |
| 29 | dealer_id | varchar(max) | YES | 딜러 ID |
| 30 | reg_dt | varchar(max) | YES | 등록일 |
| 31 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 32 | upd_dt | varchar(max) | YES | 수정일 |
| 33 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 34 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 35 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_order_detl  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | order_no | varchar(max) | YES | 주문번호 |
| 3 | line_no | int | YES | 번호 |
| 4 | order_part_no | varchar(max) | YES | 주문번호 |
| 5 | order_qty | bigint | YES | 수량 |
| 6 | order_cnfm_qty | bigint | YES | 수량 |
| 7 | allo_qty | bigint | YES | 수량 |
| 8 | bo_qty | bigint | YES | 수량 |
| 9 | pend_qty | bigint | YES | 수량 |
| 10 | sout_wait_qty | bigint | YES | 수량 |
| 11 | sout_cnfm_qty | bigint | YES | 수량 |
| 12 | order_price | bigint | YES | 가격 |
| 13 | order_unit | varchar(max) | YES | 주문 |
| 14 | conv_qty | bigint | YES | 수량 |
| 15 | order_unit_qty | bigint | YES | 수량 |
| 16 | dc_rate | decimal(18,0) | YES |  |
| 17 | extra_rate | decimal(18,0) | YES |  |
| 18 | order_amt | bigint | YES | 금액 |
| 19 | fk | varchar(max) | YES |  |
| 20 | key_no | varchar(max) | YES | 번호 |
| 21 | abno_yn | varchar(max) | YES | 여부(Y/N) |
| 22 | stat | varchar(max) | YES |  |
| 23 | cnfm_dt | varchar(max) | YES | 일자 |
| 24 | hold_dt | varchar(max) | YES | 일자 |
| 25 | close_dt | varchar(max) | YES | 일자 |
| 26 | dele_dt | varchar(max) | YES | 일자 |
| 27 | quot_no | varchar(max) | YES | 번호 |
| 28 | quot_detl_line_no | int | YES | 번호 |
| 29 | resv_no | varchar(max) | YES | 번호 |
| 30 | resv_detl_line_no | bigint | YES | 번호 |
| 31 | svc_shop_cd | varchar(max) | YES | 전시장 코드 |
| 32 | svc_resv_dt | varchar(max) | YES | 일자 |
| 33 | svc_resv_seq | varchar(max) | YES | 순번 |
| 34 | svc_propo_dt | varchar(max) | YES | 일자 |
| 35 | svc_propo_seq | varchar(max) | YES | 순번 |
| 36 | svc_part_no | varchar(max) | YES | 부품번호 |
| 37 | svc_part_seq | varchar(max) | YES | 부품 |
| 38 | filter_cd | varchar(max) | YES | 코드 |
| 39 | tmkr_remark | varchar(max) | YES |  |
| 40 | bo_sout_qty | bigint | YES | 수량 |
| 41 | reg_dt | varchar(max) | YES | 등록일 |
| 42 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 43 | upd_dt | varchar(max) | YES | 수정일 |
| 44 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 45 | resv_clear_qty | decimal(18,0) | YES | 수량 |
| 46 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 47 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_part  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | part_no | varchar(max) | YES | 부품번호 |
| 2 | part_nm | varchar(max) | YES | 부품 |
| 3 | splr_cd | varchar(max) | YES | 코드 |
| 4 | franchise_cd | varchar(max) | YES | 코드 |
| 5 | impt_cd | varchar(max) | YES | 코드 |
| 6 | prod_cd | varchar(max) | YES | 코드 |
| 7 | subs_cd_old | varchar(max) | YES |  |
| 8 | subs_part_no_old | varchar(max) | YES | 부품번호 |
| 9 | subs_cd_new | varchar(max) | YES |  |
| 10 | subs_part_no_new | varchar(max) | YES | 부품번호 |
| 11 | lk | varchar(max) | YES |  |
| 12 | stop_sale_cd | varchar(max) | YES | 판매 |
| 13 | non_re_order_cd | varchar(max) | YES | 주문 |
| 14 | pnc | varchar(max) | YES |  |
| 15 | epc_fig_no | varchar(max) | YES | 번호 |
| 16 | tariff_cd | varchar(max) | YES | 코드 |
| 17 | all_time_buy_cd | varchar(max) | YES | 코드 |
| 18 | stock_type | varchar(max) | YES | 재고 |
| 19 | prod_start_dt | varchar(max) | YES | 시작일 |
| 20 | prod_end_dt | varchar(max) | YES | 종료일 |
| 21 | rp_drct | bigint | YES |  |
| 22 | price_group_cd | varchar(max) | YES | 가격 |
| 23 | price_fmla_cd | varchar(max) | YES | 가격 |
| 24 | net_weit | decimal(18,0) | YES |  |
| 25 | prod_lot | varchar(max) | YES |  |
| 26 | case_lot | varchar(max) | YES |  |
| 27 | rack_type | varchar(max) | YES | 유형코드 |
| 28 | ideal_qty_per_box | bigint | YES | 수량 |
| 29 | no_of_used_box | bigint | YES |  |
| 30 | part_no_edit_cd | varchar(max) | YES | 부품번호 |
| 31 | tmc_non_stock_cd | varchar(max) | YES | 재고 |
| 32 | local_yn | varchar(max) | YES | 여부(Y/N) |
| 33 | cons_part_yn | varchar(max) | YES | 부품 |
| 34 | ssq_auto_yn | varchar(max) | YES | 여부(Y/N) |
| 35 | purc_unit | varchar(max) | YES |  |
| 36 | sale_unit | varchar(max) | YES | 판매 |
| 37 | conv_qty | bigint | YES | 수량 |
| 38 | order_unit_qty | bigint | YES | 수량 |
| 39 | pick_slip_unit_qty | bigint | YES | 수량 |
| 40 | bin_slip_unit_qty | bigint | YES | 수량 |
| 41 | barc_no | varchar(max) | YES | 번호 |
| 42 | wide | bigint | YES |  |
| 43 | leng | bigint | YES |  |
| 44 | heit | bigint | YES |  |
| 45 | size_type | varchar(max) | YES | 유형코드 |
| 46 | part_reg_dt | varchar(max) | YES | 부품 |
| 47 | group_cd | varchar(max) | YES | 코드 |
| 48 | use_yn | varchar(max) | YES | 여부(Y/N) |
| 49 | key_part_yn | varchar(max) | YES | 부품 |
| 50 | key_kind | varchar(max) | YES |  |
| 51 | fax_part_yn | varchar(max) | YES | 부품 |
| 52 | order_unit_auto_set_yn | varchar(max) | YES | 주문 |
| 53 | oil_purc_yn | varchar(max) | YES | 여부(Y/N) |
| 54 | unit_pack_qty | bigint | YES | 수량 |
| 55 | usage_type | varchar(max) | YES | 유형코드 |
| 56 | note | varchar(max) | YES |  |
| 57 | dealer_id | varchar(max) | YES | 딜러 ID |
| 58 | reg_dt | varchar(max) | YES | 등록일 |
| 59 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 60 | upd_dt | varchar(max) | YES | 수정일 |
| 61 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 62 | lexus_price_app_flag | varchar(max) | YES | 가격 |
| 63 | pre_order_yn | varchar(max) | YES | 주문 |
| 64 | brandship | varchar(max) | YES | 브랜드 |
| 65 | hs_code | varchar(max) | YES | 코드 |
| 66 | coo | varchar(max) | YES |  |
| 67 | first_prod_user | varchar(max) | YES |  |
| 68 | part_nm_kor | varchar(max) | YES | 부품 |
| 69 | racode | varchar(max) | YES | 코드 |
| 70 | jsp | varchar(max) | YES |  |
| 71 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 72 | brand | varchar(20) | YES | 브랜드 |

#### stg.pt_poss  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | poss_seq | decimal(18,0) | YES |
| 2 | purc_no | varchar(max) | YES |
| 3 | dist_fd | varchar(max) | YES |
| 4 | lk | varchar(max) | YES |
| 5 | tran_type | varchar(max) | YES |
| 6 | bo_inst | varchar(max) | YES |
| 7 | potn_cd | varchar(max) | YES |
| 8 | potn_item_cnt | varchar(max) | YES |
| 9 | potn_qty | bigint | YES |
| 10 | potn_amt | bigint | YES |
| 11 | tmc_file_crea_dt | varchar(max) | YES |
| 12 | reg_dt | varchar(max) | YES |
| 13 | reg_user_id | varchar(max) | YES |
| 14 | upd_dt | varchar(max) | YES |
| 15 | upd_user_id | varchar(max) | YES |
| 16 | elt_timestamp | varchar(100) | YES |
| 17 | brand | varchar(100) | YES |

#### stg.pt_poss_detl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | poss_seq | decimal(18,0) | YES |
| 2 | line_no | int | YES |
| 3 | purc_no | varchar(max) | YES |
| 4 | purc_detl_line_no | varchar(max) | YES |
| 5 | bo_cd | varchar(max) | YES |
| 6 | ra_cd | varchar(max) | YES |
| 7 | proc_part_no | varchar(max) | YES |
| 8 | purc_part_no | varchar(max) | YES |
| 9 | proc_qty | bigint | YES |
| 10 | purc_qty | bigint | YES |
| 11 | fob | bigint | YES |
| 12 | esti_proc_dt | varchar(max) | YES |
| 13 | reg_dt | varchar(max) | YES |
| 14 | reg_user_id | varchar(max) | YES |
| 15 | upd_dt | varchar(max) | YES |
| 16 | upd_user_id | varchar(max) | YES |
| 17 | elt_timestamp | varchar(100) | YES |
| 18 | brand | varchar(20) | YES |

#### stg.pt_purc  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_no | varchar(max) | YES |
| 2 | splr_cd | varchar(max) | YES |
| 3 | purc_shop_cd | varchar(max) | YES |
| 4 | purc_dt | varchar(max) | YES |
| 5 | purc_ask_man_cd | varchar(max) | YES |
| 6 | purc_type | varchar(max) | YES |
| 7 | tmc_purc_type | varchar(max) | YES |
| 8 | purc_tran_type | varchar(max) | YES |
| 9 | lk | varchar(max) | YES |
| 10 | bo_inst | varchar(max) | YES |
| 11 | file_send_dt | varchar(max) | YES |
| 12 | send_file_nm | varchar(max) | YES |
| 13 | stat | varchar(max) | YES |
| 14 | ship_fini_yn | varchar(max) | YES |
| 15 | impt_cd | varchar(max) | YES |
| 16 | dist_fd | varchar(max) | YES |
| 17 | real_fd | varchar(max) | YES |
| 18 | sugg_purc_yn | varchar(max) | YES |
| 19 | bo_order_yn | varchar(max) | YES |
| 20 | purc_cnfm_man | varchar(max) | YES |
| 21 | purc_cnfm_dt | varchar(max) | YES |
| 22 | air_frgt_amt | bigint | YES |
| 23 | curr | varchar(max) | YES |
| 24 | ariv_req_dt | varchar(max) | YES |
| 25 | eta_local | varchar(max) | YES |
| 26 | close_dt | varchar(max) | YES |
| 27 | close_note | varchar(max) | YES |
| 28 | close_man | varchar(max) | YES |
| 29 | tmc_proc_yn | varchar(max) | YES |
| 30 | cncl_yn | varchar(max) | YES |
| 31 | purc_sugg_no | varchar(max) | YES |
| 32 | order_bo_seq | decimal(18,0) | YES |
| 33 | purc_order_group_no | varchar(max) | YES |
| 34 | order_shop_cd | varchar(max) | YES |
| 35 | order_no | varchar(max) | YES |
| 36 | key_kind | varchar(max) | YES |
| 37 | remark | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | elt_timestamp | varchar(100) | YES |
| 43 | brand | varchar(20) | YES |

#### stg.pt_purc_detl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_no | varchar(max) | YES |
| 2 | line_no | int | YES |
| 3 | purc_part_no | varchar(max) | YES |
| 4 | purc_qty | bigint | YES |
| 5 | proc_qty | bigint | YES |
| 6 | ship_qty | bigint | YES |
| 7 | sin_qty | bigint | YES |
| 8 | purc_unit | varchar(max) | YES |
| 9 | conv_qty | bigint | YES |
| 10 | purc_price | decimal(18,0) | YES |
| 11 | purc_amt | decimal(18,0) | YES |
| 12 | vat_amt | decimal(18,0) | YES |
| 13 | splr_cd | varchar(max) | YES |
| 14 | ship_fini_yn | varchar(max) | YES |
| 15 | bo_clea_yn | varchar(max) | YES |
| 16 | stat | varchar(max) | YES |
| 17 | poss_potn_cd | varchar(max) | YES |
| 18 | close_dt | varchar(max) | YES |
| 19 | purc_sugg_no | varchar(max) | YES |
| 20 | purc_sugg_delt_line_no | int | YES |
| 21 | order_bo_seq | decimal(18,0) | YES |
| 22 | order_bo_detl_line_no | int | YES |
| 23 | order_shop_cd | varchar(max) | YES |
| 24 | order_no | varchar(max) | YES |
| 25 | order_line_no | decimal(18,0) | YES |
| 26 | reg_dt | varchar(max) | YES |
| 27 | reg_user_id | varchar(max) | YES |
| 28 | upd_dt | varchar(max) | YES |
| 29 | upd_user_id | varchar(max) | YES |
| 30 | elt_timestamp | varchar(100) | YES |
| 31 | brand | varchar(20) | YES |

#### stg.pt_resv  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | resv_no | varchar(max) | YES |
| 3 | resv_dt | varchar(max) | YES |
| 4 | cust_no | varchar(max) | YES |
| 5 | cust_nm | varchar(max) | YES |
| 6 | cust_key | bigint | YES |
| 7 | comp_key | bigint | YES |
| 8 | cust_type | varchar(max) | YES |
| 9 | vin | varchar(max) | YES |
| 10 | vehic_no1 | varchar(max) | YES |
| 11 | vehic_no2 | varchar(max) | YES |
| 12 | tel_area1 | varchar(max) | YES |
| 13 | tel_no1 | varchar(max) | YES |
| 14 | tel_area2 | varchar(max) | YES |
| 15 | tel_no2 | varchar(max) | YES |
| 16 | sent_requ_yn | varchar(max) | YES |
| 17 | sent_dt | varchar(max) | YES |
| 18 | sent_place | varchar(max) | YES |
| 19 | sent_type | varchar(max) | YES |
| 20 | pay_type | varchar(max) | YES |
| 21 | prep_amt | bigint | YES |
| 22 | prep_yn | varchar(max) | YES |
| 23 | prep_pay_amt | bigint | YES |
| 24 | resv_amt | bigint | YES |
| 25 | dc_rate | decimal(18,0) | YES |
| 26 | resv_vat_amt | bigint | YES |
| 27 | rcit_amt | bigint | YES |
| 28 | rcit_dt | varchar(max) | YES |
| 29 | stat | varchar(max) | YES |
| 30 | cnfm_yn | varchar(max) | YES |
| 31 | credit_yn | varchar(max) | YES |
| 32 | order_yn | varchar(max) | YES |
| 33 | remark | varchar(max) | YES |
| 34 | acnt_link_yn | varchar(max) | YES |
| 35 | acnt_link_key | bigint | YES |
| 36 | acnt_link_dt | varchar(max) | YES |
| 37 | acnt_link_file | varchar(max) | YES |
| 38 | term_id | bigint | YES |
| 39 | tax_type | bigint | YES |
| 40 | tax_rate | decimal(18,0) | YES |
| 41 | biz_reg_no | varchar(max) | YES |
| 42 | quot_no | varchar(max) | YES |
| 43 | receipt_key | decimal(18,0) | YES |
| 44 | dealer_id | varchar(max) | YES |
| 45 | reg_dt | varchar(max) | YES |
| 46 | reg_user_id | varchar(max) | YES |
| 47 | upd_dt | varchar(max) | YES |
| 48 | upd_user_id | varchar(max) | YES |
| 49 | key_yn | varchar(max) | YES |
| 50 | order_no | varchar(max) | YES |
| 51 | refund_yn | varchar(max) | YES |
| 52 | elt_timestamp | varchar(100) | YES |
| 53 | brand | varchar(20) | YES |

#### stg.pt_si  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | purc_invo_dt | varchar(max) | YES |
| 3 | dist_fd | varchar(max) | YES |
| 4 | etd | varchar(max) | YES |
| 5 | gross_weit | decimal(18,0) | YES |
| 6 | net_weit | decimal(18,0) | YES |
| 7 | msmt | decimal(18,0) | YES |
| 8 | cntn_no | varchar(max) | YES |
| 9 | vesl_name | varchar(max) | YES |
| 10 | ship_dt | varchar(max) | YES |
| 11 | eta | varchar(max) | YES |
| 12 | ship_comp_cd | varchar(max) | YES |
| 13 | bl | varchar(max) | YES |
| 14 | fob_amt | decimal(18,0) | YES |
| 15 | frgt | varchar(max) | YES |
| 16 | insu_amt | decimal(18,0) | YES |
| 17 | curr_rate | decimal(18,0) | YES |
| 18 | curr_apply_dt | varchar(max) | YES |
| 19 | ship_shop | varchar(max) | YES |
| 20 | fina_yn | varchar(max) | YES |
| 21 | lc_apply_yn | varchar(max) | YES |
| 22 | stat | varchar(max) | YES |
| 23 | sin_prep_dt | varchar(max) | YES |
| 24 | tmc_file_crea_dt | varchar(max) | YES |
| 25 | acnt_link_yn | varchar(max) | YES |
| 26 | acnt_link_dt | varchar(max) | YES |
| 27 | acnt_link_key | bigint | YES |
| 28 | acnt_link_key2 | decimal(18,0) | YES |
| 29 | term_id | bigint | YES |
| 30 | tax_type | bigint | YES |
| 31 | tax_rate | decimal(18,0) | YES |
| 32 | local_yn | varchar(max) | YES |
| 33 | biz_reg_no | varchar(max) | YES |
| 34 | curr | varchar(max) | YES |
| 35 | frgt_amt | decimal(18,0) | YES |
| 36 | cstm_reg_yn | varchar(max) | YES |
| 37 | cstm_cnfm_yn | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | etd_temp | decimal(18,0) | YES |
| 43 | eta_temp | decimal(18,0) | YES |
| 44 | elt_timestamp | varchar(100) | YES |
| 45 | brand | varchar(20) | YES |

#### stg.pt_si_detl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | purc_invo_no | varchar(max) | YES |
| 2 | line_no | decimal(18,0) | YES |
| 3 | purc_no | varchar(max) | YES |
| 4 | purc_detl_line_no | int | YES |
| 5 | case_no | varchar(max) | YES |
| 6 | ship_part_no | varchar(max) | YES |
| 7 | ship_qty | bigint | YES |
| 8 | sort_qty | bigint | YES |
| 9 | sort_over_qty | bigint | YES |
| 10 | sort_short_qty | bigint | YES |
| 11 | sort_dmge_qty | bigint | YES |
| 12 | sort_desc | varchar(max) | YES |
| 13 | sin_qty | bigint | YES |
| 14 | sin_over_qty | bigint | YES |
| 15 | sin_short_qty | bigint | YES |
| 16 | sin_dmge_qty | bigint | YES |
| 17 | sin_desc | varchar(max) | YES |
| 18 | fob | decimal(18,0) | YES |
| 19 | amt | decimal(18,0) | YES |
| 20 | tari_cd | varchar(max) | YES |
| 21 | real_fd | varchar(max) | YES |
| 22 | dist_col | varchar(max) | YES |
| 23 | splr_cd | varchar(max) | YES |
| 24 | lc | bigint | YES |
| 25 | cart_no | varchar(max) | YES |
| 26 | stat | varchar(max) | YES |
| 27 | cstm_amt | bigint | YES |
| 28 | etc_amt | bigint | YES |
| 29 | insu_amt | decimal(18,0) | YES |
| 30 | frgt_amt | decimal(18,0) | YES |
| 31 | fob_weit | decimal(18,0) | YES |
| 32 | release_part_yn | varchar(max) | YES |
| 33 | release_yn | varchar(max) | YES |
| 34 | resv_qty_at_sin | bigint | YES |
| 35 | resv_clear_qty | bigint | YES |
| 36 | cstm_reg_yn | varchar(max) | YES |
| 37 | cstm_cnfm_yn | varchar(max) | YES |
| 38 | reg_dt | varchar(max) | YES |
| 39 | reg_user_id | varchar(max) | YES |
| 40 | upd_dt | varchar(max) | YES |
| 41 | upd_user_id | varchar(max) | YES |
| 42 | item_no | varchar(max) | YES |
| 43 | coo | varchar(max) | YES |
| 44 | elt_timestamp | varchar(100) | YES |
| 45 | brand | varchar(20) | YES |

#### stg.pt_sin  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sin_no | varchar(max) | YES |
| 3 | sin_dt | varchar(max) | YES |
| 4 | sin_type | varchar(max) | YES |
| 5 | sin_kind | varchar(max) | YES |
| 6 | stat | varchar(max) | YES |
| 7 | sin_fini_yn | varchar(max) | YES |
| 8 | splr_cd | varchar(max) | YES |
| 9 | acnt_link_yn | varchar(max) | YES |
| 10 | acnt_link_dt | varchar(max) | YES |
| 11 | acnt_link_file | varchar(max) | YES |
| 12 | acnt_link_key | bigint | YES |
| 13 | term_id | bigint | YES |
| 14 | tax_type | bigint | YES |
| 15 | tax_rate | decimal(18,0) | YES |
| 16 | biz_reg_no | varchar(max) | YES |
| 17 | auto_crea_yn | varchar(max) | YES |
| 18 | cncl_yn | varchar(max) | YES |
| 19 | remark | varchar(max) | YES |
| 20 | sin_cnfm_dt | varchar(max) | YES |
| 21 | sin_sply_amt | bigint | YES |
| 22 | sin_vat_amt | bigint | YES |
| 23 | pay_type | varchar(max) | YES |
| 24 | modi_yn | varchar(max) | YES |
| 25 | biz_shop_cd | varchar(max) | YES |
| 26 | biz_no | varchar(max) | YES |
| 27 | dealer_id | varchar(max) | YES |
| 28 | reg_dt | varchar(max) | YES |
| 29 | reg_user_id | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | upd_user_id | varchar(max) | YES |
| 32 | purc_invo_no | varchar(max) | YES |
| 33 | elt_timestamp | varchar(100) | YES |
| 34 | brand | varchar(20) | YES |

#### stg.pt_sin_detl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sin_no | varchar(max) | YES |
| 3 | line_no | int | YES |
| 4 | part_no | varchar(max) | YES |
| 5 | sin_qty | bigint | YES |
| 6 | sin_price | bigint | YES |
| 7 | sin_unit | varchar(max) | YES |
| 8 | conv_qty | bigint | YES |
| 9 | sin_amt | bigint | YES |
| 10 | sin_vat_amt | bigint | YES |
| 11 | sin_dt | varchar(max) | YES |
| 12 | sin_cnfm_qty | bigint | YES |
| 13 | sin_fini_yn | varchar(max) | YES |
| 14 | stock_price_at_sin | bigint | YES |
| 15 | stock_amt_at_sin | bigint | YES |
| 16 | sin_man | varchar(max) | YES |
| 17 | stat | varchar(max) | YES |
| 18 | sin_start_day | varchar(max) | YES |
| 19 | sin_end_day | varchar(max) | YES |
| 20 | splr_cd | varchar(max) | YES |
| 21 | biz_shop_cd | varchar(max) | YES |
| 22 | biz_no | varchar(max) | YES |
| 23 | biz_detl_line_no | int | YES |
| 24 | reg_dt | varchar(max) | YES |
| 25 | reg_user_id | varchar(max) | YES |
| 26 | upd_dt | varchar(max) | YES |
| 27 | upd_user_id | varchar(max) | YES |
| 28 | purc_invo_no | varchar(max) | YES |
| 29 | purc_invo_line_no | decimal(18,0) | YES |
| 30 | elt_timestamp | varchar(100) | YES |
| 31 | brand | varchar(20) | YES |

#### stg.pt_sout_detl_ims  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sout_no | varchar(max) | YES |
| 3 | line_no | int | YES |
| 4 | sout_dt | varchar(max) | YES |
| 5 | part_no | varchar(max) | YES |
| 6 | sout_order_qty | bigint | YES |
| 7 | sout_qty | bigint | YES |
| 8 | sout_check_qty | bigint | YES |
| 9 | sout_over_qty | bigint | YES |
| 10 | sout_short_qty | bigint | YES |
| 11 | sout_dmge_qty | bigint | YES |
| 12 | sout_deni_qty | bigint | YES |
| 13 | pick_qty | bigint | YES |
| 14 | pick_over_qty | bigint | YES |
| 15 | pick_short_qty | bigint | YES |
| 16 | pick_dmge_qty | bigint | YES |
| 17 | pick_deni_qty | bigint | YES |
| 18 | sout_price | bigint | YES |
| 19 | sout_amt | bigint | YES |
| 20 | sout_unit | varchar(max) | YES |
| 21 | conv_qty | bigint | YES |
| 22 | dc_rate | decimal(18,0) | YES |
| 23 | dc_amt | bigint | YES |
| 24 | sale_price | bigint | YES |
| 25 | sale_amt | bigint | YES |
| 26 | sout_vat_amt | bigint | YES |
| 27 | fina_amt | bigint | YES |
| 28 | stock_price_at_sout | bigint | YES |
| 29 | stock_amt_at_sout | bigint | YES |
| 30 | sout_cnfm_qty | bigint | YES |
| 31 | sout_cnfm_dt | varchar(max) | YES |
| 32 | sout_fini_yn | varchar(max) | YES |
| 33 | sout_start_day | varchar(max) | YES |
| 34 | sout_end_day | varchar(max) | YES |
| 35 | cart_no | varchar(max) | YES |
| 36 | stat | varchar(max) | YES |
| 37 | pack_no | varchar(max) | YES |
| 38 | sout_man | varchar(max) | YES |
| 39 | rcit_man | varchar(max) | YES |
| 40 | claim_qty | bigint | YES |
| 41 | dmge_qty | bigint | YES |
| 42 | cncl_qty | bigint | YES |
| 43 | cncl_yn | varchar(max) | YES |
| 44 | remark | varchar(max) | YES |
| 45 | order_allo_dt | varchar(max) | YES |
| 46 | purc_invo_no | varchar(max) | YES |
| 47 | purc_invo_line_no | bigint | YES |
| 48 | biz_shop_cd | varchar(max) | YES |
| 49 | biz_no | varchar(max) | YES |
| 50 | biz_detl_line_no | int | YES |
| 51 | shop_fran_cd | varchar(max) | YES |
| 52 | reg_dt | varchar(max) | YES |
| 53 | reg_user_id | varchar(max) | YES |
| 54 | upd_dt | varchar(max) | YES |
| 55 | upd_user_id | varchar(max) | YES |
| 56 | elt_timestamp | varchar(100) | YES |
| 57 | brand | varchar(20) | YES |

#### stg.pt_sout_ims  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | sout_no | varchar(max) | YES |
| 3 | sout_dt | varchar(max) | YES |
| 4 | sout_type | varchar(max) | YES |
| 5 | sout_kind | varchar(max) | YES |
| 6 | stat | varchar(max) | YES |
| 7 | sout_fini_yn | varchar(max) | YES |
| 8 | acnt_link_yn | varchar(max) | YES |
| 9 | acnt_link_dt | varchar(max) | YES |
| 10 | acnt_link_file | varchar(max) | YES |
| 11 | acnt_link_key | decimal(18,0) | YES |
| 12 | dest | varchar(max) | YES |
| 13 | pda_regi_yn | varchar(max) | YES |
| 14 | pda_cnfm_yn | varchar(max) | YES |
| 15 | tax_invo_issue_yn | varchar(max) | YES |
| 16 | tax_invo_no | varchar(max) | YES |
| 17 | tax_invo_issue_dt | varchar(max) | YES |
| 18 | auto_crea_yn | varchar(max) | YES |
| 19 | sout_cnfm_dt | varchar(max) | YES |
| 20 | sout_sply_amt | bigint | YES |
| 21 | dc_rate | decimal(18,0) | YES |
| 22 | dc_amt | bigint | YES |
| 23 | sale_amt | bigint | YES |
| 24 | totl_sout_vat_amt | bigint | YES |
| 25 | tran_amt | bigint | YES |
| 26 | fina_amt | bigint | YES |
| 27 | claim_kind | varchar(max) | YES |
| 28 | pay_type | varchar(max) | YES |
| 29 | cust_no | varchar(max) | YES |
| 30 | cust_nm | varchar(max) | YES |
| 31 | cust_kind | varchar(max) | YES |
| 32 | cust_seq | bigint | YES |
| 33 | comp_seq | bigint | YES |
| 34 | vin | varchar(max) | YES |
| 35 | vehic_no1 | varchar(max) | YES |
| 36 | vehic_no2 | varchar(max) | YES |
| 37 | addr1 | varchar(max) | YES |
| 38 | addr2 | varchar(max) | YES |
| 39 | addr3 | varchar(max) | YES |
| 40 | tel_no1 | varchar(max) | YES |
| 41 | tel_no2 | varchar(max) | YES |
| 42 | tel_no3 | varchar(max) | YES |
| 43 | upd_yn | varchar(max) | YES |
| 44 | invo_print_yn | varchar(max) | YES |
| 45 | cncl_yn | varchar(max) | YES |
| 46 | retn_resn | varchar(max) | YES |
| 47 | retn_cter_man | varchar(max) | YES |
| 48 | remark | varchar(max) | YES |
| 49 | term_id | bigint | YES |
| 50 | tax_rate | decimal(18,0) | YES |
| 51 | tax_type | bigint | YES |
| 52 | biz_reg_no | varchar(max) | YES |
| 53 | invo_dt | varchar(max) | YES |
| 54 | invo_print_day | varchar(max) | YES |
| 55 | purc_invo_no | varchar(max) | YES |
| 56 | bo_yn | varchar(max) | YES |
| 57 | biz_shop_cd | varchar(max) | YES |
| 58 | biz_no | varchar(max) | YES |
| 59 | dealer_id | varchar(max) | YES |
| 60 | shop_fran_cd | varchar(max) | YES |
| 61 | reg_dt | varchar(max) | YES |
| 62 | reg_user_id | varchar(max) | YES |
| 63 | upd_dt | varchar(max) | YES |
| 64 | upd_user_id | varchar(max) | YES |
| 65 | cpd_code | varchar(max) | YES |
| 66 | elt_timestamp | varchar(100) | YES |
| 67 | brand | varchar(20) | YES |

#### stg.pt_stock  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | part_no | varchar(max) | YES | 부품번호 |
| 3 | stock_qty | bigint | YES | 수량 |
| 4 | stock_amt | bigint | YES | 금액 |
| 5 | purc_qty_total | bigint | YES | 수량 |
| 6 | purc_qty_serv | bigint | YES | 수량 |
| 7 | purc_qty_vor | bigint | YES | 수량 |
| 8 | purc_qty_eo | bigint | YES | 수량 |
| 9 | purc_qty_so | bigint | YES | 수량 |
| 10 | purc_qty_fo | bigint | YES | 수량 |
| 11 | purc_qty_bo_air | bigint | YES | 수량 |
| 12 | purc_qty_bo_sea | bigint | YES | 수량 |
| 13 | purc_qty_oths | bigint | YES | 수량 |
| 14 | tran_qty_total | bigint | YES | 수량 |
| 15 | tran_qty_serv | bigint | YES | 수량 |
| 16 | tran_qty_vor | bigint | YES | 수량 |
| 17 | tran_qty_eo | bigint | YES | 수량 |
| 18 | tran_qty_so | bigint | YES | 수량 |
| 19 | tran_qty_fo | bigint | YES | 수량 |
| 20 | tran_qty_bo_air | bigint | YES | 수량 |
| 21 | tran_qty_bo_sea | bigint | YES | 수량 |
| 22 | tran_qty_oths | bigint | YES | 수량 |
| 23 | order_qty_total | bigint | YES | 수량 |
| 24 | order_qty_serv | bigint | YES | 수량 |
| 25 | order_qty_vor | bigint | YES | 수량 |
| 26 | order_qty_eo | bigint | YES | 수량 |
| 27 | order_qty_so | bigint | YES | 수량 |
| 28 | order_qty_fo | bigint | YES | 수량 |
| 29 | order_qty_bo_air | bigint | YES | 수량 |
| 30 | order_qty_bo_sea | bigint | YES | 수량 |
| 31 | order_qty_oths | bigint | YES | 수량 |
| 32 | resv_qty | bigint | YES | 수량 |
| 33 | sout_wait_qty | bigint | YES | 수량 |
| 34 | sout_wait_qty_calc | bigint | YES | 수량 |
| 35 | sin_wait_qty | bigint | YES | 수량 |
| 36 | sin_wait_amt | bigint | YES | 금액 |
| 37 | stock_adjt_qty_plus | bigint | YES | 수량 |
| 38 | stock_adjt_qty_minus | bigint | YES | 수량 |
| 39 | purc_claim_qty | bigint | YES | 수량 |
| 40 | stnd_stock_qty | bigint | YES | 수량 |
| 41 | stnd_stock_qty_temp | bigint | YES | 수량 |
| 42 | stnd_stock_mnge_yn | varchar(max) | YES | 재고 |
| 43 | safe_stock_qty | bigint | YES | 수량 |
| 44 | late_purc_price | bigint | YES | 가격 |
| 45 | late_sin_dt | varchar(max) | YES | 일자 |
| 46 | late_sout_dt | varchar(max) | YES | 일자 |
| 47 | bin_loca | varchar(max) | YES |  |
| 48 | resv_bin_loca | varchar(max) | YES |  |
| 49 | mad | decimal(18,0) | YES |  |
| 50 | prev_mad | decimal(18,0) | YES |  |
| 51 | stock_qty_open_yn | varchar(max) | YES | 수량 |
| 52 | soq_calc_yn | varchar(max) | YES | 여부(Y/N) |
| 53 | icc | varchar(max) | YES |  |
| 54 | scc | varchar(max) | YES |  |
| 55 | scc_manu | varchar(max) | YES |  |
| 56 | mad_fluc_warn_yn | varchar(max) | YES | 여부(Y/N) |
| 57 | abno_mad_fluc_yn | varchar(max) | YES | 여부(Y/N) |
| 58 | mad_fluc_rate | decimal(18,0) | YES |  |
| 59 | stock_surp_yn | varchar(max) | YES | 재고 |
| 60 | short_warn_qty | bigint | YES | 수량 |
| 61 | stock_prot_qty | bigint | YES | 수량 |
| 62 | prev_stock_qty | bigint | YES | 수량 |
| 63 | prev_stock_amt | bigint | YES | 금액 |
| 64 | dealer_id | varchar(max) | YES | 딜러 ID |
| 65 | reg_dt | varchar(max) | YES | 등록일 |
| 66 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 67 | upd_dt | varchar(max) | YES | 수정일 |
| 68 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 69 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 70 | brand | varchar(20) | YES | 브랜드 |

#### stg.sfa_consult_log  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | cons_seq | decimal(18,0) | YES |
| 2 | dealer_id | varchar(500) | YES |
| 3 | shop_cd | varchar(500) | YES |
| 4 | mng_sc_id | varchar(500) | YES |
| 5 | cons_dt | varchar(500) | YES |
| 6 | hold_type | varchar(500) | YES |
| 7 | cust_res | varchar(500) | YES |
| 8 | cust_nm | varchar(500) | YES |
| 9 | cust_seq | decimal(18,0) | YES |
| 10 | sex_cd | varchar(500) | YES |
| 11 | age_cd | varchar(500) | YES |
| 12 | marry_yn | varchar(500) | YES |
| 13 | child_cnt | decimal(18,0) | YES |
| 14 | job_cd | varchar(500) | YES |
| 15 | job_detail | varchar(500) | YES |
| 16 | hobby_cd | varchar(500) | YES |
| 17 | concern_mdl1 | varchar(500) | YES |
| 18 | concern_mdl2 | varchar(500) | YES |
| 19 | target_brand | varchar(500) | YES |
| 20 | target_mdl | varchar(500) | YES |
| 21 | prev_brand | varchar(500) | YES |
| 22 | prev_mdl | varchar(500) | YES |
| 23 | buy_purpo | varchar(500) | YES |
| 24 | buy_cd | varchar(500) | YES |
| 25 | driver | varchar(500) | YES |
| 26 | drive_type_pr | varchar(500) | YES |
| 27 | drive_type_km | decimal(18,0) | YES |
| 28 | budget | decimal(18,0) | YES |
| 29 | pay_type | varchar(500) | YES |
| 30 | sales_t_dt | varchar(500) | YES |
| 31 | upd_dt | varchar(500) | YES |
| 32 | recent_yn | varchar(500) | YES |
| 33 | concern_degree | varchar(500) | YES |
| 34 | elt_timestamp | varchar(100) | YES |
| 35 | brand | varchar(20) | YES |

#### stg.sfa_showroom_desc  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | showroom | varchar(max) | YES |
| 2 | sr_seq | decimal(18,0) | YES |
| 3 | dealer_id | varchar(max) | YES |
| 4 | recept_sc | varchar(max) | YES |
| 5 | recept_dt | varchar(max) | YES |
| 6 | recept_fr_time | varchar(max) | YES |
| 7 | recept_to_time | varchar(max) | YES |
| 8 | cust_seq | decimal(18,0) | YES |
| 9 | active_knd | varchar(max) | YES |
| 10 | concern_mdl1 | varchar(max) | YES |
| 11 | concern_mdl2 | varchar(max) | YES |
| 12 | other_comp_brand | varchar(max) | YES |
| 13 | other_comp_model | varchar(max) | YES |
| 14 | sex_cd | varchar(max) | YES |
| 15 | age | varchar(max) | YES |
| 16 | cust_response | varchar(max) | YES |
| 17 | remark | varchar(max) | YES |
| 18 | active_result | varchar(max) | YES |
| 19 | reg_dt | varchar(max) | YES |
| 20 | upd_dt | varchar(max) | YES |
| 21 | owned_car_brand | varchar(max) | YES |
| 22 | owned_car_model | varchar(max) | YES |
| 23 | revisit_yn | varchar(max) | YES |
| 24 | active_knd_dtl | varchar(max) | YES |
| 25 | ex_cnt | decimal(18,0) | YES |
| 26 | recept_time | varchar(max) | YES |
| 27 | dm_yn | varchar(max) | YES |
| 28 | tel_yn | varchar(max) | YES |
| 29 | cons_seq | decimal(18,0) | YES |
| 30 | elt_timestamp | varchar(100) | YES |
| 31 | brand | varchar(20) | YES |

#### stg.sfa_testcar_trial_ktws  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | reserved_dt | varchar(max) | YES |
| 2 | from_time | varchar(max) | YES |
| 3 | testcar_no | varchar(max) | YES |
| 4 | trial_no | varchar(max) | YES |
| 5 | dealer_id | varchar(max) | YES |
| 6 | shop_cd | varchar(max) | YES |
| 7 | to_time | varchar(max) | YES |
| 8 | reserve_term | decimal(18,0) | YES |
| 9 | prev_km | decimal(18,0) | YES |
| 10 | test_type | varchar(max) | YES |
| 11 | use_type | varchar(max) | YES |
| 12 | vin | varchar(max) | YES |
| 13 | model_cd | varchar(max) | YES |
| 14 | variant_cd | varchar(max) | YES |
| 15 | my_cd | varchar(max) | YES |
| 16 | cust_seq | decimal(18,0) | YES |
| 17 | cust_nm | varchar(max) | YES |
| 18 | res_group_id | varchar(max) | YES |
| 19 | res_user_id | varchar(max) | YES |
| 20 | res_memo | varchar(max) | YES |
| 21 | destination | varchar(max) | YES |
| 22 | end_km | decimal(18,0) | YES |
| 23 | interest_degree | varchar(max) | YES |
| 24 | purchase_degree | varchar(max) | YES |
| 25 | result_memo | varchar(max) | YES |
| 26 | test_yn | varchar(max) | YES |
| 27 | view_word | varchar(max) | YES |
| 28 | reg_dt | varchar(max) | YES |
| 29 | reg_user_id | varchar(max) | YES |
| 30 | upd_dt | varchar(max) | YES |
| 31 | upd_user_id | varchar(max) | YES |
| 32 | test_type2 | varchar(max) | YES |
| 33 | res_shop_cd | varchar(max) | YES |
| 34 | res_dept_cd | varchar(max) | YES |
| 35 | app_flag | varchar(max) | YES |
| 36 | lead_id | decimal(18,0) | YES |
| 37 | trial_grp_seq | decimal(18,0) | YES |
| 38 | elt_timestamp | varchar(100) | YES |
| 39 | brand | varchar(20) | YES |

#### stg.spm_hboard_meeting  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | meet_seq | decimal(18,0) | YES |
| 2 | holding_id | varchar(max) | YES |
| 3 | dealer_id | varchar(max) | YES |
| 4 | shop_cd | varchar(max) | YES |
| 5 | dept_cd | varchar(max) | YES |
| 6 | start_user_id | varchar(max) | YES |
| 7 | start_dt | varchar(max) | YES |
| 8 | status | varchar(max) | YES |
| 9 | close_user_id | varchar(max) | YES |
| 10 | close_dt | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | upd_dt | varchar(max) | YES |
| 13 | elt_timestamp | varchar(100) | YES |
| 14 | brand | varchar(20) | YES |

#### stg.spm_hboard_meeting_chip  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | meet_seq | decimal(18,0) | YES |
| 2 | followup_id | decimal(18,0) | YES |
| 3 | cust_seq | decimal(18,0) | YES |
| 4 | mng_sc_id | varchar(max) | YES |
| 5 | hot_reg_dt | varchar(max) | YES |
| 6 | hboard_reg_dt | varchar(max) | YES |
| 7 | chip_status | varchar(max) | YES |
| 8 | contract_ratio | decimal(18,0) | YES |
| 9 | remark | varchar(max) | YES |
| 10 | drop_reason | varchar(max) | YES |
| 11 | comp_brand_cd | varchar(max) | YES |
| 12 | comp_model_cd | varchar(max) | YES |
| 13 | own_brand_cd | varchar(max) | YES |
| 14 | own_model_cd | varchar(max) | YES |
| 15 | pay_type | varchar(max) | YES |
| 16 | reg_dt | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | own_model_pdt | varchar(max) | YES |
| 19 | mng_remark | varchar(max) | YES |
| 20 | lead_id | decimal(18,0) | YES |
| 21 | elt_timestamp | varchar(100) | YES |
| 22 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_tech  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | real_yn | varchar(max) | YES |
| 7 | techman_id | varchar(max) | YES |
| 8 | main_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | work_date_rn | decimal(18,0) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_tech_plan  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | real_yn | varchar(max) | YES |
| 7 | techman_id | varchar(max) | YES |
| 8 | main_yn | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | work_date_rn | decimal(18,0) | YES |
| 12 | elt_timestamp | varchar(100) | YES |
| 13 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_time  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(max) | YES |
| 7 | stall_no | decimal(18,0) | YES |
| 8 | expt_st_dt | varchar(max) | YES |
| 9 | expt_end_dt | varchar(max) | YES |
| 10 | real_st_dt | varchar(max) | YES |
| 11 | real_end_dt | varchar(max) | YES |
| 12 | stat_cd | varchar(max) | YES |
| 13 | cancel_reason_cd | varchar(max) | YES |
| 14 | tot_rest_minutes | decimal(18,0) | YES |
| 15 | reg_dt | varchar(max) | YES |
| 16 | reg_user_id | varchar(max) | YES |
| 17 | upd_dt | varchar(max) | YES |
| 18 | upd_user_id | varchar(max) | YES |
| 19 | re_repair_yn | varchar(max) | YES |
| 20 | qc_close_yn | varchar(max) | YES |
| 21 | work_seq_next | int | YES |
| 22 | elt_timestamp | varchar(100) | YES |
| 23 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_time_group  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_seq | decimal(18,0) | YES |
| 2 | shop_cd | varchar(max) | YES |
| 3 | propo_dt | varchar(max) | YES |
| 4 | propo_seq | decimal(18,0) | YES |
| 5 | proc_type_cd | varchar(max) | YES |
| 6 | work_seq | int | YES |
| 7 | reg_dt | varchar(max) | YES |
| 8 | reg_user_id | varchar(max) | YES |
| 9 | elt_timestamp | varchar(100) | YES |
| 10 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_time_plan  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | proc_dtl_cd | varchar(max) | YES |
| 7 | stall_no | decimal(18,0) | YES |
| 8 | expt_st_dt | varchar(max) | YES |
| 9 | expt_end_dt | varchar(max) | YES |
| 10 | stat_cd | varchar(max) | YES |
| 11 | cancel_reason_cd | varchar(max) | YES |
| 12 | tot_rest_minutes | decimal(18,0) | YES |
| 13 | re_repair_yn | varchar(max) | YES |
| 14 | reg_dt | varchar(max) | YES |
| 15 | reg_user_id | varchar(max) | YES |
| 16 | elt_timestamp | varchar(100) | YES |
| 17 | brand | varchar(20) | YES |

#### stg.svc_bp_proc_time_rest  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | proc_type_cd | varchar(max) | YES |
| 5 | work_seq | int | YES |
| 6 | seq | int | YES |
| 7 | rest_st_dt | varchar(max) | YES |
| 8 | rest_end_dt | varchar(max) | YES |
| 9 | rest_minutes | decimal(18,0) | YES |
| 10 | rest_reason_cd | varchar(max) | YES |
| 11 | reg_dt | varchar(max) | YES |
| 12 | reg_user_id | varchar(max) | YES |
| 13 | upd_dt | varchar(max) | YES |
| 14 | upd_user_id | varchar(max) | YES |
| 15 | elt_timestamp | varchar(100) | YES |
| 16 | brand | varchar(20) | YES |

#### stg.svc_bp_repeat_kpi  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | year | varchar(max) | YES |
| 3 | month | varchar(max) | YES |
| 4 | category | varchar(max) | YES |
| 5 | proc | varchar(max) | YES |
| 6 | cnt | varchar(max) | YES |
| 7 | reg_user_id | varchar(max) | YES |
| 8 | reg_dt | varchar(max) | YES |
| 9 | upd_user_id | varchar(max) | YES |
| 10 | upd_dt | varchar(max) | YES |
| 11 | elt_timestamp | varchar(100) | YES |
| 12 | brand | varchar(20) | YES |

#### stg.svc_bp_sales_target  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | year | varchar(max) | YES |  |
| 3 | month | varchar(max) | YES |  |
| 4 | bpus | varchar(max) | YES |  |
| 5 | bps | varchar(max) | YES |  |
| 6 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 7 | reg_dt | varchar(max) | YES | 등록일 |
| 8 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 9 | upd_dt | varchar(max) | YES | 수정일 |
| 10 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 11 | brand | varchar(20) | YES | 브랜드 |

#### stg.svc_bp_workdate  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | work_date | varchar(max) | YES |
| 3 | offday_yn | varchar(max) | YES |
| 4 | remark | varchar(max) | YES |
| 5 | reg_dt | varchar(max) | YES |
| 6 | reg_user_id | varchar(max) | YES |
| 7 | upd_dt | varchar(max) | YES |
| 8 | upd_user_id | varchar(max) | YES |
| 9 | em_add_job_cnt | int | YES |
| 10 | elt_timestamp | varchar(100) | YES |
| 11 | brand | varchar(20) | YES |

#### stg.svc_charge_rate  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | apply_st_date | varchar(max) | YES |
| 3 | apply_end_date | varchar(max) | YES |
| 4 | apply_amt | decimal(18,0) | YES |
| 5 | reg_dt | varchar(max) | YES |
| 6 | reg_user_id | varchar(max) | YES |
| 7 | upd_dt | varchar(max) | YES |
| 8 | upd_user_id | varchar(max) | YES |
| 9 | frm_type_cd | varchar(max) | YES |
| 10 | elt_timestamp | varchar(100) | YES |
| 11 | brand | varchar(20) | YES |

#### stg.svc_cust_guide_memo  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(max) | YES | 일자 |
| 3 | propo_seq | decimal(18,0) | YES | 순번 |
| 4 | vin | varchar(max) | YES | 차대번호(VIN) |
| 5 | seq | decimal(18,0) | YES | 순번 |
| 6 | cust_guide_memo | varchar(max) | YES | 고객 |
| 7 | reg_dt | varchar(max) | YES | 등록일 |
| 8 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 9 | upd_dt | varchar(max) | YES | 수정일 |
| 10 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 11 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 12 | brand | varchar(20) | YES | 브랜드 |

#### stg.svc_daily_sales_report  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | type3_cd | varchar(max) | YES | 유형코드 |
| 3 | std_dt | varchar(max) | YES | 일자 |
| 4 | part_amt | decimal(18,0) | YES | 금액 |
| 5 | part_cost | decimal(18,0) | YES | 부품 |
| 6 | labor_amt | decimal(18,0) | YES | 금액 |
| 7 | sublet_amt | decimal(18,0) | YES | 금액 |
| 8 | dc_amt | decimal(18,0) | YES | 금액 |
| 9 | settle_amt | decimal(18,0) | YES | 금액 |
| 10 | extra_amt | decimal(18,0) | YES | 금액 |
| 11 | sales_amt | decimal(18,0) | YES | 금액 |
| 12 | reg_dt | varchar(max) | YES | 등록일 |
| 13 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 14 | brand | varchar(20) | YES | 브랜드 |

#### stg.svc_daily_unit_report  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | std_dt | varchar(max) | YES |
| 3 | bp | decimal(18,0) | YES |
| 4 | fp | decimal(18,0) | YES |
| 5 | po | decimal(18,0) | YES |
| 6 | gr | decimal(18,0) | YES |
| 7 | wt | decimal(18,0) | YES |
| 8 | it | decimal(18,0) | YES |
| 9 | f1k | decimal(18,0) | YES |
| 10 | bp_d_l_cnt | decimal(18,0) | YES |
| 11 | bp_d_m_cnt | decimal(18,0) | YES |
| 12 | bp_d_h_cnt | decimal(18,0) | YES |
| 13 | reg_dt | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.svc_dlr_code_dtl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | group_id | varchar(max) | YES |
| 2 | code_grp | varchar(max) | YES |
| 3 | code | int | YES |
| 4 | code_kor_nm | varchar(max) | YES |
| 5 | code_eng_nm | varchar(max) | YES |
| 6 | disp_rank | decimal(18,0) | YES |
| 7 | use_yn | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | bi_code | varchar(max) | YES |
| 14 | elt_timestamp | varchar(100) | YES |
| 15 | brand | varchar(20) | YES |

#### stg.svc_insu  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | varchar(max) | YES |
| 4 | insu_type_cd | varchar(max) | YES |
| 5 | accident_type_cd | varchar(max) | YES |
| 6 | harm_vehic_no1 | varchar(max) | YES |
| 7 | harm_vehic_no2 | varchar(max) | YES |
| 8 | stat_cd | varchar(max) | YES |
| 9 | accident_dt | varchar(max) | YES |
| 10 | rqst_dt | varchar(max) | YES |
| 11 | tot_rqst_amt | decimal(18,0) | YES |
| 12 | tot_rqst_ar_amt | decimal(18,0) | YES |
| 13 | tot_aprov_amt | decimal(18,0) | YES |
| 14 | close_dt | varchar(max) | YES |
| 15 | close_user_id | varchar(max) | YES |
| 16 | close_cancel_yn | varchar(max) | YES |
| 17 | remark | varchar(max) | YES |
| 18 | file_path_1 | varchar(max) | YES |
| 19 | file_nm_1 | varchar(max) | YES |
| 20 | file_path_2 | varchar(max) | YES |
| 21 | file_nm_2 | varchar(max) | YES |
| 22 | file_path_3 | varchar(max) | YES |
| 23 | file_nm_3 | varchar(max) | YES |
| 24 | tax_cust_seq | varchar(max) | YES |
| 25 | tax_cust_idfy_no | varchar(max) | YES |
| 26 | reg_dt | varchar(max) | YES |
| 27 | reg_user_id | varchar(max) | YES |
| 28 | upd_dt | varchar(max) | YES |
| 29 | upd_user_id | varchar(max) | YES |
| 30 | close_cancel_dt | varchar(max) | YES |
| 31 | elt_timestamp | varchar(100) | YES |
| 32 | brand | varchar(20) | YES |

#### stg.svc_insu_dtl  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | varchar(max) | YES |
| 4 | comp_seq | varchar(max) | YES |
| 5 | insu_type_cd | varchar(max) | YES |
| 6 | accident_rqst_no | varchar(max) | YES |
| 7 | compensation_rate | varchar(max) | YES |
| 8 | prev_vat_yn | varchar(max) | YES |
| 9 | prev_vat_amt | decimal(18,0) | YES |
| 10 | prev_vat_stat_cd | varchar(max) | YES |
| 11 | prev_vat_stat_chng_dt | varchar(max) | YES |
| 12 | prev_vat_stat_chng_user_id | varchar(max) | YES |
| 13 | prev_vat_receipt_key | varchar(max) | YES |
| 14 | imt_amt | decimal(18,0) | YES |
| 15 | imt_amt_stat_cd | varchar(max) | YES |
| 16 | imt_amt_stat_chng_dt | varchar(max) | YES |
| 17 | imt_amt_stat_chng_user_id | varchar(max) | YES |
| 18 | imt_amt_vat_yn | varchar(max) | YES |
| 19 | imt_amt_receipt_key | varchar(max) | YES |
| 20 | imt_amt_ar_key | varchar(max) | YES |
| 21 | cust_pay_amt | decimal(18,0) | YES |
| 22 | cust_pay_stat_cd | varchar(max) | YES |
| 23 | cust_pay_stat_chng_dt | varchar(max) | YES |
| 24 | cust_pay_stat_chng_user_id | varchar(max) | YES |
| 25 | cust_pay_vat_yn | varchar(max) | YES |
| 26 | cust_pay_receipt_key | varchar(max) | YES |
| 27 | cust_pay_ar_key | varchar(max) | YES |
| 28 | append_amt | decimal(18,0) | YES |
| 29 | append_amt_stat_cd | varchar(max) | YES |
| 30 | append_amt_stat_chng_dt | varchar(max) | YES |
| 31 | append_amt_stat_chng_user_id | varchar(max) | YES |
| 32 | append_amt_vat_yn | varchar(max) | YES |
| 33 | append_amt_ar_key | varchar(max) | YES |
| 34 | rqst_amt | decimal(18,0) | YES |
| 35 | rqst_ar_amt | decimal(18,0) | YES |
| 36 | rqst_ar_key | varchar(max) | YES |
| 37 | aprov_amt | decimal(18,0) | YES |
| 38 | aprov_date | varchar(max) | YES |
| 39 | bank_account_cms | varchar(max) | YES |
| 40 | aprov_amt_ar_key | varchar(max) | YES |
| 41 | stat_cd | varchar(max) | YES |
| 42 | stat_chng_user_id | varchar(max) | YES |
| 43 | stat_chng_dt | varchar(max) | YES |
| 44 | reg_dt | varchar(max) | YES |
| 45 | reg_user_id | varchar(max) | YES |
| 46 | upd_dt | varchar(max) | YES |
| 47 | upd_user_id | varchar(max) | YES |
| 48 | tax_cust_seq | varchar(max) | YES |
| 49 | tax_cust_idfy_no | varchar(max) | YES |
| 50 | aprov_amt_dms_trx_id | varchar(max) | YES |
| 51 | prev_vat_vat_yn | varchar(max) | YES |
| 52 | append_amt_receipt_key | varchar(max) | YES |
| 53 | charge_nm | varchar(max) | YES |
| 54 | tel_area | varchar(max) | YES |
| 55 | tel_no | varchar(max) | YES |
| 56 | hp_area | varchar(max) | YES |
| 57 | hp_no | varchar(max) | YES |
| 58 | elt_timestamp | varchar(100) | YES |
| 59 | brand | varchar(20) | YES |

#### stg.svc_propo  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | repair_type_cd | varchar(max) | YES |
| 5 | propo_type_cd | varchar(max) | YES |
| 6 | vin | varchar(max) | YES |
| 7 | vis | varchar(max) | YES |
| 8 | vehic_no1 | varchar(max) | YES |
| 9 | vehic_no2 | varchar(max) | YES |
| 10 | variant_nm | varchar(max) | YES |
| 11 | svc_model_cd | varchar(max) | YES |
| 12 | vehic_base_odometer | int | YES |
| 13 | odometer | int | YES |
| 14 | cust_seq | decimal(18,0) | YES |
| 15 | cust_nm | varchar(max) | YES |
| 16 | cust_idfy_no | varchar(max) | YES |
| 17 | cust_rcpt_rel_cd | varchar(max) | YES |
| 18 | rcpt_cust_nm | varchar(max) | YES |
| 19 | rcpt_hp_area | varchar(max) | YES |
| 20 | rcpt_hp_no | varchar(max) | YES |
| 21 | rcpt_tel_area | varchar(max) | YES |
| 22 | rcpt_tel_no | varchar(max) | YES |
| 23 | vip_yn | varchar(max) | YES |
| 24 | svc_type_cd | varchar(max) | YES |
| 25 | svc_type_fms_cd | varchar(max) | YES |
| 26 | resv_dt | varchar(max) | YES |
| 27 | resv_seq | decimal(18,0) | YES |
| 28 | esti_dt | varchar(max) | YES |
| 29 | esti_seq | decimal(18,0) | YES |
| 30 | work_close_yn | varchar(max) | YES |
| 31 | stat_cd | varchar(max) | YES |
| 32 | stat_chng_dt | varchar(max) | YES |
| 33 | stat_chng_user_id | varchar(max) | YES |
| 34 | work_expt_st_dt | varchar(max) | YES |
| 35 | work_expt_end_dt | varchar(max) | YES |
| 36 | cust_delivery_yn | varchar(max) | YES |
| 37 | cust_delivery_expt_dt | varchar(max) | YES |
| 38 | cust_delivery_real_dt | varchar(max) | YES |
| 39 | old_part_yn | varchar(max) | YES |
| 40 | cust_loc_cd | varchar(max) | YES |
| 41 | vehic_loc_cd | varchar(max) | YES |
| 42 | damage_type_cd | varchar(max) | YES |
| 43 | stall_no | decimal(18,0) | YES |
| 44 | sms_yn | varchar(max) | YES |
| 45 | wash_stat_cd | varchar(max) | YES |
| 46 | cust_rqst | varchar(max) | YES |
| 47 | sa_sugst | varchar(max) | YES |
| 48 | techman_sugst | varchar(max) | YES |
| 49 | part_sugst | varchar(max) | YES |
| 50 | rcpt_sa_id | varchar(max) | YES |
| 51 | rcpt_time | decimal(18,0) | YES |
| 52 | propo_issu_time | decimal(18,0) | YES |
| 53 | mng_sa_id | varchar(max) | YES |
| 54 | mng_foreman_id | varchar(max) | YES |
| 55 | happycall_target_yn | varchar(max) | YES |
| 56 | happycall_reject_cd | varchar(max) | YES |
| 57 | cancel_reason_cd | varchar(max) | YES |
| 58 | cancel_reason | varchar(max) | YES |
| 59 | payback_yn | varchar(max) | YES |
| 60 | base_propo_dt | varchar(max) | YES |
| 61 | base_propo_seq | decimal(18,0) | YES |
| 62 | prev_shop_cd | varchar(max) | YES |
| 63 | prev_propo_dt | varchar(max) | YES |
| 64 | prev_propo_seq | decimal(18,0) | YES |
| 65 | prev_odometer | int | YES |
| 66 | prev_acc_shop_cd | varchar(max) | YES |
| 67 | prev_acc_propo_dt | varchar(max) | YES |
| 68 | prev_acc_propo_seq | decimal(18,0) | YES |
| 69 | up_group_id | varchar(max) | YES |
| 70 | reg_dt | varchar(max) | YES |
| 71 | reg_user_id | varchar(max) | YES |
| 72 | upd_dt | varchar(max) | YES |
| 73 | upd_user_id | varchar(max) | YES |
| 74 | cust_delivery_zip | varchar(max) | YES |
| 75 | cust_delivery_addr | varchar(max) | YES |
| 76 | cust_delivery_addr2 | varchar(max) | YES |
| 77 | cust_delivery_loc_x | varchar(max) | YES |
| 78 | cust_delivery_loc_y | varchar(max) | YES |
| 79 | add_proc_reg_dt | varchar(max) | YES |
| 80 | add_proc_reg_id | varchar(max) | YES |
| 81 | add_proc_sugst | varchar(max) | YES |
| 82 | pdc_yn | varchar(max) | YES |
| 83 | hbec_yn | varchar(max) | YES |
| 84 | hbec_seq | decimal(18,0) | YES |
| 85 | nex_svc | varchar(max) | YES |
| 86 | sc_forward_feedback | varchar(max) | YES |
| 87 | repeat_repair | varchar(max) | YES |
| 88 | reflaw_type | varchar(max) | YES |
| 89 | molit_target_yn | varchar(max) | YES |
| 90 | em_yn | varchar(max) | YES |
| 91 | app_rcpt_flag | varchar(max) | YES |
| 92 | repaet_alarm | varchar(max) | YES |
| 93 | fin_upload_seq | decimal(18,0) | YES |
| 94 | esti_type | varchar(max) | YES |
| 95 | end_gb | varchar(max) | YES |
| 96 | svc_in_sc_id | varchar(max) | YES |
| 97 | recall_before_sale_yn | varchar(max) | YES |
| 98 | bp_deli_site | varchar(max) | YES |
| 99 | bp_insu_comp | bigint | YES |
| 100 | free_service_sugst | varchar(max) | YES |
| 101 | cust_repair_req | varchar(max) | YES |
| 102 | app_save_flag | varchar(max) | YES |
| 103 | valuable_yn | varchar(max) | YES |
| 104 | dms_first_save_flag | varchar(max) | YES |
| 105 | propo_talk_send_time | varchar(max) | YES |
| 106 | propo_talk_send_user_id | varchar(max) | YES |
| 107 | propo_talk_mseq | bigint | YES |
| 108 | calc_talk_send_time | varchar(max) | YES |
| 109 | calc_talk_send_user_id | varchar(max) | YES |
| 110 | calc_talk_mseq | bigint | YES |
| 111 | sign_yn | varchar(max) | YES |
| 112 | agora_use_dt | varchar(max) | YES |
| 113 | proc_start_sms_yn | varchar(max) | YES |
| 114 | proc_start_sms_dt | varchar(max) | YES |
| 115 | sa_qc_sms_yn | varchar(max) | YES |
| 116 | sa_qc_sms_dt | varchar(max) | YES |
| 117 | elt_timestamp | varchar(100) | YES |
| 118 | brand | varchar(20) | YES |

#### stg.svc_propo_bpkpi  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | shop_in_dt | varchar(max) | YES |
| 5 | repair_start_dt | varchar(max) | YES |
| 6 | repair_finsh_dt | varchar(max) | YES |
| 7 | delivery_expt_dt | varchar(max) | YES |
| 8 | delivery_real_dt | varchar(max) | YES |
| 9 | ru10 | varchar(max) | YES |
| 10 | ru11 | varchar(max) | YES |
| 11 | ru12 | varchar(max) | YES |
| 12 | ru13 | varchar(max) | YES |
| 13 | ru14 | varchar(max) | YES |
| 14 | ru15 | varchar(max) | YES |
| 15 | ru16 | varchar(max) | YES |
| 16 | ru17 | varchar(max) | YES |
| 17 | ru18 | varchar(max) | YES |
| 18 | ru19 | varchar(max) | YES |
| 19 | ru20 | varchar(max) | YES |
| 20 | ru21 | varchar(max) | YES |
| 21 | ru22 | varchar(max) | YES |
| 22 | ru23 | varchar(max) | YES |
| 23 | ru24 | varchar(max) | YES |
| 24 | ru25 | varchar(max) | YES |
| 25 | ru26 | varchar(max) | YES |
| 26 | ru27 | varchar(max) | YES |
| 27 | ru28 | varchar(max) | YES |
| 28 | ru29 | varchar(max) | YES |
| 29 | ru30 | varchar(max) | YES |
| 30 | ru31 | varchar(max) | YES |
| 31 | ru32 | varchar(max) | YES |
| 32 | ru33 | varchar(max) | YES |
| 33 | ru34 | varchar(max) | YES |
| 34 | ru35 | varchar(max) | YES |
| 35 | ru36 | varchar(max) | YES |
| 36 | oj10 | varchar(max) | YES |
| 37 | oj11 | varchar(max) | YES |
| 38 | oj12 | varchar(max) | YES |
| 39 | qc10 | int | YES |
| 40 | qc11 | int | YES |
| 41 | qc12 | int | YES |
| 42 | qc13 | int | YES |
| 43 | qc14 | int | YES |
| 44 | qc15 | int | YES |
| 45 | qc16 | int | YES |
| 46 | qc17 | int | YES |
| 47 | reg_dt | varchar(max) | YES |
| 48 | reg_user_id | varchar(max) | YES |
| 49 | upd_dt | varchar(max) | YES |
| 50 | upd_user_id | varchar(max) | YES |
| 51 | proc_line | varchar(max) | YES |
| 52 | bi_code | varchar(max) | YES |
| 53 | bp_line_cd | decimal(18,0) | YES |
| 54 | elt_timestamp | varchar(100) | YES |
| 55 | brand | varchar(20) | YES |

#### stg.svc_propo_labor  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | frm_no | varchar(max) | YES |
| 5 | seq | decimal(18,0) | YES |
| 6 | ro_type_cd | varchar(max) | YES |
| 7 | settle_type_cd | varchar(max) | YES |
| 8 | propo_stat_cd | varchar(max) | YES |
| 9 | qty | int | YES |
| 10 | mh | decimal(18,0) | YES |
| 11 | frm_nm | varchar(max) | YES |
| 12 | sale_unit_price | decimal(18,0) | YES |
| 13 | sale_amt | decimal(18,0) | YES |
| 14 | dc_amt | decimal(18,0) | YES |
| 15 | grp_no | decimal(18,0) | YES |
| 16 | disp_rank | decimal(18,0) | YES |
| 17 | cnfm_unit_price | decimal(18,0) | YES |
| 18 | cnfm_amt | decimal(18,0) | YES |
| 19 | sublet_yn | varchar(max) | YES |
| 20 | sublet_comp_seq | decimal(18,0) | YES |
| 21 | sublet_purc_amt | decimal(18,0) | YES |
| 22 | cr_no | varchar(max) | YES |
| 23 | fms_item_cd | varchar(max) | YES |
| 24 | twc_no | varchar(max) | YES |
| 25 | svc_campg_no | decimal(18,0) | YES |
| 26 | svc_hist_disp_yn | varchar(max) | YES |
| 27 | reg_dt | varchar(max) | YES |
| 28 | reg_user_id | varchar(max) | YES |
| 29 | upd_dt | varchar(max) | YES |
| 30 | upd_user_id | varchar(max) | YES |
| 31 | cr_case_no | int | YES |
| 32 | pkg_yn | varchar(max) | YES |
| 33 | psp_unit_price | decimal(18,0) | YES |
| 34 | psp_amt | decimal(18,0) | YES |
| 35 | add_yn | varchar(max) | YES |
| 36 | psp_code | varchar(max) | YES |
| 37 | pm_code | varchar(max) | YES |
| 38 | pm_seq | decimal(18,0) | YES |
| 39 | auda_yn | varchar(max) | YES |
| 40 | elt_timestamp | varchar(100) | YES |
| 41 | brand | varchar(20) | YES |

#### stg.svc_propo_part  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES | 전시장 코드 |
| 2 | propo_dt | varchar(max) | YES | 일자 |
| 3 | propo_seq | varchar(max) | YES | 순번 |
| 4 | part_no | varchar(max) | YES | 부품번호 |
| 5 | seq | varchar(max) | YES | 순번 |
| 6 | ro_type_cd | varchar(max) | YES | 유형코드 |
| 7 | settle_type_cd | varchar(max) | YES | 유형코드 |
| 8 | propo_stat_cd | varchar(max) | YES | 상태코드 |
| 9 | stat_cd | varchar(max) | YES | 상태코드 |
| 10 | stat_chng_dt | varchar(max) | YES | 일자 |
| 11 | rqst_issu_qty | bigint | YES | 수량 |
| 12 | real_issu_qty | bigint | YES | 수량 |
| 13 | sale_unit_price | decimal(18,0) | YES | 가격 |
| 14 | sale_amt | decimal(18,0) | YES | 금액 |
| 15 | dc_amt | decimal(18,0) | YES | 금액 |
| 16 | cnfm_unit_price | decimal(18,0) | YES | 가격 |
| 17 | cnfm_amt | decimal(18,0) | YES | 금액 |
| 18 | grp_no | varchar(max) | YES | 번호 |
| 19 | disp_rank | varchar(max) | YES |  |
| 20 | cr_no | varchar(max) | YES | 번호 |
| 21 | fms_item_cd | varchar(max) | YES | 코드 |
| 22 | svc_campg_no | varchar(max) | YES | 번호 |
| 23 | twc_no | varchar(max) | YES | 번호 |
| 24 | order_no | varchar(max) | YES | 주문번호 |
| 25 | order_line_no | varchar(max) | YES | 주문번호 |
| 26 | sout_no | varchar(max) | YES | 번호 |
| 27 | sout_line_no | varchar(max) | YES | 번호 |
| 28 | cancel_yn | varchar(max) | YES | 취소 |
| 29 | income_qty | decimal(18,0) | YES | 수량 |
| 30 | order_qty | decimal(18,0) | YES | 수량 |
| 31 | income_resv_qty | decimal(18,0) | YES | 수량 |
| 32 | resv_clear_qty | decimal(18,0) | YES | 수량 |
| 33 | resv_real_qty | decimal(18,0) | YES | 수량 |
| 34 | rqst_remove_qty | decimal(18,0) | YES | 수량 |
| 35 | resv_dt | varchar(max) | YES | 일자 |
| 36 | resv_seq | varchar(max) | YES | 순번 |
| 37 | remove_yn | varchar(max) | YES | 여부(Y/N) |
| 38 | reject_cd | varchar(max) | YES | 코드 |
| 39 | svc_hist_disp_yn | varchar(max) | YES | 여부(Y/N) |
| 40 | reg_dt | varchar(max) | YES | 등록일 |
| 41 | reg_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 42 | upd_dt | varchar(max) | YES | 수정일 |
| 43 | upd_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 44 | rcit_user_id | varchar(max) | YES | 사용자 ID(SC) |
| 45 | cr_case_no | varchar(max) | YES | 번호 |
| 46 | pkg_yn | varchar(max) | YES | 여부(Y/N) |
| 47 | psp_unit_price | decimal(18,0) | YES | 가격 |
| 48 | psp_amt | decimal(18,0) | YES | 금액 |
| 49 | add_yn | varchar(max) | YES | 여부(Y/N) |
| 50 | psp_code | varchar(max) | YES | 코드 |
| 51 | pm_code | varchar(max) | YES | 코드 |
| 52 | pm_seq | varchar(max) | YES | 순번 |
| 53 | auda_yn | varchar(max) | YES | 여부(Y/N) |
| 54 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 55 | brand | varchar(20) | YES | 브랜드 |

#### stg.svc_resv  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | resv_dt | varchar(max) | YES |
| 3 | resv_seq | decimal(18,0) | YES |
| 4 | real_resv_date | varchar(max) | YES |
| 5 | real_resv_st_hm | varchar(max) | YES |
| 6 | real_resv_end_hm | varchar(max) | YES |
| 7 | in_expt_dt | varchar(max) | YES |
| 8 | out_expt_dt | varchar(max) | YES |
| 9 | cust_seq | decimal(18,0) | YES |
| 10 | cust_nm | varchar(max) | YES |
| 11 | cust_resv_rel_cd | varchar(max) | YES |
| 12 | resv_cust_nm | varchar(max) | YES |
| 13 | resv_hp_area | varchar(max) | YES |
| 14 | resv_hp_no | varchar(max) | YES |
| 15 | resv_tel_area | varchar(max) | YES |
| 16 | resv_tel_no | varchar(max) | YES |
| 17 | resv_cust_sms_yn | varchar(max) | YES |
| 18 | vehic_exist_yn | varchar(max) | YES |
| 19 | vehic_no1 | varchar(max) | YES |
| 20 | vehic_no2 | varchar(max) | YES |
| 21 | vin | varchar(max) | YES |
| 22 | variant_nm | varchar(max) | YES |
| 23 | svc_model_cd | varchar(max) | YES |
| 24 | model_year | varchar(max) | YES |
| 25 | svc_type_cd | varchar(max) | YES |
| 26 | svc_type_fms_cd | varchar(max) | YES |
| 27 | resv_way_cd | varchar(max) | YES |
| 28 | resv_way_dtl | varchar(max) | YES |
| 29 | resv_stall_no | decimal(18,0) | YES |
| 30 | cust_rqst | varchar(max) | YES |
| 31 | sa_sugst | varchar(max) | YES |
| 32 | stat_cd | varchar(max) | YES |
| 33 | stat_chng_user_id | varchar(max) | YES |
| 34 | stat_chng_dt | varchar(max) | YES |
| 35 | cancel_reason_cd | varchar(max) | YES |
| 36 | cancel_reason | varchar(max) | YES |
| 37 | prev_amt | decimal(18,0) | YES |
| 38 | prev_amt_recv_cust_nm | varchar(max) | YES |
| 39 | prev_amt_recv_way_cd | varchar(max) | YES |
| 40 | prev_amt_stat_cd | varchar(max) | YES |
| 41 | prev_amt_stat_chng_dt | varchar(max) | YES |
| 42 | prev_amt_receipt_key | decimal(18,0) | YES |
| 43 | vip_yn | varchar(max) | YES |
| 44 | cnfm_yn | varchar(max) | YES |
| 45 | wash_yn | varchar(max) | YES |
| 46 | remind_exec_cnt | decimal(18,0) | YES |
| 47 | mng_sa_id | varchar(max) | YES |
| 48 | mng_foreman_id | varchar(max) | YES |
| 49 | mng_sc_id_name | varchar(max) | YES |
| 50 | propo_dt | varchar(max) | YES |
| 51 | propo_seq | decimal(18,0) | YES |
| 52 | reg_dt | varchar(max) | YES |
| 53 | reg_user_id | varchar(max) | YES |
| 54 | upd_dt | varchar(max) | YES |
| 55 | upd_user_id | varchar(max) | YES |
| 56 | cust_loc_cd | varchar(max) | YES |
| 57 | variant_cd | varchar(max) | YES |
| 58 | order_dt | varchar(max) | YES |
| 59 | order_no | varchar(max) | YES |
| 60 | paid_prev_amt | decimal(18,0) | YES |
| 61 | used_prev_amt | decimal(18,0) | YES |
| 62 | prev_amt_remarks | varchar(max) | YES |
| 63 | prev_amt_close_dt | varchar(max) | YES |
| 64 | prev_amt_close_user_id | varchar(max) | YES |
| 65 | em_yn | varchar(max) | YES |
| 66 | resv_ildp_seq | decimal(18,0) | YES |
| 67 | esti_type | varchar(max) | YES |
| 68 | repeat_repair | varchar(max) | YES |
| 69 | repaet_alarm | varchar(max) | YES |
| 70 | cust_repair_req | varchar(max) | YES |
| 71 | entry_talk_send_time | varchar(max) | YES |
| 72 | entry_talk_mseq | bigint | YES |
| 73 | elt_timestamp | varchar(100) | YES |
| 74 | brand | varchar(20) | YES |

#### stg.svc_service_kpi_element_dealer  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | up_group_id | varchar(max) | YES | 식별자(ID) |
| 2 | yyyy_mm | varchar(max) | YES |  |
| 3 | gr_sa_lv1 | decimal(18,2) | YES |  |
| 4 | gr_sa_lv2 | decimal(18,2) | YES |  |
| 5 | gr_sa_non_certi | decimal(18,2) | YES |  |
| 6 | gr_tech_toyota | decimal(18,2) | YES |  |
| 7 | gr_tech_pro | decimal(18,2) | YES |  |
| 8 | gr_tech_dia | decimal(18,2) | YES |  |
| 9 | gr_tech_dia_master | decimal(18,2) | YES |  |
| 10 | gr_tech_non_certi | decimal(18,2) | YES |  |
| 11 | bp_sa | decimal(18,2) | YES |  |
| 12 | bp_tech_body | decimal(18,2) | YES |  |
| 13 | bp_tech_paint | decimal(18,2) | YES |  |
| 14 | as_other | decimal(18,2) | YES |  |
| 15 | cbp_num_cp | decimal(18,2) | YES |  |
| 16 | cbp_num_wt | decimal(18,2) | YES |  |
| 17 | cbp_num_in | decimal(18,2) | YES |  |
| 18 | cbp_amt_cp | decimal(18,2) | YES |  |
| 19 | cbp_amt_wt | decimal(18,2) | YES |  |
| 20 | cbp_amt_in | decimal(18,2) | YES |  |
| 21 | other_amt_parts_sale | decimal(18,2) | YES | 판매 |
| 22 | other_num_rr | decimal(18,2) | YES |  |
| 23 | other_hour_gr_tech | decimal(18,2) | YES |  |
| 24 | other_hour_bp_tech | decimal(18,2) | YES |  |
| 25 | other_salary_gr_tech | decimal(18,2) | YES |  |
| 26 | other_salary_bp_tech | decimal(18,2) | YES |  |
| 27 | other_num_target_call | decimal(18,2) | YES |  |
| 28 | other_num_tried_call | decimal(18,2) | YES |  |
| 29 | other_num_contac_call | decimal(18,2) | YES |  |
| 30 | other_appoint_rate | decimal(18,2) | YES |  |
| 31 | other_no_show_rate | decimal(18,2) | YES |  |
| 32 | body_toyota_technician | decimal(18,2) | YES |  |
| 33 | body_pro_technician | decimal(18,2) | YES |  |
| 34 | body_master_technician | decimal(18,2) | YES |  |
| 35 | body_non_certified | decimal(18,2) | YES |  |
| 36 | paint_toyota_technician | decimal(18,2) | YES |  |
| 37 | paint_pro_technician | decimal(18,2) | YES |  |
| 38 | paint_master_technician | decimal(18,2) | YES |  |
| 39 | paint_non_certified | decimal(18,2) | YES |  |
| 40 | gr_sa_total | decimal(18,2) | YES |  |
| 41 | gr_sa_toyota | decimal(18,2) | YES |  |
| 42 | gr_sa_pro | decimal(18,2) | YES |  |
| 43 | gr_sa_master | decimal(18,2) | YES |  |
| 44 | gr_tech_total | decimal(18,2) | YES |  |
| 45 | bp_sa_total | decimal(18,2) | YES |  |
| 46 | bp_sa_toyota | decimal(18,2) | YES |  |
| 47 | bp_sa_pro | decimal(18,2) | YES |  |
| 48 | bp_sa_master | decimal(18,2) | YES |  |
| 49 | bp_sa_non_certi | decimal(18,2) | YES |  |
| 50 | stall_gs | decimal(18,2) | YES |  |
| 51 | stall_bp | decimal(18,2) | YES |  |
| 52 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 53 | brand | varchar(20) | YES | 브랜드 |

#### stg.svc_settle  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | propo_dt | varchar(max) | YES |
| 3 | propo_seq | decimal(18,0) | YES |
| 4 | ro_type_cd | varchar(max) | YES |
| 5 | settle_dt | varchar(max) | YES |
| 6 | settle_user_id | varchar(max) | YES |
| 7 | sale_labor_amt | decimal(18,0) | YES |
| 8 | sale_part_amt | decimal(18,0) | YES |
| 9 | sale_sublet_amt | decimal(18,0) | YES |
| 10 | dc_labor_amt | decimal(18,0) | YES |
| 11 | dc_part_amt | decimal(18,0) | YES |
| 12 | dc_sublet_amt | decimal(18,0) | YES |
| 13 | cnfm_labor_amt | decimal(18,0) | YES |
| 14 | cnfm_part_amt | decimal(18,0) | YES |
| 15 | cnfm_sublet_amt | decimal(18,0) | YES |
| 16 | vat_yn | varchar(max) | YES |
| 17 | vat | decimal(18,0) | YES |
| 18 | cnfm_tot_amt | decimal(18,0) | YES |
| 19 | fms_type | varchar(max) | YES |
| 20 | dc_seq | decimal(18,0) | YES |
| 21 | stat_cd | varchar(max) | YES |
| 22 | stat_chng_dt | varchar(max) | YES |
| 23 | stat_chng_user_id | varchar(max) | YES |
| 24 | receipt_date | varchar(max) | YES |
| 25 | receipt_user_id | varchar(max) | YES |
| 26 | ar_cancel_yn | varchar(max) | YES |
| 27 | ar_cancel_dt | varchar(max) | YES |
| 28 | receipt_key | decimal(18,0) | YES |
| 29 | ar_key | decimal(18,0) | YES |
| 30 | reg_dt | varchar(max) | YES |
| 31 | reg_user_id | varchar(max) | YES |
| 32 | upd_dt | varchar(max) | YES |
| 33 | upd_user_id | varchar(max) | YES |
| 34 | dc_reason | varchar(max) | YES |
| 35 | addservice_yn | varchar(max) | YES |
| 36 | psp_labor_amt | decimal(18,0) | YES |
| 37 | psp_part_amt | decimal(18,0) | YES |
| 38 | psp_sublet_amt | decimal(18,0) | YES |
| 39 | psp_tot_amt | decimal(18,0) | YES |
| 40 | psp_vat | decimal(18,0) | YES |
| 41 | elt_timestamp | varchar(100) | YES |
| 42 | brand | varchar(20) | YES |

#### stg.svc_tech_worktime  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | shop_cd | varchar(max) | YES |
| 2 | work_date | varchar(max) | YES |
| 3 | techman_id | varchar(max) | YES |
| 4 | work_hour | decimal(18,2) | YES |
| 5 | work_type_cd | varchar(max) | YES |
| 6 | work_st_hm | varchar(max) | YES |
| 7 | work_end_mh | varchar(max) | YES |
| 8 | remark | varchar(max) | YES |
| 9 | reg_dt | varchar(max) | YES |
| 10 | reg_user_id | varchar(max) | YES |
| 11 | upd_dt | varchar(max) | YES |
| 12 | upd_user_id | varchar(max) | YES |
| 13 | over_hour | decimal(18,2) | YES |
| 14 | off_work_type | varchar(max) | YES |
| 15 | elt_timestamp | varchar(100) | YES |
| 16 | brand | varchar(20) | YES |

#### stg.vt_daily_sales_trend  (행 0)

| # | 컬럼 | 타입 | NULL | 추정 의미 |
|---|---|---|---|---|
| 1 | eod_month | varchar(max) | YES |  |
| 2 | rs_co_type | varchar(max) | YES | 유형코드 |
| 3 | dealer_id | varchar(max) | YES | 딜러 ID |
| 4 | brand_cd | varchar(max) | YES | 브랜드 |
| 5 | model_cd | varchar(max) | YES | 모델 코드 |
| 6 | variant_cd | varchar(max) | YES | 바리에이션 |
| 7 | rs_01 | decimal(18,0) | YES |  |
| 8 | rs_02 | decimal(18,0) | YES |  |
| 9 | rs_03 | decimal(18,0) | YES |  |
| 10 | rs_04 | decimal(18,0) | YES |  |
| 11 | rs_05 | decimal(18,0) | YES |  |
| 12 | rs_06 | decimal(18,0) | YES |  |
| 13 | rs_07 | decimal(18,0) | YES |  |
| 14 | rs_08 | decimal(18,0) | YES |  |
| 15 | rs_09 | decimal(18,0) | YES |  |
| 16 | rs_10 | decimal(18,0) | YES |  |
| 17 | rs_11 | decimal(18,0) | YES |  |
| 18 | rs_12 | decimal(18,0) | YES |  |
| 19 | rs_13 | decimal(18,0) | YES |  |
| 20 | rs_14 | decimal(18,0) | YES |  |
| 21 | rs_15 | decimal(18,0) | YES |  |
| 22 | rs_16 | decimal(18,0) | YES |  |
| 23 | rs_17 | decimal(18,0) | YES |  |
| 24 | rs_18 | decimal(18,0) | YES |  |
| 25 | rs_19 | decimal(18,0) | YES |  |
| 26 | rs_20 | decimal(18,0) | YES |  |
| 27 | rs_21 | decimal(18,0) | YES |  |
| 28 | rs_22 | decimal(18,0) | YES |  |
| 29 | rs_23 | decimal(18,0) | YES |  |
| 30 | rs_24 | decimal(18,0) | YES |  |
| 31 | rs_25 | decimal(18,0) | YES |  |
| 32 | rs_26 | decimal(18,0) | YES |  |
| 33 | rs_27 | decimal(18,0) | YES |  |
| 34 | rs_28 | decimal(18,0) | YES |  |
| 35 | rs_29 | decimal(18,0) | YES |  |
| 36 | rs_30 | decimal(18,0) | YES |  |
| 37 | rs_31 | decimal(18,0) | YES |  |
| 38 | rs_last | decimal(18,0) | YES |  |
| 39 | target_01 | decimal(18,0) | YES |  |
| 40 | target_02 | decimal(18,0) | YES |  |
| 41 | target_03 | decimal(18,0) | YES |  |
| 42 | target_04 | decimal(18,0) | YES |  |
| 43 | target_05 | decimal(18,0) | YES |  |
| 44 | target_06 | decimal(18,0) | YES |  |
| 45 | target_07 | decimal(18,0) | YES |  |
| 46 | target_08 | decimal(18,0) | YES |  |
| 47 | target_09 | decimal(18,0) | YES |  |
| 48 | target_10 | decimal(18,0) | YES |  |
| 49 | target_11 | decimal(18,0) | YES |  |
| 50 | target_12 | decimal(18,0) | YES |  |
| 51 | target_13 | decimal(18,0) | YES |  |
| 52 | target_14 | decimal(18,0) | YES |  |
| 53 | target_15 | decimal(18,0) | YES |  |
| 54 | target_16 | decimal(18,0) | YES |  |
| 55 | target_17 | decimal(18,0) | YES |  |
| 56 | target_18 | decimal(18,0) | YES |  |
| 57 | target_19 | decimal(18,0) | YES |  |
| 58 | target_20 | decimal(18,0) | YES |  |
| 59 | target_21 | decimal(18,0) | YES |  |
| 60 | target_22 | decimal(18,0) | YES |  |
| 61 | target_23 | decimal(18,0) | YES |  |
| 62 | target_24 | decimal(18,0) | YES |  |
| 63 | target_25 | decimal(18,0) | YES |  |
| 64 | target_26 | decimal(18,0) | YES |  |
| 65 | target_27 | decimal(18,0) | YES |  |
| 66 | target_28 | decimal(18,0) | YES |  |
| 67 | target_29 | decimal(18,0) | YES |  |
| 68 | target_30 | decimal(18,0) | YES |  |
| 69 | target_31 | decimal(18,0) | YES |  |
| 70 | target_last | decimal(18,0) | YES |  |
| 71 | reg_dt | varchar(max) | YES | 등록일 |
| 72 | upd_dt | varchar(max) | YES | 수정일 |
| 73 | elt_timestamp | varchar(100) | YES | ETL 적재시각 |
| 74 | brand | varchar(20) | YES | 브랜드 |

#### stg.vt_monthly_target  (행 0)

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | target_ym | varchar(max) | YES |
| 2 | dealer_id | varchar(max) | YES |
| 3 | brand_cd | varchar(max) | YES |
| 4 | mon_target_cd | varchar(max) | YES |
| 5 | contract_target_qty | decimal(18,0) | YES |
| 6 | sales_target_qty | decimal(18,0) | YES |
| 7 | reg_dt | varchar(max) | YES |
| 8 | upd_dt | varchar(max) | YES |
| 9 | variant_cd | varchar(max) | YES |
| 10 | ELT_TIMESTAMP | varchar(100) | YES |
| 11 | BRAND | varchar(20) | YES |

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

## DB: StagingLakehouseForDataflows_20250812005148

구분: 스테이징/임시 · 테이블 수: 14

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
| dbo.14642423a7f143558b32b0c1bd0f0946_29a0d1d8_002D41c2_002D480a_002Db57d_002D698cf45d12d7 | 5 | - |
| dbo.14642423a7f143558b32b0c1bd0f0946_7c7ec355_002D341a_002D4aa0_002Db70d_002D65f4ad7c91de | 3 | - |
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

#### dbo.14642423a7f143558b32b0c1bd0f0946_29a0d1d8_002D41c2_002D480a_002Db57d_002D698cf45d12d7

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | Column1 | varchar(8000) | YES |
| 2 | Column2 | varchar(8000) | YES |
| 3 | Column3 | varchar(8000) | YES |
| 4 | Column4 | date | YES |
| 5 | Column5 | float | YES |

#### dbo.14642423a7f143558b32b0c1bd0f0946_7c7ec355_002D341a_002D4aa0_002Db70d_002D65f4ad7c91de

| # | 컬럼 | 타입 | NULL |
|---|---|---|---|
| 1 | Column1 | varchar(8000) | YES |
| 2 | Column2 | varchar(8000) | YES |
| 3 | Column3 | float | YES |

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

## DB: StagingWarehouseForDataflows_20250812005211

구분: 스테이징/임시 · 테이블 수: 12

### 테이블 목록

| 테이블 | 컬럼 수 | 행 수 |
|---|---|---|
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
