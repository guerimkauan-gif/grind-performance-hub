import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GrindLogo } from "@/components/GrindLogo";
import { AuthLoader } from "@/components/AuthLoader";
import { DailyChecklist } from "@/components/DailyChecklist";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type SectionKey = "HOJE" | "CORPO" | "PROGRESSO" | "CALENDÁRIO" | "TAREFAS" | "CHECK-IN" | "DISPOSITIVOS" | "OBJETIVO" | "GRIND AI";
const SECTIONS: SectionKey[] = ["HOJE", "CORPO", "PROGRESSO", "CALENDÁRIO", "TAREFAS", "CHECK-IN", "DISPOSITIVOS", "OBJETIVO", "GRIND AI"];

const pageVariants = {
  initial: (dir: number) => ({ x: dir > 0 ? 72 : -72, opacity: 0 }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 26, mass: 0.8 },
      opacity: { duration: 0.18, ease: "easeOut" as const },
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -72 : 72,
    opacity: 0,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 26, mass: 0.8 },
      opacity: { duration: 0.14, ease: "easeIn" as const },
    },
  }),
};

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
@keyframes grind-content-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes grind-loader-dot {
  0%, 100% { opacity: 0.15; }
  20% { opacity: 1; }
  60% { opacity: 0.15; }
}
.grind-loader-dot {
  width: 6px; height: 6px; background: #E8003D; border-radius: 0;
  display: inline-block; opacity: 0.15;
  animation: grind-loader-dot 1.2s ease-in-out infinite;
}
.grind-loader-dot:nth-child(1) { animation-delay: 0s; }
.grind-loader-dot:nth-child(2) { animation-delay: 0.4s; }
.grind-loader-dot:nth-child(3) { animation-delay: 0.8s; }
.grind-content-fade-in { animation: grind-content-fade-in 300ms ease-out; }
.dash-logout:hover { border-color: #E8003D !important; color: #FFFFFF !important; }
.grind-edit-btn:hover { color: #E8003D !important; }
.grind-ring-arc { animation: grind-ring-draw 1.2s ease-out forwards; }
.grind-bar-fill { animation: grind-bar-fill 0.8s ease-out forwards; }
.grind-fade-in { animation: grind-fade-in 150ms ease-out; }
@keyframes grind-slide-out-left { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-60px); opacity: 0; } }
@keyframes grind-slide-out-right { from { transform: translateX(0); opacity: 1; } to { transform: translateX(60px); opacity: 0; } }
@keyframes grind-slide-in-from-right { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes grind-slide-in-from-left { from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.grind-page-stage { position: relative; }
.grind-page-stage.is-transitioning { overflow: hidden; }
.grind-page-stage.is-transitioning > .grind-page { position: absolute; top: 0; left: 0; right: 0; width: 100%; }
.grind-page-out-to-left { animation: grind-slide-out-left 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.grind-page-out-to-right { animation: grind-slide-out-right 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
.grind-page-in-from-right { animation: grind-slide-in-from-right 320ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both; }
.grind-page-in-from-left { animation: grind-slide-in-from-left 320ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both; }
.grind-nav-locked { pointer-events: none; }
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
  margin-bottom: -1px;
  transition: color 0.15s;
}
.grind-tab:hover { color: #A0A0A0; }
.grind-tab.active { color: #FFFFFF; }
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
const IconChecklist = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <polyline points="3 7 5 9 9 5" /><polyline points="3 15 5 17 9 13" /><line x1="13" y1="7" x2="21" y2="7" /><line x1="13" y1="15" x2="21" y2="15" />
  </svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
const IconDevice = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2">
    <rect x="6" y="3" width="12" height="18" /><line x1="10" y1="7" x2="14" y2="7" /><circle cx="12" cy="17" r="1" />
  </svg>
);
const IconGrindAI = ({ stroke = "#555555", size = 18 }: { stroke?: string; size?: number } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* head silhouette (profile facing right) */}
    <path d="M18.5 20.5v-3c1.8-1 3-2.9 3-5.1 0-3.6-3.2-6.4-7-6.4-3.5 0-6.4 2.4-6.9 5.5L6 14.5l1.6 1v2.2h2v2.8" />
    {/* neural network nodes */}
    <circle cx="11" cy="10" r="0.9" fill={stroke} stroke="none" />
    <circle cx="14.5" cy="9.2" r="0.9" fill={stroke} stroke="none" />
    <circle cx="17.5" cy="10.5" r="0.9" fill={stroke} stroke="none" />
    <circle cx="12.5" cy="13" r="0.9" fill={stroke} stroke="none" />
    <circle cx="16" cy="13" r="0.9" fill={stroke} stroke="none" />
    <circle cx="14" cy="16" r="0.9" fill={stroke} stroke="none" />
    {/* connections */}
    <line x1="11" y1="10" x2="14.5" y2="9.2" />
    <line x1="14.5" y1="9.2" x2="17.5" y2="10.5" />
    <line x1="11" y1="10" x2="12.5" y2="13" />
    <line x1="14.5" y1="9.2" x2="12.5" y2="13" />
    <line x1="14.5" y1="9.2" x2="16" y2="13" />
    <line x1="17.5" y1="10.5" x2="16" y2="13" />
    <line x1="12.5" y1="13" x2="16" y2="13" />
    <line x1="12.5" y1="13" x2="14" y2="16" />
    <line x1="16" y1="13" x2="14" y2="16" />
  </svg>
);
const ICONS: Record<SectionKey, () => React.ReactElement> = {
  HOJE: IconSun, CORPO: IconPulse, PROGRESSO: IconBars, "CALENDÁRIO": IconCalendar, TAREFAS: IconChecklist, "CHECK-IN": IconMoon, DISPOSITIVOS: IconDevice, OBJETIVO: IconTarget, "GRIND AI": () => <IconGrindAI />,
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

  // Slide direction tracking (Framer Motion)
  const currentIndex = SECTIONS.indexOf(section);
  const prevIndexRef = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= prevIndexRef.current ? 1 : -1;
  useEffect(() => { prevIndexRef.current = currentIndex; }, [currentIndex]);

  // Animated active-tab indicator
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[currentIndex];
      if (el) setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentIndex]);

  const goSection = (s: SectionKey) => {
    setDrawerOpen(false);
    if (s === section) return;
    setSection(s);
  };

  const renderSection = (s: SectionKey) => {
    switch (s) {
      case "HOJE": return <SectionHoje />;
      case "CORPO": return <SectionCorpo onNavigate={goSection} />;
      case "PROGRESSO": return <SectionProgresso />;
      case "CALENDÁRIO": return <SectionCalendario />;
      case "TAREFAS": return <SectionTarefas />;
      case "CHECK-IN": return <SectionCheckin />;
      case "DISPOSITIVOS": return <SectionDispositivos />;
      case "OBJETIVO": return <SectionObjetivo profile={profile} userId={session?.user.id} onSaved={(p) => setProfile((cur) => cur ? { ...cur, ...p } : cur)} />;
      case "GRIND AI": return <SectionGrindAI profile={profile} userId={session?.user.id} userEmail={session?.user.email ?? null} userMeta={session?.user.user_metadata ?? null} />;
      default: return null;
    }
  };

  if (loading || !session || !profile) return <AuthLoader />;

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

        <nav className="grind-tabs-desktop" style={{ position: "relative" }}>
          {SECTIONS.map((s, i) => {
            const isAi = s === "GRIND AI";
            const Icon = ICONS[s];
            return (
              <button
                key={s}
                ref={(el) => { tabRefs.current[i] = el; }}
                className={`grind-tab ${section === s ? "active" : ""}`}
                onClick={() => goSection(s)}
                title={isAi ? "GRIND AI" : undefined}
                style={isAi ? { padding: "0 16px", display: "inline-flex", alignItems: "center", justifyContent: "center" } : undefined}
              >
                {isAi ? <Icon /> : s}
              </button>
            );
          })}
          <motion.div
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width, opacity: indicatorStyle.width ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.7 }}
            style={{ position: "absolute", bottom: -1, height: 2, backgroundColor: "#E8003D", borderRadius: 1, pointerEvents: "none" }}
          />
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
      <main className="grind-main" style={{ maxWidth: 1280, margin: "0 auto", padding: 32 }}>
        <div style={{ position: "relative", overflow: "hidden", minHeight: "60vh" }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={section}
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ width: "100%" }}
            >
              {renderSection(section)}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ====================== HOJE (original dashboard content) ====================== */
