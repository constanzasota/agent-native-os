# Morning Brief 8D — Decisiones (captura ligera)

> Captura de intención mientras se construye el 8D en la Asus (branch `8d-asus`).
> Reemplazo temporal del `/prd-fill` oficial (no shipeado aún — llega con Sesión 5).
> Solo intención y decisiones, NO build. Secretos solo por nombre, nunca el valor.

---

## Sección S1 — Sub-Agents + Fleets (bloque 2) ✅

**Qué se construyó:** un skill reutilizable `research-fleet` que abre una flota de
sub-agentes de investigación en paralelo (fan-out) y luego sintetiza (un solo agente).

**Ubicación:** `configs/skills/research-fleet/SKILL.md`
(NO `.claude/skills/` — los skills de este repo viven en `configs/skills/`).

### Roster decidido

| rol                   | ángulo                                              | tier   |
|-----------------------|-----------------------------------------------------|--------|
| industry-news         | noticias/regulación/mercado del sector              | haiku  |
| competitor-watch      | competidores y sustitutos                           | haiku  |
| calendar-commitments  | deadlines y compromisos propios                     | haiku  |
| regulatory-watch      | COFEPRIS / NOMs equipo médico, auditorías           | sonnet |
| (síntesis)            | dedupe + clusters + top 3-5 acciones                | sonnet |

**Knobs editables:** la tabla de roster (perilla 1) y `SYNTHESIZER_TIER` (perilla 2),
ambos dentro del SKILL.md.

### Regla mental adoptada
- **Haiku para barrer, Sonnet/Opus para pensar.** Poner caro solo donde la calidad
  cambia la decisión (ej. COFEPRIS sí; "noticias del sector" no).
- **El tier cambia profundidad Y autonomía.** Haiku necesita prompts apretados;
  Sonnet tolera ambigüedad. Observado en vivo: el scanner Haiku con prompt flojo
  se atoró pidiendo aclaraciones; el Sonnet razonó y empujó solo.
- **La flota tolera una baja:** un scanner cayó y el fleet entregó igual.

### Costo observado (corrida de prueba, aprox.)
- Corrida completa (3 scanners + síntesis): **~$0.17**
- Subir `regulatory-watch` de haiku→sonnet sumó **~$0.04** a la corrida.
- Diario barato = todo en Haiku (~$0.06). Deep semanal = `depth=deep`.

### Pendiente / black box a abrir
- `competitor-watch` (Haiku) se atora con prompts ambiguos → apretar su prompt
  o subir su tier si se quiere autonomía.
- Apretar el prompt de scanners para que no pidan aclaraciones a mitad del fan-out.

---

## Sección S2 — Security + Secrets (bloque 3) ✅

**Herramienta de bóveda:** Infisical (CLI v0.43.89, instalado vía winget
`infisical.infisical`). Login como constanza.sota@gmail.com (Infisical Cloud US).

**Proyecto de secretos:** `morning-brief-8d` (tipo Secret Management, org CSH).
Ligado al repo vía `.infisical.json` (solo guarda `workspaceId`, NUNCA valores).
Nota: el primer intento ligó por error un proyecto tipo `cert-manager` (no sirve
para secretos) — se corrigió creando un proyecto Secret Management.

**Patrón aprendido y probado en vivo (env `dev`):**
- El valor real vive SOLO en la bóveda; los archivos guardan referencias.
- Los secretos se inyectan en memoria con `infisical run -- <comando>`; nunca tocan disco.
- Regla de oro: secretos creados con placeholder `PASTE_HERE`; Conns teclea el valor
  real directo en Infisical. El valor nunca pasa por el chat.
- Prueba de runtime: `ANTHROPIC_API_KEY` se resolvió en memoria; `git grep` confirmó
  CERO valores en archivos del repo.

**Secretos provisionados (solo por nombre, nunca el valor):**
| secreto | estado |
|---|---|
| `ANTHROPIC_API_KEY` | valor de prueba puesto (sk-ant-TEST...), real pendiente de billing |
| `SUPABASE_URL` | placeholder PASTE_HERE |
| `SUPABASE_ANON_KEY` | placeholder PASTE_HERE |
| `SUPABASE_SERVICE_ROLE_KEY` | placeholder PASTE_HERE (🔒 el secreto real) |
| `VERCEL_TOKEN` | placeholder PASTE_HERE |

**Aclaración de billing:** la suscripción Claude Max ($20, claude.ai) NO da créditos
de API. La consola de desarrolladores (console.anthropic.com) cobra aparte por uso.
Activar billing real solo cuando se despliegue producción.

