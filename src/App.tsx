import { useEffect } from 'react'
import { AvatarView } from './components/Shell/AvatarView'
import { AvatarStage } from './components/Shell/AvatarStage'
import { IntroOverlay } from './components/Shell/IntroOverlay'
import { MenuDrawer } from './components/Shell/MenuDrawer'
import { NotificationsPanel } from './components/Shell/NotificationsPanel'
import { Toast } from './components/Shell/Toast'
import { ChatScreen } from './components/Chat/ChatScreen'
import { AuthScreen } from './components/Auth/AuthScreen'
import { useAppStore } from './store/useAppStore'
import styles from './App.module.css'

function App() {
  const screen = useAppStore((s) => s.screen)
  const authChecked = useAppStore((s) => s.authChecked)
  const bootstrapAuth = useAppStore((s) => s.bootstrapAuth)

  useEffect(() => {
    void bootstrapAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.app}>
      {authChecked && screen === 'auth' && <AuthScreen />}

      {screen === 'app' && (
        <>
          {/* Both screens stay mounted permanently and toggle visibility
              themselves off `view` — this is what lets AvatarStage portal
              the one persistent avatar canvas between them instead of
              unmounting/reloading it on every switch. */}
          <AvatarView />
          <ChatScreen />
          <AvatarStage />
          {/* Deliberately a top-level sibling, not nested inside AvatarView —
              anything that needs to reliably paint above the avatar canvas
              has to live outside its stacking context, not share one with
              it (see IntroOverlay.tsx / AvatarStage.tsx for why). */}
          <IntroOverlay />

          <MenuDrawer />
          <NotificationsPanel />
          <Toast />
        </>
      )}
    </div>
  )
}

export default App
