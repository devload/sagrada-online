import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Test/e2e helper: parse URL query params to prefill multiplayer identity.
 *   ?nick=Alice&room=ABC123&auto=create
 *   ?nick=Bob&room=ABC123&auto=join
 * Used so device automation can drive the multi flow without typing.
 */
(() => {
  try {
    const q = new URLSearchParams(window.location.search)
    const nick = q.get('nick')
    const room = q.get('room')?.toUpperCase()
    const auto = q.get('auto') // 'create' | 'join'
    if (nick) localStorage.setItem('sagrada.multi.name', nick.slice(0, 16))
    // Optional pid override — lets multiple tabs in the same browser profile
    // appear as distinct players (dev/e2e only).
    const pid = q.get('pid')
    if (pid) localStorage.setItem('sagrada.multi.pid', pid.slice(0, 40))
    if (room && /^[A-Z0-9]{6}$/.test(room)) {
      localStorage.setItem('sagrada.multi.room', room)
      localStorage.setItem('sagrada.multi.autoRoom', room)
    }
    if (auto === 'create' || auto === 'join') {
      localStorage.setItem('sagrada.multi.autoMode', auto)
      localStorage.setItem('sagrada.multi.autoEnter', '1')
    }
    // Also mark onboarded so device tests don't need to tap through slides.
    if (q.has('skipOnboard')) localStorage.setItem('sagrada.onboarded', '1')
  } catch {}
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
