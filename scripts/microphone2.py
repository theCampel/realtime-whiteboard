from __future__ import annotations

import asyncio

import numpy as np
import sounddevice as sd
from agents.voice import StreamedAudioInput, VoicePipeline
from dotenv import load_dotenv
from transcribe.voice import WhiteboardVoicePipeline

CHUNK_LENGTH_S = 0.05  # 100ms
SAMPLE_RATE = 24000
FORMAT = np.int16
CHANNELS = 1



class RealtimeApp():

    should_send_audio: asyncio.Event
    audio_player: sd.OutputStream
    last_audio_item_id: str | None
    connected: asyncio.Event

    def __init__(self) -> None:
        self.last_audio_item_id = None
        self.should_send_audio = asyncio.Event()
        self.connected = asyncio.Event()
        self.pipeline = WhiteboardVoicePipeline()
        self._audio_input = StreamedAudioInput()
        self.audio_player = sd.OutputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=FORMAT,
        )

    def _on_transcription(self, transcription: str) -> None:
        try:
            print(f"Transcription: {transcription}")
        except Exception:
            pass

    async def on_mount(self) -> None:
        task1 = asyncio.create_task(self.start_voice_pipeline())
        task2 = asyncio.create_task(self.send_mic_audio())
        await asyncio.gather(task1, task2)


    async def start_voice_pipeline(self) -> None:
        try:
            self.audio_player.start()
            result = await self.pipeline.process_audio(self._audio_input)

            async for event in result.stream():
                print(f"Lifecycle event: {event}")
                if event.type == "voice_stream_event_audio":
                    self.audio_player.write(event.data)
                    print(
                        f"Received audio: {len(event.data) if event.data is not None else '0'} bytes"
                    )
                elif event.type == "voice_stream_event_lifecycle":
                    print(f"[Voice] Lifecycle event: {event}")
                elif event.type == "voice_stream_event_error":
                    print(f"[Voice] Error: {event}")
                elif event.type == "voice_stream_event_audio":
                    print(f"[Voice] Audio event: {len(event.data) if event.data else 0} bytes")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            self.audio_player.close()

    async def send_mic_audio(self) -> None:
        device_info = sd.query_devices()
        print(device_info)

        read_size = int(SAMPLE_RATE * 0.02)

        stream = sd.InputStream(
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            dtype="int16",
        )
        stream.start()

        print(f"Recording...")

        try:
            while True:
                if stream.read_available < read_size:
                    await asyncio.sleep(0)
                    continue

                await self.should_send_audio.wait()
                print(f"Recording...")

                data, _ = stream.read(read_size)

                await self._audio_input.add_audio(data)
                await asyncio.sleep(0)
        except KeyboardInterrupt:
            pass
        finally:
            stream.stop()
            stream.close()


if __name__ == "__main__":
    load_dotenv()
    app = RealtimeApp()
    asyncio.run(app.on_mount())
