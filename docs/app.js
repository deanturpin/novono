import { pipeline, env } from '@xenova/transformers';

// Configure to use HuggingFace CDN for models
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

// UI elements
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

// Initialize the transcription pipeline
async function loadModel() {
    if (transcriber) return transcriber;

    statusText.textContent = 'Loading Whisper model (first time only)...';
    status.classList.remove('hidden');

    try {
        transcriber = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny.en',
            {
                quantized: false,
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
                    }
                }
            }
        );
        return transcriber;
    } catch (error) {
        console.error('Error loading model:', error);
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

        // Load model
        const model = await loadModel();

        // Read audio file
        statusText.textContent = 'Processing audio...';
        progressBar.style.width = '100%';

        const audioData = await file.arrayBuffer();

        // Transcribe
        statusText.textContent = 'Transcribing...';
        const output = await model(audioData);

        // Display result
        status.classList.add('hidden');
        result.classList.remove('hidden');
        transcription.textContent = output.text;

    } catch (error) {
        console.error('Transcription error:', error);
        status.classList.add('hidden');
        alert('Error transcribing audio. Please try again.');
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
