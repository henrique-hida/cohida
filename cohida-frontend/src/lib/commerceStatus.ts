export type CommerceStatusBadgeVariant =
  "destructive" | "info" | "success" | "warning";

const statuses: Record<
  string,
  { label: string; variant: CommerceStatusBadgeVariant }
> = {
  APROVADA: { label: "Aprovada", variant: "success" },
  EM_ABERTO: { label: "Em aberto", variant: "warning" },
  EM_PROCESSAMENTO: { label: "Em processamento", variant: "warning" },
  EM_TRANSITO: { label: "Em trânsito", variant: "info" },
  ENTREGUE: { label: "Entregue", variant: "success" },
  PAGAMENTO_REALIZADO: { label: "Pagamento realizado", variant: "success" },
  REPROVADA: { label: "Reprovada", variant: "destructive" },
  EM_TROCA: { label: "Em troca", variant: "warning" },
  TROCA_AUTORIZADA: { label: "Troca autorizada", variant: "info" },
  TROCA_NEGADA: { label: "Troca negada", variant: "destructive" },
  TROCADO: { label: "Trocado", variant: "success" },
};

export function commerceStatus(status: string) {
  return (
    statuses[status] ?? {
      label: status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (character) => character.toUpperCase()),
      variant: "info" as const,
    }
  );
}
