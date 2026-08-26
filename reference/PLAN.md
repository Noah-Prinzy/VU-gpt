# VU-GPT — plan of action

Victoria University Kampala's chatbot assistant. A 3D humanoid avatar the user talks to by
voice or text, running on phones, laptops, and campus desktops.

This document fixes the stack decisions and the order of work. Phase 1 is **frontend only** —
a working template the team can build against.

---

## 1. Stack decisions

### Frontend

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Several people touching one codebase. Types are how you stop the avatar API and the chat state drifting apart. |
| Build tool | **Vite** | Fast dev server, trivial config, first-class React support. |
| UI framework | **React 18** | Largest hiring pool in Kampala, and the only option with a mature 3D ecosystem. |
| 3D | **three** + **@react-three/fiber** + **@react-three/drei** | Fiber lets the 3D scene live in the React tree instead of a separate imperative world. drei supplies `useGLTF`, `Environment`, and camera helpers. |
| Animation | **Framer Motion** | Layout transitions between idle / text / voice modes. |
| State | **Zustand** | Avatar state (speaking, listening, idle) is read by both the 3D scene and the UI. Zustand crosses that boundary without prop drilling or Context re-render storms. |
| Styling | **CSS Modules** over a token file | No Tailwind. The design has a specific identity; tokens keep it consistent without a utility-class layer. |
| Routing | **React Router** | Only if the app grows past one screen. Not needed in phase 1. |

### Backend (phase 2 — not built yet)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Django 5** | Team preference, strong ORM, free admin panel for staff to edit the knowledge base. |
| API layer | **Django Ninja** | Async views and auto-generated docs. Prefer over DRF — you need async to stream LLM replies token by token. |
| Database | **PostgreSQL** | pgvector extension available when you add retrieval over university documents. |
| Realtime | **Django Channels** *(only if needed)* | For websocket streaming. Server-Sent Events over Ninja is simpler and usually enough. |
| LLM | Provider-agnostic service module | Never call a vendor SDK from a view. One `services/llm.py` seam so the provider can change. |

### Packaging

| Target | Tool | Notes |
|---|---|---|
| Web + mobile web | **PWA** (vite-plugin-pwa) | Primary target. Installable, offline shell, no app store. |
| Android / iOS | **Capacitor** | Same codebase in a native shell. Uses the system webview, so WebGL and Three.js keep working. |
| Windows / macOS | **Tauri** | Same codebase, small binary. Only if the university actually wants a desktop install. |

**Rejected: React Native.** Three.js support via `expo-gl` is immature. The avatar is the
product — don't put it on the least-supported path.

### Speech

| Direction | Phase 1 | Phase 2 |
|---|---|---|
| Speech → text | Web Speech API (free, Chrome/Edge) | Whisper via the backend for accuracy and browser coverage |
| Text → speech | Browser `speechSynthesis` | Azure TTS — emits timestamped viseme events that map straight onto the avatar's blendshapes |

---

## 2. The avatar

Source: **Avaturn** (avaturn.me). Selfie → rigged GLB.

> Ready Player Me is dead — acquired by Netflix, standalone creator shut down. Do not use it.

**Export as body type T2.** T2 has separate eyeballs and a mouth hole, which is what makes
ARKit blendshapes and visemes work. T1 looks more like the source photo but cannot be
lip-synced. If you export T1 by mistake, the mouth will simply never move and you will
waste an afternoon looking for a bug in your code.

The GLB ships with ~52 ARKit blendshapes plus 15 Oculus visemes. Log
`morphTargetDictionary` on first load and work from what's actually there, not from a list
in a document.

Reference implementation worth reading before writing lip-sync code:
**TalkingHead.js** — github.com/met4citizen/TalkingHead. Same stack, viseme timing already
solved.

---

## 3. Performance — a hard requirement, not a polish item

Target devices are mid-range Android phones and shared campus desktops.

- Cap `devicePixelRatio` at 2. Uncapped, a modern phone renders 3× the pixels for no visible gain.
- **Build a 2D fallback from day one.** Detect WebGL support and rough GPU capability on
  mount; if the device fails, render a static illustrated avatar with CSS animation instead
  of the 3D scene. Both must satisfy the same component interface
  (`speaking`, `listening`, `idle`), so the rest of the app never knows which is mounted.
  Retrofitting this later means restructuring the component tree.
- Compress the GLB with `gltf-transform` (Draco geometry + KTX2 textures). Expect to get an
  8MB export under 2MB.
