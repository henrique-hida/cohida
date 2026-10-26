import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Category } from "@/types";
import { Check, ChevronDown, X } from "lucide-react";

interface AdminCategoryMultiSelectProps {
  ariaLabel?: string;
  categories: Category[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  showSelectedBadges?: boolean;
  values: string[];
}

export function AdminCategoryMultiSelect({
  ariaLabel = "Filtrar análises por categoria",
  categories,
  onValueChange,
  placeholder = "Categoria",
  showSelectedBadges = false,
  values,
}: AdminCategoryMultiSelectProps) {
  const selectedCategories = categories.filter((category) =>
    values.includes(category.id),
  );
  const selectedNames = selectedCategories.map((category) => category.name);
  const label =
    selectedNames.length === 0
      ? placeholder
      : selectedNames.length === 1
        ? selectedNames[0]
        : `${selectedNames.length} categorias selecionadas`;

  function toggleCategory(id: string) {
    onValueChange(
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    );
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex min-w-0 items-center gap-1">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                aria-label={ariaLabel}
                className="h-10 min-w-40 justify-between gap-3 font-normal"
                variant="outline"
              />
            }
          >
            <span
              className={
                selectedNames.length
                  ? "truncate"
                  : "truncate text-muted-foreground"
              }
            >
              {label}
            </span>
            <ChevronDown aria-hidden="true" className="text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-1">
            {categories.length ? (
              <div className="max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                    key={category.id}
                  >
                    <Checkbox
                      checked={values.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    >
                      <Check aria-hidden="true" className="size-3" />
                    </Checkbox>
                    <span className="min-w-0 flex-1 truncate">
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Nenhuma categoria disponível.
              </p>
            )}
          </PopoverContent>
        </Popover>
        {values.length && !showSelectedBadges ? (
          <Button
            aria-label="Limpar filtro de categorias"
            onClick={() => onValueChange([])}
            size="icon-sm"
            title="Limpar filtro de categorias"
            variant="ghost"
          >
            <X aria-hidden="true" className="text-muted-foreground" />
          </Button>
        ) : null}
      </div>
      {showSelectedBadges && selectedCategories.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((category) => (
            <Badge
              className="h-7 gap-1.5 pr-1"
              key={category.id}
              variant="secondary"
            >
              {category.name}
              <button
                aria-label={`Remover categoria ${category.name}`}
                className="grid size-4 place-items-center rounded-full hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => toggleCategory(category.id)}
                type="button"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
