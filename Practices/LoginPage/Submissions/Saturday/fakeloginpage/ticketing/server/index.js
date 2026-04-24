
// npm install express pg socket.io jsonwebtoken dotenv cors

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import pg from "pg";
import "dotenv/config";
import { trace, SpanStatusCode, metrics } from "@opentelemetry/api";

/* ─── Config ────*/
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;          // long random string
const ADMIN_PASS = process.env.ADMIN_PASSWORD;      // your chosen password
const CLIENT_URL = process.env.CLIENT_URL || "https://ticketing.saturday-s.com";

const tracer = trace.getTracer('ticketing-server', '1.0.0',);
const meter = metrics.getMeter('ticketing-server', '1.0.0');

const loginCounter = meter.createCounter('auth.login.attempts', { description: "Login Attempts" });
const ticketUpdateCounter = meter.createCounter('tickets.updates', { description: "Ticket Status Updates" });
const ticketResetCounter = meter.createCounter('tickets.resets', { description: "Ticket Resets" });
const activeConnectionsGauge = meter.createObservableGauge('socket.active_connections', { description: "Active Socket Connections" });

let activeConnections = 0;
activeConnectionsGauge.addCallback((result) => {
  result.observe(activeConnections);
});


// const opentelemetry = require('@opentelemetry/api');


if (!JWT_SECRET || !ADMIN_PASS) {
  console.error("Missing JWT_SECRET or ADMIN_PASSWORD in .env");
  process.exit(1);
}

/* ─── Database ──── */
const db = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "ticketing",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});

/*App setup  */
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

/* Auth middleware  */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ─── Routes ─── */

// POST /auth/login  { password }  → { token }

app.post("/auth/login", (req, res) => {
  tracer.startActiveSpan('login', async (span) => {
    try {
      if (req.body.password !== ADMIN_PASS) {
        loginCounter.add(1, { 'login.success': false });
        return res.status(401).json({ error: "Wrong password" });
      }
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
      res.json({ token });
      loginCounter.add(1, { 'login.success': true });
      span.end();
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.end();
      throw err;
    }
  });
});


// GET /tickets  → [{ num, status }, ...]

app.get("/tickets", async (_req, res) => {
  tracer.startActiveSpan('get_tickets', async (span) => {
    try {
      const { rows } = await db.query("SELECT num, status FROM tickets ORDER BY num");
      res.json(rows);
      span.end();
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.end();
      throw err;
    }
  });
});


// PATCH /tickets/:num  { status }  → updated ticket   (admin only)

app.patch("/tickets/:num", requireAuth, async (req, res) => {
  tracer.startActiveSpan('update_ticket', async (span) => {
    try {
      const num = parseInt(req.params.num, 10);
      const { status } = req.body;

      if (!["idle", "preparing", "ready"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      let rows;
      await tracer.startActiveSpan('db_update_ticket', async (dbSpan) => {
        dbSpan.setAttribute('ticket.num', num);
        dbSpan.setAttribute('ticket.status', status);
        ({ rows } = await db.query(
          "UPDATE tickets SET status = $1 WHERE num = $2 RETURNING num, status",
          [status, num]
        ));
        dbSpan.end();
      });

      if (!rows.length) return res.status(404).json({ error: "Ticket not found" });

      // Broadcast to all Display clients in real time
      tracer.startActiveSpan('broadcast_ticket_update', async (broadcastSpan) => {
        broadcastSpan.setAttribute('ticket.num', num);
        broadcastSpan.setAttribute('ticket.status', status);
        io.emit("ticket_update", rows[0]);
        broadcastSpan.end();
      });

      res.json(rows[0]);
      ticketUpdateCounter.add(1, { 'ticket.status': status });
      span.end();
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.end();
      throw err;
    }
  });
});

// POST /tickets/reset  (admin only)

app.post("/tickets/reset", requireAuth, async (_req, res) => {
  tracer.startActiveSpan('reset_tickets', async (span) => {
    try {
      let rows;
      await tracer.startActiveSpan('db_reset_tickets', async (dbSpan) => {
        dbSpan.setAttribute('action', 'reset_all_tickets');
        await db.query("UPDATE tickets SET status = 'idle'");
        ({ rows } = await db.query("SELECT num, status FROM tickets ORDER BY num"));
        dbSpan.end();
      });

      // Broadcast full reset to all Display clients
      tracer.startActiveSpan('broadcast_ticket_reset', async (broadcastSpan) => {
        broadcastSpan.setAttribute('action', 'broadcast_ticket_reset');
        io.emit("ticket_reset", rows);
        broadcastSpan.end();
      });

      res.json(rows);
      ticketResetCounter.add(1);
      span.end();
    }
    catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.end();
      throw err;
    }
  });
});


/* ─── Socket.io ── */
io.on("connection", (socket) => {
  activeConnections++;
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    activeConnections--;
    console.log("Client disconnected:", socket.id);
  });
});

/* ─── Start ───────── */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
