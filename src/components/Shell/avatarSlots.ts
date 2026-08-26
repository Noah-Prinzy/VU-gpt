// A tiny non-reactive registry for the DOM nodes that AvatarStage measures
// to know where the persistent avatar canvas should visually sit. Plain
// mutable refs on purpose — these are layout targets, not state that should
// trigger re-renders when they change.
export type SlotName = 'avatar' | 'badge'

const slots: Record<SlotName, HTMLDivElement | null> = { avatar: null, badge: null }

export function setSlot(name: SlotName, el: HTMLDivElement | null) {
  slots[name] = el
}

export function getSlot(name: SlotName) {
  return slots[name]
}
