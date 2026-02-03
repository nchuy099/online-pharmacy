import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { AuthProvider } from './features/auth/auth.context.tsx'
import ToastViewport from './features/notification/components/ToastViewport'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <ToastViewport />
    </AuthProvider>
  </StrictMode>,
)
