const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3456;

http.createServer((req, res) => {
  const file = req.url === '/' ? 'dev.html' : req.url.slice(1);
  const filePath = path.join(ROOT, file);
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mime = { '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png' }[ext] || 'text/html';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found: ' + file);
  }
}).listen(PORT, () => console.log('Server on http://localhost:' + PORT));
