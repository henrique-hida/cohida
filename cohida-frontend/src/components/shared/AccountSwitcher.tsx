import { ArrowLeftRight, UserPlus } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import type { SavedAccount } from "@/lib/customerApi";

const addAccountValue = "__add_account__";

interface AccountSwitcherProps {
  accounts: SavedAccount[];
  onAddAccount?: () => void;
  onSwitchAccount: (token: string) => void;
}

export function AccountSwitcher({
  accounts,
  onAddAccount,
  onSwitchAccount,
}: AccountSwitcherProps) {
  if (accounts.length < 2 && !onAddAccount) return null;

  return (
    <Select
      onValueChange={(token) => {
        if (typeof token !== "string") return;
        if (token === addAccountValue) {
          onAddAccount?.();
          return;
        }
        onSwitchAccount(token);
      }}
    >
      <SelectTrigger className="h-9 w-full border-0 px-2 shadow-none hover:bg-accent">
        {accounts.length < 2 ? (
          <UserPlus className="text-foreground" />
        ) : (
          <ArrowLeftRight className="text-foreground" />
        )}
        <span className="flex-1 text-left text-foreground">
          {accounts.length < 2 ? "Adicionar conta" : "Alternar conta"}
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="p-2">
        {accounts.map((account) => (
          <SelectItem
            className="px-3 py-2.5"
            key={account.token}
            value={account.token}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate">{account.name}</span>
              {account.token === localStorage.getItem("cohida-access-token") ? (
                <span
                  aria-label="Conta atual"
                  className="size-2 shrink-0 rounded-full bg-primary"
                  title="Conta atual"
                />
              ) : null}
            </span>
          </SelectItem>
        ))}
        {onAddAccount ? (
          <>
            {accounts.length ? <SelectSeparator className="my-1" /> : null}
            <SelectItem
              className="px-3 py-2.5 text-muted-foreground"
              value={addAccountValue}
            >
              <UserPlus className="text-muted-foreground" />
              Adicionar outra conta
            </SelectItem>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}
