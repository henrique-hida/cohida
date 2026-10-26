import type { ReactNode } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { AccountSwitcher } from "@/components/shared/AccountSwitcher";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SavedAccount } from "@/lib/customerApi";

interface AccountMenuProps {
  ariaLabel: string;
  accountName?: string | null;
  accounts?: SavedAccount[];
  showAddAccount?: boolean;
  children: ReactNode;
  onSwitchAccount?: (token: string) => void;
  trigger: ReactNode;
  triggerClassName?: string;
}

export function AccountMenu({
  ariaLabel,
  accountName,
  accounts = [],
  showAddAccount = false,
  children,
  onSwitchAccount,
  trigger,
  triggerClassName,
}: AccountMenuProps) {
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={ariaLabel}
            className={triggerClassName}
            size="icon"
            variant="outline"
          />
        }
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-1 p-2">
        {accountName ? (
          <>
            <p className="px-2 pt-1 font-medium">{accountName}</p>
            <div aria-hidden="true" className="my-1 border-b border-border" />
          </>
        ) : null}
        {onSwitchAccount ? (
          <AccountSwitcher
            accounts={accounts}
            onAddAccount={
              showAddAccount ? () => navigate("/entrar") : undefined
            }
            onSwitchAccount={onSwitchAccount}
          />
        ) : null}
        {children}
      </PopoverContent>
    </Popover>
  );
}
