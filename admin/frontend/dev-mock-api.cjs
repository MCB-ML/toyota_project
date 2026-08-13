/* =====================================================================
 *  개발 전용 목(mock) API 서버  —  운영 환경에서 절대 실행하지 말 것
 * ---------------------------------------------------------------------
 *  DB 없이 어드민 화면을 실제로 조작해 보기 위한 도구다.
 *
 *  [저장 위치]
 *    딜러사 / 사용자 / 모델   -> dev-mock-data.json
 *    프롬프트                 -> dev-mock-prompts/{semantic,ontology,metrics}/*.yaml|md
 *                               (실제 파일이라 편집기로 직접 열어볼 수 있다)
 *
 *  [PostgreSQL 구축 후]
 *    이 서버는 통째로 버린다. 실제 백엔드(organization_setup_backend)가
 *    같은 API 스펙으로 응답하므로 프론트엔드는 고칠 것이 없다.
 *    .env.development 의 VITE_BASE_OS_API_URL 만 실제 백엔드 주소로 바꾸면 된다.
 *
 *      dev-mock-data.json      -> CompanyInfo_master / User_master / Model_master ...
 *      dev-mock-prompts/       -> SystemPrompt_Configuration 테이블
 *                                 (파일 본문이 value 컬럼, 파일명이 file_name 컬럼)
 *
 *  인증을 검사하지 않는다. 어떤 이메일/비밀번호로도 로그인이 통과된다.
 *
 *  안전장치
 *    - NODE_ENV=production 이면 시작을 거부한다.
 *    - 127.0.0.1 에만 바인딩하여 외부에서 접근할 수 없다.
 *
 *  실행
 *    npm run dev:local       (목 API + vite 동시 실행)
 *
 *  초기화
 *    dev-mock-data.json 파일을 지우고 다시 실행하면 시드 데이터로 돌아간다.
 * ===================================================================== */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

if (process.env.NODE_ENV === "production") {
  console.error("[dev-mock-api] NODE_ENV=production 에서는 실행할 수 없습니다.");
  process.exit(1);
}

const PORT = Number(process.env.MOCK_PORT || 8080);
const DATA_FILE = path.join(__dirname, "dev-mock-data.json");

const USER_ROLES = ["admin", "user", "viewer"];

// ── 프롬프트 파일 저장소 ─────────────────────────────────────────────
//
// DB 가 없는 동안 실제 yaml/md 파일로 보관한다.
// 카테고리마다 폴더 하나. 파일을 직접 열어보거나 편집기로 고칠 수 있다.
//
//   dev-mock-prompts/
//     semantic/  ontology/  metrics/
//
// 실제 DB 로 넘어가면 이 폴더는 SystemPrompt_Configuration 테이블이 된다.

const PROMPT_CATEGORIES = ["semantic", "ontology", "metrics"];
const PROMPT_DIR = path.join(__dirname, "dev-mock-prompts");

/** 파일 경로를 URL 에 담기 위해 base64url 로 인코딩한다 (한글·공백 대응) */
const encodePromptId = (category, fileName) =>
  Buffer.from(`${category}/${fileName}`, "utf-8").toString("base64url");

const decodePromptId = (id) => {
  const raw = Buffer.from(id, "base64url").toString("utf-8");
  const idx = raw.indexOf("/");
  return { category: raw.slice(0, idx), fileName: raw.slice(idx + 1) };
};

const fileTypeOf = (fileName) => (fileName.toLowerCase().endsWith(".md") ? "md" : "yaml");

/** 이름에 확장자가 딸려 오면 떼어낸다. 그대로 두면 sales_terms.yaml.yaml 이 된다. */
const stripExt = (name) => String(name ?? "").trim().replace(/\.(ya?ml|md)$/i, "");

const promptPath = (category, fileName) => path.join(PROMPT_DIR, category, fileName);

const ensurePromptDirs = () => {
  for (const c of PROMPT_CATEGORIES) {
    fs.mkdirSync(path.join(PROMPT_DIR, c), { recursive: true });
  }
};

