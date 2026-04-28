import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";


export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Tab = "login" | "signup";

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#A0A0A0",
  fontWeight: 400,
};

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return setError(error.message);
    navigate({ to: "/dashboard" });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("As senhas não coincidem.");
    if (password.length < 6) return setError("A senha precisa de ao menos 6 caracteres.");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSubmitting(false);
    if (error) return setError(error.message);
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 40,
              color: "#FFFFFF",
              letterSpacing: "0.2em",
              lineHeight: 1,
              marginBottom: 8,
              fontFeatureSettings: "normal",
              fontVariant: "normal",
            }}
          >
            GRIND
          </div>
          <div style={{ ...LABEL, letterSpacing: "0.15em" }}>SISTEMA DE PERFORMANCE PESSOAL</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: 32 }}>
          {(["login", "signup"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                style={{
                  padding: "14px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #E8003D" : "1px solid #2A2A2A",
                  color: active ? "#FFFFFF" : "#555555",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {t === "login" ? "LOGIN" : "CADASTRO"}
              </button>
            );
          })}
        </div>

        <form onSubmit={tab === "login" ? onLogin : onSignup} style={{ display: "grid", gap: 20 }}>
          <Field label="EMAIL">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="SENHA">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {tab === "signup" && (
            <Field label="CONFIRMAR SENHA">
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          )}
          {error && <div style={{ color: "#E8003D", fontSize: 13 }}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{
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
              cursor: submitting ? "not-allowed" : "pointer",
              filter: submitting ? "brightness(0.6)" : "none",
              width: "100%",
            }}
          >
            {submitting ? "..." : tab === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </button>
        </form>

        <div style={{ height: 1, background: "#2A2A2A", margin: "32px 0 16px" }} />
        <div style={{ textAlign: "center", fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ACESSO SEGURO VIA SUPABASE
        </div>
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
          width: 100%;
          height: 48px;
          padding: 0 16px;
          background: #111111;
          border: 1px solid #2A2A2A;
          color: #FFFFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
        }
        label input:focus {
          border-color: #E8003D;
          outline: none;
        }
      `}</style>
    </label>
  );
}
