# Design System

This document defines the visual language, tokens, and patterns used across the easy-pm frontend. All design decisions flow from a single aesthetic direction: **warm editorial utility** — clean and productive, with enough warmth and character to feel intentionally designed rather than generically generated.

## Aesthetic Principles

1. **Warm over cool** — Stone and terracotta over slate and indigo. The palette should feel like paper and ink, not chrome and neon.
2. **Purposeful detail** — Every animation, icon, and spacing choice should serve comprehension or delight. Nothing decorative without function.
3. **Quiet confidence** — The UI should recede when you're working and reward attention when you look closely. Subtle textures, refined typography, considered hover states.

## Typography

| Role | Font | Weight | Size | Tracking |
|------|------|--------|------|----------|
| Brand logotype | Instrument Serif | 400 | 20px (`text-xl`) | tight |
| Page headings | Plus Jakarta Sans | 600 | 16px (`text-base`) | tight |
| Section labels | Plus Jakarta Sans | 600 | 10-11px | 0.08em (wide) |
| Card titles | Plus Jakarta Sans | 500 | 13px | normal |
| Body/inputs | Plus Jakarta Sans | 400 | 13-14px (`text-sm`) | normal |
| Metadata | Plus Jakarta Sans | 400 | 11px | normal |
| Badges/kbd | Plus Jakarta Sans | 600 | 10px | normal |

**Loading fonts** — Both families are loaded from Google Fonts with `display=swap` and preconnected origins for fast rendering. See `index.html`.

**CSS classes:**
- `.font-brand` — applies Instrument Serif (used only for the sidebar logotype)
- All other text uses Plus Jakarta Sans via the `body` font-family rule

## Colour Tokens

All colours are defined as CSS custom properties on `:root` and `.dark`, making theme switching a single class toggle on `<html>`.

### Accent

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent` | `#d4603a` | `#e8764f` | Primary actions, brand mark, active indicators |
| `--accent-hover` | `#c04e2a` | `#f08a65` | Hover state for accent elements |
| `--accent-subtle` | `#d4603a18` | `#e8764f12` | Background tint (selected items, empty state icons) |
| `--accent-muted` | `#d4603a30` | `#e8764f28` | Text selection highlight, loading spinner track |

### Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--surface-0` | `#faf9f7` | `#111110` | Page background, card backgrounds |
| `--surface-1` | `#ffffff` | `#1a1918` | Sidebar, header, modals, columns |
| `--surface-2` | `#f5f3f0` | `#222120` | Input backgrounds, badges, hover fills |
| `--surface-3` | `#ece9e4` | `#2c2b29` | Kbd elements, secondary badges |

### Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border` | `#e5e1db` | `#2c2b29` | Primary borders (sidebar, header, columns, modals) |
| `--border-subtle` | `#ece9e4` | `#222120` | Inner borders (column dividers, card borders) |

### Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | `#1c1917` | `#f5f5f4` | Headings, card titles, input values |
| `--text-secondary` | `#57534e` | `#a8a29e` | Body text, nav items, button labels |
| `--text-muted` | `#a8a29e` | `#78716c` | Metadata, section labels, placeholders |
| `--text-faint` | `#d6d3d1` | `#44403c` | Decorative text, disabled states, faint icons |

### Applying tokens

Tokens are applied via inline `style` attributes rather than Tailwind utility classes. This keeps theme switching clean — a single `.dark` class swap updates everything without needing `dark:` variants on every element.

```tsx
<div style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
```

Tailwind is still used for layout, spacing, and animation utilities.

## Animation

### Keyframes

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fadeIn` | 200ms | ease-out | Overlay backgrounds, generic reveals |
| `slideUp` | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Modal entrance, card stagger entrance |
| `slideDown` | 200ms | ease-out | Inline form reveals (new project/board/card) |
| `scaleIn` | 250ms | cubic-bezier(0.16, 1, 0.3, 1) | Search modal, column entrance |

The `cubic-bezier(0.16, 1, 0.3, 1)` curve is a spring-like ease-out that overshoots slightly for a tactile feel.

### Utility classes

| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Applies `fadeIn` |
| `.animate-slide-up` | Applies `slideUp` |
| `.animate-slide-down` | Applies `slideDown` |
| `.animate-scale-in` | Applies `scaleIn` |
| `.card-enter` | `slideUp` with `backwards` fill (for staggered delays) |
| `.overlay-enter` | `fadeIn` for modal overlays |
| `.btn-press` | `transform: scale(0.97)` on `:active` |

### Stagger pattern

Columns and cards use `animation-delay` based on their index for a staggered entrance:

```tsx
<div
  className="card-enter"
  style={{ animationDelay: `${index * 30}ms` }}
