from __future__ import annotations

import asyncio

from .agent import Context, create_agent
from .service import WhiteboardService


async def run_voice_pipeline(device: str | None = None) -> None:
    agent, _service = create_agent()

    service = WhiteboardService()
    context = Context(service=service)

    # TODO: Create and run a pipeline
    


def main() -> None:
    asyncio.run(run_voice_pipeline())
