// client/admin.jsx
import { useState, useEffect, useCallback } from "react";
import { login, getAllTickets, setTicketStatus, resetTickets } from "../api.js";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:                #f4f4f2;
    --surface:           #ffffff;
    --border:            #e8e8e5;
    --text:              #111110;
    --muted:             #9a9a95;
    --faint:             #f0f0ee;
    --preparing-bg:      #fffaf0;
    --preparing-border:  #e8d9b0;
    --preparing-text:    #7a5c00;
    --ready-bg:          #f0faf4;
    --ready-border:      #b0d9be;
    --ready-text:        #1a5c32;
    --error:             #c0392b;
    --font: 'Sora', sans-serif;
    --radius: 12px;
  }
  body { background: var(--bg); font-family: var(--font); color: var(--text);
    min-height: 100dvh; -webkit-font-smoothing: antialiased; }

  /* Nav */
  .nav { position: sticky; top: 0; z-index: 10; background: var(--surface);
    border-bottom: 1px solid var(--border); display: flex; align-items: center;
    padding: 0 16px; height: 52px; gap: 6px; }
  .nav-brand { font-size: 14px; font-weight: 600; letter-spacing: -.2px; flex: 1; }
  .nav-chip { font-size: 10px; font-weight: 600; letter-spacing: .8px;
    text-transform: uppercase; background: var(--faint); border: 1px solid var(--border);
    color: var(--muted); padding: 4px 10px; border-radius: 100px; }
  .nav-logout { background: none; border: none; font-family: var(--font);
    font-size: 12px; color: var(--muted); cursor: pointer; padding: 4px 8px;
    border-radius: 8px; transition: color .15s; }
  .nav-logout:hover { color: var(--error); }

  /* Login */
  .login-wrap { display: flex; align-items: center; justify-content: center;
    min-height: calc(100dvh - 52px); padding: 24px; }
  .login-card { background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 28px 24px; width: 100%; max-width: 320px; }
  .login-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
  .login-sub { font-size: 12px; color: var(--muted); margin-bottom: 20px; }
  .login-input { width: 100%; border: 1px solid var(--border); border-radius: var(--radius);
    font-family: var(--font); font-size: 14px; padding: 12px 14px; outline: none;
    transition: border-color .15s; background: var(--bg); color: var(--text); }
  .login-input:focus { border-color: var(--text); }
  .login-btn { width: 100%; margin-top: 10px; background: var(--text); color: var(--bg);
    border: none; border-radius: var(--radius); font-family: var(--font);
    font-size: 13px; font-weight: 600; padding: 13px; cursor: pointer;
    transition: opacity .15s; }
  .login-btn:disabled { opacity: .4; cursor: not-allowed; }
  .login-error { font-size: 12px; color: var(--error); margin-top: 10px; text-align: center; }

  /* Admin */
  .admin { padding: 20px 14px 40px; max-width: 540px; margin: 0 auto; }
  .legend { display: flex; gap: 14px; margin-bottom: 16px; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
  .legend-label { font-size: 11px; color: var(--muted); letter-spacing: .3px; }
  .admin-hint { font-size: 11px; color: var(--muted); text-align: center;
    margin-bottom: 16px; line-height: 1.5; }
  .admin-grid { display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 10px; margin-bottom: 20px; }
  .admin-ticket { background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--radius); padding: 14px 8px 12px; display: flex;
    flex-direction: column; align-items: center; gap: 8px; cursor: pointer;
    transition: border-color .15s, background .15s, transform .1s;
    -webkit-tap-highlight-color: transparent; }
  .admin-ticket:active { transform: scale(.95); }
  .admin-ticket.disabled { opacity: .5; pointer-events: none; }
  .admin-ticket.preparing { background: var(--preparing-bg); border-color: var(--preparing-border); }
  .admin-ticket.ready     { background: var(--ready-bg);     border-color: var(--ready-border); }
  .admin-num { font-size: 26px; font-weight: 700; line-height: 1; letter-spacing: -1px; }
  .admin-ticket.idle        .admin-num { color: var(--muted); }
  .admin-ticket.preparing   .admin-num { color: var(--preparing-text); }
  .admin-ticket.ready       .admin-num { color: var(--ready-text); }
  .admin-status { font-size: 9px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; }
  .admin-ticket.idle        .admin-status { color: var(--muted); }
  .admin-ticket.preparing   .admin-status { color: var(--preparing-text); }
  .admin-ticket.ready       .admin-status { color: var(--ready-text); }
  .reset-btn { width: 100%; background: none; border: 1px solid var(--border);
    border-radius: var(--radius); font-family: var(--font); font-size: 13px;
    font-weight: 500; color: var(--muted); padding: 13px; cursor: pointer;
    transition: background .15s, color .15s; }
  .reset-btn:hover { background: var(--faint); color: var(--text); }
  .reset-btn:disabled { opacity: .4; cursor: not-allowed; }
`;

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CYCLE        = { idle: "preparing", preparing: "ready", ready: "idle" };
const STATUS_LABEL = { idle: "Idle", preparing: "Prep", ready: "Ready" };

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const token = await login(password);
      onLogin(token);
    } catch {
      setError("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">Admin access</div>
        <div className="login-sub">Enter your password to continue</div>
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <button
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading || !password}
        >
          {loading ? "Checking…" : "Sign in"}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN PANEL
───────────────────────────────────────────── */
function AdminPanel({ token, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [busy,    setBusy]    = useState(false);

  const load = useCallback(async () => {
    setTickets(await getAllTickets());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTap = async (t) => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await setTicketStatus(t.num, CYCLE[t.status], token);
      // Optimistic update — server also broadcasts via Socket.io
      setTickets((prev) =>
        prev.map((x) => (x.num === updated.num ? updated : x))
      );
    } catch (err) {
      if (err.message.includes("401")) onLogout(); // token expired
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setTickets(await resetTickets(token));
    } catch (err) {
      if (err.message.includes("401")) onLogout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin">
      <div className="legend">
        {[
          { color: "#ccc",    label: "Idle" },
          { color: "#c49a00", label: "Preparing" },
          { color: "#2a8a50", label: "Ready" },
        ].map(({ color, label }) => (
          <div className="legend-item" key={label}>
            <div className="legend-dot" style={{ background: color }} />
            <span className="legend-label">{label}</span>
          </div>
        ))}
      </div>

      <p className="admin-hint">Tap a ticket to cycle its status</p>

      <div className="admin-grid">
        {tickets.map((t) => (
          <button
            key={t.num}
            className={`admin-ticket ${t.status} ${busy ? "disabled" : ""}`}
            onClick={() => handleTap(t)}
          >
            <span className="admin-num">{t.num}</span>
            <span className="admin-status">{STATUS_LABEL[t.status]}</span>
          </button>
        ))}
      </div>

      <button className="reset-btn" onClick={handleReset} disabled={busy}>
        Reset all tickets
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function AdminApp() {
  // Token lives in memory only — cleared on page refresh (intentional)
  const [token, setToken] = useState(null);

  return (
    <>
      <style>{STYLES}</style>

      <nav className="nav">
        <span className="nav-brand">Orders</span>
        <span className="nav-chip">Admin</span>
        {token && (
          <button className="nav-logout" onClick={() => setToken(null)}>
            Sign out
          </button>
        )}
      </nav>

      {token ? (
        <AdminPanel token={token} onLogout={() => setToken(null)} />
      ) : (
        <LoginForm onLogin={setToken} />
      )}
    </>
  );
}
