import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstItem = (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  return (
    <nav
      aria-label="Paginação da lista"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm"
    >
      <span className="text-muted-foreground">
        {firstItem}–{lastItem} de {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span
          aria-live="polite"
          className="min-w-16 text-center text-muted-foreground"
        >
          {safePage} / {totalPages}
        </span>
        <Button
          aria-label="Próxima página"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
