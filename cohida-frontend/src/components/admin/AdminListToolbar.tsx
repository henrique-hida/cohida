import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

interface AdminListToolbarProps {
  children?: ReactNode;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
}

export function AdminListToolbar({
  children,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  searchValue,
}: AdminListToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
      <label className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          aria-label={searchLabel}
          className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="text"
          value={searchValue}
        />
        {searchValue ? (
          <button
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onSearchChange("")}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </label>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
