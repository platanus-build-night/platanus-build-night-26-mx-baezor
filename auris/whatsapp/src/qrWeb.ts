/**
 * Demo-only QR helper: serves the WhatsApp Web pairing QR as a scannable image
 * at http://localhost:<QR_PORT> instead of (only) printing ASCII to the terminal.
 *
 * The page polls /state and re-renders on its own, so the ~20s QR rotation in
 * whatsapp-web.js is handled automatically — the user always sees the current
 * code and the page flips to "Conectado" once linked. This holds ZERO generation
 * logic; it is pure channel/onboarding UI for the local demo.
 */

import http from "http";
import QRCode from "qrcode";

export type LinkStatus =
  | "starting"
  | "qr"
  | "authenticated"
  | "ready"
  | "disconnected";

export interface QrServer {
  url: string;
  setQr(qr: string): void;
  setStatus(s: LinkStatus): void;
}

export function startQrServer(port: number): QrServer {
  let currentQr: string | null = null;
  let status: LinkStatus = "starting";

  const server = http.createServer(async (req, res) => {
    const url = req.url ?? "/";

    if (url.startsWith("/state")) {
      let qrDataUrl: string | null = null;
      if (currentQr && (status === "qr" || status === "starting")) {
        try {
          qrDataUrl = await QRCode.toDataURL(currentQr, {
            margin: 2,
            width: 320,
          });
        } catch {
          /* ignore render error; page will retry */
        }
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ status, qr: qrDataUrl }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAGE_HTML);
  });

  server.on("error", (err) => {
    console.error(`[auris-whatsapp] QR page failed on :${port}:`, err);
  });

  server.listen(port, () => {
    console.log(`[auris-whatsapp] QR page ready -> http://localhost:${port}`);
  });

  return {
    url: `http://localhost:${port}`,
    setQr(qr: string) {
      currentQr = qr;
      status = "qr";
    },
    setStatus(s: LinkStatus) {
      status = s;
      if (s === "ready" || s === "authenticated") currentQr = null;
    },
  };
}

const PAGE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Auris · Vincular WhatsApp</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0b0f14; color: #e7edf3;
  }
  .card {
    background: #131a22; border: 1px solid #233040; border-radius: 18px;
    padding: 28px 32px; width: 380px; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
  }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: .2px; }
  .sub { color: #8aa0b4; font-size: 13px; margin: 0 0 20px; }
  .qrbox {
    background: #fff; border-radius: 14px; padding: 14px; display: inline-block;
    min-height: 320px; min-width: 320px; display: grid; place-items: center;
  }
  .qrbox img { display: block; width: 320px; height: 320px; }
  .pill {
    margin-top: 18px; font-size: 13px; padding: 8px 14px; border-radius: 999px;
    display: inline-block; background: #1b2530; color: #8aa0b4;
  }
  .pill.ok { background: #10331f; color: #5ee08a; }
  .pill.warn { background: #33260f; color: #e0b15e; }
  .steps { text-align: left; color: #8aa0b4; font-size: 12.5px; margin: 18px 0 0; line-height: 1.7; }
  .spinner { width: 28px; height: 28px; border: 3px solid #233040; border-top-color: #5ee08a; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .big { font-size: 40px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Auris · Vincular WhatsApp</h1>
    <p class="sub">Escanea con WhatsApp → Dispositivos vinculados</p>
    <div class="qrbox" id="qrbox"><div class="spinner"></div></div>
    <div class="pill" id="pill">Iniciando…</div>
    <ol class="steps">
      <li>Abre WhatsApp en tu teléfono</li>
      <li>Ajustes → Dispositivos vinculados → Vincular un dispositivo</li>
      <li>Apunta la cámara a este código</li>
    </ol>
  </div>
<script>
  const box = document.getElementById('qrbox');
  const pill = document.getElementById('pill');
  async function tick() {
    try {
      const r = await fetch('/state', { cache: 'no-store' });
      const s = await r.json();
      if (s.status === 'ready') {
        box.innerHTML = '<div class="big">✅</div>';
        pill.textContent = 'Conectado — ya puedes enviar un PDF o texto';
        pill.className = 'pill ok';
        return; // stop polling
      }
      if (s.status === 'authenticated') {
        box.innerHTML = '<div class="spinner"></div>';
        pill.textContent = 'Autenticado, cargando…';
        pill.className = 'pill warn';
      } else if (s.qr) {
        box.innerHTML = '<img alt="QR" src="' + s.qr + '" />';
        pill.textContent = 'Esperando escaneo…';
        pill.className = 'pill';
      } else if (s.status === 'disconnected') {
        pill.textContent = 'Desconectado — reinicia el cliente';
        pill.className = 'pill warn';
      }
    } catch (e) {
      pill.textContent = 'Esperando al cliente…';
      pill.className = 'pill warn';
    }
    setTimeout(tick, 2000);
  }
  tick();
</script>
</body>
</html>`;
