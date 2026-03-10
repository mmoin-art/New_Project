# Accel Digital Chat Experience

A modern, zero-dependency web chatbot that mirrors the look-and-feel of [Accel Digital](https://www.accel-digital.com/). Users move through curated conversation flows entirely with buttons, making it ideal for kiosks, marketing pages, or demo environments.

## Features
- Fully responsive layout with header/footer, chat panel, and CTA hero section inspired by Accel Digital branding.
- Message bubbles with clear bot/user alignment and contextual timestamps.
- Dynamic button shelf that updates after each selection—no typing required.
- Toast notifications and inline confirmations for key milestones.
- Node.js server that serves the frontend and powers `/api/chat`, returning `{ message, options, toast? }` payloads so flows never break.
- Graceful fallback handling on both client and server to keep the experience running even with invalid inputs.

## Project structure
```
/Users/mmoin/Desktop/New Project
├── backend
│   ├── package.json
│   ├── public/
│   │   ├── app.js
│   │   ├── index.html
│   │   └── styles.css
│   └── server.js
├── render.yaml
└── README.md
```

## Prerequisites
- Node.js 18+

## Running locally
```bash
cd backend
npm install   # no dependencies, but keeps the flow consistent
npm start
```
Visit `http://localhost:4000` to chat. All button clicks hit `/api/chat`, so the server must stay running.

> On Render’s free plan the instance sleeps after a few idle minutes. The frontend now retries chat requests automatically, but expect the first click after a long pause to take a couple of seconds while the service wakes up.

## Customizing flows
- Conversation logic lives in `backend/server.js` inside the `flows` object. Each entry can include:
  - `message`: string shown to the user.
  - `options`: array of `{ label, intent }` to build the next button set.
  - `toast` (optional): short confirmation shown as a toast.
- Add new intents, update copy, or change option ordering as needed. The frontend automatically reflects the JSON the server returns.

## Deploying to Render
1. Push this repo to GitHub (already done).
2. In Render choose **New > Blueprint** and paste the repo URL. The included `render.yaml` provisions the Node service.
3. The Blueprint deploys a free Node web service that serves both the static assets and the `/api/chat` endpoint.
4. Need storage or telemetry later? Upgrade the plan, add the necessary env vars/disks in the Render dashboard, and redeploy.
5. Each push to `main` triggers an automatic redeploy.

Enjoy the conversation-first experience!
