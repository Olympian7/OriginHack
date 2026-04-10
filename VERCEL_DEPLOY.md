# Vercel Deployment Guide

This repository is configured to deploy **Frontend + Backend API** together from the project root.

## 1. Import Project in Vercel

- Import the Git repository.
- Set **Root Directory** to project root (`OriginHack`).
- Framework preset can be **Other**.

## 2. Environment Variables (Vercel Project Settings)

Add these variables before first deploy:

- `GROQ_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

Optional:

- `STT_PLACEHOLDER` (`true` or `false`)
- `DEBUG_SAVE_AUDIO` (`true` or `false`)

## 3. Deploy

- Deploy from Vercel dashboard or CLI.
- Frontend routes are served from `Frontend/telecaller`.
- API routes are served by `api/index.js`.

## 4. URLs After Deploy

- `/` -> landing page
- `/index`, `/contacts`, `/campaigns`, `/call-logs`, `/analytics` -> frontend pages
- `/api/*` -> backend API
- `/health` -> backend health endpoint

## 5. Important Runtime Note

`storage/audio` is file-system based. On serverless deployments, local file persistence is ephemeral. If you need durable audio files, move storage to object storage (e.g., S3, Vercel Blob).
