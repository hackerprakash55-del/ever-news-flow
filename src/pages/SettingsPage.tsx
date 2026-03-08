import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, Bookmark, Settings2, Camera, Loader2, CheckCircle2,
  Trash2, ExternalLink, Tag, MapPin, LogOut, ChevronRight, Clock
} from "lucide-react";
import { CATEGORIES } from "@/data/mockData";
import { WORLD_COUNTRIES } from "@/components/GeoFilter";
import { useToast } from "@/hooks/use-toast";

// ── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl + `?t=${Date.now()}`);
    }
    setUploading(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, display_name: displayName, username, bio, avatar_url: avatarUrl }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const initials = (displayName || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gainn-blue/20 border border-gainn-blue/30 overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gainn-blue">{initials}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gainn-blue" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gainn-blue text-white flex items-center justify-center hover:bg-gainn-blue/90 transition-colors shadow-lg"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{displayName || "No name set"}</p>
          <p className="text-sm text-muted-foreground font-mono">{user?.email}</p>
        </div>
      </div>

      {/* Fields */}
      {[
        { label: "Display Name", value: displayName, setter: setDisplayName, placeholder: "Your full name" },
        { label: "Username", value: username, setter: setUsername, placeholder: "@yourhandle" },
      ].map(({ label, value, setter, placeholder }) => (
        <div key={label} className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground font-mono uppercase tracking-wide">{label}</label>
          <input
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gainn-blue/40 focus:border-gainn-blue/50 transition-all"
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground font-mono uppercase tracking-wide">Bio</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself…"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gainn-blue/40 focus:border-gainn-blue/50 transition-all resize-none"
        />
      </div>

      <Button onClick={saveProfile} disabled={saving} className="gap-2 bg-gainn-blue hover:bg-gainn-blue/90 text-white">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-gainn-green" /> : <User className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Profile"}
      </Button>
    </div>
  );
}

// ── Preferences Tab ────────────────────────────────────────────────────────

function PreferencesTab() {
  const { user } = useAuth();
  const [selectedCats, setSelectedCats] = useState<string[]>(["All"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase.from("news_preferences").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setSelectedCats(data.categories ?? ["All"]);
        setSelectedRegions(data.regions ?? []);
      }
    });
  }, [user]);

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleRegion(r: string) {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  async function savePrefs() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("news_preferences").upsert(
      { user_id: user.id, categories: selectedCats, regions: selectedRegions },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* Category preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gainn-cyan" />
          <h3 className="text-sm font-semibold text-foreground">News Categories</h3>
          <span className="text-xs text-muted-foreground font-mono ml-auto">{selectedCats.length} selected</span>
        </div>
        <p className="text-xs text-muted-foreground">Choose which topics appear in your personalized feed.</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCats.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-all border ${
                  active
                    ? "bg-gainn-blue/20 text-gainn-cyan border-gainn-blue/40"
                    : "bg-surface-2 text-muted-foreground border-border hover:border-gainn-blue/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Region preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gainn-green" />
          <h3 className="text-sm font-semibold text-foreground">Preferred Regions</h3>
          <span className="text-xs text-muted-foreground font-mono ml-auto">{selectedRegions.length} selected</span>
        </div>
        <p className="text-xs text-muted-foreground">Get news prioritized from specific countries.</p>
        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto scrollbar-none">
          {WORLD_COUNTRIES.map((country) => {
            const active = selectedRegions.includes(country);
            return (
              <button
                key={country}
                onClick={() => toggleRegion(country)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-all border ${
                  active
                    ? "bg-gainn-green/20 text-gainn-green border-gainn-green/40"
                    : "bg-surface-2 text-muted-foreground border-border hover:border-gainn-green/30 hover:text-foreground"
                }`}
              >
                {country}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={savePrefs} disabled={saving} className="gap-2 bg-gainn-blue hover:bg-gainn-blue/90 text-white">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-gainn-green" /> : <Settings2 className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}

// ── Saved Articles Tab ─────────────────────────────────────────────────────

function SavedArticlesTab() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function loadArticles() {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("saved_articles")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });
    setArticles(data ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadArticles(); }, [user]);

  async function removeArticle(id: string) {
    await supabase.from("saved_articles").delete().eq("id", id).eq("user_id", user!.id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Removed from saved" });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto">
          <Bookmark className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No saved articles yet</h3>
        <p className="text-sm text-muted-foreground">Hit the Save button on any article to bookmark it here.</p>
        <Link to="/">
          <Button variant="outline" size="sm" className="mt-2 gap-2">
            <ChevronRight className="w-3.5 h-3.5" /> Browse News
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-xs text-muted-foreground font-mono mb-1">{articles.length} saved articles</p>
      {articles.map((a) => (
        <div key={a.id} className="card-glass rounded-xl p-4 flex gap-4 group hover:border-gainn-blue/30 transition-colors">
          {a.image_url && (
            <img src={a.image_url} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug flex-1">{a.headline}</p>
              <button
                onClick={() => removeArticle(a.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-gainn-red/10 text-muted-foreground hover:text-gainn-red transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {a.summary && <p className="text-xs text-muted-foreground line-clamp-1">{a.summary}</p>}
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              {a.category && <span className="text-gainn-cyan">{a.category}</span>}
              {a.read_time && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{a.read_time}m</span>}
              {a.region && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{a.region}</span>}
              {a.source_url && (
                <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-0.5 hover:text-gainn-blue transition-colors">
                  Read <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/auth", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const initials = (profile?.display_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <NewsTickerBar />

      <div className="max-w-screen-lg mx-auto px-4 md:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gainn-blue/20 border border-gainn-blue/30 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gainn-blue">{initials}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-display text-foreground">{profile?.display_name || "My Account"}</h1>
              <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-gainn-red hover:border-gainn-red/40"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 bg-surface-2 h-10">
            <TabsTrigger value="profile" className="gap-2 text-xs font-mono">
              <User className="w-3.5 h-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 text-xs font-mono">
              <Settings2 className="w-3.5 h-3.5" /> News Preferences
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2 text-xs font-mono">
              <Bookmark className="w-3.5 h-3.5" /> Saved Articles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
          <TabsContent value="saved">
            <SavedArticlesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
