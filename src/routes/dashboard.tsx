import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GrindLogo } from "@/components/GrindLogo";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type SectionKey = "HOJE" | "CORPO" | "PROGRESSO" | "CALENDÁRIO" | "OBJETIVO";
const SECTIONS: SectionKey[] = ["HOJE", "CORPO", "PROGRESSO", "CALENDÁRIO", "OBJETIVO"];

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "#A0A0A0",
  fontWeight: 400,
};

const SEP: React.CSSProperties = { height: 1, background: "#2A2A2A", margin: "12px 0 16px" };

const DASH_STYLES = `
@keyframes grind-ring-draw { from { stroke-dashoffset: var(--ring-circ); } to { stroke-dashoffset: var(--ring-target); } }
@keyframes grind-bar-fill { from { width: 0%; } to { width: var(--bar-target); } }
@keyframes grind-pulse-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.4; } }
@keyframes grind-pulse-ring { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }
@keyframes grind-check-pop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes grind-strike { from { width: 0%; } to { width: 100%; } }
@keyframes grind-fade-in { from { opacity: 0; } to { opacity: 1; } }
.dash-logout:hover { border-color: #E8003D !important; color: #FFFFFF !important; }
.grind-ring-arc { animation: grind-ring-draw 1.2s ease-out forwards; }
.grind-bar-fill { animation: grind-bar-fill 0.8s ease-out forwards; }
.grind-fade-in { animation: grind-fade-in 150ms ease-out; }
.grind-live-square {
  position: relative; display: inline-block; vertical-align: middle;
  width: 6px; height: 6px; background: #E8003D; border-radius: 0;
  animation: grind-pulse-dot 1.5s ease-in-out infinite;
}
.grind-live-square::after {
  content: ""; position: absolute; left: 50%; top: 50%;
  width: 6px; height: 6px; background: #E8003D; border-radius: 0;
  transform: translate(-50%, -50%) scale(1);
  animation: grind-pulse-ring 1.5s ease-out infinite;
  pointer-events: none;
}
.grind-check-pop { animation: grind-check-pop 150ms ease-out; }
.grind-strike-wrap { position: relative; display: inline-block; }
.grind-strike-wrap::after {
  content: ""; position: absolute; left: 0; top: 50%; height: 1px; background: currentColor;
  width: 0%;
}
.grind-strike-wrap.on::after { animation: grind-strike 200ms ease-out forwards; }
.grind-trend-bar { position: relative; cursor: pointer; }
.grind-trend-tip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #111111; border: 1px solid #2A2A2A; color: #FFFFFF;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 4px 8px;
  white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s;
}
.grind-trend-bar:hover .grind-trend-tip { opacity: 1; }
.grind-tab {
  background: transparent; border: none; cursor: pointer;
  font-family: 'Space Grotesk', sans-serif; font-weight: 400;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em;
  color: #555555; padding: 0 20px; height: 56px; line-height: 56px;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s;
}
.grind-tab:hover { color: #A0A0A0; }
.grind-tab.active { color: #FFFFFF; border-bottom-color: #E8003D; }
.grind-hamburger {
  display: none; flex-direction: column; gap: 4px; background: transparent;
  border: none; cursor: pointer; padding: 8px; margin-right: 8px;
}
.grind-hamburger span { display: block; width: 18px; height: 2px; background: #A0A0A0; }
.grind-tabs-desktop { display: flex; align-items: center; }
@media (max-width: 767px) {
  .grind-tabs-desktop { display: none !important; }
  .grind-hamburger { display: flex !important; }
  .grind-main-grid { grid-template-columns: 1fr !important; }
  .grind-header { padding: 0 16px !important; }
  .grind-main { padding: 20px !important; }
}
.grind-drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40;
  animation: grind-fade-in 150ms ease-out;
}
.grind-drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: 240px;
  background: #0A0A0A; border-right: 1px solid #2A2A2A; z-index: 50;
  animation: grind-fade-in 150ms ease-out;
  display: flex; flex-direction: column;
}
.grind-drawer-item {
  display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 24px;
  background: transparent; border: none; cursor: pointer; width: 100%;
  text-align: left; color: #555555;
  font-family: 'Space Grotesk', sans-serif; font-weight: 400;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;
  border-bottom: 1px solid #2A2A2A; border-left: 3px solid transparent;
}
.grind-drawer-item.active {
  color: #FFFFFF; background: #1A1A1A; border-left-color: #E8003D;
}
.grind-drawer-item.active svg { stroke: #FFFFFF; }
`;

