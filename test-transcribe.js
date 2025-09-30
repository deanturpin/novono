#!/usr/bin/env node

import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';

// Test transcription with a local audio file
async function testTranscription(audioFilePath) {
    console.log('Loading Whisper model...');

    const transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
            progress_callback: (progress) => {
                if (progress.status === 'downloading') {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    process.stdout.write(`\rDownloading model: ${percent}%`);
                }
                if (progress.status === 'done') {
                    console.log('\nModel loaded!');
                }
            }
        }
    );

    console.log('Processing audio file...');
    const audioData = readFileSync(audioFilePath);

    console.log('Transcribing...');
    const output = await transcriber(audioData);

    console.log('\n=== Transcription ===');
    console.log(output.text);
    console.log('====================\n');
}

// Get audio file from command line argument
const audioFile = process.argv[2];

if (!audioFile) {
    console.error('Usage: node test-transcribe.js <audio-file.mp3>');
    process.exit(1);
}

testTranscription(audioFile).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
