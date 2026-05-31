---
name: home-brief-sources
description: Use when compiling the Home-Sweet-Home morning brief. Runs one sub-agent per data source (calendar, inbox, tasks, chef) in parallel — each pulls and summarizes ONLY its own source — then hands clean section data to the brief. This is the "go wide" source fleet for the shared household dashboard (Rod + Chio).
trigger: Building or refreshing the Home-Sweet-Home web brief, or testing a single household source.
args:
  - sources    # optional: subset of roster to run (default: all enabled)
  - date       # optional: target day (default: today)
---

# Home-Sweet-Home Source Fleet

One sub-agent per source, run in parallel (same fan-out pattern as `research-fleet`).
Each agent pulls + summarizes ONLY its own source so the brief is never one giant
prompt. Output of each becomes a `sections` block in the Home-Sweet-Home brief.

This brief is the SHARED household dashboard (Conns + Rod + Chio). It is separate
from Conns' personal Telegram brief. Same Gmail/Calendar accounts feed both — the
difference is the FILTER (household lens here, work lens there).

---

## ⚙️ THE ROSTER — edit here to add/drop sources

| sub-agent      | source            | filter / scope                                             | tier   | enabled |
|----------------|-------------------|------------------------------------------------------------|--------|---------|
| home-calendar  | Google Calendar MCP | "Familia Blancas Sota", eventos de **HOY** solamente      | haiku  | ✅ yes  |
| home-inbox     | Gmail MCP         | dominio `colegiociudad.edu.mx` en **from OR to**, últimas 24 h | haiku  | ✅ yes  |
| home-tasks     | Todoist REST API  | proyecto "Familia", due **≤ hoy** (hoy + vencidos)        | haiku  | ✅ yes  |
| home-chef      | (Cairn — S5)      | qué se cocina hoy + ideas desayuno/cena                   | sonnet | 🔮 stub |

> To add a source: add a row, give it a filter + tier, set enabled. To drop one:
> set enabled to no. Nothing else changes.

---

## Source specs

### home-calendar  (tier: haiku)
- Tool: Google Calendar MCP → `list_events`
- calendarId: `1900f49c175388041830ce4ab64cf072bd065671e417b1c2c003d0522121d12f@group.calendar.google.com`  (Familia Blancas Sota)
- Window: **HOY solamente** (00:00–23:59 hora CDMX). pageSize ~10.
- Return: bullets — eventos familiares de hoy con hora. Si está vacío: "sin actividades hoy".

### home-inbox  (tier: haiku)  — solo colegio
- Tool: Gmail MCP → `search_threads`
- Query: `(from:colegiociudad.edu.mx OR to:colegiociudad.edu.mx) newer_than:1d`
  (el `to:` es clave — Google Classroom manda DE `no-reply@classroom.google.com`
  HACIA `*.blancas@colegiociudad.edu.mx`; sin `to:` se pierden esos avisos.)
- Dominio correcto: `colegiociudad.edu.mx` (con "d"). Amazon/La Comer: REMOVIDOS del brief.
- Return: una línea por correo del colegio (maestros + Classroom). Vacío → decirlo.

### home-tasks  (tier: haiku)  — needs TODOIST_API_TOKEN in Infisical
- Method: Todoist REST API v1 (reuses the pattern from `~/.claude/hooks/todoist-p1.sh`).
- Run with secret injected: `infisical run --env=dev -- <command>`
  (token = `TODOIST_API_TOKEN`, lives in Infisical project morning-brief-8d, NEVER on disk).
- Step 1: GET `https://api.todoist.com/api/v1/projects` → find id of project "Familia".
- Step 2: GET `https://api.todoist.com/api/v1/tasks` (paginate via next_cursor), filter
  to that project_id, not completed, due ≤ target date.
- Return: bullets of household to-dos; surface "hacer súper" prominently if present.

### home-chef  (tier: sonnet)  — 🔮 STUB until S5 Cairn
The richest agent, intentionally deferred. Today: placeholder. In block 5 (Cairn) it
gets real memory.
- Job (future): say what's cooking TODAY + give breakfast/dinner ideas.
- Black boxes to open in S5 (memory in disk = the Cairn):
  - menu history (past weekly menus)
  - liked restaurant menus
  - rules: color variety + weekly variety
  - preferences: love / dislike / never-eat
  - "what's planned today" (likely a weekly-menu task in Todoist "Familia")
- Until then: returns "menu memory not wired yet — build in S5".

---

## Composición diaria del brief (orden definido por Conns, 2026-05-31)
1. **Título** (una línea)
2. **Agenda de hoy (Familia)** — solo eventos de hoy
3. **Pendientes de hoy y vencidos (Familia)** — Todoist due ≤ hoy
4. **Correos de los niños (colegio, 24 h)** — colegiociudad.edu.mx (from/to)
5. **Qué se cocina hoy** — home-chef (stub hasta el Cairn)
6. **Resumen (1–3 frases)** — AL FINAL, no arriba

Notas:
- `top_priority` es REQUERIDO por `brief-contract.json`, así que se llena (del item más
  urgente) aunque Conns no lo quiera destacar en el render. No se muestra prominente.
- Secciones removidas del diseño previo: Prioridad destacada, Bandeja Amazon/La Comer.

## How it runs (fan-out)
1. Resolve enabled roster (skip stubs/disabled).
2. Spawn all enabled sub-agents in PARALLEL (one message, multiple Agent calls),
   each with its source spec + tier. Use `Explore` agent type (read-only).
3. Each returns structured bullets for its section. A failed source is noted and
   skipped — the brief still ships.
4. (S5) home-chef pulls from the Cairn for menu memory.

## How it feeds the Morning Brief (S5)
- Each sub-agent's output = one `sections` block: "Agenda familiar", "Pendientes de
  casa", "Bandeja de casa", "Qué se cocina hoy".
- The capstone (block 6) compiles these into the Home-Sweet-Home web brief
  (Vercel + Supabase) that Rod & Chio open.

## Do not
- Do not mix work calendars/emails into this brief — household lens only.
- Do not run sources sequentially — fan out.
- Do not put the Todoist token (or any secret) in a file — inject via `infisical run`.
- Do not build the brief here — that's the S5/block-6 capstone.
