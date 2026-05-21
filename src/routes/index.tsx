import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/sparkhosting-logo.png";
import hero3d from "@/assets/hero-3d.jpg";
import server3d from "@/assets/server-3d.png";
import minecraft3d from "@/assets/minecraft-3d.png";
import vps3d from "@/assets/vps-3d.png";
import { Cpu, HardDrive, Zap, Shield, Globe, Headphones, Check, Rocket, Server, Gamepad2, Settings } from "lucide-react";

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
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "INR" ? "₹" : `${currency} `;
  return `${sym}${(cents / 100).toFixed(2)}`;
}

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SparkHosting — Premium Game & Cloud Hosting" },
      { name: "description", content: "Blazing-fast Minecraft, VPS and KVM hosting powered by NVMe storage, AMD Ryzen and 24/7 expert support." },
    ],
  }),
});

const nav = ["Home", "Minecraft", "VPS", "KVM", "Pricing", "Reviews"];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "12ms", label: "Avg Latency" },
  { value: "8k+", label: "Active Servers" },
  { value: "24/7", label: "Live Support" },
];

const features = [
  { icon: Cpu, title: "AMD Ryzen 9", desc: "Latest-gen 5.7GHz cores for unmatched single-thread performance." },
  { icon: HardDrive, title: "NVMe Gen4", desc: "Up to 7,000 MB/s read speeds. Worlds load before you blink." },
  { icon: Shield, title: "DDoS Shielded", desc: "Enterprise 2 Tbps mitigation network protecting every node." },
  { icon: Globe, title: "Global Edge", desc: "14 datacenter locations across 4 continents, anycast routing." },
  { icon: Zap, title: "Instant Deploy", desc: "Server provisioned and online in under 60 seconds." },
  { icon: Headphones, title: "Expert Support", desc: "Real engineers, real fast — average reply under 4 minutes." },
];

const minecraftPlans = [
  {
    name: "Ignite",
    tag: "Starter",
    price: "₹149",
    ram: "4 GB",
    cpu: "200% Ryzen",
    storage: "30 GB NVMe",
    slots: "Up to 20 players",
    features: ["Modpack support", "Free subdomain", "Daily backups"],
  },
  {
    name: "Blaze",
    tag: "Most Popular",
    popular: true,
    price: "₹349",
    ram: "8 GB",
    cpu: "400% Ryzen",
    storage: "80 GB NVMe",
    slots: "Up to 80 players",
    features: ["All Ignite features", "Free dedicated IP", "Priority support", "Plugin auto-installer"],
  },
  {
    name: "Inferno",
    tag: "Pro",
    price: "₹799",
    ram: "16 GB",
    cpu: "Unlimited Ryzen",
    storage: "200 GB NVMe",
    slots: "Unlimited players",
    features: ["All Blaze features", "Multi-server panel", "Dedicated node", "Custom JAR upload"],
  },
];

const vpsPlans = [
  { name: "Spark VPS 2", price: "₹399", ram: "4 GB", cpu: "2 vCPU", storage: "60 GB NVMe", bw: "2 TB" },
  { name: "Spark VPS 4", price: "₹799", ram: "8 GB", cpu: "4 vCPU", storage: "120 GB NVMe", bw: "5 TB" },
  { name: "Spark VPS 8", price: "₹1,499", ram: "16 GB", cpu: "8 vCPU", storage: "240 GB NVMe", bw: "10 TB" },
  { name: "Spark VPS 16", price: "₹2,899", ram: "32 GB", cpu: "16 vCPU", storage: "480 GB NVMe", bw: "20 TB" },
];

function Wordmark({ size = "text-lg" }: { size?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-spark p-[2px] shadow-spark transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]">
        <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
          <img
            src={logo}
            alt="SparkHosting"
            className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]"
          />
        </div>
      </div>
      <div className="leading-tight">
        <div className={`font-display font-bold ${size} tracking-tight`}>
          Spark<span className="text-gradient-spark">Hosting</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-primary">System Active</div>
      </div>
    </Link>
  );
}

