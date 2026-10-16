import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const UI = new URL('./ui.html', import.meta.url);

export function startServer(checker, { host, port, log, onSettingsChanged }) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(await readFile(UI));
      }
      if (req.method === 'GET' && url.pathname === '/api/state') return json(res, checker.snapshot());
      if (req.method === 'POST' && url.pathname === '/api/settings') {
        const changed = await checker.updateSettings(await readJson(req));
        if (changed) onSettingsChanged();
        return json(res, checker.snapshot());
      }
      if (req.method === 'POST' && url.pathname === '/api/check') {
        onSettingsChanged();
        return json(res, { ...checker.snapshot(), checking: true });
      }
      res.writeHead(404).end();
    } catch (err) {
      json(res, { error: err.message }, 400);
    }
  });
  server.listen(port, host, () => log(`ui on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
  return server;
}

function json(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 10_000) throw new Error('body too large');
  }
  return data ? JSON.parse(data) : {};
}
