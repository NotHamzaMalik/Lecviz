# LecViz showcase — based on Mindstream

A focused frontend prototype for presenting speech-driven classroom visualization. It adapts Mindstream's React/Vite layout, theme mechanism, transcript panel, grouped controls, and browser speech hook. The full Next.js/FastAPI product is not part of this prototype.

## Run locally

For a presentation, double-click **Start-Showcase.cmd**. It opens the local demo in your browser and keeps the server running in its terminal window.

Requires Node.js 22.12+ (tested with Node 24).

```powershell
cd "C:\Users\Hamza Malik\Desktop\lecviz\lecviz-showcase"
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. `npm run build` produces a static `dist/` folder; `npm run preview` serves the production build on port 4173. `npm test` runs the deterministic command/scene checks.

## Showcase walkthrough

1. Start with **Bubble sort** and click **Play example**. The teacher speaks the first instruction, then the array appears as that instruction finishes. The next sentences drive comparisons and swaps.
2. Choose **Zira** or **David** above the teacher. Both have bundled, offline narration. The avatar talks during audio playback; the current sentence is shown in large type. Pause/resume preserves audio position. Restart replays from an empty canvas. Space toggles playback and arrow keys step through history when focus is outside a control.
3. Click **Arrays**, **Stacks**, **Queues**, or **Linked lists** for another prepared example.
4. Click a suggested command or type one and press Enter. For example: `Create an array with 8, 3, 5`, `Swap the first two`, then `Highlight the largest number`.
5. Try the microphone in a supported browser. Read the in-app consent notice and allow the browser prompt yourself. Speak one command at a time, using the same phrases shown under the canvas.
6. Switch theme or fullscreen for a projector. Use **Transcript** for the completed sentences and **Commands** for clickable examples. The main screen keeps only the diagram, teacher, current sentence and controls.

## What is real and what is illustrative

- Guided playback uses prepared text, generated speech, and predetermined actions. The audio clock drives the diagram: each operation appears at 68% of its spoken sentence, with the next sentence starting when the previous clip ends. Word emphasis is estimated from the audio position, not speech recognition or phoneme alignment. It does not record audio or call an AI model.
- Two sets of 27 WAV clips were generated using the installed Microsoft David and Zira voices. They are bundled under `public/narration/` and work offline. The speaking mouth and waveform are illustrative animations active during actual audio playback. Pausing, changing templates/voices, or issuing a command stops the previous audio from updating the diagram.
- Typed and finalized microphone commands are interpreted by a small local rule parser. They mutate the displayed scene immediately. This is not general natural-language understanding.
- Browser speech recognition may send audio to the browser vendor's service, may need internet, and is not supported in all browsers. No local Whisper or Silero service is included. Microphone capture is opt-in and never starts automatically.
- Invalid commands leave the current scene intact. Undo/redo is available through the previous/next controls. A new command after stepping backward starts a new history branch.
- Live commands stop example narration. Replaying after custom commands restores the selected guided example. Changing example or stepping through history stops microphone recognition to avoid unexpected input.
- Both themes are supported; the theme preference is the only data saved in localStorage. Transcripts and scene history exist only in the current page. No API credentials, backend, accounts, lecture storage, or measured performance claims.
- All five examples, narration files, and visual assets work without external fonts, image services, or CDNs after dependencies are installed and the application is built. Microphone recognition is the exception to offline behavior.

## Verification

Production build and 16 automated checks pass: scene operations, all example commands, WAV asset coverage, 4.5:1 text contrast in both themes, and audio progress/pause/resume/cancellation/failure handling. Local HTTP checks confirm the page and narration files are served. Browser visual inspection and speaker output have not been verified by automation because Chrome access was denied earlier in this session.

## Supported commands

| Example | Commands |
| --- | --- |
| Arrays / bubble sort | Create an array with 8, 3, 5; compare the first two; swap the second and third; highlight the largest number; insert 6 at position 2; delete the third element |
| Stacks | Create a stack with 2, 4; push 8; pop; highlight the top |
| Queues | Create a queue with 3, 5, 8; enqueue 2; dequeue; highlight the first element |
| Linked lists | Create a linked list with 10, 20, 30; insert 15 after the first node; delete the second node; visit the last node |

Numbers are limited to eight elements in the range -999 to 999 for readable showcase diagrams. Spoken positions are one-based; explicit `index 0` is zero-based. Number words zero through twelve and twenty/thirty/forty/fifty are recognized individually; arbitrary spoken compound numbers are not supported. Repeated values need position-based highlighting.

## Source provenance

Original source: sibling `mindstream/`, inspected at commit `d30af60`. `main.tsx`, TypeScript configuration, `theme.ts`, and `speech/useSpeechRecognition.ts` derive directly from that repository. The layout, `Controls`, `TranscriptPane`, and `ThoughtInput` are adapted for the LecViz showcase. SVG templates, example data, command validation and the demo timeline are new. The original repository is unchanged. Retain the original owner's permissions when redistributing adapted source; this prototype does not assign a new license to that source.

Speech API reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
