import { X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterSelectOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  ariaLabel: string;
  className?: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  value: string;
}

export function FilterSelect({
  ariaLabel,
  className,
  onValueChange,
  options,
  placeholder,
  value,
}: FilterSelectProps) {
  return (
    <div className={`flex min-w-0 items-center gap-1 ${className ?? ""}`}>
      <Select
        onValueChange={(nextValue) =>
          onValueChange(typeof nextValue === "string" ? nextValue : "")
        }
        value={value || null}
      >
        <SelectTrigger
          aria-label={ariaLabel}
          className="h-10 min-w-32 flex-1 bg-background data-[placeholder]:text-muted-foreground data-[size=default]:h-10"
        >
          <SelectValue placeholder={placeholder}>
            {value
              ? (options.find((option) => option.value === value)?.label ??
                placeholder)
              : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="p-1">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value ? (
        <button
          aria-label={`Limpar ${ariaLabel.replace(/^filtrar\s+/i, "").toLocaleLowerCase("pt-BR")}`}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          onClick={() => onValueChange("")}
          title="Limpar filtro"
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
