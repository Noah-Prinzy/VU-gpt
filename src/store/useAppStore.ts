import { create } from 'zustand'
import { getReply } from '../services/chat'
import { fetchNotifications, markNotificationsRead } from '../services/notifications'
import { speak, stopSpeaking } from '../services/tts'
import {
  clearSession,
  hasSeenIntro,
  isSessionValid,
  loadSession,
  markIntroSeen,
  saveSession,
  type AuthUser,
  type Session,
} from '../services/auth'
import type { AppNotification, AvatarPhase, ChatMessage, Screen, View } from '../types'

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function makeId() {
  return Math.random().toString(36).slice(2)
}

const VOICE_KEY = 'vu-gpt:voiceEnabled'
function loadVoiceEnabled() {
  try {
    return localStorage.getItem(VOICE_KEY) !== 'false'
  } catch {
    return true
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

interface AppState {
  screen: Screen
  authChecked: boolean
  user: AuthUser | null
  introActive: boolean

  view: View
  phase: AvatarPhase
  messages: ChatMessage[]
  lastExchange: { userText: string; botText: string } | null

  menuOpen: boolean
  notificationsOpen: boolean
  notifications: AppNotification[]
  notificationsLoaded: boolean
  toast: string | null
  voiceEnabled: boolean

  bootstrapAuth: () => Promise<void>
  loginSuccess: (session: Session) => void
  logout: () => void
  completeIntro: () => void

  setView: (view: View) => void
  tapAvatar: () => void
  ask: (text: string) => void
  goToVoice: () => void

  setMenuOpen: (open: boolean) => void
  toggleNotifications: () => void
  markAllNotificationsRead: () => void
  clearChat: () => void
  showToast: (message: string) => void
  toggleVoice: () => void
}

async function runExchange(
  text: string,
  set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
  get: () => AppState,
) {
  const userMsg: ChatMessage = { id: makeId(), role: 'user', text, time: nowLabel() }
  set((state) => ({ messages: [...state.messages, userMsg], phase: 'processing' }))

  const reply = await getReply(text)

  const botMsg: ChatMessage = {
    id: makeId(),
    role: 'bot',
    text: reply.text,
    time: nowLabel(),
    schedule: reply.schedule,
  }
  set((state) => ({
    messages: [...state.messages, botMsg],
    phase: 'responding',
    lastExchange: { userText: text, botText: reply.text },
  }))

  // Kicks off STEP 2 (see tts.ts) with the plain `reply.text` string pulled
  // out of the JSON response from STEP 1 (see chat.ts's getReply).
  if (get().voiceEnabled) speak(reply.text)
}

/** Enters the app screen for `user`, deciding whether the first-run intro
 * plays or the returning-user quick greeting fires instead. */
function enterApp(
  user: AuthUser,
  set: (partial: Partial<AppState>) => void,
  get: () => AppState,
) {
  const seen = hasSeenIntro(user.email)
  set({ screen: 'app', user, introActive: !seen })
  if (seen) {
    const firstName = user.name.split(' ')[0]
    get().showToast(`Hey, ${firstName}, how can I help you today!`)
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'auth',
  authChecked: false,
  user: null,
  introActive: false,

  view: 'avatar',
  phase: 'idle',
  messages: [],
  lastExchange: null,

  menuOpen: false,
  notificationsOpen: false,
  notifications: [],
  notificationsLoaded: false,
  toast: null,
  voiceEnabled: loadVoiceEnabled(),

  bootstrapAuth: async () => {
    const session = loadSession()
    if (!session) {
      set({ authChecked: true })
      return
    }
    const valid = await isSessionValid(session)
    if (!valid) {
      clearSession()
      set({ authChecked: true })
      return
    }
    enterApp(session.user, set, get)
    set({ authChecked: true })
  },

  loginSuccess: (session) => {
    saveSession(session)
    enterApp(session.user, set, get)
  },

  logout: () => {
    stopSpeaking()
    clearSession()
    set({
      screen: 'auth',
      user: null,
      introActive: false,
      messages: [],
      lastExchange: null,
      phase: 'idle',
      view: 'avatar',
      menuOpen: false,
      notificationsOpen: false,
    })
  },

  completeIntro: () => {
    stopSpeaking()
    const email = get().user?.email
    if (email) markIntroSeen(email)
    set({ introActive: false })
  },

  setView: (view) => set({ view }),

  tapAvatar: () => {
    const { phase } = get()
    if (phase === 'idle') {
      set({ phase: 'listening' })
      return
    }
    if (phase === 'listening') {
      // Phase 1 has no real speech-to-text wired up yet — simulate a
      // captured utterance so the full listen -> process -> respond cycle
      // is demoable end to end. Swap for useSpeechInput's transcript later.
      const demoUtterances = [
        "What's my schedule tomorrow?",
        'What assignments do I have due?',
        "What's happening on campus this week?",
      ]
      const text = demoUtterances[Math.floor(Math.random() * demoUtterances.length)]
      void runExchange(text, set, get)
      return
    }
    if (phase === 'responding') {
      stopSpeaking()
      set({ phase: 'idle' })
    }
  },

  ask: (text) => {
    if (!text.trim()) return
    void runExchange(text, set, get)
  },

  goToVoice: () => {
    set({ view: 'avatar' })
    if (get().phase === 'idle') get().tapAvatar()
  },

  setMenuOpen: (open) => set({ menuOpen: open }),

  toggleNotifications: () => {
    const opening = !get().notificationsOpen
    set({ notificationsOpen: opening })
    if (opening && !get().notificationsLoaded) {
      set({ notificationsLoaded: true })
      void fetchNotifications().then((notifications) => set({ notifications }))
    }
  },

  markAllNotificationsRead: () => {
    void markNotificationsRead().then((notifications) => set({ notifications }))
  },

  clearChat: () => {
    stopSpeaking()
    set({ messages: [], lastExchange: null })
    get().showToast('Conversation cleared')
  },

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: message })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },

  toggleVoice: () => {
    const next = !get().voiceEnabled
    if (!next) stopSpeaking()
    set({ voiceEnabled: next })
    try {
      localStorage.setItem(VOICE_KEY, String(next))
    } catch {
      /* best-effort persistence only */
    }
  },
}))
