import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

client = Client(account_sid, auth_token)


def build_incoming_call_url() -> str:
    ngrok_url = (os.getenv("NGROK_URL") or "").strip().rstrip("/")
    if not ngrok_url:
        raise ValueError("NGROK_URL is missing in environment")

    if ngrok_url.endswith("/incoming_call"):
        return ngrok_url

    return f"{ngrok_url}/incoming_call"


def trigger_call():
    call = client.calls.create(
        from_="+16066590277",  # your Twilio number
        to="+917678507004",    # fixed number (your phone)
        url=build_incoming_call_url()
    )

    print("Call SID:", call.sid)


if __name__ == "__main__":
    trigger_call()