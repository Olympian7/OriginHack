const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const env = require('../config/env');
const HttpError = require('../utils/http-error');

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const audioDir = path.join(process.cwd(), 'storage', 'audio');

async function textToSpeech(text) {
  const endpoint = `${ELEVENLABS_BASE_URL}/text-to-speech/${env.elevenLabsVoiceId}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': env.elevenLabsApiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    let detail = 'TTS request failed';
    try {
      const errorJson = await response.json();
      detail = errorJson?.detail?.message || errorJson?.detail || detail;
    } catch {
      detail = await response.text();
    }
    throw new HttpError(response.status, `ElevenLabs error: ${detail}`);
  }

  const audioArrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(audioArrayBuffer);

  await fs.mkdir(audioDir, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.mp3`;
  const filePath = path.join(audioDir, fileName);

  await fs.writeFile(filePath, buffer);

  return {
    buffer,
    fileName,
    filePath,
    relativeUrl: `/audio/${fileName}`
  };
}

module.exports = {
  textToSpeech
};