/** 폴더를 훑어 프롬프트 목록을 만든다. 파일이 곧 데이터다. */
const listPrompts = () => {
  ensurePromptDirs();

  const result = [];

  for (const category of PROMPT_CATEGORIES) {
    const dir = path.join(PROMPT_DIR, category);

    for (const fileName of fs.readdirSync(dir)) {
      if (!/\.(ya?ml|md)$/i.test(fileName)) continue;

      const full = path.join(dir, fileName);
      const stat = fs.statSync(full);

      result.push({
        id: encodePromptId(category, fileName),
        category,
        name: fileName.replace(/\.(ya?ml|md)$/i, ""),
        fileName,
        fileType: fileTypeOf(fileName),
        value: fs.readFileSync(full, "utf-8"),
        isActive: true,
        createdAt: stat.birthtime.toISOString().slice(0, 19).replace("T", " "),
        updatedAt: stat.mtime.toISOString().slice(0, 19).replace("T", " "),
      });
    }
  }

  return result.sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
};

const nowIso = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// ── 저장소 ───────────────────────────────────────────────────────────

/**
 * 사용량 표본. 화면이 비어 있으면 집계가 맞는지 볼 수 없어서 만들어 둔다.
 *
 * 실제로는 에이전트가 응답을 낼 때마다 POST /tokenUsage/log 로 한 건씩 쌓는다.
 * PostgreSQL 이 붙으면 이 함수는 없어지고 TokenUsage_log 테이블이 그 자리를 맡는다.
 */
const seedUsage = () => {
  const dealers = [
    { companyId: "11111111-1111-1111-1111-111111111111", emails: ["max.kim@mcloudbridge.com", "sales.yongsan@toyota.kr", "service.yongsan@toyota.kr"] },
    { companyId: "55555555-5555-5555-5555-555555555555", emails: ["hq.report@toyota.kr", "max.kim@mcloudbridge.com"] },
  ];
  const agentTypes = ["main", "sql", "sql_2", "rag", "chart"];
  const modelId = "22222222-2222-2222-2222-222222222222";

  const logs = [];
  let id = 0;

  // 최근 30일. 날짜마다 딜러사별로 몇 건씩 흩뿌린다.
  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    for (const dealer of dealers) {
      // 딜러사마다 사용량이 달라야 순위가 의미를 갖는다
      const calls = dealer.companyId.startsWith("1111") ? 2 + (daysAgo % 4) : 1 + (daysAgo % 2);

      for (let n = 0; n < calls; n += 1) {
        const at = new Date();
        at.setDate(at.getDate() - daysAgo);
        at.setHours(9 + ((n * 3) % 9), (n * 17) % 60, 0, 0);

        // 20건에 1건꼴로 실패. 실패해도 입력 토큰은 이미 나갔다.
        const failed = (id + daysAgo) % 20 === 0;

        logs.push({
          id: (id += 1),
          companyId: dealer.companyId,
          userEmail: dealer.emails[(daysAgo + n) % dealer.emails.length],
          agentType: agentTypes[(daysAgo + n) % agentTypes.length],
          modelId,
          inputTokens: 800 + ((daysAgo * 37 + n * 113) % 2400),
          outputTokens: failed ? 0 : 200 + ((daysAgo * 19 + n * 71) % 900),
          latencyMs: 700 + ((daysAgo * 43 + n * 97) % 2600),
          succeeded: !failed,
          errorMessage: failed ? "ThrottlingException: rate exceeded" : null,
          createdAt: at.toISOString(),
        });
      }
    }
  }

  return logs;
};

