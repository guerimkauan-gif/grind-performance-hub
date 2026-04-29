import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

type YesterdaySummary = {
  completed: number;
  total: number;
  hasData: boolean;
};

const STYLES = `
@keyframes dc-strike { from { width: 0%; } to { width: 100%; } }
@keyframes dc-fade-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-8px); } }
@keyframes dc-fade-in { from { opacity: 0; } to { opacity: 1; } }
.dc-task { transition: background 150ms; animation: dc-fade-in 200ms ease-out; }
.dc-task.removing { animation: dc-fade-out 200ms ease-out forwards; }
.dc-task .dc-trash { opacity: 0; transition: opacity 150ms, color 150ms; }
.dc-task:hover .dc-trash { opacity: 1; }
.dc-trash:hover { color: #E8003D !important; }
.dc-checkbox { transition: background 150ms, border-color 150ms; }
.dc-strike-wrap { position: relative; display: inline-block; }
.dc-strike-wrap::after {
  content: ""; position: absolute; left: 0; top: 50%; height: 1px; background: currentColor;
  width: 0%;
}
.dc-strike-wrap.on::after { animation: dc-strike 200ms ease-out forwards; width: 100%; }
.dc-input:focus { border-color: #E8003D !important; outline: none; }
.dc-add-btn:hover { background: #FF1A4D; }
.dc-progress-bar { transition: width 300ms ease-out; }
.dc-task-row { transition: transform 300ms ease; }
`;

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function DailyChecklist() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [yesterday, setYesterday] = useState<YesterdaySummary | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { if (!cancelled) setLoaded(true); return; }
      userIdRef.current = uid;

      const [todayRes, yRes] = await Promise.all([
        supabase.from("daily_logs").select("tasks_list").eq("user_id", uid).eq("log_date", todayDate()).maybeSingle(),
        supabase.from("daily_logs").select("tasks_completed,tasks_total,tasks_list").eq("user_id", uid).eq("log_date", yesterdayDate()).maybeSingle(),
      ]);
      if (cancelled) return;

      const list = (todayRes.data?.tasks_list as Task[] | undefined) ?? [];
      setTasks(Array.isArray(list) ? list : []);

      if (yRes.data) {
        const yList = (yRes.data.tasks_list as Task[] | undefined) ?? [];
        const total = yRes.data.tasks_total ?? yList.length;
        const completed = yRes.data.tasks_completed ?? yList.filter((t) => t.completed).length;
        setYesterday({ completed, total, hasData: total > 0 });
      } else {
        setYesterday({ completed: 0, total: 0, hasData: false });
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist (debounced)
  const persist = (next: Task[]) => {
    const uid = userIdRef.current;
    if (!uid) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const completed = next.filter((t) => t.completed).length;
      await supabase.from("daily_logs").upsert(
        {
          user_id: uid,
          log_date: todayDate(),
          tasks_list: next,
          tasks_completed: completed,
          tasks_total: next.length,
        },
        { onConflict: "user_id,log_date" },
      );
    }, 250);
  };

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    const next: Task[] = [
      ...tasks,
      { id: uuid(), text, completed: false, created_at: new Date().toISOString() },
    ];
    setTasks(next);
    setInput("");
    persist(next);
  };

  const toggleTask = (id: string) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    // Sort: incomplete first, then completed (preserve created order within each)
    const sorted = [
      ...next.filter((t) => !t.completed),
      ...next.filter((t) => t.completed),
    ];
    setTasks(sorted);
    persist(sorted);
  };

  const deleteTask = (id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      const next = tasks.filter((t) => t.id !== id);
      setTasks(next);
      setRemoving((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      persist(next);
    }, 200);
  };

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const allDone = total > 0 && completed === total;

  // Yesterday card
  const yAllDone = yesterday?.hasData && yesterday.completed === yesterday.total && yesterday.total > 0;

  return (
    <div>
      <style>{STYLES}</style>

      {/* YESTERDAY */}
      {loaded && (
        <div
          style={{
            background: "#111111",
            borderLeft: `3px solid ${yAllDone ? "#E8003D" : "#2A2A2A"}`,
            padding: "12px 16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#555555",
              marginBottom: 6,
            }}
          >
            ONTEM
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: yAllDone ? "#FFFFFF" : "#A0A0A0",
            }}
          >
            {yesterday?.hasData
              ? `${yesterday.completed} de ${yesterday.total} tarefas concluídas`
              : "Nenhum dado registrado ontem."}
          </div>
        </div>
      )}

      {/* ADD INPUT */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
        <input
          className="dc-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTask();
            }
          }}
          placeholder="Adicionar tarefa..."
          style={{
            flex: 1,
            background: "#111111",
            border: "1px solid #2A2A2A",
            height: 48,
            padding: "0 16px",
            borderRadius: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: "#FFFFFF",
            transition: "border-color 150ms",
          }}
        />
        <button
          className="dc-add-btn"
          onClick={addTask}
          aria-label="Adicionar tarefa"
          style={{
            width: 48,
            height: 48,
            background: "#E8003D",
            border: "none",
            borderRadius: 0,
            color: "#FFFFFF",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 150ms",
          }}
        >
          +
        </button>
      </div>

      {/* COUNTER + PROGRESS */}
      {total > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 11,
              color: allDone ? "#E8003D" : "#A0A0A0",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 8,
            }}
          >
            {allDone ? "TUDO CONCLUÍDO · BOM TRABALHO" : `${completed} DE ${total} CONCLUÍDAS`}
          </div>
          <div style={{ height: 2, background: "#1A1A1A", width: "100%" }}>
            <div
              className="dc-progress-bar"
              style={{ height: "100%", background: "#E8003D", width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* TASK LIST */}
      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: "#555555",
              marginBottom: 8,
            }}
          >
            Nenhuma tarefa adicionada.
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#333333",
            }}
          >
            Use o campo acima para planejar seu dia.
          </div>
        </div>
      ) : (
        <div>
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`dc-task dc-task-row ${removing.has(t.id) ? "removing" : ""}`}
              style={{
                minHeight: 52,
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid #2A2A2A",
              }}
            >
              <span
                onClick={() => toggleTask(t.id)}
                className="dc-checkbox"
                role="checkbox"
                aria-checked={t.completed}
                style={{
                  width: 16,
                  height: 16,
                  border: `1px solid ${t.completed ? "#E8003D" : "#2A2A2A"}`,
                  background: t.completed ? "#E8003D" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                  borderRadius: 0,
                }}
              >
                {t.completed && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5L4.5 9L10 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                  </svg>
                )}
              </span>
              <span
                onClick={() => toggleTask(t.id)}
                className={`dc-strike-wrap ${t.completed ? "on" : ""}`}
                style={{
                  flex: 1,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: t.completed ? "#555555" : "#FFFFFF",
                  cursor: "pointer",
                  textDecoration: t.completed ? "line-through" : "none",
                  wordBreak: "break-word",
                }}
              >
                {t.text}
              </span>
              <button
                className="dc-trash"
                onClick={() => deleteTask(t.id)}
                aria-label="Remover tarefa"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#333333",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.5 8.5h6l.5-8.5M5.5 6v4M8.5 6v4" strokeLinecap="square" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
