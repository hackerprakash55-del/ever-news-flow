import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';

type Story = { article_id: string; title: string; script: string; source_name: string; source_url: string; image_url: string; published_at?: string };
const empty: Story = { article_id: '', title: '', script: '', source_name: '', source_url: '', image_url: '' };
async function invoke(body: object) {
  const { data, error } = await supabase.functions.invoke('editorial-shorts', { body });
  if (error) {
    let message = 'Could not complete the review. Please try again.';
    if (error instanceof FunctionsHttpError) {
      const detail = await error.context.json().catch(() => null);
      if (detail?.error) message = detail.error;
    }
    throw new Error(message);
  }
  return data;
}
export default function EditorialShortsQueue() {
  const qc = useQueryClient();
  const [story, setStory] = useState<Story>(empty);
  const [official, setOfficial] = useState('');
  const [corroboration, setCorroboration] = useState('');
  const [notes, setNotes] = useState('');
  const [facts, setFacts] = useState(false);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const discovery = useQuery({ queryKey: ['shortDiscovery'], queryFn: async () => (await invoke({ action: 'discover' })).stories as Story[], staleTime: 300_000 });
  const candidates = useQuery({ queryKey: ['shortCandidates'], queryFn: async () => {
    const { data, error } = await supabase.from('short_candidates').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) throw error;
    return data;
  } });
  const run = async (body: object, success: string) => {
    setBusy(true); setMessage('');
    try {
      await invoke(body); setMessage(success);
      await Promise.all([qc.invalidateQueries({ queryKey: ['shortCandidates'] }), qc.invalidateQueries({ queryKey: ['youtubeQueue'] })]);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Review failed.'); }
    finally { setBusy(false); }
  };
  const choose = (item: Story) => { setStory(item); setOfficial(''); setCorroboration(''); setNotes(''); setFacts(false); setRights(false); setMessage(''); };
  return <section className="space-y-6 border-t border-border pt-8">
    <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-display">Story desk</h2><p className="text-sm text-muted-foreground mt-1">India · Recent reporting · Editorial approval required</p></div><Button size="icon" variant="outline" aria-label="Refresh story suggestions" title="Refresh story suggestions" disabled={discovery.isFetching} onClick={() => discovery.refetch()}><RefreshCw className="h-4 w-4" /></Button></div>
    {discovery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : discovery.isError ? <p role="alert" className="text-destructive text-sm">Story suggestions could not load. Admin access is required.</p> : <div className="grid md:grid-cols-2 gap-4">
      {(discovery.data ?? []).slice(0, 8).map(item => <article key={item.article_id} className="border border-border rounded-md overflow-hidden flex min-h-32">
        {item.image_url && <img src={item.image_url} alt="" className="w-24 object-cover shrink-0" loading="lazy" onError={e => { e.currentTarget.hidden = true; }} />}
        <div className="p-3 flex flex-col items-start gap-2 min-w-0"><p className="text-xs text-muted-foreground">{item.source_name}</p><h3 className="text-sm font-medium line-clamp-2">{item.title}</h3><Button variant="outline" size="sm" onClick={() => choose(item)}>Review story</Button></div>
      </article>)}
      {!discovery.data?.length && <p className="text-muted-foreground text-sm">No recent source reports available.</p>}
    </div>}
    <Button variant="outline" size="sm" onClick={() => choose({ ...empty, article_id: crypto.randomUUID() })}>Add a source-backed story</Button>
    {story.article_id && <form className="space-y-4 border-y border-border py-6" onSubmit={e => { e.preventDefault(); void run({ action: 'submit', ...story, official_url: official, corroborating_url: corroboration, evidence_notes: notes, facts_checked: facts, image_rights_confirmed: rights }, 'Saved for editorial approval.'); }}>
      <h3 className="text-lg font-semibold">Evidence & narration</h3>
      <div><Label htmlFor="candidate-title">Headline</Label><Input id="candidate-title" value={story.title} maxLength={200} required onChange={e => setStory({ ...story, title: e.target.value })} /></div>
      <div className="grid md:grid-cols-2 gap-4">{([
        ['Source name', 'source_name'], ['Source report URL', 'source_url'], ['Story photo URL', 'image_url']
      ] as const).map(([label, key]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type={key === 'source_name' ? 'text' : 'url'} required value={story[key]} onChange={e => setStory({ ...story, [key]: e.target.value })} /></div>)}
      <div><Label htmlFor="official">Official announcement URL</Label><Input id="official" type="url" required value={official} onChange={e => setOfficial(e.target.value)} /></div>
      <div><Label htmlFor="corroboration">Independent corroboration URL</Label><Input id="corroboration" type="url" required value={corroboration} onChange={e => setCorroboration(e.target.value)} /></div></div>
      <div><Label htmlFor="evidence">Evidence notes & photo permission</Label><Textarea id="evidence" minLength={20} maxLength={2000} required value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <div><Label htmlFor="narration">Narration draft</Label><Textarea id="narration" minLength={40} maxLength={900} required value={story.script} onChange={e => setStory({ ...story, script: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Checkbox id="facts" checked={facts} onCheckedChange={v => setFacts(v === true)} /><Label htmlFor="facts">I checked the claims against both sources</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="rights" checked={rights} onCheckedChange={v => setRights(v === true)} /><Label htmlFor="rights">We have permission to use this photo</Label></div>
      <Button type="submit" disabled={busy || !facts || !rights}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save for review</Button>
    </form>}
    {message && <p role="status" className="text-sm text-primary">{message}</p>}
    <h3 className="text-lg font-semibold">Editorial queue</h3>
    {candidates.isError && <p className="text-sm text-destructive">Could not load the editorial queue.</p>}
    {!candidates.isLoading && !candidates.data?.length && <p className="text-sm text-muted-foreground">No stories awaiting review.</p>}
    <div className="divide-y divide-border">{candidates.data?.map(c => <article key={c.id} className="py-5 space-y-3">
      <div className="flex items-start justify-between gap-3"><h4 className="font-medium break-words">{c.title}</h4><Badge variant="secondary">{c.status}</Badge></div>
      <p className="text-sm text-muted-foreground">{c.script}</p><p className="text-sm text-muted-foreground">{c.evidence_notes}</p>
      <div className="flex flex-wrap gap-4 text-sm">{[['Official announcement', c.official_url], ['Independent report', c.corroborating_url], ['Photo', c.image_url]].map(([label, url]) => url && <a key={label} href={url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">{label}<ExternalLink className="h-3 w-3" /></a>)}</div>
      {c.status === 'pending' && <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => run({ action: 'approve', id: c.id }, 'Approved for the next scheduled render.')}><Check className="h-4 w-4 mr-2" />Approve Short</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => run({ action: 'reject', id: c.id }, 'Story rejected.')}><X className="h-4 w-4 mr-2" />Reject</Button></div>}
    </article>)}</div>
  </section>;
}