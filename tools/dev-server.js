const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3456;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  // CORS — required for Figma plugins and remote-cli
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const file = req.url === '/' ? 'ui.html' : req.url.replace(/^\//, '').split('?')[0];
  const filePath = path.join(ROOT, file);

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'text/html';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
    console.log(`200  ${req.url}`);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + file);
    console.log(`404  ${req.url}`);
  }
}).listen(PORT, () => {
  console.log(`\nDev server running at http://localhost:${PORT}`);
  console.log(`Components: http://localhost:${PORT}/tokenwizard-components.html\n`);
});
