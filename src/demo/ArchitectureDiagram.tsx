import { architectureNodes, architectureRoutes, pointOnRoute } from './lessons';
import type { ArchitectureFrame, ArchitectureNode, ArchitectureRoute } from './lessons';

export function ArchitectureDiagram({ frame, progress, running, visited, onSelect }: {
  frame?: ArchitectureFrame; progress: number; running: boolean;
  visited: ArchitectureNode[]; onSelect: (node: ArchitectureNode) => void;
}) {
  const route = frame?.route ? architectureRoutes[frame.route] : null;
  const point = route ? pointOnRoute(route.points, progress) : null;
  return <div className={`architecture-diagram ${running ? 'is-running' : ''}`}>
    <svg viewBox="0 0 1100 572" className="architecture-svg" role="img" aria-label="System architecture: teacher microphone to Python FastAPI backend, validation, frontend scene manager, renderer and animated output. Rejected events go to error handling and teacher controls.">
      <defs><marker id="flow-arrow" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="var(--secondary)" /></marker><marker id="flow-arrow-active" viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="9" refY="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="var(--accent)" /></marker></defs>
      <rect className="architecture-group" x="250" y="12" width="374" height="549" rx="14" />
      <rect className="architecture-group" x="698" y="12" width="374" height="549" rx="14" />
      <text className="architecture-group-title" x="267" y="42">BACKEND | Python / FastAPI</text>
      <text className="architecture-group-title" x="715" y="42">FRONTEND | Browser (HTML, CSS, JS)</text>
      {(Object.entries(architectureRoutes) as [ArchitectureRoute, typeof architectureRoutes[ArchitectureRoute]][]).map(([id, item]) => {
        const active = frame?.route === id;
        const [first, last] = [item.points[0], item.points[item.points.length - 1]];
        const middleX = (first[0] + last[0]) / 2, middleY = (first[1] + last[1]) / 2;
        return <g key={id} className={`flow-route ${active ? 'route-active' : ''} ${id === 'rejected' ? 'route-rejected' : ''}`}>
          <polyline className={`flow-line ${item.dashed ? 'flow-dashed' : ''}`} points={item.points.map(p => p.join(',')).join(' ')} markerEnd={`url(#flow-arrow${active ? '-active' : ''})`} />
          {item.label && <text className="flow-label" x={id === 'rejected' ? middleX + 12 : middleX} y={id === 'rejected' ? middleY + 5 : middleY - 12} textAnchor={id === 'rejected' ? 'start' : 'middle'}>{item.label}</text>}
        </g>;
      })}
      {architectureNodes.map(node => {
        const active = frame?.node === node.id;
        return <g key={node.id} role="button" tabIndex={0} aria-label={`Inspect ${node.title}`} aria-pressed={active} onClick={() => onSelect(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSelect(node.id); } }} className={`architecture-node ${visited.includes(node.id) ? 'node-visited' : ''} ${active ? 'node-active' : ''} ${active && frame?.verdict === 'rejected' ? 'node-rejected' : ''}`}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="9" />
          <text x={node.x + 16} y={node.y + 24} className="architecture-category">{node.category}</text>
          <text x={node.x + 16} y={node.y + 52} className={`architecture-title ${node.id === 'validation' ? 'long-title' : ''}`}>{node.title}</text>
          <text x={node.x + 16} y={node.y + 78} className="architecture-detail">{node.detail}</text>
          {active && <circle cx={node.x + node.width - 17} cy={node.y + 22} r="4" className="node-live-dot" />}
        </g>;
      })}
      {point && <g className="flow-packet"><circle cx={point[0]} cy={point[1]} r="10" className="packet-halo" /><circle cx={point[0]} cy={point[1]} r="5" /></g>}
    </svg>
  </div>;
}

export function ArchitecturePayload({ frame }: { frame?: ArchitectureFrame }) {
  return <div className={`architecture-payload ${frame?.verdict === 'rejected' ? 'payload-rejected' : ''}`} aria-live="polite">
    <span className="payload-label">{frame?.payloadLabel ?? 'Illustrated pipeline'}</span>
    <code>{frame?.payload ?? 'Play to follow an instruction through each layer.'}</code>
    {frame && <div className="payload-scene" aria-label={`Scene values: ${frame.values.join(', ')}`}><span>Scene</span>{frame.values.map((value, i) => <b key={`${i}-${value}`}>{value}</b>)}</div>}
  </div>;
}
