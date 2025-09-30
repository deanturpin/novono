import { pipeline, env } from '@xenova/transformers';

// Configure to use HuggingFace CDN for models
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

// Use custom model cache location
env.cacheDir = './.cache';

// UI elements
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const testBtn = document.getElementById('testBtn');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const result = document.getElementById('result');
const transcription = document.getElementById('transcription');
const copyBtn = document.getElementById('copyBtn');

// Model instance (cached after first load)
let transcriber = null;
let modelReady = false;

// Initialize the transcription pipeline
async function loadModel() {
    if (transcriber) return transcriber;

    statusText.textContent = 'Loading Whisper model (first time only)...';
    status.classList.remove('hidden');

    try {
        // Try with whisper-tiny (not .en specific) which is more widely available
        transcriber = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny',
            {
                revision: 'main',
                quantized: true,  // Use quantized for smaller download
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
        progressBar.style.width = '50%';

        // Read file as URL for the model
        const url = URL.createObjectURL(file);

        // Transcribe
        statusText.textContent = 'Transcribing...';
        progressBar.style.width = '75%';

        const output = await model(url);

        // Clean up
        URL.revokeObjectURL(url);

        // Display result
        progressBar.style.width = '100%';
        status.classList.add('hidden');
        result.classList.remove('hidden');
        transcription.textContent = output.text;

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

// Download model button
downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';

    downloadSection.style.display = 'block';
    status.classList.remove('hidden');

    try {
        await loadModel();
        modelReady = true;

        // Hide download section, show drop zone
        downloadSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
        status.classList.add('hidden');

    } catch (error) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download Model';
        status.classList.add('hidden');
    }
});

// Test with sample audio button
testBtn.addEventListener('click', async () => {
    try {
        // Fetch one of the test samples
        const response = await fetch('../test-samples/sample1.wav');
        const blob = await response.blob();
        const file = new File([blob], 'sample1.wav', { type: 'audio/wav' });

        await transcribeAudio(file);
    } catch (error) {
        console.error('Error loading test audio:', error);
        alert('Could not load test audio file');
    }
});
