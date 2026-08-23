import { Check } from "lucide-react";

interface StatusTimelineProps {
  currentStatus: string;
  steps: readonly string[];
}

export function StatusTimeline({ currentStatus, steps }: StatusTimelineProps) {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <ol className="space-y-4">
      {steps.map((status, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;

        return (
          <li className="relative flex gap-3 last:pb-0" key={status}>
            <span
              className={`z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${complete || current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {complete ? <Check className="size-3.5" /> : index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span
                className={`absolute top-7 left-3.5 h-5 w-px ${index < currentIndex ? "bg-primary" : "bg-border"}`}
              />
            ) : null}
            <div className="pt-0.5">
              <p
                className={
                  current ? "text-sm font-semibold" : "text-sm font-medium"
                }
              >
                {status}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {current
                  ? "Status atual do pedido"
                  : complete
                    ? "Concluído"
                    : "Aguardando"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
