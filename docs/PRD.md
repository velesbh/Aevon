# Aevon - Product Requirements Document (PRD)

## 1. Product Overview
**Name:** Aevon
**Company:** Enzonic LLC (Kentucky)
**Contact:** admin@enzonic.com
**Vision:** To provide a premium, seamless, and intuitive writing and world-building platform for authors. 

## 2. Target Audience
- Professional novelists and authors.
- Hobbyist writers looking for structured planning tools.
- Screenwriters and game narrative designers needing deep world-building.

## 3. Core Features
### 3.1. User Onboarding
- **Welcome Flow:** Step-by-step interactive wizard.
- **Story Setup:** Guides users through defining their first project's genre, tone, and core premise.
- **Accessibility:** Highly visual, jargon-free, and welcoming for non-tech-savvy users.

### 3.2. Dashboard
- **Overview:** At-a-glance metrics (word count progress, writing streaks).
- **Recent Work:** Quick access to recently edited chapters and world-building nodes.
- **Activity Feed:** Dynamic timeline of project changes and milestones.

### 3.3. Manuscript Editor
- **Distraction-Free Focus Mode:** Clean, edge-to-edge text editor.
- **Auto-Save & Version Control:** Real-time saving with snapshot history.
- **Formatting:** Standard manuscript formatting options with dynamic sizing based on viewport.

### 3.4. Asset & File Manager
- **Storage:** 32GB quota per user.
- **Supported Types:** Images (maps, character references), PDFs, audio.
- **Organization:** Tag-based and folder-based structuring.

### 3.5. World-Building Suite
- **Interactive Maps:** Upload map images and drop interactive pins linking to locations/chapters.
- **Relationship Trees:** Visual node-based graphing of character connections.
- **Locations & Lore:** Dedicated database for world rules, magic systems, and history.

### 3.6. Export Tool
- **Formats:** PDF, EPUB, DOCX, and standard manuscript format (Vellum-compatible).
- **Customization:** Configurable front/back matter, typography, and chapter headers.

## 4. "Surprise Me" - $1B Startup Features
To elevate Aevon to a top-tier platform, the following innovative features are proposed:
- **Semantic Continuity Engine (AI-Assisted):** Quietly analyzes text to flag continuity errors (e.g., "John was in London in Chapter 3, but is now in New York on the same day").
- **Dynamic Chronology Timeline:** Automatically builds a visual timeline of events as the user writes, extracting dates and events from the manuscript.
- **Immersive Soundscapes:** Integrated ambient noise generator (rain, cafe, fantasy tavern) synced to the user's focus mode.
- **"Living" Character Profiles:** Profiles that automatically update with "last seen" or "current status" based on the latest written chapter.
- **Collaborative/Beta Reader Mode:** Secure sharing links where beta readers can leave inline reactions (like Soundcloud timed comments) without altering the text.

## 5. Technical Stack
- **Frontend Framework:** Next.js (App Router, React 18+).
- **Styling:** Tailwind CSS + Radix UI (headless components for accessible, unstyled primitives).
- **State Management:** Zustand (for complex editor state) & React Query (for server state).
- **Backend/Database:** Supabase (PostgreSQL).
- **Storage:** Supabase Storage (S3 API compatible) for handling the 32GB file quota.
- **Hosting:** Vercel (Frontend & Edge Functions).

## 6. User Flows
1. **Registration:** User signs up -> Verify email -> Enters Onboarding Wizard.
2. **Project Creation:** User clicks "New Project" -> Selects Template/Blank -> Configures Title/Genre -> lands on Project Dashboard.
3. **Writing Session:** Dashboard -> Opens Manuscript -> Enters Focus Mode -> Writes -> Auto-saves -> Exits to Dashboard.
4. **World Building:** Navigates to "Universe" -> Opens "Character Tree" -> Creates new character node -> Links to existing location.
