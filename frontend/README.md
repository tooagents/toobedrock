# TooAgentCore Frontend

Small React/Vite tester for the deployed AgentCore runtime.

## Run locally

```bash
npm i
npm run dev
```

Open the Vite URL, paste the agent invoke URL or a proxy URL, then send a prompt.
The app sends:

```json
{ "prompt": "What can you do?" }
```

It displays streamed text chunks as they arrive.

## Build for Cloudflare Pages

```bash
npm run build
```

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `frontend`

If your AgentCore endpoint requires AWS SigV4, put a small authenticated API proxy in front of it and use that proxy URL in the app. Browsers should not hold AWS credentials.