- Lazy-load the 3D scene. The chat must be usable before the avatar finishes downloading.
- Budget: interactive in under 3s on a mid-range phone over 3G.

---

## 4. Project structure

```
VU-gpt/
  reference/
    prototype.html          approved design reference — read, don't copy
  public/
    avatar.glb              Avaturn export (T2)
  src/
    components/
      Avatar/
        Avatar.tsx          <Canvas> wrapper + capability check
        AvatarModel.tsx     GLB load, morph targets
        Avatar2D.tsx        fallback for low-end devices
        useVisemes.ts       lip sync
        useIdleMotion.ts    breathing, blinking, head tracking
      Chat/
        ChatPanel.tsx  Bubble.tsx  TypingDots.tsx  SuggestionChips.tsx
      Voice/
        VoicePanel.tsx  Waveform.tsx
      Shell/
        TopBar.tsx  Dock.tsx  Aurora.tsx
    hooks/
      useSpeechInput.ts  useMicAnalyser.ts
    store/
      useAppStore.ts        mode, messages, avatar state
    services/
      chat.ts               ← the seam. Mocked now, Django later.
    data/
      knowledge.ts          hardcoded Q&A for phase 1
    styles/
      tokens.css  global.css
    types/
      index.ts
```

**`services/chat.ts` is the most important file in phase 1.** It exposes one async function
that returns a reply. Today it reads from `knowledge.ts` behind a fake delay. In phase 2 it
calls Django. Nothing else in the app changes.

---

## 5. Design tokens

Ported from `reference/prototype.html`:

```
--vu-red:        #D62246
--vu-red-dark:   #9E1631
--vu-blue:       #003D82
--vu-blue-dark:  #001F42
--vu-blue-light: #2E6BC4
font:            Outfit
spring easing:   cubic-bezier(.22, 1.4, .4, 1)
```

Three layout states with animated transitions:

1. **Idle** — avatar centred, full width, nameplate beneath
2. **Text** — avatar eases to ~42% left, chat panel slides in from the right
3. **Voice** — avatar left, right panel shows live waveform, timer, transcript

The canvas must persist across mode changes. Never unmount the 3D scene.

Replace the placeholder "VU" crest with the official university badge once the asset
arrives — request it from the marketing office as SVG, not PNG.

---

## 6. Order of work

### Phase 1 — frontend template *(current)*

| # | Task | Done when |
|---|---|---|
| 1 | Scaffold Vite + React + TS, install deps | Dev server runs |
| 2 | Design tokens + app shell — aurora, top bar, dock | Matches the prototype visually |
| 3 | Three-state layout with Framer Motion transitions | Modes switch smoothly, canvas persists |
| 4 | Load the GLB, lighting, HDRI environment | **Stop here for review** — the model must look right before anything is built on top |
| 5 | Idle motion — breathing, blinking, head tracking | Avatar feels alive when nobody's talking |
| 6 | Chat panel + `knowledge.ts` + type-on replies | Full text conversation works |
| 7 | Amplitude lip sync wired to reply timing | Mouth moves with speech |
| 8 | Voice mode — mic, waveform, transcript | Voice turn completes end to end |
| 9 | 2D fallback + capability check | Works on a low-end phone |
| 10 | PWA manifest, service worker, polish | Installable |

### Phase 2 — backend

Django + Ninja, PostgreSQL, real knowledge base with an admin panel for staff, LLM
integration with streaming, session persistence, analytics on what students actually ask.

### Phase 3 — native shells

Capacitor for Android and iOS. Tauri for desktop, if wanted.

---

## 7. Open decisions

- **Does the university need app store presence, or is an installable PWA enough?** Changes
  nothing about phase 1, but decides whether Capacitor gets budgeted.
- **Avatar likeness** — the T2 export trades some resemblance for the ability to speak.
  Confirm the team is happy with the face before building animation on top of it.
- **Voice for TTS** — Azure has Ugandan English options worth auditioning. A mismatched
  accent undercuts the whole thing.
- **Official VU badge asset** — needed as SVG.

---

## 8. Getting started (Windows)

```powershell
cd C:\Users\Noah\Desktop\Projects\VU-gpt

# Node 20+ required — check with: node -v
npm create vite@latest . -- --template react-ts
npm install
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
npm i zustand framer-motion

npm run dev
```

Save `reference/prototype.html` before starting. Drop the Avaturn GLB into `public/` as
`avatar.glb` when it finishes processing.
