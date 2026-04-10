import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
ngrok_url = (os.getenv("NGROK_URL") or "").strip().rstrip("/")

if not account_sid or not auth_token:
    raise ValueError("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN")

if not ngrok_url:
    raise ValueError("NGROK_URL is missing in environment")

client = Client(account_sid, auth_token)


def trigger_call():
    initial_twiml = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<Response>"
        "<Say voice=\"alice\">Speak after the beep.</Say>"
        f"<Record action=\"{ngrok_url}/process-recording\" method=\"POST\" "
        "maxLength=\"4\" timeout=\"2\" playBeep=\"true\" trim=\"trim-silence\" />"
        "</Response>"
    )

    call = client.calls.create(
        from_="+16066590277",  # your Twilio number
        to="+917678507004",    # fixed number (your phone)
        twiml=initial_twiml
    )

    print("Call SID:", call.sid)


if __name__ == "__main__":
    trigger_call()