**Pendiente (bloque 6):** crear proyecto Supabase real + cuenta/token Vercel, y
llenar los 4 placeholders con valores reales.

---

## 🏡 Visión: Home-Sweet-Home (decisión de capa = NARANJA / web)

Conns definió un caso de uso real que justifica la capa naranja. Hay DOS briefs
distintos, separados a propósito:

| | Brief personal (azul) | Home-Sweet-Home (naranja) |
|---|---|---|
| Dónde | Telegram (privado) | Sitio web (Vercel + Supabase) |
| Quién lo ve | Solo Conns | Conns + Rod + Chio |
| Qué muestra | Su día / trabajo / agenda | Pendientes de casa, escuela, menú del día, "qué día toca súper", etc. |
| Para qué | Cerebro matutino personal | **Coordinar al equipo de la casa** |

- El brief personal se queda en Telegram (no se toca).
- Home-Sweet-Home es un **tablero de operaciones del hogar** que Rod y Chio abren online.
- Por eso se necesita Supabase (bodega de datos del hogar) + Vercel (el link).
- **Se construye completo en el bloque 6 (Capstone Deploy).**

---

## Sección S3 — Connect Your Data (bloque 4) ✅

**Patrón:** un sub-agente por fuente (fan-out, estilo research-fleet). Cada uno jala
+ resume SOLO lo suyo, en paralelo. Config en `configs/skills/home-brief-sources/SKILL.md`
(ahí se edita el roster para agregar/quitar fuentes).

**Decisión de diseño clave:** Gmail y Calendar ya conectados vía MCP sirven a AMBOS
briefs (personal + Home-Sweet-Home); cambia el FILTRO (lente household vs trabajo),
no la fuente. No se necesitó el gws CLI (su blueprint no existe en el repo).

**Roster Home-Sweet-Home (probado en vivo):**
| sub-agente | fuente | filtro | tier | estado |
|---|---|---|---|---|
| home-calendar | Calendar MCP | calendario "Familia Blancas Sota" | haiku | ✅ probado |
| home-inbox | Gmail MCP | La Comer + Amazon + dominio colegiociudad.eu.mx | haiku | ✅ probado |
| home-tasks | Todoist REST API | proyecto "Familia" (id 6Crg6pmhF45c2gQW) | haiku | ✅ probado |
| home-chef | Cairn (S5) | qué se cocina hoy + ideas + reglas variedad | sonnet | 🔮 stub |

**home-tasks:** NO usa MCP. Reusa el método del hook `~/.claude/hooks/todoist-p1.sh`
(API REST v1, `curl -4`), pero filtrado al proyecto "Familia". El token vive en
Infisical como `TODOIST_API_TOKEN` (env dev), se inyecta con `infisical run` — nunca
en archivo. Ensamble bloque 3 + bloque 4 confirmado en vivo.

**home-chef (diferido a propósito):** es un caso de Cairn (memoria en disco). Black
boxes a abrir en S5: historial de menús, menús de restaurantes favoritos, reglas de
color/variedad, preferencias (love/dislike/never-eat), fuente de "qué se planeó hoy"
(probablemente una tarea de menú semanal en Todoist Familia).

**Daily research beat:** el fleet `home-brief-sources` corre diario para compilar las
secciones del brief Home-Sweet-Home. Scanners en Haiku para que el corrido diario sea
barato; chef en Sonnet (cuando tenga memoria).

**Pendiente:** confirmar el dominio real de La Comer en el primer corrido y fijarlo.

---

## Sección S4 — Knowledge + Memory / Cairn (bloque 5) ✅

**Build:** 4D local (no 8D). El 8D (merge entre máquinas Claude+Codex) NO se hizo —
no hay `~/.codex/sessions`, la Lenovo no es alcanzable, y rompería el aislamiento.
8D se dobla en el bloque 7 (migración).

**Skill usado:** el prompt pedía `/build-agent-conversations-cairn` (no existe); se usó
el patrón real `cairns-init` + `cairns-ingest` (forma de 3 capas en markdown local).

