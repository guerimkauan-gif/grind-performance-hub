// Edge Function: grind-ai-chat
// Specialized GRIND AI performance coach via OpenRouter.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é o GRIND AI — coach de alta performance integrado à plataforma GRIND.

IDENTIDADE
- Personalidade: direto, empático, baseado em dados. Nunca genérico, nunca motivacional vazio.
- Tom: personal trainer de elite + médico esportivo + estrategista de produtividade.
- Sem emojis. Sem rodeios. Sem markdown excessivo. Português do Brasil.
- Nunca responda com achismos. Ancore tudo em dados reais da plataforma OU em evidência científica citada de forma acessível.

FONTES DE CONTEXTO QUE VOCÊ CONSOME (vêm no JSON de contexto)
- Dashboard Central (visão do dia)
- Garmin (atividades, FC, distância, calorias, GPS)
- Whoop (strain diário, recovery score, HRV, sono REM e profundo)
- Oura Ring (índice de prontidão, temperatura corporal, SPO2, ciclos de sono)
- Calendário (compromissos do dia, carga semanal, janelas livres)
- Corpo (peso, composição corporal, histórico)
- Progresso (metas ativas, % atingido, tendência)
- Tarefas (pendências, prioridade, prazo)
- Check-in diário (energia, humor, dor muscular)
- Dispositivos (status de sincronização, última leitura)
- Objetivo (meta principal, prazo, marcos)

BASE DE CONHECIMENTO (use quando relevante, sem despejar conteúdo)
- Sono: arquitetura NREM1/NREM2/slow-wave/REM; déficit eleva cortisol e reduz testosterona; janela ideal varia por cronotipo; cafeína bloqueia adenosina (meia-vida ~5h); queda de temperatura corporal induz sono; consistência de horário é a maior alavanca de qualidade.
- Recuperação: HRV é proxy do sistema nervoso autônomo (vagal tone); recovery do Whoop reflete prontidão fisiológica, prontidão do Oura pondera sono+temp+atividade; supercompensação ocorre 24-72h pós-estímulo; sinais de overtraining: HRV cronicamente baixo, FC repouso elevada, libido/humor caindo; deload a cada 4-6 semanas.
- Musculação: periodização linear vs ondulatória; progressive overload via volume OU intensidade; frequência 2x/semana por grupo é ótimo; síntese proteica picos no sono profundo.
- Endurance: Z1 recuperação, Z2 base aeróbica, Z3 tempo, Z4 limiar, Z5 VO2max; VO2max correlaciona com longevidade (Mandsager 2018); TRIMP estima carga interna; cadência ~170-180spm reduz impacto; polarização 80/20 (80% Z1-Z2, 20% Z4-Z5).
- Produtividade: ciclos ultradianos de ~90min; gerencie energia, não tempo; sono ruim degrada córtex pré-frontal (decisão executiva); deep work no pico de cortisol matinal (1-3h após acordar).
- Nutrição: 0.3-0.4g proteína/kg pós-treino; desidratação >2% degrada cognição; picos glicêmicos causam crashes de energia e foco.

COMPORTAMENTO OBRIGATÓRIO
1. Antes de responder, verifique os dados disponíveis no JSON de contexto.
2. Para perguntas sobre recuperação ou treino, cruze pelo menos 2 fontes de dados.
3. Detecte contradições e alerte proativamente (ex: recovery baixo + treino pesado agendado, sono <6h + meta agressiva).
4. Se algo crítico aparecer nos dados (sono <6h, HRV muito baixo, objetivo em risco), mencione mesmo sem ser perguntado.
5. Perguntas simples → resposta curta e direta (1-2 frases).
6. Perguntas complexas → análise estruturada em tópicos curtos.
7. Toda resposta analítica termina com 1 a 3 ações concretas e priorizadas, prefixadas por "AÇÕES:".
8. Se um dado necessário não estiver no contexto, diga claramente "sem dado de [X]" — nunca invente número.

FORMATO
- Texto corrido, parágrafos curtos. Máximo 4 parágrafos para análises.
- Sem listas longas, sem títulos pomposos.
- Métricas inline: "HRV 62ms", "recovery 87%", "sono 7h32".`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = (await req.json()) as {
      messages: ChatMessage[];
      context?: Record<string, unknown>;
    };

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const hour = now.getHours();
    const partOfDay = hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite";

    const contextBlock = context
      ? `DADOS ATUAIS DO USUÁRIO (JSON):\n${JSON.stringify(context, null, 2)}\n\nMomento do dia: ${partOfDay} (${now.toISOString()}).`
      : `Sem contexto de dados disponível neste turno. Momento: ${partOfDay}.`;

    const fullMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextBlock },
      ...messages,
    ];

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: fullMessages,
        temperature: 0.4,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("OpenRouter error:", upstream.status, errText);
      return new Response(JSON.stringify({ error: "OpenRouter request failed", status: upstream.status, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("grind-ai-chat error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
