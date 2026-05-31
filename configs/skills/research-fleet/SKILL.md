---
name: research-fleet
description: Use when you need a parallel sweep of a topic from several angles at once. Spins up a configurable fleet of research sub-agents (one per role), each with its own angle and model tier, then synthesizes their findings into one brief. Cheap tier (Haiku) scans, stronger tier (Sonnet/Opus) synthesizes.
trigger: User asks for a multi-angle research sweep, a "fleet" run, or wants to feed several research sources into a brief.
args:
  - topic        # what to research this run (e.g. "MRI service market in Mexico")
  - roster       # optional: override the default roster below
  - depth        # optional: "shallow" (default) or "deep" — deep bumps scanner tiers up one notch
---

# Research Fleet

You run a small fleet of research sub-agents in parallel, then synthesize their
findings into one unified brief. Each agent owns one *angle*. This is the
reusable, extensible version of the 4D "three sub-agents from one prompt" demo.

The whole point is **fan-out then synthesize**: many cheap scanners cover ground
in parallel, one stronger model stitches the results into something decision-grade.

---

## ⚙️ THE ROSTER — this is the knob you edit

Each row is one sub-agent. Edit this table to add/remove roles or change a tier.
**The `model_tier` column is the cost/speed dial.** Swap `haiku` → `sonnet` → `opus`
on any row and that role gets smarter, slower, and more expensive.

| role                    | angle (what this agent hunts for)                                  | model_tier |
|-------------------------|--------------------------------------------------------------------|------------|
| industry-news           | Recent news, regulation, and market moves in the topic's industry  | haiku      |
| competitor-watch        | What named competitors / substitutes are doing; pricing, launches  | haiku      |
| calendar-commitments    | Deadlines, events, and commitments the user has tied to this topic | haiku      |
| regulatory-watch        | COFEPRIS / medical-equipment norms, audits, compliance deadlines   | sonnet     |

**Tier guide:**
- `haiku` — shallow scanning, breadth, cheap & fast. Use for the scanner roles.
- `sonnet` — balanced reasoning. Good middle gear for a role that needs judgment.
- `opus` — deepest reasoning, slowest, most expensive. Reserve for synthesis or
  one critical role.

> `depth: deep` bumps every scanner up one notch (haiku→sonnet) for this run only,
> without editing the table.

---

## The synthesizer — set its tier here

After all scanners return, one synthesis agent merges everything.

```text
SYNTHESIZER_TIER = sonnet
```

Raise to `opus` when the stakes are high and you want the sharpest synthesis;
drop to `haiku` for a quick-and-dirty merge. This is the other half of the
cost/speed trade-off — scanners are breadth, synthesizer is depth.

---

## Step 1: Resolve the roster

- If the user passed `roster`, use it. Otherwise use the table above.
- If `depth` is `deep`, raise each scanner tier by one notch (haiku→sonnet,
  sonnet→opus) for this run.
- Echo back the resolved roster (role + tier) so the user sees what's about to run.

## Step 2: Fan out — one sub-agent per role

Spawn all roster agents **in parallel** (a single message with multiple Agent
tool calls). Give each agent:

- its `angle` from the table, focused on the run's `topic`
- `subagent_type: Explore` for read/search-only roles (no edits)
- `model` set to that row's `model_tier`
- a tight instruction to return **structured findings**, not prose: 3-7 bullet
  findings, each with a one-line source/why.

Each scanner returns its findings to you. If a role errors, note it and continue
— a fleet tolerates a missing scanner.

## Step 3: Synthesize

Spawn one synthesis agent at `SYNTHESIZER_TIER`. Hand it every scanner's findings.
Ask it to:

- dedupe and cluster the findings by theme
- flag contradictions between scanners
- surface the top 3-5 things that need the user's attention
- keep it scannable (this may feed a Morning Brief)

## Step 4: Report the run + its cost

Output the synthesized brief, then a short **run ledger** so the trade-off is visible:

```markdown
## Fleet brief: <topic>
<synthesized findings>

## Run ledger
| role                 | tier   | ~tokens | ~cost  |
|----------------------|--------|---------|--------|
| industry-news        | haiku  | ...     | ...    |
| competitor-watch     | haiku  | ...     | ...    |
| calendar-commitments | haiku  | ...     | ...    |
| synthesis            | sonnet | ...     | ...    |
| **total**            |        | ...     | ...    |
```

Token/cost numbers are rough estimates — enough to *see* the difference when a
tier changes, not an invoice. State they're approximate.

---

## How to invoke

```text
/research-fleet topic="<your topic>"
```

Or inline: "run the research fleet on <topic>", optionally with `depth=deep` or a
custom `roster`.

## How the Morning Brief calls this (S5)

In Session 5 the capstone, your Morning Brief treats this fleet as **one source**:

- The brief's source-compile step invokes `research-fleet` with a fixed `topic`
  (e.g. your industry) and `depth=shallow` to keep the morning run cheap.
- The fleet's synthesized brief becomes a `sections` block titled e.g.
  "Industry radar" in the brief's `source_status`.
- Tier stays low (haiku scanners) for a daily run; bump to `deep` only for a
  weekly deep-dive. The knob is the roster table above — nothing else to change.

---

## Do not

- Do not run scanners sequentially — fan out in parallel or you lose the speedup.
- Do not give scanner agents edit/write tools; they research only (`Explore`).
- Do not invent sources or token costs — mark estimates as estimates.
- Do not hardcode a topic in the skill; it comes in as `topic` each run.
- Do not call any external service that needs a credential without telling the
  user where to add it themselves first.
