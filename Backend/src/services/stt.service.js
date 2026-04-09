const env = require('../config/env');
const HttpError = require('../utils/http-error');

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const REQUEST_TIMEOUT_MS = 8000;

async function transcribeAudioPlaceholder(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new HttpError(400, 'Invalid audio buffer for transcription');
  }

  return 'transcription result';
}

async function transcribeAudio(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new HttpError(400, 'Invalid audio buffer for transcription');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const formData = new FormData();
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('file', new Blob([buffer], { type: 'audio/wav' }), 'audio.wav');

  try {
    const response = await fetch(GROQ_STT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`
      },
      body: formData,
      signal: controller.signal
    });

    const payload = await response.json();

    if (!response.ok) {
      const apiMessage = payload?.error?.message || 'STT request failed';
      throw new HttpError(response.status, `Groq STT error: ${apiMessage}`);
    }

    const transcript = payload?.text?.trim();
    if (!transcript) {
      throw new HttpError(502, 'Transcription service returned empty text');
    }

    return transcript;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new HttpError(504, 'STT request timed out after 8 seconds');
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(500, `STT service error: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  transcribeAudioPlaceholder,
  transcribeAudio
};
