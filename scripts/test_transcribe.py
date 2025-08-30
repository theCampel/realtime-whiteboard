# Copyright 2025 Mandeep Cheema (mandeep@cheema.uk). All rights reserved.

import asyncio
import wave
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from transcribe.voice import WhiteboardVoicePipeline


async def test_with_audio_file(audio_file_path: str) -> None:
    """Test the pipeline with a pre-recorded audio file."""
    pipeline = WhiteboardVoicePipeline()

    print(f"[Test] Loading audio file: {audio_file_path}")

    # Load the audio file
    try:
        with wave.open(audio_file_path, "rb") as wav_file:
            # Verify format matches expectations
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()

            print(f"[Test] Audio format: {sample_rate}Hz, {channels} channel(s), {sample_width * 8}-bit")

            if sample_rate != 24000:
                print(f"[Warning] Expected 24kHz, got {sample_rate}Hz")
            if channels != 1:
                print(f"[Warning] Expected mono, got {channels} channels")
            if sample_width != 2:
                print(f"[Warning] Expected 16-bit, got {sample_width * 8}-bit")

            # Read all frames
            frames = wav_file.readframes(wav_file.getnframes())
            # Convert to numpy array
            audio_buffer = np.frombuffer(frames, dtype=np.int16)

            print(f"[Test] Loaded {len(audio_buffer)} samples ({len(audio_buffer) / 24000:.2f} seconds)")

    except Exception as e:
        print(f"[Test] Error loading audio file: {e}")
        return

    print("[Test] Processing audio...")
    await pipeline.process_static_audio(audio_buffer)

    # Print results
    print(f"[Test] Whiteboard items: {pipeline.service.list_items()}")
    print(f"[Test] Whiteboard edges: {pipeline.service.list_edges()}")


async def main() -> None:
    """Main entry point for the voice transcription service."""
    print("[Voice] Starting whiteboard voice pipeline...")
    load_dotenv()
    await test_with_audio_file(str(Path(__file__).parent / "sample.wav"))


if __name__ == "__main__":
    asyncio.run(main())
