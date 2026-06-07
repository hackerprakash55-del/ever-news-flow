
-- Entities
CREATE TABLE public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('person','org','country','event','topic','other')),
  aliases text[] NOT NULL DEFAULT '{}',
  salience numeric NOT NULL DEFAULT 0.5,
  mention_count int NOT NULL DEFAULT 0,
  embedding extensions.vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX entities_name_type_key ON public.entities (lower(name), type);
CREATE INDEX entities_embedding_idx ON public.entities USING hnsw (embedding extensions.vector_cosine_ops);
GRANT SELECT ON public.entities TO anon, authenticated;
GRANT ALL ON public.entities TO service_role;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entities public read" ON public.entities FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.entity_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  span text,
  confidence numeric NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, claim_id)
);
CREATE INDEX entity_mentions_entity_idx ON public.entity_mentions (entity_id);
CREATE INDEX entity_mentions_claim_idx  ON public.entity_mentions (claim_id);
GRANT SELECT ON public.entity_mentions TO authenticated;
GRANT ALL ON public.entity_mentions TO service_role;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_mentions auth read" ON public.entity_mentions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.entity_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  src_entity uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  dst_entity uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  relation text NOT NULL,
  weight numeric NOT NULL DEFAULT 1.0,
  evidence_claim_ids uuid[] NOT NULL DEFAULT '{}',
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (src_entity, dst_entity, relation)
);
CREATE INDEX entity_edges_src_idx ON public.entity_edges (src_entity);
CREATE INDEX entity_edges_dst_idx ON public.entity_edges (dst_entity);
GRANT SELECT ON public.entity_edges TO anon, authenticated;
GRANT ALL ON public.entity_edges TO service_role;
ALTER TABLE public.entity_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_edges public read" ON public.entity_edges FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.event_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  summary text,
  entity_ids uuid[] NOT NULL DEFAULT '{}',
  claim_ids  uuid[] NOT NULL DEFAULT '{}',
  hotness numeric NOT NULL DEFAULT 0,
  embedding extensions.vector(1536),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now(),
  broadcasted_at timestamptz
);
CREATE INDEX event_clusters_hot_idx ON public.event_clusters (hotness DESC, last_updated DESC);
CREATE INDEX event_clusters_embedding_idx ON public.event_clusters USING hnsw (embedding extensions.vector_cosine_ops);
GRANT SELECT ON public.event_clusters TO anon, authenticated;
GRANT ALL ON public.event_clusters TO service_role;
ALTER TABLE public.event_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_clusters public read" ON public.event_clusters FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.match_entities(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.80,
  match_count integer DEFAULT 5
)
RETURNS TABLE (id uuid, name text, type text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT e.id, e.name, e.type, 1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.entities e
  WHERE e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_entities(extensions.vector, double precision, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_entities(extensions.vector, double precision, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.match_events(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.75,
  match_count integer DEFAULT 5
)
RETURNS TABLE (id uuid, label text, summary text, hotness numeric, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT ec.id, ec.label, ec.summary, ec.hotness, 1 - (ec.embedding <=> query_embedding) AS similarity
  FROM public.event_clusters ec
  WHERE ec.embedding IS NOT NULL
    AND 1 - (ec.embedding <=> query_embedding) > match_threshold
  ORDER BY ec.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_events(extensions.vector, double precision, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_events(extensions.vector, double precision, integer) TO service_role;
