import { pipeline, env } from '@xenova/transformers';

// Configure to use HuggingFace CDN for models
env.allowRemoteModels = true;
env.allowLocalModels = false;

// Performance optimisations
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4; // Use all CPU cores

// Enable WebGPU for GPU acceleration (falls back to WASM if not available)
env.backends.onnx.webgpu = {
    preferredLayout: 'NHWC'
};

// UI elements
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const result = document.getElementById('result');
const transcription = document.getElementById('transcription');
const copyBtn = document.getElementById('copyBtn');

// Model instance (cached after first load)
let transcriber = null;
let modelReady = false;

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
        console.log('Service Worker registered');
    }).catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// Check if model is already cached on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Check localStorage for model version
    const modelVersion = localStorage.getItem('novono-model-version');
    const currentVersion = 'whisper-tiny-v1';  // Bump this when changing models

    // If different version, clear flag to re-download
    if (modelVersion !== currentVersion) {
        localStorage.removeItem('novono-model-downloaded');
        localStorage.setItem('novono-model-version', currentVersion);
    }

    const modelDownloaded = localStorage.getItem('novono-model-downloaded');

    if (modelDownloaded) {
        console.log('Model previously downloaded, skipping download screen');
        downloadSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
        modelReady = true;
    }

    // Check if this page load came from a share action
    if (window.location.search.includes('shared=true')) {
        console.log('App opened via share');
        // Retrieve and process the shared audio file
        handleSharedAudio();
    }
});

// Handle shared audio from share target
async function handleSharedAudio() {
    try {
        const cache = await caches.open('novono-v2');
        const response = await cache.match('shared-audio');

        if (response) {
            const blob = await response.blob();
            const file = new File([blob], 'shared-audio', { type: blob.type });

            // Delete the cached file
            await cache.delete('shared-audio');

            // Clear the URL parameter
            const url = new URL(window.location);
            url.searchParams.delete('shared');
            window.history.replaceState({}, '', url);

            // Wait for model to be ready, then transcribe
            if (!modelReady) {
                // Auto-download model if not ready
                downloadBtn.click();
                // Wait for model to be ready
                const checkReady = setInterval(() => {
                    if (modelReady) {
                        clearInterval(checkReady);
                        transcribeAudio(file);
                    }
                }, 1000);
            } else {
                transcribeAudio(file);
            }
        }
    } catch (error) {
        console.error('Error handling shared audio:', error);
    }
}

// Initialize the transcription pipeline
async function loadModel() {
    if (transcriber) return transcriber;

    statusText.textContent = 'Loading Whisper model (first time only)...';
    status.classList.remove('hidden');

    try {
        // Use whisper-tiny for speed - perfect for voice notes
        // Options: whisper-tiny (~39MB), whisper-base (~74MB), whisper-small (~244MB)
        transcriber = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny',
            {
                revision: 'main',
                quantized: true,  // Use quantized version
                progress_callback: (progress) => {
                    console.log('Progress:', progress);
                    if (progress.status === 'progress' && progress.progress) {
                        const percent = Math.round(progress.progress);
                        progressBar.style.width = `${percent}%`;
                        statusText.textContent = `Downloading model: ${percent}%`;
                    } else if (progress.status === 'downloading') {
                        statusText.textContent = 'Downloading model files...';
                    } else if (progress.status === 'done') {
                        statusText.textContent = 'Model loaded successfully!';
                    } else if (progress.status === 'initiate') {
                        statusText.textContent = `Loading ${progress.name}...`;
                    }
                }
            }
        );
        console.log('Model loaded successfully!');
        return transcriber;
    } catch (error) {
        console.error('Error loading model:', error);
        console.error('Error stack:', error.stack);
        statusText.textContent = `Error: ${error.message}. Check console for details.`;
        throw error;
    }
}