>
```

Columns use 50ms intervals, cards use 30ms.

## Spacing

The app uses a consistent spacing scale based on Tailwind's defaults:

| Context | Value | Tailwind |
|---------|-------|----------|
| Page padding | 24px | `p-6` |
| Header padding | 32px horizontal, 16px vertical | `px-8 py-4` |
| Sidebar padding | 20px horizontal | `px-5` |
| Column gap | 20px | `gap-5` |
| Card gap (within column) | 8px | `space-y-2` |
| Card inner padding | 12px | `p-3` |
| Modal inner padding | 24px | `p-6` |
| Form field gap | 16px | `gap-4` |

## Components

### Cards

- Background: `--surface-0` with `--border-subtle` border
- Hover: `-translate-y-0.5` lift + `shadow-md`
- Labels displayed as coloured chips above the title
- Metadata row with inline SVG icons (calendar, clock, text)
- Staggered entrance via `card-enter` class

### Columns

- Background: `--surface-1` with `--border` border
- Fixed width: `w-72` (288px)
- Header with name, count badge, and delete button
- Custom thin scrollbar on card list (`.column-cards`)
- Footer area for "Add card" action

### Modals (CardDetail, SearchBar)

- Overlay: `rgba(0,0,0,0.4)` with `backdrop-blur(4px)` (card detail) or `backdrop-blur(8px)` (search)
- Container: `--surface-1` background, `--border` border, `rounded-2xl`, `shadow-2xl`
- Card detail has a 4px accent-coloured bar at the top
- Search modal positioned at 18vh from top
- Both close on Escape and click-outside

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `--accent` background, white text, `btn-press` |
| Secondary/Cancel | No background, `--text-secondary` colour |
| Danger | `#ef4444` text, underline on hover |
| Ghost (sidebar +) | Icon only, `hover:scale-110` |
| Add card/column | `--text-muted` colour, plus icon rotates 90deg on hover |

### Inputs

- Background: `--surface-2`
- Border: `--border` (default), `--accent` (focused/active new-item forms), `#ef4444` (error)
- Text: `--text-primary`
- Rounded: `rounded-lg` (8px) for form fields, `rounded-md` (6px) for sidebar inline inputs

### Labels

Labels use their stored `colour` value with transparency for backgrounds:

```tsx
style={{ backgroundColor: label.colour + "20", color: label.colour }}
```

Selected state in the card detail modal uses `border-2` with the label colour. Unselected uses `--border` border and `--text-muted` text.

## Texture & Depth

- `.surface-texture` — Applies a subtle SVG noise pattern via `::before` pseudo-element at 2.5% opacity (4% in dark mode). Used on the sidebar.
- `::selection` — Uses `--accent-muted` background for a cohesive feel when selecting text.
- Modals use `shadow-2xl` for dramatic elevation.
- Cards use `shadow-md` only on hover, keeping the resting state flat.

## Iconography

All icons are inline SVGs from a Heroicons-style set (24x24 viewBox, stroke-based). Sizes:

| Context | Size |
|---------|------|
| Theme toggle, sidebar nav | `w-4 h-4` |
| Card metadata | `w-3 h-3` |
| Add buttons (plus icon) | `w-3.5 h-3.5` |
| Search icon | `w-4.5 h-4.5` |
| Empty state | `w-7 h-7` |
| Close/delete (column) | `w-3.5 h-3.5` |

## Dark Mode

Dark mode is toggled by adding/removing the `.dark` class on `<html>`. The Tailwind dark variant is configured as:

```css
@variant dark (&:where(.dark, .dark *));
```

Theme preference is persisted to `localStorage` under the key `"theme"` and falls back to `prefers-color-scheme` on first visit.

Because colours are driven by CSS custom properties, the `.dark` selector only needs to redefine the token values — no `dark:` utility classes are needed on individual elements.

## Date & Number Formatting

- Due dates display in British short format: `28 Feb`, `3 Mar` (via `toLocaleDateString("en-GB", { day: "numeric", month: "short" })`)
- Time estimates display as human-readable: `30m`, `1h`, `1h 30m`
- Card counts in header: `{n} cards`
- Column counts in badge: just the number
