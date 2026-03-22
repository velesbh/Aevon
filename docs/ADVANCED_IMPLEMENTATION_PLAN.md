# ADVANCED IMPLEMENTATION PLAN ("The Bible")

This document outlines the architectural and implementation strategy for the massive series of changes requested by the user. The plan is broken down into modular phases, targeting specific systems, components, and state management strategies.

---

## 🏗️ Phase 1: Layout & Core Navigation Overhaul

**Goal:** Fix layout inefficiencies, optimize space usage, and correct navigation bugs.

1. **Header Refactor**
   - **Action:** Remove the "AEVON" header text.
   - **Action:** Reduce header height/padding globally across all pages to maximize workspace area.
   - **Files:** `src/components/header.tsx`, `src/app/dashboard/layout.tsx`.

2. **Sidebar & Projects Navigation**
   - **Action:** Remove "Projects" from the main sidebar.
   - **Action:** Implement a top-level Project Switcher (Dropdown/Combobox) in the header or at the very top of the sidebar.
   - **Action:** Fix the bug where "Dashboard" is always selected in the sidebar (likely an active route matching bug).
   - **Action:** Fix the Theme Toggle sizing in the sidebar to match other items.
   - **Files:** `src/components/dashboard/sidebar.tsx`, `src/components/dashboard/theme-toggle.tsx`, `src/app/dashboard/layout.tsx`.

---

## ⚡ Phase 2: Live Sync & State Management (The "Live App")

**Goal:** Move away from constant refreshing, introduce real-time sync, and ensure 100% reliable autosaving.

1. **Supabase Realtime Integration**
   - **Action:** Subscribe to Supabase Postgres Changes for all major entities (characters, lore, manuscript, locations, etc.).
   - **Strategy:** Use `supabase.channel()` to listen for `INSERT`, `UPDATE`, and `DELETE`.
   - **State Manager:** Update the global Zustand store (`src/lib/store.ts`) immediately upon receiving realtime payloads, ensuring the UI reflects changes instantly without refresh.

2. **Quick Sketchpad Autosaving**
   - **Action:** Implement a robust debounce autosave (e.g., `useDebounce` hook with a 1-2s delay).
   - **Action:** Add dirty-state tracking. If the user attempts to close/navigate away while dirty, either force a synchronous save or warn the user.
   - **Action:** Implement optimistic UI updates with offline-queueing if network fails, guaranteeing 0 data loss.

---

## 📝 Phase 3: The Universal Rich Text & "@" Mentions Engine

**Goal:** Make Tiptap ubiquitous and supercharge the `@` mentions feature.

1. **Universal Tiptap Application**
   - **Action:** Replace *all* standard `<textarea>` and `<input type="text">` elements (where appropriate for long-form text) with the `RichTextEditor` component.
   - **Files:** All entity creation/edit forms (Lore, Characters, Items, Maps).

2. **Enhanced "@" Mentions Component**
   - **Action:** Upgrade the Mention node in Tiptap to render a specialized React component instead of raw text.
   - **Features:** 
     - Add an Avatar/Image icon next to the mentioned entity's name.
     - Implement a Hover Card (e.g., `@radix-ui/react-hover-card`) that triggers on hover to fetch and display quick details (thumbnail, short description, tags).
   - **Files:** `src/components/rich-text/mention-suggestion.tsx`, `src/components/rich-text/rich-text-editor.tsx`.

---

## 📖 Phase 4: Manuscript & Theming Experience

**Goal:** Provide a "real book editor" feel and fix the global theming.

1. **Manuscript Editor Overhaul**
   - **Action:** Restyle the Manuscript view to emulate a page-based layout (like Google Docs or Scrivener).
   - **Features:** Centered page container, page-break support, typography focus (serif fonts, proper line height, indents).
   - **Files:** `src/app/dashboard/manuscript/page.tsx`.

2. **Global Theming Revamp**
   - **Action:** Audit and overhaul CSS variables (`globals.css`). The user stated "theming sucks".
   - **Action:** Implement more cohesive color palettes for both Light and Dark modes. Ensure contrast, semantic token usage, and a premium aesthetic.

---

## 🗺️ Phase 5: Advanced Entity Modules

**Goal:** Supercharge Maps, Lore, and Relationships.

1. **Maps Enhancement**
   - **Action:** Make the interactive map use maximum screen real estate (full height/width minus minimal header).
   - **Features:** Implement a Map Search feature (search for pins/locations). Add zoom controls and layers.
   - **Files:** `src/components/dashboard/maps/interactive-map.tsx`, `src/app/dashboard/maps/page.tsx`.

2. **Lore Diagrams**
   - **Action:** Convert "Lore Diagrams" into a primary, standalone entity type (not just a small attachment).
   - **Features:** Use `reactflow` to allow users to build node-based lore connections.

3. **Relationship Tree & NPC Framework**
   - **Action:** Upgrade the Relationship Tree to support categories/edge types (e.g., "Parent", "Sibling", "Enemy").
   - **Action:** Enable drag-and-drop repositioning of nodes.
   - **Action:** Introduce "NPCs" or "3rd place characters" (lightweight characters that don't need a full character sheet but exist in the relationship graph).
   - **Files:** `src/app/dashboard/relationships/page.tsx`.

4. **Bug Fix: Lore Editor Error**
   - **Action:** Fix `src/app/dashboard/lore/page.tsx (259:5) @ handleAttributeChange (setEntryDraft current error)`. Root cause is likely a state mutation on an undefined object or race condition in draft initialization.

---

## 📂 Phase 6: File Management System

**Goal:** Improve visibility into storage usage and asset browsing.

1. **Quota Display**
   - **Action:** Query the Supabase storage bucket for total user byte usage and display a progress bar (e.g., "450MB / 1GB Used").
2. **Asset Previews**
   - **Action:** In the File Manager, render grid-based thumbnail previews for image files and video thumbnails/players for video files instead of generic file icons.
   - **Files:** `src/app/dashboard/files/page.tsx`.

---

## 📤 Phase 7: Export Engine (The Bible & The Book)

**Goal:** Deliver two distinct, high-quality export pipelines.

1. **Export 1: "The Book" (Manuscript)**
   - **Action:** Export purely the narrative manuscript content into PDF/EPUB/DOCX, formatted strictly as a readable book.
2. **Export 2: "The WHOLE THING" (The Advanced Project Bible)**
   - **Action:** Generate a visually stunning master document.
   - **Features:** Includes Cover page, Table of Contents, Character Sheets (with images), Lore entries, Maps, and Items.
   - **Strategy:** Utilize a robust PDF generation library (e.g., `react-pdf` or a server-side Puppeteer/Playwright headless browser generation via Supabase Edge Functions) to handle complex layouts and images.
   - **Files:** `src/app/dashboard/export/page.tsx`, `supabase/functions/export-manuscript/index.ts`.

---

## 🌍 Phase 8: Internationalization (i18n) Completion

**Goal:** Ensure the Spanish mode translates the *entire* app, not just titles.

1. **Deep Translation Audit**
   - **Action:** Wrap all remaining hardcoded English strings in translation hooks (e.g., `t('key')`).
   - **Areas:** Placeholders, tooltips, error messages, empty states, and button labels.
   - **Files:** Ensure full coverage in dictionaries (e.g., `en.json`, `es.json`) and apply via `src/lib/i18n.tsx`.
