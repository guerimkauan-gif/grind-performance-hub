import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PLACEHOLDER = { recovery_score: 75, hrv: 58, sleep_hours: 7.5, strain: 10.5, stress_score: 1.8, steps: 4832 };

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

function buildUserPrompt(_profile: any, _history: any[]): string {
  return `DADOS DO CORPO HOJE:
- Recovery: ${PLACEHOLDER.recovery_score}%
- HRV: ${PLACEHOLDER.hrv}ms
- Sono: ${PLACEHOLDER.sleep_hours}h
- Strain ontem: ${PLACEHOLDER.strain}
- Stress: ${PLACEHOLDER.stress_score} (scale 0-3, where 0 = no stress, 3 = high stress)
- Steps: ${PLACEHOLDER.steps} passos (meta diária: 10000)

REGRAS DE INTERPRETAÇÃO:

Recovery 0-33%: sistema nervoso sobrecarregado, dificuldade severa de foco, risco de burnout se forçar
Recovery 34-66%: capacidade reduzida, foco possível mas limitado, pausas frequentes necessárias
Recovery 67-100%: corpo bem recuperado, janela favorável para trabalho cognitivo intenso

HRV alto (acima da média pessoal): mente apta para criatividade, aprendizado novo, decisões complexas
HRV baixo (abaixo da média pessoal): prefira tarefas mecânicas, revisão, organização — evite criar ou decidir

Sono menos de 6h: déficit severo, cafeína estratégica pela manhã, evitar trabalho importante após 15h
Sono 6-7h: sono insuficiente, rendimento reduzido em 20-30%, cafeína com moderação
Sono 7-8h: sono adequado, ritmo normal
Sono acima de 8h com qualidade: condição de alta performance

Strain acima de 15: corpo ainda se recuperando do esforço físico anterior
Strain 8-14: equilíbrio saudável
Strain abaixo de 8: corpo descansado fisicamente

Stress 0-1: baixo, condições ideais para foco prolongado e tarefas cognitivas exigentes
Stress 1-2: moderado, monitore a energia, alterne foco com pausas curtas
Stress 2-3: elevado, prefira tarefas cognitivas mais leves e inclua pausas ativas frequentes
Stress acima de 3: alto, priorize recuperação, evite carga cognitiva pesada e faça pausas ativas

Steps abaixo de 3000: sedentário, movimento melhora a cognição
Steps 3000-6000: leve, dentro do mínimo recomendado
Steps 6000-9000: ativo, bom suporte para performance cognitiva
Steps acima de 9000: muito ativo, ótimo para recuperação

Ao gerar a recommendation, considere o nível de stress e o número de passos: stress alto deve sugerir tarefas cognitivas mais leves e pausas ativas; stress baixo favorece blocos de foco profundo; poucos passos (abaixo de 6000) deve sugerir uma caminhada leve antes ou entre blocos de foco para melhorar a cognição.

Gere a resposta no seguinte formato JSON exato:

{
  "context": "Uma frase direta sobre o estado geral do corpo hoje. Máximo 2 linhas. Sem drama, sem motivação forçada.",
  "observations": [
    {"number": "01", "metric": "RECOVERY", "insight": "o que esse número significa para o dia — consequências práticas, não tarefas"},
    {"number": "02", "metric": "SONO", "insight": "o que esse número significa — inclua dica prática se relevante (ex: cafeína, horário de pausa)"},
    {"number": "03", "metric": "HRV", "insight": "o que esse número significa para capacidade cognitiva hoje"}
  ],
  "recommendation": "Uma frase curta e prática. O que faz sentido priorizar ou evitar hoje dado o estado do corpo. Sem mencionar tarefas específicas.",
  "adherence_score": número de 0 a 100 baseado apenas em: sono adequado (+34), recovery acima de 66% (+33), strain equilibrado (+33)
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

    let aiText: string;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 800,
          system:
            "Você é o sistema de IA do GRIND — um app de performance pessoal que conecta dados biométricos ao objetivo de vida do usuário. Seu tom é direto, informativo e sem exageros. Você não prescreve tarefas — você informa o usuário sobre o estado do próprio corpo e o que isso significa para o dia.",
          messages: [{ role: "user", content: buildUserPrompt(profile, history ?? []) }],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("Claude API error", res.status, body);
        return { ok: false, error: `Claude API error ${res.status}: ${body}` };
      }

      const json = await res.json();
      aiText = json?.content?.[0]?.text ?? "";
    } catch (err: any) {
      console.error("Claude API request failed", err);
      return { ok: false, error: `Claude request failed: ${err?.message ?? String(err)}` };
    }

    let parsed: any;
    try {
      const cleaned = aiText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse Claude response", err, aiText);
      return { ok: false, error: "Invalid AI response" };
    }

    // Adherence: clamp to 0-100 integer; default 75 if missing/invalid
    let adherence = 75;
    const rawAdh = parsed.adherence_score;
    if (typeof rawAdh === "number" && Number.isFinite(rawAdh)) {
      adherence = Math.max(0, Math.min(100, Math.round(rawAdh)));
    }
    parsed.adherence_score = adherence;

    // Ensure observations is an array of 3 items (defensive)
    if (!Array.isArray(parsed.observations)) {
      parsed.observations = [];
    }
    if (typeof parsed.recommendation !== "string") {
      parsed.recommendation = "";
    }
    if (typeof parsed.context !== "string") {
      parsed.context = "";
    }

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
