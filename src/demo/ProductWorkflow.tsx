import type { CSSProperties } from 'react';
import { Icon } from '../components/Icon';

const stages = [
  { number: '01', icon: 'mic', eyebrow: 'INPUT', title: 'Teacher speaks', detail: 'Live microphone audio', signal: 'Voice' },
  { number: '02', icon: 'wave', eyebrow: 'LISTEN + TRANSCRIBE', title: 'Silero VAD + Faster-Whisper', detail: 'Detect speech and generate transcript', signal: 'Text' },
  { number: '03', icon: 'spark', eyebrow: 'UNDERSTAND', title: 'DeepSeek V4 Flash', detail: 'Understand topic, intent, objects and actions', signal: 'Intent' },
  { number: '04', icon: 'shield', eyebrow: 'CHECK + APPLY', title: 'JSON validation + scene manager', detail: 'Check correctness, resolve references, preserve state', signal: 'Scene' },
  { number: '05', icon: 'flow', eyebrow: 'OUTPUT', title: 'Live animated visualization', detail: 'React Flow / SVG / browser animations', signal: 'Visual' },
];

export function ProductWorkflow() {
  return <section className="workflow-card" aria-label="Animated LecViz product workflow">
    <header className="workflow-heading"><div><span className="workflow-kicker">FROM SPEECH TO SCENE</span><h1>Product workflow</h1></div><div className="workflow-live"><i />Animated walkthrough</div></header>
    <div className="workflow-flow" role="list">
      {stages.map((stage, index) => <div className="workflow-unit" key={stage.title}>
        <article className="workflow-stage" role="listitem" style={{ '--stage': index } as CSSProperties}>
          <div className="workflow-stage-top"><span>{stage.number}</span><span className="workflow-icon"><Icon name={stage.icon} size={27} /></span></div>
          <span className="workflow-eyebrow">{stage.eyebrow}</span><h2>{stage.title}</h2><p>{stage.detail}</p>
          <div className="workflow-processing"><i /><i /><i /><span>processing</span></div>
        </article>
        {index < stages.length - 1 && <div className="workflow-connector" aria-hidden="true" style={{ '--stage': index } as CSSProperties}><span className="workflow-signal">{stage.signal}</span><i /><Icon name="arrow" size={23} /></div>}
      </div>)}
    </div>
    <footer className="workflow-result"><Icon name="check" size={22} /><span><strong>One continuous loop</strong> — speech becomes a checked scene update, then the browser draws the explanation.</span></footer>
  </section>;
}
