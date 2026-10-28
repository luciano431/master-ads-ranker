import type { Account, AdRow } from "./types";
import { MOCK_ACCOUNTS, mockAds } from "./mock";

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || !URL_BASE || !ANON_KEY;

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${URL_BASE}/functions/v1/creative-analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY!,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);
  return data as T;
}

export async function fetchAccounts(): Promise<Account[]> {
  if (USE_MOCK) return MOCK_ACCOUNTS;
  const { accounts } = await call<{ accounts: Account[] }>({ mode: "accounts" });
  return accounts;
}

export async function fetchAds(accountId: string, since: string, until: string, days: number): Promise<AdRow[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockAds(accountId, days);
  }
  const { ads } = await call<{ ads: AdRow[] }>({ mode: "ads", account_id: accountId, since, until });
  return ads;
}
