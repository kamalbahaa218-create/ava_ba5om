import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UserType = Database["public"]["Enums"]["user_type"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const USER_TYPE_LABEL: Record<UserType, string> = {
  STUDENT: "مخدوم",
  SERVANT: "خادم",
  MAIN_ADMIN: "المسؤول الرئيسي",
};

export function homePathFor(type: UserType | undefined) {
  if (type === "MAIN_ADMIN") return "/admin" as const;
  if (type === "SERVANT") return "/servant" as const;
  return "/student" as const;
}

/** Client-side session (UI only; data access is enforced by the database). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Permission names granted to the user (MAIN_ADMIN implicitly has all). */
export function useMyPermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-permissions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permissions(name, description)")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.permissions).filter(Boolean) as {
        name: string;
        description: string | null;
      }[];
    },
  });
}
