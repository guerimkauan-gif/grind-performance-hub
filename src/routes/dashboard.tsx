import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { GrindLogo } from "@/components/GrindLogo";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <header style={{ borderBottom: "1px solid #2A2A2A", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <GrindLogo height={36} />
        <button onClick={logout} className="label-uppercase" style={{ background: "transparent", border: "1px solid #2A2A2A", padding: "10px 18px", color: "#FFFFFF", cursor: "pointer" }}>
          SAIR
        </button>
      </header>
      <main style={{ padding: 64, textAlign: "center" }}>
        <div className="label-uppercase" style={{ fontSize: 13 }}>DASHBOARD EM CONSTRUÇÃO</div>
      </main>
    </div>
  );
}
