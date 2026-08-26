import { FALLBACK_ANSWER, KNOWLEDGE_BASE } from '../data/knowledge'
import type { ScheduleItem } from '../types'
import { API_URL } from './api'

export interface ChatReply {
  text: string
  schedule?: ScheduleItem[]
}

const REPLY_DELAY_MS = 900

function localReply(question: string): ChatReply {
  const q = question.toLowerCase()
  const row = KNOWLEDGE_BASE.find((entry) => entry.keywords.some((k) => q.includes(k)))
  return row ? { text: row.answer, schedule: row.schedule } : { text: FALLBACK_ANSWER }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Talks to the server/ backend when it's running (`npm run server` or
 * `npm run dev:all`), and falls back to the same knowledge base evaluated
 * locally when it isn't — so the frontend is never blocked on the backend
 * being up, but exercises the real network path whenever it is.
 */
export async function getReply(question: string): Promise<ChatReply> {
  try {
    // STEP 1: ask the backend for a reply. We send the question as JSON
    // and get JSON back — this is the only step in the whole talking-avatar
    // flow that involves JSON/network at all. Everything after this (speaking
    // the text, moving the mouth) works on the plain `text` string we pull
    // out of this response, with no JSON involved.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`chat API responded ${res.status}`)
    return (await res.json()) as ChatReply
  } catch {
    await wait(REPLY_DELAY_MS + Math.random() * 500)
    return localReply(question)
  }
}
