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
npx vite

# Build for production (static files only)
# No build step initially required
```

## Architecture

The application follows a simple static web app structure:

- `index.html` - Main UI with drag-and-drop file upload
- `app.js` - Transcription logic using Transformers.js Whisper
- `styles.css` - Responsive styling
- `sw.js` - Service worker for offline support and model caching
- `manifest.json` - PWA manifest for installation

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
