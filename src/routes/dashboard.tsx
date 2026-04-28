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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={LABEL}>
      <span style={{ color: "#E8003D", marginRight: 8 }}>●</span>
      {children}
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

  const completed = tasks.filter((t) => t.done).length;

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FFFFFF" }}>
      {/* Top bar */}
      <header style={{ height: 56, borderBottom: "1px solid #2A2A2A", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

      <style>{`.dash-logout:hover { border-color: #E8003D !important; color: #FFFFFF !important; }`}</style>

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 32, display: "grid", gridTemplateColumns: "65fr 35fr", gap: 24 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 32, alignContent: "start" }}>
          {/* Block 1 — Score */}
          <section>
            <SectionLabel>SCORE DO OBJETIVO</SectionLabel>
            <div style={SEP} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 96, color: "#E8003D", lineHeight: 1 }}>87</div>
            <div style={{ ...LABEL, color: "#555555", marginTop: 8 }}>ADERÊNCIA AO PLANO</div>
            <div style={{ height: 2, background: "#1A1A1A", marginTop: 16 }}>
              <div style={{ height: "100%", width: "87%", background: "#E8003D" }} />
            </div>
            <p style={{ fontSize: 13, color: "#A0A0A0", marginTop: 16, lineHeight: 1.6 }}>
              No ritmo atual você completa o plano 3 dias antes do prazo.
            </p>
          </section>

          {/* Block 2 — Plano do Dia */}
          <section>
            <SectionLabel>PLANO DO DIA</SectionLabel>
            <div style={SEP} />
            <p style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 1.6, marginBottom: 24 }}>
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
                    onClick={() => setTasks((prev) => prev.map((x, idx) => idx === i ? { ...x, done: !x.done } : x))}
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
                  <span style={{ fontSize: 14, color: t.done ? "#555555" : "#FFFFFF", textDecoration: t.done ? "line-through" : "none" }}>
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
            <SectionLabel>CORPO · HOJE</SectionLabel>
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

function Metric({ name, value, unit, pct }: { name: string; value: string; unit?: string; pct: number }) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: "1px solid #2A2A2A" }}>
      <div style={{ fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#FFFFFF" }}>{value}</span>
        {unit && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555555" }}>{unit}</span>}
      </div>
      <div style={{ height: 2, background: "#1A1A1A" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#E8003D" }} />
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
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, alignItems: "end", height: 80 }}>
        {data.map((v, i) => {
          const h = (v / 100) * 80;
          const isMax = i === maxIdx;
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              style={{
                height: h,
                background: isMax ? "#E8003D" : "#2A2A2A",
                border: isToday && !isMax ? "1px solid #E8003D" : "none",
              }}
            />
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
