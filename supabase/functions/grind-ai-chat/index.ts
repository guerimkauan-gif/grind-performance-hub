// Edge Function: grind-ai-chat
// Proxies chat completions to OpenRouter using OPENROUTER_API_KEY secret.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT =
  "Você é o GRIND AI, assistente de performance pessoal integrado à plataforma GRIND. Você tem acesso aos dados do usuário: métricas corporais (Recovery, HRV, Sono, Strain), progresso em relação ao objetivo, tarefas pendentes, check-ins anteriores, calendário e prazo final. Responda de forma direta, objetiva e sem rodeios. Sem emojis. Sem motivação genérica. Baseie cada resposta nos dados reais fornecidos no contexto. Use linguagem técnica mas acessível. Formato das respostas: texto corrido sem markdown excessivo, máximo 4 parágrafos curtos.";

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

    const fullMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(context
        ? [{ role: "system" as const, content: `Dados do usuário (JSON): ${JSON.stringify(context)}` }]
        : []),
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
