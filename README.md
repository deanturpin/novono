# novono

Voice note transcription PWA - because nobody wants to listen to long voice notes.

## Key Features

- **Offline-first**: Transcription runs entirely in your browser
- **Private**: Audio never leaves your device
- **No accounts**: No sign-up, no API keys, no cost
- **PWA**: Install on mobile home screen, works like a native app
- **Free**: No API costs, no subscriptions

## How It Works

1. Save voice note from WhatsApp to your device
2. Open novono (web app or installed PWA)
3. Drop audio file in
4. Get transcription
5. Copy or share result

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (keep it simple)
- **Transcription**: Transformers.js (Whisper running in browser via WebAssembly)
- **Model**: Whisper tiny/base (~40-150MB, downloads once and caches)
- **Hosting**: Static site (Vercel/Netlify/GitHub Pages)
- **PWA**: Service worker for offline capability and model caching


## Implementation Steps

1. **Set up basic UI**
   - File upload (drag-and-drop + file picker)
   - Loading/progress indicator
   - Transcription display area
   - Copy to clipboard button

2. **Integrate Transformers.js**
   - Import Whisper model
   - Handle audio file processing
   - Display progress during model download
   - Show transcription progress

3. **Add PWA features**
   - Create manifest.json (icons, name, colours)
   - Service worker for offline support
   - Cache model files locally
   - Install prompt

4. **Polish**
   - Responsive design (mobile + desktop)
   - Error handling
   - Supported audio formats (m4a, ogg, mp3, wav)
   - Dark mode optional

## Live Demo

**https://deanturpin.github.io/novono/**

## Development

```bash
# Install dependencies
npm install

# Run local dev server
make serve
# or: npm run dev

# Build for production
npm run build

# Deploy (auto-commits and pushes)
make deploy
```

## Deployment

Deployed to GitHub Pages via GitHub Actions. Every push to `main` triggers a build and deploy.

## Future Features

### Smart Features (No AI Required)
- **Offline summary/actions** - Extract key points using text analysis, not AI:
  - Detect questions (ends with "?")
  - Find times/dates mentioned
  - Identify phone numbers, emails, addresses
  - Highlight action words ("call", "meet", "send", "buy", etc.)
  - Show word frequency for main topics
  - Simple bullet-point extraction

### AI-Enhanced Features (Optional)
- Summarisation (add small LLM)
- Extract action items
- Multiple languages
- Export formats (plain text, markdown, bullets)
- Audio playback with transcript highlighting
