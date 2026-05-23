import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Link, Routes, Route, useNavigate, BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import {
  Cpu, HardDrive, Zap, Shield, Globe, Headphones,
  Check, Rocket, Server, Gamepad2, Settings, LogOut,
  Crown, Eye, EyeOff, Star, Plus, Trash2, Save,
  UserCog, Upload, Users, X, Settings2, Lock
} from "lucide-react";
import logo from "@/assets/sparkhosting-logo.png";

type DbPlan = {
  id: string;
  category: "minecraft" | "budget" | "paid" | "premium" | "vps";
  name: string;
  tagline: string | null;
  price_cents: number;
  currency: string;
  billing_period: string;
  ram_gb: number | null;
  cpu_cores: number | null;
  cpu_label: string | null;
  storage_gb: number | null;
  storage_type: string | null;
  bandwidth_tb: number | null;
  player_slots: number | null;
  features: string[];
  badge: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_featured: boolean;
};

function formatPrice(cents: number, currency: string) {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "\u20ac" : currency === "INR" ? "\u20b9" : `${currency} `;
  return `${sym}${(cents / 100).toFixed(2)}`;
}

const nav = ["Home", "Minecraft", "VPS", "KVM", "Pricing", "Reviews"];

// ─── Wordmark with circular logo ────────────────────────────────────────────
function Wordmark({ size = "text-lg" }: { size?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src={logo}
        alt="SparkHosting"
        className="h-11 w-11 object-cover rounded-full drop-shadow-[0_0_18px_rgba(217,70,239,0.7)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]"
      />
      <div className="leading-tight">
        <div className={`font-display font-bold ${size} tracking-tight`}>
          Spark<span className="text-gradient-spark">Hosting</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-primary">System Active</div>
      </div>
    </Link>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────
function Index() {
  const { user, isAdmin } = useAuth();
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data ?? []) as any));

    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach(item => { map[item.key] = item.value; });
        setSettings(map);
      });
  }, []);

  const minecraftPlans = plans.filter(p => p.category === "minecraft");
  const vpsPlans = plans.filter(p => p.category !== "minecraft");

  return (
    <div className="min-h-screen text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <Wordmark />
          <nav className="hidden lg:flex items-center gap-8 text-sm text-muted-foreground">
            {nav.map(n => (
              <a key={n} href={`#${n.toLowerCase()}`} className="hover:text-foreground transition-colors">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="hidden sm:inline-flex h-10 px-4 rounded-full text-sm font-medium border border-primary/40 text-primary hover:bg-primary/10 transition items-center gap-1.5">
                <Settings className="w-4 h-4" /> Admin
              </Link>
            )}
            {user ? (
              <button onClick={async () => { await supabase.auth.signOut(); }} className="h-10 px-5 rounded-full text-sm font-medium border border-border hover:border-primary transition">
                Sign out
              </button>
            ) : (
              <Link to="/auth" className="h-10 px-6 rounded-full text-sm font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest mb-8">
            <Zap className="w-3.5 h-3.5" /> Blazing-Fast Hosting
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Premium Game &<br />
            <span className="text-gradient-spark">Cloud Hosting</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            NVMe Gen4 storage. AMD Ryzen CPUs. DDoS-protected network. 24/7 expert support.
            Everything you need to run your servers at peak performance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#minecraft" className="h-12 px-8 rounded-full text-sm font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Minecraft Plans
            </a>
            <a href="#vps" className="h-12 px-8 rounded-full text-sm font-semibold border border-border hover:border-primary transition inline-flex items-center gap-2">
              <Server className="w-4 h-4" /> VPS & KVM
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why SparkHosting?</h2>
            <p className="text-muted-foreground">Enterprise-grade infrastructure for everyone.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: "AMD Ryzen CPUs", desc: "Latest-gen processors for lag-free performance." },
              { icon: HardDrive, title: "NVMe Gen4 Storage", desc: "Up to 7 GB/s read speeds. No spinning disks." },
              { icon: Shield, title: "DDoS Protection", desc: "Layer 3-7 mitigation. Always-on shielding." },
              { icon: Globe, title: "Global Network", desc: "Multiple data centers for low-latency access." },
              { icon: Headphones, title: "24/7 Expert Support", desc: "Real humans, real answers, any time of day." },
              { icon: Zap, title: "Instant Setup", desc: "Deploy in seconds. No waiting for provisioning." },
            ].map(f => (
              <div key={f.title} className="card-3d rounded-2xl p-6 hover:border-primary/40 transition group">
                <f.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MINECRAFT PLANS */}
      {minecraftPlans.length > 0 && (
        <section id="minecraft" className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Minecraft Hosting</h2>
              <p className="text-muted-foreground">Java & Bedrock. Modded & Vanilla. Your world, your rules.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {minecraftPlans.map(p => <PlanCard key={p.id} plan={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* VPS PLANS */}
      {vpsPlans.length > 0 && (
        <section id="vps" className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">VPS & KVM Hosting</h2>
              <p className="text-muted-foreground">Full root access. Dedicated resources. Unlimited potential.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vpsPlans.map(p => <PlanCard key={p.id} plan={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <Wordmark size="text-base" />
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href={settings.footer_status_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Status</a>
              <a href={settings.footer_discord_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Discord</a>
              <a href={settings.footer_terms_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Terms</a>
              <a href={settings.footer_privacy_url || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Privacy</a>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
            <div className="text-muted-foreground">&copy; {new Date().getFullYear()} SparkHosting. All rights reserved.</div>
            <div className="text-muted-foreground">
              Made with <span className="text-red-500">&#10084;&#65039;</span> By{" "}
              <a
                href={settings.footer_credit_url || "https://discord.com/users/1151903297335218319"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline font-medium transition"
              >
                {settings.footer_credit_text ? settings.footer_credit_text.split("By ")[1]?.trim() || "! Mohit" : "! Mohit"}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({ plan }: { plan: DbPlan }) {
  return (
    <div className={`card-3d rounded-2xl p-6 relative ${plan.is_featured ? "border-primary/60 shadow-spark" : ""}`}>
      {plan.badge && (
        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary border border-primary/20">
          {plan.badge}
        </span>
      )}
      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
      {plan.tagline && <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>}
      <div className="text-3xl font-bold text-gradient-spark mb-6">
        {formatPrice(plan.price_cents, plan.currency)}
        <span className="text-xs text-muted-foreground font-normal"> /{plan.billing_period}</span>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6">
        {plan.ram_gb != null && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {plan.ram_gb} GB RAM</li>}
        {plan.cpu_cores != null && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {plan.cpu_cores} CPU cores{plan.cpu_label ? ` (${plan.cpu_label})` : ""}</li>}
        {plan.storage_gb != null && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {plan.storage_gb} GB {plan.storage_type ?? "SSD"}</li>}
        {plan.bandwidth_tb != null && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {plan.bandwidth_tb} TB Bandwidth</li>}
        {plan.player_slots != null && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {plan.player_slots} Player Slots</li>}
        {(plan.features ?? []).map((f, i) => <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {f}</li>)}
      </ul>
      <a
        href={plan.cta_url || "#"}
        className="block text-center h-11 leading-[44px] rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark text-sm"
      >
        {plan.cta_label || "Order Now"}
      </a>
    </div>
  );
}

// ─── Auth Page ──────────────────────────────────────────────────────────────
function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      navigate("/");
    } catch (err: any) {
      alert(err?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card-3d rounded-3xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <img src={logo} alt="SparkHosting" className="h-16 w-16 rounded-full mx-auto mb-4 drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]" />
          <h1 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isLogin ? "Sign in to your dashboard" : "Get started with SparkHosting"}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm mt-1" />
          </div>
          <button disabled={submitting} className="w-full h-11 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark text-sm disabled:opacity-60">
            {submitting ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p className="text-sm text-center mt-6 text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────
const CATEGORIES: DbPlan["category"][] = ["minecraft", "budget", "paid", "premium", "vps"];
const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm";

type Plan = {
  id: string;
  category: "minecraft" | "budget" | "paid" | "premium" | "vps";
  name: string;
  tagline: string | null;
  price_cents: number;
  currency: string;
  billing_period: string;
  ram_gb: number | null;
  cpu_cores: number | null;
  cpu_label: string | null;
  storage_gb: number | null;
  storage_type: string | null;
  bandwidth_tb: number | null;
  player_slots: number | null;
  location: string | null;
  features: string[];
  badge: string | null;
  color: string | null;
  icon: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
};

const emptyPlan = (): Partial<Plan> => ({
  category: "minecraft", name: "New plan", tagline: "", price_cents: 999,
  currency: "USD", billing_period: "month", ram_gb: 4, cpu_cores: 2, cpu_label: "",
  storage_gb: 50, storage_type: "NVMe SSD", bandwidth_tb: null, player_slots: null,
  location: "", features: [], badge: "", cta_label: "Order now", image_url: null,
  cta_url: "", sort_order: 0, is_active: true, is_featured: false,
});

function AdminPage() {
  const { user, isAdmin, isMainAdmin, isOwner, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<"all" | Plan["category"]>("all");
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [revokeSelf, setRevokeSelf] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  async function refresh() {
    setFetching(true);
    const { data, error } = await supabase.from("plans").select("*").order("category").order("sort_order");
    if (error) alert(error.message);
    else setPlans((data ?? []) as Plan[]);
    setFetching(false);
  }

  async function save(p: Partial<Plan>) {
    const payload = { ...p, features: Array.isArray(p.features) ? p.features : [], price_cents: Number(p.price_cents ?? 0), sort_order: Number(p.sort_order ?? 0) };
    if (p.id) {
      const { error } = await supabase.from("plans").update(payload as any).eq("id", p.id);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("plans").insert(payload as any);
      if (error) return alert(error.message);
    }
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return alert(error.message);
    refresh();
  }

  async function toggleField(id: string, field: "is_active" | "is_featured", value: boolean) {
    const { error } = await supabase.from("plans").update({ [field]: value } as any).eq("id", id);
    if (error) return alert(error.message);
    refresh();
  }

  async function handleChangeAdmin(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      // Sign up new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newAdminEmail, password: newAdminPassword,
      });
      if (signUpError) throw signUpError;
      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("Failed to create user");

      // Set as admin
      const { error: roleError } = await supabase.from("user_roles").upsert({
        user_id: newUserId, role: "admin", is_main: true, is_owner: false,
      });
      if (roleError) throw roleError;

      // Demote current main admin
      if (revokeSelf) {
        await supabase.from("user_roles").update({ is_main: false }).eq("user_id", user.id).eq("is_main", true);
      }

      alert(`Main admin set to ${newAdminEmail}`);
      setNewAdminEmail("");
      setNewAdminPassword("");
      if (revokeSelf) {
        await supabase.auth.signOut();
        navigate("/auth");
      }
    } catch (err: any) {
      alert(err?.message ?? "Failed to change admin");
    } finally {
      setChanging(false);
    }
  }

  const filtered = useMemo(() => (filter === "all" ? plans : plans.filter(p => p.category === filter)), [plans, filter]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="card-3d rounded-3xl p-10 max-w-md text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-6">Signed in as {user.email}. Ask an existing admin to grant you access.</p>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <img src={logo} alt="SparkHosting" className="h-8 w-8 rounded-full object-cover" />
            Spark<span className="text-gradient-spark">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">View site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="h-9 px-4 rounded-full text-sm font-medium border border-border hover:border-primary inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Plan manager</div>
            <h1 className="text-4xl font-bold">Hosting plans</h1>
            <p className="text-sm text-muted-foreground mt-1">Create, edit and publish plans shown on the public site.</p>
          </div>
          <button onClick={() => setEditing(emptyPlan())} className="h-11 px-5 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New plan
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", ...CATEGORIES] as const).map(c => (
            <button key={c} onClick={() => setFilter(c as any)} className={`px-4 h-9 rounded-full text-xs uppercase tracking-widest border transition ${filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
              {c}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="text-muted-foreground text-sm">Loading plans...</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(p => (
              <div key={p.id} className="card-3d rounded-2xl p-6 relative">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-4 border border-border" />}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary">{p.category}</span>
                  <div className="flex gap-1">
                    <button title={p.is_active ? "Active" : "Hidden"} onClick={() => toggleField(p.id, "is_active", !p.is_active)} className="p-1.5 rounded-md hover:bg-primary/10">
                      {p.is_active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button title="Featured" onClick={() => toggleField(p.id, "is_featured", !p.is_featured)} className="p-1.5 rounded-md hover:bg-primary/10">
                      <Star className={`w-4 h-4 ${p.is_featured ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{p.name}</h3>
                {p.tagline && <p className="text-xs text-muted-foreground mt-1">{p.tagline}</p>}
                <div className="text-3xl font-bold text-gradient-spark mt-3">
                  {(p.price_cents / 100).toFixed(2)} {p.currency}
                  <span className="text-xs text-muted-foreground"> /{p.billing_period}</span>
                </div>
                <ul className="mt-3 text-xs text-muted-foreground space-y-1">
                  {p.ram_gb != null && <li>RAM: {p.ram_gb} GB</li>}
                  {p.cpu_cores != null && <li>CPU: {p.cpu_cores} cores{p.cpu_label ? ` (${p.cpu_label})` : ""}</li>}
                  {p.storage_gb != null && <li>Storage: {p.storage_gb} GB {p.storage_type ?? ""}</li>}
                  {p.bandwidth_tb != null && <li>Bandwidth: {p.bandwidth_tb} TB</li>}
                  {p.player_slots != null && <li>Slots: {p.player_slots}</li>}
                </ul>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setEditing(p)} className="flex-1 h-9 rounded-full text-xs font-semibold border border-border hover:border-primary">Edit</button>
                  <button onClick={() => remove(p.id)} className="h-9 px-3 rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground text-sm py-12">No plans yet.</div>}
          </div>
        )}

        {isOwner && <OwnerSelfAccount currentEmail={user.email ?? ""} />}

        {isOwner && (
          <section className="mt-16 card-3d rounded-3xl p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Change main admin</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Create or promote a main admin account. Only you (owner) can do this.</p>
            <form onSubmit={handleChangeAdmin} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Main admin email</label>
                  <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className={`${inputCls} mt-1`} placeholder="main-admin@example.com" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
                  <input type="password" required minLength={6} value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className={`${inputCls} mt-1`} placeholder="At least 6 characters" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={revokeSelf} onChange={e => setRevokeSelf(e.target.checked)} /> Revoke my main admin status
              </label>
              <button disabled={changing} className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
                <Save className="w-4 h-4" /> {changing ? "Updating..." : "Set as main admin"}
              </button>
            </form>
          </section>
        )}

        {isMainAdmin && <SiteSettingsSection />}
      </main>

      {editing && <PlanEditor initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

// ─── Owner Self Account (working email/password change) ─────────────────────
function OwnerSelfAccount({ currentEmail }: { currentEmail: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const emailChanged = email.trim() !== "" && email.trim() !== currentEmail;
    const pwdChanged = password.length > 0;
    if (!emailChanged && !pwdChanged) { alert("Change email or password first"); return; }
    if (pwdChanged && password.length < 8) { alert("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) throw error;
      }
      if (pwdChanged) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        await supabase.auth.signOut();
        alert("Credentials updated - please sign in again with your new details.");
        navigate("/auth");
        return;
      }
      alert(emailChanged ? "Account updated - sign in with the new email next time" : "Password updated");
      setPassword("");
    } catch (err: any) {
      alert(err?.message ?? "Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-16 card-3d rounded-3xl p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Your owner account</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Change the email and password you use to sign in.</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">New password</label>
            <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} mt-1`} placeholder="Leave blank to keep current" />
          </div>
        </div>
        <button disabled={saving} className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Update my account"}
        </button>
      </form>
    </section>
  );
}

// ─── Site Settings Section ──────────────────────────────────────────────────
function SiteSettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(item => { map[item.key] = item.value; });
      setSettings(map);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updates = [
        { key: "footer_status_url", value: settings.footer_status_url || "#" },
        { key: "footer_discord_url", value: settings.footer_discord_url || "#" },
        { key: "footer_terms_url", value: settings.footer_terms_url || "#" },
        { key: "footer_privacy_url", value: settings.footer_privacy_url || "#" },
        { key: "footer_credit_text", value: settings.footer_credit_text || "Made with \u2764\uFE0F By Creator" },
        { key: "footer_credit_url", value: settings.footer_credit_url || "#" },
      ];
      for (const u of updates) {
        await supabase.from("site_settings").update({ value: u.value }).eq("key", u.key);
      }
      alert("Settings updated");
    } catch (err: any) {
      alert(err?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-16 card-3d rounded-3xl p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Settings2 className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Site settings</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Configure footer links and creator credit shown on the public site.</p>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4">Footer links</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status URL</label>
              <input type="url" value={settings.footer_status_url || ""} onChange={e => setSettings(p => ({ ...p, footer_status_url: e.target.value }))} className={`${inputCls} mt-1`} placeholder="https://status.example.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Discord URL</label>
              <input type="url" value={settings.footer_discord_url || ""} onChange={e => setSettings(p => ({ ...p, footer_discord_url: e.target.value }))} className={`${inputCls} mt-1`} placeholder="https://discord.gg/..." />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Terms URL</label>
              <input type="url" value={settings.footer_terms_url || ""} onChange={e => setSettings(p => ({ ...p, footer_terms_url: e.target.value }))} className={`${inputCls} mt-1`} placeholder="https://example.com/terms" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Privacy URL</label>
              <input type="url" value={settings.footer_privacy_url || ""} onChange={e => setSettings(p => ({ ...p, footer_privacy_url: e.target.value }))} className={`${inputCls} mt-1`} placeholder="https://example.com/privacy" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-4">Creator credit</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Credit text</label>
              <input type="text" value={settings.footer_credit_text || ""} onChange={e => setSettings(p => ({ ...p, footer_credit_text: e.target.value }))} className={`${inputCls} mt-1`} placeholder="Made with ❤️ By ! Mohit" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Creator URL</label>
              <input type="url" value={settings.footer_credit_url || ""} onChange={e => setSettings(p => ({ ...p, footer_credit_url: e.target.value }))} className={`${inputCls} mt-1`} placeholder="https://discord.com/users/..." />
            </div>
          </div>
        </div>

        <button type="button" onClick={saveSettings} disabled={saving} className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </section>
  );
}

// ─── Plan Editor Modal ──────────────────────────────────────────────────────
function PlanEditor({ initial, onClose, onSave }: { initial: Partial<Plan>; onClose: () => void; onSave: (p: Partial<Plan>) => void }) {
  const [p, setP] = useState<Partial<Plan>>(initial);
  const [featuresText, setFeaturesText] = useState((initial.features ?? []).join("\n"));

  function up<K extends keyof Plan>(k: K, v: any) { setP(prev => ({ ...prev, [k]: v })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...p, features: featuresText.split("\n").map(s => s.trim()).filter(Boolean) });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="card-3d rounded-3xl p-8 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{p.id ? "Edit plan" : "New plan"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={p.category} onChange={e => up("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Name"><input required value={p.name ?? ""} onChange={e => up("name", e.target.value)} className={inputCls} /></Field>
          <Field label="Tagline" full><input value={p.tagline ?? ""} onChange={e => up("tagline", e.target.value)} className={inputCls} /></Field>
          <Field label="Price (cents)"><input type="number" min={0} value={p.price_cents ?? 0} onChange={e => up("price_cents", Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Currency"><input value={p.currency ?? "USD"} onChange={e => up("currency", e.target.value)} className={inputCls} /></Field>
          <Field label="Billing period"><input value={p.billing_period ?? "month"} onChange={e => up("billing_period", e.target.value)} className={inputCls} /></Field>
          <Field label="Sort order"><input type="number" value={p.sort_order ?? 0} onChange={e => up("sort_order", Number(e.target.value))} className={inputCls} /></Field>
          <Field label="RAM (GB)"><input type="number" step="0.5" value={p.ram_gb ?? ""} onChange={e => up("ram_gb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="CPU cores"><input type="number" step="0.5" value={p.cpu_cores ?? ""} onChange={e => up("cpu_cores", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="CPU label"><input value={p.cpu_label ?? ""} onChange={e => up("cpu_label", e.target.value)} className={inputCls} /></Field>
          <Field label="Storage (GB)"><input type="number" value={p.storage_gb ?? ""} onChange={e => up("storage_gb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Storage type"><input value={p.storage_type ?? ""} onChange={e => up("storage_type", e.target.value)} className={inputCls} /></Field>
          <Field label="Bandwidth (TB)"><input type="number" step="0.1" value={p.bandwidth_tb ?? ""} onChange={e => up("bandwidth_tb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Player slots"><input type="number" value={p.player_slots ?? ""} onChange={e => up("player_slots", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Location"><input value={p.location ?? ""} onChange={e => up("location", e.target.value)} className={inputCls} /></Field>
          <Field label="Badge"><input value={p.badge ?? ""} onChange={e => up("badge", e.target.value)} className={inputCls} placeholder="e.g. Popular" /></Field>
          <Field label="CTA label"><input value={p.cta_label ?? ""} onChange={e => up("cta_label", e.target.value)} className={inputCls} /></Field>
          <Field label="CTA URL"><input value={p.cta_url ?? ""} onChange={e => up("cta_url", e.target.value)} className={inputCls} placeholder="https://..." /></Field>
          <Field label="Features (one per line)" full>
            <textarea rows={5} value={featuresText} onChange={e => setFeaturesText(e.target.value)} className={`${inputCls} h-auto py-2`} />
          </Field>
          <Field label="Plan image" full>
            <ImageUploader value={p.image_url ?? null} onChange={url => up("image_url", url)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!p.is_active} onChange={e => up("is_active", e.target.checked)} /> Active (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!p.is_featured} onChange={e => up("is_featured", e.target.checked)} /> Featured
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-full border border-border hover:border-primary text-sm">Cancel</button>
          <button type="submit" className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" /> Save plan
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ImageUploader({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5 MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("plan-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) { setUploading(false); return alert(error.message); }
    const { data } = supabase.storage.from("plan-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="Plan" className="h-32 rounded-lg border border-border object-cover" />
          <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <label className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-dashed border-border hover:border-primary cursor-pointer text-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