const seed = () => ({
  companies: [
    {
      companyId: "11111111-1111-1111-1111-111111111111",
      companyName: "토요타 용산",
      description: "용산 지역 딜러사",
      isActive: true,
      createdAt: nowIso(),
      updatedAt: null,
      deletedAt: null,
      deployments: [],
      connections: [],
    },
    {
      companyId: "55555555-5555-5555-5555-555555555555",
      companyName: "tmkr",
      description: "토요타 코리아 본사",
      isActive: true,
      createdAt: nowIso(),
      updatedAt: null,
      deletedAt: null,
      deployments: [],
      connections: [],
    },
  ],
  users: [
    {
      userId: "dccfb57c-1c7d-4209-97e8-89f40b85e7b1",
      userName: "Max Kim",
      userEmail: "max.kim@mcloudbridge.com",
      userRole: "admin",
      userAccess: "full access",
      userDepartment: "IT",
      userAvatar: null,
      userChangePassword: "",
      workspaces: [],
      defaultCompany: "11111111-1111-1111-1111-111111111111",
      defaultLanguage: "kr",
      createdAt: nowIso(),
      updatedAt: null,
    },
  ],
  adUsers: [],
  // 모델 스펙 카탈로그 (전역). 접속 키는 없다 — 실행 역할 하나로 호출한다.
  models: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      displayName: "Claude Sonnet 4.5",
      provider: "bedrock",
      modelKind: "llm",
      modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",
      apiVersion: null,
      maxToken: 8192,
      temperature: 0.2,
      topP: null,
      topK: null,
      reasoningEffort: "medium",
      embeddingModel: null,
      isActive: true,
    },
  ],
  // 토큰 사용량. 실제로는 에이전트가 호출 직후 POST /tokenUsage/log 로 쌓는다.
  // 화면을 확인할 수 있도록 최근 30일치 표본을 만들어 둔다.
  tokenUsage: seedUsage(),
  // 프롬프트는 이 JSON 이 아니라 dev-mock-prompts/ 폴더의 실제 파일로 관리한다.
  // listPrompts() 참고.
});

let db;

try {
  db = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  console.log(`  데이터 파일 로드: ${path.basename(DATA_FILE)}`);

  // 스키마가 바뀌기 전에 저장된 파일을 맞춰준다.
  // 여기서 보정하지 않으면 db.tokenUsage 가 undefined 라 조회에서 바로 터진다.
  if (!db.tokenUsage) {
    db.tokenUsage = seedUsage();
    console.log("  사용량 표본을 생성했습니다.");
  }

  // 접속 키는 제거되었다. 사용량은 TokenUsage_log 로 집계한다.
  if (db.credentials) {
    delete db.credentials;
    console.log("  접속 키 데이터를 제거했습니다.");
  }

  // 용도별 모델 지정에 남아 있는 credentialId 도 함께 걷어낸다
  for (const c of db.companies ?? []) {
    for (const d of c.deployments ?? []) delete d.credentialId;
  }
} catch {
  db = seed();
  console.log("  시드 데이터로 시작합니다.");
}

const save = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
};

// ── 헬퍼 ─────────────────────────────────────────────────────────────

const ok = (result, message = "") => ({ success: true, message, result });
const fail = (message) => ({ success: false, message, result: null });

/**
 * HTTP 오류 상태로 응답한다.
 * Users 계열은 { success:false } 를 봐도 프론트가 성공으로 처리하므로
 * (mutation 이 `if (data)` 로만 판단) 실제 오류 상태코드를 내려야 한다.
 */
const httpError = (status, message) => ({
  __status: status,
  body: { detail: message, message },
});

/** 쿼리스트링 한 개. handle() 에는 pathname 만 넘어와 req 에서 직접 읽는다. */
const queryParam = (req, key) =>
  new URL(req.url, "http://localhost").searchParams.get(key);

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });

/** 삭제되지 않은 딜러사만 */
const liveCompanies = () => db.companies.filter((c) => !c.deletedAt);

// ── 사용량 집계 헬퍼 ─────────────────────────────────────────────────
//
// 실제 백엔드는 이 계산을 SQL 의 GROUP BY 로 한다. 여기서는 같은 결과가 나오도록
// 손으로 접는다. (token_usage_repository.py 참고)

/** 누산기에 로그 한 건을 더한다. 없으면 base 로 새로 만든다. */
const bump = (map, key, lg, base) => {
  let acc = map.get(key);

  if (!acc) {
    acc = {
      ...base,
      requestCount: 0,
      failedCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      _latencySum: 0,
      _latencyCount: 0,
      lastUsedAt: null,
    };
    map.set(key, acc);
  }

  acc.requestCount += 1;
  if (!lg.succeeded) acc.failedCount += 1;
  acc.inputTokens += lg.inputTokens;
  acc.outputTokens += lg.outputTokens;
  acc.totalTokens += lg.inputTokens + lg.outputTokens;

  if (lg.latencyMs != null) {
    acc._latencySum += lg.latencyMs;
    acc._latencyCount += 1;
  }

  if (!acc.lastUsedAt || lg.createdAt > acc.lastUsedAt) acc.lastUsedAt = lg.createdAt;

  return acc;
};

