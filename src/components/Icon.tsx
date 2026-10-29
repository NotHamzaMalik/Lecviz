import type { CSSProperties } from 'react';
const paths: Record<string, string> = {
  flow: 'M9 3h6v5H9ZM2 16h6v5H2Zm14 0h6v5h-6ZM12 8v4M5 16v-4h14v4',
  shield: 'm12 2 9 4v6q-1 7-9 10-8-3-9-10V6Zm-4 10 3 3 5-6',
  drop: 'M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14ZM8 16q0 4 4 4',
  volume: 'M11 5 6 9H2v6h4l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  muted: 'M11 5 6 9H2v6h4l5 4ZM16 9l6 6M22 9l-6 6',
  play: 'm9 5 11 7-11 7Z', pause: 'M8 5v14M16 5v14', next: 'm5 5 10 7-10 7ZM19 5v14', back: 'm19 5-10 7 10 7ZM5 5v14',
  replay: 'M3 10a9 9 0 1 1 2 8M3 4v6h6', sun: 'M12 3V1M12 23v-2M3 12H1M23 12h-2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z', expand: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
  mic: 'M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6',
  arrow: 'M4 12h16m-6-6 6 6-6 6', close: 'm6 6 12 12M6 18 18 6', check: 'm5 12 4 4L19 6',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18', trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  book: 'M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6', info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  layers: 'm12 3 10 5-10 5L2 8Zm-9 10 9 5 9-5M3 18l9 5 9-5', stop: 'M6 6h12v12H6Z',
  wave: 'M3 12h2l2-6 3 12 3-9 3 6 2-3h3', spark: 'm12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z',
};
export function Icon({ name, size = 18, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name] ?? paths.info} /></svg>;
}
