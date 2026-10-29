import { useEffect, useRef, useState } from 'react';
import './App.css';
import './demo/demo.css';
import { Controls } from './components/Controls';
import { SpeakingTeacher } from './components/SpeakingTeacher';
import { Icon } from './components/Icon';
import { SceneCanvas } from './scene/SceneCanvas';
import { emptyScene } from './scene/engine';
import type { Template } from './scene/engine';
import { NarrationPlayer } from './speech/narration';
import type { NarrationState } from './speech/narration';
import { applyTheme, getInitialTheme } from './theme';
import { ArchitectureDiagram, ArchitecturePayload } from './demo/ArchitectureDiagram';
import { WaterCycle } from './demo/WaterCycle';
import { lessons, voices } from './demo/lessons';
import type { ArchitectureNode, Lesson, LessonId } from './demo/lessons';
import { ProductWorkflow } from './demo/ProductWorkflow';

type View = Lesson['kind'] | 'workflow';
const tabs: { id: View; label: string; icon: string }[] = [
  { id: 'classroom', label: 'Classroom', icon: 'book' },
  { id: 'architecture', label: 'System architecture', icon: 'flow' },
  { id: 'workflow', label: 'Product workflow', icon: 'spark' },
  { id: 'science', label: 'Beyond IT', icon: 'sun' },
];

