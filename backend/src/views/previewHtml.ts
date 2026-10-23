export interface PreviewOptions {
  adminUrl: string;
  appName: string;
  appVersion: string;
  environment: string;
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export function renderPreviewPage(options: PreviewOptions): string {
  const adminUrl = escapeHtml(options.adminUrl);
  const appName = escapeHtml(options.appName);
  const appVersion = escapeHtml(options.appVersion);
  const environment = escapeHtml(options.environment.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#f2f4f1">
  <title>${appName} · Service Preview</title>
  <link rel="icon" type="image/png" href="/assets/fixly-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f2f4f1;
      --ink: #14201e;
      --muted: #5d6b68;
      --line: #d9dfdb;
      --ok: #12805c;
      --bad: #c93a3a;
      --idle: #8a9692;
      --monitor: #0a1f1c;
      --display: 'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--ink);
      font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
    }

    a { color: inherit; text-decoration: none; }
    a:focus-visible, button:focus-visible { outline: 2px solid var(--ok); outline-offset: 3px; }

    .container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      padding: 32px 20px 40px;
    }

    /* The monitor: the one bold element on the page */
    .monitor {
      --accent: #8aa39d;
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      padding: 26px 28px 22px;
      margin-bottom: 44px;
      color: #eaf6f1;
      background-color: var(--monitor);
      background-image:
        linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .monitor[data-state="ok"] { --accent: #3ddc97; }
    .monitor[data-state="bad"] { --accent: #ff6b6b; }

    .monitor-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 44px;
    }

    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 30px; height: 30px; border-radius: 8px; object-fit: contain; }
    .brand-title { font-family: var(--display); font-weight: 700; font-size: 1.05rem; letter-spacing: -0.01em; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 13px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
      color: var(--accent);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
    }
    .status-badge[data-status="connected"] .status-dot { animation: blink 1.6s ease-in-out infinite; }
    @keyframes blink { 50% { opacity: .35; } }

    .headline {
      font-family: var(--display);
      font-size: clamp(2.1rem, 7vw, 3.6rem);
      font-weight: 700;
      line-height: 1.02;
      letter-spacing: -0.035em;
      max-width: 14ch;
    }
    .sub {
      margin-top: 12px;
      max-width: 52ch;
      font-size: 0.95rem;
      color: #8fb0a6;
    }

    .trace { display: block; width: 100%; height: auto; margin: 26px 0 14px; overflow: visible; }
    .trace path {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .trace-dim { opacity: .28; }
    .trace-live {
      stroke-dasharray: 140 860;
      filter: drop-shadow(0 0 6px var(--accent));
      animation: sweep 2.6s linear infinite;
    }
    @keyframes sweep { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -1000; } }
    .monitor[data-state="bad"] .trace-dim { opacity: 1; }
    .monitor[data-state="bad"] .trace-live { opacity: 0; }

    .readouts {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 28px;
      font-size: 0.85rem;
      color: #8fb0a6;
    }
    .readouts b { color: #eaf6f1; font-weight: 600; margin-right: 4px; }

    .recheck {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 15px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.22);
      background: transparent;
      color: #eaf6f1;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color .15s;
    }
    .recheck:hover { background: rgba(255,255,255,.09); }
    .recheck:disabled { opacity: .6; cursor: default; }
    .recheck.spin svg { animation: turn .8s linear infinite; }
    @keyframes turn { to { transform: rotate(360deg); } }

    /* Services */
    .section-title {
      font-family: var(--display);
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .preview-list { margin-bottom: 36px; border-top: 2px solid var(--ink); }

    .preview-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 2px;
      border-bottom: 1px solid var(--line);
    }
    .item-name { font-size: 1rem; font-weight: 600; }
    .item-desc { font-size: 0.85rem; color: var(--muted); }

    .item-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--idle);
      flex-shrink: 0;
    }
    .item-status::before {
      content: "";
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: currentColor;
    }
    .item-status[data-status="connected"] { color: var(--ok); }
    .item-status[data-status="disconnected"] { color: var(--bad); }

    /* Admin portal */
    .portal {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 22px;
      border: 1.5px solid var(--ink);
      border-radius: 16px;
      transition: background-color .18s, color .18s;
    }
    .portal:hover { background: var(--ink); color: var(--bg); }
    .portal:hover .item-desc { color: #a9b8b4; }
    .portal-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 40px;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .footer-links { display: flex; gap: 18px; }
    .footer-links a:hover { color: var(--ink); text-decoration: underline; }
    .env {
      padding: 3px 11px;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-weight: 600;
      color: var(--ink);
    }

    @media (max-width: 520px) {
      .container { padding: 16px 14px 32px; }
      .monitor { padding: 20px 18px 18px; border-radius: 18px; }
      .monitor-top { margin-bottom: 30px; }
      .recheck { margin-left: 0; }
      .preview-item { align-items: flex-start; flex-direction: column; gap: 8px; }
      .portal { flex-direction: column; align-items: flex-start; }
      .footer { flex-direction: column; align-items: flex-start; }
    }

    /* Full-screen fit: monitor on the left, services on the right, no page scroll */
    @media (min-width: 900px) and (min-height: 560px) {
      body { height: 100vh; height: 100dvh; overflow: hidden; }
      .container {
        max-width: 1180px;
        height: 100%;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 36px;
        padding: 28px;
      }
      .monitor { display: flex; flex-direction: column; margin-bottom: 0; padding: 32px; }
      .monitor-top { margin-bottom: 0; }
      .headline { margin-top: auto; font-size: clamp(2.6rem, 5vw, 4.2rem); }
      .trace-wrap { flex: 1; display: flex; align-items: center; min-height: 0; }
      .trace { margin: 0; }
      .side { display: flex; flex-direction: column; justify-content: center; min-height: 0; }
      .preview-list { margin-bottom: 22px; }
      .footer { margin-top: 28px; }
    }

    @media (min-width: 900px) and (min-height: 560px) and (max-height: 700px) {
      .preview-item { padding: 11px 2px; }
      .preview-list { margin-bottom: 16px; }
      .footer { margin-top: 18px; }
      .portal { padding: 14px 20px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .trace-live, .status-dot, .recheck.spin svg { animation: none; }
    }
  </style>
</head>
<body>
  <main class="container">
    <section class="monitor" id="hero" data-state="checking">
      <div class="monitor-top">
        <div class="brand">
          <img src="/assets/fixly-icon.png" alt="" class="brand-icon" onerror="this.style.display='none'">
          <div class="brand-title">${appName}</div>
        </div>
        <div class="status-badge" id="status-pill" data-status="checking">
          <span class="status-dot"></span>
          <span id="status-text">Checking services</span>
        </div>
      </div>

      <h1 class="headline" id="hero-title">Checking systems</h1>
      <p class="sub">${appName} v${appVersion}. Live health for the backend, database, integrations and apps.</p>

      <div class="trace-wrap">
      <svg class="trace" viewBox="0 0 800 96" preserveAspectRatio="none" aria-hidden="true">
        <path class="trace-dim" id="trace-dim" d="M0 60H800"></path>
        <path class="trace-live" id="trace-live" pathLength="1000" d="M0 60H800"></path>
      </svg>
      </div>

      <div class="readouts">
        <span><b id="up-count">–</b>of 5 services online</span>
        <span><b id="latency">–</b>response</span>
        <span><b id="updated">Not yet</b>last checked</span>
        <button class="recheck" id="refresh" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
          Recheck
        </button>
      </div>
    </section>

    <div class="side">
    <h2 class="section-title">Services</h2>
    <section class="preview-list" aria-label="Service health" aria-live="polite">
      <div class="preview-item">
        <div>
          <div class="item-name">Backend API</div>
          <div class="item-desc">Fixly application service</div>
        </div>
        <span class="item-status" id="backend-status" data-status="checking"><span class="status-label">Checking</span></span>
      </div>

      <div class="preview-item">
        <div>
          <div class="item-name">Database</div>
          <div class="item-desc">PostgreSQL data store</div>
        </div>
        <span class="item-status" id="database-status" data-status="checking"><span class="status-label">Checking</span></span>
      </div>

      <div class="preview-item">
        <div>
          <div class="item-name">Firebase</div>
          <div class="item-desc">Authentication and push notifications</div>
        </div>
        <span class="item-status" id="firebase-status" data-status="checking"><span class="status-label">Checking</span></span>
      </div>

      <div class="preview-item">
        <div>
          <div class="item-name">Cloudflare R2</div>
          <div class="item-desc">File and image storage</div>
        </div>
        <span class="item-status" id="cloudflare-status" data-status="checking"><span class="status-label">Checking</span></span>
      </div>

      <div class="preview-item">
        <div>
          <div class="item-name">Mobile App API</div>
          <div class="item-desc">Backend connection for student and field worker apps</div>
        </div>
        <span class="item-status" id="mobile-status" data-status="checking"><span class="status-label">Checking</span></span>
      </div>
    </section>

    <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" class="portal">
      <div>
        <div class="item-name">Admin Portal</div>
        <div class="item-desc">Super Admin and supervisor dashboard</div>
      </div>
      <span class="portal-link">
        Open portal
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </span>
    </a>

    <footer class="footer">
      <div class="footer-links">
        <a href="/health">Health API</a>
        <a href="/api/issues">Issues API</a>
        <a href="/health/integrations">Integrations</a>
      </div>
      <div class="env">${environment}</div>
    </footer>
    </div>
  </main>

  <script>
    (function () {
      var ids = ['backend', 'database', 'firebase', 'cloudflare', 'mobile'];
      var labels = { connected: 'Connected', not_configured: 'Not configured', disconnected: 'Disconnected', checking: 'Checking' };
      var BEAT = 'h70l6-8l8 8h30l6 6l10-50l10 64l8-20h26l12-12l12 12';
      var HEARTBEAT = 'M0 60' + BEAT + BEAT + BEAT + BEAT + 'h8';
      var FLAT = 'M0 60H800';
      var byId = function (id) { return document.getElementById(id); };

      function setTrace(d) {
        byId('trace-dim').setAttribute('d', d);
        byId('trace-live').setAttribute('d', d);
      }

      function setServiceStatus(id, value) {
        var element = byId(id + '-status');
        if (!element) return;
        var status = value === 'connected' || value === 'not_configured' || value === 'checking' ? value : 'disconnected';
        element.dataset.status = status;
        element.querySelector('.status-label').textContent = labels[status];
      }

      function render(state, title, pill) {
        byId('hero').dataset.state = state;
        byId('hero-title').textContent = title;
        byId('status-pill').dataset.status = state === 'ok' ? 'connected' : state === 'bad' ? 'disconnected' : 'checking';
        byId('status-text').textContent = pill;
        var up = ids.filter(function (id) { return byId(id + '-status').dataset.status === 'connected'; }).length;
        byId('up-count').textContent = state === 'checking' ? '–' : up;
        setTrace(state === 'bad' ? FLAT : HEARTBEAT);
      }

      function finish(ms) {
        byId('latency').textContent = ms === null ? '–' : ms + ' ms';
        byId('updated').textContent = new Date().toLocaleTimeString();
        var button = byId('refresh');
        button.classList.remove('spin');
        button.disabled = false;
      }

      function check(quiet) {
        var button = byId('refresh');
        button.classList.add('spin');
        button.disabled = true;
        if (!quiet) {
          ids.forEach(function (id) { setServiceStatus(id, 'checking'); });
          render('checking', 'Checking systems', 'Checking services');
        }
        var started = performance.now();
        fetch('/health/integrations', { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var online = data.status === 'online';
            var integrations = data.integrations || {};
            setServiceStatus('backend', online ? 'connected' : 'disconnected');
            setServiceStatus('database', data.database);
            setServiceStatus('firebase', integrations.firebase);
            setServiceStatus('cloudflare', integrations.cloudflareR2);
            setServiceStatus('mobile', integrations.mobileApi);
            render(online ? 'ok' : 'bad', online ? 'All systems operational' : 'Service degraded', online ? 'Operational' : 'Degraded');
            finish(Math.round(performance.now() - started));
          })
          .catch(function () {
            ids.forEach(function (id) { setServiceStatus(id, 'disconnected'); });
            render('bad', 'Cannot reach the API', 'Offline');
            finish(null);
          });
      }

      byId('refresh').addEventListener('click', function () { check(false); });
      check(false);
      setInterval(function () { check(true); }, 30000);
    })();
  </script>
</body>
</html>`;
}