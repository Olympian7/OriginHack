# Twilio Python Bridge

This service bridges Twilio voice recordings to the existing Node backend.

Flow:
1. Twilio records caller speech.
2. Twilio sends `RecordingUrl` to `/process-recording`.
3. Bridge downloads the WAV recording from Twilio.
4. Bridge sends audio to Node backend `POST /api/conversation/audio` as multipart field `file`.
5. Bridge reads `transcript`, `reply`, `audioUrl` and returns TwiML.
6. Twilio plays `audioUrl` using `<Play>`; falls back to `<Say>` when URL is not publicly reachable.

## Endpoints

- `POST /voice`
- `POST /process-recording`
- `GET /health`

## Setup

1. Create and activate a Python environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and set values.

## Run

```bash
python app.py
```

Server defaults to port `5000`.

## Twilio Configuration

For your Twilio phone number voice webhook:
- URL: `https://<public-bridge-url>/voice`
- Method: `POST`

## Public URL Notes

- Twilio must reach this Python bridge over a public HTTPS URL.
- If Node returns `http://localhost:3000/audio/...`, Twilio cannot play that directly.
- Set `PUBLIC_AUDIO_BASE_URL` to your public Node base URL (for example ngrok) so `<Play>` uses a reachable URL.

## Logs

The bridge logs:
- RecordingUrl
- Transcript
- End-to-end latency

## Optional Multi-turn

`ENABLE_MULTI_TURN=true` keeps recording after each response via another `<Record>` instruction.
