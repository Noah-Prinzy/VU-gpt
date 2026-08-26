import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { MessageBubble } from './MessageBubble'
import { setSlot } from '../Shell/avatarSlots'
import { CampusBackground } from '../Shell/CampusBackground'
import styles from './ChatScreen.module.css'

export function ChatScreen() {
  const messages = useAppStore((s) => s.messages)
  const phase = useAppStore((s) => s.phase)
  const ask = useAppStore((s) => s.ask)
  const setView = useAppStore((s) => s.setView)
  const goToVoice = useAppStore((s) => s.goToVoice)
  const clearChat = useAppStore((s) => s.clearChat)
  const voiceEnabled = useAppStore((s) => s.voiceEnabled)
  const toggleVoice = useAppStore((s) => s.toggleVoice)
  const active = useAppStore((s) => s.view === 'chat')

  const [input, setInput] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, phase])

  const send = () => {
    if (!input.trim() || phase === 'processing') return
    ask(input)
    setInput('')
  }

  return (
    <motion.div
      className={styles.screen}
      animate={{ opacity: active ? 1 : 0, x: active ? 0 : 24 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      aria-hidden={!active}
    >
      <CampusBackground image="/campus/bg-chat.jpg" focus="center 20%" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.back} aria-label="Back" onClick={() => setView('avatar')}>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className={styles.identity}>
            <div className={styles.avatarThumbSlot} ref={(el) => setSlot('badge', el)} />
            <div>
              <h1>VU Assistant</h1>
              <span className={styles.onlineRow}>
                <span className={styles.onlineDot} />
                Online
              </span>
            </div>
          </div>
          <div className={styles.menuWrap}>
            <button className={styles.menu} aria-label="More" onClick={() => setMenuOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
                  <motion.div
                    className={styles.menuDropdown}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
                  >
                    <button
                      onClick={() => {
                        clearChat()
                        setMenuOpen(false)
                      }}
                    >
                      Clear conversation
                    </button>
                    <button
                      onClick={() => {
                        goToVoice()
                        setMenuOpen(false)
                      }}
                    >
                      Switch to voice
                    </button>
                    <button
                      onClick={() => {
                        toggleVoice()
                        setMenuOpen(false)
                      }}
                    >
                      {voiceEnabled ? 'Mute voice' : 'Unmute voice'}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className={styles.list} ref={listRef}>
        {messages.length === 0 && (
          <p className={styles.empty}>Ask me anything about your programme, schedule, or campus life.</p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {phase === 'processing' && (
          <div className={styles.typing}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <footer className={styles.inputBar}>
        <div className={styles.inputInner}>
          <div className={styles.field}>
            <button className={styles.micIcon} aria-label="Switch to voice" onClick={goToVoice}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Type a message…"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
          </div>
          <button className={styles.send} aria-label="Send" onClick={send} disabled={!input.trim() || phase === 'processing'}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </footer>
    </motion.div>
  )
}
