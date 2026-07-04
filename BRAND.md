# MoveThisOut — Brand Guidelines v2

**Positioning:** Kamloops-first on-demand moving — calm, trustworthy, map-led (Uber × Dolly), not billboard/industrial.

**Launch market:** Kamloops, BC — with Merritt & Salmon Arm in service area

**Brand name:** **MoveThisOut** (display as **MoveThisOut · Kamloops** in product UI)

---

## 1. Design principles

| Was (v1) | Now (v2) |
|----------|----------|
| Orange/black everywhere | White/gray surfaces, orange **accent only** |
| 3px black borders + hard shadows | 1px subtle borders, soft elevation |
| ALL CAPS Anton headlines | Sentence case, Inter/Barlow, weight not volume |
| Hazard stripes | Removed from product UI (marketing only if needed) |
| Boxy cards (`card-yard`) | Rounded cards (`rounded-2xl`), breathing room |
| Form-first booking | **Map-first** + bottom sheet (Uber pattern) |

**Reference apps:** Uber (map + sheet), Dolly (upfront price, helper tracking), not U-Haul/Skip billboard.

---

## 2. Color palette

### Core
| Token | Hex | Use |
|-------|-----|-----|
| `ink` | `#1A1A1A` | Primary text |
| `ink-muted` | `#6B7280` | Secondary text |
| `surface` | `#FFFFFF` | Cards, sheets |
| `surface-muted` | `#F5F5F7` | Page background |
| `border` | `#E5E7EB` | Dividers, inputs |
| `accent` | `#E85D04` | Primary CTA (softer orange) |
| `accent-hover` | `#D45303` | CTA hover |
| `accent-soft` | `#FFF4ED` | Tinted highlights |

### Portal accents (subtle differentiation)
| Portal | Header | Feel |
|--------|--------|------|
| **Customer** | White + accent logo | Light, friendly, map home |
| **Mover** | `#1E293B` slate | Driver app — focused, dark header |
| **Admin** | `#FAFAFA` + sidebar | Operations desk — neutral, data-first |

Legacy tokens (`haul`, `jet`, `caution`) remain in code during migration but should not be used in new UI.

---

## 3. Typography

- **Primary:** Inter (UI, body, buttons)
- **Display:** Barlow SemiBold (headlines only — no forced uppercase)
- **Sizes:** 15px body, 13px labels, 22–28px page titles

**Don't:** Anton, hazard styling, `▸` arrows on every button, `price-hero` giant orange numbers except final quote.

---

## 4. Components

### Buttons
- Primary: `bg-accent text-white rounded-xl py-3.5 font-semibold shadow-sm`
- Secondary: white, gray border, no shadow stack
- No uppercase, no 3px black border

### Inputs
- `rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent/30`
- Labels: `text-sm font-medium text-gray-700` (not condensed caps)

### Cards
- `.card` → `bg-white rounded-2xl border border-gray-100 shadow-sm`
- `.card-elevated` → `shadow-md` for floating sheets

### Bottom sheet (booking)
- White, `rounded-t-3xl`, drag handle, sits over map
- Uber-style: map 60–70% viewport, sheet for addresses/schedule/price

---

## 5. User flows (target)

### Customer (requester)
```
Landing (map + "Where from?") → pin pickup/dropoff on map →
schedule + items (sheet) → upfront price → sign in if guest →
confirm → live track on map
```
**Home is not "just booking"** — map + recent moves + trust strip (insured, local, rated).

### Mover
```
Dark portal login → map/list job board → claim →
full-screen active job map → complete + payout
```
Separate from customer app visually (like Uber Driver).

### Admin
```
Desk login → sidebar ops → jobs map/GPS audit →
pricing, promos, mover approvals
```
No shared orange billboard header.

---

## 6. Logo & voice

- **Name:** MoveThisOut (or consider shorten to **MoveOut** for marketing — TBD)
- **Tagline:** *Local moves in Kamloops. Price upfront. Track live.*
- **Tone:** Clear, local, professional — not shouty
- **Kamloops:** Always mention city in hero, mover outreach, social proof

---

## 7. Rollout phases

| Phase | Work |
|-------|------|
| **A (done)** | Tokens, Button/Input, layouts, map landing, portal logins |
| **B (done)** | Full booking wizard as map + sheet (`MapBookingShell`) |
| **C (done)** | Mover job-board map (`JobsMap` on Request Center) |
| **D (done)** | Marketing sections on landing (`MarketingSections`) |

---

## 8. Files to update (engineering)

```
tailwind.config.js, src/index.css
src/components/ui/Button.tsx, Input.tsx
src/components/layout/*Layout.tsx
src/pages/public/LandingPage.tsx
src/pages/app/BookingWizardShell.tsx
src/pages/auth/* (portal logins)
src/components/maps/BookingMap.tsx (new)
```
