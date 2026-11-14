"use client";

import type { Profile } from "@finny/shared";
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type AdminAuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "notAdmin" }
  | { status: "ready"; profile: Profile };

type AdminAuthValue = {
  state: AdminAuthState;
  /** Returns an error message to show, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ status: "loading" });
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => setUserId(data.session?.user.id ?? null));
    // Keep this callback synchronous: calling Supabase inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUserId(session?.user.id ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    let alive = true;
    if (userId === null) {
      queueMicrotask(() => alive && setState({ status: "signedOut" }));
      return () => {
        alive = false;
      };
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        // The UI check is a convenience. A non-admin who skipped it would
        // still get nothing: the database refuses every admin read and action.
        setState(
          data?.role === "admin"
            ? { status: "ready", profile: data }
            : { status: "notAdmin" },
        );
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const value: AdminAuthValue = {
    state,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error) return null;
      return error.code === "invalid_credentials"
        ? "Wrong email or password."
        : "Couldn't sign in. Try again.";
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AdminAuthContext value={value}>{children}</AdminAuthContext>;
}

export function useAdminAuth(): AdminAuthValue {
  const value = use(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}
