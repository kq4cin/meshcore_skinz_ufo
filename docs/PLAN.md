# MeshCore Client PWA — Plan (Elephant & Goldfish)

This plan uses the **Elephant & Goldfish** model:

- 🐘 **Elephant** — the long-term memory. Everything that must *never be forgotten*
  across every task: goals, constraints, architecture, protocol facts, design rules.
  Every contributor (human or agent) reads this first.
- 🐠 **Goldfish** — short-memory task cards. Each card is small, self-contained and
  can be completed by someone who remembers nothing except the Elephant + the card.
  Each card has a clear *done when* so it can be verified in isolation.

---

## 🐘 Elephant — long-term memory

### Mission
A clone of the MeshCore web client (companion-radio client) that:
1. Is an installable, offline-capable **PWA**.
2. Wears the **Galaxy Core alien theme** (deep-space navy / parchment tiles / alien green / flare gold /
   nebula purple, tentacled-UFO mascot crest, cosmic stripes, abduction-beam pattern)
   derived from the supplied alien asset pack.
3. Adds a **Weather tab**: the user enters a **ZIP code** and a **weather hashtag
   channel** (e.g. `#weather`). The app sends the ZIP to the bot on that channel and
   shows the bot's replies in the Weather tab.

### Non-negotiables
| Rule | Why |
| --- | --- |
| Mobile-first; works at 320 px width, honours safe-area insets, 44 px touch targets | Primary use is on a phone |
| Clean & clutter-free: max 4 primary tabs, one primary action per screen | User requirement |
| Works offline after first load (service worker app-shell cache) | Off-grid use |
| No servers, no tracking; all state in `localStorage` on the device | Privacy / off-grid |
| Protocol via `@liamcottle/meshcore.js` (deep imports only — never the package index, which pulls Node `serialport`) | Browser bundle must stay clean |
| All radio commands serialised through one queue | BLE throws "GATT operation already in progress" on concurrent writes |

### Protocol facts (do not re-derive)
- Transports: **Web Bluetooth** (Android Chrome/Edge, desktop Chrome; iOS needs the Bluefy
  browser) and **Web Serial** (desktop Chrome/Edge, `companion_radio_usb` firmware).
- Hashtag channel secret = **first 16 bytes of SHA-256(`"#name"`)** (lower-case, includes `#`).
- Channel slots: `getChannel(i)` until it errors; empty slot = empty name.
- Channel message text arrives as `"SenderName: message"`.
- `PushCodes.MsgWaiting` ⇒ drain with `syncNextMessage()` until it returns `null`.
- Direct messages address a contact by its 32-byte public key; incoming DMs carry a 6-byte
  pub-key prefix.

### Weather bot contract
- Outgoing: the message text is a template, default **`{zip}`** (bare ZIP, e.g. `30301`),
  editable in Settings.
- Incoming: every message on the weather channel from someone other than us is a
  weather report. The newest is shown as a hero card; older ones as a compact history.
- ZIP/location: free text (any non-empty value), since bots may respond to things other than ZIPs.

### Architecture
```
src/
  lib/hashtag.ts     name normalisation + key derivation        (pure, unit-tested)
  lib/weather.ts     request template, report parsing           (pure, unit-tested)
  lib/store.ts       persisted settings + message history       (unit-tested)
  lib/radio.ts       meshcore.js wrapper: connect, queue, sync, channels, contacts
  hooks/useMesh.ts   React state for connection/contacts/channels/messages
  components/        Header, TabBar, Onboarding, Messages, Weather, Network, Settings, Icons
public/              manifest, sw.js, icons
```
Stack: Vite + React 19 + TypeScript, Vitest (unit), Playwright (e2e), GitHub Pages deploy.

### Information architecture (4 tabs)
| Tab | Asset-pack icon | Contents |
| --- | --- | --- |
| Messages | "Space Messages" (chat bubbles with alien eyes) | Channels + Direct, thread view |
| Weather | (new — ringed planet + cloud in the same style) | Hero report card, "Request" button, history |
| Network | "Network — Synaptic Mesh" (star / planet nodes) | Heard nodes, send advert |
| Settings | "Shuttle Settings" (gear + saucer) | Profile, Weather, Device, Radio (read-only) |

Header: UFO mascot crest + "Galaxy Core" brand + node name + one status dot (In-System / System Down / Warning from the pack).

### Responsive rules
- `< 900 px`: bottom tab bar, one pane, thread opens full-screen with back button.
- `≥ 900 px`: left rail nav, two-pane Messages (list + thread), content max-width.
- Fluid type with `clamp()`, `100dvh`, `env(safe-area-inset-*)`, `prefers-reduced-motion`.

### Theme tokens
`--void #121a3a` · `--void-deep #070b1f` · `--hull #efe2c0` (parchment) · `--slime #7cc242` · `--flare #f5b53d`
· `--nebula #7a4bc0` · `--teal #2f9c96` · `--ember #d8432c` · `--ink #1b130c` · status `--ok #3ddc4a` `--bad #ff3b30` `--warn #f5c518`.
Parchment panels (`.card`, `.sheet`, lists, …) locally override `--text`/`--muted`/`--line`/`--accent` so text flips to ink-on-paper.
Title font: **Bungee** (chunky retro display face, `@fontsource/bungee`) for brand and headings.
Display font: **Oswald 600/700**, self-hosted via `@fontsource/oswald` (bundled + cached by the service worker — no CDN, works offline, consistent on iOS/Android).

---

## 🐠 Goldfish — task cards

Status: ✅ all cards complete for v1.0.

| # | Card | Done when |
| --- | --- | --- |
| G1 | Scaffold Vite/React/TS, configs, scripts | `npm run build` succeeds |
| G2 | `hashtag.ts` — normalise `Weather`→`#weather`, derive key | Vitest proves key = SHA-256 prefix |
| G3 | `weather.ts` — template fill, report parsing | Vitest cases pass |
| G4 | `store.ts` — settings + capped message history in localStorage | Vitest round-trip passes |
| G5 | `radio.ts` — BLE/Serial connect, command queue, contacts, channels, `ensureHashtagChannel`, message drain | Type-checks |
| G6 | ~~`demo.ts` — in-memory radio~~ (removed) | — |
| G7 | `useMesh` hook — state + actions | App compiles |
| G8 | Theme + icons (SVG recreations of the asset pack) + PWA icons | Lighthouse-installable manifest; icons render |
| G9 | Onboarding: Welcome → ZIP → weather channel | First run asks; values persisted; skippable later via Settings |
| G10 | Messages tab (channels/direct, thread, composer) | Send/receive |
| G11 | Weather tab (hero card, request, history, empty states) | ZIP request → bot reply visible |
| G12 | Network + Settings tabs | Advert, edit zip/channel/template (node name comes from the radio) |
| G13 | Service worker + install prompt | Loads offline after first visit |
| G14 | Responsive pass (320 / 390 / 768 / 1280) + Playwright e2e | Screenshots clean, tests green |
| G15 | README, GitHub Pages workflow, publish | Repo pushed, Pages builds |

### Lessons fed back into the Elephant
- `Impact` is not installed on Android/iOS, so the theme font must be self-hosted.
- Grid tracks need `minmax(0, 1fr)` or long labels push the 4-tab bar past 320 px.
- The weather badge must clear while the Weather tab is visible.
- The bot request format sits under **Advanced** so the default flow stays two fields.
