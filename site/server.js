// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('/home/rune/.cloudflared/origin-key.pem'),
  cert: fs.readFileSync('/home/rune/.cloudflared/origin.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, 'web.runchan.f5.si', () => {
    console.log('> Ready on https://web.runchan.f5.si:3000');
  });
});