// Transcribe audio file
async function transcribeAudio(file) {
    try {
        result.classList.add('hidden');
        status.classList.remove('hidden');
        statusText.textContent = 'Loading model...';
        progressBar.style.width = '0%';

        // Ensure model is loaded
        if (!modelReady) {
            statusText.textContent = 'Model not ready. Please download it first.';
            setTimeout(() => {
                status.classList.add('hidden');
                downloadSection.classList.remove('hidden');
                dropZone.classList.add('hidden');
            }, 2000);
            return;
        }

        const model = await loadModel();

        // Read audio file
        statusText.textContent = 'Processing audio...';
        progressBar.style.width = '20%';

        // Read file as URL for the model
        const url = URL.createObjectURL(file);

        // Get audio duration first
        const audio = new Audio(url);
        await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', resolve);
        });
        const duration = Math.round(audio.duration);

        // Show result area immediately to display streaming transcription
        result.classList.remove('hidden');
        transcription.textContent = 'Transcribing...';

        statusText.textContent = `Transcribing ${duration}s audio...`;
        progressBar.style.width = '30%';

        // Start a progress animation since callback doesn't always fire reliably
        let simulatedProgress = 30;
        const progressInterval = setInterval(() => {
            if (simulatedProgress < 90) {
                simulatedProgress += 1;
                progressBar.style.width = `${simulatedProgress}%`;
            }
        }, (duration * 1000) / 60); // Increment based on audio duration

        const output = await model(url, {
            // Add options to prevent repetition and process longer audio
            chunk_length_s: 30,
            stride_length_s: 5,
            // Callback for streaming updates
            callback_function: (chunks) => {
                // Display partial results if available
                if (chunks && Array.isArray(chunks) && chunks.length > 0) {
                    const partialText = chunks.map(c => c.text || '').join(' ');
                    if (partialText) {
                        transcription.textContent = partialText;
                    }
                }
            }
        });

        // Stop progress animation
        clearInterval(progressInterval);

        // Clean up
        URL.revokeObjectURL(url);

        // Clean up repetitive text
        let text = output.text || '';

        // Detect and fix repetition (if the same phrase appears 5+ times)
        const phrases = text.match(/[^.!?]+[.!?]+/g) || [text];
        if (phrases.length > 5) {
            // Count phrase occurrences
            const counts = {};
            phrases.forEach(phrase => {
                const cleaned = phrase.trim();
                counts[cleaned] = (counts[cleaned] || 0) + 1;
            });

            // If any phrase repeats more than 5 times, it's likely a loop
            const maxCount = Math.max(...Object.values(counts));
            if (maxCount > 5) {
                // Keep only unique phrases
                const unique = [...new Set(phrases)];
                text = unique.join(' ') + ' [Note: Repetition detected and removed]';
            }
        }

        // Display result
        progressBar.style.width = '100%';
        status.classList.add('hidden');
        result.classList.remove('hidden');
        transcription.textContent = text;

    } catch (error) {
        console.error('Transcription error:', error);
        status.classList.add('hidden');
        alert(`Error transcribing audio: ${error.message}`);
    }
}

// File drop handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        transcribeAudio(file);
    } else {
        alert('Please drop an audio file');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        transcribeAudio(file);
    }
});

// Copy to clipboard
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(transcription.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
    }, 2000);
});

// PWA install prompt
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

function showInstallPrompt() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User installed the PWA');
            }
            deferredPrompt = null;
        });
    } else {
        // Fallback for iOS or if prompt not available
        alert('To install: tap Share → Add to Home Screen');
    }
}

// Download model button
downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';

    // Show status below button (status is now inside downloadSection)
    status.classList.remove('hidden');

    try {
        await loadModel();
        modelReady = true;

        // Save flag that model has been downloaded
        localStorage.setItem('novono-model-downloaded', 'true');

        // Hide download section, show drop zone
        downloadSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
        status.classList.add('hidden');

        // Installation prompt removed - too annoying!

    } catch (error) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download Model';
        status.classList.add('hidden');
    }
});

