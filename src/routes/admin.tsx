import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Plus, Trash2, Save, LogOut, Shield, Star, Eye, EyeOff, Rocket, UserCog, Upload, Users, Crown, X } from "lucide-react";
import { changeMainAdmin, listAdmins, grantAdmin, revokeAdminUser, setAdminMainFlag, changeUserPassword, updateOwnAccount } from "@/lib/admin.functions";

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
  image_url: string | null;
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
  image_url: null,
  cta_url: "",
  sort_order: 0,
  is_active: true,
  is_featured: false,
});

function AdminPage() {
  const { user, isAdmin, isMainAdmin, isOwner, loading } = useAuth();
  const navigate = useNavigate();
  const changeAdminFn = useServerFn(changeMainAdmin);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<"all" | Plan["category"]>("all");
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [revokeSelf, setRevokeSelf] = useState(false);
  const [changing, setChanging] = useState(false);

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

  async function handleChangeAdmin(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      const res = await changeAdminFn({ data: { email: newAdminEmail, password: newAdminPassword, revokeCaller: revokeSelf } });
      toast.success(`Admin set to ${res.email}`);
      setNewAdminEmail("");
      setNewAdminPassword("");
      if (revokeSelf) {
        await supabase.auth.signOut();
        navigate({ to: "/auth" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to change admin");
    } finally {
      setChanging(false);
    }
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
            Signed in as {user.email}. Ask an existing admin to grant you access.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground block mx-auto"
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
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-4 border border-border" />
                )}
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

        {isOwner && <OwnerSelfAccount currentEmail={user.email ?? ""} />}

        {isOwner && (
          <section className="mt-16 card-3d rounded-3xl p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Change main admin</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Create or promote a main admin account. Only you (owner) can do this. Your owner access is never affected.
            </p>
            <form onSubmit={handleChangeAdmin} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Main admin email</label>
                  <input type="email" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className={`${inputCls} mt-1`} placeholder="main-admin@example.com" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
                  <input type="password" required minLength={6} value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={`${inputCls} mt-1`} placeholder="At least 6 characters" />
                </div>
              </div>
              <button disabled={changing} className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
                <Save className="w-4 h-4" /> {changing ? "Updating…" : "Set as main admin"}
              </button>
            </form>
          </section>
        )}

        {(isOwner || isMainAdmin) && <AdminsSection currentUserId={user.id} isOwner={isOwner} />}
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
          <Field label="Plan image" full>
            <ImageUploader value={p.image_url ?? null} onChange={(url) => up("image_url", url)} />
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

function ImageUploader({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("plan-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("plan-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Plan" className="h-32 rounded-lg border border-border object-cover" />
          <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}
      <label className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-dashed border-border hover:border-primary cursor-pointer text-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}

type AdminRow = { user_id: string; email: string | null; is_main: boolean; is_owner: boolean; created_at: string };

function AdminsSection({ currentUserId, isOwner }: { currentUserId: string; isOwner: boolean }) {
  const listFn = useServerFn(listAdmins);
  const grantFn = useServerFn(grantAdmin);
  const revokeFn = useServerFn(revokeAdminUser);
  const setMainFn = useServerFn(setAdminMainFlag);
  const changePwdFn = useServerFn(changeUserPassword);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [asMain, setAsMain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwdById, setPwdById] = useState<Record<string, string>>({});
  const [savingPwd, setSavingPwd] = useState<string | null>(null);

  const me = admins.find((a) => a.user_id === currentUserId);
  const iAmOwner = isOwner || !!me?.is_owner;
  const iAmMain = iAmOwner || !!me?.is_main;

  async function refresh() {
    setLoading(true);
    try {
      const res = await listFn();
      setAdmins(res.admins as AdminRow[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await grantFn({ data: { email, isMain: iAmOwner ? asMain : false } });
      toast.success(`Granted admin to ${email}`);
      setEmail("");
      setAsMain(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to grant admin");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm("Remove admin access for this user?")) return;
    try {
      await revokeFn({ data: { userId } });
      toast.success("Admin removed");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  async function toggleMain(userId: string, next: boolean) {
    try {
      await setMainFn({ data: { userId, isMain: next } });
      toast.success(next ? "Promoted to main admin" : "Demoted to admin");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  async function handleChangePwd(userId: string) {
    const password = (pwdById[userId] ?? "").trim();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPwd(userId);
    try {
      await changePwdFn({ data: { userId, password } });
      toast.success("Password updated");
      setPwdById((prev) => ({ ...prev, [userId]: "" }));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setSavingPwd(null);
    }
  }

  return (
    <section className="mt-10 card-3d rounded-3xl p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Admins & roles</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {iAmOwner
          ? "Grant admin access, promote main admins, and reset any admin's password."
          : "As a main admin you can grant regular admin access. Only the owner can promote to main admin or reset passwords."}
      </p>

      {iAmMain && (
        <form onSubmit={handleGrant} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end mb-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">User email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} placeholder="user@example.com" />
          </div>
          {iAmOwner ? (
            <label className="flex items-center gap-2 text-sm h-10">
              <input type="checkbox" checked={asMain} onChange={(e) => setAsMain(e.target.checked)} />
              Main admin
            </label>
          ) : <span />}
          <button disabled={submitting} className="h-10 px-5 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
            <Plus className="w-4 h-4" /> {submitting ? "Adding…" : "Add admin"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {admins.map((a) => (
            <li key={a.user_id} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.email ?? a.user_id}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-0.5">
                    {a.is_owner ? (
                      <span className="inline-flex items-center gap-1 text-primary"><Crown className="w-3 h-3" /> Owner</span>
                    ) : a.is_main ? (
                      <span className="inline-flex items-center gap-1 text-primary"><Crown className="w-3 h-3" /> Main admin</span>
                    ) : (
                      <span>Admin</span>
                    )}
                    {a.user_id === currentUserId && <span className="text-muted-foreground">• you</span>}
                  </div>
                </div>
                {iAmOwner && !a.is_owner && a.user_id !== currentUserId && (
                  <>
                    <button
                      onClick={() => toggleMain(a.user_id, !a.is_main)}
                      className="h-8 px-3 rounded-full text-xs border border-border hover:border-primary inline-flex items-center gap-1"
                      title={a.is_main ? "Demote to admin" : "Promote to main admin"}
                    >
                      <Crown className="w-3 h-3" /> {a.is_main ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => handleRevoke(a.user_id)}
                      className="h-8 w-8 rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10 grid place-items-center"
                      title="Remove admin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {iAmOwner && (
                <div className="flex gap-2 items-center pl-1">
                  <input
                    type="password"
                    placeholder="New password (min 6)"
                    value={pwdById[a.user_id] ?? ""}
                    onChange={(e) => setPwdById((prev) => ({ ...prev, [a.user_id]: e.target.value }))}
                    className={`${inputCls} h-9 text-xs flex-1`}
                  />
                  <button
                    onClick={() => handleChangePwd(a.user_id)}
                    disabled={savingPwd === a.user_id}
                    className="h-9 px-3 rounded-full text-xs border border-border hover:border-primary inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    <Save className="w-3 h-3" /> {savingPwd === a.user_id ? "Saving…" : "Set password"}
                  </button>
                </div>
              )}
            </li>
          ))}
          {admins.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">No admins yet.</li>
          )}
        </ul>
      )}
    </section>
  );
}

// ─── FIXED: OwnerSelfAccount ────────────────────────────────────────────────
// Bug: after updateUserById changes the email server-side, Supabase invalidates
// the old session token. Any subsequent server function call fails auth because
// the middleware (requireSupabaseAuth) rejects the stale bearer token.
// Fix: call refreshSession() after the update. If it fails (email change
// invalidates the session), sign out gracefully and prompt re-login.
function OwnerSelfAccount({ currentEmail }: { currentEmail: string }) {
  const navigate = useNavigate();
  const updateFn = useServerFn(updateOwnAccount);
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const emailChanged = email.trim() !== "" && email.trim() !== currentEmail;
    const pwdChanged = password.length > 0;
    if (!emailChanged && !pwdChanged) { toast.error("Change email or password first"); return; }
    if (pwdChanged && password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      await updateFn({ data: {
        ...(emailChanged ? { email: email.trim() } : {}),
        ...(pwdChanged ? { password } : {}),
      } });

      // Refresh the local session so the stored token matches the new credentials.
      // Without this the old bearer token is rejected by requireSupabaseAuth on
      // the very next server function call, producing "error updating user".
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Email change causes Supabase to invalidate the session entirely.
        // Sign out cleanly and let the owner log in with their new credentials.
        await supabase.auth.signOut();
        toast.success("Credentials updated — please sign in again with your new details.");
        navigate({ to: "/auth" });
        return;
      }

      toast.success(emailChanged ? "Account updated — sign in with the new email next time" : "Password updated");
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update account");
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
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">New password</label>
            <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-1`} placeholder="Leave blank to keep current" />
          </div>
        </div>
        <button disabled={saving} className="h-11 px-6 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark inline-flex items-center gap-2 text-sm disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Update my account"}
        </button>
      </form>
    </section>
  );
}