/** 누산기를 응답 형태로 마무리한다 (평균 계산 + 내부 필드 제거). */
const finish = ({ _latencySum, _latencyCount, ...acc }) => ({
  ...acc,
  avgLatencyMs: _latencyCount > 0 ? Math.round(_latencySum / _latencyCount) : null,
});

/** 조회 조건 적용. 종료일은 그날 23:59:59 까지 포함한다. */
const filterUsage = (q) =>
  db.tokenUsage.filter((lg) => {
    const day = lg.createdAt.slice(0, 10);

    if (q.startDate && day < q.startDate) return false;
    if (q.endDate && day > q.endDate) return false;
    if (q.companyId && lg.companyId !== q.companyId) return false;
    if (q.agentType && lg.agentType !== q.agentType) return false;
    if (q.userEmail && lg.userEmail !== String(q.userEmail).trim().toLowerCase()) return false;

    return true;
  });


// ── 핸들러 ───────────────────────────────────────────────────────────

/**
 * 실제 백엔드의 인증 미들웨어와 같은 규칙을 흉내낸다.
 * (organization_setup_backend/internal/middleware/auth.py)
 *
 * 토큰 내용은 검사하지 않는다. 여기서 잡으려는 것은
 * "Authorization 헤더를 안 붙이고 부르는 호출" 하나다.
 * 로컬에서 안 잡히면 운영에서 401 로 처음 드러난다.
 */
const PUBLIC_PREFIXES = ["/ping", "/api/v1/auth/"];
const SERVICE_PATHS = ["/api/v1/tokenUsage/log"];

// 개발 편의상 고정값. 운영은 SERVICE_API_KEY 환경변수를 쓴다.
const MOCK_SERVICE_KEY = "dev-service-key";

const checkAuth = (pathname, req) => {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  if (SERVICE_PATHS.includes(pathname)) {
    // 에이전트 -> 사용량 적재. 사람 계정이 없어 서비스 키로 판단한다.
    if (req.headers["x-service-key"] !== MOCK_SERVICE_KEY) {
      return httpError(401, `서비스 키가 올바르지 않습니다. (개발용: ${MOCK_SERVICE_KEY})`);
    }
    return null;
  }

  const auth = req.headers.authorization ?? "";

  if (!auth.toLowerCase().startsWith("bearer ") || !auth.slice(7).trim()) {
    return httpError(401, "로그인이 필요합니다. (Authorization 헤더가 없습니다)");
  }

  return null;
};

