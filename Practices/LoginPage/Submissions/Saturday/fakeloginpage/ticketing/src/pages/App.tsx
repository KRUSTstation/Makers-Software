import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Ticket {
  id: string;
  queuePosition: number;
  totalInQueue: number;
  status: "waiting" | "ready" | "claimed";
  estimatedMinutes: number | null;
  itemName: string;
  issuedAt: string;
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
let mockStateIndex = 0;
const MOCK_STATES: Ticket[] = [
  {
    id: "TKT-4892",
    queuePosition: 7,
    totalInQueue: 23,
    status: "waiting",
    estimatedMinutes: 14,
    itemName: "Lorem Ipsum",
    issuedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "TKT-4892",
    queuePosition: 2,
    totalInQueue: 23,
    status: "waiting",
    estimatedMinutes: 3,
    itemName: "Lorem Ipsum",
    issuedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "TKT-4892",
    queuePosition: 1,
    totalInQueue: 23,
    status: "ready",
    estimatedMinutes: null,
    itemName: "Lorem Ipsum",
    issuedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
];

async function fetchTicket(_ticketId: string): Promise<Ticket> {
  await new Promise((r) => setTimeout(r, 900));
  return MOCK_STATES[mockStateIndex % MOCK_STATES.length];
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────
function getTicketIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("t") || params.get("ticket") || null;
}

function timeSince(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:wght@300;400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f4ff;
    --surface: #ffffff;
    --border: #e4e9f5;
    --accent: #4f7ef8;
    --accent-light: #eef2ff;
    --accent-mid: rgba(79, 126, 248, 0.15);
    --text: #1e2a45;
    --muted: #8a95b0;
    --shadow: 0 4px 24px rgba(79,126,248,0.08), 0 1px 4px rgba(0,0,0,0.04);
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
    --ready-bg: #f0fdf6;
    --ready-border: #bbf0d0;
    --ready-accent: #16a34a;
    --ready-text: #15803d;
    --font-body: 'Nunito', sans-serif;
    --font-sub: 'Nunito Sans', sans-serif;
    --r: 24px;
    --r-sm: 14px;
  }

  html, body { height: 100%; background: var(--bg); }

  .app {
    font-family: var(--font-body);
    background: var(--bg);
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px 48px;
    position: relative;
    overflow: hidden;
    color: var(--text);
  }

  .blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 { width: 340px; height: 340px; background: #c7d9ff; opacity: 0.55; top: -100px; right: -80px; }
  .blob-2 { width: 260px; height: 260px; background: #d4f0e8; opacity: 0.5; bottom: -80px; left: -60px; }
  .blob-3 { width: 180px; height: 180px; background: #fde8f5; opacity: 0.4; top: 40%; left: -50px; }

  .card {
    position: relative;
    z-index: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    width: 100%;
    max-width: 390px;
    overflow: hidden;
    box-shadow: var(--shadow);
    animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-header {
    padding: 18px 22px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: 0.3px;
  }
  .brand-icon {
    width: 30px; height: 30px;
    background: var(--accent-light);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
  }
  .status-pill {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 100px;
  }
  .pill-waiting { background: #f1f3f9; color: var(--muted); border: 1px solid var(--border); }
  .pill-ready {
    background: #dcfce7;
    color: var(--ready-text);
    border: 1px solid var(--ready-border);
    animation: pulse-pill 2s ease-in-out infinite;
  }
  @keyframes pulse-pill {
    0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.2); }
    50%      { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
  }

  .ticket-id-section {
    padding: 22px 22px 18px;
    border-bottom: 1px solid var(--border);
  }
  .label {
    font-size: 10px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.8px;
    margin-bottom: 6px;
    font-family: var(--font-sub);
  }
  .ticket-id {
    font-size: 38px;
    font-weight: 800;
    letter-spacing: 2px;
    line-height: 1.1;
    color: var(--text);
  }
  .item-name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-light);
    padding: 4px 10px;
    border-radius: 100px;
    margin-top: 10px;
  }

  .queue-section {
    padding: 20px 22px 8px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .queue-badge {
    width: 80px; height: 80px;
    border-radius: 22px;
    background: var(--accent-light);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 2px solid rgba(79,126,248,0.15);
  }
  .queue-number { font-size: 38px; font-weight: 800; line-height: 1; color: var(--accent); }
  .queue-badge-label {
    font-size: 9px; font-weight: 700; color: var(--accent);
    opacity: 0.6; text-transform: uppercase; letter-spacing: 0.8px;
  }
  .queue-meta { flex: 1; }
  .queue-meta-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
  .queue-total { font-size: 12px; font-weight: 500; color: var(--muted); font-family: var(--font-sub); }

  .progress-section { padding: 14px 22px 20px; }
  .progress-track { height: 8px; background: var(--accent-light); border-radius: 100px; overflow: hidden; }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #7ba6ff, var(--accent));
    border-radius: 100px;
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }
  .progress-labels {
    display: flex; justify-content: space-between;
    font-size: 10px; font-weight: 600; color: var(--muted);
    margin-top: 7px; font-family: var(--font-sub); letter-spacing: 0.3px;
  }

  .eta-section {
    margin: 0 22px 20px;
    padding: 14px 16px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: var(--r-sm);
    display: flex; align-items: center; gap: 12px;
  }
  .eta-icon {
    width: 38px; height: 38px; background: #fef3c7;
    border-radius: 11px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .eta-label { font-size: 11px; font-weight: 600; color: #92400e; font-family: var(--font-sub); letter-spacing: 0.3px; }
  .eta-value { font-size: 20px; font-weight: 800; color: #78350f; margin-top: 1px; }

  .ready-section {
    padding: 32px 22px 28px; text-align: center;
    background: var(--ready-bg); border-top: 1px solid var(--ready-border);
    animation: fadeIn 0.5s ease both;
  }
  .ready-icon {
    font-size: 52px; margin-bottom: 14px; display: block;
    animation: bounceIn 0.7s cubic-bezier(0.36,0.07,0.19,0.97) both;
  }
  @keyframes bounceIn {
    0%  { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.15); opacity: 1; }
    80% { transform: scale(0.95); }
    100%{ transform: scale(1); }
  }
  .ready-title { font-size: 28px; font-weight: 800; color: var(--ready-text); margin-bottom: 8px; }
  .ready-sub { font-size: 14px; color: #4ade80; font-weight: 500; line-height: 1.5; font-family: var(--font-sub); }
  .ready-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #dcfce7; border: 1px solid var(--ready-border);
    color: var(--ready-text); font-size: 12px; font-weight: 700;
    padding: 6px 14px; border-radius: 100px; margin-top: 14px;
  }

  .card-footer {
    padding: 12px 22px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: #fafbff;
  }
  .footer-time { font-size: 11px; font-weight: 500; color: var(--muted); font-family: var(--font-sub); }
  .refresh-btn {
    font-family: var(--font-body); font-size: 11px; font-weight: 700;
    color: var(--accent); background: var(--accent-light);
    border: 1px solid rgba(79,126,248,0.2); border-radius: 100px;
    padding: 6px 14px; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    transition: background 0.2s, transform 0.1s;
  }
  .refresh-btn:hover { background: #dce8ff; }
  .refresh-btn:active { transform: scale(0.97); }
  .refresh-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .spin { animation: spin 0.9s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 390px;
    text-align: center; animation: fadeIn 0.4s ease both;
  }
  .loading-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin 0.9s linear infinite;
    margin: 0 auto 18px;
  }
  .loading-text { font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: 0.3px; }

  .error-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 390px; text-align: center;
    background: var(--surface); border: 1px solid #fee2e2;
    border-radius: var(--r); padding: 36px 28px; box-shadow: var(--shadow);
  }
  .error-emoji { font-size: 44px; margin-bottom: 14px; }
  .error-title { font-size: 20px; font-weight: 800; color: #dc2626; margin-bottom: 8px; }
  .error-msg { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 22px; font-family: var(--font-sub); }
  .retry-btn {
    font-family: var(--font-body); font-size: 13px; font-weight: 700;
    background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 100px; padding: 10px 24px; cursor: pointer; transition: background 0.2s;
  }
  .retry-btn:hover { background: #fee2e2; }

  .landing-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 390px; text-align: center;
  }
  .landing-logo {
    width: 64px; height: 64px; background: var(--surface);
    border-radius: 20px; box-shadow: var(--shadow-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; margin: 0 auto 20px; border: 1px solid var(--border);
  }
  .landing-title { font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 10px; line-height: 1.2; }
  .landing-sub {
    font-size: 14px; color: var(--muted); line-height: 1.7;
    margin-bottom: 32px; font-family: var(--font-sub); font-weight: 400;
  }
  .qr-placeholder {
    width: 150px; height: 150px; margin: 0 auto 28px;
    border: 2px dashed #c7d9ff; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 52px; background: var(--accent-light);
  }
  .demo-btn {
    font-family: var(--font-body); font-size: 14px; font-weight: 700;
    background: var(--accent); color: #fff; border: none;
    border-radius: 100px; padding: 14px 32px; cursor: pointer;
    box-shadow: 0 4px 16px rgba(79,126,248,0.35);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .demo-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,126,248,0.4); }
  .demo-btn:active { transform: scale(0.98); }

  .demo-controls {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    z-index: 10; display: flex; gap: 6px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
    border: 1px solid var(--border); border-radius: 100px;
    padding: 8px 12px; box-shadow: var(--shadow);
  }
  .demo-controls span {
    font-size: 10px; font-weight: 700; color: var(--muted);
    display: flex; align-items: center; padding: 0 6px;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .dc-btn {
    font-family: var(--font-body); font-size: 11px; font-weight: 700;
    background: #f1f3f9; color: var(--text); border: 1px solid var(--border);
    border-radius: 100px; padding: 5px 13px; cursor: pointer; transition: background 0.15s;
  }
  .dc-btn:hover { background: var(--accent-light); color: var(--accent); }
  .dc-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

// ─────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────
function TicketView({ ticket, onRefresh, loading }: { ticket: Ticket; onRefresh: () => void; loading: boolean }) {
  const isReady = ticket.status === "ready";
  const progress = Math.max(
    5,
    Math.round(((ticket.totalInQueue - ticket.queuePosition) / ticket.totalInQueue) * 100)
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="brand">
          <div className="brand-icon">🎟️</div>
          My Queue
        </div>
        <span className={`status-pill ${isReady ? "pill-ready" : "pill-waiting"}`}>
          {isReady ? "✓ Ready!" : "⏳ Waiting"}
        </span>
      </div>

      <div className="ticket-id-section">
        <div className="label">Your Ticket</div>
        <div className="ticket-id">{ticket.id}</div>
        {ticket.itemName && <div className="item-name">🍽️ {ticket.itemName}</div>}
      </div>

      {!isReady && (
        <>
          <div className="queue-section">
            <div className="queue-badge">
              <div className="queue-number">{ticket.queuePosition}</div>
              <div className="queue-badge-label">in line</div>
            </div>
            <div className="queue-meta">
              <div className="queue-meta-title">Your position</div>
              <div className="queue-total">{ticket.totalInQueue} people in total queue</div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-labels">
              <span>Joined</span>
              <span>{progress}% complete</span>
              <span>Ready</span>
            </div>
          </div>

          <div className="eta-section">
            <div className="eta-icon">⏱️</div>
            <div>
              <div className="eta-label">Estimated wait time</div>
              <div className="eta-value">
                {ticket.estimatedMinutes != null
                  ? `About ${ticket.estimatedMinutes} minutes`
                  : "Calculating…"}
              </div>
            </div>
          </div>
        </>
      )}

      {isReady && (
        <div className="ready-section">
          <span className="ready-icon">🎉</span>
          <div className="ready-title">Your order is ready!</div>
          <div className="ready-sub">Please head to the counter to collect your item.</div>
          <div className="ready-badge">✓ Go collect now</div>
        </div>
      )}

      <div className="card-footer">
        <span className="footer-time">🕐 Issued {timeSince(ticket.issuedAt)}</span>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          <span className={loading ? "spin" : ""}>↻</span>
          {loading ? "Updating…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="loading-card">
      <div className="loading-spinner" />
      <div className="loading-text">Fetching your ticket…</div>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-card">
      <div className="error-emoji">😕</div>
      <div className="error-title">Something went wrong</div>
      <div className="error-msg">{message}</div>
      <button className="retry-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

function LandingView({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="landing-card">
      <div className="landing-logo">🎟️</div>
      <div className="landing-title">Scan to join the queue</div>
      <div className="landing-sub">
        Point your camera at the QR code at the counter to receive your queue ticket and track your spot in real time.
      </div>
      <div className="qr-placeholder">📷</div>
      <button className="demo-btn" onClick={onDemo}>
        Try a Demo Ticket
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [ticket, setTicket]         = useState<Ticket | null>(null);
  const [phase, setPhase]           = useState<"init" | "loading" | "ticket" | "error" | "landing">("init");
  const [errorMsg, setErrorMsg]     = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [demoMode, setDemoMode]     = useState(false);
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!document.getElementById("tq-styles")) {
      const el = document.createElement("style");
      el.id = "tq-styles";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const id = getTicketIdFromUrl();
    if (id) loadTicket(id);
    else setPhase("landing");
  }, []);

  useEffect(() => {
    if (ticket && ticket.status !== "ready" && ticket.status !== "claimed") {
      pollRef.current = setInterval(() => silentRefresh(ticket.id), 15000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ticket]);

  async function loadTicket(id: string) {
    setPhase("loading");
    try {
      const data = await fetchTicket(id);
      setTicket(data);
      setPhase("ticket");
    } catch {
      setErrorMsg("Could not load your ticket. Please check your connection and try again.");
      setPhase("error");
    }
  }

  async function silentRefresh(id: string) {
    setRefreshing(true);
    try {
      const data = await fetchTicket(id);
      setTicket(data);
    } catch { /* keep showing last known state */ }
    setRefreshing(false);
  }

  function handleDemo() {
    mockStateIndex = 0;
    setDemoMode(true);
    loadTicket("TKT-4892");
  }

  function cycleDemoState(idx: number) {
    mockStateIndex = idx;
    loadTicket("TKT-4892");
  }

  return (
    <div className="app">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {(phase === "init" || phase === "loading") && <LoadingView />}
      {phase === "landing" && <LandingView onDemo={handleDemo} />}
      {phase === "ticket" && ticket && (
        <TicketView
          ticket={ticket}
          onRefresh={() => silentRefresh(ticket.id)}
          loading={refreshing}
        />
      )}
      {phase === "error" && (
        <ErrorView
          message={errorMsg}
          onRetry={() => {
            const id = getTicketIdFromUrl();
            if (id) loadTicket(id); else setPhase("landing");
          }}
        />
      )}

      {demoMode && phase === "ticket" && (
        <div className="demo-controls">
          <span>Demo:</span>
          {["Waiting (far)", "Waiting (near)", "Ready"].map((label, i) => (
            <button
              key={i}
              className={`dc-btn ${mockStateIndex % 3 === i ? "active" : ""}`}
              onClick={() => cycleDemoState(i)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}