type AiPlan = {
  context: string;
  observations: { number: string; metric: string; insight: string }[];
  recommendation: string;
  adherence_score: number;
};

function SectionHoje() {
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [profile, setProfile] = useState<{ created_at: string | null; deadline: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;
      const { data } = await supabase.from("profiles").select("created_at,deadline").eq("id", uid).maybeSingle();
      if (!cancelled && data) setProfile({ created_at: data.created_at, deadline: data.deadline });
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) { if (!cancelled) setPlanLoading(false); return; }
        const { getOrGenerateDailyPlan } = await import("@/server/dailyPlan.functions");
        const result = await getOrGenerateDailyPlan({ data: { accessToken: token } });
        if (cancelled) return;
        if (result.ok && result.plan) {
          try {
            setPlan(JSON.parse(result.plan));
          } catch {
            setPlanError("Não foi possível gerar seu plano hoje. Tente novamente mais tarde.");
          }
        } else {
          console.error("Daily plan error:", result.error);
          setPlanError("Não foi possível gerar seu plano hoje. Tente novamente mais tarde.");
        }
      } catch (err) {
        console.error("Daily plan request failed", err);
        if (!cancelled) setPlanError("Não foi possível gerar seu plano hoje. Tente novamente mais tarde.");
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);



  if (planLoading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 56px - 64px)",
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <GrindLogo size={32} letterSpacing="0.2em" />
        <div style={{ display: "flex", gap: 8 }}>
          <span className="grind-loader-dot" />
          <span className="grind-loader-dot" />
          <span className="grind-loader-dot" />
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#555555",
          }}
        >
          GERANDO SEU PLANO
        </div>
      </div>
    );
  }

  return (
    <div className="grind-main-grid grind-content-fade-in" style={{ display: "grid", gridTemplateColumns: "65fr 35fr", gap: 24 }}>
      {/* LEFT */}
      <div style={{ display: "grid", gap: 32, alignContent: "start" }}>
        <section>
          <SectionLabel>SCORE DO OBJETIVO</SectionLabel>
          <div style={SEP} />
          {(() => {
            const _today = new Date(); _today.setHours(0, 0, 0, 0);
            const _start = profile?.created_at ? new Date(profile.created_at) : null;
            const _deadline = profile?.deadline ? new Date(profile.deadline) : null;
            const _total = _start && _deadline ? Math.max(1, Math.ceil((_deadline.getTime() - _start.getTime()) / 86400000)) : 0;
            const _elapsed = _start ? Math.max(1, Math.min(_total || 9999, Math.floor((_today.getTime() - _start.getTime()) / 86400000) + 1)) : 0;
            return (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
                <ScoreRing value={Math.max(0, Math.min(100, Math.round(plan?.adherence_score ?? 75)))} />
                {_total > 0 && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    DIA {_elapsed} DE {_total}
                  </div>
                )}
                <div style={{ ...LABEL, color: "#555555" }}>ADERÊNCIA AO PLANO</div>
              </div>
            );
          })()}
        </section>

        <section>
          <SectionLabel>PLANO DO DIA</SectionLabel>
          <div style={SEP} />
          {planError ? (
            <p style={{ fontSize: 14, color: "#A0A0A0", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
              {planError}
            </p>
          ) : (
            <>
              <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: 24, marginBottom: 2 }}>
                <p style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 1.6, marginBottom: 24, borderLeft: "2px solid #E8003D", paddingLeft: 16, fontFamily: "'JetBrains Mono', monospace", marginTop: 0 }}>
                  {plan?.context ?? (planLoading ? "Gerando seu plano do dia..." : "—")}
                </p>
                {(plan?.observations ?? []).map((o, i) => (
                  <div key={o.number} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 16, padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid #2A2A2A" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "#E8003D" }}>{o.number}</div>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{o.metric}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, fontSize: 14, color: "#A0A0A0", lineHeight: 1.5 }}>{o.insight}</div>
                    </div>
                  </div>
                ))}
              </div>
              {plan?.recommendation && (
                <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: 24, marginTop: 2 }}>
                  <div style={{ ...LABEL, display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #2A2A2A", padding: "4px 10px", letterSpacing: "0.12em", marginBottom: 12 }}>
                    <span style={{ width: 6, height: 6, background: "#E8003D", display: "inline-block" }} aria-hidden="true" />
                    <span>RECOMENDAÇÃO DO DIA</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 1.6, borderLeft: "2px solid #E8003D", paddingLeft: 16, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                    {plan.recommendation}
                  </p>
                </div>
              )}
            </>
          )}
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
type DeviceKey = "whoop" | "garmin" | "oura";
type CorpoSelection = "todos" | DeviceKey;

