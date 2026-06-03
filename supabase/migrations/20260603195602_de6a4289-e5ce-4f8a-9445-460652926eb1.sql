
-- Enable pgvector for semantic memory
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- USER ROLES (standard secure pattern)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================
-- SOURCES — trust & reliability scoring
-- ============================================================
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  display_name text,
  reliability_score numeric(4,3) NOT NULL DEFAULT 0.500,
  historical_accuracy numeric(4,3) NOT NULL DEFAULT 0.500,
  citation_quality numeric(4,3) NOT NULL DEFAULT 0.500,
  consistency_score numeric(4,3) NOT NULL DEFAULT 0.500,
  total_claims int NOT NULL DEFAULT 0,
  verified_claims int NOT NULL DEFAULT 0,
  refuted_claims int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sources TO authenticated, anon;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sources are publicly readable"
  ON public.sources FOR SELECT TO authenticated, anon
  USING (true);

CREATE INDEX sources_reliability_idx ON public.sources (reliability_score DESC);

-- ============================================================
-- CLAIMS — atomic verifiable assertions with embeddings
-- ============================================================
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_text text NOT NULL,
  normalized_text text NOT NULL,
  embedding vector(1536),
  status text NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified','verified','disputed','false','unknown')),
  confidence numeric(4,3) NOT NULL DEFAULT 0.000,
  topic text,
  entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  verification_count int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified claims readable by authenticated users"
  ON public.claims FOR SELECT TO authenticated
  USING (status IN ('verified','disputed'));

CREATE POLICY "Admins can read all claims"
  ON public.claims FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX claims_embedding_idx ON public.claims
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX claims_topic_idx ON public.claims (topic);
CREATE INDEX claims_status_idx ON public.claims (status);
CREATE INDEX claims_last_seen_idx ON public.claims (last_seen_at DESC);

-- ============================================================
-- CLAIM EVIDENCE — supports/refutes links to sources
-- ============================================================
CREATE TABLE public.claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  stance text NOT NULL CHECK (stance IN ('supports','refutes','neutral')),
  excerpt text,
  url text,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  weight numeric(4,3) NOT NULL DEFAULT 1.000,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.claim_evidence TO authenticated;
GRANT ALL ON public.claim_evidence TO service_role;
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence readable by authenticated users"
  ON public.claim_evidence FOR SELECT TO authenticated
  USING (true);

CREATE INDEX claim_evidence_claim_idx ON public.claim_evidence (claim_id);
CREATE INDEX claim_evidence_source_idx ON public.claim_evidence (source_id);

-- ============================================================
-- TOPIC MEMORY — cached topic summaries with embeddings
-- ============================================================
CREATE TABLE public.topic_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL UNIQUE,
  embedding vector(1536),
  summary text,
  entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  story_count int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.topic_memory TO authenticated, anon;
GRANT ALL ON public.topic_memory TO service_role;
ALTER TABLE public.topic_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topic memory readable by all"
  ON public.topic_memory FOR SELECT TO authenticated, anon
  USING (true);

CREATE INDEX topic_memory_embedding_idx ON public.topic_memory
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- AGENT TRACES — full audit log of AI agent steps
-- ============================================================
CREATE TABLE public.agent_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  agent_name text NOT NULL,
  step_order int NOT NULL DEFAULT 0,
  input jsonb,
  output jsonb,
  reasoning text,
  model text,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','skipped')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_traces TO authenticated;
GRANT ALL ON public.agent_traces TO service_role;
ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agent traces"
  ON public.agent_traces FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX agent_traces_run_idx ON public.agent_traces (run_id, step_order);
CREATE INDEX agent_traces_created_idx ON public.agent_traces (created_at DESC);
CREATE INDEX agent_traces_agent_idx ON public.agent_traces (agent_name);

-- ============================================================
-- VERIFICATION RUNS — consensus + publish gating
-- ============================================================
CREATE TABLE public.verification_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL UNIQUE,
  topic text,
  story_headline text,
  consensus_score numeric(4,3) NOT NULL DEFAULT 0.000,
  threshold numeric(4,3) NOT NULL DEFAULT 0.700,
  threshold_met boolean NOT NULL DEFAULT false,
  agent_votes jsonb NOT NULL DEFAULT '[]'::jsonb,
  claim_ids uuid[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  total_latency_ms int,
  total_tokens int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.verification_runs TO authenticated;
GRANT ALL ON public.verification_runs TO service_role;
ALTER TABLE public.verification_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verification runs readable by authenticated"
  ON public.verification_runs FOR SELECT TO authenticated
  USING (true);

CREATE INDEX verification_runs_created_idx ON public.verification_runs (created_at DESC);
CREATE INDEX verification_runs_published_idx ON public.verification_runs (published, created_at DESC);

-- ============================================================
-- Updated-at triggers
-- ============================================================
CREATE TRIGGER sources_updated_at BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER claims_updated_at BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Similarity search helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_claims(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  claim_text text,
  status text,
  confidence numeric,
  topic text,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.claim_text, c.status, c.confidence, c.topic,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.claims c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_topics(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.70,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  topic text,
  summary text,
  entities jsonb,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.topic, t.summary, t.entities,
         1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.topic_memory t
  WHERE t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
$$;
