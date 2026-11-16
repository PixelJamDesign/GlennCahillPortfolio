// A Keystatic text field with a "Write" button under it. The button asks the
// dev server (/ai/generate, scripts/generate-plugin.mjs) for a draft of this
// field, drawn from the rest of the case study, and drops it in. Undo puts
// back whatever was there before. Nothing is saved until Glenn presses Save.
import { createElement as h, useState } from 'react';
import { fields } from '@keystatic/core';

type TextOptions = Parameters<typeof fields.text>[0];

// the case study being edited, from the editor's own address
const currentSlug = () =>
  (location.pathname.match(/\/keystatic\/collection\/work\/item\/([^/]+)/) || [])[1] || '';

// the other fields in the same panel (e.g. the Question beside an Answer),
// read off the form so the draft knows what it's answering
const siblingValues = (from: HTMLElement) => {
  const scope = (from.closest('[role="dialog"]') as HTMLElement | null) || document.body;
  const out: Record<string, string> = {};
  scope.querySelectorAll('label').forEach((label) => {
    const id = label.getAttribute('for');
    const control = id ? document.getElementById(id) : null;
    if (control && 'value' in control) {
      const name = (label.textContent || '').trim();
      if (name) out[name] = String((control as HTMLInputElement).value);
    }
  });
  return out;
};

const button = {
  font: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: 999,
  border: '1px solid rgba(176, 47, 255, 0.55)',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
} as const;

export function aiText(options: TextOptions) {
  const base = fields.text(options);
  const label = options.label;

  function Input(props: Parameters<typeof base.Input>[0]) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [previous, setPrevious] = useState<string | null>(null);
    const [direction, setDirection] = useState('');
    const [showDirection, setShowDirection] = useState(false);

    const write = async (e: { currentTarget: HTMLElement }) => {
      const anchor = e.currentTarget;
      setBusy(true);
      setError('');
      try {
        const res = await fetch('/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: currentSlug(),
            field: label,
            current: props.value,
            siblings: siblingValues(anchor),
            direction,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.text) throw new Error(data.error || 'Something went wrong.');
        setPrevious(props.value);
        // single-line fields can't hold line breaks
        props.onChange(options.multiline ? data.text : data.text.replace(/\s*\n+\s*/g, ' '));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    };

    return h(
      'div',
      null,
      h(base.Input, props),
      h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 } },
        h(
          'button',
          { type: 'button', style: { ...button, opacity: busy ? 0.6 : 1 }, disabled: busy, onClick: write },
          busy ? 'Writing…' : props.value.trim() ? '✦ Rewrite' : '✦ Write'
        ),
        h(
          'button',
          {
            type: 'button',
            style: { ...button, border: '1px solid transparent', opacity: 0.75 },
            onClick: () => setShowDirection((v) => !v),
          },
          showDirection ? 'Hide direction' : 'Add direction'
        ),
        previous !== null &&
          h(
            'button',
            {
              type: 'button',
              style: { ...button, border: '1px solid transparent', opacity: 0.75 },
              onClick: () => { props.onChange(previous); setPrevious(null); },
            },
            'Undo'
          ),
        error && h('span', { style: { fontSize: 12, color: '#ff6b6b' } }, error)
      ),
      showDirection &&
        h('input', {
          type: 'text',
          value: direction,
          placeholder: 'e.g. mention the accessibility testing, keep it under 50 words',
          onChange: (e: { target: { value: string } }) => setDirection(e.target.value),
          style: {
            marginTop: 8,
            width: '100%',
            boxSizing: 'border-box',
            font: 'inherit',
            fontSize: 13,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(128, 128, 128, 0.4)',
            background: 'transparent',
            color: 'inherit',
          },
        })
    );
  }

  return { ...base, Input };
}