**Vault:** `C:\Users\const\cairns-8d\` — local, FUERA del repo y FUERA de Dropbox/Obsidian.
- Por qué fuera del repo: el L3 es historial crudo PRIVADO; un `git add -A` lo subiría a
  GitHub. Principio: **código viaja por git, memoria privada viaja por copia.**
- Respaldo: DIFERIDO al bloque 7 (repo privado propio o merge a Obsidian). Hoy solo local.
  ⚠️ Riesgo aceptado: si el Asus muere antes del bloque 7, se pierde lo de hoy (rebuildeable
  desde ~/.claude/projects, que también es local).

**Contenido del Cairn:**
- L1: INDEX + waypoints personales (my-self / my-tools / my-style), personalizados.
- L2: 1 tarjeta Chain-of-Density de la sesión 8D de hoy.
- L3: 28 transcripts crudos de Claude (~55M, últimas 2 semanas) preservados.

**Recall probado:** pregunta "¿por qué naranja / qué es Home-Sweet-Home?" → respondida
desde L1+L2 con procedencia citada. Cascade L1→L2→L3 funciona.

**Gancho a home-chef:** este Cairn es la memoria que le faltaba. Black boxes aún por llenar
(bloque 6+): historial de menús, preferencias love/dislike/never-eat, reglas de variedad.

**Adaptado/omitido del prompt:** el reporte de departamento JSON
(`reports/Agent-Conversations-<today>.json`) y el harness de personalización eran del skill
faltante; se difieren al capstone (bloque 6).

---

## Sección S5 — Capstone / Ship the Morning Brief (bloque 6) ✅ fase 1

**Decisión de secuencia:** DOS FASES. El deploy web (Vercel+Supabase+fork push) cruza
al bloque 7 (migración), así que fase 1 = probar el pipeline LOCAL hoy; fase 2 = deploy
en la nube como gran final del bloque 7.

**Hallazgos del capstone:**
- La app web SÍ existe: `apps/morning-brief/` (Next.js, `vercel.json`, migración Supabase
  en `apps/morning-brief/supabase/migrations/0001_morning_brief.sql`). Deploy real posible.
- El comando `/build-morning-brief` por sí solo es 4D (Obsidian+ping), NO construye web.
  La ruta web es el `QUICKSTART-4D.md` (Vercel+Supabase) — esa seguimos para naranja.
- En Windows el delivery default (notificación macOS) no aplica → canal = Telegram
  (bot "Conns Jarvis" ya existente).

**Fase 1 — pipeline local probado end-to-end (HOY):**
1. Fuentes reales jaladas: home-calendar (6 eventos Familia), home-tasks (24, súper jue 4),
   home-inbox (1, Amazon), home-chef (stub).
2. Brief ensamblado → `C:\Users\const\cairns-8d\daily-briefs\2026-05-31-home.json` (local).
3. VALIDADO contra `brief-contract.json` (4 secciones, 4 fuentes, canal telegram).
4. Ping REAL entregado a Telegram (exit 0). `delivery_status.ok = true`.

**Plantilla de contenido Home-Sweet-Home (definida por Conns, orden final):**
1. Título · 2. Agenda de HOY (Familia) · 3. Pendientes hoy+vencidos (Familia) ·
4. Correos del colegio `colegiociudad.edu.mx` (from/to, últimas 24h) · 5. Qué se cocina hoy ·
6. Resumen 1–3 frases AL FINAL. Removidos: prioridad destacada, bandeja Amazon/La Comer.
Fix de dominio: era `.eu.mx` (typo), es `.edu.mx`. Filtro `to:` para atrapar Google Classroom.
Spec completa en `configs/skills/home-brief-sources/SKILL.md`. Probado + entregado a Telegram 2x.

**Fase 2 — pendiente (se hace en bloque 7, deploy = migración):**
- Crear proyecto Supabase real + correr migración 0001.
- Llenar valores reales en Infisical: SUPABASE_URL/ANON/SERVICE_ROLE, VERCEL_TOKEN,
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (hoy placeholders / en ~/.claude/.env).
- Push a fork `constanzasota/agent-native-os` → importar a Vercel (root `apps/morning-brief`)
  → setear env vars → deploy → smoke test (URL + ping + delivery_logs).
- Resultado: URL pública de Home-Sweet-Home para Rod y Chio.

---

## Gancho al capstone (S5)

El Morning Brief llamará a `research-fleet` como **una fuente más**:
- En "compilar fuentes": invoca `research-fleet` con tema fijo (industria) y
  `depth=shallow` para que la corrida diaria salga barata.
- El reporte sintetizado entra como sección **"Radar de industria"** del brief.
- Tier diario = Haiku; subir a `deep` un día a la semana para análisis profundo.

---

## Notas de aislamiento (8D Asus)
- Todo vive en GitHub local (branch `8d-asus`), nunca en Dropbox/Obsidian.
- El morning-brief 4D oficial (Lenovo, skill `morning-brief` + Telegram + Slack)
  NO se toca. Migración consciente al final del día.
- Path del hook de guardrail está fijo a la Asus → ajustar en la migración.
