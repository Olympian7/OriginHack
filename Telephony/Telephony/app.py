from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from twilio.twiml.voice_response import VoiceResponse
from twilio.rest import Client

import os
import requests
import uuid
import traceback
from dotenv import load_dotenv

# =========================
# LOAD ENV
# =========================
load_dotenv()

NGROK_URL = os.getenv("NGROK_URL", "").rstrip("/")
ELEVENLABS_API_KEY = os.getenv("sk_9f02b043870820e0177049f23e4188a2e4cb94c0e8db0f48")
ELEVENLABS_VOICE_ID = os.getenv("hpp4J3VqNfWAUOO0d1Us")

app = FastAPI()

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# STATIC FILES
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"status": "server running"}


# =========================
# HELPERS
# =========================

def download_audio(url: str) -> str:
    if not url:
        raise ValueError("Recording URL missing")

    url = url + ".wav"

    r = requests.get(
        url,
        auth=(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        ),
        timeout=15
    )

    r.raise_for_status()

    with open("input.wav", "wb") as f:
        f.write(r.content)

    return "input.wav"


def speech_to_text(file_path: str) -> str:
    # TEMP MOCK (replace later)
    return "hello"


def generate_ai_reply(text: str) -> str:
    # TEMP MOCK (replace with Grok later)
    return f"Hello, this is Vedaspark. We help businesses automate customer calls. Would you like a quick demo?"


def text_to_speech(text: str) -> str:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "text": text
    }

    print("🔊 Sending to ElevenLabs")

    response = requests.post(url, json=data, headers=headers, timeout=20)

    if response.status_code != 200:
        raise Exception(f"ElevenLabs failed: {response.text}")

    file_name = f"audio_{uuid.uuid4()}.mp3"
    file_path = f"static/{file_name}"

    with open(file_path, "wb") as f:
        f.write(response.content)

    public_url = f"{NGROK_URL}/static/{file_name}"

    print("🎧 Audio URL:", public_url)

    return public_url


# =========================
# INCOMING CALL
# =========================
@app.post("/incoming_call")
async def incoming_call(request: Request):
    vr = VoiceResponse()

    vr.say("Hello, this is Vedaspark AI assistant.")

    vr.pause(length=1)

    vr.say("How can I help you today?")

    vr.record(
        action=f"{NGROK_URL}/process_audio",
        method="POST",
        timeout=2,
        maxLength=5,
        playBeep=True
    )

    return Response(content=str(vr), media_type="application/xml")


# =========================
# PROCESS AUDIO
# =========================
@app.post("/process_audio")
async def process_audio(request: Request):
    vr = VoiceResponse()

    try:
        print("🔥 HIT /process_audio")

        form = await request.form()
        recording_url = form.get("RecordingUrl")

        print("Recording URL:", recording_url)

        # FILLER (important for UX)
        vr.say("Give me a moment to think.")

        # STEP 1: download
        audio_file = download_audio(recording_url)

        # STEP 2: STT
        text = speech_to_text(audio_file)
        print("User said:", text)

        # STEP 3: AI
        ai_reply = generate_ai_reply(text)
        print("AI reply:", ai_reply)

        # STEP 4: TTS
        audio_url = text_to_speech(ai_reply)

        # STEP 5: PLAY AUDIO
        vr.play(audio_url)

        # STEP 6: LOOP
        vr.record(
            action="https://YOUR-NGROK-URL.ngrok-free.dev/process_audio",
            method="POST",
            timeout=2,
            maxLength=5
        )

    except Exception as e:
        print("❌ ERROR OCCURRED")
        traceback.print_exc()

        vr = VoiceResponse()
        vr.say("Sorry, something went wrong. Please try again.")

    return Response(content=str(vr), media_type="application/xml")


# =========================
# TRIGGER CALL
# =========================
from pydantic import BaseModel

class CallRequest(BaseModel):
    number: str


@app.post("/trigger-call")
async def trigger_call(req: CallRequest):
    try:
        client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )

        call = client.calls.create(
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=req.number,
            url=f"{NGROK_URL}/incoming_call"
        )

        return {"status": "call initiated", "sid": call.sid}

    except Exception as e:
        print("❌ CALL ERROR:", str(e))
        return {"error": str(e)} 