// 빌드에 박힌 URL 을 지금 접속한 호스트에 맞춘다.
//
// VITE_* URL 은 빌드 시점에 번들로 들어간다. 그런데 개발 스택은 localhost 로도,
// LAN(http://<사설IP>:3000)으로도 열린다:
//   - localhost 가 박힌 채 LAN 으로 접속하면 → 접속한 기기 자신을 가리켜 버린다.
//   - 사설 IP 가 박힌 채 localhost 로 접속하거나 DHCP 로 IP 가 바뀌면 → 죽은 주소가 된다.
// 관리자 센터 링크가 안 열리고 로그인이 실패하는 게 그래서다.
//
// 그래서 박힌 호스트가 "개발용 주소"(localhost 또는 사설 IP)인데 지금 페이지의
// 호스트와 다르면, 호스트만 페이지 것으로 바꾼다(포트·경로는 그대로). 스택의 모든
// 서비스 포트는 어느 호스트로 접속하든 같이 열려 있으므로 이 치환은 항상 안전하다.
// 진짜 도메인을 박아 넣은 운영 배포 URL 은 사설 범위에 안 걸리므로 건드리지 않는다.
//
// 이 치환 덕에 LAN ↔ localhost 전환(scripts/lan-deploy.ps1)에 프런트 재빌드가 필요 없다.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

// RFC1918 사설 대역 + 링크로컬. 개발 스택이 뜰 수 있는 주소들이다.
function isPrivateIp(hostname) {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  return a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
}

function isDevHost(hostname) {
  return LOCAL_HOSTS.has(hostname) || isPrivateIp(hostname)
}

export function adaptUrlToPageHost(configuredUrl, { pageHostname = window.location.hostname } = {}) {
  if (!configuredUrl) return configuredUrl
  try {
    const url = new URL(configuredUrl)
    if (isDevHost(url.hostname) && url.hostname !== pageHostname && isDevHost(pageHostname)) {
      url.hostname = pageHostname
      return url.toString().replace(/\/$/, configuredUrl.endsWith('/') ? '/' : '')
    }
    return configuredUrl
  } catch {
    // 상대 경로('/api/...')는 어차피 현재 오리진 기준이라 그대로 두면 된다.
    return configuredUrl
  }
}
