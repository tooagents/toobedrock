from collections.abc import AsyncIterator
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp

from agent import get_or_create_agent

app = BedrockAgentCoreApp()
log = app.logger


@app.entrypoint
async def invoke(payload: dict[str, Any], context: Any) -> AsyncIterator[str]:
    prompt = payload.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        yield "Please provide a non-empty prompt."
        return

    log.info("Invoking AgentCore runtime")
    agent = get_or_create_agent()
    stream = agent.stream_async(prompt)

    async for event in stream:
        data = event.get("data")
        if isinstance(data, str):
            yield data
