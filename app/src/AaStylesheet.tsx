import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPlainEditor } from '../../website/src/vendor/aa/aa.js';
import '../../website/src/vendor/aa/aa.css';

/** CSS stays exact plain text; Aa owns native editing, clipboard, undo and selection. */
export function AaStylesheet({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<ReturnType<typeof createPlainEditor> | null>(null);
  const change = useRef(onChange); change.current = onChange;
  const initial = useRef(value);
  useLayoutEffect(() => {
    const instance = createPlainEditor(host.current!, { value: initial.current, onChange: text => change.current(text) });
    editor.current = instance;
    const block = host.current!.querySelector<HTMLElement>('[contenteditable]');
    block?.setAttribute('aria-label', 'Editable CSS source');
    block?.setAttribute('role', 'textbox');
    block?.setAttribute('aria-multiline', 'true');
    instance.focus();
    return () => { instance.destroy(); editor.current = null; };
  }, []);
  useEffect(() => { if (editor.current && editor.current.value !== value) editor.current.value = value; }, [value]);
  return <div ref={host} className="aa-stylesheet" aria-label="Editable CSS source" data-testid="live-css-source" />;
}
