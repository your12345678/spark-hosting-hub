import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin(uid: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    }

    async function hydrate(s: Session | null) {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await checkAdmin(s.user.id);
      } else {
        setIsAdmin(false);
      }
      if (!cancelled) setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      // Defer to avoid deadlocks with supabase internal locks
      setTimeout(() => { if (!cancelled) hydrate(s); }, 0);
    });

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    // Safety fallback so UI never gets stuck on "Loading…"
    const timer = setTimeout(() => { if (!cancelled) setLoading(false); }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, loading };
}