function Index() {
  const { user, isAdmin } = useAuth();
  const [plans, setPlans] = useState<DbPlan[]>([]);

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data ?? []) as any));
  }, []);

  const minecraftPlans = plans.filter((p) => p.category === "minecraft");
  const vpsPlans = plans.filter((p) => p.category !== "minecraft");
  return (
    <div className="min-h-screen text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <Wordmark />
          <nav className="hidden lg:flex items-center gap-8 text-sm text-muted-foreground">
            {nav.map((n) => (
              <a key={n} href={`#${n.toLowerCase()}`} className="hover:text-foreground transition-colors">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="hidden sm:inline-flex h-10 px-4 rounded-full text-sm font-medium border border-primary/40 text-primary hover:bg-primary/10 transition items-center gap-1.5">
                <Settings className="w-4 h-4" /> Admin
              </Link>
            )}
            <Link to="/auth" className="hidden sm:inline-flex h-10 px-5 rounded-full text-sm font-medium border border-border hover:border-primary transition items-center">
              {user ? "Account" : "Login"}
            </Link>
            <a href="#minecraft" className="h-10 px-5 rounded-full text-sm font-semibold bg-gradient-spark text-primary-foreground shadow-spark hover:scale-105 transition inline-flex items-center">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs uppercase tracking-widest text-primary mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by NVMe Gen4
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] mb-6">
              Hosting that <br />
              <span className="text-gradient-spark">ignites</span> performance.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-10">
              Premium Minecraft, VPS and dedicated infrastructure built on AMD Ryzen, NVMe storage and a 2 Tbps protected network.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <button className="h-14 px-8 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark hover:scale-105 transition flex items-center gap-2">
                <Rocket className="w-5 h-5" /> Deploy in 60s
              </button>
              <button className="h-14 px-8 rounded-full font-semibold border border-border bg-card/50 backdrop-blur hover:border-primary transition">
                View Plans
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-lg">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl md:text-3xl font-bold text-gradient-spark">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D server showcase */}
          <div className="relative h-[520px] flex items-center justify-center perspective-scene">
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden card-3d">
              <img src={hero3d} alt="" className="w-full h-full object-cover opacity-40" width={1536} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
            {/* glowing platform under the rack */}
            <div className="absolute bottom-12 w-[340px] h-[340px] rounded-full bg-gradient-spark opacity-30 blur-3xl" />
            <div className="absolute bottom-16 w-[280px] h-6 rounded-[50%] bg-primary/40 blur-2xl" />

            <img
              src={server3d}
              alt="3D server rack"
              width={1024}
              height={1024}
              className="relative z-10 w-[440px] h-[440px] object-contain animate-pulse-glow"
              style={{ transform: "rotateX(6deg) rotateY(-10deg)", transformStyle: "preserve-3d" }}
            />
            {/* Orbit rings */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="w-[420px] h-[420px] rounded-full border border-primary/20 animate-[spin_40s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="w-[560px] h-[560px] rounded-full border border-primary/10 animate-[spin_60s_linear_reverse_infinite]" />
            </div>

            {/* Orbiting 3D accents */}
            {[
              { Icon: Cpu, r: 210, dur: 18, delay: 0, dir: "normal" },
              { Icon: Shield, r: 210, dur: 18, delay: -6, dir: "normal" },
              { Icon: Zap, r: 210, dur: 18, delay: -12, dir: "normal" },
              { Icon: Globe, r: 280, dur: 28, delay: -4, dir: "reverse" },
              { Icon: HardDrive, r: 280, dur: 28, delay: -18, dir: "reverse" },
            ].map(({ Icon, r, dur, delay, dir }, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 z-30 pointer-events-none"
                style={{
                  width: 0,
                  height: 0,
                  ["--orbit-r" as string]: `${r}px`,
                  animation: `orbit ${dur}s linear infinite ${dir}`,
                  animationDelay: `${delay}s`,
                }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl glass-pane grid place-items-center shadow-spark">
                  <Icon className="w-6 h-6 text-primary drop-shadow-[0_0_10px_rgba(217,70,239,0.9)]" />
                </div>
              </div>
            ))}

            {/* Foreground 3D blocks */}
            <img
              src={minecraft3d}
              alt=""
              width={1024}
              height={1024}
              loading="lazy"
              className="absolute z-40 w-32 h-32 object-contain bottom-0 -left-2 animate-float-tilt drop-shadow-[0_20px_40px_rgba(217,70,239,0.55)]"
              style={{ animationDelay: "1s" }}
            />
            <img
              src={vps3d}
              alt=""
              width={1024}
              height={1024}
              loading="lazy"
              className="absolute z-40 w-32 h-32 object-contain top-0 -right-2 animate-float drop-shadow-[0_20px_40px_rgba(217,70,239,0.55)]"
              style={{ animationDelay: "2s" }}
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-primary mb-4">Infrastructure</div>
          <h2 className="text-4xl md:text-5xl font-bold">Built for <span className="text-gradient-spark">speed obsessed</span> communities.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card-3d rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-gradient-spark grid place-items-center shadow-spark mb-5">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MINECRAFT PLANS */}
      <section id="minecraft" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-[1fr_auto] items-end gap-10 mb-14">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary mb-3 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Minecraft Hosting
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">Pick your <span className="text-gradient-spark">realm</span>.</h2>
            <p className="text-muted-foreground max-w-md mt-4">All plans include unlimited NVMe SSD bandwidth, free modpack installer, and instant setup.</p>
          </div>
          <img
            src={minecraft3d}
            alt="3D Minecraft block"
            width={1024}
            height={1024}
            loading="lazy"
            className="w-48 h-48 object-contain animate-float drop-shadow-[0_20px_40px_rgba(217,70,239,0.5)] hidden lg:block"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {minecraftPlans.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground text-sm py-10">
              No Minecraft plans yet. Add some from the admin panel.
            </div>
          )}
          {minecraftPlans.map((p) => (
            <div
              key={p.id}
              className={`card-3d rounded-3xl p-8 relative ${p.is_featured ? "glow-ring" : ""}`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-spark text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-spark">
                  {p.badge}
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.tagline}</div>
                <img src={minecraft3d} alt="" width={1024} height={1024} loading="lazy" className="w-14 h-14 object-contain" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-gradient-spark">{formatPrice(p.price_cents, p.currency)}</span>
                <span className="text-sm text-muted-foreground">/{p.billing_period}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {p.ram_gb != null && <li className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Memory</span><span className="font-semibold">{p.ram_gb} GB</span></li>}
                {p.cpu_cores != null && <li className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">CPU</span><span className="font-semibold">{p.cpu_cores} cores{p.cpu_label ? ` (${p.cpu_label})` : ""}</span></li>}
                {p.storage_gb != null && <li className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Storage</span><span className="font-semibold">{p.storage_gb} GB {p.storage_type ?? ""}</span></li>}
                {p.player_slots != null && <li className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Slots</span><span className="font-semibold">{p.player_slots} players</span></li>}
              </ul>
              <ul className="space-y-2 mb-8">
                {(p.features ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a href={p.cta_url ?? "#"} className={`w-full h-12 rounded-full font-semibold transition flex items-center justify-center ${p.is_featured ? "bg-gradient-spark text-primary-foreground shadow-spark hover:scale-[1.02]" : "border border-border hover:border-primary"}`}>
                {p.cta_label ?? `Deploy ${p.name}`}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* VPS PLANS */}
      <section id="vps" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-[auto_1fr] items-end gap-10 mb-14">
          <img
            src={vps3d}
            alt="3D VPS chip"
            width={1024}
            height={1024}
            loading="lazy"
            className="w-48 h-48 object-contain animate-float drop-shadow-[0_20px_40px_rgba(217,70,239,0.5)] hidden lg:block"
          />
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary mb-3 flex items-center gap-2">
              <Server className="w-4 h-4" /> Cloud VPS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">Scalable <span className="text-gradient-spark">virtual servers</span>.</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {vpsPlans.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground text-sm py-10">
              No VPS plans yet. Add some from the admin panel.
            </div>
          )}
          {vpsPlans.map((v) => (
            <div key={v.id} className="card-3d rounded-2xl p-6 relative overflow-hidden">
              <img src={vps3d} alt="" width={1024} height={1024} loading="lazy" className="absolute -right-6 -top-6 w-28 h-28 object-contain opacity-40" />
              <div className="text-xs uppercase tracking-widest text-primary mb-2 relative flex items-center gap-2">
                {v.name}
                {v.badge && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-[9px]">{v.badge}</span>}
              </div>
              <div className="flex items-baseline gap-1 mb-6 relative">
                <span className="text-3xl font-bold">{formatPrice(v.price_cents, v.currency)}</span>
                <span className="text-xs text-muted-foreground">/{v.billing_period}</span>
              </div>
              <div className="space-y-3 text-sm relative">
                {v.ram_gb != null && <Row label="RAM" value={`${v.ram_gb} GB`} />}
                {v.cpu_cores != null && <Row label="CPU" value={`${v.cpu_cores} vCPU`} />}
                {v.storage_gb != null && <Row label="Storage" value={`${v.storage_gb} GB ${v.storage_type ?? ""}`} />}
                {v.bandwidth_tb != null && <Row label="Bandwidth" value={`${v.bandwidth_tb} TB`} />}
              </div>
              <a href={v.cta_url ?? "#"} className="mt-6 w-full h-11 rounded-full text-sm font-semibold border border-border hover:border-primary hover:bg-primary/5 transition relative flex items-center justify-center">
                {v.cta_label ?? "Configure"}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="card-3d rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
          <img src={server3d} alt="" width={1024} height={1024} loading="lazy" className="absolute -right-16 -top-10 w-[360px] opacity-30 blur-[1px] animate-float" />
          <img src={minecraft3d} alt="" width={1024} height={1024} loading="lazy" className="absolute -left-10 bottom-0 w-40 opacity-50 animate-float" style={{ animationDelay: "1.5s" }} />
          <h2 className="text-4xl md:text-6xl font-bold mb-6 relative">Ready to <span className="text-gradient-spark">spark</span> your server?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 relative">Join 8,000+ creators running their worlds on SparkHosting infrastructure.</p>
          <button className="relative h-14 px-10 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark hover:scale-105 transition inline-flex items-center gap-2">
            <Rocket className="w-5 h-5" /> Launch Your Server
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Wordmark size="text-base" />
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Status</a>
            <a href="#" className="hover:text-foreground">Discord</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
          <div>© {new Date().getFullYear()} SparkHosting. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
