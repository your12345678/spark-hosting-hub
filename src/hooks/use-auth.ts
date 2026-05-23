import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = {
  role: string;
  is_main: boolean;
  is_owner: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkRole(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, is_main, is_owner")
      .eq("user_id", userId)
      .maybeSingle();

    const r = data as UserRole | null;
    setIsAdmin(r?.role === "admin");
    setIsMainAdmin(r?.role === "admin" && (r?.is_main ?? false));
    setIsOwner(r?.role === "admin" && (r?.is_owner ?? false));
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkRole(session.user.id);
      else {
        setIsAdmin(false);
        setIsMainAdmin(false);
        setIsOwner(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAdmin, isMainAdmin, isOwner, loading };
}
