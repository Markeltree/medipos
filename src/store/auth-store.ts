"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StaffMember } from "@/types";

interface AuthState {
  token: string | null;
  user: StaffMember | null;
  setSession: (token: string, user: StaffMember) => void;
  setUser: (user: StaffMember) => void;
  logout: () => void;
}

/** The signed-in staff member and their API token, kept in localStorage across reloads. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "medipos-auth", storage: createJSONStorage(() => localStorage) },
  ),
);

export function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