function SectionLabel({ children }: { children: React.ReactNode; pulse?: boolean }) {
  return (
    <div
      style={{
        ...LABEL,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #2A2A2A",
        background: "transparent",
        padding: "4px 10px",
        borderRadius: 0,
        letterSpacing: "0.12em",
      }}
    >
      <span className="grind-live-square" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function formatToday() {
  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const d = new Date();
  return `${days[d.getDay()]} · ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDeadline(d?: string | null) {
  if (!d) return "—";
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Icons
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const IconPulse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <path d="M2 12h4l2-6 4 12 2-6 2 3h6" />
  </svg>
);
const IconBars = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <line x1="4" y1="20" x2="4" y2="10" /><line x1="10" y1="20" x2="10" y2="4" /><line x1="16" y1="20" x2="16" y2="14" /><line x1="22" y1="20" x2="22" y2="8" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="#555555" />
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <rect x="3" y="5" width="18" height="16" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" />
  </svg>
);
const ICONS: Record<SectionKey, () => React.ReactElement> = {
  HOJE: IconSun, CORPO: IconPulse, PROGRESSO: IconBars, "CALENDÁRIO": IconCalendar, OBJETIVO: IconTarget,
};

type Profile = {
  dream: string | null;
  goal_name: string | null;
  daily_hours: number | null;
  days_per_week: number | null;
  deadline: string | null;
  created_at: string;
};

function DashboardPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionKey>(() => {
    if (typeof window === "undefined") return "HOJE";
    const s = window.localStorage.getItem("grind:section") as SectionKey | null;
    return s && SECTIONS.includes(s) ? s : "HOJE";
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    supabase.from("profiles").select("onboarding_complete,dream,goal_name,daily_hours,days_per_week,deadline,created_at").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      if (!data?.onboarding_complete) { navigate({ to: "/onboarding" }); return; }
      setProfile({
        dream: data.dream, goal_name: data.goal_name, daily_hours: data.daily_hours, days_per_week: data.days_per_week,
        deadline: data.deadline, created_at: data.created_at,
      });
    });
  }, [session, loading, navigate]);

  useEffect(() => {
    try { window.localStorage.setItem("grind:section", section); } catch { /* ignore */ }
  }, [section]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const goSection = (s: SectionKey) => { setSection(s); setDrawerOpen(false); };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FFFFFF" }}>
      <style>{DASH_STYLES}</style>

      {/* Top bar */}
      <header className="grind-header" style={{ height: 56, borderBottom: "1px solid #2A2A2A", boxShadow: "0 1px 0 #E8003D20", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="grind-hamburger" aria-label="Menu" onClick={() => setDrawerOpen(true)}>
            <span /><span /><span />
          </button>
          <GrindLogo size={22} letterSpacing="0.15em" />
        </div>

        <nav className="grind-tabs-desktop">
          {SECTIONS.map((s) => (
            <button key={s} className={`grind-tab ${section === s ? "active" : ""}`} onClick={() => setSection(s)}>
              {s}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="dash-logout" style={{ height: 32, padding: "0 14px", background: "transparent", border: "1px solid #2A2A2A", color: "#A0A0A0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}>
          SAIR
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="grind-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="grind-drawer">
            <div style={{ padding: "16px 24px" }}>
              <GrindLogo size={22} letterSpacing="0.15em" />
            </div>
            <div style={{ height: 1, background: "#2A2A2A" }} />
            {SECTIONS.map((s) => {
              const Icon = ICONS[s];
              const active = section === s;
              return (
                <button key={s} className={`grind-drawer-item ${active ? "active" : ""}`} onClick={() => goSection(s)}>
                  <Icon />
                  <span>{s}</span>
                </button>
              );
            })}
          </aside>
        </>
      )}

      {/* Main */}
      <main key={section} className="grind-fade-in grind-main" style={{ maxWidth: 1280, margin: "0 auto", padding: 32 }}>
        {section === "HOJE" && <SectionHoje />}
        {section === "CORPO" && <SectionCorpo />}
        {section === "PROGRESSO" && <SectionProgresso />}
        {section === "CALENDÁRIO" && <SectionCalendario />}
        {section === "OBJETIVO" && <SectionObjetivo profile={profile} userId={session?.user.id} onSaved={(p) => setProfile((cur) => cur ? { ...cur, ...p } : cur)} />}
      </main>
    </div>
  );
}

/* ====================== HOJE (original dashboard content) ====================== */
function SectionHoje() {
  const [tasks, setTasks] = useState([
    { label: "4h de estudo focado", done: false },
    { label: "Revisão de flashcards", done: true },
    { label: "Dormir antes das 23h", done: false },
  ]);
  const [popKey, setPopKey] = useState<Record<number, number>>({});
  const toggleTask = (i: number) => {
    setTasks((prev) => prev.map((x, idx) => idx === i ? { ...x, done: !x.done } : x));
    setPopKey((p) => ({ ...p, [i]: (p[i] || 0) + 1 }));
  };
  const completed = tasks.filter((t) => t.done).length;

  return (
    <div className="grind-main-grid" style={{ display: "grid", gridTemplateColumns: "65fr 35fr", gap: 24 }}>
      {/* LEFT */}
      <div style={{ display: "grid", gap: 32, alignContent: "start" }}>
        <section>
          <SectionLabel>SCORE DO OBJETIVO</SectionLabel>
          <div style={SEP} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
            <ScoreRing value={87} />
            <div style={{ ...LABEL, color: "#555555" }}>ADERÊNCIA AO PLANO</div>
          </div>
          <p style={{ fontSize: 13, color: "#A0A0A0", marginTop: 16, lineHeight: 1.6 }}>
            No ritmo atual você completa o plano 3 dias antes do prazo.
          </p>
        </section>

        <section>
          <SectionLabel>PLANO DO DIA</SectionLabel>
          <div style={SEP} />
          <p style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 1.6, marginBottom: 24, borderLeft: "2px solid #E8003D", paddingLeft: 16 }}>
            Seu corpo está bem recuperado hoje. HRV estável indica mente apta para foco profundo.
          </p>
          {[
            { n: "01", t: "Avançar no conteúdo mais difícil agora", c: "FOCO PROFUNDO" },
            { n: "02", t: "Revisão moderada no período da tarde", c: "REVISÃO" },
            { n: "03", t: "Dormir até 23h para manter o ritmo amanhã", c: "RECUPERAÇÃO" },
          ].map((p, i) => (
            <div key={p.n} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 16, padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid #2A2A2A" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "#E8003D" }}>{p.n}</div>
              <div>
                <div style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 1.4 }}>{p.t}</div>
                <div style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 6 }}>{p.c}</div>
              </div>
            </div>
          ))}
        </section>

        <section>
          <SectionLabel>TAREFAS DO DIA</SectionLabel>
          <div style={SEP} />
          <div style={{ display: "grid", gap: 12 }}>
            {tasks.map((t, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <span
                  key={`box-${i}-${popKey[i] || 0}`}
                  onClick={() => toggleTask(i)}
                  className={popKey[i] ? "grind-check-pop" : ""}
                  style={{ width: 18, height: 18, border: "1px solid #2A2A2A", background: t.done ? "#E8003D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 12, flexShrink: 0 }}
                >
                  {t.done ? "✓" : ""}
                </span>
                <span className={`grind-strike-wrap ${t.done ? "on" : ""}`} style={{ fontSize: 14, color: t.done ? "#555555" : "#FFFFFF" }}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#A0A0A0", marginTop: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {completed} DE {tasks.length} CONCLUÍDAS
          </div>
        </section>
      </div>

      {/* RIGHT */}
      <div style={{ display: "grid", gap: 32, alignContent: "start" }}>
        <section>
          <SectionLabel>CORPO · HOJE</SectionLabel>
          <div style={SEP} />
          <div style={{ display: "grid", gap: 20 }}>
            <Metric name="RECOVERY" value="87" unit="%" pct={87} />
            <Metric name="HRV" value="62" unit="ms" pct={65} />
            <Metric name="SONO" value="7h 32min" pct={80} />
            <Metric name="STRAIN" value="11.4" pct={55} />
          </div>
        </section>

        <section>
          <SectionLabel>TENDÊNCIA · 7 DIAS</SectionLabel>
          <div style={SEP} />
          <Trend />
        </section>

        <section>
          <SectionLabel>PROJEÇÃO</SectionLabel>
          <div style={SEP} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBox label="DIAS RESTANTES" value="127" color="#FFFFFF" />
            <StatBox label="DIAS À FRENTE" value="+3" color="#E8003D" />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ====================== CORPO ====================== */
function SectionCorpo() {
  const metrics = [
    { name: "RECOVERY", value: "87", unit: "%", pct: 87, note: "Excelente — dia de alta performance" },
    { name: "HRV", value: "62", unit: "ms", pct: 65, note: "Estável — foco profundo recomendado" },
    { name: "SONO", value: "7h 32min", unit: "", pct: 80, note: "Adequado — ritmo normal" },
    { name: "STRAIN", value: "11.4", unit: "", pct: 55, note: "Equilibrado — manter o ritmo" },
  ];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 40 }}>
      <section>
        <SectionLabel>CORPO · HOJE</SectionLabel>
        <div style={SEP} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {metrics.map((m) => (
            <div key={m.name} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", padding: 24 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 12 }}>{m.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 36, color: "#FFFFFF" }}>{m.value}</span>
                {m.unit && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#555555" }}>{m.unit}</span>}
              </div>
              <div style={{ height: 2, background: "#0A0A0A", marginBottom: 12 }}>
                <div className="grind-bar-fill" style={{ height: "100%", background: "#E8003D", width: 0, ["--bar-target" as never]: `${m.pct}%` }} />
              </div>
              <div style={{ fontSize: 12, color: "#555555" }}>{m.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>EVOLUÇÃO · 7 DIAS</SectionLabel>
        <div style={SEP} />
        <LineChart data={[72, 65, 81, 78, 55, 90, 87]} days={["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]} />
      </section>

      <section>
        <SectionLabel>ALERTA</SectionLabel>
        <div style={SEP} />
        <div style={{ background: "#111111", borderLeft: "3px solid #E8003D", padding: "16px 20px", color: "#A0A0A0", fontSize: 14, lineHeight: 1.5 }}>
          HRV em queda nos últimos 3 dias — considere reduzir a carga amanhã.
        </div>
      </section>
    </div>
  );
}

function LineChart({ data, days }: { data: number[]; days: string[] }) {
  const W = 720, H = 200, padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const yTicks = [0, 25, 50, 75, 100];
  const points = data.map((v, i) => {
    const x = padL + (innerW * i) / (data.length - 1);
    const y = padT + innerH * (1 - v / 100);
    return { x, y, v };
  });
  const poly = points.map((p) => `${p.x},${p.y}`).join(" ");
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {yTicks.map((t) => {
          const y = padT + innerH * (1 - t / 100);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1A1A1A" strokeWidth={1} />
              <text x={padL - 8} y={y + 3} fontFamily="'JetBrains Mono', monospace" fontSize={10} fill="#555555" textAnchor="end">{t}</text>
            </g>
          );
        })}
        <polyline points={poly} fill="none" stroke="#E8003D" strokeWidth={2} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={6} fill="#E8003D" stroke="#0A0A0A" strokeWidth={2} />
            {hover === i && (
              <g>
                <rect x={p.x - 22} y={p.y - 30} width={44} height={20} fill="#111111" stroke="#2A2A2A" />
                <text x={p.x} y={p.y - 16} fontFamily="'JetBrains Mono', monospace" fontSize={11} fill="#FFFFFF" textAnchor="middle">{p.v}%</text>
              </g>
            )}
          </g>
        ))}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={H - 8} fontFamily="'JetBrains Mono', monospace" fontSize={10} fill="#555555" textAnchor="middle">{days[i]}</text>
        ))}
      </svg>
    </div>
  );
}

/* ====================== PROGRESSO ====================== */
function SectionProgresso() {
  const scores = useMemo(() => {
    // deterministic pseudo-random for SSR/CSR consistency
    const arr: number[] = [];
    let seed = 7;
    for (let i = 0; i < 30; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      arr.push(60 + Math.floor((seed / 233280) * 36)); // 60-95
    }
    return arr;
  }, []);
  const todayIdx = scores.length - 1;
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const best = Math.max(...scores);

  const weeks = [
    { w: "SEMANA 17", dias: "6/7", horas: "26h", score: "84%" },
    { w: "SEMANA 18", dias: "7/7", horas: "31h", score: "91%" },
    { w: "SEMANA 19", dias: "5/7", horas: "22h", score: "76%" },
    { w: "SEMANA 20", dias: "7/7", horas: "29h", score: "88%" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 40 }}>
      <section>
        <SectionLabel>SCORE · 30 DIAS</SectionLabel>
        <div style={SEP} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(30, 1fr)", gap: 4, alignItems: "end", height: 140, borderBottom: "1px solid #2A2A2A", paddingBottom: 4 }}>
          {scores.map((v, i) => {
            const h = (v / 100) * 130;
            const isToday = i === todayIdx;
            const bg = v > 80 ? "#E8003D" : "#2A2A2A";
            return <div key={i} title={`Dia ${i + 1}: ${v}%`} style={{ height: h, background: bg, border: isToday ? "1px solid #E8003D" : "none" }} />;
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          <SummaryStat label="MÉDIA" value={`${avg}%`} color="#FFFFFF" />
          <SummaryStat label="MELHOR DIA" value={`${best}%`} color="#E8003D" />
          <SummaryStat label="SEQUÊNCIA ATUAL" value="7 dias" color="#FFFFFF" />
        </div>
      </section>

      <section>
        <SectionLabel>SEMANAS</SectionLabel>
        <div style={SEP} />
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12, padding: "12px 0", borderBottom: "1px solid #2A2A2A", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0" }}>
            <div>SEMANA</div><div>DIAS CUMPRIDOS</div><div>HORAS FOCADAS</div><div>SCORE MÉDIO</div>
          </div>
          {weeks.map((w) => (
            <div key={w.w} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12, padding: "16px 0", borderBottom: "1px solid #2A2A2A", alignItems: "center" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FFFFFF" }}>{w.w}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#FFFFFF" }}>{w.dias}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#FFFFFF" }}>{w.horas}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#E8003D" }}>{w.score}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>PROJEÇÃO</SectionLabel>
        <div style={SEP} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatBox label="DIAS RESTANTES" value="127" color="#FFFFFF" />
          <StatBox label="DIAS À FRENTE" value="+3" color="#E8003D" />
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: "16px 20px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ====================== OBJETIVO ====================== */
function SectionObjetivo({ profile, userId, onSaved }: { profile: Profile | null; userId?: string; onSaved: (p: Partial<Profile>) => void }) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState<string>(profile?.daily_hours?.toString() ?? "");
  const [days, setDays] = useState<string>(profile?.days_per_week?.toString() ?? "");
  const [deadline, setDeadline] = useState<string>(profile?.deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHours(profile?.daily_hours?.toString() ?? "");
    setDays(profile?.days_per_week?.toString() ?? "");
    setDeadline(profile?.deadline ?? "");
  }, [profile]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadlineDate = profile?.deadline ? new Date(profile.deadline) : null;
  const startDate = profile?.created_at ? new Date(profile.created_at) : null;
  const daysRemaining = deadlineDate ? Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000)) : 0;
  const totalDays = startDate && deadlineDate ? Math.max(1, Math.ceil((deadlineDate.getTime() - startDate.getTime()) / 86400000)) : 1;
  const elapsedDays = startDate ? Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000)) : 0;
  const elapsedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const save = async () => {
    if (!userId) return;
    setError(null);
    const yr = parseInt(deadline.split("-")[0] || "0", 10);
    if (!deadline || yr < 2025) { setError("Data inválida — escolha uma data futura"); return; }
    setSaving(true);
    const payload = {
      daily_hours: hours ? parseFloat(hours) : null,
      days_per_week: days ? parseInt(days, 10) : null,
      deadline,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved(payload);
    setEditing(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 40 }}>
      <section>
        <SectionLabel>SEU SONHO</SectionLabel>
        <div style={SEP} />
        <div style={{ borderLeft: "3px solid #E8003D", paddingLeft: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#FFFFFF", lineHeight: 1.2, margin: 0 }}>
            {profile?.goal_name || "—"}
          </div>
          {profile?.dream && (
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, fontSize: 15, color: "#A0A0A0", lineHeight: 1.6, margin: "12px 0 0 0" }}>
              {profile.dream}
            </p>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 12 }}>
          Definido no seu onboarding
        </div>
      </section>

      <section>
        <SectionLabel>SEU PLANO</SectionLabel>
        <div style={SEP} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <PlanBox label="HORAS POR DIA" value={profile?.daily_hours != null ? String(profile.daily_hours) : "—"} size={36} />
          <PlanBox label="DIAS POR SEMANA" value={profile?.days_per_week != null ? String(profile.days_per_week) : "—"} size={36} />
          <PlanBox label="DATA LIMITE" value={formatDeadline(profile?.deadline)} size={24} />
        </div>
      </section>

      <section>
        <SectionLabel>COUNTDOWN</SectionLabel>
        <div style={SEP} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 96, color: "#E8003D", lineHeight: 1 }}>
            {daysRemaining}
          </div>
          <div style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 12 }}>
            DIAS ATÉ O PRAZO
          </div>
          <div style={{ height: 2, background: "#1A1A1A", marginTop: 24, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ height: "100%", background: "#E8003D", width: `${elapsedPct}%`, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555555", marginTop: 8 }}>
            {elapsedPct}% DO TEMPO DECORRIDO
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>EDITAR OBJETIVO</SectionLabel>
        <div style={SEP} />
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{ background: "transparent", border: "1px solid #2A2A2A", color: "#A0A0A0", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.12em", height: 44, padding: "0 20px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>
            EDITAR MEU PLANO
          </button>
        ) : (
          <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
            <Field label="HORAS POR DIA">
              <input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="DIAS POR SEMANA">
              <input type="number" min={1} max={7} value={days} onChange={(e) => setDays(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="DATA LIMITE">
              <input type="date" min={new Date().toISOString().split("T")[0]} value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
            </Field>
            {error && <div style={{ color: "#E8003D", fontSize: 12 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ width: "auto", padding: "0 28px" }}>
                {saving ? "SALVANDO…" : "SALVAR"}
              </button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", border: "1px solid #2A2A2A", color: "#A0A0A0", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.12em", height: 48, padding: "0 20px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>
                CANCELAR
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  background: "#111111", border: "1px solid #2A2A2A", color: "#FFFFFF",
  fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function PlanBox({ label, value, size }: { label: string; value: string; size: number }) {
  return (
    <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", padding: 24 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: size, color: "#FFFFFF", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ====================== Shared widgets ====================== */
function ScoreRing({ value }: { value: number }) {
  const size = 160;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A1A" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8003D" strokeWidth={stroke}
          strokeLinecap="butt" strokeDasharray={circ}
          className="grind-ring-arc"
          style={{ ["--ring-circ" as never]: `${circ}px`, ["--ring-target" as never]: `${target}px` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 48, color: "#E8003D" }}>{value}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#555555", marginTop: 4 }}>%</span>
      </div>
    </div>
  );
}

function Metric({ name, value, unit, pct }: { name: string; value: string; unit?: string; pct: number }) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: "1px solid #2A2A2A" }}>
      <div style={{ fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#FFFFFF" }}>{value}</span>
        {unit && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555555" }}>{unit}</span>}
      </div>
      <div style={{ height: 2, background: "#1A1A1A" }}>
        <div className="grind-bar-fill" style={{ height: "100%", background: "#E8003D", width: 0, ["--bar-target" as never]: `${pct}%` }} />
      </div>
    </div>
  );
}

function Trend() {
  const data = [72, 65, 81, 78, 55, 90, 87];
  const days = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const max = Math.max(...data);
  const maxIdx = data.indexOf(max);
  const todayIdx = data.length - 1;
  const H = 100;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, alignItems: "end", height: H, borderBottom: "1px solid #2A2A2A" }}>
        {data.map((v, i) => {
          const h = (v / 100) * H;
          const isMax = i === maxIdx;
          const isToday = i === todayIdx;
          let bg = "#2A2A2A";
          let border = "none";
          if (isToday) { bg = "rgba(232, 0, 61, 0.3)"; border = "1px solid #E8003D"; }
          else if (isMax) { bg = "#E8003D"; }
          return (
            <div key={i} className="grind-trend-bar" style={{ height: h, background: bg, border }}>
              <span className="grind-trend-tip">{v}%</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 8 }}>
        {days.map((d) => (
          <div key={d} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#555555", textAlign: "center" }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 36, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ====================== CALENDÁRIO ====================== */
type DayData = { recovery: number; sleepH: number; sleepM: number; hrv: number; score: number };

const MONTH_NAMES_PT = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const MONTH_SHORT_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const WEEKDAY_LONG_PT = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

// Deterministic pseudo-random for SSR/CSR consistency
function pseudo(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function buildMonthData(year: number, month: number): Record<number, DayData> {
  const out: Record<number, DayData> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Dataset spec: April 2026 — days 1..27 random, 28 fixed, 29-30 empty.
  // For other months: fill all days deterministically.
  const isApril2026 = year === 2026 && month === 3;
  for (let d = 1; d <= daysInMonth; d++) {
    if (isApril2026) {
      if (d >= 29) continue;
      if (d === 28) {
        out[d] = { recovery: 87, sleepH: 7, sleepM: 32, hrv: 62, score: 87 };
        continue;
      }
    }
    const r1 = pseudo(year * 1000 + month * 50 + d);
    const r2 = pseudo(year * 1000 + month * 50 + d + 100);
    const r3 = pseudo(year * 1000 + month * 50 + d + 200);
    const r4 = pseudo(year * 1000 + month * 50 + d + 300);
    const recovery = Math.round(55 + r1 * 40);
    const sleepTotalMin = Math.round((6 + r2 * 3) * 60);
    out[d] = {
      recovery,
      sleepH: Math.floor(sleepTotalMin / 60),
      sleepM: sleepTotalMin % 60,
      hrv: Math.round(45 + r3 * 30),
      score: Math.round(60 + r4 * 35),
    };
  }
  return out;
}

function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Mês anterior" : "Próximo mês"}
      className="grind-cal-arrow"
      style={{
        width: 32, height: 32, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 0,
        color: "#A0A0A0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === "left" ? <polyline points="8,2 4,6 8,10" /> : <polyline points="4,2 8,6 4,10" />}
      </svg>
    </button>
  );
}

function MiniBar({ value, color }: { value: number | null; color: string }) {
  return (
    <div style={{ height: 4, background: "#1A1A1A", width: "100%" }}>
      {value !== null && <div style={{ height: "100%", background: color, width: `${Math.max(0, Math.min(100, value))}%` }} />}
    </div>
  );
}

function SectionCalendario() {
  // Anchor "today" to Apr 28, 2026 so placeholder spec lines up.
  const TODAY = { year: 2026, month: 3, day: 28 };
  const [view, setView] = useState({ year: TODAY.year, month: TODAY.month });
  const [selected, setSelected] = useState<number | null>(null);

  const data = useMemo(() => buildMonthData(view.year, view.month), [view]);
  const firstWeekday = new Date(view.year, view.month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const prevMonthDays = new Date(view.year, view.month, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  type Cell = { day: number; inMonth: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstWeekday + 1;
    if (dayNum < 1) cells.push({ day: prevMonthDays + dayNum, inMonth: false });
    else if (dayNum > daysInMonth) cells.push({ day: dayNum - daysInMonth, inMonth: false });
    else cells.push({ day: dayNum, inMonth: true });
  }

  const goPrev = () => {
    setSelected(null);
    setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  };
  const goNext = () => {
    setSelected(null);
    setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });
  };

  const isToday = (day: number, inMonth: boolean) =>
    inMonth && view.year === TODAY.year && view.month === TODAY.month && day === TODAY.day;

  const selectedData = selected !== null ? data[selected] : null;
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 0 }}>
      <style>{`
        .grind-cal-arrow:hover { border-color: #E8003D !important; color: #FFFFFF !important; }
        .grind-cal-cell:hover { border-color: #E8003D !important; }
        .grind-cal-close:hover { color: #FFFFFF !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24 }}>
        <ArrowBtn dir="left" onClick={goPrev} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: "#FFFFFF", minWidth: 180, textAlign: "center", letterSpacing: "0.05em" }}>
          {MONTH_NAMES_PT[view.month]} {view.year}
        </div>
        <ArrowBtn dir="right" onClick={goNext} />
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
        {dayLabels.map((d, i) => (
          <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555555", textAlign: "center", textTransform: "uppercase" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((c, i) => {
          const dayData = c.inMonth ? data[c.day] : undefined;
          const today = isToday(c.day, c.inMonth);
          const selectedCell = c.inMonth && selected === c.day;
          return (
            <div
              key={i}
              className="grind-cal-cell"
              onClick={() => { if (c.inMonth && dayData) setSelected(c.day); }}
              style={{
                background: c.inMonth ? "#111111" : "#0A0A0A",
                border: `1px solid ${selectedCell ? "#E8003D" : "#2A2A2A"}`,
                borderRadius: 0,
                padding: 8,
                minHeight: 90,
                cursor: c.inMonth && dayData ? "pointer" : "default",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: !c.inMonth ? "#333333" : today ? "#E8003D" : "#A0A0A0",
                fontWeight: today ? 700 : 400,
              }}>
                {String(c.day).padStart(2, "0")}
              </div>

              {c.inMonth && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8 }}>
                  <MiniBar value={dayData?.recovery ?? null} color="#E8003D" />
                  <MiniBar value={dayData ? Math.min(100, ((dayData.sleepH * 60 + dayData.sleepM) / 540) * 100) : null} color="#555555" />
                  <MiniBar value={dayData ? Math.min(100, (dayData.hrv / 100) * 100) : null} color="#A0A0A0" />
                  <div style={{ height: 4, background: "#1A1A1A", width: "100%" }}>
                    {dayData && <div style={{ height: "100%", background: "#E8003D", opacity: 0.6, width: `${dayData.score}%` }} />}
                  </div>
                  {dayData && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11, color: "#E8003D", marginTop: 4 }}>
                      {dayData.score}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
        {[
          { c: "#E8003D", l: "RECOVERY" },
          { c: "#555555", l: "SONO" },
          { c: "#A0A0A0", l: "HRV" },
          { c: "#E8003D", l: "SCORE", op: 0.6 },
        ].map((item) => (
          <div key={item.l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 12, height: 4, background: item.c, opacity: item.op ?? 1 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#555555", textTransform: "uppercase" }}>{item.l}</span>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedData && selected !== null && (
        <div className="grind-fade-in" style={{ background: "#111111", border: "1px solid #2A2A2A", borderRadius: 0, padding: 24, marginTop: 16, position: "relative" }}>
          <button
            onClick={() => setSelected(null)}
            className="grind-cal-close"
            style={{
              position: "absolute", top: 16, right: 16,
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 11,
              color: "#555555", textTransform: "uppercase", letterSpacing: "0.12em",
              transition: "color 0.15s",
            }}
          >
            FECHAR
          </button>

          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: "#FFFFFF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {WEEKDAY_LONG_PT[new Date(view.year, view.month, selected).getDay()]} · {String(selected).padStart(2, "0")} {MONTH_SHORT_PT[view.month]} {view.year}
          </div>
          <div style={{ height: 1, background: "#2A2A2A", margin: "16px 0 20px" }} />

          <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            <Metric name="RECOVERY" value={String(selectedData.recovery)} unit="%" pct={selectedData.recovery} />
            <Metric name="SONO" value={`${selectedData.sleepH}h ${String(selectedData.sleepM).padStart(2, "0")}min`} pct={Math.min(100, ((selectedData.sleepH * 60 + selectedData.sleepM) / 540) * 100)} />
            <Metric name="HRV" value={String(selectedData.hrv)} unit="ms" pct={Math.min(100, selectedData.hrv)} />
            <Metric name="SCORE DO DIA" value={String(selectedData.score)} unit="%" pct={selectedData.score} />
          </div>

          <div style={{ height: 1, background: "#2A2A2A", margin: "8px 0 20px" }} />

          <div style={{ marginBottom: 16 }}>
            <SectionLabel>PLANO DO DIA</SectionLabel>
          </div>
          <p style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.6, borderLeft: "2px solid #E8003D", paddingLeft: 16, marginBottom: 24 }}>
            Seu corpo estava bem recuperado. HRV estável indicou mente apta para foco profundo.
          </p>

          {[
            { n: "01", t: "Avançar no conteúdo mais difícil", c: "FOCO PROFUNDO" },
            { n: "02", t: "Revisão moderada no período da tarde", c: "REVISÃO" },
            { n: "03", t: "Dormir até 23h para manter o ritmo", c: "RECUPERAÇÃO" },
          ].map((p, i) => (
            <div key={p.n} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 16, padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid #2A2A2A" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "#E8003D" }}>{p.n}</div>
              <div>
                <div style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 1.4 }}>{p.t}</div>
                <div style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 6 }}>{p.c}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
