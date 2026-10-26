import {
  CreditCard,
  MapPin,
  Package,
  Repeat2,
  Ticket,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type CustomerAccountSection =
  "addresses" | "cards" | "coupons" | "exchanges" | "orders" | "profile";

const sections: {
  icon: typeof UserRound;
  id: CustomerAccountSection;
  label: string;
}[] = [
  { icon: UserRound, id: "profile", label: "Dados pessoais" },
  { icon: MapPin, id: "addresses", label: "Endereços" },
  { icon: CreditCard, id: "cards", label: "Cartões" },
  { icon: Package, id: "orders", label: "Meus pedidos" },
  { icon: Ticket, id: "coupons", label: "Meus cupons" },
  { icon: Repeat2, id: "exchanges", label: "Trocas e devoluções" },
];

interface CustomerAccountSidebarProps {
  activeSection: CustomerAccountSection;
  onSectionChange: (section: CustomerAccountSection) => void;
}

export function CustomerAccountSidebar({
  activeSection,
  onSectionChange,
}: CustomerAccountSidebarProps) {
  return (
    <aside
      aria-label="Navegação da conta"
      className="grid h-fit gap-1 rounded-xl border border-border bg-card p-2"
    >
      {sections.map(({ icon: Icon, id, label }) => {
        const isActive = activeSection === id;
        return (
          <Button
            aria-pressed={isActive}
            className="justify-start"
            key={id}
            onClick={() => onSectionChange(id)}
            variant={isActive ? "secondary" : "ghost"}
          >
            <Icon />
            {label}
          </Button>
        );
      })}
    </aside>
  );
}
