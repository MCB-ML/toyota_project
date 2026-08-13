import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './auth/msalConfig'
import { UserProvider } from './auth/UserContext'
import { ModelProvider } from './llm/ModelContext'
import AuthGate from './AuthGate'
import './index.css'

// MSAL 은 window.crypto.subtle 을 요구하는데, 이건 secure context 에서만 존재한다.
// 브라우저는 localhost 를 secure context 로 쳐주므로 개발 PC 에서는 늘 멀쩡하지만,
// http://<사설IP>:3000 처럼 LAN 으로 접속하면 secure context 가 아니라서
// PublicClientApplication 생성자가 그 자리에서 throw 한다.
// 그때 렌더까지 막히면 화면이 통째로 비므로(원인도 안 보인다), MSAL 없이도 앱은 띄운다.
// MsalProvider 가 없어도 msal-react 는 기본 컨텍스트(accounts: [])로 동작하므로
// AuthGate 는 로그인 화면을 정상적으로 보여주고, AI365(이메일/비밀번호) 로그인은 그대로 된다.
// 이 경우 Microsoft 계정 로그인만 쓸 수 없다.
let msalInstance = null
try {
  msalInstance = new PublicClientApplication(msalConfig)
} catch (err) {
  console.error(
    '[MSAL] 초기화할 수 없어 Microsoft 계정 로그인을 끈다. ' +
      'HTTPS 가 아닌 주소로 접속하면(localhost 제외) 발생한다. ' +
      '이메일/비밀번호 로그인은 그대로 쓸 수 있다.',
    err
  )
}

function renderApp() {
  const tree = (
    <BrowserRouter>
      <UserProvider>
        <ModelProvider>
          <AuthGate />
        </ModelProvider>
      </UserProvider>
    </BrowserRouter>
  )

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      {msalInstance ? <MsalProvider instance={msalInstance}>{tree}</MsalProvider> : tree}
    </React.StrictMode>
  )
}

if (msalInstance) {
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
      msalInstance.setActiveAccount(event.payload.account)
    }
  })

  // 기존과 같이 초기화를 끝내고 렌더한다(리다이렉트 복귀 시 로그인 화면이 깜빡이지 않는다).
  // 다만 initialize 가 실패하더라도 finally 로 렌더는 반드시 한다.
  msalInstance
    .initialize()
    .then(() => {
      // 리다이렉트 로그인 복귀 처리(새로고침/리다이렉트 후 계정 상태 복원)
      msalInstance.handleRedirectPromise().catch((err) => console.error('[MSAL] redirect error', err))
    })
    .catch((err) => console.error('[MSAL] initialize error', err))
    .finally(renderApp)
} else {
  renderApp()
}
