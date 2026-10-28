import { useState } from 'react';
import { Icon } from './Icon';
export function ThoughtInput({ onSubmit, disabled }: { onSubmit: (text: string) => boolean; disabled: boolean }) {
  const [value, setValue] = useState('');
  return <form className="thought-input" onSubmit={event => { event.preventDefault(); if (value.trim() && onSubmit(value.trim())) setValue(''); }}>
    <input aria-label="Type a command" value={value} onChange={event => setValue(event.target.value)} placeholder="Type a command…" maxLength={300} disabled={disabled} />
    <button className="send-button" type="submit" aria-label="Run command" disabled={disabled || !value.trim()}><Icon name="arrow" size={23} /></button>
  </form>;
}
