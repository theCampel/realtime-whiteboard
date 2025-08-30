"""Real-time microphone input for the voice pipeline."""

from __future__ import annotations

import asyncio
from typing import AsyncGenerator

import numpy as np
import sounddevice as sd
from agents.voice import StreamedAudioInput

from .voice import WhiteboardVoicePipeline


class MicrophoneStreamer:
    """Streams audio from microphone for real-time processing."""

    def __init__(self, sample_rate: int = 24000, channels: int = 1, device: str | None = None) -> None:
        self.sample_rate = sample_rate
        self.channels = channels
        self.device = device
        self._stream: sd.InputStream | None = None
        self._audio_queue: asyncio.Queue[np.ndarray] = asyncio.Queue()
        self._running = False

    def _audio_callback(
        self, indata: np.ndarray, frames: int, time: sd.CallbackFlags, status: sd.CallbackStatus
    ) -> None:
        """Callback for audio input."""
        if status:
            print(f"[Microphone] Audio status: {status}")

        # Convert float32 to int16 for the pipeline
        audio_chunk = (indata[:, 0] * 32767).astype(np.int16)

        # Non-blocking queue put
        try:
            self._audio_queue.put_nowait(audio_chunk)
        except asyncio.QueueFull:
            print("[Microphone] Audio queue full, dropping chunk")

    async def start_streaming(self) -> AsyncGenerator[np.ndarray, None]:
        """Start streaming audio from microphone."""
        self._running = True

        # Start the audio input stream
        self._stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=np.float32,
            callback=self._audio_callback,
            device=self.device,
        )

        with self._stream:
            self._stream.start()
            print(f"[Microphone] Started streaming from device: {self.device or 'default'}")

            try:
                while self._running:
                    # Get audio chunk with timeout
                    try:
                        chunk = await asyncio.wait_for(self._audio_queue.get(), timeout=0.1)
                        yield chunk
                    except asyncio.TimeoutError:
                        continue
            finally:
                self._stream.stop()
                print("[Microphone] Stopped streaming")

    def stop(self) -> None:
        """Stop the microphone streaming."""
        self._running = False


async def run_microphone_pipeline(device: str | None = None) -> None:
    """Run the voice pipeline with real microphone input."""
    pipeline = WhiteboardVoicePipeline()
    microphone = MicrophoneStreamer(device=device)

    print("[Microphone] Starting real-time voice whiteboard...")
    print("[Microphone] Speak commands like: 'Draw me a database, then draw me a person'")
    print("[Microphone] Press Ctrl+C to stop")

    try:
        # Create streamed audio input
        streamed_input = StreamedAudioInput()

        # Start processing task
        process_task = asyncio.create_task(pipeline.process_audio(streamed_input))

        # Stream from microphone
        async for chunk in microphone.start_streaming():
            await streamed_input.add_chunk(chunk)

    except KeyboardInterrupt:
        print("\n[Microphone] Stopping...")
    except Exception as e:
        print(f"[Microphone] Error: {e}")
    finally:
        microphone.stop()
        await streamed_input.close()

        # Print final whiteboard state
        print(f"\n[Final] Whiteboard items: {pipeline.service.list_items()}")
        print(f"[Final] Whiteboard connections: {pipeline.service.list_edges()}")


async def main() -> None:
    """Main entry point for microphone-based voice control."""
    await run_microphone_pipeline()


if __name__ == "__main__":
    asyncio.run(main())
