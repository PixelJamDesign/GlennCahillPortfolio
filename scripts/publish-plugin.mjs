// Dev-server only: a /publish page with one button that rebuilds the site and
// copies it to the live folder (npm run deploy). The visual editor saves to
// the markdown files; nothing reaches glenncahill.com until this runs.
import { spawn } from 'node:child_process';

const state = { running: false, startedAt: 0, finishedAt: 0, ok: null, log: '' };

const page = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Publish · Glenn Cahill</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #070514; color: #f2f0ff;
         font: 16px/1.5 -apple-system, "Segoe UI", sans-serif; }
  main { width: min(560px, calc(100% - 48px)); }
  h1 { font-size: 1.6rem; margin: 0 0 8px; }
  p { color: #a8a3cf; margin: 0 0 24px; }
  button { font: inherit; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #fff; border: 0;
           border-radius: 999px; padding: 16px 32px; cursor: pointer;
           background: linear-gradient(120deg, #372cff, #b02fff 50%, #ff4fff); }
  button:disabled { opacity: .5; cursor: progress; }
  .status { margin-top: 20px; font-weight: 700; }
  .ok { color: #58ff9b; } .fail { color: #ff6b6b; }
  pre { margin-top: 16px; max-height: 40vh; overflow: auto; padding: 16px; border-radius: 12px; background: #0c0822;
        color: #a8a3cf; font-size: 12px; white-space: pre-wrap; }
  a { color: #ff4fff; }
</style></head>
<body><main>
  <h1>Publish to glenncahill.com</h1>
  <p>Rebuilds the site from what you've saved in the <a href="/keystatic">editor</a> and puts it live. Takes about ten seconds.</p>
  <button id="go">Publish</button>
  <div class="status" id="status"></div>
  <pre id="log" hidden></pre>
</main>
<script>
  const go = document.getElementById('go'), status = document.getElementById('status'), log = document.getElementById('log');
  const show = (s) => {
    go.disabled = s.running;
    if (s.running) { status.className = 'status'; status.textContent = 'Publishing…'; }
    else if (s.ok === true) { status.className = 'status ok'; status.textContent = 'Live. Published ' + new Date(s.finishedAt).toLocaleTimeString() + '.'; }
    else if (s.ok === false) { status.className = 'status fail'; status.textContent = 'Something went wrong. Nothing on the live site changed.'; }
    log.hidden = !s.log; log.textContent = s.log;
    if (s.running) setTimeout(poll, 1000);
  };
  const poll = () => fetch('/publish/status').then((r) => r.json()).then(show);
  go.onclick = () => fetch('/publish/run', { method: 'POST' }).then((r) => r.json()).then(show);
  poll();
</script>
</body></html>`;

export default function publishPlugin() {
  return {
    name: 'glenn-publish',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };

        if (url === '/publish' && req.method === 'GET') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(page());
        }
        if (url === '/publish/status') return json(state);
        if (url === '/publish/run' && req.method === 'POST') {
          if (state.running) return json(state);
          Object.assign(state, { running: true, startedAt: Date.now(), ok: null, log: '' });
          const child = spawn('npm', ['run', 'deploy'], { cwd: server.config.root, env: process.env });
          const add = (d) => { state.log = (state.log + d.toString()).slice(-20000); };
          child.stdout.on('data', add);
          child.stderr.on('data', add);
          child.on('close', (code) => Object.assign(state, { running: false, finishedAt: Date.now(), ok: code === 0 }));
          return json(state);
        }
        next();
      });
    },
  };
}
