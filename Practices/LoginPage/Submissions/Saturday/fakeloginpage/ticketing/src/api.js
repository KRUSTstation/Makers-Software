// client/api.js
// ─────────────────────────────────────────────
// The ONLY file that talks to the backend.
// Both admin.jsx and display.jsx import from here.
// To change the backend, only edit this file.
// ─────────────────────────────────────────────

import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "https://ticketing.saturday-s.com";

/* ── Socket (used by Display to receive live updates) ── */
export const socket = io(BASE_URL, { autoConnect: false });

/* ── Auth ─────────────────────────────────────────────── */

// Returns a token string or throws on bad password
export async function login(password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Wrong password");
  const { token } = await res.json();
  return token;
}

/* ── Tickets ──────────────────────────────────────────── */

// GET all tickets — used by both pages on mount
export async function getAllTickets() {
  const res = await fetch(`${BASE_URL}/tickets`);
  if (!res.ok) throw new Error("Failed to load tickets");
  return res.json(); // [{ num, status }, ...]
}

// PATCH a single ticket status — admin only, needs token
export async function setTicketStatus(num, status, token) {
  const res = await fetch(`${BASE_URL}/tickets/${num}`, {
    method:  "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update ticket");
  return res.json(); // { num, status }
}

// POST reset all tickets — admin only, needs token
export async function resetTickets(token) {
  const res = await fetch(`${BASE_URL}/tickets/reset`, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reset tickets");
  return res.json(); // [{ num, status }, ...]
}
