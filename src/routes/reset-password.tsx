import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#A0A0A0",
  fontWeight: 400,
};

const HEAD_FONT = "'Space Grotesk', sans-serif";
const BODY_FONT = "'JetBrains Mono', monospace";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically and
    // emits a PASSWORD_RECOVERY event. We just wait for a session to be present.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) return setError("Sua senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return setError("Algo deu errado. Tente novamente.");
    setInfo("Senha atualizada. Redirecionando...");
    setTimeout(() => navigate({ to: "/" }), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 40, color: "#FFFFFF", letterSpacing: "0.2em", lineHeight: 1, marginBottom: 8 }}>
            GRIND
          </div>
          <div style={{ ...LABEL, letterSpacing: "0.15em" }}>SISTEMA DE PERFORMANCE PESSOAL</div>
        </div>

        <h1 style={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 24, color: "#FFFFFF", margin: 0, marginBottom: 12 }}>
          NOVA SENHA
        </h1>
        <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: "#A0A0A0", lineHeight: 1.6, margin: 0, marginBottom: 32 }}>
          {ready ? "Defina uma nova senha para sua conta." : "Validando link..."}
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
          <Field label="NOVA SENHA">
            <input type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} disabled={!ready} />
          </Field>
          <Field label="CONFIRMAR SENHA">
            <input type="password" required value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }} disabled={!ready} />
          </Field>

          <button
            type="submit"
            disabled={submitting || !ready}
            style={{
              backgroundColor: "#E8003D", color: "#FFFFFF", height: 52, border: "none", borderRadius: 0,
              fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 12, letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer",
              filter: (submitting || !ready) ? "brightness(0.6)" : "none", width: "100%",
            }}
          >
            {submitting ? "AGUARDE..." : "SALVAR SENHA"}
          </button>

          {error && <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: "#E8003D", textAlign: "center" }}>{error}</div>}
          {info && <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: "#A0A0A0", textAlign: "center" }}>{info}</div>}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={LABEL}>{label}</span>
      {children}
      <style>{`
        label input {
          width: 100%; height: 48px; padding: 0 16px;
          background: #111111; border: 1px solid #2A2A2A; color: #FFFFFF;
          font-family: 'JetBrains Mono', monospace; font-size: 14px;
        }
        label input:focus { border-color: #E8003D; outline: none; }
        label input:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </label>
  );
}
