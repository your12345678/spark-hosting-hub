import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { bootstrapDefaultAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — SparkHosting" }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapDefaultAdmin);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Idempotently ensure the default admin@gmail.com / admin123 account exists
    bootstrap().catch(() => { /* ignore */ });
  }, [bootstrap]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 grid-bg">
      <div className="w-full max-w-md card-3d rounded-3xl p-10">
        <Link to="/" className="flex items-center gap-2 mb-8 text-sm text-muted-foreground hover:text-foreground">
          <Rocket className="w-4 h-4 text-primary" /> SparkHosting
        </Link>
        <h1 className="text-3xl font-bold mb-2">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "login" ? "Sign in to manage your plans." : "Sign up to access the admin panel."}
        </p>
        <div className="mb-6 text-xs rounded-lg border border-primary/30 bg-primary/5 p-3 text-muted-foreground">
          <span className="text-primary font-semibold">Default admin:</span>
          <span> admin@gmail.com / admin123. Change the email and password from the admin panel after signing in.</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Password</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none"
            />
          </div>
          <button disabled={loading} className="w-full h-12 rounded-full font-semibold bg-gradient-spark text-primary-foreground shadow-spark hover:scale-[1.02] transition disabled:opacity-60">
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-6 text-sm text-muted-foreground hover:text-foreground w-full text-center">
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
