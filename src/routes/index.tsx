import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
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

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0A0A0A" }}>
      <p className="label-uppercase">CARREGANDO</p>
    </div>
  );
}
