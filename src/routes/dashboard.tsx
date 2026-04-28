import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GrindLogo } from "@/components/GrindLogo";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

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
.dash-logout:hover { border-color: #E8003D !important; color: #FFFFFF !important; }
.grind-ring-arc { animation: grind-ring-draw 1.2s ease-out forwards; }
.grind-bar-fill { animation: grind-bar-fill 0.8s ease-out forwards; }
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

function DashboardPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    { label: "4h de estudo focado", done: false },
    { label: "Revisão de flashcards", done: true },
    { label: "Dormir antes das 23h", done: false },
  ]);
  const [popKey, setPopKey] = useState<Record<number, number>>({});

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    supabase.from("profiles").select("onboarding_complete").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      if (!data?.onboarding_complete) navigate({ to: "/onboarding" });
    });
  }, [session, loading, navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const toggleTask = (i: number) => {
    setTasks((prev) => prev.map((x, idx) => idx === i ? { ...x, done: !x.done } : x));
    setPopKey((p) => ({ ...p, [i]: (p[i] || 0) + 1 }));
  };

  const completed = tasks.filter((t) => t.done).length;

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FFFFFF" }}>
      <style>{DASH_STYLES}</style>

      {/* Top bar */}
      <header style={{ height: 56, borderBottom: "1px solid #2A2A2A", boxShadow: "0 1px 0 #E8003D20", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <GrindLogo height={28} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {formatToday()}
        </div>
        <button
          onClick={logout}
          className="dash-logout"
          style={{
            height: 32,
            padding: "0 14px",
            background: "transparent",
            border: "1px solid #2A2A2A",
            color: "#A0A0A0",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontFamily: "'Space Grotesk', sans-serif",
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          SAIR
        </button>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 32, display: "grid", gridTemplateColumns: "65fr 35fr", gap: 24 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 32, alignContent: "start" }}>
          {/* Block 1 — Score */}
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

          {/* Block 2 — Plano do Dia */}
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

          {/* Block 3 — Checklist */}
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
                    style={{
                      width: 18,
                      height: 18,
                      border: "1px solid #2A2A2A",
                      background: t.done ? "#E8003D" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {t.done ? "✓" : ""}
                  </span>
                  <span
                    className={`grind-strike-wrap ${t.done ? "on" : ""}`}
                    style={{ fontSize: 14, color: t.done ? "#555555" : "#FFFFFF" }}
                  >
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
          {/* Block 4 — Métricas */}
          <section>
            <SectionLabel pulse>CORPO · HOJE</SectionLabel>
            <div style={SEP} />
            <div style={{ display: "grid", gap: 20 }}>
              <Metric name="RECOVERY" value="87" unit="%" pct={87} />
              <Metric name="HRV" value="62" unit="ms" pct={65} />
              <Metric name="SONO" value="7h 32min" pct={80} />
              <Metric name="STRAIN" value="11.4" pct={55} />
            </div>
          </section>

          {/* Block 5 — Tendência */}
          <section>
            <SectionLabel>TENDÊNCIA · 7 DIAS</SectionLabel>
            <div style={SEP} />
            <Trend />
          </section>

          {/* Block 6 — Projeção */}
          <section>
            <SectionLabel>PROJEÇÃO</SectionLabel>
            <div style={SEP} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <StatBox label="DIAS RESTANTES" value="127" color="#FFFFFF" />
              <StatBox label="DIAS À FRENTE" value="+3" color="#E8003D" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

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
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E8003D"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={circ}
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
        <div
          className="grind-bar-fill"
          style={{ height: "100%", background: "#E8003D", width: 0, ["--bar-target" as never]: `${pct}%` }}
        />
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
          if (isToday) {
            bg = "rgba(232, 0, 61, 0.3)";
            border = "1px solid #E8003D";
          } else if (isMax) {
            bg = "#E8003D";
          }
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