const DEVICE_BADGE_BG: Record<DeviceKey, string> = { whoop: "#E8003D", garmin: "#00B4D8", oura: "#FFFFFF" };
const DEVICE_BADGE_FG: Record<DeviceKey, string> = { whoop: "#FFFFFF", garmin: "#0A0A0A", oura: "#0A0A0A" };
const DEVICE_LETTER: Record<DeviceKey, string> = { whoop: "W", garmin: "G", oura: "O" };
const DEVICE_LABEL: Record<DeviceKey, string> = { whoop: "WHOOP", garmin: "GARMIN", oura: "OURA" };

function SectionCorpo({ onNavigate }: { onNavigate: (s: SectionKey) => void }) {
  const [connectedDevices] = useState<DeviceKey[]>(["whoop", "oura"]);
  const [selected, setSelected] = useState<CorpoSelection>("todos");
  const [open, setOpen] = useState(false);

  const options: { key: CorpoSelection; label: string }[] = [
    { key: "todos", label: "TODOS OS DISPOSITIVOS" },
    ...connectedDevices.map((d) => ({ key: d as CorpoSelection, label: DEVICE_LABEL[d] })),
  ];

  // Guard: if currently selected device gets disconnected, fall back to todos
  useEffect(() => {
    if (selected !== "todos" && !connectedDevices.includes(selected as DeviceKey)) {
      setSelected("todos");
    }
  }, [connectedDevices, selected]);

  const selectedLabel = options.find((o) => o.key === selected)?.label ?? "TODOS OS DISPOSITIVOS";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 40 }}>
      <section>
        <SectionLabel>CORPO · HOJE</SectionLabel>
        <div style={SEP} />

        {connectedDevices.length === 0 ? (
          <button
            onClick={() => onNavigate("DISPOSITIVOS")}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              background: "#111111", border: "1px solid #2A2A2A", borderLeft: "3px solid #E8003D",
              padding: "16px 20px", color: "#A0A0A0", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
            }}
          >
            NENHUM DISPOSITIVO CONECTADO — ACESSE A SEÇÃO DISPOSITIVOS PARA CONFIGURAR.
          </button>
        ) : (
          <>
            <div style={{ position: "relative", width: 220, marginBottom: 20 }}>
              <button
                onClick={() => setOpen((o) => !o)}
                style={{
                  width: "100%", height: 40, background: "#111111", border: "1px solid #2A2A2A",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 14px", cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFFFFF",
                }}
              >
                <span>{selectedLabel}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                  <polyline points="2,3 5,7 8,3" fill="none" stroke="#E8003D" strokeWidth="1.5" />
                </svg>
              </button>
              {open && (
                <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "#111111", border: "1px solid #2A2A2A", zIndex: 50, marginTop: -1 }}>
                  {options.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => { setSelected(o.key); setOpen(false); }}
                      className="grind-corpo-opt"
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none", borderLeft: "2px solid transparent",
                        padding: "10px 14px", cursor: "pointer",
                        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: o.key === selected ? "#FFFFFF" : "#A0A0A0",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <style>{`
              .grind-corpo-opt:hover { border-left-color: #E8003D !important; background: #1A1A1A !important; color: #FFFFFF !important; }
              .grind-corpo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
              @media (min-width: 768px) { .grind-corpo-grid { grid-template-columns: repeat(4, 1fr); } }
            `}</style>

            <div key={selected} className="grind-fade-in">
              {selected === "todos" && <DashCorpoCruzado connected={connectedDevices} />}
              {selected === "whoop" && connectedDevices.includes("whoop") && <DashCorpoWhoop />}
              {selected === "oura" && connectedDevices.includes("oura") && <DashCorpoOura />}
              {selected === "garmin" && connectedDevices.includes("garmin") && <DashCorpoGarmin />}
            </div>
          </>
        )}
      </section>

      <section>
        <SectionLabel>EVOLUÇÃO · 7 DIAS</SectionLabel>
        <div style={SEP} />
        <LineChart data={[72, 65, 81, 78, 55, 90, 87]} days={["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]} />
      </section>

      <section>
        <SectionLabel>ALERTA</SectionLabel>
        <div style={SEP} />
        <div style={{ background: "#111111", borderLeft: "3px solid #E8003D", padding: "16px 20px", color: "#A0A0A0", fontSize: 14, lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400 }}>
          HRV em queda nos últimos 3 dias — considere reduzir a carga amanhã.
        </div>
      </section>
    </div>
  );
}

