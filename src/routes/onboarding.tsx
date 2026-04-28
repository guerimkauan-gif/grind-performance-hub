import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

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
    <div className="min-h-screen px-4 py-12" style={{ background: "#0A0A0A" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="flex items-center justify-between mb-10">
          <div className="grind-logo" style={{ fontSize: 22 }}>GRIND</div>
          <div className="label-uppercase">PASSO {step} DE 4</div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ flex: 1, height: 2, background: n <= step ? "#E8003D" : "#2A2A2A" }} />
          ))}
        </div>

        <div className="grind-card">
          {step === 1 && (
            <div style={{ display: "grid", gap: 20 }}>
              <div className="label-uppercase">O SEU SONHO</div>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>Qual é o seu sonho?</h1>
              <p style={{ color: "#A0A0A0", fontSize: 14 }}>
                Escreva sem filtro. O que você quer alcançar? Seja específico.
              </p>
              <textarea
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="Quero passar na FUVEST e estudar Medicina na USP até novembro deste ano."
                style={{ minHeight: 140, padding: 14, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, resize: "vertical" }}
              />
              <button
                className="btn-primary"
                disabled={dream.trim().length < 10}
                onClick={() => setStep(2)}
              >
                CONTINUAR
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gap: 20 }}>
              <div className="label-uppercase">O SEU PLANO</div>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>Agora vamos montar seu plano.</h1>
              <p style={{ color: "#A0A0A0", fontSize: 14 }}>Seja realista. Consistência bate intensidade.</p>

              <NumField label="QUANTAS HORAS POR DIA VOCÊ PODE DEDICAR?" value={hours} onChange={setHours} min={0.5} max={16} step={0.5} />
              <NumField label="QUANTOS DIAS POR SEMANA?" value={days} onChange={setDays} min={1} max={7} step={1} />

              <label style={{ display: "grid", gap: 8 }}>
                <span className="label-uppercase">QUAL É A SUA DATA LIMITE?</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ padding: 12, fontFamily: "'JetBrains Mono', monospace" }} />
              </label>

              <button
                className="btn-primary"
                disabled={!hours || !days || !deadline}
                onClick={() => setStep(3)}
              >
                CONTINUAR
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gap: 20 }}>
              <div className="label-uppercase">CONECTAR WHOOP</div>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>Conecte sua pulseira.</h1>
              <p style={{ color: "#A0A0A0", fontSize: 14 }}>
                O GRIND usa seus dados do Whoop para personalizar seu plano diário. Sem Whoop, o sistema não consegue ler seu corpo.
              </p>
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                <div style={{ width: 72, height: 72, border: "1px solid #2A2A2A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 32, color: "#E8003D" }}>
                  W
                </div>
              </div>
              <button className="btn-primary" onClick={() => setWhoopMsg("Integração com Whoop será ativada em breve.")}>
                CONECTAR MEU WHOOP
              </button>
              {whoopMsg && <div style={{ color: "#A0A0A0", fontSize: 13, textAlign: "center" }}>{whoopMsg}</div>}
              <button
                onClick={() => setStep(4)}
                style={{ background: "transparent", border: "none", color: "#A0A0A0", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                Pular por agora
              </button>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "grid", gap: 20 }}>
              <div className="label-uppercase">CONFIRMAÇÃO</div>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>Seu sistema está pronto.</h1>
              <p style={{ color: "#A0A0A0", fontSize: 14 }}>
                Objetivo registrado. Você se comprometeu com{" "}
                <span className="font-mono-metric">{hours}</span> horas por dia,{" "}
                <span className="font-mono-metric">{days}</span> dias por semana, até{" "}
                <span className="font-mono-metric">{deadline}</span>.
              </p>
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="grind-logo" style={{ fontSize: 64 }}>GRIND</div>
              </div>
              {error && <div style={{ color: "#E8003D", fontSize: 13 }}>{error}</div>}
              <button className="btn-primary" onClick={finish} disabled={saving}>
                {saving ? "..." : "IR PARA O DASHBOARD"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, min, max, step }: { label: string; value: string; onChange: (v: string) => void; min: number; max: number; step: number }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span className="label-uppercase">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 18 }}
      />
    </label>
  );
}
