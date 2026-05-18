ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS agent_tone text NOT NULL DEFAULT 'coach_direto',
  ADD COLUMN IF NOT EXISTS agent_focus text NOT NULL DEFAULT 'equilibrio',
  ADD COLUMN IF NOT EXISTS morning_summary boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS proactive_alerts boolean NOT NULL DEFAULT true;