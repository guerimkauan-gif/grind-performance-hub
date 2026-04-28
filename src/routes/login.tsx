import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Tab = "login" | "signup";

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
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="text-center mb-10">
          <div style={{ display: 'flex', justifyContent: 'center' }}><GrindLogo height={48} /></div>
          <div className="label-uppercase mt-2" style={{ letterSpacing: "0.15em" }}>
            SISTEMA DE PERFORMANCE PESSOAL
          </div>
        </div>

        <div className="grind-card" style={{ padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button
              onClick={() => { setTab("login"); setError(null); }}
              className="label-uppercase"
              style={{
                padding: "16px 0",
                background: tab === "login" ? "#1A1A1A" : "transparent",
                color: tab === "login" ? "#FFFFFF" : "#A0A0A0",
                borderBottom: tab === "login" ? "2px solid #E8003D" : "1px solid #2A2A2A",
                cursor: "pointer",
              }}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className="label-uppercase"
              style={{
                padding: "16px 0",
                background: tab === "signup" ? "#1A1A1A" : "transparent",
                color: tab === "signup" ? "#FFFFFF" : "#A0A0A0",
                borderBottom: tab === "signup" ? "2px solid #E8003D" : "1px solid #2A2A2A",
                cursor: "pointer",
              }}
            >
              CADASTRO
            </button>
          </div>

          <form onSubmit={tab === "login" ? onLogin : onSignup} style={{ padding: 24, display: "grid", gap: 20 }}>
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
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "..." : tab === "login" ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span className="label-uppercase">{label}</span>
      <div style={{ display: "grid" }}>
        {children}
      </div>
      <style>{`label input { width: 100%; padding: 12px 14px; font-family: 'Space Grotesk', sans-serif; font-size: 15px; }`}</style>
    </label>
  );
}
