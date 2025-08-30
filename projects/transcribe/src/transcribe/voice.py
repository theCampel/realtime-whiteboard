"""Voice pipeline for real-time whiteboard transcription and tool execution."""

from __future__ import annotations

import asyncio
from typing import Any

import numpy as np
import sounddevice as sd
from agents.voice import AudioInput, SingleAgentVoiceWorkflow, StreamedAudioInput, VoicePipeline

from .agent import create_agent, set_service
from .service import WhiteboardService


class WhiteboardVoicePipeline:
    """Voice pipeline for real-time whiteboard interactions."""

    def __init__(self) -> None:
        self.service = WhiteboardService()
        set_service(self.service)
        self.agent = create_agent()
        self.workflow = SingleAgentVoiceWorkflow(self.agent)
        self.pipeline = VoicePipeline(workflow=self.workflow)

    async def process_audio(self, audio_input: AudioInput | StreamedAudioInput) -> None:
        """Process audio input and execute whiteboard commands."""
        result = await self.pipeline.run(audio_input)

        # Create an audio player using sounddevice
        player = sd.OutputStream(samplerate=24000, channels=1, dtype=np.int16)
        player.start()

        try:
            # Play the audio stream as it comes in
            async for event in result.stream():
                if event.type == "voice_stream_event_audio":
                    player.write(event.data)
                elif event.type == "voice_stream_event_lifecycle":
                    print(f"[Voice] Lifecycle event: {event.name}")
                elif event.type == "voice_stream_event_error":
                    print(f"[Voice] Error: {event.error}")
        finally:
            player.stop()
            player.close()

    async def process_static_audio(self, audio_buffer: np.ndarray) -> None:
        """Process a complete audio buffer (for push-to-talk or pre-recorded audio)."""
        audio_input = AudioInput(buffer=audio_buffer)
        await self.process_audio(audio_input)

    async def process_streamed_audio(self, audio_stream: Any) -> None:
        """Process streaming audio input for real-time transcription."""
        # Create a streamed audio input for real-time processing
        streamed_input = StreamedAudioInput()

        # Start processing the streamed input
        process_task = asyncio.create_task(self.process_audio(streamed_input))

        try:
            # Feed audio chunks to the pipeline
            async for chunk in audio_stream:
                await streamed_input.add_chunk(chunk)

            # Signal end of input
            await streamed_input.close()

            # Wait for processing to complete
            await process_task
        except Exception as e:
            print(f"[Voice] Stream processing error: {e}")
            await streamed_input.close()
            raise
