# Ticketing System 

- Project written for funtasia

- Frontend by claude, everything else by my pet cat (maiself)

**Web Link**: https://ticketing.saturday-s.com

**Admin Page**: https://ticketing.saturday-s.com/admin (Password: House that starts with S)

Tech Stack:
- Frontend: (React, JS, TS)
- Backend: Node.js (Express), PM2
- Database: PostgreSQL
- Realtime: Socket.io
- Monitoring & Observability: Openetelemetry, Grafana, LGTM, Using Tempo for Traces, Mimir/Prometheus for Metrics
- Reverse Proxy: Nginx
- Infra: Cloudflare, Docker
- IaC: Terraform

---

# Architecture Review

```
React Frontend
      │
      ▼
Cloudflare Tunnel / Nginx Reverse Proxy
      │
      ▼
Node.js (Express) Backend [Port 3001]
      ├── PostgreSQL
      ├── Socket.io (Real-time updates)
      └── OpenTelemetry instrumentation
```
---

## PostgreSQL Database


```sql
-- Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR UNIQUE NOT NULL,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL
);

-- Tickets
CREATE TABLE tickets (
  num    SERIAL PRIMARY KEY,
  status VARCHAR NOT NULL DEFAULT 'idle'
);
```
---

## Auth

Uses JWT, single admin account single password

---

## Obervability & Monitoring

![Dashboard](./assets/grafana.png)

Data Pipeline
- Traces → Tempo
- Metrics → Prometheus / Mimir
- Visualisation → Grafana

---

## Real-time Updates

Socket.io is used to broadcast updates instantly without polling

### Events

- `ticket_update` — emitted when a ticket status changes  
- `ticket_reset` — emitted when all tickets are reset

---


## Future Improvements

- Proper admin management (This can be done with supabase auth)
- LGTM stack split into seperate k8 clusters for future scalability
- Redis adapator for sokket.io
- Add cats


