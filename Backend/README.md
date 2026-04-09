# Vedaspark Tele-Calling Backend

Production-ready Node.js backend for an AI-powered tele-calling flow:

- STT with OpenAI Whisper API
- LLM response generation with OpenAI Chat Completions
- TTS with ElevenLabs
- Session-based conversation memory
- Campaign-aware prompting for Vedaspark Astrology Services

## Tech Stack

- Node.js (>= 18.17)
- Express
- Multer
- Native fetch/FormData/Blob

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

Copy `.env.example` to `.env` and set values:

```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
PORT=3000
```

3. Start server:

```bash
npm start
```

## API Endpoints

### 1) Health

- `GET /health`

Sample response:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-04-09T12:00:00.000Z"
}
```

### 2) Text Conversation

- `POST /api/conversation/text`
- Content-Type: `application/json`

Request:

```json
{
  "sessionId": "user1",
  "message": "Hello"
}
```

Response:

```json
{
  "reply": "Hi! I'd love to help you explore what your stars reveal. Want a quick horoscope consultation?",
  "audioUrl": "http://localhost:3000/audio/<generated-file>.mp3"
}
```

### 3) Audio Conversation

- `POST /api/conversation/audio`
- Content-Type: `multipart/form-data`
- Fields:
  - `sessionId` (text)
  - `audio` (file)

Response:

```json
{
  "transcript": "I need guidance about my career",
  "reply": "Absolutely. Our astrologers can map career timing and strengths from your chart. Would you like to book a consultation this week?",
  "audioUrl": "http://localhost:3000/audio/<generated-file>.mp3"
}
```

## Session Memory

- In-memory `Map`
- Key: `sessionId`
- Value: conversation history array
- Memory window: last 6 exchanges (12 messages)

## Notes for Twilio Integration

- `/api/conversation/audio` is designed to be webhook-friendly.
- Audio outputs are persisted under `storage/audio` and exposed at `/audio/*`, so generated MP3 URLs are directly playable.

## Project Structure

```text
Backend/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── services/
│   │   ├── stt.service.js
│   │   ├── tts.service.js
│   │   └── llm.service.js
│   ├── core/
│   │   ├── conversation.manager.js
│   │   └── prompt.builder.js
│   ├── data/
│   │   └── campaign.js
│   ├── routes/
│   │   ├── conversation.routes.js
│   │   └── health.routes.js
│   ├── controllers/
│   │   └── conversation.controller.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── http-error.js
│   │   └── async-handler.js
│   ├── app.js
│   └── server.js
├── storage/
│   └── audio/
├── .env.example
├── .gitignore
└── package.json
```
