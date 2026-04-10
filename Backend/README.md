# Vedaspark Tele-Calling Backend
1. Project Title & Tagline

VedaCall AI — Intelligent Voice-Based Tele-Calling Agent
An AI-powered system that automates outbound tele-calling with real-time conversational intelligence using speech recognition, LLM reasoning, and human-like voice responses.

Production-ready Node.js backend for an AI-powered tele-calling flow:

- STT with OpenAI Whisper API
- LLM response generation with OpenAI Chat Completions
- TTS with ElevenLabs
- Session-based conversation memory
- Campaign-aware prompting for Vedaspark Astrology Services

2. Problem Statement

Traditional tele-calling systems rely heavily on human agents, making them costly, inconsistent, and difficult to scale. Existing robocall systems lack intelligence and fail to engage users due to static scripts and no contextual understanding.

This project addresses the need for an AI-driven tele-calling system that can autonomously handle conversations, understand user input in real time, and respond dynamically based on campaign goals and business context.

Our solution demonstrates how voice AI can replace repetitive tele-calling workflows while improving scalability and interaction quality.

3. Features
Outbound Call Handling
Initiates calls to users and connects them to an AI-driven conversational system.
Real-Time Speech Processing
Converts user speech to text and processes it dynamically during the call.
AI-Based Response Generation
Uses an LLM to generate context-aware responses instead of fixed scripts.
Text-to-Speech Playback
Converts AI responses into natural voice and plays them back to the caller.
Conversation Looping
Maintains multi-turn conversations by continuously recording and responding.
Call Flow Automation
Handles greeting, listening, responding, and looping without human intervention.

4. Tech Stack
Backend
Python (FastAPI)
Twilio Voice API
Requests (HTTP handling)
AI Components
Speech-to-Text (placeholder / Whisper-ready)
LLM (Grok / replaceable)
ElevenLabs (Text-to-Speech)
Dev Tools
ngrok (public webhook exposure)
dotenv (environment configuration)


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
6. Installation & Setup
   
  1. Clone the repository
    git clone <your-repo-url>
    cd project-root
  2. Create virtual environment
    python -m venv .venv
    .venv\Scripts\activate   # Windows
  3. Install dependencies
     pip install -r requirements.txt
  4. Configure environment variables

Create a .env file:

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
NGROK_URL=https://your-ngrok-url

5. Run server
uvicorn app:app --reload --port 5000

7. Start ngrok
ngrok http 5000

8. Configure Twilio
    Set webhook URL:
    https://<ngrok-url>/incoming_call

7. How It Works
  1. Call Initiation
      Twilio triggers /incoming_call
      AI greets user using <Say>
  2. Audio Capture
      <Record> captures user speech
      Sends recording URL to /process_audio
  3. Speech-to-Text
      Audio is downloaded
      Converted to text (STT module)
  4. AI Processing
      Text is passed to LLM (Grok)
      Response is generated based on input
  5. Text-to-Speech
      Response converted to audio using ElevenLabs
  6. Playback
      Audio played using <Play>
  7. Loop Continuation
      System records again for next user input

8. Scalability
  Horizontal Scaling
  Backend can be scaled using multiple FastAPI instances behind a load balancer.
  Worker-Based Processing
  STT, LLM, and TTS can be separated into async workers using queues (Redis/Kafka).
  Telephony Scaling
  Twilio handles scaling of concurrent calls; can be replaced with Asterisk for self-hosting.
  Bottlenecks Identified
  LLM response latency
  TTS generation delay
  Sequential processing pipeline
9. Feasibility

  The system is fully buildable using existing APIs and frameworks with minimal infrastructure.

To move to production:

  Replace ngrok with deployed backend (AWS/GCP)
  Add database for call logs and analytics
  Introduce queue-based processing for concurrency
  Implement robust STT (Whisper) and fallback mechanisms

The modular design allows each component (telephony, AI, TTS) to be replaced independently.

10. Novelty

  Unlike traditional robocalls that rely on static scripts, this system:
  
  Generates dynamic responses using LLMs
  Supports multi-turn conversations
  Adapts to user input in real time

The novelty lies in combining:

Voice + AI reasoning + real-time interaction
into a single automated tele-calling pipeline.

11. Feature Depth
    
  Handles multi-turn conversations via looping record-response cycle
  Supports dynamic response generation instead of pre-defined flows
  Modular AI pipeline allows:
  swapping Grok with OpenAI / local LLM
  replacing TTS providers
  Configurable parameters:
  recording timeout
  max audio length
  response style via prompts

Future depth:

  intent classification (interested / not interested)
  campaign-based response tuning
  multilingual support
  12. Ethical Use & Disclaimer

This system is designed for ethical and consent-based communication only.

Must comply with telemarketing laws and user consent regulations
Should not be used for spam, fraud, or deceptive practices
AI-generated responses must be clearly disclosed where required

13. License
    
  MIT License

15. Author

  Atharva Iyer
  📧 (atharvaiyer2006@gmail.com)
  🔗 GitHub: https://github.com/your-profile