export default function App() {
  const [selected, setSelected] = useState<LessonId>('bubble');
  const [view, setView] = useState<View>('classroom');
  const lesson = lessons.find(item => item.id === selected)!;
  const remembered = useRef<Record<Lesson['kind'], LessonId>>({ classroom: 'bubble', architecture: 'architecture-valid', science: 'water' });
  const [cursor, setCursor] = useState(0);
  const [speech, setSpeech] = useState<{ index: number; fraction: number } | null>(null);
  const [narrationState, setNarrationState] = useState<NarrationState>('idle');
  const [speaker, setSpeaker] = useState<string>('aria');
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [error, setError] = useState('');
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const transcript = useRef<HTMLDialogElement>(null);
  const [narrator] = useState(() => new NarrationPlayer(url => new Audio(url), {
    state: setNarrationState,
    progress: (index, fraction) => setSpeech({ index, fraction }),
    reveal: index => setCursor(index + 1),
    error: setError,
  }));
  const active = narrationState === 'speaking' || narrationState === 'loading';
  const current = cursor > 0 ? lesson.steps[cursor - 1] : undefined;
  const activeStep = speech ? lesson.steps[speech.index] : current;
  const stop = () => { narrator.stop(); setSpeech(null); };
  const selectLesson = (id: LessonId) => {
    stop(); setCursor(0); setError(''); setSelected(id);
    const kind = lessons.find(item => item.id === id)!.kind;
    remembered.current[kind] = id; setView(kind);
  };
  const move = (next: number) => { stop(); setError(''); setCursor(Math.max(0, Math.min(next, lesson.steps.length))); };
  const play = (restart = false) => {
    setError('');
    if (!restart && active) { narrator.pause(); return; }
    if (!restart && narrationState === 'paused') { narrator.resume(); return; }
    const from = restart || cursor >= lesson.steps.length ? 0 : cursor;
    if (from === 0) setCursor(0);
    narrator.setRate(speed); narrator.setMuted(muted);
    narrator.start(lesson.steps.map((step, index) => ({ text: step.text, url: `/narration/${speaker}/${lesson.id}-${index + 1}.mp3` })), from);
  };
  const inspectNode = (node: ArchitectureNode) => {
    const index = lesson.steps.findIndex(step => step.architecture?.node === node);
    if (index >= 0) move(index + 1);
  };
  useEffect(() => () => narrator.stop(), [narrator]);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    if (transcriptOpen) transcript.current?.showModal(); else transcript.current?.close();
  }, [transcriptOpen]);
  useEffect(() => {
    const handler = () => setFullscreen(document.fullscreenElement === workspace.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (transcriptOpen || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [role=button], [contenteditable]'))) return;
      if (event.code === 'Space') { event.preventDefault(); play(); }
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
  const stateLabel = narrationState === 'paused' ? 'Paused' : narrationState === 'loading' ? 'Loading audio' : active ? 'Playing' : narrationState === 'ended' ? 'Complete' : 'Ready';
  const completedArchitecture = lesson.steps.slice(0, speech ? speech.index + 1 : cursor).flatMap(step => step.architecture ? [step.architecture.node] : []);

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); selectLesson('bubble'); }} aria-label="LecViz home"><span className="brand-mark"><Icon name="layers" size={26} /></span>Lec<span className="accent">Viz</span></a>
      <nav className="main-tabs" aria-label="Demonstration views">{tabs.map(tab => <button key={tab.id} className={view === tab.id ? 'main-tab active' : 'main-tab'} aria-current={view === tab.id ? 'page' : undefined} onClick={() => { if (tab.id === 'workflow') { stop(); setError(''); setView('workflow'); } else selectLesson(remembered.current[tab.id]); }}><Icon name={tab.icon} size={20} />{tab.label}</button>)}</nav>
      <button className="icon-button theme-toggle" title="Toggle theme" aria-label="Toggle color theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={23} /></button>
    </header>
    <main>
      {view !== 'workflow' && <div className="lesson-switcher">
        {lesson.kind === 'classroom' && <Controls selected={selected as Template} onSelect={selectLesson} />}
        {lesson.kind === 'architecture' && <div className="kind-picker" role="group" aria-label="Architecture path"><button className={`kind-btn ${selected === 'architecture-valid' ? 'kind-active' : ''}`} aria-pressed={selected === 'architecture-valid'} onClick={() => selectLesson('architecture-valid')}><Icon name="check" size={18} />Valid event</button><button className={`kind-btn ${selected === 'architecture-error' ? 'kind-active' : ''}`} aria-pressed={selected === 'architecture-error'} onClick={() => selectLesson('architecture-error')}><Icon name="shield" size={18} />Uncertain event</button></div>}
        {lesson.kind === 'science' && <div className="science-heading"><span className="science-badge"><Icon name="drop" size={20} />Earth science</span><span>Water cycle + rainfall</span></div>}
        <span className="lesson-mode">{lesson.kind === 'architecture' ? 'Illustrated pipeline' : 'Narrated example'}</span>
      </div>}
      {view === 'workflow' ? <ProductWorkflow /> : <section className={`classroom ${lesson.kind === 'architecture' ? 'architecture-mode' : ''} ${lesson.kind === 'science' ? 'science-mode' : ''} ${fullscreen ? 'is-fullscreen' : ''}`} ref={workspace} aria-label={`${lesson.title} demonstration`}>
        <div className="canvas-panel">
          <div className="canvas-heading"><h1>{lesson.title}</h1><div className="canvas-tools"><span className={`status-pill ${active ? 'running' : ''}`}><i />{stateLabel}</span><button className="icon-button" title="Fullscreen" aria-label="Fullscreen classroom" onClick={toggleFullscreen}><Icon name="expand" size={23} /></button></div></div>
          <div className="canvas-wrap">
            {lesson.kind === 'classroom' && <SceneCanvas scene={current?.scene ?? emptyScene(selected as Template)} slow={speed < 1} />}
            {lesson.kind === 'architecture' && <ArchitectureDiagram frame={activeStep?.architecture} progress={speech?.fraction ?? 1} running={narrationState === 'speaking'} visited={completedArchitecture} onSelect={inspectNode} />}
            {lesson.kind === 'science' && <WaterCycle stage={current?.waterStage ?? 0} running={narrationState === 'speaking'} />}
            {current && lesson.kind === 'classroom' && <div className={`action-chip action-${current.scene?.mode}`}><Icon name={current.scene?.mode === 'compare' ? 'info' : 'check'} size={20} />{current.note}</div>}
          </div>
          <div className="canvas-bottom"><div className="step-dots" role="group" aria-label="Example steps">{lesson.steps.map((step, index) => <button key={`${selected}-${index}`} className={`${index < cursor ? 'done' : ''} ${index + 1 === cursor ? 'current' : ''}`} aria-label={`Step ${index + 1}: ${step.note}`} aria-current={index + 1 === cursor ? 'step' : undefined} onClick={() => move(index + 1)} />)}</div><span className="step-count">{cursor} / {lesson.steps.length}</span>{lesson.kind === 'science' && <a className="science-source" href="https://www.usgs.gov/water-science-school/water-cycle" target="_blank" rel="noreferrer">USGS ↗</a>}</div>
        </div>
        <aside className="thoughts-panel">
          <div className="speaker-controls"><label className="voice-select"><Icon name="volume" size={20} /><select aria-label="Example voice" value={speaker} onChange={event => { setSpeaker(event.target.value); selectLesson(selected); }}>{voices.map(voice => <option key={voice.id} value={voice.id}>{voice.name}</option>)}</select></label><button className="icon-button" aria-label={muted ? 'Unmute narration' : 'Mute narration'} aria-pressed={muted} onClick={() => { narrator.setMuted(!muted); setMuted(!muted); }}><Icon name={muted ? 'muted' : 'volume'} size={22} /></button></div>
          <SpeakingTeacher speaking={narrationState === 'speaking'} voice={speaker} fraction={speech?.fraction ?? (cursor > 0 ? 1 : 0)} text={activeStep?.text ?? ''} />
          {lesson.kind === 'architecture' && <ArchitecturePayload frame={activeStep?.architecture} />}
        </aside>
        <div className="playback">
          <div className="playback-secondary"><button className="icon-button" aria-label="Restart example" title="Replay from the beginning" onClick={() => play(true)}><Icon name="replay" size={23} /></button><select className="speed-select" aria-label="Playback speed" value={speed} onChange={event => { const next = Number(event.target.value); setSpeed(next); narrator.setRate(next); }}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option></select></div>
          <div className="playback-buttons"><button className="icon-button step-button" aria-label="Previous step" disabled={cursor === 0} onClick={() => move(cursor - 1)}><Icon name="back" size={24} /></button><button className="play-button" onClick={() => play()} aria-label={active ? 'Pause example' : narrationState === 'paused' ? 'Resume example' : 'Play example'}><Icon name={active ? 'pause' : 'play'} size={24} />{active ? 'Pause' : narrationState === 'paused' ? 'Resume' : cursor === lesson.steps.length ? 'Replay' : 'Play example'}</button><button className="icon-button step-button" aria-label="Next step" disabled={cursor >= lesson.steps.length} onClick={() => move(cursor + 1)}><Icon name="next" size={24} /></button></div>
          <button className="transcript-button" onClick={() => setTranscriptOpen(true)} disabled={cursor === 0}><Icon name="book" size={20} />Transcript</button>
        </div>
        <dialog ref={transcript} onCancel={() => setTranscriptOpen(false)} onClick={event => { if (event.target === event.currentTarget) setTranscriptOpen(false); }}><div className="modal-head"><h2>Transcript</h2><button className="icon-button" aria-label="Close transcript" onClick={() => setTranscriptOpen(false)}><Icon name="close" size={23} /></button></div><div className="transcript-history">{lesson.steps.slice(0, cursor).map((step, index) => <p key={index}><span>{index + 1}</span>{step.text}</p>)}</div></dialog>
      </section>}
      {error && <div className="error-banner" role="alert"><Icon name="info" size={22} /><span>{error}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setError('')}><Icon name="close" size={20} /></button></div>}
    </main>
  </div>;
}
