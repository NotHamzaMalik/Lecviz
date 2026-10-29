"""Generate bundled neural narration. No service is called from the deployed app."""
import asyncio
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.tools' / 'tts'))
import edge_tts
from mutagen.mp3 import MP3

VOICES = {'aria': 'en-US-AriaNeural', 'guy': 'en-US-GuyNeural'}
OUT = ROOT / 'public' / 'narration'
SCRIPT = json.loads((OUT / 'script.json').read_text(encoding='utf-8'))

async def main():
    gate = asyncio.Semaphore(3)
    manifest = {'engine': 'Microsoft Edge neural TTS', 'voices': VOICES, 'clips': {}}
    async def generate(voice_id, provider_voice, line):
        path = OUT / voice_id / line['file']
        path.parent.mkdir(parents=True, exist_ok=True)
        signature = hashlib.sha256((provider_voice + '|-4%|' + line['text']).encode()).hexdigest()
        stamp = ROOT / '.tools' / 'audio-stamps' / (voice_id + '-' + line['file'] + '.txt')
        stamp.parent.mkdir(parents=True, exist_ok=True)
        async with gate:
            if not (path.exists() and stamp.exists() and stamp.read_text() == signature):
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(line['text'], provider_voice, rate='-4%', connect_timeout=15, receive_timeout=40).save(str(path))
                        MP3(path)
                        stamp.write_text(signature)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2 * (attempt + 1))
            info = MP3(path).info
            manifest['clips'][f"{voice_id}/{line['file']}"] = {'duration': round(info.length, 3), 'bytes': path.stat().st_size, 'text_sha256': hashlib.sha256(line['text'].encode()).hexdigest()}
            print(f"Ready {voice_id}/{line['file']} ({info.length:.1f}s)", flush=True)
    await asyncio.gather(*(generate(voice, provider, line) for voice, provider in VOICES.items() for line in SCRIPT))
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f"Complete: {len(manifest['clips'])} neural narration clips", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
