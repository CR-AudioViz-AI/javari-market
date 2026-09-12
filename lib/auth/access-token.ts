// lib/auth/access-token.ts
// Purpose: the signed-in person's access token. Embedded in craudiovizai.com it is the
//   PLATFORM session handed over by the parent page; opened directly it is this app's
//   own supabase-js session.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
"use client";

import { createClient } from "@/lib/supabase/client";
import { isEmbedded, parentAccessToken, postToParent } from "@craudioviz/platform-sdk";

export async function getAccessToken(): Promise<string | null> {
  if (isEmbedded()) return parentAccessToken();
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Send a signed-out visitor to the platform sign-in and bring them back here. */
export function signIn(path: string): void {
  if (isEmbedded()) {
    postToParent({ type: "login", path });
    return;
  }
  window.location.href = `https://craudiovizai.com/login?redirect=${encodeURIComponent(`https://craudiovizai.com/apps/market${path === "/" ? "" : path}`)}`;
}
