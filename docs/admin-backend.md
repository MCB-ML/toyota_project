# Organization Setup Backend API (Azure)

This project is a FastAPI-based backend service for Organization Setup, deployed on Azure App Service using Docker containers. It follows Clean Architecture principles to ensure separation of concerns and maintainability.

## Getting Started

### Prerequisites

- **Python 3.14** (as configured in the environment)
- **ODBC Driver 18 for SQL Server**: Required for database connectivity (`pyodbc` dependency).
- **Azure CLI** (Optional, for deployment/infra tasks)

### Local Development Setup

1.  **Clone the repository**
2.  **Create a Virtual Environment**
    ```bash
    python3.14 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Install ODBC Driver 18**
    - **macOS**: `brew tap microsoft/mssql-release https://github.com/microsoft/homebrew-mssql-release && brew update && brew install msodbcsql18 mssql-tools18`
    - **Linux/Windows**: Refer to Microsoft documentation for installing ODBC Driver 18.
5.  **Environment Configuration**
    - The application uses environment variables for configuration.
    - Local environment variables are loaded from `deployments/dev.env` (Note: This file is gitignored and applied directly to Azure App Service as Env Vars).
    - Ensure you have the necessary DB connection strings and Azure credentials set up in your local environment or `.env` file if mimicking `dev.env`.
6.  **Run the Application**
    - **Command Line**:
      ```bash
      python cmd/main.py
      ```
    - **VS Code**: Use the provided debug configuration in `.vscode/launch.json`.

## Project Structure

The project follows a modular **Clean Architecture** layout:

```
.
├── cmd/                    # Application Entry Point
│   └── main.py             # Main execution script, server setup, dependency injection
├── deployments/            # Deployment configurations
│   └── dev.env             # Local/Dev environment variables
├── infrastructure/         # Infrastructure as Code (Terraform)
│   ├── main.tf             # Main Terraform configuration (ACR, App Service)
│   └── variables.tf        # Terraform variables
├── internal/               # Core Application Logic
│   ├── config/             # Configuration loaders
│   ├── domain/             # Business Domain Layer (Pure Python)
│   │   ├── entities/       # Database Models / Business Entities
│   │   ├── repository/     # Abstract Repository Interfaces
│   │   └── usecase/        # Application Business Rules
│   ├── dto/                # Data Transfer Objects (Request/Response Models)
│   ├── infrastructure/     # Interface Adapters & Frameworks (Implementation)
│   │   ├── cache/          # Cache implementations
│   │   ├── database/       # Database connection logic
│   │   ├── httpserver/     # HTTP Server setup (Uvicorn/FastAPI)
│   │   ├── msgraph/        # Microsoft Graph API integration
│   │   └── repository/     # Repository Implementations (SQLAlchemy)
│   ├── interfaces/         # Gateway Interfaces
│   │   ├── api/            # API Handlers (Controllers)
│   │   ├── repository/     # Repository Implementations (Alternative implementation location)
│   │   └── routes/         # API Route Definitions
│   └── middleware/         # HTTP Middleware (Logger, Auth, etc.)
├── pkg/                    # Shared Packages / Libraries
│   └── main_lib.py         # Logging and Common Utilities
├── tests/                  # Automated Tests
│   └── startup_test.py     # Smoke tests
├── Dockerfile              # Container definition
├── azure-pipelines.yml     # CI/CD Pipeline Configuration
└── requirements.txt        # Python Dependencies
```

## Architecture

This project is structured around **Clean Architecture**:

- **Entities (`internal/domain/entities`)**: Core business objects that reflect the database schema.
- **DTOs (`internal/dto`)**: Used for data exchange between the API consumer and the application, ensuring internal entities aren't exposed directly.
- **Repositories (`internal/domain/repository` vs `internal/interfaces/repository`)**:
  - `domain/repository`: Defines the _interface_ (abstract base classes).
  - `interfaces/repository`: Contains the _implementation_ using SQLAlchemy to interact with the database.
- **Handlers (`internal/interfaces/api`)**: control the flow of requests, calling repositories or use cases and returning DTOs.
- **Routes (`internal/interfaces/routes`)**: Map HTTP endpoints to handlers.

