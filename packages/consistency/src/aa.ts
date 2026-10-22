import { contentElementAtoms } from './elements';
import type { Prompter, PromptAnswer } from '../../../website/src/vendor/aa/aa';

/** Aa owns prompt, selection, retry and undo; this adapter owns authenticated transport. */
export const previewPrompt: Prompter = async (prompt, context) => {
  const response = await fetch('/api/consistency/ai', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, signal: context.signal,
    body: JSON.stringify({ prompt, kind: context.kind, text: context.text, before: context.before, after: context.after, document: context.document }),
  });
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new Error('AI could not complete this edit. Try again.'); }
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : 'AI could not complete this edit. Try again.';
    throw new Error(message);
  }
  if (!result || typeof result !== 'object') throw new Error('AI returned an invalid edit. Try again.');
  if ('document' in result && typeof result.document === 'string') return { document: result.document } satisfies PromptAnswer;
  if ('insert' in result && typeof result.insert === 'string') return { insert: result.insert } satisfies PromptAnswer;
  throw new Error('AI returned an invalid edit. Try again.');
};

import { imageAtom, memoryCommentStore, type AaEditorElement, type EditorOptions } from '../../../website/src/vendor/aa/aa.js';
import { diagramAtom } from '../../../website/src/vendor/aa/diagram.js';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_BYTES = 8 * 1024 * 1024;

/** One stable instance per editor; comments and attachments remain in this tab's draft. */
export function createPreviewEditorOptions(getHost: () => AaEditorElement | null, onError: (message: string) => void): EditorOptions {
  const comments = memoryCommentStore({ me: { id: 'owner', name: 'Joachim' } });
  return {
    atoms: [imageAtom, diagramAtom, ...contentElementAtoms(() => { const editor = getHost()?.editor; return !!editor && !editor.readOnly; }, getHost)], comments, prompt: previewPrompt, correcting: false, toolbar: true, menus: true,
    correct: async (text, context) => {
      const answer = await previewPrompt('Correct spelling, grammar and punctuation only. Preserve meaning, Markdown structure and language. Return only the corrected selected text.', { ...context, kind: 'writing', text });
      if (typeof answer === 'string') return answer;
      if (typeof answer.insert === 'string') return answer.insert;
      throw new Error('AI returned an invalid correction. Try again.');
    },
    drawEquation: (element, source, displayMode) => {
      let active = true;
      element.textContent = source;
      void Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([{ default: katex }]) => {
        if (active) katex.render(source, element, { displayMode, throwOnError: false, trust: false });
      }).catch(() => { if (active) element.textContent = source; });
      return () => { active = false; };
    },
    onFiles: async files => {
      const host = getHost(), instance = host?.editor;
      if (!host || !instance || instance.readOnly) return;
      const selected = instance.selection();
      if (!selected) { onError('Place the caret where the file should go.'); return; }
      if (files.some(file => file.size > MAX_FILE_BYTES) || files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_BYTES) {
        onError('Choose files up to 4 MB each, with no more than 8 MB at once.'); return;
      }
      const original = instance.value;
      try {
        const sources = await Promise.all(files.map(async file => {
          const url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('The file could not be read.'));
            reader.onabort = () => reject(new Error('Reading the file was cancelled.'));
            reader.readAsDataURL(file);
          });
          const name = file.name.replace(/[\[\]\\\r\n]/g, '').trim() || 'File';
          const image = /^image\/(png|jpeg|gif|webp|avif|bmp)$/i.test(file.type);
          return `${image ? '!' : ''}[${name}](${url})`;
        }));
        // Do not replace a changed document or an editor that was removed while reading.
        if (getHost()?.editor !== instance || instance.readOnly || instance.value !== original) {
          onError('The draft changed while the files were read. Insert the files again.'); return;
        }
        const before = original.slice(0, selected.start), after = original.slice(selected.end);
        instance.replace(selected.start, selected.end, `${before && !before.endsWith('\n\n') ? '\n\n' : ''}${sources.join('\n\n')}${after && !after.startsWith('\n\n') ? '\n\n' : ''}`);
      } catch (caught) { onError(caught instanceof Error ? caught.message : 'The file could not be read.'); }
    },
  };
}
