// Mindstream's transcript panel, extended with synchronized example history.
import { useEffect, useRef } from 'react';
import type { Frame } from '../scene/engine';
import { Icon } from './Icon';
export function TranscriptPane({ frames, interim, listening, playing }: { frames: Frame[]; interim: string; listening: boolean; playing: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [frames.length, interim]);
  return <div className="transcript-pane"><div className="transcript-header"><span><Icon name="mic" size={17} /> Live transcript</span><span className={`transcript-status ${listening || playing ? 'active' : ''}`}>{listening ? 'MIC ON' : playing ? 'PLAYING' : 'READY'}</span></div>
    <div className="transcript-body" ref={body} aria-live="polite" aria-relevant="additions text">
      {!frames.length && !interim && <div className="transcript-empty"><Icon name="mic" size={28} /><p>Every explanation<br />starts with a few words.</p><small>Play an example or try a command.</small></div>}
      {frames.map((frame, i) => <div className={`transcript-entry ${i === frames.length - 1 && !interim ? 'latest' : ''}`} key={`${i}-${frame.text}`}><div className="entry-meta"><span>{frame.source === 'example' ? 'EXAMPLE TEACHER' : frame.source === 'voice' ? 'MICROPHONE' : 'YOU'}</span><time>{frame.time}</time></div><p>{frame.text}</p><span className="entry-event"><Icon name="check" size={12} />{frame.note}</span></div>)}
      {interim && <div className="transcript-entry interim-entry"><div className="entry-meta"><span>{listening ? 'LISTENING' : 'EXAMPLE TEACHER'}</span><span className="typing-dots">•••</span></div><p>{interim}<span className="caret" /></p></div>}
    </div><div className="transcript-foot"><span className="small-dot" />{listening ? 'Browser speech · finalized commands only' : 'Guided transcript · illustrative playback'}</div>
  </div>;
}
