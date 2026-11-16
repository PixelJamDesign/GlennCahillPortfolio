// Dev-server only: POST /ai/generate drafts one field of a case study with
// Claude, for the "Write" buttons in the visual editor. It reads the saved
// case study for context and never writes anything itself: the draft goes
// back to the editor, where Glenn can keep it, edit it or undo it.
//
// Two ways in, tried in this order. Both credentials live outside the project
// (the project folder is shared over Samba) and are read on every request,
// so adding one needs no restart.
//   1. Glenn's own Claude plan, through Claude Code installed on the Pi:
//      ~/.config/glenncahill/claude.env, CLAUDE_CODE_OAUTH_TOKEN=... (from
//      `claude setup-token`). No API billing.
//   2. An Anthropic API key: ~/.config/glenncahill/anthropic.env,
//      ANTHROPIC_API_KEY=...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import yaml from 'js-yaml';
import Anthropic from '@anthropic-ai/sdk';

const CONFIG = path.join(os.homedir(), '.config/glenncahill');
const CLAUDE_BIN = path.join(os.homedir(), '.local/claude-code/node_modules/.bin/claude');

const readSetting = (file, name) => {
  try {
    const m = fs.readFileSync(path.join(CONFIG, file), 'utf8').match(new RegExp(`^${name}=(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
};

// one turn of Claude Code in print mode: no tools, no saved session, run from
// an empty folder so it picks up no project context
const viaClaudeCode = (token, system, prompt) =>
  new Promise((resolve, reject) => {
    const cwd = path.join(os.tmpdir(), 'glenn-writer');
    fs.mkdirSync(cwd, { recursive: true });
    const child = spawn(
      CLAUDE_BIN,
      ['-p', '--output-format', 'json', '--model', 'claude-opus-5', '--effort', 'medium',
        '--system-prompt', system, '--tools', '', '--no-session-persistence'],
      { cwd, env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token, ANTHROPIC_API_KEY: '' } }
    );
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Timed out.')); }, 180_000);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out);
        if (r.is_error) return reject(new Error(String(r.result || 'Claude Code reported an error.').slice(0, 200)));
        resolve(String(r.result || '').trim());
      } catch {
        reject(new Error((err || out || 'No reply from Claude Code.').trim().slice(0, 200)));
      }
    });
    child.stdin.end(prompt);
  });

const viaApi = async (apiKey, system, prompt) => {
  const client = new Anthropic({ apiKey });
  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    // if the request is declined, the API retries it on a fallback model
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined to write this one.');
  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
};

// Glenn's standing rules for anything written in his name
const SYSTEM = `You draft copy for Glenn Cahill's design portfolio (glenncahill.com), one field at a time. Glenn is a UK designer specialising in design systems, UI/UX and product design. Write as Glenn, in the first person where it fits, in British English.

It must read as written by a person, never as AI. Avoid:
- rule-of-three lists ("fast, simple and reliable")
- em dashes used for emphasis
- hype words: elevate, empower, unlock, seamless, effortless, robust, leverage, supercharge, dive in, delve
- "not just X, but Y" and other over-balanced constructions
- throat-clearing openings and tidy summarising endings
- uniform sentence rhythm, hedging, vague filler
Use short sentences of varied length, plain specific words, concrete detail and a natural tone.

Facts: use only what the case study already says, plus anything Glenn gives as direction. Never invent results, numbers, names, clients, dates, tools or quotes, and never add a figure, duration, percentage or count (not even a rhetorical one like "in three seconds") unless the case study already states it. Where a specific fact is needed and missing, write a placeholder in square brackets, e.g. [number of screens], so Glenn can fill it in.

Reply with the field's new content only: no preamble, no quotes around it, no markdown headings.`;

// how each field should be written, keyed by its label in the editor
const GUIDES = {
  Answer:
    'An answer to the question shown in the field context. 2 to 5 short paragraphs, one per line (no blank lines). A line may start with "• " for a bullet when listing things.',
  Intro: 'The line under the hero title: one or two sentences saying what the project was and Glenn\'s part in it.',
  'Hero title': 'The big hero title: the project or product name only, 1 to 3 words.',
  Tag: 'The category pill: 1 to 3 words, e.g. "Product Design", "Design System", "Branding".',
  Role: 'Glenn\'s role on the project, e.g. "Product design & UX/UI". Under 6 words.',
  Question: 'A question a hiring manager would want answered about this chapter of the project. One short question.',
  Note: 'A small note shown under the metric cards, e.g. where the numbers come from or when they were taken. Under 10 words.',
  Label: 'A label for a metric card, 1 to 3 words, e.g. "Total users".',
  'Private notes': 'Notes to Glenn himself: what is missing from this case study and what would strengthen it. A short list, one item per line.',
};

// the saved case study, flattened into plain text for context
const caseContext = (root, slug) => {
  if (!/^[a-z0-9-]+$/.test(slug)) return '';
  const file = path.join(root, 'src/content/work', `${slug}.md`);
  let src;
  try {
    src = fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return src;
  const d = yaml.load(m[1]) || {};
  const answered = (d.questions || [])
    .filter((q) => q.answer && String(q.answer).trim())
    .map((q) => `Q (${q.chapter}): ${q.question}\nA: ${q.answer}`)
    .join('\n\n');
  return [
    `Title: ${d.title || ''}`,
    d.tag && `Tag: ${d.tag}`,
    d.excerpt && `Intro: ${d.excerpt}`,
    d.year && `Year: ${d.year}`,
    d.role && `Role: ${d.role}`,
    d.client && `Client: ${d.client}`,
    `\nChapters:\n${m[2].replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim()}`,
    answered && `\nQuestions already answered:\n${answered}`,
  ]
    .filter(Boolean)
    .join('\n');
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 100_000) reject(new Error('too large')); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });

export default function generatePlugin() {
  return {
    name: 'glenn-generate',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url || '').split('?')[0] !== '/ai/generate' || req.method !== 'POST') return next();
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        const token = readSetting('claude.env', 'CLAUDE_CODE_OAUTH_TOKEN');
        const apiKey = token ? null : readSetting('anthropic.env', 'ANTHROPIC_API_KEY');
        if (!token && !apiKey) return send(503, { error: 'Not connected to Claude yet. Run the one-time sign-in on the Pi.' });

        let input;
        try {
          input = await readBody(req);
        } catch {
          return send(400, { error: 'Bad request' });
        }
        const { slug = '', field = '', current = '', siblings = {}, direction = '' } = input;

        const siblingText = Object.entries(siblings)
          .filter(([k, v]) => k !== field && String(v).trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');

        const prompt = [
          `<case_study>\n${caseContext(server.config.root, slug) || '(not saved yet)'}\n</case_study>`,
          siblingText && `<field_context>\n${siblingText}\n</field_context>`,
          `Field to write: ${field}`,
          GUIDES[field] && `What this field is: ${GUIDES[field]}`,
          String(current).trim()
            ? `Current content (improve it; keep every fact it states):\n${current}`
            : 'The field is empty: write it from scratch.',
          String(direction).trim() && `Glenn's direction: ${direction}`,
        ]
          .filter(Boolean)
          .join('\n\n');

        try {
          const text = token ? await viaClaudeCode(token, SYSTEM, prompt) : await viaApi(apiKey, SYSTEM, prompt);
          if (!text) return send(502, { error: 'Came back empty. Try again.' });
          return send(200, { text });
        } catch (err) {
          if (err instanceof Anthropic.AuthenticationError) return send(401, { error: 'The API key was rejected.' });
          if (err instanceof Anthropic.RateLimitError) return send(429, { error: 'Rate limited. Try again in a minute.' });
          if (err instanceof Anthropic.APIError) return send(502, { error: `Claude API error ${err.status}.` });
          return send(502, { error: err instanceof Error ? err.message : 'Could not reach Claude.' });
        }
      });
    },
  };
}
