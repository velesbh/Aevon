# Aevon - Writing & World-Building Platform

Aevon is a premium, seamless, and intuitive writing and world-building platform for authors. It offers a suite of intelligent, interconnected tools that handle the heavy lifting of continuity, planning, and organization, allowing authors to focus purely on their craft.

## Features

- **Manuscript Editor**: Distraction-free focus mode with real-time saving and version control.
- **World-Building Suite**: Interactive maps, relationship trees, and a dedicated database for locations, lore, and characters.
- **Asset & File Manager**: Tag-based and folder-based structuring for images, PDFs, and audio references.
- **Export Tool**: Export manuscripts to PDF, EPUB, DOCX, and standard manuscript formats.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Radix UI, Zustand
- **Backend**: Supabase (PostgreSQL, Storage)
- **Deployment**: Vercel

## Getting Started

First, install the dependencies:

```bash
npm install
```

Set up your `.env.local` according to the required environment variables. See `docs/SUPABASE_SETUP.md` for instructions on setting up your Supabase backend.

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Desktop & Mobile Apps (Tauri)

Aevon also includes desktop and mobile versions built with [Tauri](https://tauri.app/).

Check the `desktop/` and `mobile/` directories for their specific setup and build instructions. You can find architecture details in `docs/DESKTOP_ARCHITECTURE.md`.

## Development Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the Next.js application for production.
- `npm run lint`: Runs ESLint checks.
- `node scripts/check-translations.mjs`: Verifies translation consistency across supported languages.

## Documentation

- **PRD**: [`docs/PRD.md`](docs/PRD.md)
- **Architecture**: [`docs/DESKTOP_ARCHITECTURE.md`](docs/DESKTOP_ARCHITECTURE.md)
- **Supabase Setup**: [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)
- **UI/UX Guidelines**: [`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md)

## License

This software is provided under a custom non-commercial license.

Copyright (c) 2026 Enzonic LLC. All rights reserved.

You are permitted to use, copy, and modify this software for **non-commercial usage only**. Any modifications must include clear **attribution** to the original author (Enzonic LLC). Commercial use is strictly prohibited. 

For the exact terms, please refer to the [`LICENSE`](LICENSE) file in this repository.
