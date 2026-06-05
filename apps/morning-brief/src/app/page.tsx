import type { Brief } from "@/lib/brief-contract";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LatestData = {
  latest: Brief | null;
  recent: Brief[];
  deliveries: Array<{ id: string; channel: string; ok: boolean; created_at: string; error: string | null }>;
};

async function loadLatest(): Promise<LatestData> {
  try {
    const sb = supabaseAdmin();
    const briefsRes = await sb
      .from("briefs")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);
    const deliveryRes = await sb
      .from("delivery_logs")
      .select("id, channel, ok, created_at, error")
      .order("created_at", { ascending: false })
      .limit(10);
    const briefs = (briefsRes.data ?? []) as Brief[];
    return {
      latest: briefs[0] ?? null,
      recent: briefs.slice(1),
      deliveries: deliveryRes.data ?? [],
    };
  } catch {
    return { latest: null, recent: [], deliveries: [] };
  }
}

export default async function Page() {
  const { latest, recent, deliveries } = await loadLatest();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <section>
        <div className="section-label">brief of the day</div>
        <h1 className="section-title">
          Today&apos;s <span className="highlight">morning brief</span>.
        </h1>
        <p className="section-sub">
          Sources collapse into one short ping plus one full write-up. Run it manually for now. Schedule it after your first dress rehearsal works.
        </p>

        {latest ? <BriefCard brief={latest} /> : <EmptyBriefCard />}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1.4rem" }}>
        <SourceRegistry brief={latest} />
        <DeliveryLog deliveries={deliveries} />
      </section>

      <section>
        <div className="section-label">run timeline</div>
        <h2 className="section-title">Recent briefs</h2>
        <p className="section-sub">The last eight runs. Click a date to open the raw JSON in your Supabase table.</p>
        <RunTimeline recent={recent} latest={latest} />
      </section>
    </div>
  );
}

function BriefCard({ brief }: { brief: Brief }) {
  return (
    <div className="file-tab-card tilt-left" style={{ marginTop: "1.6rem" }}>
      <div className="file-tab">BRIEF / {brief.date}</div>
      <h2 className="font-display" style={{ fontSize: "1.85rem", marginBottom: "0.6rem" }}>
        {brief.title}
      </h2>
      <p style={{ color: "var(--ink-2)", marginBottom: "1rem" }}>{brief.summary}</p>
      <div
        style={{
          background: "var(--paper-2)",
          border: "2px solid var(--border)",
          padding: "0.75rem 0.9rem",
          marginBottom: "1.1rem",
        }}
      >
        <div className="font-mono" style={{ fontSize: "0.62rem", color: "var(--caution)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          Top priority
        </div>
        <div style={{ fontWeight: 600 }}>{brief.top_priority}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {brief.sections.map((s, i) => (
          <div key={i}>
            <h3 className="font-display" style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{s.heading}</h3>
            <p style={{ color: "var(--ink-2)", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyBriefCard() {
  return (
    <div className="file-tab-card tilt-right" style={{ marginTop: "1.6rem" }}>
      <div className="file-tab">BRIEF / waiting</div>
      <h2 className="font-display" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
        No briefs yet.
      </h2>
      <p style={{ color: "var(--ink-2)", marginBottom: "1rem" }}>
        Run <code className="font-mono" style={{ background: "var(--paper-3)", padding: "0.1rem 0.3rem" }}>/build-morning-brief</code> in Claude Code, or POST a brief to{" "}
        <code className="font-mono" style={{ background: "var(--paper-3)", padding: "0.1rem 0.3rem" }}>/api/briefs</code>.
      </p>
      <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-3)" }}>
        Tip: load supabase/seed.sql to drop in two demo briefs in under a minute.
      </p>
    </div>
  );
}

function SourceRegistry({ brief }: { brief: Brief | null }) {
  const sources = brief?.source_status ?? [
    { name: "manual-notes", enabled: true, last_pulled_at: null, item_count: 0 },
    { name: "calendar", enabled: false, last_pulled_at: null, item_count: 0 },
    { name: "gmail", enabled: false, last_pulled_at: null, item_count: 0 },
  ];
  return (
    <div className="file-tab-card tilt-right">
      <div className="file-tab">SOURCES / registry</div>
      <h3 className="font-display" style={{ fontSize: "1.2rem", marginBottom: "0.7rem" }}>
        Source registry
      </h3>
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {sources.map((s) => (
          <li key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--ink-3)", paddingBottom: "0.35rem" }}>
            <span className="font-mono" style={{ fontSize: "0.78rem" }}>{s.name}</span>
            <span className={`status-pill ${s.enabled ? "ok" : "muted"}`}>
              {s.enabled ? `${s.item_count} items` : "off"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeliveryLog({ deliveries }: { deliveries: LatestData["deliveries"] }) {
  return (
    <div className="file-tab-card tilt-left">
      <div className="file-tab">DELIVERY / log</div>
      <h3 className="font-display" style={{ fontSize: "1.2rem", marginBottom: "0.7rem" }}>
        Delivery log
      </h3>
      {deliveries.length === 0 ? (
        <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-3)" }}>No pings sent yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {deliveries.map((d) => (
            <li key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--ink-3)", paddingBottom: "0.35rem" }}>
              <span className="font-mono" style={{ fontSize: "0.72rem" }}>
                {new Date(d.created_at).toLocaleString()} {d.channel}
              </span>
              <span className={`status-pill ${d.ok ? "ok" : "warn"}`}>{d.ok ? "sent" : "failed"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunTimeline({ recent, latest }: { recent: Brief[]; latest: Brief | null }) {
  const all = latest ? [latest, ...recent] : recent;
  if (all.length === 0) {
    return (
      <div className="terminal">
        <h3>$ briefs --recent</h3>
        <p>No briefs yet. Run /build-morning-brief or load supabase/seed.sql.</p>
      </div>
    );
  }
  return (
    <div className="terminal">
      <h3>$ briefs --recent</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {all.map((b, i) => (
          <li key={(b.id ?? "") + i} style={{ padding: "0.25rem 0", borderBottom: "1px dashed #2a2a2a" }}>
            <span style={{ color: "var(--lime)" }}>{b.date}</span>
            <span style={{ color: "#aaa" }}> &middot; </span>
            <span>{b.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
