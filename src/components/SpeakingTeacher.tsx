import { Icon } from './Icon';
export function SpeakingTeacher({ speaking, voice, fraction, text }: { speaking: boolean; voice: string; fraction: number; text: string }) {
  const words = text.split(' ');
  const spoken = speaking ? Math.ceil(words.length * fraction) : fraction >= 1 ? words.length : 0;
  return <div className={`teacher ${speaking ? 'is-speaking' : ''}`}>
    <div className="avatar-stage">
      <div className="voice-orbit orbit-one" /><div className="voice-orbit orbit-two" />
      <svg className="teacher-avatar" viewBox="0 0 200 200" role="img" aria-label={speaking ? 'Teacher speaking' : 'Teacher'}>
        <defs><clipPath id="avatar-clip"><circle cx="100" cy="100" r="96" /></clipPath></defs>
        <g clipPath="url(#avatar-clip)">
          <circle cx="100" cy="100" r="96" fill="var(--avatar-bg)" />
          {voice === 'aria' && <path d="M49 128V68Q50 20 100 24q52 0 53 49v63Z" fill="#30253c" />}
          <path d="M31 205v-30q5-39 49-42h40q44 4 49 42v30" fill="var(--avatar-shirt)" />
          <path d="m83 132 17 21 17-21v-27H83Z" fill="#dc9d78" />
          <path d="m80 134 20 19-14 17-16-31m50-5-20 19 14 17 16-31" fill="#f9fafc" />
          <path d="m96 157-3 40h14l-3-40" fill="#40326c" />
          <g className="avatar-head">
            <ellipse cx="59" cy="89" rx="8" ry="12" fill="#edb38e" /><ellipse cx="141" cy="89" rx="8" ry="12" fill="#edb38e" />
            <path d="M59 67q0-39 41-39t41 39v30q-3 38-41 40-38-2-41-40Z" fill="#f3be98" />
            <path d={voice === 'aria' ? 'M55 80V59q4-35 45-34 44 0 46 39l-1 23q-22-12-32-36-24 25-58 29Z' : 'M56 76V58q5-35 44-32 38-6 45 27l-5 27-11-26q-28 17-58 2l-7 25Z'} fill="#30253c" />
            <path d="M71 78q9-5 17-1m24 0q9-4 17 1" stroke="#634233" strokeWidth="3" strokeLinecap="round" fill="none" />
            <g className="avatar-eyes"><ellipse cx="80" cy="89" rx="4" ry="5" fill="#30253c" /><ellipse cx="120" cy="89" rx="4" ry="5" fill="#30253c" /></g>
            <path d="m100 91-3 12h6" stroke="#cf8d68" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse className="speaking-mouth" cx="100" cy="116" rx="10" ry="3" fill="#703e45" />
            <path className="resting-smile" d="M90 113q10 10 20 0" stroke="#703e45" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="68" cy="104" r="6" fill="#e69a82" opacity=".5" /><circle cx="132" cy="104" r="6" fill="#e69a82" opacity=".5" />
          </g>
          <path d="M54 87q-9-48 46-51 56 0 48 51" fill="none" stroke="#4b4161" strokeWidth="6" />
          <rect x="48" y="78" width="11" height="26" rx="5" fill="#4b4161" /><rect x="142" y="78" width="11" height="26" rx="5" fill="#4b4161" />
          <path d="M147 101q0 18-28 19" fill="none" stroke="#4b4161" strokeWidth="4" /><rect x="112" y="116" width="13" height="7" rx="3.5" fill="#4b4161" />
        </g>
      </svg>
      <span className="speaker-badge"><Icon name="volume" size={21} /></span>
    </div>
    <div className="teacher-status"><span className="sound-bars" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />)}</span><span>{speaking ? 'Speaking' : 'Neural narration'}</span></div>
    <p className="live-sentence" aria-live="polite">{text ? words.map((word, i) => <span className={i < spoken ? 'spoken-word' : ''} key={`${i}-${word}`}>{word}{' '}</span>) : 'Press play'}</p>
  </div>;
}
