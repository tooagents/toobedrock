# TooAgentCore Frontend

Small React/Vite tester for the deployed AgentCore customer-support agent.

## Run Locally

```bash
npm i
npm run dev
```

Open the Vite URL and configure:

- Agent endpoint: your Lambda Function URL
- API key: the same value as the Lambda `FRONTEND_API_KEY` environment variable
- Bearer token: leave blank for the current Lambda proxy flow

The app sends:

```json
{ "prompt": "What can you do?" }
```

The Lambda invokes AgentCore Runtime and returns the response. The UI also cleans AgentCore `data: "..."` lines into readable text.

## Optional Env

You can prefill the endpoint at build time:

```bash
VITE_AGENT_ENDPOINT=https://your-lambda-url.lambda-url.us-east-1.on.aws/
```

## Build For Cloudflare Pages

```bash
npm run build
```

Cloudflare Pages settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

This frontend can also be hosted on Netlify or S3 because it is a static Vite build. The Lambda remains the AWS backend adapter that signs the AgentCore Runtime call.




{
  "headers": {
    "x-api-key": "VeniVidiVici"
  },
  "body": "{\"prompt\":\"hello\"}"
}

https://cfzcaojnif37elcnuzix4u4sjm0gpmuc.lambda-url.us-east-1.on.aws/