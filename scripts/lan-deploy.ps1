# 같은 와이파이(LAN)의 다른 기기에서 접속할 수 있게 .env 의 브라우저용 URL 을
# 이 PC 의 사설 IP 로 맞추고, 영향받는 컨테이너만 다시 올린다.
#
# 공유기 설정(포트포워딩)은 필요 없다. 같은 LAN 안에서는 사설 IP 로 바로 닿는다.
# Wi-Fi 가 DHCP 라 IP 가 바뀔 수 있으므로, 접속이 안 되면 이 스크립트를 다시 돌린다.
#
#   powershell -ExecutionPolicy Bypass -File scripts\lan-deploy.ps1            # LAN 으로 전환
#   powershell -ExecutionPolicy Bypass -File scripts\lan-deploy.ps1 -IpAddress 192.168.0.10
#   powershell -ExecutionPolicy Bypass -File scripts\lan-deploy.ps1 -Revert    # localhost 로 되돌림
#   powershell -ExecutionPolicy Bypass -File scripts\lan-deploy.ps1 -Build     # 코드 수정 후 첫 기동
#
# 같은 이미지가 LAN/localhost 어느 쪽으로도 동작하므로(-Build 는 코드가 바뀌었을 때만),
# 전환은 .env 갱신 + 컨테이너 재생성뿐이다.

[CmdletBinding()]
param(
  # 비워두면 Wi-Fi 어댑터의 IPv4 주소를 자동으로 찾는다.
  [string]$IpAddress,
  # 로컬 전용(localhost) 설정으로 되돌린다.
  [switch]$Revert,
  # 방화벽 규칙 추가를 건너뛴다(관리자 권한이 없을 때).
  [switch]$SkipFirewall,
  # 코드가 바뀐 뒤 처음 돌릴 때만 필요. LAN ↔ localhost 전환 자체는 재빌드가 필요 없다
  # (프런트가 접속한 호스트에 맞춰 URL 을 런타임에 고친다 — src/utils/runtimeHost.js).
  [switch]$Build
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

$envPath = Join-Path $repoRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) {
  throw ".env 가 없다. 먼저 scripts\setup-local.ps1 을 실행할 것."
}

# 호스트에 공개된 포트. docker-compose.yml 의 기본값과 맞춰둔다.
$ports = @{ Service = 3000; AdminFrontend = 8088; AdminApi = 8090 }

# --- 대상 호스트 결정 -------------------------------------------------------
if ($Revert) {
  $targetHost = 'localhost'
} elseif ($IpAddress) {
  $targetHost = $IpAddress
} else {
  # Wi-Fi 를 우선으로 하되, 없으면 DHCP 로 받은 사설 IPv4 중 첫 번째를 쓴다.
  # 169.254.* (APIPA) 와 Hyper-V/WSL 가상 스위치 주소는 LAN 접속에 쓸 수 없으므로 제외한다.
  $candidate =
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.PrefixOrigin -eq 'Dhcp' -and
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.InterfaceAlias -notlike '*vEthernet*'
    } |
    Sort-Object { if ($_.InterfaceAlias -like '*Wi-Fi*') { 0 } else { 1 } } |
    Select-Object -First 1

  if (-not $candidate) {
    throw "LAN IPv4 주소를 찾지 못했다. -IpAddress 로 직접 지정할 것."
  }
  $targetHost = $candidate.IPAddress
  Write-Host "감지한 LAN IP: $targetHost ($($candidate.InterfaceAlias))" -ForegroundColor Cyan
}

# --- .env 갱신 --------------------------------------------------------------
# 값만 바꾸고 나머지 줄(주석 포함)은 그대로 둔다.
$lines = Get-Content -LiteralPath $envPath -Encoding UTF8

$replacements = [ordered]@{
  'PUBLIC_SERVICE_URL'        = "http://${targetHost}:$($ports.Service)"
  'PUBLIC_ADMIN_FRONTEND_URL' = "http://${targetHost}:$($ports.AdminFrontend)"
  'PUBLIC_ADMIN_API_URL'      = "http://${targetHost}:$($ports.AdminApi)"
  'SERVICE_AI365_LOGIN_URL'   = "http://${targetHost}:$($ports.AdminApi)/api/v1/auth/login/credentials"
}

