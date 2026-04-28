import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GrindLogo } from "@/components/GrindLogo";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "#A0A0A0",
  fontWeight: 400,
};

const INPUT_LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#A0A0A0",
  fontWeight: 400,
};

const HEADLINE: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 40,
  lineHeight: 1.1,
  color: "#FFFFFF",
  marginBottom: 8,
};

const BODY: React.CSSProperties = {
  fontSize: 15,
  color: "#A0A0A0",
  lineHeight: 1.6,
  marginBottom: 32,
};

const PRIMARY_BTN: React.CSSProperties = {
  backgroundColor: "#E8003D",
  color: "#FFFFFF",
  height: 52,
  border: "none",
  borderRadius: 0,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
  width: "100%",
};

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...LABEL, marginBottom: 16 }}>
      <span style={{ color: "#E8003D", marginRight: 8 }}>●</span>
      {children}
    </div>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [dream, setDream] = useState("");
  const [hours, setHours] = useState("");
  const [days, setDays] = useState("");
  const [deadline, setDeadline] = useState("");
  const [whoopMsg, setWhoopMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [session, loading, navigate]);

  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("onboarding_complete").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      if (data?.onboarding_complete) navigate({ to: "/dashboard" });
    });
  }, [session, navigate]);

  const finish = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        dream,
        daily_hours: parseFloat(hours),
        days_per_week: parseInt(days, 10),
        deadline,
        onboarding_complete: true,
      })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) return setError(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ height: 56, borderBottom: "1px solid #2A2A2A", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <GrindLogo size={22} letterSpacing="0.15em" />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#A0A0A0", letterSpacing: "0.05em" }}>
          PASSO {step} DE 4
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 2, background: "#1A1A1A", width: "100%" }}>
        <div style={{ height: "100%", background: "#E8003D", width: `${(step / 4) * 100}%`, transition: "width 0.3s ease" }} />
      </div>

      {/* Content */}
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
        {step === 1 && (
          <div>
            <StepLabel>O SEU SONHO</StepLabel>
            <h1 style={HEADLINE}>Qual é o seu sonho?</h1>
            <p style={BODY}>Escreva sem filtro. O que você quer alcançar? Seja específico.</p>

            <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
              <span style={INPUT_LABEL}>SEU OBJETIVO</span>
              <textarea
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="Quero construir uma empresa do zero — um produto real, com clientes reais, que resolva um problema que eu conheço por dentro."
                style={{
                  minHeight: 140,
                  padding: 16,
                  background: "#111111",
                  border: "1px solid #2A2A2A",
                  color: "#FFFFFF",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 15,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button style={{ ...PRIMARY_BTN, filter: dream.trim().length < 10 ? "brightness(0.5)" : "none" }} disabled={dream.trim().length < 10} onClick={() => setStep(2)}>
              CONTINUAR
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <StepLabel>O SEU PLANO</StepLabel>
            <h1 style={HEADLINE}>Agora vamos montar seu plano.</h1>
            <p style={BODY}>Seja realista. Consistência bate intensidade.</p>

            <div style={{ display: "grid", gap: 20, marginBottom: 32 }}>
              <FormField label="QUANTAS HORAS POR DIA VOCÊ PODE DEDICAR?">
                <input type="number" value={hours} min={0.5} max={16} step={0.5} onChange={(e) => setHours(e.target.value)} style={inputStyle("mono")} />
              </FormField>
              <FormField label="QUANTOS DIAS POR SEMANA?">
                <input type="number" value={days} min={1} max={7} step={1} onChange={(e) => setDays(e.target.value)} style={inputStyle("mono")} />
              </FormField>
              <FormField label="QUAL É A SUA DATA LIMITE?">
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={inputStyle("mono")}
                />
                {deadline && (parseInt(deadline.split('-')[0], 10) < 2025 || new Date(deadline) < new Date(new Date().toDateString())) && (
                  <span style={{ fontSize: 12, color: "#E8003D", marginTop: 4 }}>
                    Data inválida — escolha uma data futura
                  </span>
                )}
              </FormField>
            </div>

            {(() => {
              const deadlineInvalid = !deadline || parseInt(deadline.split('-')[0], 10) < 2025 || new Date(deadline) < new Date(new Date().toDateString());
              const disabled = !hours || !days || deadlineInvalid;
              return (
                <button style={{ ...PRIMARY_BTN, filter: disabled ? "brightness(0.5)" : "none" }} disabled={disabled} onClick={() => setStep(3)}>
                  CONTINUAR
                </button>
              );
            })()}
          </div>
        )}

        {step === 3 && (
          <div>
            <StepLabel>CONECTAR WHOOP</StepLabel>
            <h1 style={HEADLINE}>Conecte sua pulseira.</h1>
            <p style={BODY}>O GRIND usa seus dados do Whoop para personalizar seu plano diário. Sem Whoop, o sistema não consegue ler seu corpo.</p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, background: "#111111", border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8003D", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24 }}>
                W
              </div>
            </div>

            <button style={PRIMARY_BTN} onClick={() => setWhoopMsg("Integração com Whoop será ativada em breve.")}>
              CONECTAR MEU WHOOP
            </button>
            {whoopMsg && <div style={{ color: "#A0A0A0", fontSize: 13, textAlign: "center", marginTop: 16 }}>{whoopMsg}</div>}

            <div style={{ height: 1, background: "#2A2A2A", margin: "24px 0" }} />
            <button
              onClick={() => setStep(4)}
              style={{ background: "transparent", border: "none", color: "#555555", fontSize: 12, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em", width: "100%", textAlign: "center", padding: 8 }}
            >
              PULAR POR AGORA
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <StepLabel>CONFIRMAÇÃO</StepLabel>
            <h1 style={HEADLINE}>Seu sistema está pronto.</h1>
            <p style={BODY}>Objetivo registrado. Revise seu compromisso abaixo.</p>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 80, color: "#E8003D", letterSpacing: "0.2em", lineHeight: 1 }}>
                GRIND
              </div>
            </div>

            <div style={{ background: "#111111", border: "1px solid #2A2A2A", padding: "20px 24px", marginBottom: 32 }}>
              <SummaryRow label="HORAS / DIA" value={hours || "—"} />
              <SummaryRow label="DIAS / SEMANA" value={days || "—"} />
              <SummaryRow label="DATA LIMITE" value={deadline || "—"} />
            </div>

            {error && <div style={{ color: "#E8003D", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button style={{ ...PRIMARY_BTN, filter: saving ? "brightness(0.6)" : "none" }} onClick={finish} disabled={saving}>
              {saving ? "..." : "IR PARA O DASHBOARD"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2A2A2A", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
      <span style={{ color: "#A0A0A0", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ color: "#FFFFFF" }}>{value}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={INPUT_LABEL}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle(variant: "text" | "mono"): React.CSSProperties {
  return {
    width: "100%",
    height: 52,
    padding: "0 16px",
    background: "#111111",
    border: "1px solid #2A2A2A",
    color: "#FFFFFF",
    fontFamily: variant === "mono" ? "'JetBrains Mono', monospace" : "'Space Grotesk', sans-serif",
    fontSize: variant === "mono" ? 16 : 14,
  };
}
