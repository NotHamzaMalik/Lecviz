import type { Scene } from './engine';
export function SceneCanvas({ scene, slow }: { scene: Scene; slow: boolean }) {
  const stack = scene.template === 'stack', linked = scene.template === 'linked', queue = scene.template === 'queue';
  const n = scene.items.length;
  const gap = linked ? 138 : 112;
  const width = Math.max(520, n * gap + (linked ? 140 : 60));
  const start = (width - n * gap) / 2 + gap / 2;
  const stackGap = Math.min(53, 300 / Math.max(n, 1));
  const top = 315 - (n - 1) * stackGap;
  return <svg className={`scene-svg ${slow ? 'slow' : ''}`} viewBox={`0 ${stack ? 0 : 80} ${width} ${stack ? 410 : 250}`} role="img" aria-label={`${scene.template} visualization: ${scene.items.map(item => item.value).join(', ') || 'empty'}`}>
    <defs><marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7" fill="var(--muted)" /></marker><filter id="tile-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#353070" floodOpacity=".07" /></filter></defs>
    {!n && <g className="empty-scene">{[-108, 0, 108].map(offset => <rect key={offset} x={width / 2 + offset - 43} y="156" width="86" height="84" rx="15" />)}</g>}
    {stack && n > 0 && <g><path d={`M${width / 2 - 78} ${Math.min(top - 30, 155)}V350h156V${Math.min(top - 30, 155)}`} className="stack-bracket" /><text x={width / 2} y="380" textAnchor="middle" className="svg-muted">BOTTOM</text><g className="moving" style={{ transform: `translate(${width / 2 + 100}px, ${top}px)` }}><path d="M55 0H5" className="pointer-line" /><text x="65" y="5" className="svg-accent">TOP</text></g></g>}
    {!stack && n > 0 && <line x1={start - 52} x2={start + (n - 1) * gap + 52} y1="270" y2="270" className="baseline" />}
    {linked && scene.items.slice(0, -1).map((item, index) => <path key={`edge-${item.id}`} d={`M${start + index * gap + 53} 198h${gap - 70}`} className="pointer-line" />)}
    {linked && n > 0 && <g><text x={start} y="120" textAnchor="middle" className="svg-accent">HEAD</text><path d={`M${start} 131v20`} className="pointer-line" /><path d={`M${start + (n - 1) * gap + 53} 198h30`} className="pointer-line" /><text x={start + (n - 1) * gap + 95} y="203" className="svg-muted" fontSize="13">null</text></g>}
    {queue && n > 0 && <g><text x={start} y="134" textAnchor="middle" className="svg-accent">FRONT</text><text x={start + (n - 1) * gap} y={n === 1 ? 115 : 134} textAnchor="middle" className="svg-muted">REAR</text><path d={`M${start - 85} 198h-37`} className="pointer-line" /></g>}
    {scene.items.map((item, index) => {
      const active = scene.active.includes(item.id);
      const x = stack ? width / 2 : start + index * gap;
      const y = stack ? 315 - index * stackGap : 198;
      return <g key={item.id} className={`moving tile ${active ? `selected ${scene.mode}` : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
        <rect x={stack ? -62 : linked ? -48 : -43} y={stack ? -21 : -42} width={stack ? 124 : linked ? 100 : 86} height={stack ? 42 : 84} rx={stack ? 10 : 15} filter="url(#tile-shadow)" />
        {linked && <line x1="18" x2="18" y1="-41" y2="41" className="node-divider" />}
        <text x={linked ? -14 : 0} y={stack ? 8 : 12} textAnchor="middle" className="tile-value" fontSize={stack ? 27 : 36}>{item.value}</text>
        {linked && <circle cx="35" cy="0" r="4" className="node-dot" />}
        {!stack && <text x="0" y="95" textAnchor="middle" className="index-label">{linked ? `node ${index + 1}` : `[${index}]`}</text>}
        {active && !stack && <circle cx="0" cy="-57" r="3" className="active-indicator" />}
      </g>;
    })}
  </svg>;
}
