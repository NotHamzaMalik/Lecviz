# LecViz showcase

A presentation-ready React/Vite prototype adapted from Mindstream. Three views demonstrate the classroom experience, the proposed system architecture, and a lesson outside computing.

## Run

Double-click **Start-Showcase.cmd**, or use Node 22.12+:

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Production: `npm run build`, then `npm run preview`. Vercel uses the Vite build and `dist/` output declared in `vercel.json`. Pushing the connected Git branch triggers Vercel's configured deployment integration.

## Demonstrations

- **Classroom:** arrays, bubble sort, stacks, queues, and linked lists. Narrated operations update the diagram while the teacher speaks.
- **System architecture:** reproduces the supplied diagram's layers, labels, and arrow directions. The valid-event walkthrough follows microphone → Whisper → intent parser → validation → scene manager → renderer → output. The uncertain-event walkthrough demonstrates rejection, withheld updates, teacher correction, revalidation, and safe application. Click a node to inspect its step. A moving packet and event inspector expose the current transcript, structured event, validation decision, and scene values.
- **Beyond IT:** a water-cycle lesson demonstrates solar energy, evaporation, condensation, precipitation, runoff and infiltration. A rainfall graph then builds from explicitly illustrative values of 10, 30 and 20 mm. These are invented teaching data, not observations.

The architecture animation illustrates the proposed pipeline; it does not run a backend, Whisper, or an LLM. The current showcase is intentionally a playback experience. Microphone capture, typed commands, and command buttons have been removed.

## Playback

Choose **Aria** or **Guy**, then **Play example**. Both use bundled neural narration rather than desktop speech synthesis. Pause/resume keeps the audio position; restart begins at step one. Speed, mute, previous/next, step markers, transcript, light/dark themes, and fullscreen are available. Space and the arrow keys work when focus is outside a control.

All 106 narration clips are bundled MP3 files. No TTS service or API key is needed when viewing the deployed demo. The generation script used Microsoft's online neural speech service through [edge-tts](https://github.com/rany2/edge-tts); only the public example scripts were sent. The deployed app sends no microphone audio and never requests microphone access.

The audio playback clock drives progress. A classroom or science scene transition occurs at 68% of its sentence; architecture packets follow audio progress along the corresponding connection. The avatar's mouth and word emphasis are illustrative, not phoneme-aligned lip synchronization. All animation honors reduced-motion preferences. Changing tabs, examples or voices cancels old audio and invalidates its callbacks.

## Verification

```powershell
npm test
npm run build
```

The checks cover deterministic scene operations, narration coverage and script hashes, contrast, playback/pause/cancellation/failure handling, architecture ordering and rejection behavior, illustrative rainfall values, and server-rendered UI controls. Server-side render tests are not a substitute for visual browser QA.

To regenerate narration after editing lesson scripts:

```powershell
python -m pip install --target .tools/tts edge-tts mutagen
node scripts/export-narration.mjs
python scripts/generate-neural.py
```

Generation requires internet access. `.tools/` is ignored; only narration files and their manifest are deployed. Normal Vercel builds do not install or run Python. The generator verifies MP3 metadata, records text hashes, and reuses unchanged clips.

## Source notes

- UI foundation: sibling Mindstream repository, originally inspected at `d30af60`. Theme, canvas layout, controls and transcript presentation were adapted; new lessons, architecture animation, scene templates and playback controls belong to this showcase. Retain the original owner's permissions when redistributing adapted source.
- Architecture: the diagram supplied by the user. Backend and frontend groups, nine blocks, numbered layers, rejection branch, dashed fix route, and control-to-manager arrow are preserved.
- Water-cycle reference: [USGS Water Science School](https://www.usgs.gov/water-science-school/water-cycle).
- No user audio, provider keys, or transcript history are stored. Only theme preference is kept in browser localStorage.
