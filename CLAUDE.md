# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

novono is a voice note transcription Progressive Web App that runs entirely in the browser. Audio files never leave the user's device - transcription is performed client-side using Transformers.js running Whisper via WebAssembly.

## Tech Stack

- Vanilla HTML/CSS/JS (no framework)
- Transformers.js with Whisper model (tiny/base variants)
- PWA with service worker for offline capability
- Static hosting (Vercel/Netlify/GitHub Pages)

## Development Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Test transcription with audio file (Node.js, no browser)
npm test audio-file.mp3

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

The application follows a simple static web app structure:

- `docs/index.html` - Main UI with drag-and-drop file upload
- `docs/app.js` - Transcription logic using Transformers.js Whisper
- `docs/styles.css` - Responsive styling
- `docs/sw.js` - Service worker for offline support and model caching (not yet implemented)
- `docs/manifest.json` - PWA manifest for installation (not yet implemented)
- `test-transcribe.js` - Node.js test script for automated transcription testing

### Key Implementation Details

**Transcription Flow**:
1. User drops audio file (m4a, ogg, mp3, wav)
2. File processed by Whisper model in browser
3. Model downloads once (~40-150MB) then cached locally
4. Progress displayed during model download and transcription
5. Results shown with copy-to-clipboard functionality

**Offline-First Design**:
- Service worker caches app shell and Whisper model files
- All processing happens client-side
- No backend, no API keys, no user accounts

## File Handling

Supported audio formats: m4a (WhatsApp), ogg, mp3, wav
