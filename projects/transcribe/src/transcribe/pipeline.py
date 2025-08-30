from __future__ import annotations

import asyncio

from .voice import WhiteboardVoicePipeline


async def run_voice_pipeline(device: str | None = None) -> None:
    """Run the voice pipeline for whiteboard interactions."""
    pipeline = WhiteboardVoicePipeline()
    await pipeline.run_demo()


def main() -> None:
    """Main entry point for the pipeline."""
    asyncio.run(run_voice_pipeline())
