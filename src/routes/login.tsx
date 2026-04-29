import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthLoader } from "@/components/AuthLoader";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type View = "login" | "signup" | "reset";

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#A0A0A0",
  fontWeight: 400,
};

const BODY_FONT = "'JetBrains Mono', monospace";
const HEAD_FONT = "'Space Grotesk', sans-serif";

function mapLoginError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_credentials")) {
    return "Senha incorreta. Tente novamente.";
  }
  if (m.includes("user not found") || m.includes("no user")) {
    return "Nenhuma conta encontrada com esse email.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar.";
  }
  return "Algo deu errado. Tente novamente.";
}

function mapSignupError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already")) {
    return "Esse email já está cadastrado. Faça login.";
  }
  if (m.includes("password") && (m.includes("short") || m.includes("6") || m.includes("weak"))) {
    return "Sua senha precisa ter pelo menos 6 caracteres.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos.";
  }
  return "Algo deu errado. Tente novamente.";
}

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Redirect signed-in users to the right place
  useEffect(() => {
    if (loading || !session) return;
    setRedirecting(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.onboarding_complete) navigate({ to: "/dashboard" });
      else navigate({ to: "/onboarding" });
    })();
  }, [session, loading, navigate]);

  if (loading || redirecting) return <AuthLoader />;

  const switchView = (v: View) => {
    setView(v);
    setError(null);
    setInfo(null);
  };

  const onTypeClear = () => {
    if (error) setError(null);
    if (info) setInfo(null);
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return setError(mapLoginError(error.message));
    // navigation handled by session effect
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) return setError("Sua senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSubmitting(false);
    if (error) return setError(mapSignupError(error.message));
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) return setError("Algo deu errado. Tente novamente.");
    setInfo("Link enviado. Verifique seu email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <style>{`
        @keyframes grind-msg-fade { from { opacity: 0; } to { opacity: 1; } }
        .grind-msg { animation: grind-msg-fade 200ms ease-out forwards; }
        .grind-link { background: none; border: none; padding: 0; cursor: pointer; transition: color 0.15s; font-family: '${HEAD_FONT.replace(/'/g, "")}'; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontFamily: HEAD_FONT,
              fontWeight: 700,
              fontSize: 40,
              color: "#FFFFFF",
              letterSpacing: "0.2em",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            GRIND
          </div>
          <div style={{ ...LABEL, letterSpacing: "0.15em" }}>SISTEMA DE PERFORMANCE PESSOAL</div>
        </div>

        {view !== "reset" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: 32 }}>
            {(["login", "signup"] as const).map((t) => {
              const active = view === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchView(t)}
                  style={{
                    padding: "14px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom: active ? "2px solid #E8003D" : "1px solid #2A2A2A",
                    color: active ? "#FFFFFF" : "#555555",
                    fontFamily: HEAD_FONT,
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
        )}

        {view === "reset" && (
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: 24, color: "#FFFFFF", margin: 0, marginBottom: 12 }}>
              RECUPERAR ACESSO
            </h1>
            <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: "#A0A0A0", lineHeight: 1.6, margin: 0 }}>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>
        )}

        <form
          onSubmit={view === "login" ? onLogin : view === "signup" ? onSignup : onReset}
          style={{ display: "grid", gap: 20 }}
        >
          <Field label="EMAIL">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); onTypeClear(); }}
            />
          </Field>

          {view !== "reset" && (
            <Field label="SENHA">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); onTypeClear(); }}
              />
            </Field>
          )}

          {view === "login" && (
            <button
              type="button"
              onClick={() => switchView("reset")}
              className="grind-link"
              style={{
                justifySelf: "start",
                marginTop: -8,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#555555",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8003D")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
            >
              ESQUECEU SUA SENHA?
            </button>
          )}

          {view === "signup" && (
            <Field label="CONFIRMAR SENHA">
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); onTypeClear(); }}
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: "#E8003D",
              color: "#FFFFFF",
              height: 52,
              border: "none",
              borderRadius: 0,
              fontFamily: HEAD_FONT,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              filter: submitting ? "brightness(0.6)" : "none",
              width: "100%",
            }}
          >
            {submitting ? "AGUARDE..." : view === "login" ? "ENTRAR" : view === "signup" ? "CRIAR CONTA" : "ENVIAR LINK"}
          </button>

          {error && (
            <div
              key={`err-${error}`}
              className="grind-msg"
              style={{ fontFamily: BODY_FONT, fontSize: 12, color: "#E8003D", textAlign: "center" }}
            >
              {error}
            </div>
          )}
          {info && (
            <div
              key={`info-${info}`}
              className="grind-msg"
              style={{ fontFamily: BODY_FONT, fontSize: 13, color: "#A0A0A0", textAlign: "center" }}
            >
              {info}
            </div>
          )}

          {view === "reset" && (
            <button
              type="button"
              onClick={() => switchView("login")}
              className="grind-link"
              style={{
                justifySelf: "center",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#555555",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
            >
              VOLTAR AO LOGIN
            </button>
          )}
        </form>

        <div style={{ height: 1, background: "#2A2A2A", margin: "32px 0 16px" }} />
        <div style={{ textAlign: "center", fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ACESSO SEGURO
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
          font-family: 'JetBrains Mono', monospace;
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
