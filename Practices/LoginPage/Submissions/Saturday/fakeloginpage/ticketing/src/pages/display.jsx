// client/display.jsx
import { useState, useEffect } from "react";
import { socket, getAllTickets } from "../api.js";

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
    --font: 'Sora', sans-serif;
    --radius: 12px;
  }
  body { background: var(--bg); font-family: var(--font); color: var(--text);
    min-height: 100dvh; -webkit-font-smoothing: antialiased; }
  .nav { position: sticky; top: 0; z-index: 10; background: var(--surface);
    border-bottom: 1px solid var(--border); display: flex; align-items: center;
    padding: 0 16px; height: 52px; gap: 6px; }
  .nav-brand { font-size: 14px; font-weight: 600; letter-spacing: -.2px; flex: 1; }
  .nav-chip { font-size: 10px; font-weight: 600; letter-spacing: .8px;
    text-transform: uppercase; background: var(--faint); border: 1px solid var(--border);
    color: var(--muted); padding: 4px 10px; border-radius: 100px; }
  .display { padding: 20px 14px 40px; display: grid; grid-template-columns: 1fr 1fr;
    gap: 12px; max-width: 540px; margin: 0 auto; }
  .col-header { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
  .col-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .col-dot.preparing { background: #c49a00; }
  .col-dot.ready     { background: #2a8a50; }
  .col-label { font-size: 10px; font-weight: 600; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--muted); }
  .col-badge { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--muted); }
  .tickets-list { display: flex; flex-direction: column; gap: 7px; }
  .ticket { border-radius: var(--radius); display: flex; align-items: center;
    padding: 13px 14px; border: 1px solid; }
  .ticket.preparing { background: var(--preparing-bg); border-color: var(--preparing-border); }
  .ticket.ready     { background: var(--ready-bg);     border-color: var(--ready-border); }
  .ticket-num { font-size: 24px; font-weight: 700; line-height: 1;
    letter-spacing: -1px; flex: 1; }
  .ticket.preparing .ticket-num { color: var(--preparing-text); }
  .ticket.ready     .ticket-num { color: var(--ready-text); }
  .ticket-check { font-size: 14px; color: var(--ready-text); opacity: .7; }
  .ticket-spinner { width: 14px; height: 14px; border: 2px solid var(--preparing-border);
    border-top-color: var(--preparing-text); border-radius: 50%;
    animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty-col { color: var(--muted); font-size: 12px; padding: 16px 0; }
  .pop { animation: pop .35s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes pop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

/* ─────────────────────────────────────────────
   HOOK
   1. Fetches all tickets on mount (HTTP)
   2. Opens a Socket.io connection
   3. Patches state on 'ticket_update' (single change)
   4. Replaces state on 'ticket_reset'  (full reset)
───────────────────────────────────────────── */
function useTickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Initial load
    getAllTickets().then(setTickets);

    // Real-time updates from server
    socket.connect();

    socket.on("ticket_update", (updated) => {
      // Single ticket changed — patch just that one
      setTickets((prev) =>
        prev.map((t) => (t.num === updated.num ? updated : t))
      );
    });

    socket.on("ticket_reset", (all) => {
      // Full reset from admin
      setTickets(all);
    });

    return () => {
      socket.off("ticket_update");
      socket.off("ticket_reset");
      socket.disconnect();
    };
  }, []);

  return { tickets };
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function DisplayPage() {
  const { tickets } = useTickets();

  const preparing = tickets.filter((t) => t.status === "preparing");
  const ready     = tickets.filter((t) => t.status === "ready");

  return (
    <>
      <style>{STYLES}</style>

      <nav className="nav">
        <span className="nav-brand">Orders</span>
        <span className="nav-chip">Display</span>
      </nav>

      <div className="display">
        {/* Preparing column */}
        <div>
          <div className="col-header">
            <span className="col-dot preparing" />
            <span className="col-label">Preparing</span>
            <span className="col-badge">{preparing.length}</span>
          </div>
          <div className="tickets-list">
            {preparing.length === 0 && <p className="empty-col">None</p>}
            {preparing.map((t) => (
              <div key={t.num} className="ticket preparing pop">
                <span className="ticket-num">{t.num}</span>
                <span className="ticket-spinner" />
              </div>
            ))}
          </div>
        </div>

        {/* Ready column */}
        <div>
          <div className="col-header">
            <span className="col-dot ready" />
            <span className="col-label">Ready</span>
            <span className="col-badge">{ready.length}</span>
          </div>
          <div className="tickets-list">
            {ready.length === 0 && <p className="empty-col">None</p>}
            {ready.map((t) => (
              <div key={t.num} className="ticket ready pop">
                <span className="ticket-num">{t.num}</span>
                <span className="ticket-check">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
