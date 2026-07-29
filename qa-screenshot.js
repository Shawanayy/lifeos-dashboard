// One-off QA screenshot script. Serves ./dist-new on a local port and
// captures full-page + section screenshots with Playwright chromium.
const { chromium } = require('/tmp/qa/node_modules/playwright');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const PORT = 5050;
const SELF_DIR = '/sessions/eloquent-happy-johnson/mnt/outputs/lifeos-dashboard';
const DIST_DIR = process.argv[2] || path.join(SELF_DIR, 'dist-new');
const OUT_DIR = process.argv[3] || SELF_DIR;

function waitForServer(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('server did not start'));
        else setTimeout(attempt, 300);
      });
    }
    attempt();
  });
}

async function main() {
  // Simple static server (avoid extra deps).
  const mime = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  };
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (req.url === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise((resolve) => server.listen(PORT, resolve));

  await waitForServer(`http://localhost:${PORT}/`, 5000);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1568, height: 900 } });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: path.join(OUT_DIR, 'qa-fixed-full-page.png'), fullPage: true });

  // A few viewport-sized crops at different scroll depths for close inspection.
  const scrollPositions = [0, 900, 1800, 2700];
  for (const y of scrollPositions) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `qa-fixed-scroll-${y}.png`) });
  }

  await browser.close();
  server.close();
  console.log('DONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
