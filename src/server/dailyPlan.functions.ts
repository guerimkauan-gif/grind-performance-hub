import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PLACEHOLDER = { recovery_score: 75, hrv: 58, sleep_hours: 7.5, strain: 10.5 };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDeadline(d: string | null): string {
  if (!d) return "—";
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function daysUntil(d: string | null): number {
  if (!d) return 0;
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function buildUserPrompt(profile: any, history: any[]): string {
  const r = PLACEHOLDER.recovery_score;
  const recoveryNote = r < 33 ? "crítico" : r <= 66 ? "moderado" : "ótimo";
  const sleepNote =
    PLACEHOLDER.sleep_hours < 6 ? "crítico" :
    PLACEHOLDER.sleep_hours < 7 ? "insuficiente" :
    PLACEHOLDER.sleep_hours <= 8 ? "adequado" : "ótimo";
  const strainNote =
    PLACEHOLDER.strain > 15 ? "recuperação" :
    PLACEHOLDER.strain >= 8 ? "equilíbrio" : "descansado";
  const hrvNote = PLACEHOLDER.hrv >= 55 ? "alto=foco profundo" : "baixo=tarefas mecânicas";

  const completed = history.filter((h) => (h.adherence_score ?? 0) > 0).length;
  const avg = history.length
    ? Math.round(history.reduce((a, h) => a + (h.adherence_score ?? 0), 0) / history.length)
    : 0;

  return `USUÁRIO: ${profile.goal_name ?? "—"}
OBJETIVO: ${profile.dream ?? "—"}
PLANO: ${profile.daily_hours ?? 0}h por dia, ${profile.days_per_week ?? 0} dias por semana
PRAZO: ${formatDeadline(profile.deadline)}
DIAS RESTANTES: ${daysUntil(profile.deadline)}

DADOS DO CORPO HOJE:
- Recovery: ${PLACEHOLDER.recovery_score}% — ${recoveryNote}
- HRV: ${PLACEHOLDER.hrv}ms — ${hrvNote}
- Sono: ${PLACEHOLDER.sleep_hours}h — ${sleepNote}
- Strain ontem: ${PLACEHOLDER.strain} — ${strainNote}

HISTÓRICO RECENTE (últimos 7 dias):
- Dias cumpridos: ${completed}
- Score médio: ${avg}

REGRAS DE INTERPRETAÇÃO:
- Recovery <33%: recomendar apenas revisão leve, sem conteúdo novo, dormir cedo
- Recovery 34-66%: ritmo normal, pausas a cada 90min, prioridades importantes mas não as mais difíceis
- Recovery 67-100%: sinal verde para máximo esforço cognitivo, conteúdo difícil, sessões longas
- HRV alto: sessões longas de foco, aprendizado novo, criatividade
- HRV baixo: tarefas mecânicas, revisão, organização
- Sono <6h: reduzir carga 40%, alerta crítico
- Sono 6-7h: cafeína estratégica manhã, evitar estudo após 21h
- Sono 7-8h: ritmo normal
- Sono >8h com qualidade: dia de alta performance
- Strain >15: corpo em recuperação, reduzir carga
- Strain 8-14: equilíbrio saudável
- Strain <8: pode aumentar carga

Gere o plano do dia no seguinte formato JSON exato:
{
  "context": "frase de 1-2 linhas sobre o estado do corpo hoje, tom direto",
  "priorities": [
    {"number": "01", "task": "descrição da prioridade", "category": "CATEGORIA"},
    {"number": "02", "task": "descrição da prioridade", "category": "CATEGORIA"},
    {"number": "03", "task": "descrição da prioridade", "category": "CATEGORIA"}
  ],
  "projection": "frase curta sobre o ritmo atual vs prazo",
  "adherence_score": número de 0 a 100 representando aderência ao plano
}

Responda APENAS com o JSON. Sem texto adicional.`;
}

export const getOrGenerateDailyPlan = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { ok: false, error: "Supabase env vars missing" };
    }
    if (!ANTHROPIC_API_KEY) {
      return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });

    const claims = await supabase.auth.getClaims(data.accessToken);
    const userId = claims.data?.claims?.sub;
    if (!userId) return { ok: false, error: "Unauthorized" };

    const today = todayISO();

    const existing = await supabase
      .from("daily_logs")
      .select("ai_plan")
      .eq("user_id", userId)
      .eq("log_date", today)
      .maybeSingle();

    if (existing.data?.ai_plan) {
      return { ok: true, plan: existing.data.ai_plan, cached: true };
    }

    const [{ data: profile }, { data: history }] = await Promise.all([
      supabase
        .from("profiles")
        .select("dream,goal_name,daily_hours,days_per_week,deadline,created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select("adherence_score,tasks_completed,log_date")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(7),
    ]);

    if (!profile) return { ok: false, error: "Profile not found" };

    console.log("API key exists:", !!ANTHROPIC_API_KEY);
    console.log("API key starts with:", ANTHROPIC_API_KEY?.substring(0, 15));

    // TEMP DIAGNOSTIC: minimal Claude call
    let aiText: string;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          messages: [{ role: "user", content: "Responda apenas: FUNCIONOU" }],
        }),
      });

      const responseText = await response.text();
      console.log("Claude API status:", response.status);
      console.log("Claude API response:", responseText);

      if (!response.ok) {
        return {
          ok: false,
          error: `Claude API error: ${response.status} - ${responseText}`,
        };
      }

      const json = JSON.parse(responseText);
      aiText = json?.content?.[0]?.text ?? "";
      // Return raw diagnostic result immediately so the dashboard shows it
      return {
        ok: false,
        error: `DIAGNOSTIC OK (${response.status}): ${aiText}`,
      };
    } catch (err: any) {
      console.error("Claude API request failed", err);
      return { ok: false, error: `Claude request threw: ${err?.message ?? String(err)}` };
    }

    let parsed: any;
    try {
      const cleaned = aiText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse Claude response", err, aiText);
      return { ok: false, error: "Invalid AI response" };
    }

    const adherence = typeof parsed.adherence_score === "number" ? parsed.adherence_score : 0;

    const { error: upsertError } = await supabase.from("daily_logs").upsert(
      {
        user_id: userId,
        log_date: today,
        recovery_score: PLACEHOLDER.recovery_score,
        hrv: PLACEHOLDER.hrv,
        sleep_hours: PLACEHOLDER.sleep_hours,
        strain: PLACEHOLDER.strain,
        ai_plan: JSON.stringify(parsed),
        adherence_score: adherence,
      },
      { onConflict: "user_id,log_date" }
    );

    if (upsertError) {
      console.error("Failed to save daily_log", upsertError);
    }

    return { ok: true, plan: JSON.stringify(parsed), cached: false };
  });
