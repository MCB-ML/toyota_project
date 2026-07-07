import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './auth/msalConfig'
import { UserProvider } from './auth/UserContext'
import AuthGate from './AuthGate'
import './index.css'

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
    msalInstance.setActiveAccount(event.payload.account)
  }
})

msalInstance.initialize().then(() => {
  // 리다이렉트 로그인 복귀 처리(새로고침/리다이렉트 후 계정 상태 복원)
  msalInstance.handleRedirectPromise().catch((err) => console.error('[MSAL] redirect error', err))

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <UserProvider>
            <AuthGate />
          </UserProvider>
        </BrowserRouter>
      </MsalProvider>
    </React.StrictMode>
  )
})
