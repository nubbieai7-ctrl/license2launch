import { createContext, useContext } from "react";
import type { Identity } from "~/server/auth";

/** Provides the current logged-in user (or null) to any component in the app. */
export const UserCtx = createContext<Identity | null>(null);

export function useUser(): Identity | null {
  return useContext(UserCtx);
}
