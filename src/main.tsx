import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/primitives.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/Shell/ErrorBoundary.tsx'
import { CrashScreen } from './components/Shell/CrashScreen.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={(error) => <CrashScreen error={error} onRetry={() => window.location.reload()} />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
