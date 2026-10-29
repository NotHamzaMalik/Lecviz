import { rainfall } from './lessons';

export function WaterCycle({ stage, running }: { stage: number; running: boolean }) {
  const graph = stage >= 7;
  return <div className={`water-layout ${graph ? 'with-graph' : ''} ${running ? 'is-running' : ''}`}>
    <svg className="water-landscape" viewBox="0 0 780 500" role="img" aria-label={`Water cycle: ${['ready', 'solar energy', 'evaporation', 'condensation', 'precipitation', 'runoff', 'infiltration'][Math.min(stage, 6)]}`}>
      <defs>
        <linearGradient id="water-sky" x2="0" y2="1"><stop stopColor="var(--science-sky)" /><stop offset="1" stopColor="var(--canvas)" /></linearGradient>
        <linearGradient id="water-lake" x2="0" y2="1"><stop stopColor="#53b8e4" /><stop offset="1" stopColor="#2580bd" /></linearGradient>
        <marker id="water-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="var(--science-blue)" /></marker>
      </defs>
      <rect x="10" y="10" width="760" height="475" rx="22" fill="url(#water-sky)" />
      <path d="M10 320Q170 300 290 334L510 202 650 310 770 260V485H10Z" fill="var(--science-land)" />
      <path d="m365 320 145-118 140 108-133-83Z" fill="var(--science-mountain)" />
      <path d="m470 235 40-33 39 33-24-7-15 10-17-12Z" fill="#f3f8fc" />
      <path d="M10 386Q155 356 280 388T540 393T770 373V485H10Z" fill="var(--science-soil)" />
      <path d="M10 335Q82 317 155 338t140-1l26 50q-107 40-311 0Z" fill="url(#water-lake)" />
      <path className="lake-wave" d="M31 358q24-10 48 0t48 0t48 0t48 0M79 379q24-10 48 0t48 0t48 0" fill="none" stroke="#d5f5ff" strokeWidth="3" opacity=".7" />
      <g className={`water-stage ${stage >= 1 ? 'visible' : ''}`}>
        <g className="sun-rays">{Array.from({ length: 12 }, (_, i) => <line key={i} x1="116" y1="49" x2="116" y2="35" transform={`rotate(${i * 30} 116 95)`} stroke="#f4b737" strokeWidth="5" strokeLinecap="round" />)}</g>
        <circle cx="116" cy="95" r="33" fill="#ffd265" stroke="#e9aa27" strokeWidth="2" />
        <text x="116" y="171" textAnchor="middle" className="water-label">Sun</text>
      </g>
      <g className={`water-stage ${stage >= 2 ? 'visible' : ''}`}>
        {[116, 168, 220].map((x, i) => <path key={x} className="vapor-trail" style={{ animationDelay: `${i * -.6}s` }} d={`M${x} 308q-19-26 0-50t0-50`} />)}
        <path className="water-flow" d="M260 280Q290 190 392 143" markerEnd="url(#water-arrow)" />
        <text x="260" y="210" className="water-label">Evaporation</text>
      </g>
      <g className={`water-stage cloud ${stage >= 3 ? 'visible' : ''}`}>
        <path d="M414 143a30 30 0 0 1-5-59 43 43 0 0 1 80-18 34 34 0 0 1 54 28 25 25 0 0 1-2 49Z" fill="var(--science-cloud)" stroke="var(--science-cloud-edge)" strokeWidth="2" />
        <text x="472" y="46" textAnchor="middle" className="water-label">Condensation</text>
      </g>
      <g className={`water-stage ${stage >= 4 ? 'visible' : ''}`}>
        {[425, 455, 485, 515, 540].map((x, i) => <g key={x} className="rain-drop" style={{ animationDelay: `${i * -.27}s` }}><path d={`M${x} 157l-8 17`} stroke="var(--science-blue)" strokeWidth="4" strokeLinecap="round" /></g>)}
        <text x="567" y="182" className="water-label">Precipitation</text>
      </g>
      <g className={`water-stage ${stage >= 5 ? 'visible' : ''}`}>
        <path d="M535 255q-70 35-87 55t-64 30-81 27" stroke="#389ad2" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path className="water-flow runoff-flow" d="M535 255q-70 35-87 55t-64 30-81 27" />
        <text x="420" y="378" className="water-label">Runoff</text>
      </g>
      <g className={`water-stage ${stage >= 6 ? 'visible' : ''}`}>
        <path className="water-flow" d="M650 320v96q-170 45-340 8" markerEnd="url(#water-arrow)" />
        <text x="660" y="349" textAnchor="middle" className="water-label">Infiltration</text>
        <text x="453" y="467" textAnchor="middle" className="water-label">Groundwater</text>
      </g>
      <text x="159" y="430" textAnchor="middle" className="water-label">Lake</text>
    </svg>
    {graph && <div className="rainfall-panel"><div className="rainfall-heading"><h2>Rainfall</h2><span>Illustrative · mm</span></div>
      <svg viewBox="0 0 420 430" className="rainfall-chart" role="img" aria-label={`Illustrative rainfall: ${rainfall.slice(0, stage - 6).map((n, i) => `day ${i + 1}: ${n} millimeters`).join(', ')}`}>
        {[0, 10, 20, 30].map(value => <g key={value}><line x1="52" x2="398" y1={342 - value * 8} y2={342 - value * 8} className="graph-grid" /><text x="38" y={348 - value * 8} textAnchor="end" className="graph-axis">{value}</text></g>)}
        {rainfall.map((value, i) => { const shown = stage >= 7 + i; return <g key={i}><rect className={`rainfall-bar ${stage === 7 + i ? 'bar-active' : ''}`} x={76 + i * 110} y={342 - (shown ? value * 8 : 0)} width="64" height={shown ? value * 8 : 0} rx="9" />{shown && <text className="graph-value" x={108 + i * 110} y={327 - value * 8} textAnchor="middle">{value}</text>}<text className="graph-axis" x={108 + i * 110} y="379" textAnchor="middle">Day {i + 1}</text></g>; })}
        {stage >= 9 && <text x="223" y="423" className="graph-total" textAnchor="middle">Total: 60 mm</text>}
      </svg>
    </div>}
  </div>;
}
