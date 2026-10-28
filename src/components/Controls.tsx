// Adapted from Mindstream's grouped template picker and floating controls.
import { examples } from '../scene/engine';
import type { Template } from '../scene/engine';
export function Controls({ selected, onSelect }: { selected: Template; onSelect: (id: Template) => void }) {
  return <div className="kind-picker" role="group" aria-label="Example template">{examples.map(example => <button key={example.id} className={`kind-btn ${selected === example.id ? 'kind-active' : ''}`} aria-pressed={selected === example.id} onClick={() => onSelect(example.id)}>{example.label}</button>)}</div>;
}
