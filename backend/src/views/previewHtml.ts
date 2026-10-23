export interface PreviewOptions {
  appName: string;
  adminUrl: string;
  environment: string;
  version: string;
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
  const appName = escapeHtml(options.appName);
  const adminUrl = escapeHtml(options.adminUrl);
  const environment = escapeHtml(options.environment);
  const version = escapeHtml(options.version);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f5f7fb">
  <link rel="icon" type="image/png" href="/assets/fixly-icon.png">
  <title>${appName} · Service status</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172033;
      background: #f3f6fb;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      --muted: #718096;
      --border: #e7ebf2;
      --green: #168456;
      --red: #c13c48;
      --amber: #986d10;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      background:
        radial-gradient(ellipse at 50% -15%, rgb(79 116 238 / 10%), transparent 42%),
        #f3f6fb;
    }
    a { color: inherit; }
    .page { width: min(100% - 36px, 760px); margin: 0 auto; padding: 38px 0 36px; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 52px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { width: 38px; height: 38px; object-fit: contain; }
    .brand-wordmark { display: block; width: 122px; max-height: 34px; object-fit: contain; object-position: left center; }
    .env { padding: 6px 10px; border: 1px solid #dfe5ef; border-radius: 20px; background: rgb(255 255 255 / 70%); color: #69778e; font-size: 10px; font-weight: 750; letter-spacing: .09em; }
    .eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #5874c8; font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    .eyebrow::before { width: 7px; height: 7px; border-radius: 50%; background: #5678ed; content: ""; box-shadow: 0 0 0 4px rgb(86 120 237 / 12%); }
    h1 { margin: 0; font-size: clamp(30px, 5vw, 42px); letter-spacing: -.06em; line-height: 1.1; }
    .intro { margin: 12px 0 28px; color: var(--muted); font-size: 15px; }
    .panel { overflow: hidden; border: 1px solid #e5eaf2; border-radius: 16px; background: white; box-shadow: 0 15px 42px rgb(31 48 79 / 7%); }
    .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 21px; border-bottom: 1px solid var(--border); }
    .panel-heading strong { font-size: 14px; letter-spacing: -.01em; }
    .panel-heading span { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; font-weight: 450; }
    button { padding: 9px 13px; border: 1px solid var(--border); border-radius: 9px; background: white; color: #27364e; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; transition: background .15s, transform .15s; }
    button:hover { background: #f6f8fc; transform: translateY(-1px); }
    button:disabled { cursor: wait; opacity: .6; }
    .status-list { list-style: none; margin: 0; padding: 0; }
    .status-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 17px 21px; border-bottom: 1px solid #edf0f5; }
    .status-row:last-child { border-bottom: 0; }
    .service { display: flex; align-items: center; gap: 13px; min-width: 0; }
    .service-icon { display: grid; width: 36px; height: 36px; flex: none; place-items: center; border: 1px solid #edf0f6; border-radius: 11px; background: #f8f9fc; color: #53627a; font-size: 12px; font-weight: 750; }
    .service-copy { min-width: 0; }
    .service-name { font-size: 13px; font-weight: 700; letter-spacing: -.01em; }
    .service-note { max-width: 520px; margin-top: 4px; overflow: hidden; color: var(--muted); font-size: 11px; line-height: 1.45; text-overflow: ellipsis; }
    .state { display: inline-flex; align-items: center; gap: 7px; flex: none; padding: 6px 9px; border: 1px solid #e9edf3; border-radius: 20px; background: #f8f9fb; color: var(--muted); font-size: 10px; font-weight: 750; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #aab3c2; }
    .state[data-status="connected"] { border-color: #d9eee3; background: #f0faf4; color: var(--green); }
    .state[data-status="connected"] .dot { background: var(--green); box-shadow: 0 0 0 3px rgb(22 132 86 / 10%); }
    .state[data-status="disconnected"] { border-color: #f1dfe1; background: #fff5f5; color: var(--red); }
    .state[data-status="disconnected"] .dot { background: var(--red); }
    .state[data-status="checking"] .dot { background: #d09b20; }
    .note { margin: 13px 3px 0; color: var(--muted); font-size: 11px; line-height: 1.55; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
    .link { display: inline-flex; align-items: center; justify-content: center; min-height: 41px; padding: 0 15px; border: 1px solid var(--border); border-radius: 9px; background: white; color: #27364e; font-size: 12px; font-weight: 680; text-decoration: none; }
    .link-primary { border-color: #315ee8; background: #315ee8; color: white; box-shadow: 0 5px 13px rgb(49 94 232 / 20%); }
    .link-primary:hover { background: #244fd5; }
    .health-details { margin-top: 14px; overflow: hidden; border: 1px solid #202a3a; border-radius: 11px; background: #101827; color: #dbe5f5; }
    .health-details[hidden] { display: none; }
    .health-details pre { overflow-x: auto; margin: 0; padding: 17px; font: 11px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
    .meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 28px; color: #8a95a7; font-size: 10px; }
    @media (max-width: 480px) {
      .page { width: min(100% - 26px, 760px); padding-top: 24px; }
      header { margin-bottom: 40px; }
      .panel-heading, .status-row { padding-right: 14px; padding-left: 14px; }
      .status-row { align-items: flex-start; }
      .service { gap: 10px; }
      .service-icon { width: 32px; height: 32px; }
      .state { margin-top: 1px; padding: 5px 7px; }
      .meta { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div class="brand">
        <img class="brand-icon" src="/assets/fixly-icon.png" alt="">
        <img class="brand-wordmark" src="/assets/fixly-wordmark.png" alt="${appName}">
      </div>
      <span class="env">${environment}</span>
    </header>

    <div class="eyebrow">${appName} · live overview</div>
    <h1>Your services, at a glance.</h1>
    <p class="intro">A quick view of service availability. Connection details are kept private.</p>

    <section class="panel" aria-labelledby="checks-title">
      <div class="panel-heading">
        <div><strong id="checks-title">Service connections</strong><span>Live checks against your configured services</span></div>
        <button id="refresh-button" type="button" onclick="checkHealth()">Refresh</button>
      </div>
      <ul class="status-list" aria-live="polite">
        <li class="status-row">
          <div class="service"><span class="service-icon">API</span><div class="service-copy"><div class="service-name">Backend API</div><div class="service-note">Fixly application service</div></div></div>
          <span class="state" id="api-state" data-status="checking"><span class="dot"></span><span>Checking</span></span>
        </li>
        <li class="status-row">
          <div class="service"><span class="service-icon">DB</span><div class="service-copy"><div class="service-name">Database · PostgreSQL</div><div class="service-note">Primary application database</div></div></div>
          <span class="state" id="database-state" data-status="checking"><span class="dot"></span><span>Checking</span></span>
        </li>
        <li class="status-row">
          <div class="service"><span class="service-icon">FB</span><div class="service-copy"><div class="service-name">Firebase Admin</div><div class="service-note">Authentication and messaging</div></div></div>
          <span class="state" id="firebase-state" data-status="checking"><span class="dot"></span><span>Checking</span></span>
        </li>
        <li class="status-row">
          <div class="service"><span class="service-icon">R2</span><div class="service-copy"><div class="service-name">Cloudflare R2</div><div class="service-note">Issue photo storage</div></div></div>
          <span class="state" id="r2-state" data-status="checking"><span class="dot"></span><span>Checking</span></span>
        </li>
        <li class="status-row">
          <div class="service"><span class="service-icon">APP</span><div class="service-copy"><div class="service-name">Mobile app API</div><div class="service-note">Configured mobile backend · device connection is not tracked</div></div></div>
          <span class="state" id="mobile-state" data-status="checking"><span class="dot"></span><span>Checking</span></span>
        </li>
      </ul>
    </section>
    <p class="note" id="last-checked">Checks run when this page opens. Use Refresh to run them again.</p>

    <nav class="links" aria-label="Project links">
      <a class="link link-primary" href="${adminUrl}" target="_blank" rel="noopener noreferrer">Open admin app</a>
      <button class="link" id="api-health-button" type="button" onclick="toggleApiHealth()">View API health</button>
    </nav>
    <section class="health-details" id="api-health-details" hidden aria-label="API health response">
      <pre id="api-health-result">Loading API health...</pre>
    </section>
    <p class="meta"><span>${appName} · v${version}</span><span>${environment} environment</span></p>
  </main>
  <script>
    function setState(id, status, label) {
      const element = document.getElementById(id);
      element.dataset.status = status;
      element.lastElementChild.textContent = label;
    }

    async function toggleApiHealth() {
      const details = document.getElementById('api-health-details');
      const button = document.getElementById('api-health-button');
      details.hidden = !details.hidden;
      button.textContent = details.hidden ? 'View API health' : 'Hide API health';
      if (!details.hidden) {
        const result = document.getElementById('api-health-result');
        result.textContent = 'Loading API health...';
        try {
          const response = await fetch('/health/integrations', { cache: 'no-store' });
          const data = await response.json();
          result.textContent = JSON.stringify(data, null, 2);
        } catch {
          result.textContent = 'Could not reach the API health endpoint.';
        }
      }
    }

    async function checkHealth() {
      const button = document.getElementById('refresh-button');
      button.disabled = true;
      setState('api-state', 'checking', 'Checking');
      setState('database-state', 'checking', 'Checking');
      setState('firebase-state', 'checking', 'Checking');
      setState('r2-state', 'checking', 'Checking');
      setState('mobile-state', 'checking', 'Checking');

      try {
        const response = await fetch('/health/integrations', { cache: 'no-store' });
        const data = await response.json();
        const healthy = response.ok && data.status === 'online';
        setState('api-state', healthy ? 'connected' : 'disconnected', healthy ? 'Online' : 'Degraded');
        setState('database-state', data.database === 'connected' ? 'connected' : 'disconnected', data.database === 'connected' ? 'Connected' : 'Disconnected');
        const firebaseConnected = data.integrations?.firebase === 'connected';
        setState('firebase-state', firebaseConnected ? 'connected' : 'disconnected', firebaseConnected ? 'Connected' : 'Disconnected');
        const r2Connected = data.integrations?.cloudflareR2 === 'connected';
        setState('r2-state', r2Connected ? 'connected' : 'disconnected', r2Connected ? 'Connected' : 'Disconnected');
        const mobileStatus = data.integrations?.mobileApi;
        if (mobileStatus === 'connected') {
          setState('mobile-state', 'connected', 'Connected');
        } else if (mobileStatus === 'not_configured') {
          setState('mobile-state', 'checking', 'Not configured');
        } else {
          setState('mobile-state', 'disconnected', 'Disconnected');
        }
        document.getElementById('last-checked').textContent = 'Last checked ' + new Date().toLocaleTimeString();
      } catch {
        ['api-state', 'database-state', 'firebase-state', 'r2-state'].forEach((id) => setState(id, 'disconnected', 'Unavailable'));
        setState('mobile-state', 'disconnected', 'API unavailable');
        document.getElementById('last-checked').textContent = 'Could not reach the health endpoint. Check the backend and try again.';
      } finally {
        button.disabled = false;
      }
    }

    checkHealth();
  </script>
</body>
</html>`;
}
