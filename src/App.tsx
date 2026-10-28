import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './App.css';
import { Controls } from './components/Controls';
import { ThoughtInput } from './components/ThoughtInput';
import { SpeakingTeacher } from './components/SpeakingTeacher';
import { Icon } from './components/Icon';
import { SceneCanvas } from './scene/SceneCanvas';
import { applyActions, exampleFrames, examples, interpretCommand } from './scene/engine';
import type { Frame, Template } from './scene/engine';
import { useSpeechRecognition } from './speech/useSpeechRecognition';
import { NarrationPlayer } from './speech/narration';
import type { NarrationState } from './speech/narration';
import { applyTheme, getInitialTheme } from './theme';

type Timeline = { frames: Frame[]; cursor: number };
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" size={23} /></button></div>{children}
  </dialog>;
}

export default function App() {
  const [selected, setSelected] = useState<Template>('bubble');
  const example = examples.find(item => item.id === selected)!;
  const [timeline, setTimeline] = useState<Timeline>(() => ({ frames: exampleFrames(examples[0]), cursor: 0 }));
  const timelineRef = useRef(timeline);
  const sequenceRef = useRef(timeline.frames);
  const updateTimeline = useCallback((next: Timeline) => { timelineRef.current = next; setTimeline(next); }, []);
  const { frames, cursor } = timeline;
  const current = frames[cursor];
  const [narrationState, setNarrationState] = useState<NarrationState>('idle');
  const [speech, setSpeech] = useState<{ index: number; fraction: number } | null>(null);
  const [speaker, setSpeaker] = useState('zira');
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [modal, setModal] = useState<'voice' | 'commands' | 'transcript' | null>(null);
  const [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const startedAt = useRef(Date.now());
  const [narrator] = useState(() => new NarrationPlayer(url => new Audio(url), {
    state: setNarrationState,
    progress: (index, fraction) => setSpeech({ index, fraction }),
    reveal: index => updateTimeline({ frames: sequenceRef.current, cursor: index + 1 }),
    error: setError,
  }));
  const active = narrationState === 'speaking' || narrationState === 'loading';
  const stopNarration = useCallback(() => { narrator.stop(); setSpeech(null); }, [narrator]);
  useEffect(() => () => narrator.stop(), [narrator]);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    const handler = () => setFullscreen(document.fullscreenElement === workspace.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const submit = useCallback((text: string, source: 'typed' | 'voice' = 'typed') => {
    stopNarration();
    const old = timelineRef.current;
    try {
      const actions = interpretCommand(text, old.frames[old.cursor].scene);
      const next = applyActions(old.frames[old.cursor].scene, actions);
      setSelected(next.template);
      const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
      const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      const nextFrames = old.frames.slice(0, old.cursor + 1);
      nextFrames.push({ scene: next, text, note: actions.map(action => action.type).join(' → '), source, time });
      updateTimeline({ frames: nextFrames, cursor: nextFrames.length - 1 });
      setError(''); return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Command could not be applied.'); return false; }
  }, [stopNarration, updateTimeline]);
  const voice = useSpeechRecognition(text => submit(text, 'voice'));

  const selectExample = (id: Template) => {
    voice.stop(); voice.reset(); stopNarration(); setError(''); setSelected(id);
    updateTimeline({ frames: exampleFrames(examples.find(item => item.id === id)!), cursor: 0 });
    startedAt.current = Date.now();
  };
  const move = (next: number) => {
    voice.stop(); stopNarration(); setError('');
    updateTimeline({ frames, cursor: Math.max(0, Math.min(next, frames.length - 1)) });
  };
  const startSequence = (restart = false) => {
    voice.stop(); setError('');
    if (!restart && active) { narrator.pause(); return; }
    if (!restart && narrationState === 'paused') { narrator.resume(); return; }
    let nextFrames = frames, nextCursor = cursor;
    if (restart || cursor >= frames.length - 1 || frames.some(frame => frame.source !== 'example')) {
      nextFrames = exampleFrames(example); nextCursor = 0;
      updateTimeline({ frames: nextFrames, cursor: 0 });
    }
    sequenceRef.current = nextFrames;
    narrator.setRate(speed); narrator.setMuted(muted);
    narrator.start(nextFrames.slice(1).map((frame, index) => ({ text: frame.text, url: `/narration/${speaker}/${selected}-${index + 1}.wav` })), nextCursor);
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (modal || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, a, [contenteditable]'))) return;
      if (event.code === 'Space') { event.preventDefault(); startSequence(); }
      if (event.code === 'ArrowRight') { event.preventDefault(); move(cursor + 1); }
      if (event.code === 'ArrowLeft') { event.preventDefault(); move(cursor - 1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await workspace.current?.requestFullscreen(); }
    catch { setError('Fullscreen unavailable. Maximize the browser window instead.'); }
  };
  const sentence = voice.listening && voice.interimTranscript ? voice.interimTranscript : speech ? sequenceRef.current[speech.index + 1]?.text ?? '' : current.text;
  const stateLabel = voice.listening ? 'Listening' : narrationState === 'paused' ? 'Paused' : narrationState === 'loading' ? 'Loading audio' : active ? 'Playing' : narrationState === 'ended' ? 'Complete' : 'Ready';

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); selectExample('bubble'); }} aria-label="LecViz home"><span className="brand-mark"><Icon name="layers" size={26} /></span>Lec<span className="accent">Viz</span></a>
      <Controls selected={selected} onSelect={selectExample} />
      <button className="icon-button theme-toggle" title="Toggle theme" aria-label="Toggle color theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={23} /></button>
    </header>
    <main>
      <section className={`classroom ${fullscreen ? 'is-fullscreen' : ''}`} ref={workspace} aria-label="Live classroom">
        <div className="canvas-panel">
          <div className="canvas-heading"><h1>{example.label}</h1><div className="canvas-tools"><span className={`status-pill ${active || voice.listening ? 'running' : ''}`}><i />{stateLabel}</span><button className="icon-button" title="Fullscreen" aria-label="Fullscreen classroom" onClick={toggleFullscreen}><Icon name="expand" size={23} /></button></div></div>
          <div className="canvas-wrap"><SceneCanvas scene={current.scene} slow={speed < 1} />
            {cursor > 0 && <div className={`action-chip action-${current.scene.mode}`}><Icon name={current.scene.mode === 'compare' ? 'info' : 'check'} size={20} />{current.note}</div>}
          </div>
          <div className="canvas-bottom"><div className="step-dots" role="group" aria-label="Example steps">{frames.slice(1).map((frame, index) => <button key={index} className={`${index < cursor ? 'done' : ''} ${index + 1 === cursor ? 'current' : ''}`} aria-label={`Step ${index + 1}: ${frame.note}`} aria-current={index + 1 === cursor ? 'step' : undefined} onClick={() => move(index + 1)} />)}</div><span className="step-count">{cursor} / {frames.length - 1}</span></div>
        </div>
        <aside className="thoughts-panel">
          <div className="speaker-controls"><label className="voice-select"><Icon name="volume" size={20} /><select aria-label="Example voice" value={speaker} onChange={event => { setSpeaker(event.target.value); selectExample(selected); }}><option value="zira">Zira</option><option value="david">David</option></select></label><button className="icon-button" aria-label={muted ? 'Unmute narration' : 'Mute narration'} aria-pressed={muted} onClick={() => { narrator.setMuted(!muted); setMuted(!muted); }}><Icon name={muted ? 'muted' : 'volume'} size={22} /></button></div>
          <SpeakingTeacher speaking={narrationState === 'speaking'} listening={voice.listening} voice={speaker} fraction={speech?.fraction ?? (cursor > 0 ? 1 : 0)} text={sentence} />
          <button className="transcript-link" onClick={() => setModal('transcript')} disabled={cursor === 0}>Transcript<Icon name="arrow" size={17} /></button>
        </aside>
        <div className="playback">
          <div className="playback-secondary"><button className="icon-button" aria-label="Restart example" title="Replay from the beginning" onClick={() => startSequence(true)}><Icon name="replay" size={23} /></button><select className="speed-select" aria-label="Playback speed" value={speed} onChange={event => { const next = Number(event.target.value); setSpeed(next); narrator.setRate(next); }}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option></select></div>
          <div className="playback-buttons"><button className="icon-button step-button" aria-label="Previous step" disabled={cursor === 0} onClick={() => move(cursor - 1)}><Icon name="back" size={24} /></button><button className="play-button" onClick={() => startSequence()} aria-label={active ? 'Pause example' : narrationState === 'paused' ? 'Resume example' : 'Play example'}><Icon name={active ? 'pause' : 'play'} size={24} />{active ? 'Pause' : narrationState === 'paused' ? 'Resume' : cursor === frames.length - 1 ? 'Replay' : 'Play example'}</button><button className="icon-button step-button" aria-label="Next step" disabled={cursor >= frames.length - 1} onClick={() => move(cursor + 1)}><Icon name="next" size={24} /></button></div>
          <button className={`mic-btn ${voice.listening ? 'mic-on' : ''}`} onClick={() => { stopNarration(); if (voice.listening) voice.stop(); else setModal('voice'); }}><Icon name={voice.listening ? 'stop' : 'mic'} size={22} />{voice.listening ? 'Stop mic' : 'Use mic'}</button>
        </div>
      </section>
      {(error || voice.error) && <div className="error-banner" role="alert"><Icon name="info" size={22} /><span>{error || voice.error}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => { setError(''); voice.reset(); }}><Icon name="close" size={20} /></button></div>}
      <div className="command-bar"><ThoughtInput onSubmit={text => submit(text)} disabled={false} /><button className="commands-button" onClick={() => setModal('commands')}>Commands<Icon name="book" size={20} /></button></div>
    </main>
    {modal === 'voice' && <Modal title="Use your microphone" onClose={() => setModal(null)}><p>Speak a command such as “Swap the first two.” Browser recognition may send audio to its speech service.</p>{!voice.supported && <p>Speech recognition is unavailable here. Use Chrome or Edge, or type a command.</p>}<button className="primary-button" disabled={!voice.supported} onClick={() => { setModal(null); voice.start(); }}>Start microphone<Icon name="mic" size={22} /></button></Modal>}
    {modal === 'commands' && <Modal title="Try a command" onClose={() => setModal(null)}><div className="prompt-list">{example.prompts.map(prompt => <button key={prompt} onClick={() => { submit(prompt); setModal(null); }}>{prompt}<Icon name="arrow" size={20} /></button>)}</div></Modal>}
    {modal === 'transcript' && <Modal title="Transcript" onClose={() => setModal(null)}><div className="transcript-history">{frames.slice(1, cursor + 1).map((frame, index) => <p key={index}><span>{index + 1}</span>{frame.text}</p>)}</div></Modal>}
  </div>;
}