## Infrastructure & Deployment

The infrastructure and deployment are automated using **Terraform** and **Azure DevOps**.

### Terraform (`infrastructure/`)

- **State Management**: Remote state stored in Azure Blob Storage (`backend "azurerm" {}`).
- **Resources**:
  - **Azure Container Registry (ACR)**: Stores the Docker images.
  - **App Service Plan (Linux B1)**: Hosting plan.
  - **App Services**: Two slots created - `staging` and `production` (the main app).

### Azure Pipelines (`azure-pipelines.yml`)

The workflow consists of 4 stages:

1.  **Infrastructure**: Runs `terraform init` and `apply` to provision/update Azure resources.
2.  **Build**:
    - Installs dependencies and runs `tests/startup_test.py`.
    - Builds the Docker image and pushes it to Azure Container Registry (ACR).
3.  **Deploy Staging**: Deploys the new container image to the **Staging** App Service slot.
4.  **Deploy Production**: Deploys to the **Production** App Service (requires manual approval in Azure DevOps Environment 'Production').

### Docker

- Based on `python:3.11-slim`.
- Exposes port `8080`.
- ODBC 드라이버 설치 블록은 제거되었다. DB 는 PostgreSQL(asyncpg) 하나만 본다.

## Testing

To run the startup smoke tests:

```bash
python tests/startup_test.py
```

## Linting & Formatting

This project uses **Ruff** for fast Python linting and formatting.

- **Check code**:
  ```bash
  ruff check .
  ```
- **Format code**:
  ```bash
  ruff format .
  ```


## 인증

이 백엔드는 어드민 페이지 전용이고, 어드민 페이지는 관리자 전용이다.
`internal/middleware/auth.py` 가 모든 요청을 검사한다.

| 경로 | 통과 조건 |
| --- | --- |
| `/ping`, `/docs`, `/redoc`, `/openapi.json` | 무조건 |
| `/api/v1/auth/*` | 무조건 (로그인 전에는 붙일 토큰이 없다) |
| `/api/v1/tokenUsage/log` | `X-Service-Key` 헤더 = `SERVICE_API_KEY` |
| 그 외 전부 | `Authorization: Bearer <token>` + 계정의 `user_role = 'admin'` |

관리자가 아니면 **403** 이다. 401 이 아니다 — 다시 로그인해도 결과가 같으므로,
화면은 로그인으로 되돌리지 않고 안내 페이지를 띄운다.

### 필요한 환경변수

| 이름 | 용도 | 없으면 |
| --- | --- | --- |
| `SECRET_KEY` | 자체 발급 JWT 서명·검증 | 모든 요청이 401 |
| `ALGORITHM` | 서명 알고리즘 (기본 `HS256`) | `HS256` 사용 |
| `SERVICE_API_KEY` | 에이전트 백엔드가 사용량을 적재할 때 쓰는 키 | 적재 경로가 **503**. 조용히 열어두지 않는다 |

`SECRET_KEY` 와 `ALGORITHM` 은 로그인 핸들러와 미들웨어가 같은 값을 봐야 한다.
어긋나면 로그인은 되는데 이후 호출이 전부 401 이 된다.

### 에이전트 백엔드가 사용량을 남기는 법

응답을 낼 때마다 한 건씩 보낸다. 실패한 호출도 보낸다 — 실패해도 입력 토큰은 이미 나갔고,
실패율이 그 딜러사가 겪는 체감 품질이다.

```
POST /api/v1/tokenUsage/log
X-Service-Key: <SERVICE_API_KEY>

{
  "companyId": "<딜러사 uuid>",
  "userEmail": "sales@toyota.kr",
  "agentType": "sql",
  "modelId": "<Model_master.id>",
  "inputTokens": 1200,
  "outputTokens": 450,
  "latencyMs": 1830,
  "succeeded": true
}
```

이메일은 서버가 소문자로 눕혀 저장한다. 안 그러면 `A@x.kr` 과 `a@x.kr` 이
다른 사람으로 갈라져 딜러사 합계와 계정 합계가 어긋난다.