function CorpoCard({ label, value, device, gauge, pct, children }: { label: string; value: string; device?: DeviceKey; gauge?: number; pct?: number; children?: React.ReactNode }) {
  return (
    <div style={{ position: "relative", background: "#111111", border: "1px solid #2A2A2A", padding: 20, minHeight: 120 }}>
      {device && (
        <div style={{
          position: "absolute", top: 8, right: 8, width: 20, height: 20,
          background: DEVICE_BADGE_BG[device], color: DEVICE_BADGE_FG[device],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 0,
        }}>{DEVICE_LETTER[device]}</div>
      )}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, paddingRight: 24 }}>{label}</div>
      {gauge !== undefined ? (
        <MiniGauge value={gauge} label={value} />
      ) : (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: "#FFFFFF", lineHeight: 1.1 }}>{value}</div>
      )}
      {pct !== undefined && (
        <div style={{ height: 2, background: "#0A0A0A", marginTop: 12 }}>
          <div className="grind-bar-fill" style={{ height: "100%", background: "#E8003D", width: 0, ["--bar-target" as never]: `${pct}%` }} />
        </div>
      )}
      {children}
    </div>
  );
}

function MiniGauge({ value, label }: { value: number; label: string }) {
  const size = 64, stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2A2A" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8003D" strokeWidth={stroke}
          strokeDasharray={circ} className="grind-ring-arc"
          style={{ ["--ring-circ" as never]: `${circ}px`, ["--ring-target" as never]: `${target}px` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>{label}</span>
      </div>
    </div>
  );
}

function DashCorpoWhoop() {
  return (
    <div className="grind-corpo-grid">
      <CorpoCard label="RECOVERY SCORE" value="87%" device="whoop" gauge={87} />
      <CorpoCard label="HRV" value="62 ms" device="whoop" pct={65} />
      <CorpoCard label="STRAIN" value="11.4" device="whoop" pct={57} />
      <CorpoCard label="FC EM REPOUSO" value="52 bpm" device="whoop" />
      <CorpoCard label="SPO2" value="98%" device="whoop" />
      <CorpoCard label="SONO PROFUNDO" value="1h 42min" device="whoop" />
      <CorpoCard label="SONO REM" value="2h 08min" device="whoop" />
    </div>
  );
}

function DashCorpoOura() {
  return (
    <div className="grind-corpo-grid">
      <CorpoCard label="READINESS SCORE" value="82%" device="oura" gauge={82} />
      <CorpoCard label="SLEEP SCORE" value="79%" device="oura" pct={79} />
      <CorpoCard label="ACTIVITY SCORE" value="74%" device="oura" />
      <CorpoCard label="HRV BALANCE" value="68 ms" device="oura" />
      <CorpoCard label="TEMP. CORPORAL" value="+0.2°C" device="oura" />
      <CorpoCard label="PASSOS" value="8.420" device="oura" />
      <CorpoCard label="CALORIAS ATIVAS" value="520 kcal" device="oura" />
    </div>
  );
}

function DashCorpoGarmin() {
  return (
    <div className="grind-corpo-grid">
      <CorpoCard label="BODY BATTERY" value="76%" device="garmin" gauge={76} />
      <CorpoCard label="STRESS SCORE" value="28" device="garmin" pct={28} />
      <CorpoCard label="VO2 MAX" value="52" device="garmin" />
      <CorpoCard label="FC MÉDIA" value="68 bpm" device="garmin" />
      <CorpoCard label="PASSOS" value="9.150" device="garmin" />
      <CorpoCard label="CALORIAS" value="2.340 kcal" device="garmin" />
    </div>
  );
}

function DashCorpoCruzado({ connected }: { connected: DeviceKey[] }) {
  // Per-device data points relevant for cross view
  const data: Record<DeviceKey, { hrv?: string; sono?: string; fcRepouso?: string; recuperacao?: number }> = {
    whoop: { hrv: "62 ms", sono: "7h 32min", fcRepouso: "52 bpm", recuperacao: 87 },
    oura:  { hrv: "68 ms", sono: "7h 48min", recuperacao: 82 },
    garmin:{ fcRepouso: "55 bpm", recuperacao: 76 },
  };

  type Row = { metric: string; key: "hrv" | "sono" | "fcRepouso" };
  const rows: Row[] = [
    { metric: "HRV", key: "hrv" },
    { metric: "SONO", key: "sono" },
    { metric: "FC EM REPOUSO", key: "fcRepouso" },
  ];
  const visibleRows = rows.filter((r) => connected.filter((d) => data[d][r.key] !== undefined).length >= 2);

  const recDevices = connected.filter((d) => data[d].recuperacao !== undefined);
  const recAvg = recDevices.length > 0
    ? Math.round(recDevices.reduce((a, d) => a + (data[d].recuperacao ?? 0), 0) / recDevices.length)
    : null;
  const showRecuperacao = recDevices.length >= 2;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {showRecuperacao && recAvg !== null && (
        <div style={{ background: "#111111", border: "1px solid #2A2A2A", borderLeft: "3px solid #E8003D", padding: 24 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 12 }}>RECUPERAÇÃO GERAL · MÉDIA</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 48, color: "#FFFFFF", lineHeight: 1 }}>{recAvg}%</span>
            <div style={{ display: "flex", gap: 16 }}>
              {recDevices.map((d) => (
                <div key={d}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0" }}>{DEVICE_LABEL[d]}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#FFFFFF" }}>{data[d].recuperacao}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {visibleRows.map((r) => {
        const present = connected.filter((d) => data[d][r.key] !== undefined);
        return (
          <div key={r.key} style={{ background: "#111111", border: "1px solid #2A2A2A", padding: 20 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 14 }}>{r.metric}</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${present.length}, 1fr)`, gap: 16 }}>
              {present.map((d) => (
                <div key={d}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A0A0A0", marginBottom: 6 }}>{DEVICE_LABEL[d]}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: "#FFFFFF" }}>{data[d][r.key]}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#A0A0A0", marginTop: 4 }}>
        DADOS CRUZADOS — MÉDIAS CALCULADAS ENTRE OS DISPOSITIVOS CONECTADOS
      </div>
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
              <text x={padL - 8} y={y + 4} fontFamily="'JetBrains Mono', monospace" fontSize={13} fill="#FFFFFF" fillOpacity={0.85} textAnchor="end">{t}</text>
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
          <text key={i} x={p.x} y={H - 6} fontFamily="'JetBrains Mono', monospace" fontSize={13} fill="#FFFFFF" fillOpacity={0.85} textAnchor="middle">{days[i]}</text>
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
/* ====================== TAREFAS ====================== */
function SectionTarefas() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 24 }}>
      <section>
        <SectionLabel>TAREFAS DO DIA</SectionLabel>
        <div style={SEP} />
        <DailyChecklist />
      </section>
    </div>
  );
}

function SectionObjetivo({ profile, userId, onSaved }: { profile: Profile | null; userId?: string; onSaved: (p: Partial<Profile>) => void }) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState<string>(profile?.daily_hours?.toString() ?? "");
  const [days, setDays] = useState<string>(profile?.days_per_week?.toString() ?? "");
  const [deadline, setDeadline] = useState<string>(profile?.deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState<string>("");
  const [savingGoal, setSavingGoal] = useState(false);

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
        {(() => {
          const displayTitle = (profile?.goal_name && profile.goal_name.trim()) || profile?.dream || "—";
          const startEdit = () => {
            setGoalDraft(profile?.goal_name || profile?.dream || "");
            setEditingGoal(true);
          };
          const cancelEdit = () => {
            setEditingGoal(false);
            setGoalDraft("");
          };
          const saveGoal = async () => {
            if (!userId) return;
            setSavingGoal(true);
            const value = goalDraft.trim();
            const { error } = await supabase.from("profiles").update({ goal_name: value }).eq("id", userId);
            setSavingGoal(false);
            if (error) return;
            onSaved({ goal_name: value });
            setEditingGoal(false);
          };
          return (
            <div style={{ borderLeft: "3px solid #E8003D", paddingLeft: 20 }}>
              {!editingGoal ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#FFFFFF", lineHeight: 1.2, margin: 0, textTransform: "uppercase" }}>
                    {displayTitle}
                  </div>
                  <button
                    onClick={startEdit}
                    aria-label="Editar"
                    className="grind-edit-btn"
                    style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", color: "#555555", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  <input
                    type="text"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    autoFocus
                    style={{
                      height: 44,
                      padding: "0 16px",
                      background: "#111111",
                      border: "1px solid #E8003D",
                      borderRadius: 0,
                      color: "#FFFFFF",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      outline: "none",
                      textTransform: "uppercase",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={saveGoal}
                      disabled={savingGoal || goalDraft.trim().length === 0}
                      style={{ height: 36, padding: "0 20px", background: "#E8003D", color: "#FFFFFF", border: "none", borderRadius: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", filter: savingGoal || goalDraft.trim().length === 0 ? "brightness(0.6)" : "none" }}
                    >
                      {savingGoal ? "..." : "SALVAR"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{ height: 36, padding: "0 20px", background: "transparent", color: "#A0A0A0", border: "1px solid #2A2A2A", borderRadius: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
              {(() => {
                const dreamText = profile?.dream?.trim() || "";
                const goalText = (profile?.goal_name || "").trim();
                const showDream = dreamText.length > 0 && dreamText.toLowerCase() !== goalText.toLowerCase();
                if (!showDream) return null;
                return (
                  <p style={{ fontWeight: 400, fontSize: 15, color: "#A0A0A0", lineHeight: 1.6, margin: "12px 0 0 0" }}>
                    {profile?.dream}
                  </p>
                );
              })()}
            </div>
          );
        })()}
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
  const size = 180;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A2A2A" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8003D" strokeWidth={stroke}
          strokeLinecap="butt" strokeDasharray={circ}
          className="grind-ring-arc"
          style={{ ["--ring-circ" as never]: `${circ}px`, ["--ring-target" as never]: `${target}px` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 68, color: "#FFFFFF", letterSpacing: "-0.04em" }}>{value}</span>
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

/* ====================== CHECK-IN NOTURNO ====================== */
type CheckinData = {
  focus_hours: number;
  concentration: number;
  physical: number;
  energy: "CAIU" | "ESTÁVEL" | "AUMENTOU" | null;
  sleep: number;
};

const CONCENTRATION_LABELS = ["PÉSSIMA", "RUIM", "OK", "BOA", "EXCELENTE"];
const PHYSICAL_LABELS = ["PÉSSIMO", "RUIM", "OK", "BOM", "EXCELENTE"];
const SLEEP_LABELS = ["PÉSSIMO", "RUIM", "OK", "BOM", "EXCELENTE"];

const SLIDER_CSS = `
.grind-range {
  -webkit-appearance: none; appearance: none; width: 100%; height: 2px;
  background: #2A2A2A; outline: none; cursor: pointer; border-radius: 0;
}
.grind-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 12px; height: 12px; background: #E8003D;
  border: none; border-radius: 0; cursor: pointer;
  margin-top: -5px;
}
.grind-range::-moz-range-thumb {
  width: 12px; height: 12px; background: #E8003D;
  border: none; border-radius: 0; cursor: pointer;
}
.grind-energy-btn {
  flex: 1; height: 48px; background: #1A1A1A; border: 1px solid #2A2A2A;
  color: #A0A0A0; font-family: 'Space Grotesk', sans-serif; font-weight: 700;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;
  cursor: pointer; transition: all 0.15s;
}
.grind-energy-btn:hover { border-color: #555555; color: #FFFFFF; }
.grind-energy-btn.active { background: #E8003D; border-color: #E8003D; color: #FFFFFF; }
`;

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DeviceMeta = { key: DeviceKey; name: string; letter: string; desc: string };
const DEVICES: DeviceMeta[] = [
  { key: "whoop", name: "WHOOP", letter: "W", desc: "Recuperação, strain e dados de sono em tempo real" },
  { key: "garmin", name: "GARMIN", letter: "G", desc: "Métricas de treino, HRV e performance atlética" },
  { key: "oura", name: "OURA RING", letter: "O", desc: "Qualidade do sono, prontidão e frequência cardíaca" },
];

function SectionDispositivos() {
  const [connected, setConnected] = useState<Record<DeviceKey, boolean>>({ whoop: false, garmin: false, oura: false });
  const [pendingMsg, setPendingMsg] = useState<Record<DeviceKey, boolean>>({ whoop: false, garmin: false, oura: false });

  const handleConnect = (k: DeviceKey) => setPendingMsg((s) => ({ ...s, [k]: true }));
  const handleDisconnect = (k: DeviceKey) => {
    setConnected((s) => ({ ...s, [k]: false }));
    setPendingMsg((s) => ({ ...s, [k]: false }));
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 40 }}>
      <div>
        <SectionLabel>INTEGRAÇÕES · WEARABLES</SectionLabel>
        <div className="grind-main-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
          {DEVICES.map((d) => {
            const isConn = connected[d.key];
            return (
              <div key={d.key} style={{ background: "#111111", border: "1px solid #2A2A2A", padding: 24 }}>
                <div style={{ width: 56, height: 56, background: "#1A1A1A", border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8003D", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24 }}>
                  {d.letter}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 16 }}>
                  {d.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555555", lineHeight: 1.5, marginTop: 8 }}>
                  {d.desc}
                </div>
                <div style={{ height: 1, background: "#2A2A2A", margin: "20px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className={isConn ? "grind-live-square" : ""}
                    style={{ width: 6, height: 6, background: isConn ? "#E8003D" : "#333333", display: "inline-block" }}
                  />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: isConn ? "#A0A0A0" : "#555555", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    {isConn ? "CONECTADO" : "NÃO CONECTADO"}
                  </span>
                </div>
                <button
                  onClick={() => (isConn ? handleDisconnect(d.key) : handleConnect(d.key))}
                  style={{
                    marginTop: 16,
                    width: "100%",
                    height: 44,
                    background: isConn ? "transparent" : "#E8003D",
                    border: isConn ? "1px solid #2A2A2A" : "none",
                    color: isConn ? "#A0A0A0" : "#FFFFFF",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {isConn ? "DESCONECTAR" : "CONECTAR"}
                </button>
                {pendingMsg[d.key] && !isConn && (
                  <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#A0A0A0" }}>
                    Integração com {d.name} será ativada em breve.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderLeft: "3px solid #E8003D", background: "#111111", padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          POR QUE CONECTAR?
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#A0A0A0", lineHeight: 1.6 }}>
          Seus dados biométricos alimentam o plano diário gerado pela IA. Quanto mais preciso o input, mais inteligente o output.
        </div>
      </div>
    </div>
  );
}

function SectionCheckin() {
  const [data, setData] = useState<CheckinData>({
    focus_hours: 4,
    concentration: 3,
    physical: 3,
    energy: null,
    sleep: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { setLoading(false); return; }
      const { data: row } = await supabase
        .from("daily_logs")
        .select("checkin_data")
        .eq("user_id", uid)
        .eq("log_date", todayLocalISO())
        .maybeSingle();
      if (cancelled) return;
      if (row?.checkin_data) {
        const c = row.checkin_data as Partial<CheckinData>;
        setData({
          focus_hours: c.focus_hours ?? 4,
          concentration: c.concentration ?? 3,
          physical: c.physical ?? 3,
          energy: c.energy ?? null,
          sleep: c.sleep ?? 3,
        });
        setSaved(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) throw new Error("not authenticated");
      const log_date = todayLocalISO();
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", uid)
        .eq("log_date", log_date)
        .maybeSingle();
      if (existing) {
        const { error: e } = await supabase
          .from("daily_logs")
          .update({ checkin_data: data as unknown as never })
          .eq("id", existing.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase
          .from("daily_logs")
          .insert({ user_id: uid, log_date, checkin_data: data as unknown as never });
        if (e) throw e;
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const onChange = <K extends keyof CheckinData>(k: K, v: CheckinData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="grind-loader-dot" /><span className="grind-loader-dot" /><span className="grind-loader-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="grind-content-fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      <style>{SLIDER_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: "-0.02em", color: "#FFFFFF", margin: 0 }}>
          CHECK-IN NOTURNO
        </h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 8 }}>
          {formatToday()}
        </div>
      </div>

      <div style={{ display: "grid", gap: 2 }}>
        {/* Q1: Focus hours */}
        <CheckinCard label="HORAS FOCADAS HOJE" value={`${data.focus_hours.toFixed(1).replace(/\.0$/, "")}h`}>
          <SliderWithSteppers
            value={data.focus_hours} min={0} max={12} step={0.5}
            onChange={(v) => onChange("focus_hours", v)}
          />
          <RangeTicks left="0h" right="12h" />
        </CheckinCard>

        {/* Q2: Concentration */}
        <CheckinCard label="CONCENTRAÇÃO" value={CONCENTRATION_LABELS[data.concentration - 1]}>
          <SliderWithSteppers
            value={data.concentration} min={1} max={5} step={1}
            onChange={(v) => onChange("concentration", v)}
          />
          <ScaleLabels labels={CONCENTRATION_LABELS} active={data.concentration - 1} />
        </CheckinCard>

        {/* Q3: Physical */}
        <CheckinCard label="ESTADO FÍSICO" value={PHYSICAL_LABELS[data.physical - 1]}>
          <SliderWithSteppers
            value={data.physical} min={1} max={5} step={1}
            onChange={(v) => onChange("physical", v)}
          />
          <ScaleLabels labels={PHYSICAL_LABELS} active={data.physical - 1} />
        </CheckinCard>

        {/* Q4: Energy */}
        <CheckinCard label="NÍVEL DE ENERGIA AO LONGO DO DIA" value={null}>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {(["CAIU", "ESTÁVEL", "AUMENTOU"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`grind-energy-btn ${data.energy === opt ? "active" : ""}`}
                onClick={() => onChange("energy", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </CheckinCard>

      </div>

      {/* Submit */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={submit}
          disabled={saving}
          style={{
            width: "100%", height: 56, background: "#E8003D", border: "none",
            color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em",
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {saving ? "SALVANDO..." : "REGISTRAR DIA"}
        </button>
        {saved && !saving && (
          <div style={{ marginTop: 16, padding: 16, background: "#111111", border: "1px solid #2A2A2A", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, background: "#E8003D" }} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              CHECK-IN REGISTRADO
            </div>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#E8003D", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function SliderWithSteppers({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const btnStyle: React.CSSProperties = {
    width: 32, height: 32, flexShrink: 0,
    background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 0,
    color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button type="button" style={btnStyle} onClick={() => onChange(clamp(value - step))} aria-label="Decrease">−</button>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="grind-range"
        style={{ flex: 1 }}
      />
      <button type="button" style={btnStyle} onClick={() => onChange(clamp(value + step))} aria-label="Increase">+</button>
    </div>
  );
}

function CheckinCard({ label, value, children }: { label: string; value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, gap: 12, flexWrap: "nowrap" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#A0A0A0", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {value !== null && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#E8003D", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, whiteSpace: "nowrap" }}>
            {value}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function RangeTicks({ left, right }: { left: string; right: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
      <span>{left}</span><span>{right}</span>
    </div>
  );
}

function ScaleLabels({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 4 }}>
      {labels.map((l, i) => (
        <div
          key={l}
          className="text-[9px] md:text-[12px]"
          style={{
            flex: 1, textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.08em",
            color: i === active ? "#FFFFFF" : "#A0A0A0",
            transition: "color 0.15s",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
}

/* ====================== GRIND AI ====================== */
function SectionGrindAI({ profile, userId, userEmail, userMeta }: {
  profile: Profile | null;
  userId: string | undefined;
  userEmail: string | null;
  userMeta: Record<string, any> | null;
}) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "BOM DIA" : hour < 18 ? "BOA TARDE" : "BOA NOITE";

  const firstName = (() => {
    const meta = userMeta || {};
    const fromMeta: string | undefined = meta.full_name || meta.name || meta.first_name;
    if (fromMeta && typeof fromMeta === "string") return fromMeta.trim().split(/\s+/)[0].toUpperCase();
    if (userEmail) return userEmail.split("@")[0].split(/[._-]/)[0].toUpperCase();
    return "ATLETA";
  })();

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(newMessages);
    setInput("");
    if (textRef.current) { textRef.current.style.height = "auto"; }
    setLoading(true);

    const context = {
      recovery: 87,
      hrv: 62,
      sleep: "7h 32min",
      strain: 11.4,
      goal: profile?.goal_name ?? null,
      deadline: profile?.deadline ?? null,
      dream: profile?.dream ?? null,
      daily_hours: profile?.daily_hours ?? null,
      days_per_week: profile?.days_per_week ?? null,
      user_id: userId ?? null,
    };

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("grind-ai-chat", {
        body: { messages: newMessages, context },
      });
      if (fnErr) throw fnErr;
      const reply: string = (data as any)?.reply ?? "";
      setMessages((m) => [...m, { role: "assistant", content: reply || "—" }]);
    } catch (e: any) {
      console.error(e);
      setError("Falha ao consultar o GRIND AI. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const dynamicChip = hour < 12 ? "MEU PLANO DE HOJE" : hour < 18 ? "COMO FOI MEU TREINO?" : "ANÁLISE DO MEU DIA";
  const suggestions = [
    "COMO ESTÁ MEU CORPO HOJE?",
    "ESTOU NO PRAZO DO MEU OBJETIVO?",
    "O QUE DEVO PRIORIZAR AGORA?",
    dynamicChip,
  ];

  // Rotating placeholder
  const placeholders = [
    "Pergunte algo sobre seu plano, corpo ou progresso...",
    "Como está minha recuperação hoje?",
    "Estou treinando na intensidade certa?",
  ];
  const [phIdx, setPhIdx] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % placeholders.length), 4500);
    return () => clearInterval(t);
  }, [placeholders.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const canSend = !loading && !!input.trim();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: 0 }}>
      <style>{`
        @keyframes grind-ai-blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
        @keyframes grind-ai-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes grind-ai-glow { 0%, 100% { opacity: 0.15; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 0.45; transform: translate(-50%,-50%) scale(1.18); } }
        @keyframes grind-ai-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes grind-ai-rise-sm { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes grind-ai-fade-line { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes grind-ai-cross { from { opacity: 0; } to { opacity: 1; } }
        @keyframes grind-ai-underline { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        .grind-ai-section { animation: grind-ai-cross 200ms ease-out both; }

        .grind-ai-icon-wrap { position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; }
        .grind-ai-icon-glow { position: absolute; top: 50%; left: 50%; width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, #FF2D55 0%, rgba(255,45,85,0) 65%); transform: translate(-50%,-50%); animation: grind-ai-glow 2.8s ease-in-out infinite; pointer-events: none; }
        .grind-ai-icon-pulse { animation: grind-ai-pulse 2.8s ease-in-out infinite; position: relative; }

        .grind-ai-greet { animation: grind-ai-rise 600ms ease-out both; }
        .grind-ai-sub { animation: grind-ai-rise 700ms ease-out 200ms both; opacity: 0; }
        .grind-ai-chips { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

        .grind-ai-suggest { background: #111111; border: 1px solid #2A2A2A; padding: 10px 20px; font-family: 'Space Grotesk', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #A0A0A0; cursor: pointer; transition: border-color 180ms, color 180ms, transform 180ms; animation: grind-ai-rise-sm 420ms ease-out both; opacity: 0; }
        .grind-ai-suggest:hover { border-color: rgba(255,255,255,0.5); color: #FFFFFF; transform: translateY(-2px); }
        .grind-ai-suggest:active { transform: scale(0.97); transition: transform 80ms; }

        .grind-ai-dot { width: 6px; height: 6px; background: #E8003D; display: inline-block; margin-right: 4px; animation: grind-ai-blink 1.2s infinite both; }
        .grind-ai-dot:nth-child(2) { animation-delay: 0.15s; }
        .grind-ai-dot:nth-child(3) { animation-delay: 0.3s; }

        .grind-ai-msg-user { animation: grind-ai-rise-sm 280ms ease-out both; }
        .grind-ai-msg-assist-line { animation: grind-ai-fade-line 380ms ease-out both; }

        .grind-ai-input-wrap { position: relative; flex: 1; }
        .grind-ai-input-underline { position: absolute; left: 0; bottom: 0; height: 1px; width: 100%; background: #E8003D; transform-origin: left center; transform: scaleX(0); transition: transform 300ms ease-out; pointer-events: none; }
        .grind-ai-input-underline.active { transform: scaleX(1); }

        .grind-ai-send { width: 48px; height: 48px; background: transparent; border: 1px solid #2A2A2A; color: #FFFFFF; font-size: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 180ms, border-color 180ms; }
        .grind-ai-send .grind-ai-arrow { display: inline-block; transition: transform 180ms; }
        .grind-ai-send:not(:disabled):hover { background: #FF2D55; border-color: #FF2D55; cursor: pointer; }
        .grind-ai-send:not(:disabled):hover .grind-ai-arrow { transform: translateX(2px); }
        .grind-ai-send:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="grind-ai-section" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {messages.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 24, padding: 24 }}>
          <div className="grind-ai-icon-wrap">
            <span className="grind-ai-icon-glow" aria-hidden />
            <span className="grind-ai-icon-pulse">
              <IconGrindAI stroke="#E8003D" size={48} />
            </span>
          </div>
          <h1 className="grind-ai-greet" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 4vw, 36px)", color: "#FFFFFF", letterSpacing: "0.05em", margin: 0, textAlign: "center" }}>
            {greeting}, {firstName}.
          </h1>
          <div className="grind-ai-sub" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#555555", letterSpacing: "0.15em" }}>
            O QUE VAMOS RESOLVER HOJE?
          </div>
          <div className="grind-ai-chips">
            {suggestions.map((s, idx) => (
              <button
                key={s}
                className="grind-ai-suggest"
                style={{ animationDelay: `${400 + idx * 100}ms` }}
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "24px 0" }}>
          {messages.map((m, i) => (
            m.role === "user" ? (
              <div key={i} className="grind-ai-msg-user" style={{ alignSelf: "flex-end", background: "#E8003D", padding: "12px 16px", maxWidth: "70%", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#FFFFFF", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.content}
              </div>
            ) : (
              <div key={i} style={{ alignSelf: "flex-start", background: "#111111", border: "1px solid #2A2A2A", padding: 16, maxWidth: "85%", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#A0A0A0", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {m.content.split("\n").map((line, li) => (
                  <div
                    key={li}
                    className="grind-ai-msg-assist-line"
                    style={{ animationDelay: `${li * 80}ms`, minHeight: line ? undefined : "1em" }}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
              </div>
            )
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", background: "#111111", border: "1px solid #2A2A2A", padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#A0A0A0" }}>
              <span className="grind-ai-dot" />
              <span className="grind-ai-dot" />
              <span className="grind-ai-dot" />
            </div>
          )}
          {error && (
            <div style={{ alignSelf: "flex-start", color: "#E8003D", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{error}</div>
          )}
        </div>
      )}
      </div>

      <div style={{ borderTop: "1px solid #2A2A2A", padding: "16px 0", display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div className="grind-ai-input-wrap">
          <textarea
            ref={textRef}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={onKeyDown}
            placeholder={placeholders[phIdx]}
            style={{ background: "#111111", border: "1px solid #2A2A2A", padding: "14px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "#FFFFFF", resize: "none", width: "100%", minHeight: 48, maxHeight: 160, outline: "none" }}
          />
          <span className={`grind-ai-input-underline${inputFocused ? " active" : ""}`} aria-hidden />
        </div>
        <button
          onClick={() => send(input)}
          disabled={!canSend}
          aria-label="Enviar"
          className="grind-ai-send"
        >
          <span className="grind-ai-arrow">↑</span>
        </button>
      </div>
    </div>
  );
}