# 어드민 백엔드 CORS. localhost 항목은 이 PC 에서 계속 쓰려고 항상 남긴다.
$origins = @(
  "http://localhost:$($ports.Service)"
  "http://127.0.0.1:$($ports.Service)"
  "http://localhost:$($ports.AdminFrontend)"
  "http://127.0.0.1:$($ports.AdminFrontend)"
)
if ($targetHost -ne 'localhost') {
  $origins += "http://${targetHost}:$($ports.Service)"
  $origins += "http://${targetHost}:$($ports.AdminFrontend)"
}
$replacements['ADMIN_ALLOWED_ORIGINS'] = ($origins -join ',')

foreach ($key in $replacements.Keys) {
  $value = $replacements[$key]
  $matched = $false
  $lines = $lines | ForEach-Object {
    if ($_ -match "^\s*$([regex]::Escape($key))\s*=") {
      $matched = $true
      "$key=$value"
    } else {
      $_
    }
  }
  if (-not $matched) {
    # 키가 아예 없으면 끝에 덧붙인다.
    $lines += "$key=$value"
  }
  Write-Host "  $key=$value"
}

# Set-Content -Encoding utf8 은 PowerShell 5.1 에서 BOM 을 붙인다.
# BOM 이 들어가면 첫 줄의 키 이름이 깨지므로 BOM 없이 직접 쓴다.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($envPath, $lines, $utf8NoBom)
Write-Host ".env 갱신 완료" -ForegroundColor Green

# --- 방화벽 -----------------------------------------------------------------
# Windows 는 자기 자신으로 오는 루프백 트래픽을 검사하지 않으므로, 이 PC 에서
# 잘 열린다고 다른 기기에서도 열린다는 뜻은 아니다. 인바운드 규칙이 필요하다.
$ruleName = 'Toyota Dashboard LAN'
if (-not $SkipFirewall -and -not $Revert) {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
             ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  # 카페/공유오피스 Wi-Fi 는 보통 Public 프로파일로 잡히므로 -Profile Any 로 건다.
  # 대신 -RemoteAddress LocalSubnet 으로 같은 서브넷에서만 닿게 좁힌다.
  # 네트워크 범주를 Private 로 바꾸는 방법도 있지만, 그건 파일공유 등 다른 것까지
  # 함께 열리므로 공유 Wi-Fi 에서는 이 방식이 더 좁고 안전하다.
  $ruleArgs = "-Direction Inbound -Action Allow -Protocol TCP -LocalPort $($ports.Service),$($ports.AdminFrontend),$($ports.AdminApi) -Profile Any -RemoteAddress LocalSubnet"
  if (-not $isAdmin) {
    Write-Warning "관리자 권한이 아니라 방화벽 규칙을 건너뛴다. 다른 기기에서 접속이 안 되면 관리자 PowerShell 에서 아래를 실행할 것:"
    Write-Host "  New-NetFirewallRule -DisplayName '$ruleName' $ruleArgs" -ForegroundColor Yellow
  } else {
    Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue |
      Remove-NetFirewallRule -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $ruleName `
      -Direction Inbound -Action Allow -Protocol TCP `
      -LocalPort $ports.Service, $ports.AdminFrontend, $ports.AdminApi `
      -Profile Any -RemoteAddress LocalSubnet | Out-Null
    Write-Host "방화벽 인바운드 규칙 적용 완료 ($ruleName)" -ForegroundColor Green
  }
}

# --- 재배포 -----------------------------------------------------------------
# LAN ↔ localhost 전환에 재빌드는 필요 없다:
#   - service 프런트는 빌드에 박힌 localhost URL 을 접속한 호스트에 맞춰 런타임에
#     고친다(src/utils/runtimeHost.js). 관리자 센터 링크·로그인 URL 이 여기에 해당.
#   - admin-frontend 는 /env.js 로 런타임 주입이라 컨테이너 재생성만으로 반영된다.
#   - admin-backend 는 CORS 허용 오리진(.env)만 바뀌므로 재생성이면 된다.
# 코드를 고친 뒤 처음 올릴 때만 -Build 를 붙인다.
$composeArgs = @('compose', 'up', '-d')
if ($Build) { $composeArgs += '--build' }
$composeArgs += @('service', 'admin-frontend', 'admin-backend')
docker @composeArgs
if ($LASTEXITCODE -ne 0) { throw "docker compose 실패" }

Write-Host ""
Write-Host "접속 주소" -ForegroundColor Cyan
Write-Host "  서비스   http://${targetHost}:$($ports.Service)"
Write-Host "  어드민   http://${targetHost}:$($ports.AdminFrontend)"