const handle = async (method, pathname, req) => {
  const denied = checkAuth(pathname, req);
  if (denied) return denied;

  const seg = pathname.split("/").filter(Boolean); // ["api","v1",...]
  const tail = seg.slice(2); // 리소스부터

  // ---- auth ----
  if (tail[0] === "auth") {
    if (tail[1] === "check") {
      // 안내 화면을 확인하려면 토큰을 "non-admin" 으로 바꿔 호출한다.
      // 실제 백엔드는 User_master.user_role 을 보고 판단한다.
      if (tail[2] === "non-admin") {
        // 실제 백엔드와 같은 형태. 안내 화면이 계정을 보여줄 수 있어야 한다.
        return {
          __status: 403,
          body: {
            success: false,
            message: "관리자 페이지 접속 권한이 없습니다.",
            result: { email: "sales.yongsan@toyota.kr", role: "user" },
          },
        };
      }

      return ok({
        email: "max.kim@mcloudbridge.com",
        name: "Max Kim",
        role: "admin",
        defaultLanguage: "kr",
      });
    }
    if (tail[1] === "login") {
      return ok({ token: "mock-token" });
    }
  }

  // ---- companies ----
  if (tail[0] === "companies" || tail[0] === "company") {
    const action = tail[1];

    if (method === "GET" && action === "getAll") {
      return ok(liveCompanies());
    }

    if (method === "GET" && action === "getById") {
      const c = liveCompanies().find((x) => x.companyId === tail[2]);
      return c ? ok(c) : fail("Company not found");
    }

    if (method === "POST" && (action === "insert" || action === "create")) {
      const body = await readBody(req);

      if (!body.companyName || body.companyName.trim().length < 2) {
        return fail("companyName is required");
      }
      if (liveCompanies().some((c) => c.companyName === body.companyName)) {
        return fail("companyName already used!");
      }

      const company = {
        companyId: crypto.randomUUID(),
        companyName: body.companyName,
        description: body.description ?? "",
        isActive: body.isActive !== false,
        createdAt: nowIso(),
        updatedAt: null,
        deletedAt: null,
        deployments: body.deployments ?? [],
        connections: body.connections ?? [],
      };

      db.companies.push(company);
      save();

      console.log(`  + 딜러사 추가: ${company.companyName}`);

      return ok(company, "Company created");
    }

    if (method === "PUT" && action === "update") {
      const body = await readBody(req);
      const c = db.companies.find((x) => x.companyId === body.companyId);

      if (!c) return fail("Company not found");

      // 화면에서만 막으면 API 직접 호출로 우회된다
      for (const dep of body.deployments ?? []) {
        const model = db.models.find((m) => m.id === dep.modelId);
        if (model && model.isActive === false) {
          return httpError(400, `${model.displayName} 은(는) 비활성화된 모델입니다.`);
        }
      }

      c.companyName = body.companyName ?? c.companyName;
      c.description = body.description ?? c.description;
      if (body.isActive !== undefined) c.isActive = body.isActive;
      if (body.deployments) c.deployments = body.deployments;
      if (body.connections) c.connections = body.connections;
      c.updatedAt = nowIso();

      save();
      console.log(`  ~ 딜러사 수정: ${c.companyName}`);

      return ok(c, "Company updated");
    }

    if (method === "DELETE") {
      const id = tail[tail.length - 1];
      const c = db.companies.find((x) => x.companyId === id);

      if (!c) return fail("Company not found");

      const inUse = db.users.some((u) => u.defaultCompany === id && !u.deletedAt);
      if (inUse) return fail("이 딜러사에 속한 사용자가 있어 삭제할 수 없습니다.");

      c.deletedAt = nowIso();
      save();
      console.log(`  - 딜러사 삭제: ${c.companyName}`);

      return ok(null, "Company deleted");
    }
  }

  // ---- users (credential) ----
  //
  // [주의] Users 계열 엔드포인트만 응답 형식이 다르다.
  //        다른 API 는 { success, message, result } 로 감싸지만
  //        Users 는 { users, total } 을 그대로 돌려준다. (getAllUser.ts 참고)
  //        감싸서 보내면 화면에서 usersData.users 가 undefined 가 되어 목록이 비어 보인다.
  if (tail[0] === "users" || tail[0] === "user") {
    const action = tail[1] || "";

    if (method === "GET" && action.startsWith("getAll")) {
      const users = db.users.filter((u) => !u.deletedAt);
      return { users, total: users.length };
    }

    if (method === "GET" && action.startsWith("getUserById")) {
      const u = db.users.find((x) => x.userId === tail[2]);
      return u ?? fail("User not found");
    }

    if (method === "POST" && action.startsWith("create")) {
      const body = await readBody(req);

      if (!body.userEmail) return httpError(400, "userEmail is required");
      if (db.users.some((u) => u.userEmail === body.userEmail && !u.deletedAt)) {
        return httpError(409, "이미 등록된 이메일입니다.");
      }

      // 딜러사가 실제로 존재하는지 확인한다 — 화면에서 고른 값이 맞는지 검증
      if (!body.defaultCompany) {
        return httpError(400, "Default Company 는 필수입니다.");
      }
      const company = liveCompanies().find((c) => c.companyId === body.defaultCompany);

      if (!company) {
        return httpError(400, "Default Company 를 찾을 수 없습니다.");
      }

      // 화면에서만 막으면 API 직접 호출로 우회된다
      if (company.isActive === false) {
        return httpError(400, `${company.companyName} 은(는) 비활성화된 회사입니다.`);
      }

      if (body.userRole && !USER_ROLES.includes(body.userRole)) {
        return httpError(400, `userRole 은 ${USER_ROLES.join(" / ")} 중 하나여야 합니다.`);
      }

      const user = {
        userId: crypto.randomUUID(),
        userName: body.userName ?? "",
        userEmail: body.userEmail,
        userRole: body.userRole ?? "user",
        userAccess: body.userAccess ?? "full access",
        userDepartment: body.userDepartment ?? "",
        userAvatar: null,
        userChangePassword: "",
        workspaces: [],
        defaultCompany: body.defaultCompany ?? null,
        defaultLanguage: body.defaultLanguage ?? "en",
        createdAt: nowIso(),
        updatedAt: null,
      };

      db.users.push(user);
      save();

      const companyName =
        liveCompanies().find((c) => c.companyId === user.defaultCompany)?.companyName ?? "(없음)";
      console.log(`  + 사용자 추가: ${user.userEmail}  딜러사=${companyName}`);

      return user; // Users 계열은 래핑하지 않는다
    }

    if (method === "PUT" && action.startsWith("update")) {
      const body = await readBody(req);
      const id = body.userId ?? tail[2];
      const u = db.users.find((x) => x.userId === id);

      if (!u) return httpError(404, "User not found");

      Object.assign(u, {
        userName: body.userName ?? u.userName,
        userEmail: body.userEmail ?? u.userEmail,
        userRole: body.userRole ?? u.userRole,
        userDepartment: body.userDepartment ?? u.userDepartment,
        defaultCompany: body.defaultCompany ?? u.defaultCompany,
        defaultLanguage: body.defaultLanguage ?? u.defaultLanguage,
        updatedAt: nowIso(),
      });

      save();
      console.log(`  ~ 사용자 수정: ${u.userEmail}`);

      return u;
    }

    if (method === "DELETE") {
      const id = tail[tail.length - 1];
      const idx = db.users.findIndex((x) => x.userId === id);

      if (idx === -1) return httpError(404, "User not found");

      const [removed] = db.users.splice(idx, 1);
      save();
      console.log(`  - 사용자 삭제: ${removed.userEmail}`);

      return { message: "User deleted" };
    }
  }

  // ---- AD users ----
  if (tail[0] === "adUsers" || tail[0] === "ad_users" || tail[0] === "usersAD") {
    return ok({ users: db.adUsers, total: db.adUsers.length });
  }

  // ---- model (전역 스펙 카탈로그) ----
  if (tail[0] === "model") {
    const action = tail[1];

    if (method === "GET" && action === "getAll") return ok(db.models);

    if (method === "GET" && action === "getById") {
      const m = db.models.find((x) => x.id === tail[2]);
      return m ? ok(m) : httpError(404, "모델을 찾을 수 없습니다.");
    }

    if (method === "POST" && action === "create") {
      const body = await readBody(req);

      if (!body.displayName) return httpError(400, "표시 이름은 필수입니다.");
      if (db.models.some((x) => x.displayName === body.displayName)) {
        return httpError(409, `'${body.displayName}' 은(는) 이미 등록된 이름입니다.`);
      }

      const model = { ...body, id: crypto.randomUUID() };
      db.models.push(model);
      save();
      console.log(`  + 모델 추가: ${model.displayName}`);
      return ok(model, "Created");
    }

    if (method === "PUT" && action === "update") {
      const body = await readBody(req);
      const m = db.models.find((x) => x.id === body.id);
      if (!m) return httpError(404, "모델을 찾을 수 없습니다.");
      Object.assign(m, body);
      save();
      return ok(m, "Updated");
    }

    if (method === "DELETE") {
      const id = tail[tail.length - 1];

      // 딜러사가 쓰고 있는 모델을 지우면 그 딜러사의 에이전트가 멈춘다
      const inUse = db.companies.some((c) =>
        (c.deployments ?? []).some((d) => d.modelId === id),
      );
      if (inUse) return httpError(400, "이 모델을 사용 중인 딜러사가 있어 삭제할 수 없습니다.");

      db.models = db.models.filter((x) => x.id !== id);
      save();
      return ok(null, "Deleted");
    }
  }

  // ---- tokenUsage (사용량) ----
  //
  // /log 는 에이전트 백엔드가 호출한다. 어드민 화면은 /summary 와 /detail 만 쓴다.
  // 조회를 POST 로 둔 이유는 기간·딜러사·용도·계정이 함께 오는 조건 묶음이기 때문이다.
  if (tail[0] === "tokenUsage") {
    const action = tail[1];

    if (method === "POST" && action === "log") {
      const body = await readBody(req);

      if (!body.companyId) return httpError(400, "companyId 는 필수입니다.");

      db.tokenUsage.push({
        id: (db.tokenUsage.at(-1)?.id ?? 0) + 1,
        companyId: body.companyId,
        // 대소문자가 섞이면 같은 사람이 두 줄로 갈라진다
        userEmail: body.userEmail ? String(body.userEmail).trim().toLowerCase() : null,
        agentType: body.agentType ?? null,
        modelId: body.modelId ?? null,
        inputTokens: body.inputTokens ?? 0,
        outputTokens: body.outputTokens ?? 0,
        latencyMs: body.latencyMs ?? null,
        succeeded: body.succeeded !== false,
        errorMessage: body.errorMessage ?? null,
        createdAt: nowIso(),
      });

      save();
      return ok(null, "Logged");
    }

    if (method === "POST" && action === "summary") {
      const logs = filterUsage(await readBody(req));

      // 딜러사별
      const byCompany = new Map();
      // 딜러사 x 이메일별
      const byUser = new Map();
      // 날짜 x 딜러사
      const byDay = new Map();

      for (const lg of logs) {
        const company = db.companies.find((c) => c.companyId === lg.companyId);
        const email = lg.userEmail || "(시스템)";
        const day = lg.createdAt.slice(0, 10);

        bump(byCompany, lg.companyId, lg, {
          companyId: lg.companyId,
          companyName: company?.companyName ?? "(삭제된 딜러사)",
        });

        bump(byUser, `${lg.companyId}|${email}`, lg, {
          companyId: lg.companyId,
          userEmail: email,
        });

        bump(byDay, `${day}|${lg.companyId}`, lg, {
          usageDate: day,
          companyId: lg.companyId,
          companyName: company?.companyName ?? "(삭제된 딜러사)",
        });
      }

      const byTokens = (a, b) => b.totalTokens - a.totalTokens;

      const rows = [...byCompany.values()].map(finish).sort(byTokens);
      const users = [...byUser.values()].map(finish).sort(byTokens);
      const daily = [...byDay.values()]
        .map(finish)
        .sort((a, b) => a.usageDate.localeCompare(b.usageDate));

      return ok({
        rows,
        users,
        daily,
        totalRequestCount: rows.reduce((s, r) => s + r.requestCount, 0),
        totalTokens: rows.reduce((s, r) => s + r.totalTokens, 0),
      });
    }

    if (method === "POST" && action === "detail") {
      const limit = Math.min(Number(queryParam(req, "limit")) || 100, 500);
      const logs = filterUsage(await readBody(req));

      const sorted = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return ok({
        logs: sorted.slice(0, limit).map((lg) => ({
          ...lg,
          companyName:
            db.companies.find((c) => c.companyId === lg.companyId)?.companyName ?? null,
          modelName: db.models.find((m) => m.id === lg.modelId)?.displayName ?? null,
          totalTokens: lg.inputTokens + lg.outputTokens,
        })),
        total: logs.length,
      });
    }
  }

  // ---- system prompt (전역) ----
  //
  // 카테고리 3종 x 파일 여러 개. CRUD 전부 지원한다.
  //
  // [임시 구현] 지금은 dev-mock-prompts/ 폴더에 실제 yaml/md 파일로 저장한다.
  //            PostgreSQL 구축 후에는 SystemPrompt_Configuration 테이블로 바꾼다.
  //            그때 이 블록 전체가 없어지고 실제 백엔드
  //            (organization_setup_backend/internal/interfaces/repository/system_prompt_repository.py)
  //            가 같은 API 스펙으로 응답한다. 프론트엔드는 고칠 것이 없다.
  if (tail[0] === "systemPrompt") {
    const action = tail[1];

    if (method === "GET" && action === "getAll") {
      return ok(listPrompts());
    }

    if (method === "GET" && action === "getById") {
      const p = listPrompts().find((x) => x.id === tail[2]);
      return p ? ok(p) : httpError(404, "프롬프트를 찾을 수 없습니다.");
    }

    if (method === "POST" && action === "create") {
      const body = await readBody(req);

      if (!PROMPT_CATEGORIES.includes(body.category)) {
        return httpError(400, `category 는 ${PROMPT_CATEGORIES.join(" / ")} 중 하나여야 합니다.`);
      }
      if (!body.name) return httpError(400, "이름은 필수입니다.");

      // 파일명에 경로 구분자가 들어오면 폴더 밖에 쓸 수 있다
      if (/[\\/]/.test(body.name)) {
        return httpError(400, "이름에 / 나 \\ 는 쓸 수 없습니다.");
      }

      const ext = body.fileType === "md" ? "md" : "yaml";
      const baseName = stripExt(body.name);

      if (!baseName) return httpError(400, "이름은 필수입니다.");

      const fileName = `${baseName}.${ext}`;
      const target = promptPath(body.category, fileName);

      // 같은 카테고리 안에서 이름이 겹치면 어느 것을 고친 건지 알 수 없다
      if (fs.existsSync(target)) {
        return httpError(409, `'${body.name}' 은(는) 이미 등록된 이름입니다.`);
      }

      ensurePromptDirs();
      fs.writeFileSync(target, body.value ?? "", "utf-8");

      console.log(`  + 프롬프트 추가: ${body.category}/${fileName}`);

      return ok(
        {
          id: encodePromptId(body.category, fileName),
          category: body.category,
          name: baseName,
          fileName,
          fileType: ext,
          value: body.value ?? "",
        },
        "Created",
      );
    }

    if (method === "PUT" && action === "update") {
      const body = await readBody(req);

      let current;
      try {
        current = decodePromptId(body.id);
      } catch {
        return httpError(400, "잘못된 id 입니다.");
      }

      const oldPath = promptPath(current.category, current.fileName);

      if (!fs.existsSync(oldPath)) {
        return httpError(404, "프롬프트를 찾을 수 없습니다.");
      }

      const ext = body.fileType ?? fileTypeOf(current.fileName);
      const newName = stripExt(body.name ?? current.fileName);

      if (/[\\/]/.test(newName)) {
        return httpError(400, "이름에 / 나 \\ 는 쓸 수 없습니다.");
      }

      const newFileName = `${newName}.${ext}`;
      const newPath = promptPath(current.category, newFileName);

      // 이름이 바뀌면 파일도 옮긴다
      if (newPath !== oldPath) {
        if (fs.existsSync(newPath)) {
          return httpError(409, `'${newName}' 은(는) 이미 등록된 이름입니다.`);
        }
        fs.renameSync(oldPath, newPath);
      }

      if (body.value !== undefined) {
        fs.writeFileSync(newPath, body.value, "utf-8");
      }

      console.log(`  ~ 프롬프트 수정: ${current.category}/${newFileName}`);

      return ok(
        {
          id: encodePromptId(current.category, newFileName),
          category: current.category,
          name: newName,
          fileName: newFileName,
          fileType: ext,
        },
        "Updated",
      );
    }

    if (method === "DELETE") {
      const id = tail[tail.length - 1];

      let current;
      try {
        current = decodePromptId(id);
      } catch {
        return httpError(400, "잘못된 id 입니다.");
      }

      const target = promptPath(current.category, current.fileName);

      if (!fs.existsSync(target)) {
        return httpError(404, "프롬프트를 찾을 수 없습니다.");
      }

      fs.unlinkSync(target);
      console.log(`  - 프롬프트 삭제: ${current.category}/${current.fileName}`);

      return ok(null, "Deleted");
    }
  }

  // 그 외 — 화면이 죽지 않도록 빈 성공
  return ok([]);
};

// ── 서버 ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  let body;
  let status = 200;

  try {
    body = await handle(req.method, url.pathname, req);

    // httpError() 로 만들어진 응답은 실제 오류 상태코드로 내려보낸다
    if (body && body.__status) {
      status = body.__status;
      console.log(`  ! ${status} ${body.body.message}`);
      body = body.body;
    }
  } catch (err) {
    console.error("  ! 처리 중 오류:", err.message);
    status = 500;
    body = { detail: err.message, message: err.message };
  }

  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log(`  [개발 전용] Mock API  http://127.0.0.1:${PORT}`);
  console.log(`  저장 파일  ${path.basename(DATA_FILE)}  (지우면 초기화)`);
  console.log("  로그인     아무 이메일 / 아무 비밀번호");
  console.log("  중지       Ctrl+C");
  console.log("");
});
