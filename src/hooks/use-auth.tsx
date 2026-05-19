import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin(uid: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role, is_main, is_owner")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(!!data);
        setIsMainAdmin(!!(data as any)?.is_main);
        setIsOwner(!!(data as any)?.is_owner);
      }
    }

    async function hydrate(s: Session | null) {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await checkAdmin(s.user.id);
      } else {
        setIsAdmin(false);
        setIsMainAdmin(false);
        setIsOwner(false);
      }
      if (!cancelled) setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => { if (!cancelled) hydrate(s); }, 0);
    });

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    const timer = setTimeout(() => { if (!cancelled) setLoading(false); }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, isMainAdmin, isOwner, loading };
}
