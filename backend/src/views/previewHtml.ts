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
  <title>${appName} · Service Preview</title>
  <link rel="icon" type="image/png" href="/assets/fixly-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #0b0f19;
      background-image:
        radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
        radial-gradient(circle at 85% 90%, rgba(16, 185, 129, 0.05) 0%, transparent 40%);
      color: #f1f5f9;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      line-height: 1.5;
    }

    .container {
      width: 100%;
      max-width: 580px;
      margin: 0 auto;
    }

    .card {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      object-fit: contain;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-title span {
      color: #818cf8;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .intro {
      margin-bottom: 28px;
    }

    .intro-title {
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
      color: #ffffff;
    }

    .intro-sub {
      font-size: 0.88rem;
      color: #94a3b8;
      line-height: 1.5;
    }

    .preview-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }

    .preview-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 18px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }

    .preview-item:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 0.92rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 2px;
    }

    .item-desc {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .item-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #818cf8;
      flex-shrink: 0;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.75rem;
      color: #64748b;
    }

    .footer-links {
      display: flex;
      gap: 14px;
    }

    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.15s;
    }

    .footer-links a:hover {
      color: #f1f5f9;
    }

    @media (max-width: 480px) {
      .card { padding: 24px 20px; }
      .header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .preview-item { flex-direction: column; align-items: flex-start; }
      .item-link { align-self: flex-end; }
      .footer { flex-direction: column; gap: 10px; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">
          <img src="/assets/fixly-icon.png" alt="${appName}" class="brand-icon" onerror="this.style.display='none'">
          <div class="brand-title">${appName}</div>
        </div>
        <div class="status-badge" id="status-pill">
          <span class="status-dot"></span>
          <span id="status-text">Live</span>
        </div>
      </div>

      <div class="intro">
        <h1 class="intro-title">Service Preview</h1>
        <p class="intro-sub">${appName} v${appVersion} · Campus facility maintenance backend is running. Access the administrative portal or view mobile reporting previews.</p>
      </div>

      <div class="preview-list">
        <!-- Admin Web Portal -->
        <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" class="preview-item">
          <div class="item-left">
            <div class="item-icon">💻</div>
            <div>
              <div class="item-name">Admin Web Portal</div>
              <div class="item-desc">Super Admin & supervisor ticket dispatch dashboard</div>
            </div>
          </div>
          <div class="item-link">
            <span>Open</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </div>
        </a>

        <!-- Mobile App -->
        <div class="preview-item" style="cursor: default;">
          <div class="item-left">
            <div class="item-icon" style="background: rgba(6, 182, 212, 0.12); border-color: rgba(6, 182, 212, 0.25); color: #67e8f9;">📱</div>
            <div>
              <div class="item-name">Mobile Application</div>
              <div class="item-desc">Student issue reports & field worker job dispatch (iOS / Android)</div>
            </div>
          </div>
          <div class="item-link" style="color: #10b981;">
            <span>Ready</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-links">
          <a href="/health">Health API</a>
          <a href="/api/issues">Issues API</a>
          <a href="/health/integrations">Integrations</a>
        </div>
        <div>${environment}</div>
      </div>
    </div>
  </div>

  <script>
    fetch('/health')
      .then(r => r.json())
      .then(data => {
        const text = document.getElementById('status-text');
        if (data.status === 'online') {
          text.textContent = 'Operational';
        } else {
          text.textContent = 'Degraded';
        }
      })
      .catch(() => {
        const text = document.getElementById('status-text');
        if (text) text.textContent = 'Offline';
      });
  </script>
</body>
</html>`;
}
