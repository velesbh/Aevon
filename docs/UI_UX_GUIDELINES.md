# Aevon - UI/UX Guidelines

## 1. Design Philosophy
Aevon's interface must feel premium, professional, and mature. It should fade into the background, allowing the user's content (their manuscript and world-building) to take center stage. 
**Strict Avoidances:** No harsh gradients, no sharp square edges (unless stylistically intentional for specific layout borders), no cringe "gamified" UI elements. 

## 2. Color Palette
The theme is strictly **Monochrome base with small hints of green** for success states, primary actions, and brand accents.

### Light Theme
- **Background (App):** `#FAFAFA` (Very Light Gray)
- **Background (Surface/Cards):** `#FFFFFF` (White)
- **Text (Primary):** `#111827` (Deep Gray/Black)
- **Text (Secondary):** `#6B7280` (Muted Gray)
- **Border:** `#E5E7EB`
- **Primary Brand/Accent:** `#10B981` (Emerald Green)
- **Accent Hover:** `#059669`
- **Error:** `#EF4444`

### Dark Theme (Requires Toggle)
- **Background (App):** `#0F1115` (Deep Charcoal)
- **Background (Surface/Cards):** `#181A20` (Dark Gray)
- **Text (Primary):** `#F9FAFB` (Off-White)
- **Text (Secondary):** `#9CA3AF` (Muted Gray)
- **Border:** `#272A30`
- **Primary Brand/Accent:** `#10B981` (Emerald Green) - kept bright for contrast.
- **Accent Hover:** `#34D399`

## 3. Typography
- **Primary UI Font:** `Inter` or `Geist` - Clean, highly legible sans-serif for dashboard and UI elements.
- **Manuscript/Editor Font:** Configurable by user, but defaults to a premium serif like `Merriweather` or `Literata` for a classic reading/writing experience, or `JetBrains Mono` for typewriter aesthetics.

## 4. Component Geometry & Structure
- **Corner Radius:** Soft, approachable curves. Use `0.5rem` (8px) for buttons/inputs, and `0.75rem` (12px) or `1rem` (16px) for larger cards and modals. Avoid rigid `0px` squares.
- **Shadows:** Soft, diffused drop shadows. Heavy, harsh shadows are prohibited. In dark mode, rely on subtle borders rather than shadows for depth.
- **Iconography:** Heavy reliance on clean, line-based SVG icons (e.g., Lucide Icons or Phosphor Icons). Icons should have a consistent stroke width (usually 1.5px or 2px).

## 5. Animations & Micro-interactions
- **Rule:** Animations strictly on user actions (click, hover, focus, drag). **Zero idle animations** (no bouncing buttons, no continuous pulsing).
- **Transitions:** Use quick, snappy transitions. 
  - Standard duration: `150ms` or `200ms`.
  - Easing: `ease-out` for entering elements, `ease-in` for exiting.
- **Interactions:** Subtle background color changes on hover for list items, gentle scale down (`scale: 0.98`) on button active/press state.

## 6. Responsiveness & Dynamic Sizing
- Fluid layouts utilizing CSS Grid and Flexbox.
- **Editor:** Text size should utilize `clamp()` functions so it feels natural on an iPad, a small laptop, and a large ultrawide monitor without requiring manual zoom adjustments.
- **Mobile Experience:** The world-building and heavy editing features may degrade gracefully to "read-only" or simplified inputs on mobile, while the dashboard and quick-notes remain fully functional.
