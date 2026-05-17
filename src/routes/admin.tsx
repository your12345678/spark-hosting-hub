import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Trash2, Save, LogOut, Shield, Star, Eye, EyeOff, Rocket, UserCog } from "lucide-react";
import { changeMainAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — SparkHosting" }] }),
});

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
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
};

const CATEGORIES: Plan["category"][] = ["minecraft", "budget", "paid", "premium", "vps"];

const emptyPlan = (): Partial<Plan> => ({
  category: "minecraft",
  name: "New plan",
  tagline: "",
  price_cents: 999,
  currency: "USD",
  billing_period: "month",
  ram_gb: 4,
  cpu_cores: 2,
  cpu_label: "",
  storage_gb: 50,
  storage_type: "NVMe SSD",
  bandwidth_tb: null,
  player_slots: null,
  location: "",
  features: [],
  badge: "",
  cta_label: "Order now",
  cta_url: "",
  sort_order: 0,
  is_active: true,
  is_featured: false,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<"all" | Plan["category"]>("all");
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  async function refresh() {
    setFetching(true);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("category")
      .order("sort_order");
    if (error) toast.error(error.message);
    else setPlans((data ?? []) as any);
    setFetching(false);
  }

  async function claimAdmin() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("You are now admin. Reloading…");
      setTimeout(() => location.reload(), 600);
    } else {
      toast.error("An admin already exists. Ask them to grant you access.");
    }
  }

  async function save(p: Partial<Plan>) {
    const payload = {
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      price_cents: Number(p.price_cents ?? 0),
      sort_order: Number(p.sort_order ?? 0),
    };
    if (p.id) {
      const { error } = await supabase.from("plans").update(payload as any).eq("id", p.id);
      if (error) return toast.error(error.message);
      toast.success("Plan updated");
    } else {
      const { error } = await supabase.from("plans").insert(payload as any);
      if (error) return toast.error(error.message);
      toast.success("Plan created");
    }
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  async function toggleField(id: string, field: "is_active" | "is_featured", value: boolean) {
    const { error } = await supabase.from("plans").update({ [field]: value } as any).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  const filtered = useMemo(
    () => (filter === "all" ? plans : plans.filter((p) => p.category === filter)),
    [plans, filter],
  );

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="card-3d rounded-3xl p-10 max-w-md text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Signed in as {user.email}. If you are the site owner, claim the first admin role below.
          </p>
          <button
            onClick={claimAdmin}
            disabled={claiming}
            className="h-12 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark hover:scale-[1.02] transition disabled:opacity-60"
          >
            {claiming ? "Claiming…" : "Claim first admin"}
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground block mx-auto"
          >Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <Rocket className="w-5 h-5 text-primary" />
            Spark<span className="text-gradient-spark">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">View site</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
              className="h-9 px-4 rounded-full text-sm font-medium border border-border hover:border-primary inline-flex items-center gap-2"
            >
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
          <button
            onClick={() => setEditing(emptyPlan())}
            className="h-11 px-5 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New plan
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c as any)}
              className={`px-4 h-9 rounded-full text-xs uppercase tracking-widest border transition ${
                filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
              }`}
            >{c}</button>
          ))}
        </div>

        {fetching ? (
          <div className="text-muted-foreground text-sm">Loading plans…</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <div key={p.id} className="card-3d rounded-2xl p-6 relative">
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
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-12">No plans yet.</div>
            )}
          </div>
        )}
      </main>

      {editing && <PlanEditor initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function PlanEditor({
  initial, onClose, onSave,
}: {
  initial: Partial<Plan>;
  onClose: () => void;
  onSave: (p: Partial<Plan>) => void;
}) {
  const [p, setP] = useState<Partial<Plan>>(initial);
  const [featuresText, setFeaturesText] = useState((initial.features ?? []).join("\n"));

  function up<K extends keyof Plan>(k: K, v: any) { setP((prev) => ({ ...prev, [k]: v })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...p,
      features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="card-3d rounded-3xl p-8 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{p.id ? "Edit plan" : "New plan"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={p.category} onChange={(e) => up("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Name"><input required value={p.name ?? ""} onChange={(e) => up("name", e.target.value)} className={inputCls} /></Field>
          <Field label="Tagline" full><input value={p.tagline ?? ""} onChange={(e) => up("tagline", e.target.value)} className={inputCls} /></Field>
          <Field label="Price (cents)"><input type="number" min={0} value={p.price_cents ?? 0} onChange={(e) => up("price_cents", Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Currency"><input value={p.currency ?? "USD"} onChange={(e) => up("currency", e.target.value)} className={inputCls} /></Field>
          <Field label="Billing period"><input value={p.billing_period ?? "month"} onChange={(e) => up("billing_period", e.target.value)} className={inputCls} /></Field>
          <Field label="Sort order"><input type="number" value={p.sort_order ?? 0} onChange={(e) => up("sort_order", Number(e.target.value))} className={inputCls} /></Field>
          <Field label="RAM (GB)"><input type="number" step="0.5" value={p.ram_gb ?? ""} onChange={(e) => up("ram_gb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="CPU cores"><input type="number" step="0.5" value={p.cpu_cores ?? ""} onChange={(e) => up("cpu_cores", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="CPU label"><input value={p.cpu_label ?? ""} onChange={(e) => up("cpu_label", e.target.value)} className={inputCls} /></Field>
          <Field label="Storage (GB)"><input type="number" value={p.storage_gb ?? ""} onChange={(e) => up("storage_gb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Storage type"><input value={p.storage_type ?? ""} onChange={(e) => up("storage_type", e.target.value)} className={inputCls} /></Field>
          <Field label="Bandwidth (TB)"><input type="number" step="0.1" value={p.bandwidth_tb ?? ""} onChange={(e) => up("bandwidth_tb", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Player slots"><input type="number" value={p.player_slots ?? ""} onChange={(e) => up("player_slots", e.target.value === "" ? null : Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Location"><input value={p.location ?? ""} onChange={(e) => up("location", e.target.value)} className={inputCls} /></Field>
          <Field label="Badge"><input value={p.badge ?? ""} onChange={(e) => up("badge", e.target.value)} className={inputCls} placeholder="e.g. Popular" /></Field>
          <Field label="CTA label"><input value={p.cta_label ?? ""} onChange={(e) => up("cta_label", e.target.value)} className={inputCls} /></Field>
          <Field label="CTA URL"><input value={p.cta_url ?? ""} onChange={(e) => up("cta_url", e.target.value)} className={inputCls} placeholder="https://..." /></Field>
          <Field label="Features (one per line)" full>
            <textarea rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} className={`${inputCls} h-auto py-2`} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!p.is_active} onChange={(e) => up("is_active", e.target.checked)} /> Active (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!p.is_featured} onChange={(e) => up("is_featured", e.target.checked)} /> Featured
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

const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
