import { useEffect, useRef, useState } from "react";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface RowActionsMenuProps {
  editTo: string;
  onDelete: () => void;
  viewTo: string;
}

export function RowActionsMenu({
  editTo,
  onDelete,
  viewTo,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>(
    [],
  );

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Ações do produto"
        ref={triggerRef}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => itemRefs.current[0]?.focus());
          }
        }}
        size="icon-sm"
        variant="ghost"
      >
        <Ellipsis />
      </Button>
      {open ? (
        <div
          aria-label="Ações do produto"
          className="absolute top-full right-0 z-30 mt-1 w-36 rounded-lg border border-border bg-popover p-1 text-left shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150"
          role="menu"
          onKeyDown={(event) => {
            const items = itemRefs.current.filter(Boolean);
            const current = items.findIndex(
              (item) => item === document.activeElement,
            );
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu(true);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              items[
                (current + direction + items.length) % items.length
              ]?.focus();
            }
          }}
        >
          <Link
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
            onClick={(event) => event.stopPropagation()}
            role="menuitem"
            ref={(element) => {
              itemRefs.current[0] = element;
            }}
            to={viewTo}
          >
            <Eye className="size-4" />
            Ver
          </Link>
          <Link
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
            onClick={(event) => event.stopPropagation()}
            role="menuitem"
            ref={(element) => {
              itemRefs.current[1] = element;
            }}
            to={editTo}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
          <button
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive hover:bg-error"
            onClick={(event) => {
              event.stopPropagation();
              setConfirming(true);
              setOpen(false);
            }}
            role="menuitem"
            ref={(element) => {
              itemRefs.current[2] = element;
            }}
            type="button"
          >
            <Trash2 className="size-4" />
            Excluir
          </button>
        </div>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          confirmLabel="Excluir"
          description="Esta ação removerá o registro desta sessão de demonstração."
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            onDelete();
            setConfirming(false);
          }}
          title="Excluir produto?"
        />
      ) : null}
    </div>
  );
}
