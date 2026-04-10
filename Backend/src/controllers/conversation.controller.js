const conversationManager = require('../core/conversation.manager');
const { spawnSync } = require('child_process');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const sttService = require('../services/stt.service');
const ttsService = require('../services/tts.service');
const HttpError = require('../utils/http-error');
const siteData = require('../data/site-data');

function getChunkExtension(file) {
  const mimeType = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();

  if (mimeType.includes('webm') || originalName.endsWith('.webm')) {
    return 'webm';
  }

  if (mimeType.includes('ogg') || originalName.endsWith('.ogg')) {
    return 'ogg';
  }

  return 'wav';
}

function convertChunkToWav(file) {
  const tempDir = path.join(process.cwd(), 'storage', 'tmp');
  fs.mkdirSync(tempDir, { recursive: true });

  const extension = getChunkExtension(file);
  const token = `${Date.now()}-${randomUUID()}`;
  const inputPath = path.join(tempDir, `temp-${token}.${extension}`);
  const outputPath = path.join(tempDir, `temp-${token}.wav`);

  // NOTE:
  // This uses disk-based temp conversion.
  // For production, replace with streaming ffmpeg (pipe:0 -> pipe:1)
  try {
    fs.writeFileSync(inputPath, file.buffer);

    const ffmpegRun = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        inputPath,
        '-ar',
        '16000',
        '-ac',
        '1',
        '-acodec',
        'pcm_s16le',
        outputPath
      ],
      { encoding: 'utf8' }
    );

    if (ffmpegRun.error) {
      throw ffmpegRun.error;
    }

    if (ffmpegRun.status !== 0) {
      throw new Error(ffmpegRun.stderr || 'ffmpeg conversion failed');
    }

    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}

function getPublicAudioUrl(req, relativeUrl) {
  return `${req.protocol}://${req.get('host')}${relativeUrl}`;
}

async function handleTextConversation(req, res) {
  const { sessionId, message } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    throw new HttpError(400, 'sessionId is required and must be a string');
  }

  if (!message || typeof message !== 'string') {
    throw new HttpError(400, 'message is required and must be a string');
  }

  const reply = await conversationManager.respond(sessionId, message.trim());
  const speech = await ttsService.textToSpeech(reply);

  return res.json({
    reply,
    audioUrl: getPublicAudioUrl(req, speech.relativeUrl)
  });
}

async function handleAudioConversation(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'audio file is required' });
    }

    // Expected frontend:
    // MediaRecorder sending chunks as:
    // form-data key: "file"
    // format: webm or ogg
    // interval: 1-3 seconds
    const file = req.file;
    console.log({
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname
    });

    if (!req.body.sessionId || typeof req.body.sessionId !== 'string') {
      return res
        .status(400)
        .json({ error: 'sessionId is required and must be a string' });
    }

    const sessionId = req.body.sessionId;
    const audioBuffer = file.buffer;

    if (!audioBuffer || !audioBuffer.length) {
      return res
        .status(400)
        .json({ error: 'invalid or unsupported audio format' });
    }

    console.log('Buffer size:', audioBuffer.length);

    const mimeType = (file.mimetype || '').toLowerCase();
    const originalName = (file.originalname || '').toLowerCase();

    if (
      !mimeType.includes('wav') &&
      !mimeType.includes('webm') &&
      !mimeType.includes('ogg') &&
      !originalName.endsWith('.wav') &&
      !originalName.endsWith('.webm') &&
      !originalName.endsWith('.ogg')
    ) {
      return res.status(400).json({
        error: 'unsupported audio format'
      });
    }

    const isWav =
      mimeType.includes('wav') ||
      originalName.endsWith('.wav');
    console.log('Incoming type:', file.mimetype);
    console.log('Converted to WAV:', !isWav);

    let finalBuffer;
    if (isWav) {
      finalBuffer = audioBuffer;
    } else {
      try {
        finalBuffer = convertChunkToWav(file);
      } catch (err) {
        return res.status(500).json({
          error: 'Audio conversion failed',
          details: err.message
        });
      }
    }

    if (env.debugSaveAudio) {
      fs.writeFileSync(path.join(process.cwd(), 'debug.wav'), finalBuffer);
      console.log('Saved debug.wav');
    }

    let transcript;
    try {
      if (env.sttPlaceholder) {
        console.log('Using STT PLACEHOLDER');
        transcript = await sttService.transcribeAudioPlaceholder(finalBuffer);
      } else {
        console.log('Using REAL STT');
        transcript = await sttService.transcribeAudio(finalBuffer);
      }
    } catch (err) {
      console.error('STT ERROR:', err.message);
      transcript = '';
    }

    console.log('Transcript:', transcript);

    let reply;
    try {
      const safeInput = (transcript || '').trim() || 'Please continue the conversation with a short greeting.';
      reply = await conversationManager.respond(sessionId, safeInput);
    } catch (err) {
      console.error('LLM ERROR:', err.message);
      reply = 'I am sorry, I had trouble processing that. Please try again.';
    }

    let audioUrl = null;
    try {
      const speech = await ttsService.textToSpeech(reply);
      audioUrl = getPublicAudioUrl(req, speech.relativeUrl);
    } catch (err) {
      console.error('TTS ERROR:', err.message);
    }

    siteData.registerTranscriptAnalysis({
      sessionId,
      transcript
    });

    return res.json({
      success: true,
      transcript,
      reply,
      audioUrl
    });
  } catch (error) {
    console.error('Audio conversation error:', error.message);
    return res.status(500).json({
      error: 'Audio processing failed',
      details: error.message
    });
  }
}

module.exports = {
  handleText: handleTextConversation,
  handleAudio: handleAudioConversation,
  handleTextConversation,
  handleAudioConversation
};
