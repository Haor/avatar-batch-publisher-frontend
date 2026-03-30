import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AccountSummary } from "../contracts/accounts";
import { useApi } from "./ApiContext";
import { useConnection } from "./ConnectionContext";
import { useQuery } from "../shared/hooks/useQuery";

interface AccountsContextValue {
  accounts: AccountSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  defaultAccount: AccountSummary | null;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

const EMPTY_ACCOUNTS: AccountSummary[] = [];

export function AccountsProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { refreshKey } = useConnection();
  const { data, loading, error, refetch } = useQuery(
    (signal) => api.accounts.list(signal),
    [refreshKey],
  );

  const accounts = data?.items ?? EMPTY_ACCOUNTS;
  const defaultAccount = useMemo(
    () => accounts.find((a) => a.isDefault) ?? accounts[0] ?? null,
    [accounts],
  );

  const value = useMemo<AccountsContextValue>(
    () => ({ accounts, loading, error, refetch, defaultAccount }),
    [accounts, loading, error, refetch, defaultAccount],
  );

  return <AccountsContext value={value}>{children}</AccountsContext>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
