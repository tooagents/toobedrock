from strands import Agent

from model.load import load_model
from prompts import SYSTEM_PROMPT
from tools.catalog_tools import get_product_info, get_return_policy

_agent: Agent | None = None


def get_or_create_agent() -> Agent:
    global _agent

    if _agent is None:
        _agent = Agent(
            model=load_model(),
            system_prompt=SYSTEM_PROMPT,
            tools=[get_return_policy, get_product_info],
        )

    return _agent
