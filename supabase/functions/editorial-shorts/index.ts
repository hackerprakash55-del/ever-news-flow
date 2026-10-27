import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { requireAdmin, serviceClient, userClient } from '../_shared/supa.ts';
import { publicHttps, reviewProblem } from '../_shared/editorial-policy.ts';
import { prepareHindiShort, hasHindi } from '../_shared/hindi-shorts.ts';

const link = z.string().max(2048).refine(publicHttps, 'A public HTTPS link is required');
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('discover') }),
  z.object({ action: z.literal('translate'), title: z.string().min(5).max(200), script: z.string().min(40).max(900) }),
  z.object({ action: z.literal('submit'), article_id: z.string().min(1).max(255), title: z.string().min(5).max(200), script: z.string().min(40).max(900), source_name: z.string().min(1).max(150), source_url: link, image_url: link, official_url: link, corroborating_url: link, evidence_notes: z.string().min(20).max(2000), facts_checked: z.boolean(), image_rights_confirmed: z.boolean() }),
  z.object({ action: z.enum(['approve', 'reject']), id: z.string().uuid() }),
]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req.headers.get('Authorization'));
    if (!auth.ok) return json({ error: auth.error }, auth.status);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Check the story fields and public HTTPS links.' }, 400);
    const body = parsed.data;
    const db = serviceClient();
    if (body.action === 'translate') {
      const hindi = await prepareHindiShort(body.title, body.script, Deno.env.get('SARVAM_API_KEY'));
      return json(hindi);
    }
    if (body.action === 'discover') {
      const { data, error } = await db.from('news_feed_cache').select('articles,fetched_at').eq('location', 'India').order('fetched_at', { ascending: false }).limit(5);
      if (error) throw error;
      const seen = new Set<string>();
      const stories = [];
      for (const cache of data ?? []) for (const a of cache.articles ?? []) {
        if (!a?.id || !a.headline || !publicHttps(a.url ?? '') || seen.has(String(a.id))) continue;
        const published = Date.parse(a.publishedAt ?? '');
        if (!Number.isFinite(published) || Date.now() - published > 48 * 3600_000 || published > Date.now() + 3600_000) continue;
        seen.add(String(a.id));
        stories.push({ article_id: String(a.id), title: String(a.headline).slice(0, 200), script: `${a.headline}. ${a.summary ?? ''}`.slice(0, 900), source_url: a.url, source_name: a.verification?.sources_checked?.[0]?.outlet ?? 'Source report', image_url: publicHttps(a.imageUrl ?? '') ? a.imageUrl : '', published_at: a.publishedAt });
      }
      return json({ stories: stories.slice(0, 20) });
    }
    if (body.action === 'submit') {
      const problem = reviewProblem(body);
      if (problem) return json({ error: problem }, 400);
      if (!hasHindi(body.title) || !hasHindi(body.script)) return json({ error: 'Prepare and review the Hindi text before saving.' }, 400);
      const { action: _, ...fields } = body;
      const { data, error } = await db.from('short_candidates').insert({ ...fields, created_by: auth.userId }).select('id').single();
      if (error) return json({ error: error.code === '23505' ? 'This story is already in the review queue.' : 'Could not save this candidate.' }, 409);
      return json({ id: data.id });
    }
    if (body.action === 'reject') {
      const { data, error } = await db.from('short_candidates').update({ status: 'rejected', reviewed_by: auth.userId, reviewed_at: new Date().toISOString() }).eq('id', body.id).eq('status', 'pending').select('id').maybeSingle();
      if (error) throw error;
      return data ? json({ ok: true }) : json({ error: 'Pending candidate not found.' }, 404);
    }
    const { data: candidate, error: readError } = await db.from('short_candidates').select('*').eq('id', body.id).maybeSingle();
    if (readError) throw readError;
    if (!candidate) return json({ error: 'Candidate not found.' }, 404);
    const problem = reviewProblem(candidate);
    if (problem) return json({ error: problem }, 400);
    const { data, error } = await userClient(req.headers.get('Authorization')).rpc('approve_short_candidate', { p_id: body.id });
    if (error) return json({ error: error.message }, 409);
    return json({ queue_id: data });
  } catch (e) {
    console.error('Editorial queue:', e);
    return json({ error: 'The review queue is temporarily unavailable.' }, 500);
  }
});