import logging
import os
import time

import requests
from dotenv import load_dotenv
from flask import Flask, Response, request
from twilio.twiml.voice_response import VoiceResponse

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

app = Flask(__name__)

@app.route("/")
def home():
    return "Twilio bridge is running"

BACKEND_AUDIO_ENDPOINT = os.getenv(
    "BACKEND_AUDIO_ENDPOINT",
    "http://localhost:3000/api/conversation/audio"
)
BASE_URL = (
    os.getenv("BASE_URL", "").strip()
    or os.getenv("NGROK_URL", "").strip()
    or os.getenv("PUBLIC_AUDIO_BASE_URL", "").strip()
).rstrip("/")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
HTTP_TIMEOUT_SECONDS = int(os.getenv("HTTP_TIMEOUT_SECONDS", "20"))


def build_record_twiml(vr: VoiceResponse) -> None:
    if not BASE_URL:
        raise RuntimeError("BASE_URL is required for absolute Twilio action URLs")

    vr.record(
        action=f"{BASE_URL}/process-recording",
        method="POST",
        max_length=4,
        timeout=2,
        trim="trim-silence"
    )


def ensure_public_audio_url(node_audio_url: str) -> str:
    if not node_audio_url:
        return ""

    if "http://localhost:3000" in node_audio_url and not BASE_URL:
        logging.error("BASE_URL is not set for localhost audio URL rewrite")
        return ""

    if "http://localhost:3000" in node_audio_url:
        return node_audio_url.replace("http://localhost:3000", BASE_URL)

    return node_audio_url


def download_twilio_recording(recording_url: str) -> bytes:
    if not recording_url:
        raise ValueError("RecordingUrl is missing")

    download_url = recording_url if recording_url.endswith(".wav") else f"{recording_url}.wav"
    auth = None
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    logging.info("Downloading Twilio recording url=%s", download_url)

    with requests.get(
        download_url,
        stream=True,
        timeout=HTTP_TIMEOUT_SECONDS,
        auth=auth
    ) as response:
        response.raise_for_status()
        chunks = []
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                chunks.append(chunk)

    audio_bytes = b"".join(chunks)
    if not audio_bytes:
        raise ValueError("Downloaded recording is empty")

    return audio_bytes


def call_node_audio_api(audio_bytes: bytes, session_id: str) -> dict:
    files = {
        "file": ("input.wav", audio_bytes, "audio/wav")
    }
    data = {
        "sessionId": session_id
    }

    response = requests.post(
        BACKEND_AUDIO_ENDPOINT,
        files=files,
        data=data,
        timeout=30
    )
    if not response.ok:
        logging.error("Node audio API failed status=%s body=%s", response.status_code, response.text)
        return {
            "success": False,
            "transcript": "",
            "reply": "I am sorry, I am having trouble generating audio right now. Please continue and I will respond.",
            "audioUrl": ""
        }
    return response.json()

@app.route("/incoming_call", methods=["GET", "POST"])
def incoming_call() -> Response:
    logging.info("Incoming request /incoming_call method=%s", request.method)

    response = VoiceResponse()
    response.say("Speak after the beep.", voice="alice")
    build_record_twiml(response)
    return Response(str(response), mimetype="text/xml")


@app.route("/process-recording", methods=["POST"])
def process_recording() -> Response:
    print("HIT /process-recording")
    logging.info("Incoming request /process-recording method=%s", request.method)
    logging.info("FormData=%s", dict(request.form))

    response = VoiceResponse()
    started_at = time.perf_counter()
    recording_url = request.form.get("RecordingUrl", "").strip()
    call_sid = request.form.get("CallSid", "anonymous-session").strip() or "anonymous-session"

    if not recording_url:
        logging.error("RecordingUrl is missing in Twilio callback")
        response.say("Sorry, I didn't catch that.", voice="alice")
        response.redirect(f"{BASE_URL}/incoming_call")
        return Response(str(response), mimetype="text/xml")

    logging.info("Processing Twilio recording url=%s", recording_url)

    try:
        audio_bytes = download_twilio_recording(recording_url)
        node_data = call_node_audio_api(audio_bytes, call_sid)

        transcript = node_data.get("transcript", "")
        reply = node_data.get("reply", "")
        raw_audio_url = node_data.get("audioUrl", "")
        audio_url = ensure_public_audio_url(raw_audio_url)

        logging.info("Transcript=%s", transcript)
        logging.info("Reply=%s", reply)
        logging.info("AudioUrl=%s", audio_url)
        logging.info("ProcessLatencyMs=%s", int((time.perf_counter() - started_at) * 1000))

        if audio_url:
            response.play(audio_url)
        else:
            fallback_text = (reply or "I am sorry, I had trouble processing that. Please try again.").strip()
            logging.warning("AudioUrl missing; falling back to Twilio Say reply")
            response.say(fallback_text, voice="alice")
    except Exception as error:
        logging.exception("Processing recording failed: %s", str(error))
        response.say("I am sorry, I had trouble processing that. Please try again.", voice="alice")

    build_record_twiml(response)
    return Response(str(response), mimetype="text/xml")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)