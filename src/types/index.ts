export type AvatarPhase = 'idle' | 'listening' | 'processing' | 'responding'
export type View = 'avatar' | 'chat'
export type Screen = 'auth' | 'app'

export interface ScheduleItem {
  icon: string
  title: string
  time: string
  location: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  time: string
  schedule?: ScheduleItem[]
}

export interface Suggestion {
  icon: string
  label: string
  prompt: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}
